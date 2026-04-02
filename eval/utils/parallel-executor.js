/**
 * Parallel Executor
 *
 * Executes tasks concurrently with configurable concurrency limit.
 * Provides progress tracking and error isolation.
 */

class ParallelExecutor {
  /**
   * Create a parallel executor
   * @param {Array} items - Items to process
   * @param {Function} processor - Async function to process each item: (item, index) => result
   * @param {Object} options - Configuration options
   */
  constructor(items, processor, options = {}) {
    this.items = items;
    this.processor = processor;
    this.concurrency = options.concurrency || 3;
    this.progressCallback = null;
    this.errorCallback = null;
    this.results = [];
    this.errors = [];
  }

  /**
   * Set progress callback
   * @param {Function} callback - (current, total, result) => void
   */
  onProgress(callback) {
    this.progressCallback = callback;
    return this;
  }

  /**
   * Set error callback
   * @param {Function} callback - (error, item, index) => void
   */
  onError(callback) {
    this.errorCallback = callback;
    return this;
  }

  /**
   * Run the executor
   * @returns {Promise<Array>} Array of results
   */
  async run() {
    const { items, processor, concurrency } = this;
    const total = items.length;
    const results = new Array(total);
    let completed = 0;

    // Create work queue
    const queue = [...items.entries()];
    const active = new Set();

    const processNext = async () => {
      if (queue.length === 0) return;

      const [index, item] = queue.shift();

      const promise = (async () => {
        try {
          const result = await processor(item, index);
          results[index] = result;
          completed++;

          if (this.progressCallback) {
            this.progressCallback(completed, total, result);
          }

          return result;
        } catch (error) {
          this.errors.push({ index, item, error });

          if (this.errorCallback) {
            this.errorCallback(error, item, index);
          }

          // Return error result instead of throwing
          results[index] = { error: error.message, item };
          completed++;

          return results[index];
        }
      })();

      active.add(promise);
      promise.finally(() => active.delete(promise));

      // If at concurrency limit, wait for one to complete
      if (active.size >= concurrency) {
        await Promise.race(active);
      }

      // Process next item
      return processNext();
    };

    // Start initial batch
    const starters = [];
    for (let i = 0; i < Math.min(concurrency, items.length); i++) {
      starters.push(processNext());
    }

    // Wait for all to complete
    await Promise.all(starters);
    await Promise.all([...active]);

    this.results = results;
    return results;
  }

  /**
   * Get execution statistics
   * @returns {Object} Stats object
   */
  getStats() {
    const successCount = this.results.filter((r) => !r?.error).length;
    return {
      total: this.items.length,
      completed: this.results.length,
      success: successCount,
      errors: this.errors.length,
      errorRate: this.errors.length / (this.items.length || 1)
    };
  }
}

/**
 * Batch executor - simpler API for one-off parallel execution
 * @param {Array} items - Items to process
 * @param {Function} processor - Async processor function
 * @param {Object} options - Options
 * @returns {Promise<Array>} Results
 */
async function parallelMap(items, processor, options = {}) {
  const executor = new ParallelExecutor(items, processor, options);
  return executor.run();
}

/**
 * Run tasks in parallel chunks
 * @param {Array} items - Items to process
 * @param {Function} processor - Async processor function
 * @param {number} chunkSize - Size of each chunk
 * @returns {Promise<Array>} Results
 */
async function parallelChunks(items, processor, chunkSize = 5) {
  const results = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map((item, idx) => processor(item, i + idx))
    );
    results.push(...chunkResults);
  }

  return results;
}

module.exports = ParallelExecutor;
module.exports.parallelMap = parallelMap;
module.exports.parallelChunks = parallelChunks;
