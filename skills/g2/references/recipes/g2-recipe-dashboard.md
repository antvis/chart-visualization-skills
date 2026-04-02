---
id: "g2-recipe-dashboard"
title: "G2 数据看板：多图表组合"
description: |
  使用 G2 v5 Spec 模式创建包含多个独立图表的数据看板，
  演示如何用 chart.options({}) 组织柱状图、折线图、饼图、面积图，
  以及基本的数据联动模式。

library: "g2"
version: "5.x"
category: "recipes"
tags:
  - "数据看板"
  - "dashboard"
  - "多图表"
  - "组合"
  - "联动"
  - "spec"

related:
  - "g2-mark-interval-basic"
  - "g2-mark-line-basic"
  - "g2-mark-arc-pie"
  - "g2-interaction-tooltip"

use_cases:
  - "业务数据看板"
  - "多维度数据概览"
  - "KPI 指标展示"

difficulty: "intermediate"
completeness: "full"
created: "2024-01-01"
updated: "2025-03-01"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/examples/general/dashboard"
---

## 多图表看板完整示例

```html
<!-- HTML 结构 -->
<div class="dashboard" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px;">
  <div id="chart-bar"  style="height: 300px; background: white; border-radius: 8px; padding: 16px;"></div>
  <div id="chart-line" style="height: 300px; background: white; border-radius: 8px; padding: 16px;"></div>
  <div id="chart-pie"  style="height: 300px; background: white; border-radius: 8px; padding: 16px;"></div>
  <div id="chart-area" style="height: 300px; background: white; border-radius: 8px; padding: 16px;"></div>
</div>
```

```javascript
import { Chart } from '@antv/g2';

// ── 共享数据 ─────────────────────────────────────────────────
const monthlyData = [
  { month: 'Jan', revenue: 320, cost: 200, profit: 120 },
  { month: 'Feb', revenue: 450, cost: 230, profit: 220 },
  { month: 'Mar', revenue: 380, cost: 210, profit: 170 },
  { month: 'Apr', revenue: 510, cost: 260, profit: 250 },
  { month: 'May', revenue: 490, cost: 240, profit: 250 },
  { month: 'Jun', revenue: 620, cost: 290, profit: 330 },
];

const categoryData = [
  { category: '产品A', value: 35 },
  { category: '产品B', value: 25 },
  { category: '产品C', value: 20 },
  { category: '产品D', value: 15 },
  { category: '其他',   value: 5  },
];

// ── 图1：月度收入柱状图 ──────────────────────────────────────
const barChart = new Chart({ container: 'chart-bar', autoFit: true, height: 268 });

barChart.options({
  type: 'interval',
  data: monthlyData,
  encode: {
    x: 'month',
    y: 'revenue',
    color: 'month',
  },
  scale: { color: { palette: 'tableau10' } },
  axis: { y: { title: '收入（万元）' } },
  title: { title: '月度收入' },
});

barChart.render();

// ── 图2：收入/成本/利润趋势折线图 ───────────────────────────
const lineChart = new Chart({ container: 'chart-line', autoFit: true, height: 268 });

// 宽表转长表（多系列折线需要长表格式）
const lineData = monthlyData.flatMap((d) => [
  { month: d.month, metric: '收入', value: d.revenue },
  { month: d.month, metric: '成本', value: d.cost    },
  { month: d.month, metric: '利润', value: d.profit  },
]);

lineChart.options({
  type: 'line',
  data: lineData,
  encode: { x: 'month', y: 'value', color: 'metric' },
  title: { title: '收入/成本/利润趋势' },
});

lineChart.render();

// ── 图3：产品结构饼图（环形） ────────────────────────────────
const pieChart = new Chart({ container: 'chart-pie', autoFit: true, height: 268 });

pieChart.options({
  type: 'interval',
  data: categoryData,
  encode: { y: 'value', color: 'category' },
  transform: [{ type: 'stackY' }],
  coordinate: { type: 'theta', outerRadius: 0.8, innerRadius: 0.5 },
  title: { title: '产品结构占比' },
});

pieChart.render();

// ── 图4：利润面积图（折线 + 面积叠加）────────────────────────
const areaChart = new Chart({ container: 'chart-area', autoFit: true, height: 268 });

areaChart.options({
  type: 'view',
  data: monthlyData,
  title: { title: '月度利润' },
  children: [
    {
      type: 'area',
      encode: { x: 'month', y: 'profit' },
      style: { fill: 'linear-gradient(#1890ff, #e6f4ff)', fillOpacity: 0.8 },
    },
    {
      type: 'line',
      encode: { x: 'month', y: 'profit' },
      style: { stroke: '#1890ff', lineWidth: 2 },
    },
  ],
});

areaChart.render();
```

## 图表联动（点击筛选）

```javascript
// 点击柱状图某月，折线图只展示该月数据
barChart.on('interval:click', (event) => {
  const selectedMonth = event.data?.data?.month;
  if (!selectedMonth) return;

  const filtered = lineData.filter((d) => d.month === selectedMonth);
  lineChart.changeData(filtered);
});

// 点击空白处恢复全量数据
barChart.on('plot:click', (event) => {
  if (event.target?.tagName !== 'interval') {
    lineChart.changeData(lineData);
  }
});
```

## 统一更新所有图表数据

```javascript
// 适用于切换时间范围等场景
function updateDashboard(newMonthlyData, newCategoryData) {
  const newLineData = newMonthlyData.flatMap((d) => [
    { month: d.month, metric: '收入', value: d.revenue },
    { month: d.month, metric: '成本', value: d.cost    },
    { month: d.month, metric: '利润', value: d.profit  },
  ]);

  barChart.changeData(newMonthlyData);
  lineChart.changeData(newLineData);
  pieChart.changeData(newCategoryData);
  areaChart.changeData(newMonthlyData);
}
```
