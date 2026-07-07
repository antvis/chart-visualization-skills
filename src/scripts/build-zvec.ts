#!/usr/bin/env node

/**
 * Build script: generates zvec vector index from doc index JSON files
 * using @antv/context for embedding and store management.
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

async function build(): Promise<void> {
  console.log('Building zvec vector indexes...\n');

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

  // Delete existing zvec files
  for (const indexFile of indexFiles) {
    const library = indexFile.replace('.index.json', '');
    for (const suffix of ['', '.simple']) {
      const zvecPath = path.join(INDEX_DIR, `${library}.zvec${suffix}`);
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
    `Embedder: ${ctx.embedderInfo.kind} (${ctx.embedderInfo.dimensions}d)\n`
  );

  for (const indexFile of indexFiles) {
    const library = indexFile.replace('.index.json', '');
    const contentPattern = path.join(
      PKG_ROOT,
      'src',
      'content',
      library,
      '**/*.md'
    );
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
