// TODO: 考虑替换为社区库，当前实现有大量领域定制（中英文混合分词、同义词扩展、primary chart token boost），替换时需保留这些能力。
// | 库                       | 特点                                                       |
// |--------------------------|-----------------------------------------------------------|
// | wink-bm25-text-search    | 最成熟，支持自定义 tokenizer、field boost、JSON 文档索引       |
// | fast-bm25                | TypeScript 原生，支持 field boosting，API 简洁               |
// | bm25-lite                | 极轻量，TypeScript，适合简单场景                              |
import type { Skill, BM25Options } from './types';

const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
  '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着',
  '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '些',
  '什么', '怎么', '如何', '为什么', '可以', '使用', '用', '个', '中',
  '图', '图表', '画', '绘制', '展示', '显示', '实现', '基于', '根据',
  '一张', '一幅', '效果', '方式', '功能', '支持', '需要', '进行', '通过',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'and',
  'but', 'or', 'if', 'while', 'this', 'that', 'these', 'those', 'i',
  'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she',
  'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who',
  'whom', 'whose',
  'chart', 'render', 'data', 'config', 'options', 'using', 'use', 'set',
  'add', 'show', 'display', 'create', 'new', 'type', 'value', 'import',
]);

const PRIMARY_CHART_TOKENS = new Set([
  // G2 statistical chart types
  'beeswarm', 'sankey', 'chord', 'treemap', 'sunburst', 'boxplot', 'waterfall', 'funnel',
  'gauge', 'gantt', 'wordcloud', 'candlestick', 'bullet', 'density', 'liquid', 'venn',
  'pack', 'spiral', 'contour', 'violin', 'ridgeline', 'marimekko', 'mosaic', 'bump',
  'dumbbell', 'lollipop', 'dot', 'waffle', 'nightingale', 'rose',
  '蜂群图', '漏斗图', '玫瑰图', '仪表盘', '甘特图', '词云', '箱线图', '旭日图',
  '矩形树图', '桑基图', '和弦图', '密度图', '打包图', '瀑布图', 'K线图', '子弹图',
  '韦恩图', '液体图', '螺旋图', '小提琴图',
  // G6 graph types and layouts
  'dagre', 'fishbone', 'mindmap', 'radial', 'dendrogram',
  '关系图', '网络图', '拓扑图', '流程图', '思维导图', '鱼骨图', '组织架构图', '知识图谱',
  '层次图', '辐射图',
]);

const SYNONYMS = new Map<string, string[]>([
  ['折线', ['line']], ['折线图', ['line']],
  ['柱状', ['interval', 'bar']], ['柱状图', ['interval', 'bar']],
  ['条形', ['interval', 'bar']], ['条形图', ['interval', 'bar']],
  ['饼图', ['pie', 'theta', 'interval']], ['环形图', ['donut', 'theta']],
  ['散点', ['point', 'scatter']], ['散点图', ['point', 'scatter']],
  ['气泡', ['point', 'bubble']], ['气泡图', ['point', 'bubble']],
  ['面积', ['area']], ['面积图', ['area']],
  ['热力', ['heatmap', 'cell']], ['热力图', ['heatmap', 'cell']],
  ['雷达', ['radar']], ['雷达图', ['radar']],
  ['桑基', ['sankey']], ['桑基图', ['sankey']],
  ['矩形树图', ['treemap']], ['树图', ['treemap']],
  ['旭日', ['sunburst']], ['旭日图', ['sunburst']],
  ['箱线', ['boxplot']], ['箱线图', ['boxplot']],
  ['瀑布', ['waterfall']], ['瀑布图', ['waterfall']],
  ['漏斗', ['funnel']], ['漏斗图', ['funnel']],
  ['玫瑰', ['rose', 'nightingale']], ['玫瑰图', ['rose', 'nightingale']],
  ['词云', ['wordcloud']], ['仪表盘', ['gauge']],
  ['甘特', ['gantt']], ['甘特图', ['gantt']],
  ['直方', ['histogram', 'bin']], ['直方图', ['histogram', 'bin']],
  ['密度', ['density']], ['密度图', ['density']],
  ['打包图', ['pack']], ['蜂群图', ['beeswarm']],
  ['堆叠', ['stack', 'stacky']],
  ['归一化', ['normalize', 'normalizey']],
  ['排序', ['sort', 'sorty', 'sortx']],
  ['横向', ['transpose']], ['纵向', ['cartesian']],
  ['极坐标', ['polar']], ['坐标轴', ['axis']], ['坐标系', ['coordinate']],
  ['图例', ['legend']], ['提示框', ['tooltip']],
  ['标签', ['label']], ['标题', ['title']],
  ['滚动条', ['scrollbar']], ['缩略轴', ['slider']],
  ['比例尺', ['scale']], ['主题', ['theme']],
  ['暗色', ['theme', 'dark']], ['深色', ['theme', 'dark']],
  ['动画', ['animation', 'animate']], ['交互', ['interaction']],
  ['框选', ['brush']], ['高亮', ['highlight', 'elementhighlight']],
  // G6: Chinese → English
  ['关系图', ['network', 'graph']], ['网络图', ['network', 'graph']],
  ['拓扑图', ['network', 'topology']], ['知识图谱', ['network', 'knowledge']],
  ['流程图', ['flow', 'dag', 'dagre']], ['有向无环图', ['dag', 'dagre']],
  ['思维导图', ['mindmap']], ['组织架构图', ['tree', 'dendrogram']],
  ['鱼骨图', ['fishbone']], ['层次图', ['dagre', 'hierarchy']],
  ['辐射图', ['radial']], ['树状图', ['tree', 'dendrogram']],
  ['力导向', ['force']], ['力导向布局', ['force']],
  ['层次布局', ['dagre', 'hierarchy']], ['环形布局', ['circular']],
  ['辐射布局', ['radial']], ['网格布局', ['grid']],
  ['节点', ['node']], ['连线', ['edge', 'link']], ['组合', ['combo']],
  ['套索', ['lasso']], ['折叠', ['collapse']], ['展开', ['expand']],
  ['缩略图', ['minimap']], ['时间轴', ['timebar']], ['工具栏', ['toolbar']],
  ['拖拽画布', ['drag-canvas']], ['缩放画布', ['zoom-canvas']],
  ['点击选中', ['click-select']], ['拖拽元素', ['drag-element']],
  // G6: English → Chinese
  ['dagre', ['流程图', '层次']], ['fishbone', ['鱼骨图']],
  ['mindmap', ['思维导图']], ['radial', ['辐射']],
  ['dendrogram', ['树状图', '组织架构']],
  ['node', ['节点']], ['combo', ['组合']],
  ['minimap', ['缩略图']], ['timebar', ['时间轴']], ['toolbar', ['工具栏']],
  ['lasso', ['套索', '框选']], ['collapse', ['折叠']], ['expand', ['展开']],
  ['line', ['折线']], ['bar', ['柱状']], ['pie', ['饼图']],
  ['interval', ['柱状']], ['scatter', ['散点']], ['point', ['散点']],
  ['area', ['面积']], ['heatmap', ['热力']], ['cell', ['热力']],
  ['radar', ['雷达']], ['sankey', ['桑基']], ['treemap', ['矩形树图']],
  ['sunburst', ['旭日']], ['boxplot', ['箱线']], ['waterfall', ['瀑布']],
  ['funnel', ['漏斗']], ['wordcloud', ['词云']], ['histogram', ['直方']],
  ['stack', ['堆叠']], ['transpose', ['横向']], ['brush', ['框选']],
  ['highlight', ['高亮']], ['tooltip', ['提示框']], ['legend', ['图例']],
  ['axis', ['坐标轴']], ['theme', ['主题']], ['animation', ['动画']],
  ['interaction', ['交互']], ['scale', ['比例尺']], ['label', ['标签']],
  ['slider', ['缩略轴']], ['scrollbar', ['滚动条']],
]);

const EXTRA_DICT = new Set([
  // common interaction/config
  '点击', '拖拽', '缩放', '悬停', '选中', '过滤',
  '渲染', '更新', '刷新', '加载', '切换', '联动',
  '指标', '目标', '数值', '百分比', '进度', '占比',
  '数据', '配置', '自定义', '响应式', '动态',
  '系列', '分类', '维度', '度量', '字段',
  '布局', '容器', '宽度', '高度', '间距', '边距',
  '颜色', '透明度', '圆角', '虚线', '实线',
  '字体', '字号', '粗细', '旋转', '偏移',
  // G6-specific
  '节点', '连线', '组合', '套索', '折叠', '展开',
  '关系', '拓扑', '层次', '辐射', '力导向',
  '缩略图', '时间轴', '工具栏', '画布', '边框',
]);

const _DICT_TERMS = [
  ...new Set([
    ...[...SYNONYMS.keys()].filter(k => /[\u4e00-\u9fff]/.test(k)),
    ...EXTRA_DICT,
  ]),
].sort((a, b) => b.length - a.length);

const _SECONDARY_FEATURE_TOKENS = new Set([
  '图例', 'legend', '坐标轴', 'axis', '提示框', 'tooltip',
  '分组', 'group', '标签', 'label', '标题', 'title',
  '颜色', 'color', '交互', 'interaction', '主题', 'theme',
]);

function segmentChinese(segment: string): string[] {
  const tokens: string[] = [];
  const covered = new Uint8Array(segment.length);

  for (const term of _DICT_TERMS) {
    let pos = 0;
    while ((pos = segment.indexOf(term, pos)) !== -1) {
      if (!STOP_WORDS.has(term)) tokens.push(term);
      for (let j = pos; j < pos + term.length; j++) covered[j] = 1;
      pos += 1;
    }
  }

  let runStart = -1;
  for (let i = 0; i <= segment.length; i++) {
    if (i < segment.length && !covered[i]) {
      if (runStart === -1) runStart = i;
    } else {
      if (runStart !== -1) {
        const run = segment.slice(runStart, i);
        for (let j = 0; j < run.length - 1; j++) {
          const bigram = run.slice(j, j + 2);
          if (!STOP_WORDS.has(bigram)) tokens.push(bigram);
        }
        for (let j = 0; j < run.length - 2; j++) {
          const trigram = run.slice(j, j + 3);
          if (!STOP_WORDS.has(trigram)) tokens.push(trigram);
        }
        runStart = -1;
      }
    }
  }

  return tokens;
}

export function cleanQuery(query: string): string {
  let q = query;
  q = q.replace(/```[\s\S]*?```/g, '');
  q = q.replace(/[。.]?\s*参考数据[：:][\s\S]*$/g, '');
  q = q.replace(/\{[^{}]*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}[^{}]*)?\}/g, '');
  q = q.replace(/\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)?\]/g, '');
  q = q.replace(/^根据描述绘制图表[，,。.]\s*/g, '');
  q = q.replace(/^请?\s*(?:用|使用)\s*(?:G2|G6|AntV)\s*/gi, '');
  return q.trim();
}

export function tokenize(text: string, options: { suppressSecondaryExpansion?: boolean } = {}): string[] {
  if (!text) return [];

  const normalized = text.toLowerCase();
  const tokens: string[] = [];

  const englishPattern = /[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*/gi;
  let match;
  while ((match = englishPattern.exec(normalized)) !== null) {
    const word = match[0].toLowerCase();
    if (word.length >= 1 && !STOP_WORDS.has(word)) tokens.push(word);
  }

  const chineseSegments = normalized.match(/[\u4e00-\u9fff]+/g) || [];
  for (const segment of chineseSegments) {
    tokens.push(...segmentChinese(segment));
  }

  const hasPrimaryToken = options.suppressSecondaryExpansion
    ? true
    : tokens.some(t => PRIMARY_CHART_TOKENS.has(t));

  const expanded: string[] = [];
  for (const t of tokens) {
    if (hasPrimaryToken && _SECONDARY_FEATURE_TOKENS.has(t)) continue;
    const syns = SYNONYMS.get(t);
    if (syns) {
      for (const syn of syns) {
        if (!STOP_WORDS.has(syn)) expanded.push(syn);
      }
    }
  }
  tokens.push(...expanded);

  return tokens;
}

function detectPrimaryChartTokens(tokens: string[]): Set<string> {
  const found = new Set<string>();
  for (const t of tokens) {
    if (PRIMARY_CHART_TOKENS.has(t)) found.add(t);
  }
  return found;
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  return tf;
}

type FieldTokens = Record<string, string[]>;

export class BM25Index {
  private k1: number;
  private b: number;
  private fieldWeights: Record<string, number>;
  private documents: Skill[] = [];
  private docFields: FieldTokens[] = [];
  private docLengths: number[] = [];
  private avgDocLength = 0;
  private idf = new Map<string, number>();
  private docCount = 0;
  private _rawTags: string[][] = [];

  constructor(options: BM25Options = {}) {
    this.k1 = options.k1 ?? 1.5;
    this.b = options.b ?? 0.5;
    this.fieldWeights = options.fieldWeights || {
      title: 10.0,
      tags: 6.0,
      use_cases: 1.0,
      category: 1.0,
      subcategory: 3.0,
      description: 2.0,
    };
  }

  build(skills: Skill[]): void {
    this.documents = skills;
    this.docCount = skills.length;
    this.docFields = [];
    this.docLengths = [];
    this._rawTags = skills.map(s => s.tags || []);

    const df = new Map<string, number>();
    let totalLength = 0;

    for (const skill of skills) {
      const fields = this._extractFields(skill);
      this.docFields.push(fields);

      let docLen = 0;
      const seenTerms = new Set<string>();

      for (const fieldTokens of Object.values(fields)) {
        docLen += fieldTokens.length;
        for (const t of fieldTokens) seenTerms.add(t);
      }

      this.docLengths.push(docLen);
      totalLength += docLen;

      for (const term of seenTerms) {
        df.set(term, (df.get(term) || 0) + 1);
      }
    }

    this.avgDocLength = totalLength / (this.docCount || 1);

    for (const [term, freq] of df) {
      this.idf.set(term, Math.log((this.docCount - freq + 0.5) / (freq + 0.5) + 1));
    }
  }

  search(query: string, topK = 7): Array<{ skill: Skill; score: number }> {
    const cleaned = cleanQuery(query);
    const queryTokens = tokenize(cleaned);
    const queryTF = termFrequency(queryTokens);
    const primaryTokensInQuery = detectPrimaryChartTokens(queryTokens);

    const scores = new Array(this.docCount).fill(0);

    for (const [term, queryFreq] of queryTF) {
      const idf = this.idf.get(term);
      if (idf === undefined) continue;

      for (let i = 0; i < this.docCount; i++) {
        const fields = this.docFields[i];
        const docLen = this.docLengths[i];

        let fieldScore = 0;
        for (const [fieldName, fieldTokens] of Object.entries(fields)) {
          const weight = this.fieldWeights[fieldName] || 1.0;
          const tf = this._countTerm(fieldTokens, term);
          if (tf === 0) continue;

          const tfNorm = (tf * (this.k1 + 1)) /
            (tf + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength)));
          fieldScore += weight * idf * tfNorm;
        }

        scores[i] += fieldScore * Math.log2(1 + queryFreq);
      }
    }

    if (primaryTokensInQuery.size > 0) {
      const TITLE_BOOST = 4.0;
      for (let i = 0; i < this.docCount; i++) {
        if (scores[i] === 0) continue;
        const titleTokens = this.docFields[i].title || [];
        let hasMatch = false;
        for (const pt of primaryTokensInQuery) {
          if (titleTokens.includes(pt) || (this.docFields[i].tags || []).includes(pt) || (this._rawTags[i] || []).includes(pt)) {
            hasMatch = true;
            break;
          }
        }
        if (hasMatch) scores[i] *= TITLE_BOOST;
      }
    }

    const results: Array<{ skill: Skill; score: number }> = [];
    for (let i = 0; i < this.docCount; i++) {
      if (scores[i] > 0) {
        results.push({ skill: this.documents[i], score: scores[i] });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  private _extractFields(skill: Skill): FieldTokens {
    return {
      title: tokenize(skill.title || ''),
      description: tokenize(skill.description || ''),
      tags: tokenize((skill.tags || []).join(' ')),
      use_cases: tokenize((skill.use_cases || []).join(' ')),
      category: tokenize(skill.category || ''),
      subcategory: tokenize(skill.subcategory || ''),
    };
  }

  private _countTerm(tokens: string[], term: string): number {
    let count = 0;
    for (const t of tokens) {
      if (t === term) count++;
    }
    return count;
  }
}
