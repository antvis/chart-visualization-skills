/**
 * Error Classifier
 *
 * Classifies errors thrown during the harness loop and returns a structured
 * recovery action so the controller can react differently per error type
 * instead of always calling process.exit(1).
 *
 * Inspired by hermes/agent/error_classifier.py
 */

'use strict';

// ── Error reason enum ─────────────────────────────────────────────────────────

const Reason = Object.freeze({
  RATE_LIMIT:       'rate_limit',       // 429 — back off then retry
  OVERLOADED:       'overloaded',       // 503/529 — short back off then retry
  AUTH:             'auth',             // 401/403 transient — retry once
  AUTH_PERMANENT:   'auth_permanent',   // 401/403 persistent — abort
  BILLING:          'billing',          // 402 — abort
  CONTEXT_OVERFLOW: 'context_overflow', // too many tokens — reduce sample
  TIMEOUT:          'timeout',          // request timeout — retry
  EVAL_FAILED:      'eval_failed',      // eval CLI exited non-zero
  INDEX_FAILED:     'index_failed',     // index build failed
  NOT_FOUND:        'not_found',        // 404 — wrong endpoint / model
  UNKNOWN:          'unknown',          // catch-all
});

// ── Recovery action shape ─────────────────────────────────────────────────────
//
// {
//   reason:        Reason.*
//   shouldRetry:   boolean   — attempt the same operation again
//   maxRetries:    number    — how many times to retry
//   reduceSample:  boolean   — halve the eval sample before retrying
//   abort:         boolean   — give up and exit
//   suggestedDelayMs: number — initial back-off before first retry
// }

const ACTIONS = {
  [Reason.RATE_LIMIT]:       { shouldRetry: true,  maxRetries: 4, reduceSample: false, abort: false, suggestedDelayMs: 15_000 },
  [Reason.OVERLOADED]:       { shouldRetry: true,  maxRetries: 3, reduceSample: false, abort: false, suggestedDelayMs:  8_000 },
  [Reason.AUTH]:             { shouldRetry: true,  maxRetries: 1, reduceSample: false, abort: false, suggestedDelayMs:  2_000 },
  [Reason.AUTH_PERMANENT]:   { shouldRetry: false, maxRetries: 0, reduceSample: false, abort: true,  suggestedDelayMs:      0 },
  [Reason.BILLING]:          { shouldRetry: false, maxRetries: 0, reduceSample: false, abort: true,  suggestedDelayMs:      0 },
  [Reason.CONTEXT_OVERFLOW]: { shouldRetry: true,  maxRetries: 2, reduceSample: true,  abort: false, suggestedDelayMs:  1_000 },
  [Reason.TIMEOUT]:          { shouldRetry: true,  maxRetries: 3, reduceSample: false, abort: false, suggestedDelayMs:  5_000 },
  [Reason.EVAL_FAILED]:      { shouldRetry: true,  maxRetries: 2, reduceSample: false, abort: false, suggestedDelayMs:  2_000 },
  [Reason.INDEX_FAILED]:     { shouldRetry: true,  maxRetries: 2, reduceSample: false, abort: false, suggestedDelayMs:  3_000 },
  [Reason.NOT_FOUND]:        { shouldRetry: false, maxRetries: 0, reduceSample: false, abort: true,  suggestedDelayMs:      0 },
  [Reason.UNKNOWN]:          { shouldRetry: true,  maxRetries: 1, reduceSample: false, abort: false, suggestedDelayMs:  3_000 },
};

// ── Classification logic ──────────────────────────────────────────────────────

/**
 * Classify an error and return the recommended recovery action.
 *
 * @param {Error} err
 * @returns {{ reason: string, action: object }}
 */
function classify(err) {
  const msg = (err?.message || '').toLowerCase();
  const status = err?.status ?? err?.statusCode ?? parseStatusFromMessage(msg);

  let reason;

  if (status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
    reason = Reason.RATE_LIMIT;
  } else if (status === 402 || msg.includes('billing') || msg.includes('insufficient')) {
    reason = Reason.BILLING;
  } else if (status === 401 || status === 403) {
    // Treat as permanent only when message explicitly says so
    reason = msg.includes('invalid api key') || msg.includes('unauthorized')
      ? Reason.AUTH_PERMANENT
      : Reason.AUTH;
  } else if (status === 404 || msg.includes('not found') || msg.includes('no such model')) {
    reason = Reason.NOT_FOUND;
  } else if (status === 503 || status === 529 || msg.includes('overload') || msg.includes('server error')) {
    reason = Reason.OVERLOADED;
  } else if (
    msg.includes('context') && (msg.includes('length') || msg.includes('too long') || msg.includes('overflow')) ||
    msg.includes('max_tokens') || msg.includes('token limit') || msg.includes('payload too large') || status === 413
  ) {
    reason = Reason.CONTEXT_OVERFLOW;
  } else if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('econnreset') || msg.includes('socket hang up')) {
    reason = Reason.TIMEOUT;
  } else if (msg.includes('eval process exited')) {
    reason = Reason.EVAL_FAILED;
  } else if (msg.includes('index build exited')) {
    reason = Reason.INDEX_FAILED;
  } else {
    reason = Reason.UNKNOWN;
  }

  return { reason, action: ACTIONS[reason] };
}

/**
 * Extract an HTTP status code embedded in an error message string.
 * e.g. "Request failed with status code 429"
 */
function parseStatusFromMessage(msg) {
  const m = msg.match(/\b(4\d{2}|5\d{2})\b/);
  return m ? parseInt(m[1], 10) : null;
}

module.exports = { classify, Reason, ACTIONS };
