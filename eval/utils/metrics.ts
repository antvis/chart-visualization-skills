/**
 * Metrics Module — enhanced evaluation metrics for code generation assessment.
 */

import { calculateSimilarity, extractStructuralFeatures, type StructuralFeatures } from './code-similarity.js';

interface MetricsOptions {
  algorithm?: 'hybrid' | 'token' | 'structural' | 'fingerprint';
}

interface FeatureMatchResult {
  scores: Record<string, number>;
  average: number;
}

interface ApiUsagePatterns {
  marks: string[];
  transforms: string[];
  coordinates: string[];
  scales: string[];
  components: string[];
  deprecated: string[];
}

interface StructuralCorrectnessResult {
  score: number;
  checks: {
    hasImport: boolean;
    hasChartInstance: boolean;
    hasRender: boolean;
    hasData: boolean;
    hasMark: boolean;
    issues: string[];
  };
  isValid: boolean;
}

interface PerformanceEstimate {
  codeLength: number;
  lineCount: number;
  estimatedTokens: number;
  complexity: { score: number; level: string };
}

export interface Metrics {
  similarity: number;
  featureMatch: FeatureMatchResult;
  apiUsage: ApiUsagePatterns;
  structuralCorrectness: StructuralCorrectnessResult;
  performanceEstimate: PerformanceEstimate;
  features: StructuralFeatures;
}

export function computeMetrics(generatedCode: string, expectedCode: string, options: MetricsOptions = {}): Metrics {
  const { algorithm = 'hybrid' } = options;
  const similarity = calculateSimilarity(generatedCode, expectedCode, { algorithm });
  const generatedFeatures = extractStructuralFeatures(generatedCode);
  const expectedFeatures = extractStructuralFeatures(expectedCode);

  return {
    similarity,
    featureMatch: computeFeatureMatch(generatedFeatures, expectedFeatures),
    apiUsage: analyzeApiUsage(generatedCode),
    structuralCorrectness: computeStructuralCorrectness(generatedCode),
    performanceEstimate: estimatePerformance(generatedCode),
    features: generatedFeatures
  };
}

function computeFeatureMatch(generated: StructuralFeatures, expected: StructuralFeatures): FeatureMatchResult {
  const allKeys = new Set([...Object.keys(generated), ...Object.keys(expected)]) as Set<keyof StructuralFeatures>;
  const scores: Record<string, number> = {};
  let totalMatches = 0;

  for (const key of allKeys) {
    const genVal = generated[key];
    const expVal = expected[key];

    if (Array.isArray(genVal) && Array.isArray(expVal)) {
      const intersection = (genVal as string[]).filter((v) => (expVal as string[]).includes(v));
      const union = [...new Set([...genVal, ...expVal])];
      scores[key] = intersection.length / (union.length || 1);
    } else {
      scores[key] = genVal === expVal ? 1 : 0;
    }
    totalMatches += scores[key];
  }

  return { scores, average: totalMatches / (allKeys.size || 1) };
}

function analyzeApiUsage(code: string): ApiUsagePatterns {
  const patterns: ApiUsagePatterns = { marks: [], transforms: [], coordinates: [], scales: [], components: [], deprecated: [] };

  const run = (re: RegExp, arr: string[]) => { let m; while ((m = re.exec(code)) !== null) arr.push(m[1]); };

  run(/\b(line|interval|area|point|cell|vector|link|polygon|image|text|box|shape|density|heatmap|contour|treemap|sunburst|pack|sankey|venn|chord|gauge|pie|radar|funnel|waterfall)\s*\(/g, patterns.marks);
  run(/type\s*:\s*['"](stackY|dodgeX|jitterX|jitterY|symmetryY|diffY|normalizeY|stackX|dodgeY|sortX|sortY|binX|binY|bin|group|groupX|groupY|groupColor|aggregate|flexX|flexY|filter|map|pick|rename|sortBy|flat|kde|custom)['"]/g, patterns.transforms);
  run(/type\s*:\s*['"](cartesian|polar|helix|transpose|fisheye|parallel|radial|theta)['"]/g, patterns.coordinates);
  run(/type\s*:\s*['"](linear|log|pow|sqrt|time|band|point|identity|quantize|quantile|threshold|ordinal|category|constant)['"]/g, patterns.scales);
  run(/\b(axis|legend|tooltip|title|annotation|slider|scrollbar)\s*:/g, patterns.components);

  const deprecated = [
    { pattern: /chart\.(interval|line|point|area|cell)\s*\(/g, name: 'chart.mark()' },
    { pattern: /\.position\s*\(/g, name: '.position()' },
    { pattern: /createView\s*\(/g, name: 'createView()' }
  ];
  for (const { pattern, name } of deprecated) {
    let m;
    while ((m = pattern.exec(code)) !== null) patterns.deprecated.push(name);
  }

  return patterns;
}

function computeStructuralCorrectness(code: string): StructuralCorrectnessResult {
  const issues: string[] = [];
  const hasImport = /import\s+.*from\s+['"]@antv\/(g2|g6)['"]/.test(code) || /require\s*\(['"]@antv\/(g2|g6)['"]\)/.test(code);
  const hasChartInstance = /new\s+(Chart|Graph)\s*\(/.test(code);
  const hasRender = /\.render\s*\(\s*\)/.test(code);
  const hasData = /data\s*:/.test(code) || /\.data\s*\(/.test(code);
  const hasMark = /\.mark\w+\s*\(/.test(code) || /\.interval|\.line|\.area|\.point|\.cell/.test(code) || /node|edge/.test(code);

  if (!hasImport) issues.push('Missing import statement');
  if (!hasChartInstance) issues.push('Missing Chart/Graph instantiation');
  if (!hasRender) issues.push('Missing .render() call');

  const score =
    (hasImport ? 0.2 : 0) +
    (hasChartInstance ? 0.3 : 0) +
    (hasRender ? 0.3 : 0) +
    (hasData ? 0.1 : 0) +
    (hasMark ? 0.1 : 0);

  return { score, checks: { hasImport, hasChartInstance, hasRender, hasData, hasMark, issues }, isValid: issues.length === 0 };
}

function estimatePerformance(code: string): PerformanceEstimate {
  let complexity = 1;
  for (const re of [/\bif\b/g, /\bfor\b/g, /\bwhile\b/g, /\bswitch\b/g, /\bcatch\b/g]) {
    complexity += (code.match(re) ?? []).length;
  }
  const funcs = code.match(/function\s+\w+|=>\s*{|=>\s*\(/g);
  if (funcs) complexity += funcs.length;

  return {
    codeLength: code.length,
    lineCount: code.split('\n').length,
    estimatedTokens: Math.ceil(code.length / 4),
    complexity: { score: complexity, level: complexity > 15 ? 'complex' : complexity > 8 ? 'moderate' : 'simple' }
  };
}

interface EvalResult {
  error?: string;
  duration?: number;
  evaluation?: { similarity?: number; hasIssues?: boolean };
}

export function aggregateMetrics(results: EvalResult[]) {
  const valid = results.filter((r) => !r.error && r.evaluation);
  if (valid.length === 0) return { error: 'No valid results to aggregate' };

  const sims = valid.map((r) => r.evaluation!.similarity ?? 0);
  const durs = valid.map((r) => r.duration ?? 0);
  const sorted = [...sims].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianSim = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  return {
    count: valid.length,
    similarity: {
      avg: sims.reduce((a, b) => a + b, 0) / sims.length,
      min: Math.min(...sims),
      max: Math.max(...sims),
      median: medianSim
    },
    duration: {
      avg: durs.reduce((a, b) => a + b, 0) / durs.length,
      min: Math.min(...durs),
      max: Math.max(...durs)
    },
    issuesCount: results.filter((r) => r.evaluation?.hasIssues).length,
    errorCount: results.filter((r) => r.error).length
  };
}
