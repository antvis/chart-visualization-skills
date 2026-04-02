#!/usr/bin/env node
/**
 * AntV Skills Evaluation CLI
 *
 * Unified command-line interface for evaluation operations.
 *
 * Usage:
 *   node eval/cli.js server --port 3100     # Start web server
 *   node eval/cli.js eval [options]         # Run evaluation
 *   node eval/cli.js results list           # List result files
 *   node eval/cli.js compare <file1> <file2> # Compare results
 *   node eval/cli.js providers              # List available providers
 */

// Load environment variables from .env file
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { detectProviderFromModel } = require('./utils/ai-sdk');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

// ── Commands ─────────────────────────────────────────────────────────────────

async function runCommand(cmd, cmdArgs) {
  switch (cmd) {
    case 'server':
      return startServer(cmdArgs);
    case 'eval':
      return runEvaluation(cmdArgs);
    case 'results':
      return manageResults(cmdArgs);
    case 'compare':
      return compareResults(cmdArgs);
    case 'providers':
      return listProviders(cmdArgs);
    case 'help':
    default:
      return showHelp();
  }
}

// ── Server Command ───────────────────────────────────────────────────────────

function startServer(cmdArgs) {
  const port =
    cmdArgs.find((a) => a.startsWith('--port='))?.split('=')[1] ||
    process.env.EVAL_PORT ||
    3100;

  console.log(`Starting evaluation server on port ${port}...`);

  // Set port and start server
  process.env.EVAL_PORT = port;
  require('./server');
}

// ── Eval Command ─────────────────────────────────────────────────────────────

async function runEvaluation(cmdArgs) {
  const ProviderRegistry = require('./utils/provider-registry');
  const EvaluationManager = require('./utils/eval-manager');

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
      'dataset-200.json',
    sample: cmdArgs.find((a) => a.startsWith('--sample='))?.split('=')[1],
    full: cmdArgs.includes('--full'),
    concurrency: parseInt(
      cmdArgs.find((a) => a.startsWith('--concurrency='))?.split('=')[1] || '1'
    ),
    verbose: cmdArgs.includes('--verbose'),
    retrieval
  };

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

  // Set default model if not provided
  options.model = options.model || ProviderRegistry.getDefaultModel(provider);

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

// ── Results Command ──────────────────────────────────────────────────────────

function manageResults(cmdArgs) {
  const subCommand = cmdArgs[0] || 'list';
  const resultDir = path.join(__dirname, 'result');

  switch (subCommand) {
    case 'list':
      if (!fs.existsSync(resultDir)) {
        console.log('No results directory found');
        return;
      }
      const files = fs
        .readdirSync(resultDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => {
          const filePath = path.join(resultDir, f);
          const stat = fs.statSync(filePath);
          let summary = {};
          try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            summary = {
              model: content.model,
              avgSim: content.summary?.avgSimilarity || 0
            };
          } catch (e) {
            /* ignore */
          }
          return { name: f, size: stat.size, modified: stat.mtime, ...summary };
        })
        .sort((a, b) => new Date(b.modified) - new Date(a.modified));

      console.log('');
      console.log('Evaluation Results:');
      console.log('-'.repeat(80));
      console.log('File'.padEnd(40), 'Model'.padEnd(25), 'Avg Sim');
      console.log('-'.repeat(80));
      for (const f of files) {
        console.log(
          f.name.padEnd(40),
          (f.model || '-').padEnd(25),
          `${(f.avgSim * 100).toFixed(1)}%`
        );
      }
      break;

    case 'show':
      const filename = cmdArgs[1];
      if (!filename) {
        console.log('Usage: results show <filename>');
        return;
      }
      const filePath = path.join(resultDir, filename);
      if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filename}`);
        return;
      }
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      console.log(JSON.stringify(content, null, 2));
      break;

    case 'delete':
      const delFile = cmdArgs[1];
      if (!delFile) {
        console.log('Usage: results delete <filename>');
        return;
      }
      const delPath = path.join(resultDir, delFile);
      if (!fs.existsSync(delPath)) {
        console.log(`File not found: ${delFile}`);
        return;
      }
      fs.unlinkSync(delPath);
      console.log(`Deleted: ${delFile}`);
      break;

    default:
      console.log('Usage: results [list|show|delete] [filename]');
  }
}

// ── Compare Command ──────────────────────────────────────────────────────────

function compareResults(cmdArgs) {
  const ModelCompare = require('./utils/model-compare');

  const files = cmdArgs.filter((a) => !a.startsWith('--'));
  const outputReport = cmdArgs
    .find((a) => a.startsWith('--output='))
    ?.split('=')[1];

  if (files.length < 2) {
    console.log('Usage: compare <file1> <file2> [--output=report.md]');
    console.log('');
    console.log('Example:');
    console.log('  compare result1.json result2.json');
    console.log('  compare result1.json result2.json --output=comparison.md');
    return;
  }

  const resultDir = path.join(__dirname, 'result');
  const filePaths = files.map((f) => {
    // Check if file exists as-is or in result directory
    if (fs.existsSync(f)) return f;
    const inResultDir = path.join(resultDir, f);
    if (fs.existsSync(inResultDir)) return inResultDir;
    console.error(`File not found: ${f}`);
    process.exit(1);
  });

  console.log('Comparing results...');
  console.log('');

  if (files.length === 2) {
    const comparison = ModelCompare.compareResults(filePaths[0], filePaths[1]);

    // Print summary
    const { meta, statistics, summary } = comparison;
    console.log('='.repeat(60));
    console.log('  Model Comparison');
    console.log('='.repeat(60));
    console.log(`  Model 1: ${meta.result1.model} (${meta.result1.provider})`);
    console.log(`  Model 2: ${meta.result2.model} (${meta.result2.provider})`);
    console.log('');
    console.log(`  Common Cases: ${statistics.commonCases}`);
    console.log(`  Model 1 Wins: ${statistics.wins.result1}`);
    console.log(`  Model 2 Wins: ${statistics.wins.result2}`);
    console.log(`  Ties: ${statistics.wins.ties}`);
    console.log('');
    console.log(
      `  Avg Similarity Delta: ${(statistics.avgDelta * 100).toFixed(1)}%`
    );
    console.log('='.repeat(60));

    // Generate report if output specified
    if (outputReport) {
      const report = ModelCompare.generateReport(comparison);
      fs.writeFileSync(outputReport, report);
      console.log(`\nReport saved to: ${outputReport}`);
    }
  } else {
    // Multi-file comparison
    const multiComparison = ModelCompare.compareMultiple(filePaths);

    console.log('='.repeat(60));
    console.log('  Multi-Model Comparison');
    console.log('='.repeat(60));
    console.log('');

    // Print ranking
    console.log('Ranking by Average Similarity:');
    multiComparison.ranking.forEach((r, i) => {
      console.log(
        `  ${i + 1}. ${r.model} (${r.file}): ${(r.avgSimilarity * 100).toFixed(1)}%`
      );
    });
  }
}

// ── Providers Command ────────────────────────────────────────────────────────

function listProviders() {
  const ProviderRegistry = require('./utils/provider-registry');
  const providers = ProviderRegistry.listProviders();

  console.log('');
  console.log('Available AI Providers:');
  console.log('='.repeat(60));

  for (const provider of providers) {
    console.log(`\n${provider.name} (${provider.id})`);
    console.log(
      `  API Key: ${provider.hasApiKey ? 'SET' : `NOT SET (${provider.apiKeyEnv})`}`
    );
    console.log('  Models:');
    for (const model of provider.models) {
      const defaultTag = model.isDefault ? ' (default)' : '';
      console.log(`    - ${model.name}${defaultTag}`);
    }
  }

  console.log('');
  console.log('='.repeat(60));
}

// ── Help Command ─────────────────────────────────────────────────────────────

function showHelp() {
  console.log(`
AntV Skills Evaluation CLI

Usage:
  node eval/cli.js <command> [options]

Commands:
  server [options]        Start the evaluation web server
  eval [options]          Run LLM evaluation
  results [action]        Manage result files
  compare <files...>      Compare evaluation results
  providers               List available AI providers
  help                    Show this help message

Server Options:
  --port=<port>           Server port (default: 3100)

Eval Options:
  --model=<id>            Model ID (default: from AI_MODEL env or qwen3-coder-480b-a35b-instruct)
  --dataset=<file>        Test dataset file (default: dataset-200.json)
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

Results Actions:
  list                    List all result files (default)
  show <file>             Show result file content
  delete <file>           Delete a result file

Compare Options:
  --output=<file>         Save comparison report to markdown file

Examples:
  # Start web server
  node eval/cli.js server --port 3100

  # Run evaluation (uses .env for model config)
  node eval/cli.js eval --sample=10

  # Run with specific model
  node eval/cli.js eval --sample=10 --model=claude-3-opus

  # Compare retrieval strategies on the same sample
  node eval/cli.js eval --sample=20 --retrieval=tool-call
  node eval/cli.js eval --sample=20 --retrieval=bm25
  node eval/cli.js eval --sample=20 --retrieval=context7

  # Run full evaluation
  node eval/cli.js eval --full

  # Compare two result files
  node eval/cli.js compare result1.json result2.json --output=comparison.md

  # List providers
  node eval/cli.js providers
`);
}

// ── Run CLI ──────────────────────────────────────────────────────────────────

runCommand(command, args.slice(1)).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
