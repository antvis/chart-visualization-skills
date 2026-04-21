/**
 * Parallel Executor — p-limit wrapper preserving parallelMap() interface.
 */

import pLimit from 'p-limit';

export interface ParallelMapOptions<T> {
  concurrency?: number;
  onProgress?: (info: { done: number; total: number; result: T | null }) => void;
  onError?: (err: Error, item: unknown, index: number) => void;
}

export async function parallelMap<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  opts: ParallelMapOptions<R> = {}
): Promise<(R | null)[]> {
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
        onError?.(err as Error, item, i);
        onProgress?.({ done: ++done, total: items.length, result: null });
        return null;
      }
    })
  );

  return Promise.all(tasks);
}
