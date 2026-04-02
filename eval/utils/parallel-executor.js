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
    let nextIndex = 0;

    // Each worker pulls from the shared index counter and loops until queue empty
    const worker = async () => {
      while (true) {
        const index = nextIndex++;
        if (index >= total) return;

        const item = items[index];
        try {
          const result = await processor(item, index);
          results[index] = result;
          completed++;

          if (this.progressCallback) {
            this.progressCallback(completed, total, result);
          }
        } catch (error) {
          this.errors.push({ index, item, error });

          if (this.errorCallback) {
            this.errorCallback(error, item, index);
          }

          results[index] = { error: error.message, item };
          completed++;
        }
      }
    };

    // Start exactly `concurrency` workers
    const workers = [];
    for (let i = 0; i < Math.min(concurrency, total); i++) {
      workers.push(worker());
    }
    await Promise.all(workers);

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
