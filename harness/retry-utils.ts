/**
 * Retry Utilities
 *
 * Jittered exponential back-off to avoid thundering-herd effects when
 * multiple harness instances or concurrent requests hit the API at the
 * same moment.
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseMs?: number;
  maxMs?: number;
  jitterRatio?: number;
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
}

export function jitteredBackoff(
  attempt: number,
  { baseMs = 5_000, maxMs = 120_000, jitterRatio = 0.5 }: {
    baseMs?: number;
    maxMs?: number;
    jitterRatio?: number;
  } = {}
): number {
  const exponent = Math.max(0, attempt - 1);
  const delay = Math.min(baseMs * Math.pow(2, exponent), maxMs);
  const jitter = Math.random() * jitterRatio * delay;
  return Math.round(delay + jitter);
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const {
    maxAttempts = 3,
    baseMs = 5_000,
    maxMs = 120_000,
    jitterRatio = 0.5,
    shouldRetry = () => true,
    onRetry = null,
  } = opts;

  let lastErr: unknown;

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
        const msg = (err as Error)?.message ?? String(err);
        console.warn(
          `[retry] attempt ${attempt}/${maxAttempts} failed: ${msg}. ` +
          `Retrying in ${(delayMs / 1000).toFixed(1)}s...`
        );
      }

      await sleep(delayMs);
    }
  }

  throw lastErr;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
