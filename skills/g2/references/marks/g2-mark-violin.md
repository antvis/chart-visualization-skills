---
id: "g2-mark-violin"
title: "G2 Violin Plot Mark"
description: |
  小提琴图 Mark。使用 density 和 boxplot 组合，结合核密度估计展示数据分布形状。
  适用于多组数据分布比较、探索数据分布模式等场景。

library: "g2"
version: "5.x"
category: "marks"
tags:
  - "小提琴图"
  - "violin"
  - "密度分布"
  - "统计分析"

related:
  - "g2-mark-boxplot"
  - "g2-mark-density"

use_cases:
  - "多组数据分布比较"
  - "数据分布模式探索"
  - "异常值检测"

anti_patterns:
  - "数据量少（<20）应使用箱形图"
  - "离散数据不适合"

difficulty: "intermediate"
completeness: "full"
created: "2025-03-26"
updated: "2025-03-26"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/manual/core/mark/violin"
---

## 核心概念

小提琴图结合了箱形图和核密度估计：
- 展示完整的数据分布形状
- 叠加箱形图的统计信息
- 通过 KDE（核密度估计）生成密度轮廓

**主要组成部分：**
- 密度轮廓：展示数据分布密度
- 箱形图：显示中位数、四分位数
- 中位线：标示中位数位置

## 最小可运行示例

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({
  container: 'container',
  theme: 'classic',
});

chart.options({
  type: 'view',
   {
    type: 'fetch',
    value: 'https://assets.antv.antgroup.com/g2/species.json',
  },
  children: [
    {
      type: 'density',
      data: {
        transform: [
          { type: 'kde', field: 'y', groupBy: ['x', 'species'] },
        ],
      },
      encode: {
        x: 'x',
        y: 'y',
        series: 'species',
        color: 'species',
        size: 'size',
      },
      tooltip: false,
    },
    {
      type: 'boxplot',
      encode: {
        x: 'x',
        y: 'y',
        series: 'species',
        color: 'species',
        shape: 'violin',
      },
      style: {
        opacity: 0.5,
        strokeOpacity: 0.5,
        point: false,
      },
    },
  ],
});

chart.render();
```

## 常用变体

### 极坐标小提琴图

```javascript
chart.options({
  type: 'view',
  coordinate: { type: 'polar' },
  data,
  children: [
    {
      type: 'density',
      data: { transform: [{ type: 'kde', field: 'y', groupBy: ['x'] }] },
      encode: { x: 'x', y: 'y', size: 'size' },
    },
    {
      type: 'boxplot',
      encode: { x: 'x', y: 'y', shape: 'violin' },
    },
  ],
});
```

### 纯密度图

```javascript
chart.options({
  type: 'density',
  data: {
    type: 'fetch',
    value: 'https://assets.antv.antgroup.com/g2/species.json',
    transform: [
      { type: 'kde', field: 'y', groupBy: ['x'], size: 20 },
    ],
  },
  encode: {
    x: 'x',
    y: 'y',
    color: 'x',
    size: 'size',
  },
});
```

### 带异常值标记

```javascript
chart.options({
  type: 'view',
  data,
  children: [
    {
      type: 'density',
       { transform: [{ type: 'kde', field: 'y', groupBy: ['x'] }] },
      encode: { x: 'x', y: 'y', size: 'size' },
      style: { fillOpacity: 0.4 },
    },
    {
      type: 'boxplot',
      encode: { x: 'x', y: 'y', shape: 'violin' },
      style: {
        opacity: 0.8,
        point: { fill: 'red', size: 3 },  // 异常值标记
      },
    },
  ],
});
```

## 完整类型参考

```typescript
interface ViolinOptions {
  type: 'view';
  children: [
    {
      type: 'density';
      data: {
        transform: [
          {
            type: 'kde';
            field: string;      // 数值字段
            groupBy?: string[]; // 分组字段
            size?: number;      // 采样点数
          }
        ]
      };
      encode: {
        x: string;
        y: string;
        size: 'size';
        color?: string;
      };
    },
    {
      type: 'boxplot';
      encode: {
        x: string;
        y: string;
        shape: 'violin';
      };
    }
  ];
}
```

## 小提琴图 vs 箱形图

| 特性 | 小提琴图 | 箱形图 |
|------|----------|--------|
| 分布信息 | 完整密度 | 统计摘要 |
| 多峰检测 | 支持 | 不支持 |
| 简洁程度 | 较复杂 | 简洁 |

## 常见错误与修正

### 错误 1：缺少 KDE 转换

```javascript
// ❌ 问题：没有核密度估计
data: { type: 'fetch', value: 'data.json' }

// ✅ 正确：添加 kde 转换
 {
  type: 'fetch',
  value: 'data.json',
  transform: [{ type: 'kde', field: 'y', groupBy: ['x'] }],
}
```

### 错误 2：数据量过少

```javascript
// ⚠️ 注意：每个分组建议至少 20-30 个数据点
// 数据量少时建议使用箱形图
```

### 错误 3：缺少 boxplot 叠加

```javascript
// ❌ 问题：只有密度图，缺少统计信息
children: [{ type: 'density', ... }]

// ✅ 正确：叠加 boxplot
children: [
  { type: 'density', ... },
  { type: 'boxplot', encode: { shape: 'violin' } },
]
```