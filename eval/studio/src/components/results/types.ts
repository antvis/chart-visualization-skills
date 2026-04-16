export interface EvalResult {
  id: string;
  query: string;
  library: string;
  algorithm?: string;
  expectedCode: string;
  generatedCode: string;
  duration: number;
  toolCallsCount?: number;
  loadedSkillPaths?: string[];
  evaluation: {
    similarity: number;
    hasIssues: boolean;
    issues: string[];
  };
  error?: string;
}

export interface EvalRun {
  id: string;
  model: string;
  provider?: string;
  dataset: string;
  algorithm: string;
  timestamp: string;
  endTime?: string;
  status: string;
  summary: {
    totalTests: number;
    successCount: number;
    avgSimilarity: number;
    avgDuration: number;
    avgToolCalls?: number;
    highSimilarityCount: number;
    issuesCount: number;
    skillHitRate?: number;
  };
  results: EvalResult[];
}

export type RenderState = 'pending' | 'success' | 'blank' | 'error';

export type FilterType = 'all' | 'bad' | 'blank' | 'render_error' | 'g2' | 'g6';
