---
id: "g2-interaction-element-highlight"
title: "G2 元素高亮交互（elementHighlight）"
description: |
  elementHighlight 是 G2 v5 中最常用的交互之一，鼠标悬停时高亮当前元素、
  同时可选择高亮同系列元素或联动其他视图。支持柱状图、折线图、散点图等所有 Mark 类型。

library: "g2"
version: "5.x"
category: "interactions"
tags:
  - "elementHighlight"
  - "高亮"
  - "interaction"
  - "hover"
  - "交互"
  - "spec"

related:
  - "g2-interaction-brush"
  - "g2-mark-interval-basic"
  - "g2-mark-line-basic"

use_cases:
  - "柱状图悬停高亮当前柱子"
  - "折线图悬停高亮当前系列"
  - "散点图悬停高亮同类数据点"

difficulty: "beginner"
completeness: "full"
created: "2024-01-01"
updated: "2025-03-01"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/manual/core/interaction/element-highlight"
---

## 基本用法（柱状图高亮）

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({
  container: 'container',
  width: 640,
  height: 480,
});

chart.options({
  type: 'interval',
  data: [
    { genre: 'Sports',   sold: 275 },
    { genre: 'Strategy', sold: 115 },
    { genre: 'Action',   sold: 120 },
    { genre: 'Shooter',  sold: 350 },
    { genre: 'Other',    sold: 150 },
  ],
  encode: { x: 'genre', y: 'sold' },
  interaction: [
    { type: 'elementHighlight' },   // 悬停高亮当前柱子
  ],
});

chart.render();
```

## 高亮背景色配置

```javascript
chart.options({
  type: 'interval',
  data,
  encode: { x: 'genre', y: 'sold', color: 'genre' },
  interaction: [
    {
      type: 'elementHighlight',
      background: true,              // 是否显示高亮背景
      backgroundFill: '#f0f0f0',    // 背景填充色
    },
  ],
});
```

## 折线图：高亮当前系列

```javascript
chart.options({
  type: 'line',
  data,
  encode: { x: 'month', y: 'value', color: 'series' },
  interaction: [
    { type: 'elementHighlight' },        // 悬停高亮当前折线
    { type: 'legendHighlight' },         // 点击图例高亮对应系列
  ],
});
```

## elementHighlightByColor：高亮同色系列

```javascript
// 悬停时高亮所有相同颜色（系列）的元素
chart.options({
  type: 'interval',
  data,
  encode: { x: 'month', y: 'value', color: 'type' },
  transform: [{ type: 'dodgeX' }],
  interaction: [
    { type: 'elementHighlightByColor' },   // 高亮同系列所有柱子
  ],
});
```

## elementHighlightByX：高亮同 x 位置的元素

```javascript
// 悬停时高亮同一 x 值的所有元素（适合分组柱状图）
chart.options({
  type: 'interval',
  data,
  encode: { x: 'month', y: 'value', color: 'type' },
  transform: [{ type: 'stackY' }],
  interaction: [
    { type: 'elementHighlightByX' },    // 高亮同组（同 x 位置）的所有元素
  ],
});
```

## 同时启用 tooltip + 高亮

```javascript
chart.options({
  type: 'interval',
  data,
  encode: { x: 'month', y: 'revenue', color: 'product' },
  transform: [{ type: 'dodgeX' }],
  interaction: [
    { type: 'elementHighlight' },    // 元素高亮
    { type: 'tooltip' },             // Tooltip 提示
  ],
  tooltip: {
    title: 'month',
    items: [
      { field: 'revenue', valueFormatter: (v) => `$${v}万` },
    ],
  },
});
```

## 监听高亮事件

```javascript
chart.on('element:highlight', (event) => {
  const datum = event.data?.data;
  console.log('高亮元素数据：', datum);
});

chart.on('element:unhighlight', () => {
  console.log('取消高亮');
});
```

## 常见错误与修正

### 错误：interaction 写成对象
```javascript
// ❌ 错误：interaction 必须是数组
chart.options({
  interaction: { type: 'elementHighlight' },
});

// ✅ 正确
chart.options({
  interaction: [{ type: 'elementHighlight' }],
});
```

### 错误：混淆 elementHighlight 与 elementHighlightByColor
```javascript
// ❌ 同时使用会导致重复响应
chart.options({
  interaction: [
    { type: 'elementHighlight' },
    { type: 'elementHighlightByColor' },
  ],
});

// ✅ 根据需求选择一种
// - elementHighlight: 只高亮鼠标悬停的单个元素
// - elementHighlightByColor: 高亮同颜色（系列）的所有元素
// - elementHighlightByX: 高亮同 x 位置的所有元素
```
