#!/usr/bin/env node
/**
 * AntV Skills Evaluation CLI
 *
 * Usage:
 *   node eval/eval-cli/index.js [eval] [options]
 *   node eval/eval-cli/index.js --help
 */

require('dotenv').config({ override: true });

const { Command } = require('commander');
const { detectProviderFromModel } = require('../utils/ai-sdk');
const ProviderRegistry = require('../utils/provider-registry');

const program = new Command();

program
  .name('eval-cli')
  .description('AntV Skills LLM Evaluation CLI')
  .version('0.1.0');

program
  .command('eval', { isDefault: true })
  .description('Run LLM evaluation')
  .option('--model <id>', 'Model ID (default: from AI_MODEL env)')
  .option('--dataset <file>', 'Test dataset file', 'g2-dataset-174.json')
  .option('--sample <n>', 'Sample n random test cases', (v) => {
    const n = parseInt(v, 10);
    if (isNaN(n) || n <= 0) throw new Error(`--sample must be a positive integer, got: ${v}`);
    return n;
  })
  .option('--full', 'Run all test cases (overrides --sample)')
  .option('--concurrency <n>', 'Parallel workers', (v) => {
    const n = parseInt(v, 10);
    if (isNaN(n) || n <= 0) throw new Error(`--concurrency must be a positive integer, got: ${v}`);
    return n;
  }, 1)
  .option(
    '--retrieval <strategy>',
    'Retrieval strategy: tool-call | bm25 | context7',
    (v) => {
      const valid = ['tool-call', 'bm25', 'context7'];
      if (!valid.includes(v))
        throw new Error(`--retrieval must be one of: ${valid.join(', ')}`);
      return v;
    },
    'tool-call'
  )
  .option('--ids <ids>', 'Comma-separated case IDs to test (targeted re-test after optimization)')
  .option('--verbose', 'Show detailed output')
  .action(runEvaluation);

async function runEvaluation(opts) {
  const options = {
    model: opts.model || process.env.AI_MODEL,
    dataset: opts.dataset,
    sample: opts.sample,
    full: opts.full || false,
    ids: opts.ids ? opts.ids.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    concurrency: opts.concurrency,
    verbose: opts.verbose || false,
    retrieval: opts.retrieval
  };

  const provider = detectProviderFromModel(options.model);
  options.provider = provider;

  if (!ProviderRegistry.hasProvider(provider)) {
    console.error(`Unknown provider: ${provider}`);
    console.error(
      'Available providers:',
      ProviderRegistry.listProviders().map((p) => p.id).join(', ')
    );
    process.exit(1);
  }

  if (!ProviderRegistry.hasApiKey(provider)) {
    console.error(`Missing API key for ${provider}`);
    console.error(`Set ${ProviderRegistry.getApiKeyEnv(provider)} environment variable`);
    process.exit(1);
  }

  if (!options.model || options.model === provider) {
    options.model = ProviderRegistry.getDefaultModel(provider);
  }

  const EvaluationManager = require('../utils/eval-manager');
  const { v4: uuidv4 } = require('uuid');

  console.log('');
  console.log('='.repeat(60));
  console.log('  AntV Skills LLM Evaluation');
  console.log('='.repeat(60));
  console.log(`  Provider:    ${provider}`);
  console.log(`  Model:       ${options.model}`);
  console.log(`  Dataset:     ${options.dataset}`);
  console.log(`  Sample:      ${options.ids ? `targeted (${options.ids.length} IDs)` : options.sample || (options.full ? 'all' : '5')}`);
  console.log(`  Concurrency: ${options.concurrency}`);
  console.log(`  Retrieval:   ${options.retrieval}`);
  console.log('='.repeat(60));
  console.log('');

  const evalManager = new EvaluationManager();
  const evalId = uuidv4();

  let lastProgress = 0;
  const progressInterval = setInterval(() => {
    const status = evalManager.getStatus(evalId);
    if (status?.progress) {
      const { current, total } = status.progress;
      if (current > lastProgress) {
        console.log(`[${current}/${total}] Processing...`);
        lastProgress = current;
      }
    }
  }, 2000);

  try {
    const { evalId: id, outputPath } = await evalManager.startEvaluation({ id: evalId, ...options });

    const evalRun = evalManager.runningEvals.get(id);
    if (evalRun?._promise) await evalRun._promise;

    const finalStatus = evalManager.getStatus(id);
    console.log('');
    console.log('='.repeat(60));
    console.log('  Evaluation Complete');
    console.log('='.repeat(60));
    console.log(`  Status:       ${finalStatus.status}`);
    console.log(`  Total Tests:  ${finalStatus.summary?.totalTests}`);
    console.log(
      `  Avg Similarity: ${((finalStatus.summary?.avgSimilarity || 0) * 100).toFixed(1)}%`
    );
    console.log(
      `  Success Rate: ${finalStatus.summary?.successCount}/${finalStatus.summary?.totalTests}`
    );
    console.log(`  Issues Count: ${finalStatus.summary?.issuesCount}`);
    console.log('='.repeat(60));

    // Report the output path to the parent process via stderr marker line.
    // stdout is used for user-facing progress; stderr is captured by eval-agent.
    process.stderr.write(`EVAL_RESULT_PATH=${outputPath}\n`);
  } catch (error) {
    console.error('Evaluation failed:', error.message);
    process.exit(1);
  } finally {
    clearInterval(progressInterval);
  }
}

program.parseAsync(process.argv).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
