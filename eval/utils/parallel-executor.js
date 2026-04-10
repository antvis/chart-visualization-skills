'use strict';

/**
 * Parallel Executor
 *
 * Thin wrapper around p-limit that preserves the existing parallelMap() interface.
 * Replaces the hand-written shared-index worker pool, eliminating the non-atomic
 * nextIndex++ race condition while keeping callers unchanged.
 */

const pLimit = require('p-limit');

/**
 * Execute items concurrently up to the given concurrency limit.
 *
 * @param {Array}    items       - Items to process
 * @param {Function} processor  - async (item, index) => result
 * @param {object}   [opts]
 * @param {number}   [opts.concurrency=5]
 * @param {Function} [opts.onProgress]  - ({ done, total, result }) => void
 * @param {Function} [opts.onError]     - (err, item, index) => void
 * @returns {Promise<Array>} Results in original order (null for failed items)
 */
async function parallelMap(items, processor, opts = {}) {
  const { concurrency = 5, onProgress, onError } = opts;
  const limit = pLimit(concurrency);
  let done = 0;

  const tasks = items.map((item, i) =>
    limit(async () => {
      try {
        const result = await processor(item, i);
        onProgress?.({ done: ++done, total: items.length, result });
        return result;
      } catch (err) {
        onError?.(err, item, i);
        onProgress?.({ done: ++done, total: items.length, result: null });
        return null;
      }
    })
  );

  return Promise.all(tasks);
}

module.exports = { parallelMap };
