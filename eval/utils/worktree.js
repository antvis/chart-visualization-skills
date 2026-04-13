/**
 * Git Worktree Manager
 *
 * Creates an isolated git worktree for the validator loop so that
 * skill file modifications don't pollute the main working tree.
 *
 * Lifecycle:
 *   1. create()  — git worktree add + new branch
 *   2. commit()  — git add + commit inside worktree (called each iteration)
 *   3. finish()  — print branch name and next-step hint
 *   4. cleanup() — git worktree remove --force (on error / SIGINT)
 */

'use strict';

const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');

/**
 * @typedef {object} WorktreeHandle
 * @property {string} worktreePath  - absolute path to the worktree directory
 * @property {string} branch        - branch name created for this run
 * @property {Function} commit      - (message: string) => void
 * @property {Function} finish      - () => void  — print success summary
 * @property {Function} cleanup     - () => void  — force-remove worktree
 */

/**
 * Create a git worktree for an isolated validator run.
 *
 * @param {object} opts
 * @param {string} opts.rootDir    - project root (must be a git repo)
 * @param {string} opts.libraryId  - used to name the branch, e.g. "g2"
 * @returns {WorktreeHandle}
 */
function create({ rootDir, libraryId }) {
  // Resolve the git root (handles the case where rootDir is a subdirectory)
  let gitRoot;
  try {
    gitRoot = execFileSync(
      'git',
      ['-C', rootDir, 'rev-parse', '--show-toplevel'],
      {
        encoding: 'utf-8'
      }
    ).trim();
  } catch {
    throw new Error('Not a git repository: ' + rootDir);
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;
  const branch = `validator/${libraryId}-${timestamp}`;
  const worktreePath = path.join(
    os.tmpdir(),
    `cv-skills-${libraryId}-${timestamp}`
  );

  // Capture the base branch before creating the worktree
  let baseBranch;
  try {
    baseBranch = execFileSync('git', ['-C', gitRoot, 'rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf-8'
    }).trim();
  } catch {
    baseBranch = 'HEAD';
  }

  console.log(`\n[worktree] Creating branch: ${branch}`);
  console.log(`[worktree] Path: ${worktreePath}`);

  execFileSync(
    'git',
    ['-C', gitRoot, 'worktree', 'add', '-b', branch, worktreePath],
    {
      stdio: 'inherit'
    }
  );

  /**
   * Stage all changes inside the worktree and create a commit.
   * Safe to call even when there are no changes (no-op in that case).
   *
   * @param {string} message
   */
  function commit(message) {
    try {
      execFileSync('git', ['-C', worktreePath, 'add', '-A'], {
        stdio: 'inherit'
      });
      // Check if there is anything to commit
      const status = execFileSync(
        'git',
        ['-C', worktreePath, 'status', '--porcelain'],
        {
          encoding: 'utf-8'
        }
      ).trim();
      if (!status) return false; // nothing changed
      execFileSync('git', ['-C', worktreePath, 'commit', '-m', message], {
        stdio: 'inherit'
      });
      return true;
    } catch (err) {
      console.warn(`[worktree] commit warning: ${err.message}`);
      return false;
    }
  }

  /**
   * Print a summary after a successful validator run.
   */
  function finish() {
    console.log('\n' + '='.repeat(60));
    console.log('  Worktree branch ready for review:');
    console.log(`    ${branch}`);
    console.log('');
    console.log('  Next steps:');
    console.log(`    git diff ${baseBranch}..${branch}        # review changes`);
    console.log(`    git merge ${branch}              # accept all changes`);
    console.log(`    git worktree remove ${worktreePath}  # clean up`);
    console.log('='.repeat(60));
  }

  /**
   * Force-remove the worktree (called on error or SIGINT).
   */
  function cleanup() {
    try {
      execFileSync(
        'git',
        ['-C', gitRoot, 'worktree', 'remove', '--force', worktreePath],
        {
          stdio: 'inherit'
        }
      );
      // Also delete the branch so the repo stays tidy
      execFileSync('git', ['-C', gitRoot, 'branch', '-D', branch], {
        stdio: 'pipe'
      });
      console.log(`[worktree] Cleaned up: ${worktreePath}`);
    } catch (err) {
      console.warn(`[worktree] cleanup warning: ${err.message}`);
    }
  }

  return { worktreePath, branch, commit, finish, cleanup };
}

module.exports = { create };
