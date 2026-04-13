import { retrieve as _retrieve } from './core/retriever';
import type { Skill } from './core/types';

export type { Skill };

/**
 * Retrieve skills based on a query.
 *
 * @param query The search query for skills.
 * @param library The library to search within (default: 'g2').
 * @param topk The number of top results to return (default: 7).
 * @param includeContent Whether to include full markdown content of each skill (default: false).
 * @example retrieve('bar chart', 'g2', 1);
 * @returns An array of skills matching the query.
 */
export function retrieve(query: string, library = 'g2', topk = 7, includeContent = false): Skill[] {
  return _retrieve(query, { library, topK: topk, includeContent });
}
