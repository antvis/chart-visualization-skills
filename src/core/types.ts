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
  path: string;
  use_cases: string[];
  anti_patterns: string[];
  related: string[];
  embedding_text: string;
  content?: string;
}

export interface SkillIndex {
  library: string;
  version: string;
  generated: string;
  total: number;
  skills: Skill[];
}

export interface RetrieveOptions {
  library?: string;
  topK?: number;
  indexDir?: string;
}

export interface ListOptions {
  library?: string;
  category?: string | null;
  tags?: string[];
  difficulty?: string | null;
  indexDir?: string;
}

export interface BM25Options {
  k1?: number;
  b?: number;
  fieldWeights?: Record<string, number>;
}

export interface FrontMatter {
  meta: Record<string, any>;
  body: string;
}
