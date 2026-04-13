import { retrieve as _retrieve } from './core/retriever';
import type { Skill } from './core/types';

export type { Skill };

export type RetrieveOptions = {
  includeContent?: boolean;
};

/**
 * Retrieve skills based on a query.
 *
 * @param query The search query for skills.
 * @param library The library to search within (default: 'g2').
 * @param topk The number of top results to return (default: 7).
 * @param indexDir The directory of the index (optional).
 * @param options Additional options for retrieval. Currently supports:
 *   - includeContent: Whether to load the full markdown content of each skill (default: false).
 * @example retrieve('bar chart', 'g2', 1);
 * @returns An array of skills matching the query.
 */
export function retrieve(query: string, library = 'g2', topk = 7, indexDir?: string, options: RetrieveOptions = {}): Skill[] {
  const { includeContent = false } = options;
  return _retrieve(query, { library, topK: topk, indexDir, includeContent });
}
