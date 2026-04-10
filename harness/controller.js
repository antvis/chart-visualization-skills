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
 *   node harness/controller.js
 *   node harness/controller.js --library=g2 --sample=10 --retrieval=bm25
 *   node harness/controller.js --passes=3 --max-iterations=20 --concurrency=10
 *   node harness/controller.js --dry-run                      # log errors only, skip optimization
 *   node harness/controller.js --dry-run --log=my.log         # custom log file path
 *   node harness/controller.js --skip-score                   # skip VL visual scoring
 *   node harness/controller.js --score-threshold=0.7          # treat visualScore < 0.7 as failure
 *
 * Agent responsibilities:
 *   eval-agent     — invoke CLI eval, return result file path
 *   render-agent   — headless-browser render test, return error cases
 *   analyze-agent  — attribute errors to skill files
 *   optimize-agent — LLM rewrites skill docs to fix errors
 *   index-agent    — rebuild BM25 skill index
 */

require('dotenv').config({ override: true });

const path = require('path');
const { Command } = require('commander');
const { detectProviderFromModel } = require('../eval/utils/ai-sdk');
const { getLibraryConfig } = require('./config');
const evalAgent = require('./eval-agent');
const renderAgent = require('./render-agent');
const analyzeAgent = require('./analyze-agent');
const optimizeAgent = require('./optimize-agent');
const indexAgent = require('./index-agent');
const { closeBrowser } = require('../eval/utils/render-tester');
const worktreeManager = require('../eval/utils/worktree');
const logger = require('../eval/utils/logger');

const ROOT_DIR = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT_DIR, 'skills');

// ── CLI ───────────────────────────────────────────────────────────────────────

const program = new Command();
program
  .name('controller')
  .description('AntV Skills iterative validation harness')
  .option('--library <id>', 'Library id (g2 | g6)', process.env.LOOP_LIBRARY || 'g2')
  .option('--sample <n>', 'Eval sample size', (v) => parseInt(v, 10), parseInt(process.env.LOOP_SAMPLE || '10', 10))
  .option('--retrieval <strategy>', 'tool-call | bm25 | context7', process.env.LOOP_RETRIEVAL || 'tool-call')
  .option('--passes <n>', 'Consecutive clean passes required', (v) => parseInt(v, 10), 3)
  .option('--max-iterations <n>', 'Max optimization iterations', (v) => parseInt(v, 10), 20)
  .option('--concurrency <n>', 'Render test concurrency', (v) => parseInt(v, 10), parseInt(process.env.LOOP_CONCURRENCY || '5', 10))
  .option('--dry-run', 'Log errors only, skip optimization')
  .option('--no-worktree', 'Disable git worktree isolation')
  .option('--skip-score', 'Skip VL visual scoring')
  .option('--score-threshold <n>', 'Fail threshold for visual score', (v) => parseFloat(v), parseFloat(process.env.LOOP_SCORE_THRESHOLD || '0.6'))
  .option('--log <file>', 'Custom dry-run log file path')
  .parse(process.argv);

const opts = program.opts();

const LIBRARY_ID = opts.library;
const SAMPLE = opts.sample;
const RETRIEVAL = opts.retrieval;
const MAX_PASSES = opts.passes;
const MAX_ITERATIONS = opts.maxIterations;
const CONCURRENCY = opts.concurrency;
const MODEL = process.env.AI_MODEL || 'qwen3-coder-480b-a35b-instruct';
const PROVIDER = detectProviderFromModel(MODEL);
const DRY_RUN = opts.dryRun;
const NO_WORKTREE = !opts.worktree;
const SKIP_SCORE = opts.skipScore;
const SCORE_THRESHOLD = opts.scoreThreshold;

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = (() => {
  if (opts.log) {
    return path.isAbsolute(opts.log) ? opts.log : path.join(process.cwd(), opts.log);
  }
  const dateStr = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `validator-${dateStr}.log`);
})();

// ── Worktree state (module-level so .catch() can access it) ───────────────────

let worktree = null;

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
  console.log(`  Concurrency:    ${CONCURRENCY}`);
  if (DRY_RUN) console.log(`  Mode:           dry-run (log: ${LOG_FILE})`);
  if (NO_WORKTREE) console.log(`  Worktree:       disabled`);
  if (SKIP_SCORE) console.log(`  Visual score:   disabled`);
  else console.log(`  Score threshold:${SCORE_THRESHOLD}`);
  console.log('='.repeat(60));

  // ── Worktree setup ─────────────────────────────────────────────────────────
  let activeRootDir = ROOT_DIR;
  let activeSkillsDir = SKILLS_DIR;

  if (!DRY_RUN && !NO_WORKTREE) {
    worktree = worktreeManager.create({
      rootDir: ROOT_DIR,
      libraryId: LIBRARY_ID
    });
    activeRootDir = worktree.worktreePath;
    activeSkillsDir = path.join(
      worktree.worktreePath,
      path.relative(ROOT_DIR, SKILLS_DIR)
    );

    // Register cleanup on SIGINT so Ctrl-C doesn't leave a dangling worktree
    process.once('SIGINT', () => {
      console.log('\n[worktree] Interrupted — cleaning up...');
      worktree.cleanup();
      process.exit(130);
    });
  }

  let consecutivePasses = 0;
  let iteration = 0;

  while (consecutivePasses < MAX_PASSES) {
    if (iteration >= MAX_ITERATIONS) {
      console.log(`\nReached max iterations (${MAX_ITERATIONS}). Stopping.`);
      if (worktree) worktree.cleanup();
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
      if (worktree) worktree.cleanup();
      process.exit(1);
    }

    // ── Step 2: Render test every generated code ──────────────────────────────
    const errorCases = await renderAgent.run(resultPath, {
      concurrency: CONCURRENCY,
      skipScore: SKIP_SCORE,
      scoreThreshold: SCORE_THRESHOLD
    });

    if (errorCases.length === 0) {
      consecutivePasses++;
      console.log(`Clean pass (${consecutivePasses}/${MAX_PASSES})`);
      continue;
    }

    consecutivePasses = 0;

    // ── Step 3: Attribute errors to skill files ────────────────────────────────
    const { skillToErrors, orphanCases } = analyzeAgent.run(errorCases, {
      rootDir: activeRootDir,
      skillsDir: activeSkillsDir
    });

    if (skillToErrors.size === 0 && orphanCases.length === 0) {
      console.log(
        '\nNo skills to optimize. Counting as pass to avoid infinite loop.'
      );
      consecutivePasses++;
      continue;
    }

    // ── Step 4: Optimize skills (or log in dry-run) ───────────────────────────
    const skillsRefDir = path.join(activeSkillsDir, libConfig.skillsPath);
    await optimizeAgent.run(skillToErrors, {
      provider: PROVIDER,
      model: MODEL,
      rootDir: activeRootDir,
      dryRun: DRY_RUN,
      logFile: LOG_FILE,
      iteration,
      allErrorCases: errorCases,
      orphanCases,
      libraryId: LIBRARY_ID,
      skillsRefDir
    });

    if (DRY_RUN) {
      console.log('[dry-run] Stopping after first failure.');
      break;
    }

    // ── Step 4b: Commit changes to worktree branch ────────────────────────────
    if (worktree) {
      worktree.commit(
        `validator(${LIBRARY_ID}): iteration ${iteration} — optimize skills`
      );
    }

    // ── Step 5: Rebuild index via tool calls ──────────────────────────────────
    await indexAgent.run({ libraryId: LIBRARY_ID, rootDir: activeRootDir });
  }

  console.log('\n' + '='.repeat(60));
  console.log(`  Done: ${MAX_PASSES} consecutive clean evaluations.`);
  console.log('='.repeat(60));

  if (worktree) {
    worktree.finish();
  }
}

main()
  .catch((err) => {
    logger.error({ err: err.message }, 'Fatal error');
    if (worktree) {
      logger.info('Cleaning up worktree due to fatal error');
      worktree.cleanup();
    }
    process.exit(1);
  })
  .finally(async () => {
    await closeBrowser();
    process.exit(0);
  });
