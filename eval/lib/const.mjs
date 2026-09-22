/**
 * Shared path constants.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const EVAL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT_DIR = path.resolve(EVAL_DIR, '..');
export const CASES_DIR = path.join(EVAL_DIR, 'cases');
export const RESULTS_DIR = path.join(EVAL_DIR, 'results');

export const DEFAULT_DATASETS = {
  g2: 'g2-dataset-174.json',
  g6: 'g6-dataset-100.json',
  x6: 'x6-dataset-136.json',
};
