/**
 * Index Agent
 *
 * Responsibility: Rebuild the skill search index after skill files are modified.
 * The build command is resolved from the library registry config.
 *
 * Usage:
 *   const indexAgent = require('./harness/index-agent');
 *   await indexAgent.run({ libraryId: 'g2', rootDir: '/path/to/project' });
 */

const { spawnSync } = require('child_process');
const path = require('path');

// Absolute path to the build script in the main repo (not the worktree).
// The script supports --root=<dir> so it can build indexes for a worktree.
const MAIN_PKG_ROOT = path.resolve(__dirname, '..');
const BUILD_SCRIPT = path.join(MAIN_PKG_ROOT, 'dist', 'scripts', 'build.js');

/**
 * Rebuild the skill index.
 *
 * @param {object} opts
 * @param {string} opts.libraryId  - library id (e.g. 'g2')
 * @param {string} opts.rootDir    - project root directory
 */
function run({ libraryId, rootDir }) {
  // Always use the main repo's compiled build script (worktrees don't have dist/).
  // Pass --root=<rootDir> so the script reads skills from and writes index to rootDir.

  if (!require('fs').existsSync(BUILD_SCRIPT)) {
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

module.exports = { run };
