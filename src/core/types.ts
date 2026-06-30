export interface Skill {
  id: string;
  title: string;
  title_en: string;
  description: string;
  library: string;
  version: string;
  category: string;
  subcategory: string;
  tags: string[];
  use_cases: string[];
  anti_patterns: string[];
  related: string[];
  /** Relative path from project root to the source markdown file. */
  path?: string;
  content?: string;
}

export interface SkillIndex {
  library: string;
  version: string;
  generated: string;
  total: number;
  skills: Skill[];
  info?: SkillInfo;
}

export interface RetrieveOptions {
  library?: string;
  topK?: number;
  /** Include markdown content body (default: true). */
  content?: boolean;
  /**
   * When true, prepend the library's constraints as the first result
   * (id prefixed with `__info__`). Default: same as `content`.
   */
  includeConstraints?: boolean;
  /**
   * Retrieval strategy:
   * - 'vector'  dense vector similarity via zvec index
   * - 'hybrid'  FTS + vector via zvec native multiQuery, RRF-fused (default)
   */
  strategy?: 'vector' | 'hybrid';
  /** Maximum token budget for skill content. When set, content is trimmed to fit. */
  maxTokens?: number;
  /**
   * Progressive disclosure level (only applies when maxTokens is set):
   * - 0 = full content
   * - 1 = summary + code blocks only (default)
   * - 2 = summary only
   */
  progressiveLevel?: 0 | 1 | 2;
}

export interface ListOptions {
  library?: string;
  category?: string | null;
  tags?: string[];
}

export interface SkillInfo {
  name: string;
  description: string;
  /** Full SKILL.md body (after frontmatter). */
  content: string;
  /**
   * Content up to and including the `<!-- CONSTRAINTS:END -->` marker.
   * Used by `retrieve --content` to inject only the core constraints section
   * instead of the full document, avoiding context-window bloat.
   * Falls back to `content` when the marker is absent.
   */
  constraintsContent: string;
}
