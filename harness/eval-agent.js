/**
 * Eval Agent
 *
 * Responsibility: Run a single evaluation pass by invoking the eval CLI.
 * Returns the path to the newly created result file.
 *
 * Usage:
 *   const evalAgent = require('./harness/eval-agent');
 *   const resultPath = await evalAgent.run({ sample: 10, retrieval: 'tool-call' });
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const MAIN_ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Run an evaluation pass.
 *
 * @param {object} opts
 * @param {number} [opts.sample]      - number of cases to sample (ignored when full or ids is set)
 * @param {boolean} [opts.full]       - run full dataset (overrides sample)
 * @param {string} opts.retrieval     - retrieval strategy ('tool-call' | 'bm25' | 'context7')
 * @param {string} [opts.dataset]     - dataset filename (default: from library config)
 * @param {number} [opts.concurrency] - number of parallel eval workers
 * @param {string[]} [opts.ids]       - specific case IDs to test (post-optimization targeted re-test)
 * @param {string} [opts.rootDir]     - project root to use (worktree path when in worktree mode)
 * @returns {string} path to the result JSON file
 */
function run({ sample, full, retrieval, dataset, concurrency, ids, rootDir }) {
  // Use provided rootDir (worktree) or fall back to the main repo root.
  const effectiveRoot = rootDir || MAIN_ROOT_DIR;
  const resultDir = path.join(effectiveRoot, 'eval', 'result');

  if (!fs.existsSync(resultDir)) {
    fs.mkdirSync(resultDir, { recursive: true });
  }

  const argv = [
    // Always resolve the CLI script from the main repo (eval-cli has no worktree copy).
    path.join(MAIN_ROOT_DIR, 'eval', 'eval-cli', 'index.js'),
    'eval',
    `--retrieval=${retrieval}`
  ];
  if (full) {
    argv.push('--full');
  } else if (ids && ids.length > 0) {
    argv.push(`--ids=${ids.join(',')}`);
  } else {
    argv.push(`--sample=${sample}`);
  }
  if (dataset) argv.push(`--dataset=${dataset}`);
  if (concurrency) argv.push(`--concurrency=${concurrency}`);

  console.log(`\n$ node ${argv.join(' ')} (root=${effectiveRoot})`);
  const result = spawnSync('node', argv, {
    cwd: effectiveRoot,
    stdio: ['inherit', 'inherit', 'pipe'],
    shell: false,
    // Propagate the active root so eval-manager resolves skills from the worktree.
    env: { ...process.env, HARNESS_ROOT_DIR: effectiveRoot }
  });

  // Forward stderr to the terminal (minus the marker line which is ours to consume).
  const stderrOutput = result.stderr?.toString() || '';
  const stderrLines = stderrOutput.split('\n');
  const markerLine = stderrLines.find((l) => l.startsWith('EVAL_RESULT_PATH='));
  const userStderr = stderrLines.filter((l) => !l.startsWith('EVAL_RESULT_PATH=')).join('\n');
  if (userStderr.trim()) process.stderr.write(userStderr + '\n');

  if (result.status !== 0) {
    throw new Error(`Eval process exited with code ${result.status}`);
  }

  if (markerLine) {
    return markerLine.slice('EVAL_RESULT_PATH='.length).trim();
  }

  throw new Error(
    'Eval process did not report EVAL_RESULT_PATH — eval-cli may have crashed before completion'
  );
}

module.exports = { run };
