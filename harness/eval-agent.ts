/**
 * Eval Agent
 *
 * Responsibility: Run a single evaluation pass by invoking the eval CLI.
 * Returns the path to the newly created result file.
 */

import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAIN_ROOT_DIR = path.resolve(__dirname, '..');

export interface EvalAgentOptions {
  sample?: number;
  full?: boolean;
  retrieval: string;
  dataset?: string;
  concurrency?: number;
  ids?: string[];
  rootDir?: string;
}

export function run({ sample, full, retrieval, dataset, concurrency, ids, rootDir }: EvalAgentOptions): string {
  const effectiveRoot = rootDir || MAIN_ROOT_DIR;
  const resultDir = path.join(effectiveRoot, 'eval', 'result');

  if (!fs.existsSync(resultDir)) {
    fs.mkdirSync(resultDir, { recursive: true });
  }

  const argv = [
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
    env: { ...process.env, HARNESS_ROOT_DIR: effectiveRoot }
  });

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
