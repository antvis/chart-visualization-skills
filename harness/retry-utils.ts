/**
 * Retry Utilities
 *
 * Jittered exponential back-off to avoid thundering-herd effects when
 * multiple harness instances or concurrent requests hit the API at the
 * same moment.
 *
 * Inspired by hermes/agent/retry_utils.py
 */

'use strict';

/**
 * Compute the delay (ms) for a given attempt using jittered exponential back-off.
 *
 * @param {number} attempt        - 1-based attempt number (1 = first retry)
 * @param {object} [opts]
 * @param {number} [opts.baseMs=5000]    - delay for attempt 1 (ms)
 * @param {number} [opts.maxMs=120000]   - upper cap (ms)
 * @param {number} [opts.jitterRatio=0.5] - fraction of delay added as random noise
 * @returns {number} delay in milliseconds
 */
function jitteredBackoff(attempt, { baseMs = 5_000, maxMs = 120_000, jitterRatio = 0.5 } = {}) {
  const exponent = Math.max(0, attempt - 1);
  const delay = Math.min(baseMs * Math.pow(2, exponent), maxMs);
  const jitter = Math.random() * jitterRatio * delay;
  return Math.round(delay + jitter);
}

/**
 * Execute an async function with automatic retries on failure.
 *
 * @param {() => Promise<any>} fn        - async operation to attempt
 * @param {object} [opts]
 * @param {number}   [opts.maxAttempts=3]
 * @param {number}   [opts.baseMs=5000]
 * @param {number}   [opts.maxMs=120000]
 * @param {number}   [opts.jitterRatio=0.5]
 * @param {(err: Error, attempt: number) => boolean} [opts.shouldRetry]
 *   - optional predicate; return false to stop retrying early.
 *   - defaults to always retry until maxAttempts is exhausted.
 * @param {(err: Error, attempt: number, delayMs: number) => void} [opts.onRetry]
 *   - optional callback invoked before each retry sleep.
 * @returns {Promise<any>}
 * @throws the last error if all attempts are exhausted
 */
async function withRetry(fn, opts = {}) {
  const {
    maxAttempts = 3,
    baseMs = 5_000,
    maxMs = 120_000,
    jitterRatio = 0.5,
    shouldRetry = () => true,
    onRetry = null,
  } = opts;

  let lastErr;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;

      const isLast = attempt === maxAttempts;
      if (isLast || !shouldRetry(err, attempt)) {
        throw err;
      }

      const delayMs = jitteredBackoff(attempt, { baseMs, maxMs, jitterRatio });

      if (onRetry) {
        onRetry(err, attempt, delayMs);
      } else {
        console.warn(
          `[retry] attempt ${attempt}/${maxAttempts} failed: ${err.message}. ` +
          `Retrying in ${(delayMs / 1000).toFixed(1)}s...`
        );
      }

      await sleep(delayMs);
    }
  }

  throw lastErr;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { jitteredBackoff, withRetry, sleep };
