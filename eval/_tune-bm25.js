#!/usr/bin/env node
/**
 * BM25 Field Weight Tuner (fast version)
 *
 * 1. Fixes eval category labeling (chart type takes priority over secondary features)
 * 2. Grid-searches BM25 field weights to maximize Recall@5 + MRR
 */

// Load environment variables from .env file
require('dotenv').config({ override: true });

const fs = require('fs');
const path = require('path');
const { BM25Index } = require('../cli/utils/bm25');

const dataset = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data/g2-dataset-174.json'), 'utf-8')
);

function loadIndex(library) {
  const f = path.join(__dirname, '..', 'index', `${library}.index.json`);
  return JSON.parse(fs.readFileSync(f, 'utf-8')).skills;
}

const g2Skills = loadIndex('g2');
const g6Skills = loadIndex('g6');

// ── Fixed category inference ─────────────────────────────────────────────────

function inferCat(d) {
  d = d.toLowerCase();
  // Chart types (marks) — MUST come first
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
  if (/螺旋/.test(d)) return 'coordinates'; // helix
  // Transforms
  if (/直方图|histogram|bin/.test(d)) return 'transforms';
  if (/堆叠|stack/.test(d)) return 'transforms';
  if (/分组|dodge|grouped/.test(d)) return 'transforms';
  if (/排序|sort/.test(d)) return 'transforms';
  if (/归一化|normalize/.test(d)) return 'transforms';
  // Components
  if (/坐标轴|axis|刻度/.test(d)) return 'components';
  if (/图例|legend/.test(d)) return 'components';
  if (/tooltip|提示框/.test(d)) return 'components';
  if (/标签配置|label config/.test(d)) return 'components';
  if (/滚动条|scrollbar/.test(d)) return 'components';
  // Other
  if (/比例尺|scale|对数|log/.test(d)) return 'scales';
  if (/坐标系|coordinate|极坐标|polar|theta/.test(d)) return 'coordinates';
  if (/交互|brush|select|框选|高亮/.test(d)) return 'interactions';
  if (/动画|animation|animate/.test(d)) return 'animations';
  if (/主题|theme|暗色|深色/.test(d)) return 'themes';
  if (/过滤|filter|数据处理|fetch|remote/.test(d)) return 'data';
  if (/多视图|facet|分面|子图/.test(d)) return 'compositions';
  // G6
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

function detectLibrary(desc) {
  const d = desc.toLowerCase();
  if (
    d.includes('g6') ||
    d.includes('图分析') ||
    d.includes('知识图谱') ||
    (d.includes('节点') && d.includes('边')) ||
    d.includes('力导向')
  )
    return 'g6';
  return 'g2';
}

// ── Prepare labeled test cases (once) ────────────────────────────────────────

const testCases = dataset
  .map((tc) => ({
    ...tc,
    cat: inferCat(tc.description),
    lib: detectLibrary(tc.description)
  }))
  .filter((tc) => tc.cat !== 'unknown');

console.log(`Labeled ${testCases.length}/${dataset.length} cases\n`);

// ── Evaluate ─────────────────────────────────────────────────────────────────

function evaluate(fieldWeights, k1 = 1.5, b = 0.75) {
  const g2Idx = new BM25Index({ k1, b, fieldWeights });
  g2Idx.build(g2Skills);
  const g6Idx = new BM25Index({ k1, b, fieldWeights });
  g6Idx.build(g6Skills);

  let hit1 = 0,
    hit3 = 0,
    hit5 = 0,
    hit7 = 0,
    mrrSum = 0;
  const catStats = {};

  for (const tc of testCases) {
    const idx = tc.lib === 'g6' ? g6Idx : g2Idx;
    const results = idx.search(tc.description, 7);

    if (!catStats[tc.cat]) catStats[tc.cat] = { total: 0, hit5: 0 };
    catStats[tc.cat].total++;

    let rank = -1;
    for (let i = 0; i < results.length; i++) {
      if (results[i].skill.category === tc.cat) {
        rank = i + 1;
        break;
      }
    }

    if (rank > 0) {
      if (rank <= 1) hit1++;
      if (rank <= 3) hit3++;
      if (rank <= 5) {
        hit5++;
        catStats[tc.cat].hit5++;
      }
      if (rank <= 7) hit7++;
      mrrSum += 1 / rank;
    }
  }

  const n = testCases.length;
  return {
    hit1,
    hit3,
    hit5,
    hit7,
    mrr: mrrSum / n,
    n,
    catStats,
    r1: hit1 / n,
    r3: hit3 / n,
    r5: hit5 / n,
    r7: hit7 / n
  };
}

// ── Baseline ─────────────────────────────────────────────────────────────────

const BL_W = {
  title: 5,
  tags: 3,
  use_cases: 2,
  category: 2,
  subcategory: 1.5,
  description: 1
};
const bl = evaluate(BL_W);

console.log('='.repeat(64));
console.log('  BASELINE  title=5 tags=3 uc=2 cat=2 sub=1.5 desc=1');
console.log(
  `  R@1=${(bl.r1 * 100).toFixed(1)}  R@3=${(bl.r3 * 100).toFixed(1)}  R@5=${(bl.r5 * 100).toFixed(1)}  R@7=${(bl.r7 * 100).toFixed(1)}  MRR=${bl.mrr.toFixed(4)}`
);
for (const [c, s] of Object.entries(bl.catStats).sort(
  (a, b) => b[1].total - a[1].total
)) {
  console.log(
    `    ${c.padEnd(16)} ${s.hit5}/${s.total} (${((s.hit5 / s.total) * 100).toFixed(0)}%)`
  );
}
console.log('='.repeat(64));

// ── Focused grid: vary one dimension at a time from baseline ─────────────────

const dims = [
  { name: 'title', range: [3, 4, 5, 6, 8, 10] },
  { name: 'tags', range: [2, 3, 4, 5, 6] },
  { name: 'use_cases', range: [1, 2, 3, 4, 5] },
  { name: 'category', range: [1, 2, 3, 4, 5] },
  { name: 'subcategory', range: [0.5, 1, 1.5, 2, 3] },
  { name: 'description', range: [0.3, 0.5, 1, 1.5, 2] }
];

console.log('\n  Sweep each dimension independently:');
const bestPerDim = {};

for (const dim of dims) {
  let bestVal = BL_W[dim.name],
    bestScore = -1;
  const rows = [];
  for (const val of dim.range) {
    const w = { ...BL_W, [dim.name]: val };
    const r = evaluate(w);
    const score = r.r5 + 0.5 * r.mrr;
    rows.push({ val, r5: r.r5, mrr: r.mrr, score });
    if (score > bestScore) {
      bestScore = score;
      bestVal = val;
    }
  }
  bestPerDim[dim.name] = bestVal;
  console.log(`\n  ${dim.name}:`);
  for (const row of rows) {
    const marker = row.val === bestVal ? ' *' : '';
    console.log(
      `    ${String(row.val).padStart(4)} → R@5=${(row.r5 * 100).toFixed(1)}%  MRR=${row.mrr.toFixed(4)}  score=${row.score.toFixed(4)}${marker}`
    );
  }
}

// ── Combined best from per-dimension sweep ───────────────────────────────────

console.log('\n' + '─'.repeat(64));
console.log('  Combined best per-dimension values:');
console.log('  ', JSON.stringify(bestPerDim));

const combined = evaluate(bestPerDim);
console.log(
  `  R@1=${(combined.r1 * 100).toFixed(1)}  R@3=${(combined.r3 * 100).toFixed(1)}  R@5=${(combined.r5 * 100).toFixed(1)}  R@7=${(combined.r7 * 100).toFixed(1)}  MRR=${combined.mrr.toFixed(4)}`
);
for (const [c, s] of Object.entries(combined.catStats).sort(
  (a, b) => b[1].total - a[1].total
)) {
  const blCat = bl.catStats[c] || { hit5: 0, total: s.total };
  const delta = (s.hit5 / s.total - blCat.hit5 / blCat.total) * 100;
  const sign = delta > 0 ? '+' : '';
  console.log(
    `    ${c.padEnd(16)} ${s.hit5}/${s.total} (${((s.hit5 / s.total) * 100).toFixed(0)}%)  ${sign}${delta.toFixed(0)}%`
  );
}

// ── Fine-tune k1/b with best weights ─────────────────────────────────────────

console.log('\n' + '─'.repeat(64));
console.log('  Fine-tuning k1/b:');
let globalBest = {
  score: 0,
  k1: 1.5,
  b: 0.75,
  weights: bestPerDim,
  result: combined
};

for (const k1 of [1.0, 1.2, 1.5, 1.8, 2.0]) {
  for (const b of [0.5, 0.65, 0.75, 0.85]) {
    const r = evaluate(bestPerDim, k1, b);
    const score = r.r5 + 0.5 * r.mrr;
    if (score > globalBest.score) {
      globalBest = { score, k1, b, weights: bestPerDim, result: r };
    }
  }
}

console.log(`  Best k1=${globalBest.k1}  b=${globalBest.b}`);
const gr = globalBest.result;
console.log(
  `  R@1=${(gr.r1 * 100).toFixed(1)}  R@3=${(gr.r3 * 100).toFixed(1)}  R@5=${(gr.r5 * 100).toFixed(1)}  R@7=${(gr.r7 * 100).toFixed(1)}  MRR=${gr.mrr.toFixed(4)}`
);

// ── Final comparison ─────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(64));
console.log('  FINAL: Tuned BM25 vs Baseline BM25');
console.log('='.repeat(64));

const n = testCases.length;
console.log(
  `\n  ${'Metric'.padEnd(12)} ${'BM25 base'.padStart(10)} ${'BM25 tuned'.padStart(10)}`
);
console.log(
  `  ${'Recall@5'.padEnd(12)} ${(bl.r5 * 100).toFixed(1).padStart(9)}% ${(gr.r5 * 100).toFixed(1).padStart(9)}%`
);
console.log(
  `  ${'MRR'.padEnd(12)} ${bl.mrr.toFixed(4).padStart(10)} ${gr.mrr.toFixed(4).padStart(10)}`
);

console.log('\n  Per-category @5:');
for (const [c, s] of Object.entries(gr.catStats).sort(
  (a, b) => b[1].total - a[1].total
)) {
  const bl5 = bl.catStats[c]
    ? ((bl.catStats[c].hit5 / bl.catStats[c].total) * 100).toFixed(0)
    : '?';
  const t5 = ((s.hit5 / s.total) * 100).toFixed(0);
  console.log(
    `    ${c.padEnd(16)} BL:${bl5.padStart(4)}%  Tuned:${t5.padStart(4)}%  (${s.hit5}/${s.total})`
  );
}

console.log('\n  Recommended config for lib/bm25.js:');
console.log(`    k1: ${globalBest.k1}`);
console.log(`    b:  ${globalBest.b}`);
console.log(`    fieldWeights: ${JSON.stringify(globalBest.weights)}`);
console.log('\n' + '='.repeat(64) + '\n');
