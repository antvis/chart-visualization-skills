/**
 * Git Worktree Manager
 *
 * Creates an isolated git worktree for the validator loop so that
 * skill file modifications don't pollute the main working tree.
 */

import { execFileSync } from 'child_process';
import os from 'os';
import path from 'path';

export interface WorktreeHandle {
  worktreePath: string;
  branch: string;
  commit: (message: string) => boolean;
  finish: () => void;
  cleanup: () => void;
}

export function create({ rootDir, libraryId }: { rootDir: string; libraryId: string }): WorktreeHandle {
  let gitRoot: string;
  try {
    gitRoot = execFileSync('git', ['-C', rootDir, 'rev-parse', '--show-toplevel'], { encoding: 'utf-8' }).trim();
  } catch {
    throw new Error('Not a git repository: ' + rootDir);
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;
  const branch = `validator/${libraryId}-${timestamp}`;
  const worktreePath = path.join(os.tmpdir(), `cv-skills-${libraryId}-${timestamp}`);

  let baseBranch: string;
  try {
    baseBranch = execFileSync('git', ['-C', gitRoot, 'rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf-8' }).trim();
  } catch {
    baseBranch = 'HEAD';
  }

  console.log(`\n[worktree] Creating branch: ${branch}`);
  console.log(`[worktree] Path: ${worktreePath}`);
  execFileSync('git', ['-C', gitRoot, 'worktree', 'add', '-b', branch, worktreePath], { stdio: 'inherit' });

  function commit(message: string): boolean {
    try {
      execFileSync('git', ['-C', worktreePath, 'add', '-A'], { stdio: 'inherit' });
      const status = execFileSync('git', ['-C', worktreePath, 'status', '--porcelain'], { encoding: 'utf-8' }).trim();
      if (!status) return false;
      execFileSync('git', ['-C', worktreePath, 'commit', '-m', message], { stdio: 'inherit' });
      return true;
    } catch (err) {
      console.warn(`[worktree] commit warning: ${(err as Error).message}`);
      return false;
    }
  }

  function finish(): void {
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

  function cleanup(): void {
    try {
      execFileSync('git', ['-C', gitRoot, 'worktree', 'remove', '--force', worktreePath], { stdio: 'inherit' });
      execFileSync('git', ['-C', gitRoot, 'branch', '-D', branch], { stdio: 'pipe' });
      console.log(`[worktree] Cleaned up: ${worktreePath}`);
    } catch (err) {
      console.warn(`[worktree] cleanup warning: ${(err as Error).message}`);
    }
  }

  return { worktreePath, branch, commit, finish, cleanup };
}
