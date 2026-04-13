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

const ROOT_DIR = path.resolve(__dirname, '..');
const RESULT_DIR = path.join(__dirname, '..', 'eval', 'result');

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
 * @returns {string} path to the result JSON file
 */
function run({ sample, full, retrieval, dataset, concurrency, ids }) {
  if (!fs.existsSync(RESULT_DIR)) {
    fs.mkdirSync(RESULT_DIR, { recursive: true });
  }

  const before = new Set(
    fs.existsSync(RESULT_DIR)
      ? fs.readdirSync(RESULT_DIR).filter((f) => f.endsWith('.json'))
      : []
  );

  const argv = [
    'eval/eval-cli/index.js',
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

  console.log(`\n$ node ${argv.join(' ')}`);
  const result = spawnSync('node', argv, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: false
  });
  if (result.status !== 0) {
    throw new Error(`Eval process exited with code ${result.status}`);
  }

  // Find newly created result file
  const after = fs.readdirSync(RESULT_DIR).filter((f) => f.endsWith('.json'));
  const newFiles = after.filter((f) => !before.has(f));
  if (newFiles.length > 0) {
    return path.join(RESULT_DIR, newFiles[0]);
  }

  // Fallback: most recently modified
  const sorted = after
    .map((f) => ({
      name: f,
      mtime: fs.statSync(path.join(RESULT_DIR, f)).mtimeMs
    }))
    .sort((a, b) => b.mtime - a.mtime);
  return path.join(RESULT_DIR, sorted[0].name);
}

module.exports = { run };
