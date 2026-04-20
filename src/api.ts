import {
  retrieve as _retrieve,
  getSkillById as _getSkillById,
  getSkillInfo,
  availableLibraries
} from './core/retriever';
import type { Skill, SkillInfo, RetrieveOptions } from './core/types';

export type { Skill, SkillInfo, RetrieveOptions };

/**
 * Retrieve skills based on a query.
 *
 * Preferred: pass an options object.
 * @example retrieve('bar chart', { library: 'g2', topK: 5, content: true })
 *
 * Legacy positional signature still supported for backwards compatibility.
 * @example retrieve('bar chart', 'g2', 5, true)
 */
export function retrieve(query: string, options?: RetrieveOptions): Skill[];
/** @deprecated Use the options-object overload instead. */
export function retrieve(
  query: string,
  library?: string,
  topk?: number,
  content?: boolean
): Skill[];
export function retrieve(
  query: string,
  libraryOrOpts?: string | RetrieveOptions,
  topk = 7,
  content = false
): Skill[] {
  if (typeof libraryOrOpts === 'string' || libraryOrOpts === undefined) {
    return _retrieve(query, { library: libraryOrOpts, topK: topk, content });
  }
  return _retrieve(query, libraryOrOpts);
}

/**
 * Get a single skill by its exact ID.
 *
 * @param id      The skill ID (e.g. 'g2-mark-bar').
 * @param library Optional: restrict the search to a specific library.
 * @returns The skill with full content, or undefined if not found.
 * @example getSkillById('g2-mark-bar')
 */
export function getSkillById(id: string, library?: string): Skill | undefined {
  return _getSkillById(id, library);
}

/**
 * Get skill info embedded in the library index.
 *
 * @param library The library to get info for (default: 'g2').
 * @example info('g2')
 * @returns The skill info, or undefined if not available.
 */
export function info(library = 'g2'): SkillInfo | undefined {
  return getSkillInfo(library);
}

/**
 * Return the list of libraries that have a built index on disk.
 * @example libraries() // ['g2', 'g6']
 */
export function libraries(): string[] {
  return availableLibraries();
}
