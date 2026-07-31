// ---------------------------------------------------------------------------
// Bidirectional synonym pairs: [term, synonyms[]]
// ---------------------------------------------------------------------------

const SYNONYM_PAIRS: [string, string[]][] = [
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
  ['归一化', ['normalizey']],
  ['堆叠', ['stacky']],
  ['思维导图', ['mindmap']],
  ['鱼骨图', ['fishbone']],
  ['dagre', ['流程图']]
];

function buildSynony(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const [term, synonyms] of SYNONYM_PAIRS) {
    map[term] = synonyms;
    for (const syn of synonyms) {
      const existing = map[syn];
      if (existing) {
        if (!existing.includes(term)) existing.push(term);
      } else {
        map[syn] = [term];
      }
    }
  }
  return map;
}

export const synonyms = buildSynony();

/** Expand known chart terms with their bidirectional synonyms. */
export function expandQuery(query: string): string {
  const additions = new Set<string>();

  for (const [term, values] of Object.entries(synonyms)) {
    if (!query.toLowerCase().includes(term.toLowerCase())) continue;

    for (const value of values) {
      if (!query.toLowerCase().includes(value.toLowerCase())) {
        additions.add(value);
      }
    }
  }

  return additions.size > 0 ? `${query} ${[...additions].join(' ')}` : query;
}
