/**
 * BM25 (Best Matching 25) Search Engine
 *
 * A zero-dependency implementation of the Okapi BM25 ranking algorithm
 * optimized for AntV skills retrieval with Chinese + English mixed text support.
 *
 * BM25 Parameters:
 *   k1 (1.2-2.0): Term frequency saturation. Higher = more weight to repeated terms.
 *   b  (0.0-1.0): Document length normalization. 0 = no normalization, 1 = full.
 *
 * References:
 *   - Robertson & Zaragoza, "The Probabilistic Relevance Framework: BM25 and Beyond"
 *   - https://en.wikipedia.org/wiki/Okapi_BM25
 */

// Chinese stop words that carry little search value
const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
  '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着',
  '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '些',
  '什么', '怎么', '如何', '为什么', '可以', '使用', '用', '个', '中',
  // Domain-generic terms that appear in nearly every query/skill (zero discriminative value)
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
  // Domain-generic English terms
  'chart', 'render', 'data', 'config', 'options', 'using', 'use', 'set',
  'add', 'show', 'display', 'create', 'new', 'type', 'value', 'import'
]);

// Primary chart-type tokens: rare, highly specific identifiers for a single mark/skill.
// When ANY of these tokens appears in a query, they signal the primary chart type intent
// and will receive extra scoring boost in the search phase.
const PRIMARY_CHART_TOKENS = new Set([
  // English mark type names (must be unique to one chart type)
  'beeswarm', 'sankey', 'chord', 'treemap', 'sunburst', 'boxplot', 'waterfall', 'funnel',
  'gauge', 'gantt', 'wordcloud', 'candlestick', 'bullet', 'density', 'liquid', 'venn',
  'pack', 'spiral', 'contour', 'violin', 'ridgeline', 'marimekko', 'mosaic', 'bump',
  'dumbbell', 'lollipop', 'dot', 'waffle', 'nightingale', 'rose',
  // Chinese equivalents
  '蜂群图', '漏斗图', '玫瑰图', '仪表盘', '甘特图', '词云', '箱线图', '旭日图',
  '矩形树图', '桑基图', '和弦图', '密度图', '打包图', '瀑布图', 'K线图', '子弹图',
  '韦恩图', '液体图', '螺旋图', '小提琴图',
]);

// Domain synonym map: Chinese ↔ English cross-language expansion
// Each key is a token that may appear in queries or skill text;
// values are additional tokens to inject for better cross-language matching.
//
// IMPORTANT: Synonym expansion runs on BOTH query tokens AND document tokens.
// To avoid secondary-feature tokens (axis/legend) overwhelming primary chart-type
// matches, keep each expansion list short and chart-type-focused.
const SYNONYMS = new Map([
  // Chart types (Chinese → English marks/coords)
  ['折线', ['line']],
  ['折线图', ['line']],
  ['柱状', ['interval', 'bar']],
  ['柱状图', ['interval', 'bar']],
  ['条形', ['interval', 'bar']],
  ['条形图', ['interval', 'bar']],
  ['饼图', ['pie', 'theta', 'interval']],
  ['环形图', ['donut', 'theta']],
  ['散点', ['point', 'scatter']],
  ['散点图', ['point', 'scatter']],
  ['气泡', ['point', 'bubble']],
  ['气泡图', ['point', 'bubble']],
  ['面积', ['area']],
  ['面积图', ['area']],
  ['热力', ['heatmap', 'cell']],
  ['热力图', ['heatmap', 'cell']],
  ['雷达', ['radar']],
  ['雷达图', ['radar']],
  ['桑基', ['sankey']],
  ['桑基图', ['sankey']],
  ['矩形树图', ['treemap']],
  ['树图', ['treemap']],
  ['旭日', ['sunburst']],
  ['旭日图', ['sunburst']],
  ['箱线', ['boxplot']],
  ['箱线图', ['boxplot']],
  ['瀑布', ['waterfall']],
  ['瀑布图', ['waterfall']],
  ['漏斗', ['funnel']],
  ['漏斗图', ['funnel']],
  ['玫瑰', ['rose', 'nightingale']],
  ['玫瑰图', ['rose', 'nightingale']],
  ['词云', ['wordcloud']],
  ['仪表盘', ['gauge']],
  ['甘特', ['gantt']],
  ['甘特图', ['gantt']],
  ['直方', ['histogram', 'bin']],
  ['直方图', ['histogram', 'bin']],
  ['密度', ['density']],
  ['密度图', ['density']],
  ['打包图', ['pack']],
  ['蜂群图', ['beeswarm']],
  // Transforms — intentionally kept minimal: '分组' maps only to 'groupx' avoid
  // polluting queries that use 分组 as a secondary descriptor (e.g. "beeswarm 按分组")
  ['堆叠', ['stack', 'stacky']],
  ['归一化', ['normalize', 'normalizey']],
  ['排序', ['sort', 'sorty', 'sortx']],
  // Layout / coordinate
  ['横向', ['transpose']],
  ['纵向', ['cartesian']],
  ['极坐标', ['polar']],
  ['坐标轴', ['axis']],
  ['坐标系', ['coordinate']],
  // Components — kept deliberately light to avoid boosting component skills
  // when querying for chart types that happen to mention axis/legend
  ['图例', ['legend']],
  ['提示框', ['tooltip']],
  ['标签', ['label']],
  ['标题', ['title']],
  ['滚动条', ['scrollbar']],
  ['缩略轴', ['slider']],
  // Scales / theme / interaction
  ['比例尺', ['scale']],
  ['主题', ['theme']],
  ['暗色', ['theme', 'dark']],
  ['深色', ['theme', 'dark']],
  ['动画', ['animation', 'animate']],
  ['交互', ['interaction']],
  ['框选', ['brush']],
  ['高亮', ['highlight', 'elementhighlight']],
  // English → Chinese (reverse expansion)
  ['line', ['折线']],
  ['bar', ['柱状']],
  ['pie', ['饼图']],
  ['interval', ['柱状']],
  ['scatter', ['散点']],
  ['point', ['散点']],
  ['area', ['面积']],
  ['heatmap', ['热力']],
  ['cell', ['热力']],
  ['radar', ['雷达']],
  ['sankey', ['桑基']],
  ['treemap', ['矩形树图']],
  ['sunburst', ['旭日']],
  ['boxplot', ['箱线']],
  ['waterfall', ['瀑布']],
  ['funnel', ['漏斗']],
  ['wordcloud', ['词云']],
  ['histogram', ['直方']],
  ['stack', ['堆叠']],
  ['transpose', ['横向']],
  ['brush', ['框选']],
  ['highlight', ['高亮']],
  ['tooltip', ['提示框']],
  ['legend', ['图例']],
  ['axis', ['坐标轴']],
  ['theme', ['主题']],
  ['animation', ['动画']],
  ['interaction', ['交互']],
  ['scale', ['比例尺']],
  ['label', ['标签']],
  ['slider', ['缩略轴']],
  ['scrollbar', ['滚动条']],
]);

/**
 * Clean query text before tokenizing:
 *   1. Strip JSON/code blocks that pollute token space
 *   2. Strip boilerplate prefixes common in eval datasets
 *
 * Only applied to search queries, NOT to skill document text.
 *
 * @param {string} query - Raw query text
 * @returns {string} Cleaned query
 */
function cleanQuery(query) {
  let q = query;
  // Strip code blocks
  q = q.replace(/```[\s\S]*?```/g, '');
  // Strip "参考数据" section and everything after it (JSON payloads)
  q = q.replace(/[。.]?\s*参考数据[：:][\s\S]*$/g, '');
  // Strip remaining inline JSON (balanced braces, up to 3 levels deep)
  q = q.replace(/\{[^{}]*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}[^{}]*)?\}/g, '');
  // Strip remaining inline arrays
  q = q.replace(/\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)?\]/g, '');
  // Strip common boilerplate prefixes
  q = q.replace(/^根据描述绘制图表[，,。.]\s*/g, '');
  q = q.replace(/^请?\s*(?:用|使用)\s*(?:G2|G6|AntV)\s*/gi, '');
  return q.trim();
}

/**
 * Detect primary chart-type tokens present in a query's token list.
 * These are rare, highly specific terms that unambiguously identify one chart type.
 *
 * @param {string[]} tokens - Tokenized query
 * @returns {Set<string>} Set of primary chart-type tokens found
 */
function detectPrimaryChartTokens(tokens) {
  const found = new Set();
  for (const t of tokens) {
    if (PRIMARY_CHART_TOKENS.has(t)) found.add(t);
  }
  return found;
}

/**
 * Tokenize mixed Chinese/English text into search terms.
 *
 * Strategy:
 *   - English: split on whitespace/punctuation, lowercase, filter stop words
 *   - Chinese: bigram + trigram sliding window (lightweight, no dictionary needed)
 *   - Synonym expansion for cross-language matching
 *
 * @param {string} text - Input text
 * @returns {string[]} Array of tokens (may contain duplicates for TF counting)
 */
// Additional domain terms for dictionary segmentation.
// These are common Chinese terms that should be matched as whole tokens
// even though they don't need synonym expansion.
const EXTRA_DICT = new Set([
  // Actions
  '点击', '拖拽', '缩放', '悬停', '选中', '过滤',
  '渲染', '更新', '刷新', '加载', '切换', '联动',
  // Descriptors
  '指标', '目标', '数值', '百分比', '进度', '占比',
  '数据', '配置', '自定义', '响应式', '动态',
  // Chart parts
  '系列', '分类', '维度', '度量', '字段',
  // Layout
  '布局', '容器', '宽度', '高度', '间距', '边距',
  '颜色', '透明度', '圆角', '虚线', '实线',
  '字体', '字号', '粗细', '旋转', '偏移',
]);

// Build a sorted (longest-first) dictionary from SYNONYMS keys + EXTRA_DICT.
// Used by segmentChinese() for dictionary-priority matching.
const _DICT_TERMS = [
  ...new Set([
    ...[...SYNONYMS.keys()].filter((k) => /[\u4e00-\u9fff]/.test(k)),
    ...EXTRA_DICT
  ])
].sort((a, b) => b.length - a.length); // longest first for greedy matching

/**
 * Segment a Chinese string using dictionary-priority matching:
 *   1. Greedily extract known terms (from SYNONYMS keys) — longest match first
 *   2. Generate bigram + trigram n-grams only for leftover (unmatched) segments
 *
 * This avoids the core problem of blind n-gram sliding window on long sentences
 * where most bigrams are meaningless cross-word fragments.
 *
 * @param {string} segment - Continuous Chinese character string
 * @returns {string[]} Tokens
 */
function segmentChinese(segment) {
  const tokens = [];
  // Track which character positions are covered by dictionary matches
  const covered = new Uint8Array(segment.length);

  // Pass 1: dictionary extraction (longest match first)
  for (const term of _DICT_TERMS) {
    let pos = 0;
    while ((pos = segment.indexOf(term, pos)) !== -1) {
      if (!STOP_WORDS.has(term)) {
        tokens.push(term);
      }
      for (let j = pos; j < pos + term.length; j++) {
        covered[j] = 1;
      }
      pos += 1; // allow overlapping dictionary matches (e.g. "仪表盘" and "仪表")
    }
  }

  // Pass 2: n-gram only on uncovered runs
  let runStart = -1;
  for (let i = 0; i <= segment.length; i++) {
    if (i < segment.length && !covered[i]) {
      if (runStart === -1) runStart = i;
    } else {
      if (runStart !== -1) {
        const run = segment.slice(runStart, i);
        // Bigrams
        for (let j = 0; j < run.length - 1; j++) {
          const bigram = run.slice(j, j + 2);
          if (!STOP_WORDS.has(bigram)) {
            tokens.push(bigram);
          }
        }
        // Trigrams
        for (let j = 0; j < run.length - 2; j++) {
          const trigram = run.slice(j, j + 3);
          if (!STOP_WORDS.has(trigram)) {
            tokens.push(trigram);
          }
        }
        runStart = -1;
      }
    }
  }

  return tokens;
}

// Tokens that represent secondary chart features (axes, legends, styles).
// When a query contains a PRIMARY_CHART_TOKEN, these tokens' synonym expansions
// are suppressed to prevent component/transform skills from outscoring the target.
const _SECONDARY_FEATURE_TOKENS = new Set([
  '图例', 'legend', '坐标轴', 'axis', '提示框', 'tooltip',
  '分组', 'group', '标签', 'label', '标题', 'title',
  '颜色', 'color', '交互', 'interaction', '主题', 'theme',
]);

function tokenize(text, options = {}) {
  if (!text) return [];

  const normalized = text.toLowerCase();
  const tokens = [];

  // Extract English words and identifiers (keep alphanumeric like "g2", "stackY")
  const englishPattern = /[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*/gi;
  let match;
  while ((match = englishPattern.exec(normalized)) !== null) {
    const word = match[0].toLowerCase();
    if (word.length >= 1 && !STOP_WORDS.has(word)) {
      tokens.push(word);
    }
  }

  // Segment Chinese: dictionary-priority + n-gram fallback
  const chineseSegments = normalized.match(/[\u4e00-\u9fff]+/g) || [];
  for (const segment of chineseSegments) {
    tokens.push(...segmentChinese(segment));
  }

  // Detect whether this text (as a query) contains primary chart-type tokens.
  // When true, skip synonym expansion for secondary feature tokens to prevent
  // component/transform skills from drowning out the target chart-type skill.
  const hasPrimaryToken = options.suppressSecondaryExpansion
    ? true
    : tokens.some((t) => PRIMARY_CHART_TOKENS.has(t));

  // Synonym expansion: inject cross-language equivalents
  const expanded = [];
  for (const t of tokens) {
    // Suppress secondary-feature expansions when a primary chart token is present
    if (hasPrimaryToken && _SECONDARY_FEATURE_TOKENS.has(t)) continue;
    const syns = SYNONYMS.get(t);
    if (syns) {
      for (const syn of syns) {
        if (!STOP_WORDS.has(syn)) {
          expanded.push(syn);
        }
      }
    }
  }
  tokens.push(...expanded);

  return tokens;
}

/**
 * Count term frequencies in a token array.
 * @param {string[]} tokens
 * @returns {Map<string, number>}
 */
function termFrequency(tokens) {
  const tf = new Map();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  return tf;
}

/**
 * BM25 Index — holds pre-computed IDF and document stats for fast scoring.
 */
class BM25Index {
  /**
   * @param {Object} options
   * @param {number} [options.k1=1.5]  - Term frequency saturation parameter
   * @param {number} [options.b=0.75]  - Document length normalization parameter
   * @param {Object} [options.fieldWeights] - Per-field weight multipliers
   */
  constructor(options = {}) {
    this.k1 = options.k1 ?? 1.5;
    this.b = options.b ?? 0.5;

    // Field-level boosting (tuned via eval/_tune-bm25.js grid search):
    //   title:10  — chart type name is the strongest signal
    //   tags:6    — curated keywords are high-value
    //   subcategory:3 — subcategory names are discriminative
    //   desc:2    — long descriptions carry useful context
    //   use_cases/category:1 — demoted to reduce noise
    this.fieldWeights = options.fieldWeights || {
      title: 10.0,
      tags: 6.0,
      use_cases: 1.0,
      category: 1.0,
      subcategory: 3.0,
      description: 2.0
    };

    // Internal state
    this.documents = [];       // Original skill objects
    this.docFields = [];       // Per-doc, per-field token arrays
    this.docLengths = [];      // Total token count per document
    this.avgDocLength = 0;
    this.idf = new Map();      // term -> IDF score
    this.docCount = 0;
  }

  /**
   * Build the index from an array of skill metadata objects.
   * @param {Array<Object>} skills - Skill index entries
   */
  build(skills) {
    this.documents = skills;
    this.docCount = skills.length;
    this.docFields = [];
    this.docLengths = [];
    // Raw (untokenized) tags per document for exact primary-token matching
    this._rawTags = skills.map((s) => s.tags || []);

    // Document frequency: how many documents contain each term
    const df = new Map();
    let totalLength = 0;

    for (const skill of skills) {
      const fields = this._extractFields(skill);
      this.docFields.push(fields);

      // Collect all tokens across fields for doc length
      let docLen = 0;
      const seenTerms = new Set();

      for (const [, fieldTokens] of Object.entries(fields)) {
        docLen += fieldTokens.length;
        for (const t of fieldTokens) {
          seenTerms.add(t);
        }
      }

      this.docLengths.push(docLen);
      totalLength += docLen;

      // Count document frequency
      for (const term of seenTerms) {
        df.set(term, (df.get(term) || 0) + 1);
      }
    }

    this.avgDocLength = totalLength / (this.docCount || 1);

    // Compute IDF using the standard BM25 formula:
    //   IDF(t) = ln((N - df(t) + 0.5) / (df(t) + 0.5) + 1)
    // The +1 ensures IDF is always non-negative
    for (const [term, freq] of df) {
      this.idf.set(
        term,
        Math.log((this.docCount - freq + 0.5) / (freq + 0.5) + 1)
      );
    }
  }

  /**
   * Score all documents against a query and return top-K results.
   *
   * @param {string} query - Search query text
   * @param {number} [topK=7] - Number of results to return
   * @returns {Array<{skill: Object, score: number}>}
   */
  search(query, topK = 7) {
    const cleaned = cleanQuery(query);
    const queryTokens = tokenize(cleaned);
    const queryTF = termFrequency(queryTokens);

    // Detect primary chart-type tokens in the query.
    // When found, documents whose TITLE contains that exact token receive a
    // multiplicative boost to ensure they are not drowned out by skills that
    // accumulate partial matches on secondary feature tokens (axis, legend, etc.).
    const primaryTokensInQuery = detectPrimaryChartTokens(queryTokens);

    const scores = new Array(this.docCount).fill(0);

    for (const [term, queryFreq] of queryTF) {
      const idf = this.idf.get(term);
      if (idf === undefined) continue; // Term not in corpus

      for (let i = 0; i < this.docCount; i++) {
        const fields = this.docFields[i];
        const docLen = this.docLengths[i];

        // Score each field separately with field-specific weights
        let fieldScore = 0;
        for (const [fieldName, fieldTokens] of Object.entries(fields)) {
          const weight = this.fieldWeights[fieldName] || 1.0;
          const tf = this._countTerm(fieldTokens, term);
          if (tf === 0) continue;

          // BM25 TF component: tf * (k1 + 1) / (tf + k1 * (1 - b + b * dl/avgdl))
          const tfNorm =
            (tf * (this.k1 + 1)) /
            (tf + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength)));

          fieldScore += weight * idf * tfNorm;
        }

        // Scale by how many times the query mentions this term (multi-word boost)
        scores[i] += fieldScore * Math.log2(1 + queryFreq);
      }
    }

    // Primary-token title boost pass:
    // For each primary chart-type token in the query, find documents whose title
    // tokens contain that exact term, and apply a multiplicative bonus.
    // This counteracts the "secondary token pile-up" problem where generic skills
    // (group, legend, axis) accumulate more BM25 score than the specific target skill.
    if (primaryTokensInQuery.size > 0) {
      const TITLE_BOOST = 4.0; // tuned: enough to promote, not so large it ignores all else
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
        if (hasMatch) {
          scores[i] *= TITLE_BOOST;
        }
      }
    }

    // Collect and sort
    const results = [];
    for (let i = 0; i < this.docCount; i++) {
      if (scores[i] > 0) {
        results.push({ skill: this.documents[i], score: scores[i] });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Extract tokenized fields from a skill object.
   * @private
   */
  _extractFields(skill) {
    return {
      title: tokenize(skill.title || ''),
      description: tokenize(skill.description || ''),
      tags: tokenize((skill.tags || []).join(' ')),
      use_cases: tokenize((skill.use_cases || []).join(' ')),
      category: tokenize(skill.category || ''),
      subcategory: tokenize(skill.subcategory || '')
    };
  }

  /**
   * Count occurrences of a term in a token array.
   * @private
   */
  _countTerm(tokens, term) {
    let count = 0;
    for (const t of tokens) {
      if (t === term) count++;
    }
    return count;
  }
}

module.exports = { BM25Index, tokenize, cleanQuery, termFrequency, STOP_WORDS, SYNONYMS, PRIMARY_CHART_TOKENS, detectPrimaryChartTokens };
