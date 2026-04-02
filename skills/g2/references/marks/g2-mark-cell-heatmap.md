---
id: "g2-mark-cell-heatmap"
title: "G2 热力图（Cell Mark）"
description: |
  使用 Cell Mark 创建矩阵热力图，通过颜色深浅表示两个分类维度交叉点的数值大小，
  常用于相关性分析、时间-类别分布等场景。本文采用 Spec 模式。

library: "g2"
version: "5.x"
category: "marks"
subcategory: "cell"
tags:
  - "热力图"
  - "Cell"
  - "heatmap"
  - "矩阵"
  - "相关性"
  - "颜色映射"
  - "spec"

related:
  - "g2-core-encode-channel"
  - "g2-scale-sequential"
  - "g2-comp-legend-config"

use_cases:
  - "展示两个分类维度的交叉数值（如相关矩阵）"
  - "时间热力图（如每周各天的活跃度）"
  - "用户行为矩阵分析"

anti_patterns:
  - "数据为连续型 x/y 时改用密度图或等值线图"

difficulty: "beginner"
completeness: "full"
created: "2024-01-01"
updated: "2025-03-01"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/examples/heatmap/basic"
---

## 最小可运行示例

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({
  container: 'container',
  width: 640,
  height: 480,
});

chart.options({
  type: 'cell',
  data: [
    { week: 'Mon', hour: '6AM',  value: 10 },
    { week: 'Mon', hour: '12PM', value: 80 },
    { week: 'Mon', hour: '6PM',  value: 60 },
    { week: 'Tue', hour: '6AM',  value: 5  },
    { week: 'Tue', hour: '12PM', value: 95 },
    { week: 'Tue', hour: '6PM',  value: 70 },
    { week: 'Wed', hour: '6AM',  value: 20 },
    { week: 'Wed', hour: '12PM', value: 75 },
    { week: 'Wed', hour: '6PM',  value: 55 },
  ],
  encode: {
    x: 'week',
    y: 'hour',
    color: 'value',    // 颜色深浅表示数值大小
  },
  scale: {
    color: { palette: 'YlOrRd' },   // 连续色阶：YlOrRd | Blues | Viridis 等
  },
  style: {
    inset: 1,    // 格子间距（px）
  },
});

chart.render();
```

## 带数值标签的热力图

```javascript
chart.options({
  type: 'cell',
  data,
  encode: { x: 'week', y: 'hour', color: 'value' },
  scale: {
    color: { palette: 'Blues' },
  },
  labels: [
    {
      text: 'value',
      style: {
        fontSize: 11,
        fill: (d) => d.value > 60 ? 'white' : '#333',  // 深色背景用白字
      },
    },
  ],
  style: { inset: 2 },
});
```

## 相关系数矩阵

```javascript
// 相关性分析热力图（-1 到 1 的发散色阶）
chart.options({
  type: 'cell',
   correlationData,  // [{ x: '变量A', y: '变量B', corr: 0.75 }, ...]
  encode: {
    x: 'x',
    y: 'y',
    color: 'corr',
  },
  scale: {
    color: {
      palette: 'RdBu',     // 发散色阶：红-白-蓝
      domain: [-1, 1],     // 固定数值范围
    },
  },
  labels: [
    {
      text: (d) => d.corr.toFixed(2),
      style: { fontSize: 10 },
    },
  ],
});
```

## 日历热力图（GitHub 风格）

```javascript
// 每天活跃度的日历视图
chart.options({
  type: 'cell',
   dailyData,   // [{ date: '2024-01-01', weekday: 'Mon', week: 1, value: 5 }, ...]
  encode: {
    x: 'week',      // 第几周（1-53）
    y: 'weekday',   // 周几
    color: 'value',
  },
  scale: {
    color: { palette: 'Greens', domain: [0, 20] },
    y: {
      domain: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
  },
  style: { inset: 2, radius: 2 },
  axis: {
    y: { title: null },
    x: { title: null, tickCount: 4 },
  },
});
```

## 常见错误与修正

### 错误 1：color 通道缺少 scale 配置导致离散色
```javascript
// ❌ 问题：color 默认使用离散色阶，不适合连续数值
chart.options({ type: 'cell', encode: { x: 'a', y: 'b', color: 'value' } });
// value 是连续数值，却被映射到离散颜色

// ✅ 正确：指定连续色阶 palette
chart.options({
  type: 'cell',
  encode: { x: 'a', y: 'b', color: 'value' },
  scale: { color: { palette: 'Blues' } },  // 或 'YlOrRd'、'Viridis' 等
});
```

### 错误 2：格子大小不均匀
```javascript
// ❌ 问题：x/y 轴类别数量差异大时格子变形
// ✅ 解决：设置 Chart 的宽高比接近 x/y 分类数量之比
const chart = new Chart({
  container: 'container',
  width: xCategories.length * 40,    // 每格 40px
  height: yCategories.length * 40,
});
```
