#!/usr/bin/env node

/**
 * Build script: generates zvec vector index directly from content markdown files
 * using @antv/context for embedding and store management.
 *
 * No index.json intermediate step required — context.load() reads markdown
 * frontmatter directly and stores all metadata in zvec fields.
 */

import fs from 'fs';
import path from 'path';
import { Context } from '@antv/context';
import type { ContextOptions } from '@antv/context';
import { synonymRecord } from '../core/synonyms';

const rootArg = process.argv.find((a) => a.startsWith('--root='));
const PKG_ROOT = rootArg
  ? path.resolve(rootArg.slice('--root='.length))
  : path.resolve(__dirname, '../..');
const INDEX_DIR = path.join(PKG_ROOT, 'src', 'index');
const CONTENT_DIR = path.join(PKG_ROOT, 'src', 'content');

async function build(): Promise<void> {
  console.log('Building zvec vector indexes...\n');

  // Discover libraries from content directory subdirectories
  const libEntries = fs.existsSync(CONTENT_DIR)
    ? fs
        .readdirSync(CONTENT_DIR, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  if (libEntries.length === 0) {
    console.log(`No library directories found in ${CONTENT_DIR}`);
    return;
  }

  // Delete existing zvec files
  for (const entry of libEntries) {
    for (const suffix of ['', '.simple']) {
      const zvecPath = path.join(INDEX_DIR, `${entry.name}.zvec${suffix}`);
      if (fs.existsSync(zvecPath)) {
        fs.rmSync(zvecPath, { recursive: true, force: true });
      }
    }
  }

  const options: ContextOptions = {
    vectorsDir: INDEX_DIR,
    basePath: PKG_ROOT,
    queryExpansion: { synonyms: synonymRecord },
    ftsFields: ['content']
  };

  const ctx = await Context.create(options);
  console.log(
    `Embedder: @antv/context (${ctx.embedderInfo.dimensions}d)\n`
  );

  for (const entry of libEntries) {
    const library = entry.name;
    const contentPattern = path.join(CONTENT_DIR, library, '**/*.md');
    console.log(`  ${library.toUpperCase()}: Loading via context...`);
    await ctx.load(library, contentPattern);
    console.log(`  ${library.toUpperCase()}: Done.\n`);
  }

  await ctx.close();
  console.log('Done.');
}

build().catch((err) => {
  console.error('zvec build failed:', err);
  process.exit(1);
});
