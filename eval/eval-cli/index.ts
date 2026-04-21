#!/usr/bin/env tsx
/**
 * AntV Skills Evaluation CLI
 *
 * Usage:
 *   node --import tsx/esm eval/eval-cli/index.ts [eval] [options]
 *   node --import tsx/esm eval/eval-cli/index.ts --help
 */

import 'dotenv/config';
import { Command } from 'commander';
import { detectProviderFromModel } from '../utils/ai-sdk.js';
import {
  hasProvider,
  listProviders,
  hasApiKey,
  getApiKeyEnv,
  getDefaultModel
} from '../utils/provider-registry.js';

const program = new Command();

program
  .name('eval-cli')
  .description('AntV Skills LLM Evaluation CLI')
  .version('0.1.0');

const DEFAULT_DATASETS: Record<string, string> = {
  g2: 'g2-dataset-174.json',
  g6: 'g6-dataset-100.json'
};

program
  .command('eval', { isDefault: true })
  .description('Run LLM evaluation')
  .option('--model <id>', 'Model ID (default: from AI_MODEL env)')
  .option(
    '--library <lib>',
    'Target library: g2 | g6',
    (v) => {
      const valid = ['g2', 'g6'];
      if (!valid.includes(v)) throw new Error(`--library must be one of: ${valid.join(', ')}`);
      return v;
    }
  )
  .option('--dataset <file>', 'Test dataset file (overrides --library default)')
  .option('--sample <n>', 'Sample n random test cases', (v) => {
    const n = parseInt(v, 10);
    if (isNaN(n) || n <= 0) throw new Error(`--sample must be a positive integer, got: ${v}`);
    return n;
  })
  .option('--full', 'Run all test cases (overrides --sample)')
  .option(
    '--concurrency <n>',
    'Parallel workers',
    (v) => {
      const n = parseInt(v, 10);
      if (isNaN(n) || n <= 0) throw new Error(`--concurrency must be a positive integer, got: ${v}`);
      return n;
    },
    1
  )
  .option(
    '--retrieval <strategy>',
    'Retrieval strategy: tool-call | bm25 | context7',
    (v) => {
      const valid = ['tool-call', 'bm25', 'context7'];
      if (!valid.includes(v)) throw new Error(`--retrieval must be one of: ${valid.join(', ')}`);
      return v;
    },
    'tool-call'
  )
  .option('--ids <ids>', 'Comma-separated case IDs to test')
  .option('--verbose', 'Show detailed output')
  .action(runEvaluation);

async function runEvaluation(opts: {
  model?: string;
  library?: string;
  dataset?: string;
  sample?: number;
  full?: boolean;
  concurrency?: number;
  retrieval?: string;
  ids?: string;
  verbose?: boolean;
}) {
  const library = opts.library ?? 'g2';
  const dataset = opts.dataset ?? DEFAULT_DATASETS[library];

  const modelArg = opts.model ?? process.env.AI_MODEL;
  const provider = detectProviderFromModel(modelArg);

  if (!hasProvider(provider)) {
    console.error(`Unknown provider: ${provider}`);
    console.error('Available providers:', listProviders().map((p) => p.id).join(', '));
    process.exit(1);
  }

  if (!hasApiKey(provider)) {
    console.error(`Missing API key for ${provider}`);
    console.error(`Set ${getApiKeyEnv(provider)} environment variable`);
    process.exit(1);
  }

  const model = !modelArg || modelArg === provider ? getDefaultModel(provider)! : modelArg;

  const ids = opts.ids?.split(',').map((s) => s.trim()).filter(Boolean);
  const full = opts.full ?? false;
  // Default to 5 samples when neither --full nor --ids is specified
  const sample = ids ? undefined : (opts.sample ?? (full ? undefined : 5));

  const options = {
    model,
    library,
    dataset,
    sample,
    full,
    ids,
    concurrency: opts.concurrency ?? 1,
    verbose: opts.verbose ?? false,
    retrieval: (opts.retrieval ?? 'tool-call') as 'tool-call' | 'bm25' | 'context7',
    provider
  };

  console.log('');
  console.log('='.repeat(60));
  console.log('  AntV Skills LLM Evaluation');
  console.log('='.repeat(60));
  console.log(`  Provider:    ${provider}`);
  console.log(`  Model:       ${model}`);
  console.log(`  Library:     ${library}`);
  console.log(`  Dataset:     ${dataset}`);
  console.log(`  Sample:      ${ids ? `targeted (${ids.length} IDs)` : full ? 'all' : sample}`);
  console.log(`  Concurrency: ${options.concurrency}`);
  console.log(`  Retrieval:   ${options.retrieval}`);
  console.log('='.repeat(60));
  console.log('');

  const { default: EvaluationManager } = await import('../utils/eval-manager.js');
  const { v4: uuidv4 } = await import('uuid');

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
    const { evalId: id, outputPath, summary } = await evalManager.startEvaluation({ id: evalId, ...options });

    console.log('');
    console.log('='.repeat(60));
    console.log('  Evaluation Complete');
    console.log('='.repeat(60));
    console.log(`  Status:       completed`);
    console.log(`  Total Tests:  ${summary.totalTests}`);
    console.log(`  Avg Similarity: ${(summary.avgSimilarity * 100).toFixed(1)}%`);
    console.log(`  Success Rate: ${summary.successCount}/${summary.totalTests}`);
    console.log(`  Issues Count: ${summary.issuesCount}`);
    console.log('='.repeat(60));

    console.log(`EVAL_RESULT_PATH=${outputPath}`);
  } catch (error) {
    console.error('Evaluation failed:', (error as Error).message);
    process.exit(1);
  } finally {
    clearInterval(progressInterval);
  }
}

program.parseAsync(process.argv).catch((error) => {
  console.error('Error:', (error as Error).message);
  process.exit(1);
});
