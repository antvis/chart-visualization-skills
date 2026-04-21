/**
 * 代码相似度计算
 * 支持 Token-based、Structural、Fingerprint、Hybrid 算法
 */

// ── Token 相似度 ───────────────────────────────────────────────────────────────

export function tokenize(code: string): string[] {
  return code
    .toLowerCase()
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/[^\w]+/)
    .filter((t) => t.length > 1);
}

function calculateDiceSimilarity(tokens1: string[], tokens2: string[]): number {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  if (set1.size === 0 || set2.size === 0) return 0;
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  return (2 * intersection.size) / (set1.size + set2.size);
}

// ── 代码指纹 ───────────────────────────────────────────────────────────────────

interface CodeFingerprint {
  normalized: string;
  ngrams: string[];
  hashSignature: number[];
}

function generateCodeFingerprint(code: string): CodeFingerprint {
  const normalized = code
    .toLowerCase()
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/['"][^'"]*['"]/g, '""')
    .replace(/\d+/g, '0')
    .trim();

  const ngrams: string[] = [];
  const n = 4;
  for (let i = 0; i <= normalized.length - n; i++) {
    ngrams.push(normalized.slice(i, i + n));
  }

  const hashes = ngrams.map((gram) => {
    let hash = 0;
    for (let i = 0; i < gram.length; i++) {
      hash = ((hash << 5) - hash) + gram.charCodeAt(i);
      hash = hash & hash;
    }
    return hash;
  });

  // Use up to 200 hashes for a meaningful sample without blowing up comparison cost
  return { normalized, ngrams, hashSignature: hashes.slice(0, 200) };
}

function calculateFingerprintSimilarity(fp1: CodeFingerprint, fp2: CodeFingerprint): number {
  const set2 = new Set(fp2.hashSignature);
  const intersection = new Set(fp1.hashSignature.filter((h) => set2.has(h)));
  const union = new Set([...fp1.hashSignature, ...fp2.hashSignature]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// ── 结构特征 ───────────────────────────────────────────────────────────────────

export interface StructuralFeatures {
  imports: Array<{ names: string[]; source: string }>;
  functionCalls: string[];
  objectKeys: string[];
  stringLiterals: string[];
  apiPatterns: string[];
}

export function extractStructuralFeatures(code: string): StructuralFeatures {
  const features: StructuralFeatures = {
    imports: [],
    functionCalls: [],
    objectKeys: [],
    stringLiterals: [],
    apiPatterns: []
  };

  const importRegex = /import\s+\{?([^}]+)\}?\s+from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(code)) !== null) {
    features.imports.push({ names: match[1].split(',').map((s) => s.trim()), source: match[2] });
  }

  const JS_KEYWORDS = new Set([
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
    'return', 'throw', 'try', 'catch', 'finally', 'new', 'delete', 'typeof',
    'instanceof', 'in', 'of', 'void', 'yield', 'await', 'async', 'function',
    'class', 'extends', 'super', 'this', 'let', 'const', 'var', 'import', 'export',
    'from', 'default', 'static', 'get', 'set'
  ]);
  const callRegex = /(\w+)\s*\(/g;
  while ((match = callRegex.exec(code)) !== null) {
    if (!JS_KEYWORDS.has(match[1])) features.functionCalls.push(match[1]);
  }

  const keyRegex = /(\w+)\s*:/g;
  while ((match = keyRegex.exec(code)) !== null) features.objectKeys.push(match[1]);

  const stringRegex = /['"](\w+)['"]:/g;
  while ((match = stringRegex.exec(code)) !== null) features.stringLiterals.push(match[1]);

  const apiPatterns: Array<{ name: string; pattern: RegExp }> = [
    { name: 'chart.options', pattern: /chart\.options\s*\(/ },
    { name: 'new Chart', pattern: /new\s+Chart\s*\(/ },
    { name: 'new Graph', pattern: /new\s+Graph\s*\(/ },
    { name: 'chart.render', pattern: /chart\.render\s*\(/ },
    { name: 'encode', pattern: /encode\s*:/ },
    { name: 'transform', pattern: /transform\s*:/ },
    { name: 'coordinate', pattern: /coordinate\s*:/ },
    { name: 'scale', pattern: /scale\s*:/ },
    { name: 'view.children', pattern: /children\s*:/ },
    { name: 'type.view', pattern: /type\s*:\s*['"]view['"]/ },
    { name: 'type.interval', pattern: /type\s*:\s*['"]interval['"]/ },
    { name: 'type.line', pattern: /type\s*:\s*['"]line['"]/ },
    { name: 'type.point', pattern: /type\s*:\s*['"]point['"]/ },
    { name: 'interaction', pattern: /interaction\s*:/ },
    { name: 'animate', pattern: /animate\s*:/ }
  ];

  for (const { name, pattern } of apiPatterns) {
    if (pattern.test(code)) features.apiPatterns.push(name);
  }

  return features;
}

function calculateStructuralSimilarity(f1: StructuralFeatures, f2: StructuralFeatures): number {
  const scores: number[] = [];

  const commonPatterns = f1.apiPatterns.filter((p) => f2.apiPatterns.includes(p));
  const allPatterns = new Set([...f1.apiPatterns, ...f2.apiPatterns]);
  if (allPatterns.size > 0) scores.push(commonPatterns.length / allPatterns.size);

  const commonKeys = f1.objectKeys.filter((k) => f2.objectKeys.includes(k));
  const allKeys = new Set([...f1.objectKeys, ...f2.objectKeys]);
  if (allKeys.size > 0) scores.push(commonKeys.length / allKeys.size);

  const commonCalls = f1.functionCalls.filter((c) => f2.functionCalls.includes(c));
  const allCalls = new Set([...f1.functionCalls, ...f2.functionCalls]);
  if (allCalls.size > 0) scores.push(commonCalls.length / allCalls.size);

  const sources1 = f1.imports.map((i) => i.source);
  const sources2 = f2.imports.map((i) => i.source);
  const commonSources = sources1.filter((s) => sources2.includes(s));
  const allSources = new Set([...sources1, ...sources2]);
  if (allSources.size > 0) scores.push(commonSources.length / allSources.size);

  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

// ── 综合相似度 ─────────────────────────────────────────────────────────────────

export interface SimilarityOptions {
  algorithm?: 'token' | 'structural' | 'fingerprint' | 'hybrid';
  weights?: { token: number; structural: number; fingerprint: number };
}

export function calculateSimilarity(code1: string, code2: string, options: SimilarityOptions = {}): number {
  const { algorithm = 'hybrid', weights = { token: 0.3, structural: 0.4, fingerprint: 0.3 } } = options;
  if (!code1 || !code2) return 0;

  const n1 = code1.trim();
  const n2 = code2.trim();

  if (algorithm === 'token') return calculateDiceSimilarity(tokenize(n1), tokenize(n2));
  if (algorithm === 'structural') {
    return calculateStructuralSimilarity(extractStructuralFeatures(n1), extractStructuralFeatures(n2));
  }
  if (algorithm === 'fingerprint') {
    return calculateFingerprintSimilarity(generateCodeFingerprint(n1), generateCodeFingerprint(n2));
  }

  return (
    calculateDiceSimilarity(tokenize(n1), tokenize(n2)) * weights.token +
    calculateStructuralSimilarity(extractStructuralFeatures(n1), extractStructuralFeatures(n2)) * weights.structural +
    calculateFingerprintSimilarity(generateCodeFingerprint(n1), generateCodeFingerprint(n2)) * weights.fingerprint
  );
}

export function clusterSimilarCodes(codes: string[], options: SimilarityOptions & { threshold?: number } = {}) {
  const { threshold = 0.7, algorithm = 'hybrid' } = options;
  const clusters: Array<{ representative: number; members: number[]; similarities: Array<{ index: number; similarity: number }> }> = [];
  const assigned = new Set<number>();

  for (let i = 0; i < codes.length; i++) {
    if (assigned.has(i)) continue;
    const cluster = { representative: i, members: [i], similarities: [] as Array<{ index: number; similarity: number }> };
    for (let j = i + 1; j < codes.length; j++) {
      if (assigned.has(j)) continue;
      const sim = calculateSimilarity(codes[i], codes[j], { algorithm });
      if (sim >= threshold) {
        cluster.members.push(j);
        cluster.similarities.push({ index: j, similarity: sim });
        assigned.add(j);
      }
    }
    if (cluster.members.length > 1) clusters.push(cluster);
  }

  return clusters.sort((a, b) => b.members.length - a.members.length);
}
