/**
 * Config Manager
 *
 * Merges configuration from multiple sources with a well-defined priority order:
 *
 *   CLI args  >  ~/.harness/config.json  >  HARNESS_* env vars  >  built-in defaults
 *
 * This lets users persist common settings (model, concurrency, library) in a
 * config file instead of repeating CLI flags on every run.
 *
 * Config file location: ~/.harness/config.json  (or HARNESS_CONFIG env var)
 *
 * Inspired by hermes/hermes_cli/config.py
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULTS = {
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
  totalDuration: 0,
  highSimilarityCount: 0,
  issuesCount: 0,
  skillHitCount: 0,
  successCount: 0
};

// ── Env var name mapping  (HARNESS_<UPPER_SNAKE> → camelCase key) ─────────────

const ENV_MAP = {
  HARNESS_LIBRARY: 'library',
  HARNESS_SAMPLE: 'sample',
  HARNESS_FULL: 'full',
  HARNESS_RETRIEVAL: 'retrieval',
  HARNESS_PASSES: 'passes',
  HARNESS_MAX_ITERATIONS: 'maxIterations',
  HARNESS_CONCURRENCY: 'concurrency',
  HARNESS_DRY_RUN: 'dryRun',
  HARNESS_NO_WORKTREE: 'worktree', // inverted: set to '1' → worktree: false
  HARNESS_SKIP_SCORE: 'skipScore',
  HARNESS_SCORE_THRESHOLD: 'scoreThreshold',
  // Legacy / existing env vars kept for backwards-compat
  LOOP_LIBRARY: 'library',
  LOOP_SAMPLE: 'sample',
  LOOP_RETRIEVAL: 'retrieval',
  LOOP_CONCURRENCY: 'concurrency',
  LOOP_SCORE_THRESHOLD: 'scoreThreshold'
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function coerce(key, raw) {
  const def = DEFAULTS[key];
  if (def === undefined) return raw;
  switch (typeof def) {
    case 'number':
      return Number(raw);
    case 'boolean':
      return raw === true || raw === '1' || raw === 'true';
    default:
      return raw;
  }
}

function readConfigFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8').trim();
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn(
      `[config] Could not parse config file ${filePath}: ${e.message}`
    );
  }
  return {};
}

// ── Validation schema ─────────────────────────────────────────────────────────

const SCHEMA = {
  retrieval:      { type: 'string',  enum: ['tool-call', 'bm25', 'context7'] },
  sample:         { type: 'number',  min: 1 },
  passes:         { type: 'number',  min: 1 },
  maxIterations:  { type: 'number',  min: 1 },
  concurrency:    { type: 'number',  min: 1 },
  scoreThreshold: { type: 'number',  min: 0, max: 1 },
};

/**
 * Validate a resolved config object against SCHEMA.
 * Throws a descriptive Error on the first violation found.
 *
 * @param {object} cfg - resolved config (output of load())
 */
function validate(cfg) {
  const errors = [];

  for (const [key, rule] of Object.entries(SCHEMA)) {
    const val = cfg[key];
    if (val === undefined || val === null) continue;

    if (rule.type && typeof val !== rule.type) {
      errors.push(`"${key}" must be a ${rule.type}, got ${typeof val} (${JSON.stringify(val)})`);
      continue;
    }
    if (rule.enum && !rule.enum.includes(val)) {
      errors.push(`"${key}" must be one of [${rule.enum.join(', ')}], got "${val}"`);
    }
    if (rule.min !== undefined && val < rule.min) {
      errors.push(`"${key}" must be >= ${rule.min}, got ${val}`);
    }
    if (rule.max !== undefined && val > rule.max) {
      errors.push(`"${key}" must be <= ${rule.max}, got ${val}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`[config] Invalid configuration:\n  ${errors.join('\n  ')}`);
  }
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Build the final resolved config by merging all sources.
 *
 * @param {object} [cliOpts={}]  - parsed commander opts (highest priority)
 * @returns {object}             - merged config object (same keys as DEFAULTS)
 */
function load(cliOpts = {}) {
  // 1. Start from built-in defaults
  const result = { ...DEFAULTS };

  // 2. Config file  (~/.harness/config.json or HARNESS_CONFIG)
  const configFilePath =
    process.env.HARNESS_CONFIG ||
    path.join(os.homedir(), '.harness', 'config.json');
  const fileConfig = readConfigFile(configFilePath);
  for (const [k, v] of Object.entries(fileConfig)) {
    if (k in result) result[k] = coerce(k, v);
  }

  // 3. HARNESS_* / LOOP_* env vars
  for (const [envKey, configKey] of Object.entries(ENV_MAP)) {
    const val = process.env[envKey];
    if (val === undefined || val === '') continue;
    // HARNESS_NO_WORKTREE inverts the boolean
    if (envKey === 'HARNESS_NO_WORKTREE') {
      result.worktree = !(val === '1' || val === 'true');
    } else {
      result[configKey] = coerce(configKey, val);
    }
  }

  // 4. CLI args (only override when the value is not the commander default sentinel)
  for (const [k, v] of Object.entries(cliOpts)) {
    if (v !== undefined && v !== null && k in result) {
      result[k] = coerce(k, v);
    }
  }

  validate(result);
  return result;
}

/**
 * Write user preferences back to the config file.
 * Only keys present in DEFAULTS are persisted.
 *
 * @param {object} patch - key/value pairs to save
 */
function save(patch) {
  const filePath =
    process.env.HARNESS_CONFIG ||
    path.join(os.homedir(), '.harness', 'config.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const existing = readConfigFile(filePath);
  for (const [k, v] of Object.entries(patch)) {
    if (k in DEFAULTS) existing[k] = v;
  }
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  console.log(`[config] Saved to ${filePath}`);
}

module.exports = { load, save, validate, DEFAULTS, ENV_MAP, SCHEMA };
