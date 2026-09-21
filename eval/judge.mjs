/**
 * Step 2 — judge: score each generated case against its reference code.
 *
 * Two independent tracks (kept separate, matching the original eval):
 *   - rule checks  → hasIssues / issues / warnings (hard failures)
 *   - similarity   → 0..1 hybrid score vs the reference codeString
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
import { checkCode } from './lib/check.mjs';
import { calculateSimilarity } from './lib/similarity.mjs';
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
      judged.push({ ...item, similarity: 0, hasIssues: true, issues: ['生成失败或代码为空'] });
      console.log('fail: no code');
      continue;
    }

    const check = checkCode(item.generatedCode, { library: item.library });
    const similarity = calculateSimilarity(item.generatedCode, item.expectedCode, {
      library: item.library,
    });

    judged.push({ ...item, ...check, similarity });
    console.log(
      check.hasIssues
        ? `issues=${check.issues.length} sim=${similarity.toFixed(2)}`
        : `ok sim=${similarity.toFixed(2)}`,
    );
  }

  const total = judged.length;
  const successCount = judged.filter((r) => r.hasIssues === false).length;
  const issuesCount = judged.filter((r) => r.hasIssues).length;
  const scored = judged.filter((r) => r.similarity !== undefined);
  const similarity = scored.length
    ? scored.reduce((sum, r) => sum + (r.similarity ?? 0), 0) / scored.length
    : 0;

  const summary = { totalTests: total, successCount, issuesCount, similarity };
  // Write the summary to a separate file — the per-case result file is kept.
  const summaryFile = path.join(RESULTS_DIR, `${modelName}-${data.library}-summary.json`);
  await fs.writeFile(
    summaryFile,
    JSON.stringify({ model: data.model ?? modelName, library: data.library, summary }, null, 2),
  );

  console.log('\n' + '='.repeat(50));
  console.log(`  Model:          ${data.model ?? modelName}`);
  console.log(`  Success Rate:   ${successCount}/${total}`);
  console.log(`  Avg Similarity: ${(similarity * 100).toFixed(1)}%`);
  console.log(`  Issues Count:   ${issuesCount}`);
  console.log(`  Summary →       ${summaryFile}`);
  console.log('='.repeat(50));
  if (successCount < total) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
