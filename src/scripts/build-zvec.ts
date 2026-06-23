#!/usr/bin/env node

/**
 * Build script: generates zvec vector index from skill index JSON files.
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
import type { Skill, SkillIndex } from '../core/types';
import { getEmbedder, resetEmbedder } from '../core/retrieval/embedder';
import {
  createZvecStore,
  isZvecAvailable,
} from '../core/retrieval/zvec-store';
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
// Title is repeated 3x to amplify its signal in the embedding.
// ---------------------------------------------------------------------------
function buildEmbeddingText(skill: Skill): string {
  const parts: string[] = [];

  // Title x3
  const title = skill.title || '';
  if (title) parts.push(title, title, title);

  if (skill.description) parts.push(skill.description);

  if (skill.tags && skill.tags.length > 0) {
    parts.push(skill.tags.join(' '));
  }

  if (skill.content) {
    const snippet =
      skill.content.length > MAX_EMBED_CHARS
        ? skill.content.slice(0, MAX_EMBED_CHARS)
        : skill.content;
    parts.push(snippet);
  }

  return parts.join('  ');
}

// ---------------------------------------------------------------------------
// Build zvec fields record for a skill document.
// Mirrors the design doc schema (Section 3.1.4):
//   title*, description*, tags*, content*, use_cases*, anti_patterns*
//   (starred = searchable via FTS when zvec native FTS is available)
//   plus bookkeeping: library, category, difficulty, path, content_hash, source,
//   expires_at.
// ---------------------------------------------------------------------------
function buildZvecFields(skill: Skill): Record<string, string | number> {
  const content =
    (skill.content || '').length > MAX_FIELD_CONTENT_CHARS
      ? skill.content!.slice(0, MAX_FIELD_CONTENT_CHARS)
      : skill.content || '';

  return {
    title: skill.title || '',
    description: skill.description || '',
    library: skill.library || '',
    category: skill.category || '',
    tags: (skill.tags || []).join(' '),
    difficulty: skill.difficulty || '',
    content,
    use_cases: (skill.use_cases || []).join(' '),
    anti_patterns: (skill.anti_patterns || []).join(' '),
    path: skill.path || '',
    content_hash: hashContent(skill.content || ''),
    source: 'static',
    expires_at: 0,
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
      '   Current platform:     ' + process.platform + '-' + process.arch + '\n' +
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

  // Initialise embedder (auto-selects best available)
  const embedder = await getEmbedder();
  console.log(`Embedder: ${embedder.constructor.name} (${embedder.dimensions}d)\n`);

  for (const indexFile of indexFiles) {
    const library = indexFile.replace('.index.json', '');
    const indexPath = path.join(INDEX_DIR, indexFile);

    console.log(`${library.toUpperCase()}: Loading index...`);
    const index: SkillIndex = JSON.parse(
      fs.readFileSync(indexPath, 'utf-8')
    );

    const { skills } = index;
    console.log(`  ${skills.length} documents found.`);

    // Build embedding texts
    console.log(`  Building embedding texts...`);
    const texts = skills.map(buildEmbeddingText);

    // Embed all in batch
    console.log(`  Embedding (${texts.length} texts)...`);
    const vectors = await embedder.embedBatch(texts);
    console.log(`  Got ${vectors.length} vectors (${vectors[0]?.length ?? 0}d).`);

    // Build zvec docs
    const zvecPath = path.join(INDEX_DIR, `${library}.zvec`);
    console.log(`  Writing zvec collection to ${library}.zvec/ ...`);

    // Remove old collection if present
    if (fs.existsSync(zvecPath)) {
      fs.rmSync(zvecPath, { recursive: true, force: true });
    }

    const store: IZvecStore = await createZvecStore(
      zvecPath,
      embedder.dimensions
    );

    const batchSize = 100;
    for (let i = 0; i < skills.length; i += batchSize) {
      const batch = skills.slice(i, i + batchSize);
      const batchVectors = vectors.slice(i, i + batchSize);
      const docs = batch.map((skill, idx) => ({
        id: skill.id,
        vector: batchVectors[idx],
        fields: buildZvecFields(skill),
      }));
      await store.insert(docs);
      console.log(
        `    Inserted ${Math.min(i + batchSize, skills.length)}/${skills.length}`
      );
    }

    await store.close();

    // Verify on disk
    if (fs.existsSync(zvecPath)) {
      const files = fs.readdirSync(zvecPath).length;
      console.log(`  Collection written (${files} files).\n`);
    } else {
      console.error(`  ERROR: zvec collection was not persisted to disk.\n`);
      process.exit(1);
    }
  }

  console.log('Done.');
}

build().catch((err) => {
  console.error('zvec build failed:', err);
  process.exit(1);
});
