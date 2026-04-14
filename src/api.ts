import { retrieve as _retrieve, getSkillInfo } from './core/retriever';
import type { Skill, SkillInfo } from './core/types';

export type { Skill, SkillInfo };


/**
 * Retrieve skills based on a query.
 *
 * @param query The search query for skills.
 * @param library The library to search within (default: 'g2').
 * @param topk The number of top results to return (default: 7).
 * @param content Whether to include markdown content body (without frontmatter) of each skill (default: false).
 * @example retrieve('bar chart', 'g2', 1);
 * @returns An array of skills matching the query.
 */
export function retrieve(query: string, library = 'g2', topk = 7, content = false): Skill[] {
  return _retrieve(query, { library, topK: topk, content });
}

/**
 * Get skill info embedded in the library index.
 *
 * @param library The library to get info for (default: 'g2').
 * @example info('g2');
 * @returns The skill info, or undefined if not available.
 */
export function info(library = 'g2'): SkillInfo | undefined {
  return getSkillInfo(library);
}
