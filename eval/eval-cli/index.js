#!/usr/bin/env node
/**
 * AntV Skills Evaluation CLI
 *
 * Unified command-line interface for evaluation operations.
 * Parameters and options for running evaluations.
 * - Model selection (e.g., qwen3-coder-480b-a35b-instruct, claude-3-opus)
 * - Dataset specification (e.g., g2-dataset-174.json)
 * - Sample size (e.g., --sample=10)
 * - Concurrency level (e.g., --concurrency=5)
 * - Retrieval strategy (e.g., --retrieval=tool-call)
 *
 * Usage:
 *   node eval/cli.js [options]         # Run evaluation
 */

// Load environment variables from .env file, overriding system environment variables
require('dotenv').config({ override: true });

const { detectProviderFromModel } = require('../utils/ai-sdk');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

// ── Commands ─────────────────────────────────────────────────────────────────

async function runCommand(cmd, cmdArgs) {
  switch (cmd) {
    case 'help':
      return showHelp();
    case 'eval':
    default:
      return runEvaluation(cmdArgs);
  }
}

// ── Eval Command ─────────────────────────────────────────────────────────────

async function runEvaluation(cmdArgs) {
  const ProviderRegistry = require('../utils/provider-registry');
  const EvaluationManager = require('../utils/eval-manager');

  // Validate argument format
  const knownFlags = ['--full', '--verbose'];
  const knownPrefixes = [
    '--model=',
    '--dataset=',
    '--sample=',
    '--concurrency=',
    '--retrieval='
  ];
  const unknown = cmdArgs.filter(
    (a) =>
      !knownFlags.includes(a) && !knownPrefixes.some((p) => a.startsWith(p))
  );
  if (unknown.length > 0) {
    console.error(`Unknown or malformed argument(s): ${unknown.join(', ')}`);
    console.log('Valid flags: --full, --verbose');
    console.log(`Valid options: ${knownPrefixes.join(', ')}`);
    process.exit(1);
  }

  // Parse options
  const retrieval =
    cmdArgs.find((a) => a.startsWith('--retrieval='))?.split('=')[1] ||
    'tool-call';
  const validRetrievals = ['tool-call', 'bm25', 'context7'];
  if (!validRetrievals.includes(retrieval)) {
    console.error(`Unknown retrieval strategy: ${retrieval}`);
    console.log(`Valid options: ${validRetrievals.join(', ')}`);
    process.exit(1);
  }

  const options = {
    model:
      cmdArgs.find((a) => a.startsWith('--model='))?.split('=')[1] ||
      process.env.AI_MODEL,
    dataset:
      cmdArgs.find((a) => a.startsWith('--dataset='))?.split('=')[1] ||
      'g2-dataset-174.json',
    sample: cmdArgs.find((a) => a.startsWith('--sample='))?.split('=')[1],
    full: cmdArgs.includes('--full'),
    concurrency: parseInt(
      cmdArgs.find((a) => a.startsWith('--concurrency='))?.split('=')[1] || '1'
    ),
    verbose: cmdArgs.includes('--verbose'),
    retrieval
  };

  console.log('options', options);

  // Detect provider from model and validate
  const provider = detectProviderFromModel(options.model);
  options.provider = provider;

  if (!ProviderRegistry.hasProvider(provider)) {
    console.error(`Unknown provider: ${provider}`);
    console.log(
      'Available providers:',
      ProviderRegistry.listProviders()
        .map((p) => p.id)
        .join(', ')
    );
    process.exit(1);
  }

  if (!ProviderRegistry.hasApiKey(provider)) {
    console.error(`Missing API key for ${provider}`);
    console.log(
      `Set ${ProviderRegistry.getApiKeyEnv(provider)} environment variable`
    );
    process.exit(1);
  }

  // Set default model if not provided, or if model equals provider name (alias)
  if (!options.model || options.model === provider) {
    options.model = ProviderRegistry.getDefaultModel(provider);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('  AntV Skills LLM Evaluation');
  console.log('='.repeat(60));
  console.log(`  Provider: ${provider}`);
  console.log(`  Model: ${options.model}`);
  console.log(`  Dataset: ${options.dataset}`);
  console.log(`  Sample: ${options.sample || (options.full ? 'all' : '5')}`);
  console.log(`  Concurrency: ${options.concurrency}`);
  console.log(`  Retrieval: ${options.retrieval}`);
  console.log('='.repeat(60));
  console.log('');

  // Run evaluation
  const evalManager = new EvaluationManager();
  const { v4: uuidv4 } = require('uuid');
  const evalId = uuidv4();

  // Set up progress logging
  let lastProgress = 0;
  const progressInterval = setInterval(() => {
    const status = evalManager.getStatus(evalId);
    if (status && status.progress) {
      const { current, total } = status.progress;
      if (current > lastProgress) {
        console.log(`[${current}/${total}] Processing...`);
        lastProgress = current;
      }
    }
  }, 2000);

  try {
    await evalManager.startEvaluation({
      id: evalId,
      ...options
    });

    // Wait for completion
    const evalRun = evalManager.runningEvals.get(evalId);
    if (evalRun?._promise) {
      await evalRun._promise;
    }

    const finalStatus = evalManager.getStatus(evalId);
    console.log('');
    console.log('='.repeat(60));
    console.log('  Evaluation Complete');
    console.log('='.repeat(60));
    console.log(`  Status: ${finalStatus.status}`);
    console.log(`  Total Tests: ${finalStatus.summary?.totalTests}`);
    console.log(
      `  Avg Similarity: ${((finalStatus.summary?.avgSimilarity || 0) * 100).toFixed(1)}%`
    );
    console.log(
      `  Success Rate: ${finalStatus.summary?.successCount}/${finalStatus.summary?.totalTests}`
    );
    console.log(`  Issues Count: ${finalStatus.summary?.issuesCount}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Evaluation failed:', error.message);
    process.exit(1);
  } finally {
    clearInterval(progressInterval);
  }
}

// ── Help Command ─────────────────────────────────────────────────────────────

function showHelp() {
  console.log(`
AntV Skills Evaluation CLI

Usage:
  node eval/cli.js <command> [options]

Commands:
  eval [options]          Run LLM evaluation
  help                    Show this help message

Eval Options:
  --model=<id>            Model ID (default: from AI_MODEL env or qwen3-coder-480b-a35b-instruct)
  --dataset=<file>        Test dataset file (default: g2-dataset-174.json )
  --sample=<n>            Sample n random test cases
  --full                  Run all test cases
  --concurrency=<n>       Run n test cases in parallel (default: 1)
  --verbose               Show detailed output
  --retrieval=<strategy>  Retrieval strategy: tool-call | bm25 | context7 (default: tool-call)

Environment Variables:
  AI_MODEL                Default model ID (e.g., qwen3-coder-480b-a35b-instruct, claude-3-opus)
  QWEN_API_KEY            API key for Qwen
  ANTHROPIC_API_KEY       API key for Anthropic
  OPENAI_API_KEY          API key for OpenAI
  DEEPSEEK_API_KEY        API key for DeepSeek

Examples:
  # Run evaluation (uses .env for model config)
  node eval/cli.js --sample=10

  # Run with specific model
  node eval/cli.js --sample=10 --model=claude-3-opus

  # Compare retrieval strategies on the same sample
  node eval/cli.js --sample=20 --retrieval=tool-call
  node eval/cli.js --sample=20 --retrieval=bm25
  node eval/cli.js --sample=20 --retrieval=context7

  # Run full evaluation
  node eval/cli.js --full
`);
}

// ── Run CLI ──────────────────────────────────────────────────────────────────

runCommand(command, args).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
