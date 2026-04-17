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
 *   node harness/controller.js --full                        # run full dataset
 *   node harness/controller.js --dry-run                     # log errors only, skip optimization
 *   node harness/controller.js --dry-run --log=my.log        # custom log file path
 *   node harness/controller.js --skip-score                  # skip VL visual scoring
 *   node harness/controller.js --score-threshold=0.7         # treat visualScore < 0.7 as failure
 *   node harness/controller.js --no-memory                   # disable cross-iteration memory
 *
 * Agent responsibilities:
 *   eval-agent     — invoke CLI eval, return result file path
 *   render-agent   — headless-browser render test, return error cases
 *   analyze-agent  — attribute errors to skill files
 *   optimize-agent — LLM rewrites skill docs to fix errors
 *   index-agent    — rebuild BM25 skill index
 */

require('dotenv').config({ override: true });

const fs   = require('fs');
const path = require('path');
const { Command } = require('commander');
const { detectProviderFromModel } = require('../eval/utils/ai-sdk');
const { getLibraryConfig } = require('./config');
const registry    = require('./agent-registry');
const configMgr   = require('./config-manager');
const { classify, Reason } = require('./error-classifier');
const { withRetry, sleep } = require('./retry-utils');
const memory      = require('./memory');
const { closeBrowser } = require('../eval/utils/render-tester');
const worktreeManager  = require('../eval/utils/worktree');
const logger = require('../eval/utils/logger');

const ROOT_DIR   = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT_DIR, 'skills');

// ── CLI ───────────────────────────────────────────────────────────────────────

const program = new Command();
program
  .name('controller')
  .description('AntV Skills iterative validation harness')
  .option('--library <id>',          'Library id (g2 | g6)')
  .option('--sample <n>',            'Eval sample size',             (v) => parseInt(v, 10))
  .option('--full',                  'Run full dataset (overrides --sample)')
  .option('--retrieval <strategy>',  'tool-call | bm25 | context7')
  .option('--passes <n>',            'Consecutive clean passes required', (v) => parseInt(v, 10))
  .option('--max-iterations <n>',    'Max optimization iterations',  (v) => parseInt(v, 10))
  .option('--concurrency <n>',       'Render test concurrency',      (v) => parseInt(v, 10))
  .option('--dry-run',               'Log errors only, skip optimization')
  .option('--no-worktree',           'Disable git worktree isolation')
  .option('--score',                 'Enable VL visual scoring (disabled by default)')
  .option('--skip-score',            'Skip VL visual scoring (default, kept for compatibility)')
  .option('--score-threshold <n>',   'Fail threshold for visual score', (v) => parseFloat(v))
  .option('--optimize-model <id>',   'Model to use for OptimizeAgent (overrides AI_MODEL for optimization only)')
  .option('--log <file>',            'Custom dry-run log file path')
  .option('--no-memory',             'Disable cross-iteration memory')
  .parse(process.argv);

// Merge: defaults < config file < env vars < CLI args
const cfg = configMgr.load(program.opts());

const LIBRARY_ID      = cfg.library;
const FULL            = cfg.full;
const SAMPLE          = FULL ? undefined : cfg.sample;
const RETRIEVAL       = cfg.retrieval;
const MAX_PASSES      = cfg.passes;
const MAX_ITERATIONS  = cfg.maxIterations;
const CONCURRENCY     = cfg.concurrency;
const MODEL           = process.env.AI_MODEL || 'qwen3-coder-480b-a35b-instruct';
const OPTIMIZE_MODEL  = cfg.optimizeModel || MODEL;
const PROVIDER        = detectProviderFromModel(MODEL);
const OPTIMIZE_PROVIDER = detectProviderFromModel(OPTIMIZE_MODEL);
const DRY_RUN         = cfg.dryRun;
const NO_WORKTREE     = !cfg.worktree;
const SKIP_SCORE      = program.opts().score ? false : cfg.skipScore;
const SCORE_THRESHOLD = cfg.scoreThreshold;
const USE_MEMORY      = program.opts().memory !== false; // --no-memory sets opts.memory=false

const LOG_DIR  = path.join(__dirname, 'logs');
const LOG_FILE = (() => {
  const cliLog = program.opts().log;
  if (cliLog) return path.isAbsolute(cliLog) ? cliLog : path.join(process.cwd(), cliLog);
  const dateStr = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `validator-${dateStr}.log`);
})();

// ── Worktree state (module-level so .catch() can access it) ───────────────────

let worktree = null;

// ── Main loop ─────────────────────────────────────────────────────────────────

async function main() {
  const libConfig = getLibraryConfig(LIBRARY_ID);

  console.log('='.repeat(60));
  console.log('  AntV Skills Validator');
  console.log('='.repeat(60));
  console.log(`  Library:        ${libConfig.friendlyName} (${LIBRARY_ID})`);
  console.log(`  Sample:         ${FULL ? 'full' : SAMPLE}`);
  console.log(`  Retrieval:      ${RETRIEVAL}`);
  console.log(`  Provider/Model: ${PROVIDER} / ${MODEL}`);
  if (OPTIMIZE_MODEL !== MODEL) {
    console.log(`  Optimize model: ${OPTIMIZE_PROVIDER} / ${OPTIMIZE_MODEL}`);
  }
  console.log(`  Target passes:  ${MAX_PASSES}`);
  console.log(`  Max iterations: ${MAX_ITERATIONS}`);
  console.log(`  Concurrency:    ${CONCURRENCY}`);
  console.log(`  Memory:         ${USE_MEMORY ? 'enabled' : 'disabled'}`);
  if (DRY_RUN)     console.log(`  Mode:           dry-run (log: ${LOG_FILE})`);
  if (NO_WORKTREE) console.log(`  Worktree:       disabled`);
  if (SKIP_SCORE)  console.log(`  Visual score:   disabled`);
  else             console.log(`  Score threshold:${SCORE_THRESHOLD}`);
  console.log('='.repeat(60));

  // ── Worktree setup ─────────────────────────────────────────────────────────
  let activeRootDir   = ROOT_DIR;
  let activeSkillsDir = SKILLS_DIR;

  if (!DRY_RUN && !NO_WORKTREE) {
    worktree = worktreeManager.create({ rootDir: ROOT_DIR, libraryId: LIBRARY_ID });
    activeRootDir   = worktree.worktreePath;
    activeSkillsDir = path.join(worktree.worktreePath, path.relative(ROOT_DIR, SKILLS_DIR));

    process.once('SIGINT', () => {
      console.log('\n[worktree] Interrupted — cleaning up...');
      worktree.cleanup();
      process.exit(130);
    });
  }

  let consecutivePasses = 0;
  let iteration         = 0;
  let priorityCaseIds   = null;  // set after optimization to re-test failing cases first
  // fixedCaseIds: the stable sample drawn in iteration 1 and reused every normal round.
  // This prevents random re-sampling from generating false "clean pass" signals.
  let fixedCaseIds      = null;
  let skillsWereModified = false;  // set to true when any optimization commit lands

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Run eval with automatic retry and error-classified back-off. */
  async function runEval(ids) {
    let currentSample = SAMPLE;

    return withRetry(
      () => registry.dispatch('eval', {
        sample:      currentSample,
        full:        FULL,
        retrieval:   RETRIEVAL,
        dataset:     libConfig.defaultDataset,
        concurrency: CONCURRENCY,
        ids,
        rootDir:     activeRootDir,
      }),
      {
        maxAttempts: 3,
        baseMs:      5_000,
        shouldRetry(err) {
          const { reason, action } = classify(err);
          if (!action.shouldRetry) return false;
          if (reason === Reason.CONTEXT_OVERFLOW && currentSample) {
            currentSample = Math.max(1, Math.floor(currentSample / 2));
            console.warn(`[eval] Context overflow — reducing sample to ${currentSample}`);
          }
          return true;
        },
        onRetry(err, attempt, delayMs) {
          const { reason } = classify(err);
          console.warn(`[eval] attempt ${attempt} failed (${reason}): ${err.message}. Retrying in ${(delayMs/1000).toFixed(1)}s...`);
        },
      }
    );
  }

  /** Run index rebuild with retry. */
  async function runIndex() {
    return withRetry(
      () => registry.dispatch('index', { libraryId: LIBRARY_ID, rootDir: activeRootDir }),
      {
        maxAttempts: 2,
        baseMs:      3_000,
        onRetry(err, attempt, delayMs) {
          console.warn(`[index] attempt ${attempt} failed: ${err.message}. Retrying in ${(delayMs/1000).toFixed(1)}s...`);
        },
      }
    );
  }

  /**
   * Run a baseline eval on the main branch (ROOT_DIR) using the same fixedCaseIds
   * Run a full-dataset eval on both the worktree and the main branch, then
   * compare pass rates to detect regressions or confirm net improvement.
   * Always uses the complete dataset — fixedCaseIds (the optimization sample)
   * cannot detect overfitting and is intentionally excluded here.
   *
   * @returns {boolean} true = net improvement or neutral; false = regression
   */
  async function runBaselineComparison() {
    console.log('\n' + '─'.repeat(60));
    console.log('[baseline] Comparing worktree skills against main branch (full dataset)...');
    console.log('─'.repeat(60));

    // Always run the full dataset — fixedCaseIds is the sample the optimizer was
    // trained on, so comparing against only that set cannot detect overfitting.
    // ── Eval worktree on full dataset ─────────────────────────────────────────
    let worktreeFullResultPath;
    try {
      worktreeFullResultPath = await withRetry(
        () => registry.dispatch('eval', {
          full:        true,
          retrieval:   RETRIEVAL,
          dataset:     libConfig.defaultDataset,
          concurrency: CONCURRENCY,
          rootDir:     activeRootDir,
        }),
        {
          maxAttempts: 2,
          baseMs:      5_000,
          onRetry(err, attempt, delayMs) {
            console.warn(`[baseline] worktree eval attempt ${attempt} failed: ${err.message}. Retrying in ${(delayMs / 1000).toFixed(1)}s...`);
          },
        }
      );
    } catch (err) {
      console.warn(`[baseline] Worktree full eval failed — skipping comparison: ${err.message}`);
      return true;
    }

    // ── Eval main branch on full dataset ──────────────────────────────────────
    let baselineResultPath;
    try {
      baselineResultPath = await withRetry(
        () => registry.dispatch('eval', {
          full:        true,
          retrieval:   RETRIEVAL,
          dataset:     libConfig.defaultDataset,
          concurrency: CONCURRENCY,
          rootDir:     ROOT_DIR,   // main branch — not the worktree
        }),
        {
          maxAttempts: 2,
          baseMs:      5_000,
          onRetry(err, attempt, delayMs) {
            console.warn(`[baseline] main eval attempt ${attempt} failed: ${err.message}. Retrying in ${(delayMs / 1000).toFixed(1)}s...`);
          },
        }
      );
    } catch (err) {
      console.warn(`[baseline] Main branch full eval failed — skipping comparison: ${err.message}`);
      return true;
    }

    // ── Render test both result files ─────────────────────────────────────────
    let worktreeFullErrors, baselineErrors;
    try {
      [worktreeFullErrors, baselineErrors] = await Promise.all([
        registry.dispatch('render', {
          resultPath:     worktreeFullResultPath,
          concurrency:    CONCURRENCY,
          skipScore:      true,
          scoreThreshold: SCORE_THRESHOLD,
        }),
        registry.dispatch('render', {
          resultPath:     baselineResultPath,
          concurrency:    CONCURRENCY,
          skipScore:      true,
          scoreThreshold: SCORE_THRESHOLD,
        }),
      ]);
    } catch (err) {
      console.warn(`[baseline] Render failed — skipping comparison: ${err.message}`);
      return true;
    }

    // ── Compare ───────────────────────────────────────────────────────────────
    const baselineData    = JSON.parse(fs.readFileSync(baselineResultPath, 'utf-8'));
    const total           = (baselineData.results || []).length;

    const worktreeErrCount  = worktreeFullErrors.length;
    const baselineErrCount  = baselineErrors.length;
    const improved          = worktreeErrCount <= baselineErrCount;

    const fmt = (errors, t) =>
      `${((t - errors) / t * 100).toFixed(1)}%  (${errors} failure${errors !== 1 ? 's' : ''} / ${t})`;

    console.log('\n[baseline] Full-dataset results:');
    console.log(`  Main branch  : ${fmt(baselineErrCount,  total)}`);
    console.log(`  Worktree     : ${fmt(worktreeErrCount,  total)}`);
    const deltaPp = ((baselineErrCount - worktreeErrCount) / total * 100).toFixed(1);
    console.log(`  Delta        : ${deltaPp > 0 ? '+' : ''}${deltaPp}pp`);

    // Cases that pass on main but fail on worktree (new regressions)
    const baselineErrorSet = new Set(baselineErrors.map((c) => c.id));
    const worktreeErrorSet = new Set(worktreeFullErrors.map((c) => c.id));
    const newRegressions   = [...worktreeErrorSet].filter((id) => !baselineErrorSet.has(id));
    // Cases fixed on worktree that were failing on main
    const newFixes         = [...baselineErrorSet].filter((id) => !worktreeErrorSet.has(id));

    if (newFixes.length > 0) {
      console.log(`[baseline] Fixed on worktree vs main (${newFixes.length}): ${newFixes.slice(0, 5).join(', ')}${newFixes.length > 5 ? '…' : ''}`);
    }

    if (improved) {
      console.log('[baseline] ✓ Net improvement — safe to merge');
    } else {
      console.log('[baseline] ⚠ Regression detected — review before merging');
      if (newRegressions.length > 0) {
        console.log(`[baseline] Cases passing on main but failing on worktree (${newRegressions.length}):`);
        newRegressions.forEach((id) => console.log(`  - ${id}`));
      }
    }

    return improved;
  }

  // ── Main iteration loop ───────────────────────────────────────────────────

  while (consecutivePasses < MAX_PASSES) {
    if (iteration >= MAX_ITERATIONS) {
      console.log(`\nReached max iterations (${MAX_ITERATIONS}). Stopping.`);
      if (worktree) worktree.cleanup();
      process.exit(1);
    }

    iteration++;
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Iteration ${iteration}  |  Consecutive passes: ${consecutivePasses}/${MAX_PASSES}`);
    console.log('─'.repeat(60));

    // ── Step 1: Eval ──────────────────────────────────────────────────────────
    // Determine which case IDs to run this iteration:
    //   - priorityCaseIds: targeted re-test of previously failing cases (post-optimize)
    //   - fixedCaseIds:    the stable sample fixed in iteration 1 (non-full runs)
    //   - null / undefined: first iteration — sample will be drawn and then fixed
    const isTargetedRound = priorityCaseIds !== null;
    const idsForThisRound = priorityCaseIds ?? (FULL ? null : fixedCaseIds);

    if (isTargetedRound) {
      console.log(`\n[targeted] Re-testing ${priorityCaseIds.length} previously-failing case(s)...`);
    } else if (fixedCaseIds && !FULL) {
      console.log(`\n[fixed-sample] Running ${fixedCaseIds.length} fixed case(s)...`);
    }

    let resultPath;
    try {
      resultPath = await runEval(idsForThisRound);
      priorityCaseIds = null;
    } catch (err) {
      const { reason, action } = classify(err);
      logger.error({ err: err.message, reason }, 'Eval step failed');
      if (action.abort) { if (worktree) worktree.cleanup(); process.exit(1); }
      // Non-abort eval failure: skip this iteration
      console.error(`Eval failed (${reason}), skipping iteration.`);
      continue;
    }

    // ── Step 2: Fix sample on first normal (non-targeted) iteration ──────────
    // After the first eval, lock in the case IDs so every subsequent non-targeted
    // round tests exactly the same set. This makes consecutivePasses meaningful.
    if (!FULL && fixedCaseIds === null && !idsForThisRound) {
      try {
        const data = JSON.parse(fs.readFileSync(resultPath, 'utf-8'));
        const ids = (data.results || []).map((r) => r.id).filter(Boolean);
        if (ids.length > 0) {
          fixedCaseIds = ids;
          console.log(`[fixed-sample] Locked ${fixedCaseIds.length} case IDs for this run.`);
        }
      } catch {
        // Non-critical: if we can't read the file here, we'll just re-sample next round.
      }
    }

    // ── Step 4 (was 2): Render test ──────────────────────────────────────────
    const errorCases = await registry.dispatch('render', {
      resultPath,
      concurrency:    CONCURRENCY,
      skipScore:      SKIP_SCORE,
      scoreThreshold: SCORE_THRESHOLD,
    });

    if (errorCases.length === 0) {
      // A targeted re-test only validates previously-failing cases.
      // It is not representative of the full sample, so it must NOT increment
      // consecutivePasses — only a clean full-sample round counts.
      if (isTargetedRound) {
        console.log(`[targeted] All re-tested cases pass — running full-sample round next to confirm.`);
      } else {
        consecutivePasses++;
        console.log(`Clean pass (${consecutivePasses}/${MAX_PASSES})`);
      }
      continue;
    }

    consecutivePasses = 0;

    // ── Step 3: Analyze errors ────────────────────────────────────────────────
    const { skillToErrors, orphanCases } = registry.dispatch('analyze', {
      errorCases,
      rootDir:    activeRootDir,
      skillsDir:  activeSkillsDir,
    });

    if (skillToErrors.size === 0 && orphanCases.length === 0) {
      console.log('\nNo skills to optimize. Counting as pass to avoid infinite loop.');
      consecutivePasses++;
      continue;
    }

    // ── Step 3b: Update memory ────────────────────────────────────────────────
    if (USE_MEMORY) {
      for (const [skillPath, cases] of skillToErrors) {
        memory.recordErrors(skillPath, cases, iteration);
      }
    }

    // ── Step 4: Optimize skills ───────────────────────────────────────────────
    const skillsRefDir = path.join(activeSkillsDir, libConfig.skillsPath);

    // Build per-skill history context to inject into the optimize prompt
    const historyContext = USE_MEMORY
      ? Object.fromEntries(
          [...skillToErrors.keys()].map((p) => [p, memory.getOptimizationContext(p)])
        )
      : {};

    let optimizeOk = false;
    try {
      await withRetry(
        () => registry.dispatch('optimize', {
          skillToErrors,
          provider:       OPTIMIZE_PROVIDER,
          model:          OPTIMIZE_MODEL,
          rootDir:        activeRootDir,
          dryRun:         DRY_RUN,
          logFile:        LOG_FILE,
          iteration,
          allErrorCases:  errorCases,
          orphanCases,
          libraryId:      LIBRARY_ID,
          skillsRefDir,
          historyContext,
        }),
        {
          maxAttempts: 3,
          baseMs:      10_000,
          shouldRetry(err) {
            const { action } = classify(err);
            return action.shouldRetry && !action.abort;
          },
          onRetry(err, attempt, delayMs) {
            const { reason } = classify(err);
            console.warn(
              `[optimize] attempt ${attempt} failed (${reason}): ${err.message}. ` +
              `Retrying in ${(delayMs / 1000).toFixed(1)}s...`
            );
          },
        }
      );
      optimizeOk = true;
    } catch (err) {
      const { reason, action } = classify(err);
      if (action.abort) {
        logger.error({ err: err.message, reason }, 'Optimize step — unrecoverable error');
        if (worktree) worktree.cleanup();
        process.exit(1);
      }
      // Transient failure (connection / timeout) — log and continue to next iteration.
      // The failing cases will be retested in the next eval round.
      logger.warn({ err: err.message, reason }, 'Optimize step failed — skipping this iteration');
      console.warn(`\n[optimize] Skipped (${reason}): ${err.message}`);
      consecutivePasses = 0;
    }

    if (DRY_RUN) {
      console.log('[dry-run] Stopping after first failure.');
      break;
    }

    if (!optimizeOk) continue;

    // ── Step 4b: Record optimization in memory ────────────────────────────────
    if (USE_MEMORY) {
      for (const [skillPath, cases] of skillToErrors) {
        memory.recordOptimization(skillPath, cases, iteration);
      }
    }

    // ── Step 4c: Commit worktree ──────────────────────────────────────────────
    if (worktree) {
      const committed = worktree.commit(`validator(${LIBRARY_ID}): iteration ${iteration} — optimize skills`);
      if (committed) skillsWereModified = true;
    }

    // ── Step 5: Rebuild index ─────────────────────────────────────────────────
    await runIndex();

    // Schedule targeted re-test of all failing cases in next iteration
    priorityCaseIds = errorCases.map((c) => c.id).filter(Boolean);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`  Done: ${MAX_PASSES} consecutive clean evaluations.`);
  console.log('='.repeat(60));

  if (USE_MEMORY) {
    const top = memory.getFrequentlyFailingSkills(3);
    if (top.length > 0) {
      console.log('\n  Most-optimized skills this run:');
      top.forEach(({ skillPath, count }) =>
        console.log(`    ${count}x  ${path.relative(ROOT_DIR, skillPath)}`)
      );
    }
  }

  if (worktree) {
    if (!skillsWereModified) {
      console.log('\n[baseline] No skills were modified — skipping comparison.');
      worktree.finish();
    } else {
      const improved = await runBaselineComparison();
      if (improved) {
        worktree.finish();
      } else {
        console.log('\n[baseline] Branch left open for manual review:');
        console.log(`  ${worktree.branch}`);
        console.log('  Merge only after confirming regressions are acceptable.');
      }
    }
  }
}

main()
  .then(async () => { await closeBrowser(); })
  .catch(async (err) => {
    logger.error({ err: err.message }, 'Fatal error');
    if (worktree) { logger.info('Cleaning up worktree due to fatal error'); worktree.cleanup(); }
    await closeBrowser();
    process.exit(1);
  });
