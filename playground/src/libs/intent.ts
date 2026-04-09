/**
 * Intent detection logic for chart generation
 */

// Chart type keywords — presence suggests user wants a new chart
const CHART_TYPE_SIGNALS = [
  '柱状图',
  '条形图',
  '折线图',
  '面积图',
  '饼图',
  '散点图',
  '气泡图',
  '雷达图',
  '热力图',
  '箱线图',
  '漏斗图',
  '甘特图',
  '瀑布图',
  '桑基图',
  '玫瑰图',
  '直方图',
  '词云',
  '树图',
  '矩形树图',
  'bar',
  'line',
  'pie',
  'area',
  'scatter',
  'radar',
  'heatmap',
  'boxplot',
  'funnel',
  'gantt',
  'waterfall',
  'sankey',
  'rose',
  'histogram',
  'wordcloud',
  'treemap'
];

// Data-bearing patterns — presence suggests user is providing new data
const DATA_SIGNALS = [
  /\d+(\.\d+)?[,，]\s*\d+/, // numeric series like "10, 20, 30"
  /['"][^'"]{1,30}['"][：:]\s*\d+/, // "label": value
  /data\s*[:=]/i,
  /数据[是为：:]?/,
  /\[.*?\d.*?\]/ // array literals
];

/**
 * Detect whether the user intends to create a brand new chart ("new")
 * or tune/configure the existing one ("tune").
 */
export function detectIntent(
  query: string,
  currentCode: string | null
): 'new' | 'tune' {
  if (!currentCode) return 'new';
  const q = query.toLowerCase();

  const newSignals = [
    '新建',
    '重新生成',
    '重新画',
    '换一个',
    '换个',
    '帮我画',
    '画一个',
    '画个',
    '创建',
    '生成一个'
  ];
  if (newSignals.some((s) => q.includes(s))) return 'new';

  // Explicit chart-type mention → likely a new chart request
  if (CHART_TYPE_SIGNALS.some((s) => q.includes(s.toLowerCase()))) return 'new';

  // Data patterns detected → likely a new chart with new data
  if (DATA_SIGNALS.some((re) => re.test(query))) return 'new';

  // No data, no chart type → user is adjusting configuration
  return 'tune';
}

/**
 * Build messages for the LLM based on intent
 */
export function buildMessages(
  query: string,
  systemPrompt: string,
  intent: 'new' | 'tune',
  currentCode: string | null
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt }
  ];

  if (intent === 'tune' && currentCode) {
    messages.push({
      role: 'assistant',
      content: '```javascript\n' + currentCode + '\n```'
    });
    messages.push({
      role: 'user',
      content: `请基于上面的图表代码，${query}。只返回修改后的完整代码。`
    });
  } else {
    messages.push({ role: 'user', content: query });
  }

  return messages;
}

/**
 * Extract code from markdown code block
 */
export function extractCodeFromMarkdown(text: string): string {
  const m = text.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
  return m ? m[1].trim() : text.trim();
}
