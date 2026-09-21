/**
 * Step 2 — judge: score each generated case against its reference code and by
 * rendering it in a headless browser.
 *
 * Two independent tracks (kept separate):
 *   - similarity → 0..1 hybrid score vs the reference code
 *   - render     → status 'success' | 'blank' | 'error' (screenshot saved)
 *
 * Reads results/<model>-<library>-eval-result.json (full per-case detail
 * written by generate), scores each entry, and writes the summary to
 * results/<model>-<library>-summary.json. The per-case result file is kept.
 *
 * Usage:
 *   node judge.mjs --model kimi|glm|deepseek --library g2|g6|x6
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { calculateSimilarity } from './lib/similarity.mjs';
import { renderCase, closeBrowser } from './lib/render.mjs';
import { RESULTS_DIR } from './lib/const.mjs';
import { MODEL_NAMES } from './lib/llm.mjs';

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      opts[arg.slice(2)] = true;
    } else {
      opts[arg.slice(2)] = next;
      i++;
    }
  }
  return opts;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const modelName = args.model;
  if (!modelName) {
    console.error(`Missing --model. Available: ${MODEL_NAMES.join(', ')}`);
    process.exit(1);
  }
  const library = args.library;
  if (!library) {
    console.error(`Missing --library. Available: g2, g6, x6`);
    process.exit(1);
  }

  const resultFile = path.join(RESULTS_DIR, `${modelName}-${library}-eval-result.json`);
  const data = JSON.parse(await fs.readFile(resultFile, 'utf-8'));

  console.log(`Judging ${data.results.length} case(s) (model=${data.model ?? modelName})...`);

  const judged = [];
  for (const item of data.results) {
    process.stdout.write(`  ${item.id} ... `);
    if (item.error || !item.generatedCode) {
      judged.push({ ...item, similarity: 0, status: 'error', error: 'empty code' });
      console.log('fail: no code');
      continue;
    }

    const similarity = calculateSimilarity(item.generatedCode, item.expectedCode, {
      library: item.library,
    });
    // Render in a headless browser + blank detection (separate track — does
    // not affect similarity).
    const render = await renderCase(item.id, item.generatedCode);

    judged.push({ ...item, similarity, ...render });
    console.log(
      [
        `sim=${similarity.toFixed(2)}`,
        render.status === 'success' ? 'rendered' : `[${render.status}]`,
      ].join(' '),
    );
  }
  await closeBrowser();

  const total = judged.length;
  const scored = judged.filter((r) => r.similarity !== undefined);
  const similarity = scored.length
    ? scored.reduce((sum, r) => sum + (r.similarity ?? 0), 0) / scored.length
    : 0;
  // success = number of cases that render non-blank; score = success / total.
  const success = judged.filter((r) => r.status === 'success').length;
  const score = total ? success / total : 0;

  const summary = { total, success, similarity, score };
  // Failed (blank/error) cases with their render error, for troubleshooting.
  const failures = judged
    .filter((r) => r.status !== 'success')
    .map((r) => ({
      id: r.id,
      status: r.status,
      error: r.error,
      query: r.query,
    }));

  // Write the summary to a separate file — the per-case result file is kept.
  const summaryFile = path.join(RESULTS_DIR, `${modelName}-${data.library}-summary.json`);
  await fs.writeFile(
    summaryFile,
    JSON.stringify(
      {
        model: data.model ?? modelName,
        library: data.library,
        updatedAt: new Date().toISOString(),
        summary,
        failures,
      },
      null,
      2,
    ),
  );

  console.log('\n' + '='.repeat(50));
  console.log(`  Model:          ${data.model ?? modelName}`);
  console.log(`  Render Success: ${success}/${total}`);
  console.log(`  Score (render): ${(score * 100).toFixed(1)}%`);
  console.log(`  Avg Similarity: ${(similarity * 100).toFixed(1)}%`);
  console.log(`  Failures:       ${failures.length}`);
  console.log(`  Summary →       ${summaryFile}`);
  console.log('='.repeat(50));
  if (success < total) process.exitCode = 1;
}

main()
  .catch(async (err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeBrowser();
  });
