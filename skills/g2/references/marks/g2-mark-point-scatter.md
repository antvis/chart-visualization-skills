---
id: "g2-mark-point-scatter"
title: "G2 散点图（Point Mark）"
description: |
  使用 Point Mark 创建散点图，通过 x/y 位置展示两个数值变量的相关性。
  本文采用 Spec 模式（chart.options({})），支持气泡图（size 通道）、分类着色、自定义形状等变体。

library: "g2"
version: "5.x"
category: "marks"
subcategory: "point"
tags:
  - "散点图"
  - "气泡图"
  - "Point"
  - "scatter"
  - "bubble"
  - "相关性"
  - "分布"
  - "spec"

related:
  - "g2-core-encode-channel"
  - "g2-scale-linear"
  - "g2-interaction-tooltip"

use_cases:
  - "展示两个连续变量的相关性"
  - "发现数据分布和异常值"
  - "用气泡图展示三维数据（x/y/size）"

anti_patterns:
  - "数据点超过 10000 个时性能较差，考虑使用密度图"
  - "两轴都是分类变量时，散点图意义不大"

difficulty: "beginner"
completeness: "full"
created: "2024-01-01"
updated: "2025-03-01"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/examples/point/scatter"
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
  type: 'point',
  data: [
    { x: 10, y: 30, category: 'A' },
    { x: 20, y: 50, category: 'B' },
    { x: 30, y: 20, category: 'A' },
    { x: 40, y: 80, category: 'B' },
    { x: 50, y: 40, category: 'A' },
    { x: 60, y: 65, category: 'B' },
  ],
  encode: {
    x: 'x',
    y: 'y',
    color: 'category',
  },
});

chart.render();
```

## 气泡图（三维数据）

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({ container: 'container', width: 700, height: 500 });

chart.options({
  type: 'point',
  data: [
    { income: 30000, lifeExpect: 72, population: 1400, country: 'China'  },
    { income: 60000, lifeExpect: 79, population: 330,  country: 'USA'    },
    { income: 45000, lifeExpect: 84, population: 125,  country: 'Japan'  },
    { income: 20000, lifeExpect: 68, population: 1380, country: 'India'  },
    { income: 35000, lifeExpect: 80, population: 210,  country: 'Brazil' },
  ],
  encode: {
    x: 'income',
    y: 'lifeExpect',
    size: 'population',    // 气泡大小 = 第三个维度
    color: 'country',
  },
  scale: {
    size: { range: [10, 60] },    // 控制气泡大小范围
  },
  tooltip: {
    title: 'country',
    items: [
      { field: 'income',     name: '人均收入' },
      { field: 'lifeExpect', name: '预期寿命' },
      { field: 'population', name: '人口（百万）' },
    ],
  },
});

chart.render();
```

## 自定义点形状

```javascript
chart.options({
  type: 'point',
  data: [...],
  encode: {
    x: 'x',
    y: 'y',
    color: 'type',
    shape: 'type',    // 将 type 字段映射到形状通道
  },
  scale: {
    shape: {
      range: ['circle', 'square', 'triangle', 'diamond'],
    },
  },
});
```

## 散点图 + 趋势线

```javascript
// 用 type: 'view' + children 叠加散点和回归趋势线
chart.options({
  type: 'view',
  data: [...],
  children: [
    {
      type: 'point',
      encode: { x: 'x', y: 'y' },
    },
    {
      type: 'line',
      encode: { x: 'x', y: 'y' },
      transform: [{ type: 'regression' }],
      style: { stroke: '#f00', lineWidth: 1.5 },
    },
  ],
});
```

## 常见错误与修正

### 错误 1：大数据量性能问题
```javascript
// ❌ 注意：十万个点会导致渲染缓慢
chart.options({ type: 'point', data: hugeDataWith100000Points, encode: { x: 'x', y: 'y' } });

// ✅ 优化方案 1：先在数据层面采样
chart.options({ type: 'point',  sampledData, encode: { x: 'x', y: 'y' } });

// ✅ 优化方案 2：改用密度图展示分布
chart.options({ type: 'density',  [...], encode: { x: 'x', y: 'y' } });
```

### 错误 2：size 通道使用字符串常量
```javascript
// ❌ 误解：size 传字符串会被当作字段名
chart.options({ type: 'point', encode: { size: '10' } });  // 寻找名为 '10' 的字段

// ✅ 正确：固定大小用数字，数据映射用字段名字符串
chart.options({ type: 'point', encode: { size: 10 } });           // 固定大小 10
chart.options({ type: 'point', encode: { size: 'population' } }); // 映射字段
```
