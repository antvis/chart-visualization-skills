---
id: "g2-mark-point-bubble"
title: "G2 气泡图（bubble chart）"
description: |
  气泡图是散点图的扩展，用第三个通道 size（气泡大小）编码额外的数值维度。
  通过 encode.size 绑定数值字段，G2 自动将数值映射为圆的面积（而非半径）。
  适合同时展示三个数值维度的关系。

library: "g2"
version: "5.x"
category: "marks"
tags:
  - "气泡图"
  - "bubble"
  - "散点图"
  - "point"
  - "三维度"
  - "size"

related:
  - "g2-mark-point-scatter"
  - "g2-scale-linear"

use_cases:
  - "三维度数据关系（如 GDP、人口、预期寿命）"
  - "用气泡大小表达第三个指标"
  - "对比矩阵中的强度展示"

difficulty: "beginner"
completeness: "full"
created: "2025-03-24"
updated: "2025-03-24"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/examples/general/point/#bubble"
---

## 最小可运行示例

```javascript
import { Chart } from '@antv/g2';

const data = [
  { country: '中国',    gdp: 17.7, population: 14.1, life: 77 },
  { country: '美国',    gdp: 25.5, population: 3.3,  life: 79 },
  { country: '印度',    gdp: 3.4,  population: 14.2, life: 70 },
  { country: '日本',    gdp: 4.2,  population: 1.26, life: 84 },
  { country: '巴西',    gdp: 1.8,  population: 2.15, life: 76 },
  { country: '德国',    gdp: 4.1,  population: 0.83, life: 81 },
];

const chart = new Chart({ container: 'container', width: 640, height: 480 });

chart.options({
  type: 'point',
  data,
  encode: {
    x: 'gdp',          // X 轴：GDP（万亿美元）
    y: 'life',         // Y 轴：预期寿命（岁）
    size: 'population', // 气泡大小：人口（亿）
    color: 'country',  // 颜色：国家
    shape: 'circle',
  },
  scale: {
    size: {
      range: [8, 60],   // 气泡半径范围（px），最小/最大
    },
  },
  style: {
    fillOpacity: 0.7,
    lineWidth: 1,
    stroke: '#fff',
  },
  labels: [
    {
      text: 'country',
      position: 'inside',
      style: { fontSize: 10 },
    },
  ],
  tooltip: {
    items: [
      { channel: 'x', name: 'GDP (万亿)', valueFormatter: (v) => `$${v}T` },
      { channel: 'y', name: '预期寿命', valueFormatter: (v) => `${v}岁` },
      { channel: 'size', name: '人口', valueFormatter: (v) => `${v}亿` },
    ],
  },
});

chart.render();
```

## 配置 size 比例尺

```javascript
scale: {
  size: {
    type: 'linear',   // 默认：线性映射数值到大小
    range: [5, 50],   // [最小半径, 最大半径] (px)
    // 注意：G2 用面积而非半径映射，视觉上更准确
  },
}
```

## 常见错误与修正

### 错误 1：size 通道绑定字符串类别而不是数值
```javascript
// ❌ 错误：size 通道应绑定数值字段，而不是类别
chart.options({
  encode: {
    size: 'country',  // ❌ 字符串，无法映射为大小
  },
});

// ✅ 正确：size 绑定数值字段
chart.options({
  encode: {
    size: 'population',  // ✅ 数值，可映射为气泡大小
  },
});
```

### 错误 2：没有设置 scale.size.range——气泡太小或太大
```javascript
// ❌ 默认 range 可能导致气泡尺寸不合适（遮挡其他数据或几乎不可见）
chart.options({
  encode: { size: 'value' },
  // ❌ 没有 scale.size.range
});

// ✅ 明确设置合适的气泡大小范围
chart.options({
  encode: { size: 'value' },
  scale: {
    size: { range: [8, 48] },  // ✅ 合适的视觉范围
  },
});
```
