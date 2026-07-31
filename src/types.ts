
export interface RetrieveOptions {
  library?: string;
  topK?: number;
  /** Include markdown content body (default: true). */
  content?: boolean;
  /**
   * Retrieval strategy:
   * - 'vector'  dense vector similarity via zvec index
   * - 'hybrid'  FTS + vector via zvec native multiQuery, RRF-fused (default)
   */
  strategy?: 'vector' | 'hybrid';
  /** Maximum token budget for doc content. When set, content is auto-trimmed. */
  maxTokens?: number;
}

export interface Doc {
  id: string;
  title: string;
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
