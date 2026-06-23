import {
  retrieve as _retrieve,
  getSkillById as _getSkillById,
  getSkillInfo,
  availableLibraries,
  listSkills as _listSkills,
} from './core/retriever';
import type { Skill, SkillInfo, RetrieveOptions, ListOptions } from './core/types';

export type { Skill, SkillInfo, RetrieveOptions, ListOptions };

// ---------------------------------------------------------------------------
// createContext – one-stop assembled context (async, designed for AI SDKs)
// ---------------------------------------------------------------------------

/**
 * Options for {@link createContext}.
 */
export interface ContextOptions {
  /** Library to search (e.g. 'g2'). Defaults to 'g2'. */
  library?: string;
  /** Retrieval strategy. Default: 'hybrid'. */
  strategy?: 'vector' | 'hybrid';
  /** Number of top skills to return. Default: 5. */
  topK?: number;
  /** Maximum token budget for the assembled context. Default: 4000. */
  maxTokens?: number;
  /**
   * Progressive disclosure level:
   * - 0 = full content
   * - 1 = summary + code blocks only (default)
   * - 2 = summary only
   */
  progressiveLevel?: 0 | 1 | 2;
}

/**
 * A single assembled skill in the context result.
 */
export interface AssembledSkill {
  id: string;
  title: string;
  description: string;
  content: string;
  library: string;
  category: string;
  tags: string[];
  /** Whether this skill was truncated to fit within the token budget. */
  truncated: boolean;
}

/**
 * Assembled context returned by {@link createContext}.
 */
export interface AssembledContext {
  /** Core constraints from SKILL.md – always first in the context. */
  constraints: string;
  /** Assembled skill list, ordered by relevance. */
  skills: AssembledSkill[];
  /** Estimated total token count of the assembled context. */
  tokenCount: number;
  /** Whether any skill was truncated. */
  truncated: boolean;
  /** IDs of skills that can be expanded for more detail. */
  expandableIds: string[];
}

/**
 * One-stop context generation for AI agents.
 *
 * Retrieves skills with the given strategy, prepends library constraints,
 * and assembles a token-budgeted context suitable for direct injection into
 * an LLM prompt.
 *
 * @example
 * ```typescript
 * const ctx = await createContext('按月趋势图，每个产品一个颜色', {
 *   library: 'g2',
 *   strategy: 'hybrid',
 *   maxTokens: 4000,
 *   progressiveLevel: 1,
 * });
 * // ctx.constraints – core rules
 * // ctx.skills – top K reference docs (summary + code)
 * // ctx.tokenCount – estimated total tokens
 * ```
 */
export async function createContext(
  query: string,
  options: ContextOptions = {}
): Promise<AssembledContext> {
  const {
    library = 'g2',
    strategy = 'hybrid',
    topK = 5,
    maxTokens = 4000,
    progressiveLevel = 1,
  } = options;

  // Retrieve with constraints always injected
  const results = _retrieve(query, {
    library,
    topK,
    content: true,
    includeInfo: true,
    strategy,
  });

  // Extract constraints (first result when includeInfo is true)
  const constraintsSkill = results.find((s) => s.id.startsWith('__info__'));
  const constraints = constraintsSkill?.content || '';
  const skillResults = results.filter((s) => !s.id.startsWith('__info__'));

  // Assemble skills with token budget
  let budget = maxTokens - estimateTokens(constraints);
  const assembled: AssembledSkill[] = [];
  const expandableIds: string[] = [];
  let truncated = false;

  for (const skill of skillResults) {
    if (budget <= 0) {
      expandableIds.push(skill.id);
      truncated = true;
      continue;
    }

    const content = formatSkillContent(skill, progressiveLevel, budget);
    const tokens = estimateTokens(content);

    if (tokens > budget && assembled.length > 0) {
      expandableIds.push(skill.id);
      truncated = true;
      continue;
    }

    assembled.push({
      id: skill.id,
      title: skill.title,
      description: skill.description,
      content: tokens > budget ? truncateContent(content, budget) : content,
      library: skill.library,
      category: skill.category,
      tags: skill.tags || [],
      truncated: tokens > budget,
    });

    budget -= Math.min(tokens, budget);
    if (budget <= 0) truncated = true;
  }

  // Add any remaining skill IDs from results that didn't fit
  for (const skill of skillResults.slice(assembled.length)) {
    expandableIds.push(skill.id);
  }

  const totalTokens =
    estimateTokens(constraints) +
    assembled.reduce((sum, s) => sum + estimateTokens(s.content), 0);

  return {
    constraints,
    skills: assembled,
    tokenCount: totalTokens,
    truncated,
    expandableIds: [...new Set(expandableIds)],
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple token estimator: 1 token ≈ 4 chars (ASCII) or 1.5 chars (CJK). */
function estimateTokens(text: string): number {
  let tokens = 0;
  for (const ch of text) {
    tokens += isCJK(ch) ? 0.67 : 0.25; // 1/1.5 ≈ 0.67,  1/4 = 0.25
  }
  return Math.ceil(tokens);
}

function isCJK(ch: string): boolean {
  const cp = ch.codePointAt(0)!;
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x3040 && cp <= 0x30ff)
  );
}

function formatSkillContent(
  skill: Skill,
  level: number,
  budget: number
): string {
  const parts: string[] = [];
  parts.push(`## ${skill.title}\n`);
  if (skill.description) parts.push(`${skill.description}\n`);

  if (level === 2) {
    // Summary only
    return parts.join('\n');
  }

  if (level === 1) {
    // Summary + code blocks only
    const codeBlocks = extractCodeBlocks(skill.content || '');
    const codeStr = codeBlocks.join('\n\n');
    const header = parts.join('\n');
    if (estimateTokens(header + codeStr) > budget) {
      return truncateContent(skill.content || '', budget);
    }
    return header + '\n' + codeStr;
  }

  // level 0: full content
  return skill.content || parts.join('\n');
}

function extractCodeBlocks(content: string): string[] {
  const blocks: string[] = [];
  const regex = /```[\s\S]*?```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push(match[0]);
  }
  return blocks;
}

function truncateContent(content: string, maxTokens: number): string {
  let tokens = 0;
  let i = 0;
  for (; i < content.length; i++) {
    tokens += isCJK(content[i]) ? 0.67 : 0.25;
    if (tokens >= maxTokens) break;
  }
  return content.slice(0, i) + (i < content.length ? '\n<!-- truncated -->' : '');
}

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

/**
 * List available skills, optionally filtered by library, category, tags, or difficulty.
 * @param options Filter options.
 * @example listSkills({ library: 'g2', tags: ['bar'] })
 * @example listSkills({ difficulty: 'beginner' })
 */
export function listSkills(options: ListOptions = {}): Skill[] {
  return _listSkills(options);
}
