/**
 * Load evaluation cases from a dataset JSON file.
 *
 * Dataset entries have { query, code } and no id — one is
 * generated as `<library>-<index>` when missing.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CASES_DIR, DEFAULT_DATASETS } from './const.mjs';

export async function loadCases(options) {
  const { library, dataset, sample, full, ids } = options;
  const file = dataset ?? DEFAULT_DATASETS[library];
  if (!file) throw new Error(`Unknown library: ${library}`);

  const raw = JSON.parse(await fs.readFile(path.join(CASES_DIR, file), 'utf-8'));

  let cases = raw.map((c, i) => ({
    id: c.id ?? `${library}-${i}`,
    library,
    query: c.query,
    code: c.code,
  }));

  if (ids && ids.length > 0) {
    const idSet = new Set(ids);
    cases = cases.filter((c) => idSet.has(c.id));
  } else if (sample && !full) {
    cases = cases.sort(() => Math.random() - 0.5).slice(0, sample);
  }

  return cases;
}
