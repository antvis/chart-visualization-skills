/**
 * Shared chart-type synonym map — single source of truth for both
 * FTS query expansion (retriever) and embedding token expansion (embedder).
 *
 * Rules for adding entries:
 * 1. Only add distinctive chart-type terms (not common English words).
 *    "饼图" → "pie" hurts more than helps ("pie" is ambiguous outside chart context).
 * 2. Only expand to unambiguous chart-type names (treemap, sankey, etc.).
 * 3. Keep bidirectional: Chinese → English AND English → Chinese.
 */

// ---------------------------------------------------------------------------
// Bidirectional synonym pairs: [term, synonyms[]]
// Each pair is listed once in one direction; the reverse direction is
// generated automatically by initSynonyms().
// ---------------------------------------------------------------------------

const SYNONYM_PAIRS: [string, string[]][] = [
  // ── G2 chart types: Chinese → English ──────────────────────────────────
  ['矩形树图', ['treemap']],
  ['树图', ['treemap']],
  ['旭日图', ['sunburst']],
  ['桑基图', ['sankey']],
  ['箱线图', ['boxplot']],
  ['瀑布图', ['waterfall']],
  ['漏斗图', ['funnel']],
  ['词云', ['wordcloud']],
  ['仪表盘', ['gauge']],
  ['甘特图', ['gantt']],
  ['直方图', ['histogram']],
  ['密度图', ['density']],
  ['打包图', ['pack']],
  ['蜂群图', ['beeswarm']],
  ['热力图', ['heatmap']],
  ['雷达图', ['radar']],
  ['子弹图', ['bullet']],
  ['韦恩图', ['venn']],
  ['小提琴图', ['violin']],
  ['涟漪图', ['ridgeline']],
  ['马赛克图', ['mosaic', 'marimekko']],
  ['哑铃图', ['dumbbell']],
  ['棒棒糖图', ['lollipop']],
  ['华夫饼图', ['waffle']],
  ['玫瑰图', ['rose', 'nightingale']],
  ['折线图', ['line']],
  ['柱状图', ['bar', 'interval']],
  ['条形图', ['bar', 'interval']],
  ['饼图', ['pie']],
  ['散点图', ['scatter']],
  ['面积图', ['area']],
  ['环形图', ['donut']],
  ['气泡图', ['bubble']],

  // ── G2 transforms ──────────────────────────────────────────────────────
  ['归一化', ['normalizey']],
  ['堆叠', ['stacky']],

  // ── G6 distinctive ─────────────────────────────────────────────────────
  ['思维导图', ['mindmap']],
  ['鱼骨图', ['fishbone']],
  ['dagre', ['流程图']],
];

// ---------------------------------------------------------------------------
// Initialized synonym map (bidirectional, lazily built on first access)
// ---------------------------------------------------------------------------

let _synonymMap: Map<string, string[]> | null = null;

function initSynonymMap(): Map<string, string[]> {
  if (_synonymMap) return _synonymMap;

  const map = new Map<string, string[]>();

  for (const [term, synonyms] of SYNONYM_PAIRS) {
    // Forward direction
    map.set(term, synonyms);

    // Reverse direction: each synonym → [term]
    for (const syn of synonyms) {
      const existing = map.get(syn);
      if (existing) {
        // Avoid duplicate reverse entries
        if (!existing.includes(term)) existing.push(term);
      } else {
        map.set(syn, [term]);
      }
    }
  }

  _synonymMap = map;
  return map;
}

/**
 * Get the full bidirectional synonym map.
 * Used by embedder for token-level synonym expansion.
 */
export function getSynonymMap(): Map<string, string[]> {
  return initSynonymMap();
}

/**
 * Expand a query string with known chart-type synonyms to boost
 * cross-language FTS recall.
 *
 * For each term in the query that appears in the synonym map, all
 * associated synonyms are appended (if not already present).
 *
 * @example expandQuery('桑基图') → '桑基图 sankey'
 * @example expandQuery('treemap') → 'treemap 矩形树图 树图'
 */
export function expandQuery(query: string): string {
  const map = initSynonymMap();
  let expanded = query;

  for (const [term, synonyms] of map) {
    if (query.includes(term)) {
      for (const syn of synonyms) {
        if (!query.includes(syn)) {
          expanded += ` ${syn}`;
        }
      }
    }
  }

  return expanded;
}

/**
 * Return all synonym expansions for a given token.
 * Used by embedder for per-token synonym injection during embedding.
 *
 * @param token A single token (e.g. '树图' or 'treemap')
 * @returns Array of synonym tokens, or empty array if none found.
 */
export function getSynonymsForToken(token: string): string[] {
  const map = initSynonymMap();
  return map.get(token) ?? [];
}
