#!/usr/bin/env node

/**
 * Build script: generates zvec vector index from doc index JSON files.
 *
 * Run this after `build:index:json` (or rely on `build:index` which chains both).
 *
 * Usage:
 *   tsx src/scripts/build-zvec.ts              # default
 *   tsx src/scripts/build-zvec.ts --root=...   # override project root
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Doc, DocIndex } from '../core/types';
import { getEmbedder, SimpleEmbedder } from '../core/retrieval/embedder';
import type { Embedder } from '../core/retrieval/embedder';
import { createZvecStore, isZvecAvailable } from '../core/retrieval/zvec-store';
import type { IZvecStore } from '../core/retrieval/zvec-store';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const rootArg = process.argv.find((a) => a.startsWith('--root='));
const PKG_ROOT = rootArg
  ? path.resolve(rootArg.slice('--root='.length))
  : path.resolve(__dirname, '../..');
const INDEX_DIR = path.join(PKG_ROOT, 'src', 'index');

// ---------------------------------------------------------------------------
// Constrain embedding text to ~500 chars of body content to keep vectors
// focused on the document's topic rather than full implementation details.
// ---------------------------------------------------------------------------
const MAX_EMBED_CHARS = 500;

// Truncate content stored in zvec fields for FTS (keep first 3000 chars).
const MAX_FIELD_CONTENT_CHARS = 3000;

function hashContent(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

// ---------------------------------------------------------------------------
// Build embedding text for a single skill document.
// Title is repeated 5x to amplify its signal in the embedding.
// Code blocks are excluded to focus the vector on conceptual content.
// ---------------------------------------------------------------------------
function buildEmbeddingText(doc: Doc): string {
  const parts: string[] = [];

  // Title x5 — strongest signal, title carries the most discriminative tokens
  const title = doc.title || '';
  if (title) parts.push(title, title, title, title, title);

  if (doc.description) parts.push(doc.description);

  if (doc.tags && doc.tags.length > 0) {
    parts.push(doc.tags.join(' '));
  }

  // Use cases and anti-patterns carry high-signal domain vocabulary
  if (doc.use_cases && doc.use_cases.length > 0) {
    parts.push(doc.use_cases.join(' '));
  }
  if (doc.anti_patterns && doc.anti_patterns.length > 0) {
    parts.push(doc.anti_patterns.join(' '));
  }

  if (doc.content) {
    // Strip code blocks and table rows — keep section headings,
    // which carry conceptual framing ("核心概念", "常见错误与修正", etc.)
    const cleanText = doc.content
      .replace(/```[\s\S]*?```/g, ' ')        // remove all fenced code blocks
      .replace(/\|.+\|/g, ' ')                  // remove table rows (keep heading text short)
      .replace(/\n{2,}/g, '\n')                 // collapse whitespace
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/^#{1,6}\s+/gm, '')             // strip markdown heading markers (##) but keep text
      .trim();
    const snippet =
      cleanText.length > MAX_EMBED_CHARS
        ? cleanText.slice(0, MAX_EMBED_CHARS)
        : cleanText;
    parts.push(snippet);
  }

  return parts.join('  ');
}

// ---------------------------------------------------------------------------
// Build zvec fields record for a skill document.
// Mirrors the design doc schema (Section 3.1.4):
//   title*, description*, tags*, content*, use_cases*, anti_patterns*
//   (starred = searchable via FTS when zvec native FTS is available)
//   plus bookkeeping: library, category, path, content_hash, source,
//   expires_at.
// ---------------------------------------------------------------------------
function buildZvecFields(doc: Doc): Record<string, string | number> {
  const content =
    (doc.content || '').length > MAX_FIELD_CONTENT_CHARS
      ? doc.content!.slice(0, MAX_FIELD_CONTENT_CHARS)
      : doc.content || '';

  return {
    title: doc.title || '',
    description: doc.description || '',
    library: doc.library || '',
    category: doc.category || '',
    tags: (doc.tags || []).join(' '),
    content,
    use_cases: (doc.use_cases || []).join(' '),
    anti_patterns: (doc.anti_patterns || []).join(' '),
    path: doc.path || '',
    content_hash: hashContent(doc.content || ''),
    source: 'static',
    expires_at: 0
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function build(): Promise<void> {
  const zvecNativeAvailable = isZvecAvailable();

  console.log('Building zvec vector indexes...');
  if (!zvecNativeAvailable) {
    console.log(
      '⚠️  @zvec/zvec native bindings are NOT available on this platform.\n' +
        '   The zvec index will be built in-memory only and will NOT be\n' +
        '   included in the dist/ package.\n' +
        '\n' +
        '   Supported platforms: darwin-arm64 (Apple Silicon), linux-x64, win32-x64.\n' +
        '   Current platform:     ' +
        process.platform +
        '-' +
        process.arch +
        '\n' +
        '\n' +
        '   To publish a package with zvec indexes, run this build on one of\n' +
        '   the supported platforms above. On unsupported platforms the runtime\n' +
        '   will automatically fall back to BM25 keyword search.\n'
    );
    return;
  }
  console.log('');

  // Collect index JSON files
  const indexFiles = fs.existsSync(INDEX_DIR)
    ? fs
        .readdirSync(INDEX_DIR)
        .filter((f) => f.endsWith('.index.json'))
        .sort()
    : [];

  if (indexFiles.length === 0) {
    console.log('No index JSON files found. Run "build:index:json" first.');
    return;
  }

  // ── Build helper ──────────────────────────────────────────────────────────
  async function buildIndex(
    embedder: Embedder,
    suffix: string,
  ): Promise<void> {
    for (const indexFile of indexFiles) {
      const library = indexFile.replace('.index.json', '');
      const indexPath = path.join(INDEX_DIR, indexFile);

      console.log(`  ${library.toUpperCase()}: Loading index...`);
      const index: DocIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      const { docs } = index;

      const texts = docs.map(buildEmbeddingText);
      const vectors = embedder.constructor.name === 'SimpleEmbedder'
        ? texts.map((t) => (embedder as SimpleEmbedder).embedSync(t))
        : await embedder.embedBatch(texts);

      console.log(
        `    Embedded ${vectors.length} texts → ${vectors[0]?.length ?? 0}d`
      );

      const zvecPath = path.join(INDEX_DIR, `${library}.zvec${suffix}`);
      if (fs.existsSync(zvecPath)) {
        fs.rmSync(zvecPath, { recursive: true, force: true });
      }

      const store: IZvecStore = await createZvecStore(
        zvecPath,
        embedder.dimensions
      );

      const batchSize = 100;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);
        const batchVectors = vectors.slice(i, i + batchSize);
        const items = batch.map((doc, idx) => ({
          id: doc.id,
          vector: batchVectors[idx],
          fields: buildZvecFields(doc)
        }));
        await store.insert(items);
      }

      await store.close();

      if (fs.existsSync(zvecPath)) {
        const files = fs.readdirSync(zvecPath).length;
        console.log(`    ${library}.zvec${suffix} written (${files} files).`);
      } else {
        console.error(`    ERROR: ${library}.zvec${suffix} not persisted.`);
        process.exit(1);
      }
    }
  }

  // ── Pass 1: primary embedder (TransformersEmbedder or SimpleEmbedder) ─────
  const embedder = await getEmbedder();
  console.log(
    `Pass 1: ${embedder.constructor.name} (${embedder.dimensions}d)\n`
  );
  await buildIndex(embedder, '');

  // ── Pass 2: SimpleEmbedder fallback (only when Pass 1 used Transformers) ──
  if (embedder.constructor.name === 'TransformersEmbedder') {
    const simpleEmbedder = new SimpleEmbedder();
    console.log(`\nPass 2: SimpleEmbedder (${simpleEmbedder.dimensions}d) fallback index\n`);
    await buildIndex(simpleEmbedder, '.simple');
  }

  console.log('\nDone.');
}

build().catch((err) => {
  console.error('zvec build failed:', err);
  process.exit(1);
});
