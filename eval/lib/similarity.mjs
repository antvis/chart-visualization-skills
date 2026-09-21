/**
 * Code similarity — pure functions.
 *
 * hybrid = token (Dice) + structural (Jaccard) + fingerprint (n-gram hash),
 * weighted. X6 applies a dedicated normalization pass and weights.
 */

// ── Token similarity ──────────────────────────────────────────────────────────

export function tokenize(code) {
  return code
    .toLowerCase()
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/[^\w]+/)
    .filter((t) => t.length > 1);
}

function diceSimilarity(tokens1, tokens2) {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  if (set1.size === 0 || set2.size === 0) return 0;
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  return (2 * intersection.size) / (set1.size + set2.size);
}

// ── Code fingerprint ──────────────────────────────────────────────────────────

function fingerprintSimilarity(code1, code2) {
  const signature = (code) => {
    const normalized = code
      .toLowerCase()
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/['"][^'"]*['"]/g, '""')
      .replace(/\d+/g, '0')
      .trim();
    const hashes = new Set();
    const n = 4;
    for (let i = 0; i <= normalized.length - n; i++) {
      const gram = normalized.slice(i, i + n);
      let hash = 0;
      for (let j = 0; j < gram.length; j++) {
        hash = (hash << 5) - hash + gram.charCodeAt(j);
        hash = hash & hash;
      }
      hashes.add(hash);
    }
    return hashes;
  };

  const s1 = signature(code1);
  const s2 = signature(code2);
  if (s1.size === 0 || s2.size === 0) return 0;
  const intersection = new Set([...s1].filter((h) => s2.has(h)));
  const union = new Set([...s1, ...s2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// ── Structural features ───────────────────────────────────────────────────────

const JS_KEYWORDS = new Set([
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
  'return', 'throw', 'try', 'catch', 'finally', 'new', 'delete', 'typeof',
  'instanceof', 'in', 'of', 'void', 'yield', 'await', 'async', 'function',
  'class', 'extends', 'super', 'this', 'let', 'const', 'var', 'import',
  'export', 'from', 'default', 'static', 'get', 'set',
]);

const API_PATTERNS = [
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
  // G6 patterns
  { name: 'new Graph', pattern: /new\s+Graph\s*\(/ },
  // X6 patterns
  { name: 'graph.addNode', pattern: /graph\.addNode\s*\(/ },
  { name: 'graph.addEdge', pattern: /graph\.addEdge\s*\(/ },
  { name: 'graph.fromJSON', pattern: /graph\.fromJSON\s*\(/ },
  { name: 'graph.use', pattern: /graph\.use\s*\(/ },
  { name: 'graph.on', pattern: /graph\.on\s*\(/ },
  { name: 'node.attr', pattern: /\.attr\s*\(/ },
  { name: 'x6.ports', pattern: /ports\s*:\s*\{/ },
  { name: 'x6.router', pattern: /router\s*:\s*['"]/ },
  { name: 'x6.connector', pattern: /connector\s*:\s*['"]/ },
  { name: 'x6.attrs', pattern: /attrs\s*:\s*\{/ },
  { name: 'x6.markup', pattern: /markup\s*:\s*\[/ },
  { name: 'x6.labels', pattern: /labels\s*:\s*\[/ },
  { name: 'x6.sourceMarker', pattern: /sourceMarker\s*:/ },
  { name: 'x6.targetMarker', pattern: /targetMarker\s*:/ },
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

export function extractStructuralFeatures(code) {
  const features = {
    imports: [],
    functionCalls: [],
    objectKeys: [],
    apiPatterns: [],
  };

  const importRegex = /import\s+\{?([^}]+)\}?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    features.imports.push({
      names: match[1].split(',').map((s) => s.trim()),
      source: match[2],
    });
  }

  const callRegex = /(\w+)\s*\(/g;
  while ((match = callRegex.exec(code)) !== null) {
    if (!JS_KEYWORDS.has(match[1])) features.functionCalls.push(match[1]);
  }

  const keyRegex = /(\w+)\s*:/g;
  while ((match = keyRegex.exec(code)) !== null) {
    features.objectKeys.push(match[1]);
  }

  for (const { name, pattern } of API_PATTERNS) {
    if (pattern.test(code)) features.apiPatterns.push(name);
  }

  return features;
}

function structuralSimilarity(f1, f2) {
  const scores = [];
  const jaccard = (a, b) => {
    const union = new Set([...a, ...b]);
    if (union.size === 0) return null;
    const intersection = a.filter((x) => b.includes(x));
    return intersection.length / union.size;
  };

  const patterns = jaccard(f1.apiPatterns, f2.apiPatterns);
  if (patterns !== null) scores.push(patterns);
  const keys = jaccard(f1.objectKeys, f2.objectKeys);
  if (keys !== null) scores.push(keys);
  const calls = jaccard(f1.functionCalls, f2.functionCalls);
  if (calls !== null) scores.push(calls);

  // Import sources use reference recall: only check that reference imports all
  // appear in generated (extra imports in generated are not penalized).
  const sources1 = f1.imports.map((i) => i.source); // generated
  const sources2 = f2.imports.map((i) => i.source); // reference
  if (sources2.length > 0) {
    const covered = sources2.filter((s) => sources1.includes(s)).length;
    scores.push(covered / sources2.length);
  } else if (sources1.length === 0) {
    scores.push(1);
  }

  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

// ── X6 normalization ──────────────────────────────────────────────────────────

/**
 * Normalize functionally-equivalent X6 writing styles so similarity compares
 * semantics, not syntax. Only applied when library === 'x6'.
 */
function normalizeX6Code(code) {
  let normalized = code;

  // container variants are equivalent
  normalized = normalized.replace(
    /container\s*:\s*document\.getElementById\s*\(\s*['"][^'"]*['"]\s*\)/g,
    "container: 'container'",
  );
  normalized = normalized.replace(/container\s*:\s*containerRef\.current/g, "container: 'container'");
  normalized = normalized.replace(/container\s*:\s*container\b(?!\s*[.'"\[])/g, "container: 'container'");

  // strip comments (avoid swallowing URL schemes like http://)
  normalized = normalized.replace(/(?<!:)\/\/.*$/gm, '');
  normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '');

  // strip console.* calls
  normalized = normalized.replace(
    /console\.(log|warn|error|info|debug)\s*\([^()]*(?:\([^()]*\)[^()]*)*\)\s*;?/g,
    '',
  );

  // strip optional side-effect calls (centering / zoom / freeze etc.)
  const OPTIONAL_CALLS = [
    'centerContent', 'center', 'zoomToFit', 'fitToContent', 'resize',
    'unfreeze', 'freeze', 'lockScroller', 'unlockScroller',
  ];
  for (const fn of OPTIONAL_CALLS) {
    normalized = normalized.replace(new RegExp(`graph\\.${fn}\\s*\\([^()]*\\)\\s*;?`, 'g'), '');
  }

  // `const x = graph.addNode(...)` ≡ `graph.addNode(...)`
  normalized = normalized.replace(
    /\b(?:const|let|var)\s+\w+\s*=\s*(graph\.(?:addNode|addEdge|createNode|createEdge)\s*\()/g,
    '$1',
  );

  // drop redundant node id fields
  normalized = normalized.replace(/(\{[^{}]*?)\bid\s*:\s*['"][^'"]*['"]\s*,?\s*/g, '$1');

  // normalize non-key string literal values (preserve shape/router/connector/type)
  const PRESERVE_VALUE_KEYS = new Set(['shape', 'router', 'connector', 'type']);
  normalized = normalized.replace(
    /(\b\w+)(\s*:\s*)(['"])((?:\\.|(?!\3)[^\\])*)\3/g,
    (match, key, sep) => (PRESERVE_VALUE_KEYS.has(key) ? match : `${key}${sep}""`),
  );

  // normalize numbers
  normalized = normalized.replace(/:\s*-?\d+(\.\d+)?/g, ': 0');

  // unify semicolons and whitespace
  normalized = normalized.replace(/;(\s*[\n\r])/g, '$1');
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized.trim();
}

// ── Hybrid similarity ─────────────────────────────────────────────────────────

const DEFAULT_WEIGHTS = { token: 0.3, structural: 0.4, fingerprint: 0.3 };
const X6_WEIGHTS = { token: 0.35, structural: 0.55, fingerprint: 0.1 };

/**
 * Calculate hybrid similarity between generated code (code1) and reference
 * code (code2). Returns a value in [0, 1].
 */
export function calculateSimilarity(code1, code2, options = {}) {
  if (!code1 || !code2) return 0;

  const isX6 = options.library === 'x6';
  const weights = isX6 ? X6_WEIGHTS : (options.weights ?? DEFAULT_WEIGHTS);

  let n1 = code1.trim();
  let n2 = code2.trim();
  if (isX6) {
    n1 = normalizeX6Code(n1);
    n2 = normalizeX6Code(n2);
  }

  const raw =
    diceSimilarity(tokenize(n1), tokenize(n2)) * weights.token +
    structuralSimilarity(extractStructuralFeatures(n1), extractStructuralFeatures(n2)) *
      weights.structural +
    fingerprintSimilarity(n1, n2) * weights.fingerprint;

  // Cap at 1.0 — structural similarity can exceed 1.0 due to duplicate keys
  return Math.min(raw, 1.0);
}
