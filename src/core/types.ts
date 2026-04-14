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
  content: string;
}

export interface BM25Options {
  k1?: number;
  b?: number;
  fieldWeights?: Record<string, number>;
}
