import {
  retrieve as _retrieve,
  availableLibraries,
  invalidateCaches as _invalidateCaches,
} from './core/retriever';
import type {
  Doc,
  RetrieveOptions,
} from './core/types';

export type { Doc, RetrieveOptions };

/**
 * Retrieve docs based on a query. Returns doc content by default.
 *
 * @example retrieve('bar chart', { library: 'g2', topK: 5 })
 * @example retrieve('bar chart', { library: 'g2', content: false })  // metadata only
 *
 * Legacy positional signature still supported for backwards compatibility.
 * @example retrieve('bar chart', 'g2', 5, true)
 */
export function retrieve(query: string, options?: RetrieveOptions): Promise<Doc[]>;
/** @deprecated Use the options-object overload instead. */
export function retrieve(
  query: string,
  library?: string,
  topk?: number,
  content?: boolean
): Promise<Doc[]>;
export async function retrieve(
  query: string,
  libraryOrOpts?: string | RetrieveOptions,
  topk = 7,
  content = true
): Promise<Doc[]> {
  if (typeof libraryOrOpts === 'string' || libraryOrOpts === undefined) {
    return await _retrieve(query, { library: libraryOrOpts, topK: topk, content });
  }
  return await _retrieve(query, libraryOrOpts);
}

/**
 * Return the list of libraries that have a built index on disk.
 * @example libraries() // ['g2', 'g6']
 */
export function libraries(): string[] {
  return availableLibraries();
}

/**
 * Invalidate all caches (Context instance).
 * Useful when indexes are rebuilt at runtime.
 */
export async function invalidateCaches(): Promise<void> {
  return _invalidateCaches();
}
