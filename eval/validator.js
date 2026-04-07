#!/usr/bin/env node
/**
 * AntV Skills Validator
 *
 * Orchestrates the iterative skill optimization loop:
 *   eval → render test → analyze errors → optimize skills → rebuild index → repeat
 *
 * Stops after MAX_PASSES consecutive clean evaluations.
 *
 * Usage:
 *   node eval/validator.js
 *   node eval/validator.js --library=g2 --sample=10 --retrieval=bm25
 *   node eval/validator.js --passes=3 --max-iterations=20
 *   node eval/validator.js --dry-run              # log errors only, skip optimization
 *   node eval/validator.js --dry-run --log=my.log # custom log file path
 *
 * Agent responsibilities:
 *   eval-agent     — invoke CLI eval, return result file path
 *   render-agent   — headless-browser render test, return error cases
 *   analyze-agent  — attribute errors to skill files
 *   optimize-agent — LLM rewrites skill docs to fix errors
 *   index-agent    — rebuild BM25 skill index
 */

require('dotenv').config();

const path = require('path');
const { parseArgs } = require('./utils/eval-utils');
const { detectProviderFromModel } = require('./utils/ai-sdk');
const { getLibraryConfig } = require('./harness/config');
const evalAgent = require('./harness/eval-agent');
const renderAgent = require('./harness/render-agent');
const analyzeAgent = require('./harness/analyze-agent');
const optimizeAgent = require('./harness/optimize-agent');
const indexAgent = require('./harness/index-agent');
const { closeBrowser } = require('./utils/render-tester');

const ROOT_DIR = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT_DIR, 'skills');

// ── Config ────────────────────────────────────────────────────────────────────

const argv = parseArgs(process.argv);

const LIBRARY_ID =
  process.argv.find((a) => a.startsWith('--library='))?.split('=')[1] ||
  process.env.LOOP_LIBRARY ||
  'g2';

const SAMPLE = parseInt(argv.sample || process.env.LOOP_SAMPLE || '10');
const RETRIEVAL =
  process.argv.find((a) => a.startsWith('--retrieval='))?.split('=')[1] ||
  process.env.LOOP_RETRIEVAL ||
  'tool-call';
const MAX_PASSES = parseInt(
  process.argv.find((a) => a.startsWith('--passes='))?.split('=')[1] || '3'
);
const MAX_ITERATIONS = parseInt(
  process.argv.find((a) => a.startsWith('--max-iterations='))?.split('=')[1] ||
    '20'
);
const MODEL = process.env.AI_MODEL || 'qwen3-coder-480b-a35b-instruct';
const PROVIDER = detectProviderFromModel(MODEL);

const DRY_RUN = process.argv.includes('--dry-run');
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = (() => {
  const custom = process.argv
    .find((a) => a.startsWith('--log='))
    ?.split('=')[1];
  if (custom)
    return path.isAbsolute(custom) ? custom : path.join(process.cwd(), custom);
  const dateStr = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `validator-${dateStr}.log`);
})();

// ── Main loop ─────────────────────────────────────────────────────────────────

async function main() {
  // Validate library config early
  const libConfig = getLibraryConfig(LIBRARY_ID);

  console.log('='.repeat(60));
  console.log('  AntV Skills Validator');
  console.log('='.repeat(60));
  console.log(`  Library:        ${libConfig.friendlyName} (${LIBRARY_ID})`);
  console.log(`  Sample:         ${SAMPLE}`);
  console.log(`  Retrieval:      ${RETRIEVAL}`);
  console.log(`  Provider/Model: ${PROVIDER} / ${MODEL}`);
  console.log(`  Target passes:  ${MAX_PASSES}`);
  console.log(`  Max iterations: ${MAX_ITERATIONS}`);
  if (DRY_RUN) console.log(`  Mode:           dry-run (log: ${LOG_FILE})`);
  console.log('='.repeat(60));

  let consecutivePasses = 0;
  let iteration = 0;

  while (consecutivePasses < MAX_PASSES) {
    if (iteration >= MAX_ITERATIONS) {
      console.log(`\nReached max iterations (${MAX_ITERATIONS}). Stopping.`);
      process.exit(1);
    }

    iteration++;
    console.log(`\n${'─'.repeat(60)}`);
    console.log(
      `Iteration ${iteration}  |  Consecutive passes: ${consecutivePasses}/${MAX_PASSES}`
    );
    console.log('─'.repeat(60));

    // ── Step 1: Run eval ───────────────────────────────────────────────────────
    let resultPath;
    try {
      resultPath = evalAgent.run({
        sample: SAMPLE,
        retrieval: RETRIEVAL,
        dataset: libConfig.defaultDataset
      });
    } catch (err) {
      console.error(`Eval failed: ${err.message}`);
      process.exit(1);
    }

    // ── Step 2: Render test every generated code ──────────────────────────────
    const errorCases = await renderAgent.run(resultPath, { concurrency: 5 });

    if (errorCases.length === 0) {
      consecutivePasses++;
      console.log(`Clean pass (${consecutivePasses}/${MAX_PASSES})`);
      continue;
    }

    consecutivePasses = 0;

    // ── Step 3: Attribute errors to skill files ────────────────────────────────
    const skillToErrors = analyzeAgent.run(errorCases, {
      rootDir: ROOT_DIR,
      skillsDir: SKILLS_DIR
    });

    if (skillToErrors.size === 0) {
      console.log(
        '\nNo skills to optimize. Counting as pass to avoid infinite loop.'
      );
      consecutivePasses++;
      continue;
    }

    // ── Step 4: Optimize skills (or log in dry-run) ───────────────────────────
    await optimizeAgent.run(skillToErrors, {
      provider: PROVIDER,
      model: MODEL,
      rootDir: ROOT_DIR,
      dryRun: DRY_RUN,
      logFile: LOG_FILE,
      iteration,
      allErrorCases: errorCases
    });

    if (DRY_RUN) {
      console.log('[dry-run] Stopping after first failure.');
      break;
    }

    // ── Step 5: Rebuild index ─────────────────────────────────────────────────
    indexAgent.run({ buildCmd: libConfig.buildCmd, cwd: ROOT_DIR });
  }

  console.log('\n' + '='.repeat(60));
  console.log(`  Done: ${MAX_PASSES} consecutive clean evaluations.`);
  console.log('='.repeat(60));
}

main()
  .catch((err) => {
    console.error('Fatal:', err.message);
    process.exit(1);
  })
  .finally(() => closeBrowser());
