import {
  retrieve as _retrieve,
  getDocById as _getDocById,
  getDocInfo,
  availableLibraries,
  listDocs as _listDocs
} from './core/retriever';
import type {
  Doc,
  DocInfo,
  RetrieveOptions,
  ListOptions
} from './core/types';

export type { Doc, DocInfo, RetrieveOptions, ListOptions };

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
 * Get a single doc by its exact ID.
 *
 * @param id      The doc ID (e.g. 'g2-mark-bar').
 * @param library Optional: restrict the search to a specific library.
 * @returns The doc with full content, or undefined if not found.
 * @example getDocById('g2-mark-bar')
 */
export function getDocById(id: string, library?: string): Doc | undefined {
  return _getDocById(id, library);
}

/**
 * Get doc info embedded in the library index.
 *
 * @param library The library to get info for (default: 'g2').
 * @example info('g2')
 * @returns The doc info, or undefined if not available.
 */
export function info(library = 'g2'): DocInfo | undefined {
  return getDocInfo(library);
}

/**
 * Return the list of libraries that have a built index on disk.
 * @example libraries() // ['g2', 'g6']
 */
export function libraries(): string[] {
  return availableLibraries();
}

/**
 * List available docs, optionally filtered by library, category or tags.
 * @param options Filter options.
 * @example listDocs({ library: 'g2', tags: ['bar'] })
 */
export function listDocs(options: ListOptions = {}): Doc[] {
  return _listDocs(options);
}
