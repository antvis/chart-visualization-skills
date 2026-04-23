/**
 * Index Agent
 *
 * Responsibility: Rebuild the skill search index after skill files are modified.
 */

import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAIN_PKG_ROOT = path.resolve(__dirname, '..');
const BUILD_SCRIPT = path.join(MAIN_PKG_ROOT, 'dist', 'scripts', 'build.js');

export interface IndexAgentOptions {
  libraryId: string;
  rootDir: string;
}

export function run({ libraryId: _libraryId, rootDir }: IndexAgentOptions): void {
  if (!fs.existsSync(BUILD_SCRIPT)) {
    console.log('\n[index] dist/scripts/build.js not found — running npm run build first...');
    const build = spawnSync('npm', ['run', 'build'], {
      cwd: MAIN_PKG_ROOT,
      stdio: 'inherit',
      shell: false,
    });
    if (build.status !== 0) {
      throw new Error(
        `TypeScript build failed (exit ${build.status}). Run "npm run build" manually and retry.`
      );
    }
  }

  const args = [BUILD_SCRIPT, `--root=${rootDir}`];
  console.log('\nRebuilding index...');
  console.log(`$ node ${args.join(' ')}`);
  const result = spawnSync('node', args, { stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    throw new Error(`Index build exited with code ${result.status}`);
  }
}
