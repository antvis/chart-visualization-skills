---
id: "g2-transform-groupx"
title: "G2 GroupX 分组聚合变换"
description: |
  groupX 按 x 通道的值对数据分组，并对 y 通道进行聚合计算（count、sum、mean、min、max 等）。
  常用于从原始行级数据直接计算统计量，无需预先聚合数据。
  groupY、groupColor、groupN 是其变体，分别按 y、color 通道或固定数量分组。

library: "g2"
version: "5.x"
category: "transforms"
tags:
  - "groupX"
  - "分组"
  - "聚合"
  - "count"
  - "sum"
  - "mean"
  - "transform"
  - "统计"

related:
  - "g2-transform-stacky"
  - "g2-transform-binx"
  - "g2-mark-interval-basic"

use_cases:
  - "从行级原始数据统计各类别的数量（频率柱状图）"
  - "从明细数据聚合出各组的均值/求和"
  - "词频统计可视化"

difficulty: "intermediate"
completeness: "full"
created: "2025-03-24"
updated: "2025-03-24"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/manual/core/transform/group"
---

## 最小可运行示例（计数频率柱状图）

```javascript
import { Chart } from '@antv/g2';

// 原始行级数据，不需要预先统计频次
const rawData = [
  { dept: '研发' }, { dept: '研发' }, { dept: '研发' },
  { dept: '销售' }, { dept: '销售' },
  { dept: '设计' }, { dept: '设计' }, { dept: '设计' }, { dept: '设计' },
  { dept: 'HR' },
];

const chart = new Chart({ container: 'container', width: 640, height: 400 });

chart.options({
  type: 'interval',
  data: rawData,
  encode: {
    x: 'dept',  // 分组字段
    y: '★',     // 占位符，实际 y 值由 groupX 计算
    color: 'dept',
  },
  transform: [
    {
      type: 'groupX',
      y: 'count',    // 对 y 通道的聚合方式：统计每组数量
    },
  ],
});

chart.render();
```

## 聚合方式速查

```javascript
// 计数（每组有多少条记录）
transform: [{ type: 'groupX', y: 'count' }]

// 求和（每组 y 字段的总和）
transform: [{ type: 'groupX', y: 'sum' }]

// 均值（每组 y 字段的平均值）
transform: [{ type: 'groupX', y: 'mean' }]

// 最大值 / 最小值
transform: [{ type: 'groupX', y: 'max' }]
transform: [{ type: 'groupX', y: 'min' }]

// 中位数
transform: [{ type: 'groupX', y: 'median' }]

// 自定义聚合函数
transform: [{ type: 'groupX', y: (values) => values.reduce((a, b) => a + b, 0) / values.length }]
```

## 按颜色分组（groupColor）

```javascript
// 统计各部门男女人数
chart.options({
  type: 'interval',
  data: rawEmployeeData,
  encode: { x: 'dept', y: '★', color: 'gender' },
  transform: [
    { type: 'groupX', y: 'count' },   // 先按 x 和 color 组合分组统计
    { type: 'dodgeX' },               // 再分组并排
  ],
});
```

## 均值折线图（从明细数据直接绘制）

```javascript
chart.options({
  type: 'line',
  data: dailySalesData,
  encode: { x: 'month', y: 'dailySales' },
  transform: [
    { type: 'groupX', y: 'mean' },  // 计算每月平均日销售额
  ],
  style: { lineWidth: 2 },
});
```

## 常见错误与修正

### 错误 1：encode.y 写成实际字段名——groupX 应用后 y 通道被覆盖
```javascript
// ❌ 如果想让 groupX 计算 count，encode.y 不需要写实际字段
chart.options({
  encode: { x: 'dept', y: 'salary' },
  transform: [{ type: 'groupX', y: 'count' }],  // ⚠️  count 会覆盖 salary
});
// 结果：y 轴显示的是 count，不是 salary 的总和

// ✅ 如果想要 count，y 字段名无所谓（通常写 '★' 或任意占位符）
chart.options({
  encode: { x: 'dept', y: '★' },
  transform: [{ type: 'groupX', y: 'count' }],  // ✅ 统计每组数量
});

// ✅ 如果想要 sum(salary)，encode.y 必须写 'salary'
chart.options({
  encode: { x: 'dept', y: 'salary' },
  transform: [{ type: 'groupX', y: 'sum' }],  // ✅ 统计每组 salary 总和
});
```

### 错误 2：与 binX 混淆——groupX 用于已有分类，binX 用于数值分桶
```javascript
// ❌ 对数值 x 用 groupX，每个唯一值都是一组，组太多
chart.options({
  encode: { x: 'age', y: '★' },
  transform: [{ type: 'groupX', y: 'count' }],  // ❌ age 有几十个唯一值
});

// ✅ 数值 x 应该用 binX（先分桶再统计）
chart.options({
  encode: { x: 'age', y: '★' },
  transform: [{ type: 'binX', y: 'count', thresholds: 10 }],  // ✅ 分 10 个桶
});
```
