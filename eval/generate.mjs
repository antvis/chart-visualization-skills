/**
 * Step 1 — generate: for each case, let the agent search skill docs and write
 * chart code. Writes per-case code to results/<id>.js and a manifest to
 * results/eval-result.json (which judge.mjs reads and augments).
 *
 * Usage:
 *   node generate.mjs --model kimi|glm|deepseek [--library g2|g6|x6]
 *                     [--dataset <file>] [--sample n] [--full] [--ids a,b,c]
 */

import 'dotenv/config';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createModel, MODEL_NAMES } from './lib/llm.mjs';
import { createGenerateAgent } from './lib/generate-agent.mjs';
import { loadCases } from './lib/load-cases.mjs';
import { extractCode } from './lib/extract-code.mjs';
import { RESULTS_DIR } from './lib/const.mjs';

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      opts[key] = true;
    } else {
      opts[key] = next;
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
  const library = args.library ?? 'g2';
  const sample = args.sample ? Number(args.sample) : undefined;
  const full = Boolean(args.full);
  const ids = args.ids ? String(args.ids).split(',').map((s) => s.trim()).filter(Boolean) : undefined;

  const cases = await loadCases({
    library,
    dataset: args.dataset,
    sample: sample ?? (full || ids ? undefined : 5),
    full,
    ids,
  });

  const { model, temperature } = createModel(modelName);
  console.log(`Generating code for ${cases.length} case(s) (model=${model.modelId}, library=${library})...`);

  await fs.mkdir(RESULTS_DIR, { recursive: true });

  const results = [];
  for (const c of cases) {
    process.stdout.write(`  ${c.id} ... `);
    let generatedCode = '';
    let steps = 0;
    let error;
    try {
      const agent = createGenerateAgent({ model, temperature });
      const result = await agent.generate({
        prompt: `请根据以下描述生成代码：\n\n${c.description}`,
      });
      steps = result.steps?.length ?? 0;
      generatedCode = extractCode(result.text);
      await fs.writeFile(path.join(RESULTS_DIR, `${modelName}-${c.id}.js`), generatedCode);
      console.log(`ok (${steps} steps)`);
    } catch (err) {
      error = err.message?.slice(0, 200);
      console.log(`error: ${error}`);
    }
    results.push({
      id: c.id,
      library: c.library,
      query: c.description,
      expectedCode: c.codeString,
      generatedCode,
      steps,
      ...(error ? { error } : {}),
    });
  }

  const resultFile = path.join(RESULTS_DIR, `${modelName}-eval-result.json`);
  await fs.writeFile(
    resultFile,
    JSON.stringify({ model: model.modelId, library, results }, null, 2),
  );

  const ok = results.filter((r) => r.generatedCode).length;
  console.log(`\nGenerated ${ok}/${results.length} case(s) with code → ${resultFile}`);
  if (ok < results.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
