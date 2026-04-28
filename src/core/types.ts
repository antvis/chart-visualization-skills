export interface Skill {
  id: string;
  title: string;
  description: string;
  library: string;
  version: string;
  category: string;
  subcategory: string;
  tags: string[];
  difficulty: string;
  use_cases: string[];
  anti_patterns: string[];
  related: string[];
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
  content?: boolean;
  /**
   * When true, prepend the library's SKILL.md core constraints as the first
   * result. Callers should set this whenever `content` is true so the model
   * always receives constraints alongside reference docs.
   */
  includeInfo?: boolean;
}

export interface ListOptions {
  library?: string;
  category?: string | null;
  tags?: string[];
  difficulty?: string | null;
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

export interface BM25Options {
  k1?: number;
  b?: number;
  fieldWeights?: Record<string, number>;
}
