#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const rootArg = process.argv.find((a) => a.startsWith('--root='));
const PKG_ROOT = rootArg ? path.resolve(rootArg.slice('--root='.length)) : path.resolve(__dirname, '../..');
const SRC_INDEX_DIR = path.join(PKG_ROOT, 'src', 'index');
const DIST_INDEX_DIR = path.join(PKG_ROOT, 'dist', 'index');

if (!fs.existsSync(SRC_INDEX_DIR)) {
  throw new Error(`Source index directory not found: ${SRC_INDEX_DIR}. Run "npm run build:index" first.`);
}

try {
  fs.mkdirSync(path.dirname(DIST_INDEX_DIR), { recursive: true });
  fs.rmSync(DIST_INDEX_DIR, { recursive: true, force: true });
  fs.cpSync(SRC_INDEX_DIR, DIST_INDEX_DIR, { recursive: true });
  console.log('Copied index files to dist/index');
} catch (error) {
  const reason = error instanceof Error ? error.message : String(error);
  throw new Error(`Failed to copy index files to dist/index: ${reason}`);
}
