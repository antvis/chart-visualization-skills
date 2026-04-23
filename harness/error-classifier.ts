/**
 * Error Classifier
 *
 * Classifies errors thrown during the harness loop and returns a structured
 * recovery action so the controller can react differently per error type
 * instead of always calling process.exit(1).
 */

export const Reason = Object.freeze({
  RATE_LIMIT:       'rate_limit',
  OVERLOADED:       'overloaded',
  AUTH:             'auth',
  AUTH_PERMANENT:   'auth_permanent',
  BILLING:          'billing',
  CONTEXT_OVERFLOW: 'context_overflow',
  TIMEOUT:          'timeout',
  CONNECTION:       'connection',
  EVAL_FAILED:      'eval_failed',
  INDEX_FAILED:     'index_failed',
  NOT_FOUND:        'not_found',
  UNKNOWN:          'unknown',
} as const);

export type ReasonType = typeof Reason[keyof typeof Reason];

export interface RecoveryAction {
  shouldRetry: boolean;
  maxRetries: number;
  reduceSample: boolean;
  abort: boolean;
  suggestedDelayMs: number;
}

const ACTIONS: Record<ReasonType, RecoveryAction> = {
  [Reason.RATE_LIMIT]:       { shouldRetry: true,  maxRetries: 4, reduceSample: false, abort: false, suggestedDelayMs: 15_000 },
  [Reason.OVERLOADED]:       { shouldRetry: true,  maxRetries: 3, reduceSample: false, abort: false, suggestedDelayMs:  8_000 },
  [Reason.AUTH]:             { shouldRetry: true,  maxRetries: 1, reduceSample: false, abort: false, suggestedDelayMs:  2_000 },
  [Reason.AUTH_PERMANENT]:   { shouldRetry: false, maxRetries: 0, reduceSample: false, abort: true,  suggestedDelayMs:      0 },
  [Reason.BILLING]:          { shouldRetry: false, maxRetries: 0, reduceSample: false, abort: true,  suggestedDelayMs:      0 },
  [Reason.CONTEXT_OVERFLOW]: { shouldRetry: true,  maxRetries: 2, reduceSample: true,  abort: false, suggestedDelayMs:  1_000 },
  [Reason.TIMEOUT]:          { shouldRetry: true,  maxRetries: 3, reduceSample: false, abort: false, suggestedDelayMs:  5_000 },
  [Reason.CONNECTION]:       { shouldRetry: true,  maxRetries: 4, reduceSample: false, abort: false, suggestedDelayMs: 10_000 },
  [Reason.EVAL_FAILED]:      { shouldRetry: true,  maxRetries: 2, reduceSample: false, abort: false, suggestedDelayMs:  2_000 },
  [Reason.INDEX_FAILED]:     { shouldRetry: true,  maxRetries: 2, reduceSample: false, abort: false, suggestedDelayMs:  3_000 },
  [Reason.NOT_FOUND]:        { shouldRetry: false, maxRetries: 0, reduceSample: false, abort: true,  suggestedDelayMs:      0 },
  [Reason.UNKNOWN]:          { shouldRetry: true,  maxRetries: 1, reduceSample: false, abort: false, suggestedDelayMs:  3_000 },
};

function parseStatusFromMessage(msg: string): number | null {
  const m = msg.match(/\b(4\d{2}|5\d{2})\b/);
  return m ? parseInt(m[1], 10) : null;
}

export function classify(err: unknown): { reason: ReasonType; action: RecoveryAction } {
  const e = err as { message?: string; status?: number; statusCode?: number };
  const msg = (e?.message || '').toLowerCase();
  const status = e?.status ?? e?.statusCode ?? parseStatusFromMessage(msg);

  let reason: ReasonType;

  if (status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
    reason = Reason.RATE_LIMIT;
  } else if (status === 402 || msg.includes('billing') || msg.includes('insufficient')) {
    reason = Reason.BILLING;
  } else if (status === 401 || status === 403) {
    reason = msg.includes('invalid api key') || msg.includes('unauthorized')
      ? Reason.AUTH_PERMANENT
      : Reason.AUTH;
  } else if (status === 404 || msg.includes('not found') || msg.includes('no such model')) {
    reason = Reason.NOT_FOUND;
  } else if (status === 503 || status === 529 || msg.includes('overload') || msg.includes('server error')) {
    reason = Reason.OVERLOADED;
  } else if (
    (msg.includes('context') && (msg.includes('length') || msg.includes('too long') || msg.includes('overflow'))) ||
    msg.includes('max_tokens') || msg.includes('token limit') || msg.includes('payload too large') || status === 413
  ) {
    reason = Reason.CONTEXT_OVERFLOW;
  } else if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('econnreset') || msg.includes('socket hang up')) {
    reason = Reason.TIMEOUT;
  } else if (
    msg.includes('connection error') || msg.includes('econnrefused') ||
    msg.includes('network error')    || msg.includes('fetch failed')  ||
    msg.includes('enotfound')        || msg.includes('epipe')
  ) {
    reason = Reason.CONNECTION;
  } else if (msg.includes('eval process exited')) {
    reason = Reason.EVAL_FAILED;
  } else if (msg.includes('index build exited')) {
    reason = Reason.INDEX_FAILED;
  } else {
    reason = Reason.UNKNOWN;
  }

  return { reason, action: ACTIONS[reason] };
}

export { ACTIONS };
