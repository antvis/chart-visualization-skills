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
      hash = (hash << 5) - hash + gram.charCodeAt(i);
      hash = hash & hash;
    }
    return hash;
  });

  // Use up to 200 hashes for a meaningful sample without blowing up comparison cost
  return { normalized, ngrams, hashSignature: hashes.slice(0, 200) };
}

function calculateFingerprintSimilarity(
  fp1: CodeFingerprint,
  fp2: CodeFingerprint,
): number {
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
    apiPatterns: [],
  };

  const importRegex = /import\s+\{?([^}]+)\}?\s+from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(code)) !== null) {
    features.imports.push({
      names: match[1].split(',').map((s) => s.trim()),
      source: match[2],
    });
  }

  const JS_KEYWORDS = new Set([
    'if',
    'else',
    'for',
    'while',
    'do',
    'switch',
    'case',
    'break',
    'continue',
    'return',
    'throw',
    'try',
    'catch',
    'finally',
    'new',
    'delete',
    'typeof',
    'instanceof',
    'in',
    'of',
    'void',
    'yield',
    'await',
    'async',
    'function',
    'class',
    'extends',
    'super',
    'this',
    'let',
    'const',
    'var',
    'import',
    'export',
    'from',
    'default',
    'static',
    'get',
    'set',
  ]);
  const callRegex = /(\w+)\s*\(/g;
  while ((match = callRegex.exec(code)) !== null) {
    if (!JS_KEYWORDS.has(match[1])) features.functionCalls.push(match[1]);
  }

  const keyRegex = /(\w+)\s*:/g;
  while ((match = keyRegex.exec(code)) !== null)
    features.objectKeys.push(match[1]);

  const stringRegex = /['"](\w+)['"]:/g;
  while ((match = stringRegex.exec(code)) !== null)
    features.stringLiterals.push(match[1]);

  const apiPatterns: Array<{ name: string; pattern: RegExp }> = [
    // G2 patterns
    { name: 'chart.options', pattern: /chart\.options\s*\(/ },
    { name: 'new Chart', pattern: /new\s+Chart\s*\(/ },
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
    { name: 'animate', pattern: /animate\s*:/ },
    // X6 patterns
    { name: 'new Graph', pattern: /new\s+Graph\s*\(/ },
    { name: 'graph.addNode', pattern: /graph\.addNode\s*\(/ },
    { name: 'graph.addEdge', pattern: /graph\.addEdge\s*\(/ },
    { name: 'graph.fromJSON', pattern: /graph\.fromJSON\s*\(/ },
    { name: 'graph.toJSON', pattern: /graph\.toJSON\s*\(/ },
    { name: 'graph.use', pattern: /graph\.use\s*\(/ },
    { name: 'graph.on', pattern: /graph\.on\s*\(/ },
    { name: 'graph.off', pattern: /graph\.off\s*\(/ },
    { name: 'graph.centerContent', pattern: /graph\.centerContent\s*\(/ },
    { name: 'graph.zoomToFit', pattern: /graph\.zoomToFit\s*\(/ },
    { name: 'graph.zoomTo', pattern: /graph\.zoomTo\s*\(/ },
    { name: 'graph.zoom', pattern: /graph\.zoom\s*\(/ },
    { name: 'graph.zoomToRect', pattern: /graph\.zoomToRect\s*\(/ },
    { name: 'graph.removeNode', pattern: /graph\.removeNode\s*\(/ },
    { name: 'graph.removeEdge', pattern: /graph\.removeEdge\s*\(/ },
    { name: 'graph.clearCells', pattern: /graph\.clearCells\s*\(/ },
    { name: 'graph.getCells', pattern: /graph\.getCells\s*\(/ },
    { name: 'graph.getNodes', pattern: /graph\.getNodes\s*\(/ },
    { name: 'graph.getEdges', pattern: /graph\.getEdges\s*\(/ },
    { name: 'graph.getCellById', pattern: /graph\.getCellById\s*\(/ },
    { name: 'graph.getNeighbors', pattern: /graph\.getNeighbors\s*\(/ },
    { name: 'graph.getSuccessors', pattern: /graph\.getSuccessors\s*\(/ },
    { name: 'graph.getPredecessors', pattern: /graph\.getPredecessors\s*\(/ },
    { name: 'graph.createNode', pattern: /graph\.createNode\s*\(/ },
    { name: 'graph.createEdge', pattern: /graph\.createEdge\s*\(/ },
    { name: 'graph.dispose', pattern: /graph\.dispose\s*\(/ },
    { name: 'graph.startBatch', pattern: /graph\.startBatch\s*\(/ },
    { name: 'graph.stopBatch', pattern: /graph\.stopBatch\s*\(/ },
    { name: 'graph.batchUpdate', pattern: /graph\.batchUpdate\s*\(/ },
    { name: 'graph.toPNG', pattern: /graph\.toPNG\s*\(/ },
    { name: 'graph.toSVG', pattern: /graph\.toSVG\s*\(/ },
    { name: 'graph.toJPEG', pattern: /graph\.toJPEG\s*\(/ },
    { name: 'graph.bindKey', pattern: /graph\.bindKey\s*\(/ },
    { name: 'graph.select', pattern: /graph\.select\s*\(/ },
    { name: 'graph.undo', pattern: /graph\.undo\s*\(/ },
    { name: 'graph.redo', pattern: /graph\.redo\s*\(/ },
    { name: 'graph.copy', pattern: /graph\.copy\s*\(/ },
    { name: 'graph.paste', pattern: /graph\.paste\s*\(/ },
    { name: 'Graph.registerNode', pattern: /Graph\.registerNode\s*\(/ },
    { name: 'Graph.registerEdge', pattern: /Graph\.registerEdge\s*\(/ },
    { name: 'Shape.HTML.register', pattern: /Shape\.HTML\.register\s*\(/ },
    { name: 'node.addPort', pattern: /\.addPort\s*\(/ },
    { name: 'node.addTools', pattern: /\.addTools\s*\(/ },
    { name: 'node.removeTools', pattern: /\.removeTools\s*\(/ },
    { name: 'node.attr', pattern: /\.attr\s*\(/ },
    { name: 'node.prop', pattern: /\.prop\s*\(/ },
    { name: 'node.animate', pattern: /\.animate\s*\(/ },
    { name: 'x6.ports', pattern: /ports\s*:\s*\{/ },
    { name: 'x6.router', pattern: /router\s*:\s*['"]/ },
    { name: 'x6.connector', pattern: /connector\s*:\s*['"]/ },
    { name: 'x6.attrs', pattern: /attrs\s*:\s*\{/ },
    { name: 'x6.markup', pattern: /markup\s*:\s*\[/ },
    { name: 'x6.tools', pattern: /tools\s*:\s*\[/ },
    { name: 'x6.grid', pattern: /grid\s*:\s*\{/ },
    { name: 'x6.background', pattern: /background\s*:\s*\{/ },
    { name: 'x6.embedding', pattern: /embedding\s*:\s*\{/ },
    { name: 'x6.connecting', pattern: /connecting\s*:\s*\{/ },
    { name: 'x6.mousewheel', pattern: /mousewheel\s*:\s*\{/ },
    { name: 'x6.panning', pattern: /panning\s*:\s*\{/ },
    { name: 'x6.translating', pattern: /translating\s*:\s*\{/ },
    { name: 'x6.interacting', pattern: /interacting\s*:\s*\{/ },
    { name: 'x6.highlighting', pattern: /highlighting\s*:\s*\{/ },
    { name: 'x6.labels', pattern: /labels\s*:\s*\[/ },
    { name: 'x6.vertices', pattern: /vertices\s*:\s*\[/ },
    { name: 'x6.sourceMarker', pattern: /sourceMarker\s*:/ },
    { name: 'x6.targetMarker', pattern: /targetMarker\s*:/ },
    { name: 'x6.shape.rect', pattern: /shape\s*:\s*['"]rect['"]/ },
    { name: 'x6.shape.circle', pattern: /shape\s*:\s*['"]circle['"]/ },
    { name: 'x6.shape.ellipse', pattern: /shape\s*:\s*['"]ellipse['"]/ },
    { name: 'x6.shape.polygon', pattern: /shape\s*:\s*['"]polygon['"]/ },
    { name: 'x6.shape.path', pattern: /shape\s*:\s*['"]path['"]/ },
    { name: 'x6.shape.html', pattern: /shape\s*:\s*['"]html['"]/ },
    { name: 'x6.shape.image', pattern: /shape\s*:\s*['"]image['"]/ },
    { name: 'x6.shape.text', pattern: /shape\s*:\s*['"]text(-block)?['"]/ },
    { name: 'x6.refPoints', pattern: /refPoints\s*:/ },
    { name: 'x6.refX', pattern: /refX\s*:/ },
    { name: 'x6.refY', pattern: /refY\s*:/ },
    { name: 'x6.zIndex', pattern: /zIndex\s*:/ },
    { name: 'x6.magnet', pattern: /magnet\s*:/ },
    { name: 'x6.label', pattern: /\blabel\s*:/ },
    { name: 'x6.source', pattern: /\bsource\s*:/ },
    { name: 'x6.target', pattern: /\btarget\s*:/ },
    { name: 'plugin.Selection', pattern: /new\s+Selection\s*\(/ },
    { name: 'plugin.Snapline', pattern: /new\s+Snapline\s*\(/ },
    { name: 'plugin.History', pattern: /new\s+History\s*\(/ },
    { name: 'plugin.Clipboard', pattern: /new\s+Clipboard\s*\(/ },
    { name: 'plugin.Keyboard', pattern: /new\s+Keyboard\s*\(/ },
    { name: 'plugin.Scroller', pattern: /new\s+Scroller\s*\(/ },
    { name: 'plugin.MiniMap', pattern: /new\s+MiniMap\s*\(/ },
    { name: 'plugin.Transform', pattern: /new\s+Transform\s*\(/ },
    { name: 'plugin.Export', pattern: /new\s+Export\s*\(/ },
    { name: 'plugin.Stencil', pattern: /new\s+Stencil\s*\(/ },
    { name: 'plugin.Dnd', pattern: /new\s+Dnd\s*\(/ },
  ];

  for (const { name, pattern } of apiPatterns) {
    if (pattern.test(code)) features.apiPatterns.push(name);
  }

  return features;
}

function calculateStructuralSimilarity(
  f1: StructuralFeatures,
  f2: StructuralFeatures,
): number {
  const scores: number[] = [];

  // 1. apiPatterns 与 objectKeys / functionCalls 仍用对称 Jaccard（行为差异要双向扣分）
  const commonPatterns = f1.apiPatterns.filter((p) =>
    f2.apiPatterns.includes(p),
  );
  const allPatterns = new Set([...f1.apiPatterns, ...f2.apiPatterns]);
  if (allPatterns.size > 0)
    scores.push(commonPatterns.length / allPatterns.size);

  const commonKeys = f1.objectKeys.filter((k) => f2.objectKeys.includes(k));
  const allKeys = new Set([...f1.objectKeys, ...f2.objectKeys]);
  if (allKeys.size > 0) scores.push(commonKeys.length / allKeys.size);

  const commonCalls = f1.functionCalls.filter((c) =>
    f2.functionCalls.includes(c),
  );
  const allCalls = new Set([...f1.functionCalls, ...f2.functionCalls]);
  if (allCalls.size > 0) scores.push(commonCalls.length / allCalls.size);

  // 2. import sources 改用"reference 召回率"：
  //    只看 reference 需要的 import 是否都在 generated 里出现，
  //    generated 多 import 的不扣分（LLM 习惯保留全量 import 不影响功能）。
  //    约定：f1 = generated, f2 = reference。
  const sources1 = f1.imports.map((i) => i.source); // generated
  const sources2 = f2.imports.map((i) => i.source); // reference
  if (sources2.length > 0) {
    const refCovered = sources2.filter((s) => sources1.includes(s)).length;
    scores.push(refCovered / sources2.length);
  } else if (sources1.length === 0) {
    scores.push(1);
  }

  return scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;
}

// ── 综合相似度 ─────────────────────────────────────────────────────────────────

export interface SimilarityOptions {
  algorithm?: 'token' | 'structural' | 'fingerprint' | 'hybrid';
  weights?: { token: number; structural: number; fingerprint: number };
  library?: string;
}

/**
 * X6 专用代码归一化：消除功能等价但写法不同的差异。
 * 仅在 library='x6' 时应用，不影响 G2/G6 等其他库的相似度计算。
 *
 * 设计原则：只归一化"语法不同但语义完全等价"的写法，
 * 不删除任何可能在两边都出现的内容（如 grid/background），避免误伤。
 */
function normalizeX6Code(code: string): string {
  let normalized = code;

  // 1. container 写法统一 — 这些写法在 X6 中完全等价
  normalized = normalized.replace(
    /container\s*:\s*document\.getElementById\s*\(\s*['"][^'"]*['"]\s*\)/g,
    'container: \'container\'',
  );
  normalized = normalized.replace(
    /container\s*:\s*containerRef\.current/g,
    'container: \'container\'',
  );
  normalized = normalized.replace(
    /container\s*:\s*container\b(?!\s*[.'"\[])/g,
    'container: \'container\'',
  );

  // 2. 移除注释
  //    用 (?<!:) 负向回顾，避免吞掉 URL 中的 //（http://、https://、ws://、
  //    wss://、ftp://、file:// 等任意 scheme），否则会把字符串字面量截断、
  //    破坏后续 tokenize / 结构特征提取的稳定性。
  normalized = normalized.replace(/(?<!:)\/\/.*$/gm, '');
  normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '');

  // 3. 删除 console.* 调用（一行或多行括号内容）— 与渲染结果无关
  normalized = normalized.replace(
    /console\.(log|warn|error|info|debug)\s*\([^()]*(?:\([^()]*\)[^()]*)*\)\s*;?/g,
    '',
  );

  // 4. 删除"可选副作用调用"— reference 与 LLM 加不加都不影响功能
  //    包含画布居中、缩放适配、清空、批量更新启停等
  const OPTIONAL_CALLS = [
    'centerContent',
    'center',
    'zoomToFit',
    'fitToContent',
    'resize',
    'unfreeze',
    'freeze',
    'lockScroller',
    'unlockScroller',
  ];
  for (const fn of OPTIONAL_CALLS) {
    normalized = normalized.replace(
      new RegExp(`graph\\.${fn}\\s*\\([^()]*\\)\\s*;?`, 'g'),
      '',
    );
  }

  // 5. 统一节点变量赋值 — `const x = graph.addNode({...})` 与 `graph.addNode({...})` 等价
  //    保留 graph.addNode/addEdge 调用，剥掉左侧 `const xxx = `
  normalized = normalized.replace(
    /\b(?:const|let|var)\s+\w+\s*=\s*(graph\.(?:addNode|addEdge|createNode|createEdge)\s*\()/g,
    '$1',
  );

  // 6. 删除节点中冗余的 id 字段（id 与变量名同名时只是命名风格差异）
  //    例：`{ id: 'node1', shape: 'rect', ... }` 中的 id 字段在功能上常被自动生成
  normalized = normalized.replace(
    /(\{[^{}]*?)\bid\s*:\s*['"][^'"]*['"]\s*,?\s*/g,
    '$1',
  );

  // 7. 字符串字面量归一化 — 'Source'/'Target'/'node1' 等占位符值视为等价
  //    仅归一化非关键属性的字符串值，保留 extractStructuralFeatures.apiPatterns
  //    中按字符串值匹配的关键 key（shape/router/connector/type），
  //    否则会导致这些维度在两侧都恒为空，丧失判别力。
  const PRESERVE_VALUE_KEYS = new Set([
    'shape',
    'router',
    'connector',
    'type',
  ]);
  normalized = normalized.replace(
    /(\b\w+)(\s*:\s*)(['"])((?:\\.|(?!\3)[^\\])*)\3/g,
    (match, key, sep, _quote, _value) =>
      PRESERVE_VALUE_KEYS.has(key) ? match : `${key}${sep}""`,
  );

  // 8. 数字归一化 — width/height/x/y 等数值差异不影响功能
  normalized = normalized.replace(/:\s*-?\d+(\.\d+)?/g, ': 0');

  // 9. 统一分号
  normalized = normalized.replace(/;(\s*[\n\r])/g, '$1');

  // 10. 统一空白
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized.trim();
}

/** X6 专用权重：structural 高（API 模式匹配度高）、token 中等、fingerprint 低（n-gram 级别差异大） */
const X6_WEIGHTS = { token: 0.35, structural: 0.55, fingerprint: 0.1 };

export function calculateSimilarity(
  code1: string,
  code2: string,
  options: SimilarityOptions = {},
): number {
  const { algorithm = 'hybrid', library } = options;
  const isX6 = library === 'x6';

  // X6 用专用权重，其他库用传入的或默认权重
  const weights = isX6
    ? X6_WEIGHTS
    : (options.weights ?? { token: 0.3, structural: 0.4, fingerprint: 0.3 });

  if (!code1 || !code2) return 0;

  let n1 = code1.trim();
  let n2 = code2.trim();
  if (isX6) {
    n1 = normalizeX6Code(n1);
    n2 = normalizeX6Code(n2);
  }

  if (algorithm === 'token')
    return calculateDiceSimilarity(tokenize(n1), tokenize(n2));
  if (algorithm === 'structural') {
    return calculateStructuralSimilarity(
      extractStructuralFeatures(n1),
      extractStructuralFeatures(n2),
    );
  }
  if (algorithm === 'fingerprint') {
    return calculateFingerprintSimilarity(
      generateCodeFingerprint(n1),
      generateCodeFingerprint(n2),
    );
  }

  const raw =
    calculateDiceSimilarity(tokenize(n1), tokenize(n2)) * weights.token +
    calculateStructuralSimilarity(
      extractStructuralFeatures(n1),
      extractStructuralFeatures(n2),
    ) *
      weights.structural +
    calculateFingerprintSimilarity(
      generateCodeFingerprint(n1),
      generateCodeFingerprint(n2),
    ) *
      weights.fingerprint;

  // Cap at 1.0 — structural similarity can exceed 1.0 due to duplicate keys in filter vs Set
  return Math.min(raw, 1.0);
}

export function clusterSimilarCodes(
  codes: string[],
  options: SimilarityOptions & { threshold?: number } = {},
) {
  const { threshold = 0.7, algorithm = 'hybrid' } = options;
  const clusters: Array<{
    representative: number;
    members: number[];
    similarities: Array<{ index: number; similarity: number }>;
  }> = [];
  const assigned = new Set<number>();

  for (let i = 0; i < codes.length; i++) {
    if (assigned.has(i)) continue;
    const cluster = {
      representative: i,
      members: [i],
      similarities: [] as Array<{ index: number; similarity: number }>,
    };
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
