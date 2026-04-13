import { retrieve as _retrieve, loadSkillContent as _loadSkillContent } from './core/retriever';
import type { Skill } from './core/types';

export type { Skill };

export function retrieve(query: string, library = 'g2', topk = 7, indexDir?: string): Skill[] {
  return _retrieve(query, { library, topK: topk, indexDir });
}

/**
 * Return the full markdown content of a skill.
 * Returns null when the file cannot be found (e.g. index is stale).
 *
 * @example
 * const skills = retrieve('bar chart', 'g2', 1);
 * const md = loadSkillContent(skills[0]);
 */
export function loadSkillContent(skill: Skill, pkgRoot?: string): string | null {
  return _loadSkillContent(skill, pkgRoot);
}

/**
 * Retrieve skills and inline their full markdown content in one call.
 * Convenient for LLM prompt injection where full skill text is always needed.
 *
 * @example
 * const skills = retrieveWithContent('bar chart', 'g2', 5);
 * const context = skills.map(s => s.content).filter(Boolean).join('\n\n---\n\n');
 */
export function retrieveWithContent(
  query: string,
  library = 'g2',
  topk = 7,
  indexDir?: string
): Array<Skill & { content: string | null }> {
  return retrieve(query, library, topk, indexDir).map((skill) => ({
    ...skill,
    content: loadSkillContent(skill),
  }));
}
