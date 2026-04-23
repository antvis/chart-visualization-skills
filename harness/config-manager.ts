/**
 * Config Manager
 *
 * Merges configuration from multiple sources with a well-defined priority order:
 *
 *   CLI args  >  ~/.harness/config.json  >  HARNESS_* env vars  >  built-in defaults
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

export interface HarnessConfig {
  library: string;
  sample: number;
  full: boolean;
  retrieval: string;
  passes: number;
  maxIterations: number;
  concurrency: number;
  dryRun: boolean;
  worktree: boolean;
  skipScore: boolean;
  scoreThreshold: number;
  optimizeModel: string;
  totalDuration: number;
  highSimilarityCount: number;
  issuesCount: number;
  skillHitCount: number;
  successCount: number;
}

const DEFAULTS: HarnessConfig = {
  library: 'g2',
  sample: 10,
  full: false,
  retrieval: 'tool-call',
  passes: 3,
  maxIterations: 20,
  concurrency: 5,
  dryRun: false,
  worktree: true,
  skipScore: true,
  scoreThreshold: 0.6,
  optimizeModel: '',
  totalDuration: 0,
  highSimilarityCount: 0,
  issuesCount: 0,
  skillHitCount: 0,
  successCount: 0,
};

const ENV_MAP: Record<string, keyof HarnessConfig> = {
  HARNESS_LIBRARY: 'library',
  HARNESS_SAMPLE: 'sample',
  HARNESS_FULL: 'full',
  HARNESS_RETRIEVAL: 'retrieval',
  HARNESS_PASSES: 'passes',
  HARNESS_MAX_ITERATIONS: 'maxIterations',
  HARNESS_CONCURRENCY: 'concurrency',
  HARNESS_DRY_RUN: 'dryRun',
  HARNESS_SKIP_SCORE: 'skipScore',
  HARNESS_SCORE_THRESHOLD: 'scoreThreshold',
  HARNESS_OPTIMIZE_MODEL: 'optimizeModel',
  LOOP_LIBRARY: 'library',
  LOOP_SAMPLE: 'sample',
  LOOP_RETRIEVAL: 'retrieval',
  LOOP_CONCURRENCY: 'concurrency',
  LOOP_SCORE_THRESHOLD: 'scoreThreshold',
};

function coerce(key: keyof HarnessConfig, raw: unknown): unknown {
  const def = DEFAULTS[key];
  switch (typeof def) {
    case 'number':
      return Number(raw);
    case 'boolean':
      return raw === true || raw === '1' || raw === 'true';
    default:
      return raw;
  }
}

function readConfigFile(filePath: string): Partial<HarnessConfig> {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8').trim();
      return JSON.parse(raw) as Partial<HarnessConfig>;
    }
  } catch (e) {
    console.warn(`[config] Could not parse config file ${filePath}: ${(e as Error).message}`);
  }
  return {};
}

interface SchemaRule {
  type: 'string' | 'number';
  enum?: string[];
  min?: number;
  max?: number;
}

const SCHEMA: Partial<Record<keyof HarnessConfig, SchemaRule>> = {
  retrieval:      { type: 'string',  enum: ['tool-call', 'bm25', 'context7'] },
  sample:         { type: 'number',  min: 1 },
  passes:         { type: 'number',  min: 1 },
  maxIterations:  { type: 'number',  min: 1 },
  concurrency:    { type: 'number',  min: 1 },
  scoreThreshold: { type: 'number',  min: 0, max: 1 },
};

export function validate(cfg: HarnessConfig): void {
  const errors: string[] = [];

  for (const [key, rule] of Object.entries(SCHEMA) as [keyof HarnessConfig, SchemaRule][]) {
    const val = cfg[key];
    if (val === undefined || val === null) continue;

    if (rule.type && typeof val !== rule.type) {
      errors.push(`"${key}" must be a ${rule.type}, got ${typeof val} (${JSON.stringify(val)})`);
      continue;
    }
    if (rule.enum && !rule.enum.includes(val as string)) {
      errors.push(`"${key}" must be one of [${rule.enum.join(', ')}], got "${val}"`);
    }
    if (rule.min !== undefined && (val as number) < rule.min) {
      errors.push(`"${key}" must be >= ${rule.min}, got ${val}`);
    }
    if (rule.max !== undefined && (val as number) > rule.max) {
      errors.push(`"${key}" must be <= ${rule.max}, got ${val}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`[config] Invalid configuration:\n  ${errors.join('\n  ')}`);
  }
}

export function load(cliOpts: Record<string, unknown> = {}): HarnessConfig {
  const result = { ...DEFAULTS };

  const configFilePath =
    process.env.HARNESS_CONFIG ||
    path.join(os.homedir(), '.harness', 'config.json');
  const fileConfig = readConfigFile(configFilePath);
  for (const [k, v] of Object.entries(fileConfig)) {
    const key = k as keyof HarnessConfig;
    if (key in result) (result as Record<string, unknown>)[key] = coerce(key, v);
  }

  for (const [envKey, configKey] of Object.entries(ENV_MAP)) {
    const val = process.env[envKey];
    if (val === undefined || val === '') continue;
    if (envKey === 'HARNESS_NO_WORKTREE') {
      result.worktree = !(val === '1' || val === 'true');
    } else {
      (result as Record<string, unknown>)[configKey] = coerce(configKey, val);
    }
  }

  for (const [k, v] of Object.entries(cliOpts)) {
    const key = k as keyof HarnessConfig;
    if (v !== undefined && v !== null && key in result) {
      (result as Record<string, unknown>)[key] = coerce(key, v);
    }
  }

  validate(result);
  return result;
}

export function save(patch: Partial<HarnessConfig>): void {
  const filePath =
    process.env.HARNESS_CONFIG ||
    path.join(os.homedir(), '.harness', 'config.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const existing = readConfigFile(filePath);
  for (const [k, v] of Object.entries(patch)) {
    const key = k as keyof HarnessConfig;
    if (key in DEFAULTS) (existing as Record<string, unknown>)[key] = v;
  }
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  console.log(`[config] Saved to ${filePath}`);
}

export { DEFAULTS, ENV_MAP, SCHEMA };
