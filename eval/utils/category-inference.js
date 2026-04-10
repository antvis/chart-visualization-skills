'use strict';

/**
 * Category Inference
 *
 * Single source of truth for inferring skill category from a description string.
 * Used by both _tune-bm25.js and eval-recall.js.
 */

/**
 * Infer skill category from description text using regex patterns.
 * Chart types (marks) are matched first to avoid false positives from axis/legend keywords.
 *
 * @param {string} description
 * @returns {string} category name, or 'unknown'
 */
function inferCategory(description) {
  const d = description.toLowerCase();

  // ── Chart types (marks) — must come before secondary features ────────────────
  if (/柱状图|条形图/.test(d) && !/坐标轴|axis/.test(d)) return 'marks';
  if (/折线图|线图|line chart/.test(d)) return 'marks';
  if (/饼图|环形图|pie|donut/.test(d)) return 'marks';
  if (/散点图|气泡图|scatter|bubble/.test(d)) return 'marks';
  if (/面积图|area chart/.test(d)) return 'marks';
  if (/热力图|heatmap/.test(d)) return 'marks';
  if (/雷达图|radar/.test(d)) return 'marks';
  if (/桑基图|sankey/.test(d)) return 'marks';
  if (/矩形树图|treemap|树图/.test(d)) return 'marks';
  if (/旭日图|sunburst/.test(d)) return 'marks';
  if (/箱线图|boxplot/.test(d)) return 'marks';
  if (/瀑布图|waterfall/.test(d)) return 'marks';
  if (/漏斗图|funnel/.test(d)) return 'marks';
  if (/玫瑰图|rose/.test(d)) return 'marks';
  if (/词云|wordcloud/.test(d)) return 'marks';
  if (/K线|candlestick|k.?chart/.test(d)) return 'marks';
  if (/仪表盘|gauge/.test(d)) return 'marks';
  if (/子弹图|bullet/.test(d)) return 'marks';
  if (/韦恩图|venn/.test(d)) return 'marks';
  if (/打包图|pack layout|circle packing/.test(d)) return 'marks';
  if (/和弦图|chord/.test(d)) return 'marks';
  if (/甘特图|gantt/.test(d)) return 'marks';
  if (/液体图|liquid/.test(d)) return 'marks';
  if (/密度图|density/.test(d)) return 'marks';
  if (/bar chart|bar\b/.test(d)) return 'marks';
  if (/interval/.test(d)) return 'marks';

  // ── Transforms ───────────────────────────────────────────────────────────────
  if (/直方图|histogram|bin/.test(d)) return 'transforms';
  if (/堆叠|stack/.test(d)) return 'transforms';
  if (/分组|dodge|grouped/.test(d)) return 'transforms';
  if (/排序|sort/.test(d)) return 'transforms';
  if (/归一化|normalize/.test(d)) return 'transforms';

  // ── Components ───────────────────────────────────────────────────────────────
  if (/坐标轴|axis|刻度/.test(d)) return 'components';
  if (/图例|legend/.test(d)) return 'components';
  if (/tooltip|提示框/.test(d)) return 'components';
  if (/标签配置|label config/.test(d)) return 'components';
  if (/滚动条|scrollbar/.test(d)) return 'components';

  // ── Other G2 categories ──────────────────────────────────────────────────────
  if (/比例尺|scale|对数|log/.test(d)) return 'scales';
  if (/螺旋/.test(d)) return 'coordinates'; // helix
  if (/坐标系|coordinate|极坐标|polar|theta/.test(d)) return 'coordinates';
  if (/交互|brush|select|框选|高亮/.test(d)) return 'interactions';
  if (/动画|animation|animate/.test(d)) return 'animations';
  if (/主题|theme|暗色|深色/.test(d)) return 'themes';
  if (/过滤|filter|数据处理|fetch|remote/.test(d)) return 'data';
  if (/多视图|facet|分面|子图/.test(d)) return 'compositions';

  // ── G6 categories ────────────────────────────────────────────────────────────
  if (/力导|force/.test(d)) return 'layouts';
  if (/树布局|tree layout|compactbox|dendrogram|思维导图|mindmap/.test(d))
    return 'layouts';
  if (/dagre|层次布局|有向无环/.test(d)) return 'layouts';
  if (/节点/.test(d) && /样式|颜色|大小|自定义/.test(d)) return 'elements';
  if (/边/.test(d) && /样式|颜色|曲线/.test(d)) return 'elements';
  if (/拖拽|drag/.test(d)) return 'behaviors';
  if (/缩放|zoom/.test(d)) return 'behaviors';
  if (/点击|click|悬停|hover|事件/.test(d)) return 'events';

  return 'unknown';
}

module.exports = { inferCategory };
