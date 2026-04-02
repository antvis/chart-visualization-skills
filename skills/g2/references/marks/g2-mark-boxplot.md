---
id: "g2-mark-boxplot"
title: "G2 boxplot 自动统计箱线图"
description: |
  boxplot 是 G2 v5 的复合 Mark，自动从原始数据计算 Q1/Q2/Q3/须/离群值，
  直接输入明细数据即可生成标准箱线图，无需手动计算五数摘要。
  与 box mark（需要手动提供 Q1/Q3 等统计值）不同，boxplot 内置统计计算逻辑。

library: "g2"
version: "5.x"
category: "marks"
tags:
  - "boxplot"
  - "箱线图"
  - "自动统计"
  - "分布"
  - "Q1"
  - "Q3"
  - "中位数"
  - "离群值"

related:
  - "g2-mark-box-boxplot"
  - "g2-mark-point-scatter"
  - "g2-transform-bin"

use_cases:
  - "直接用明细数据绘制箱线图（无需预计算）"
  - "多组数据分布对比"
  - "展示数据的分布形状和离群值"

difficulty: "beginner"
completeness: "full"
created: "2025-03-24"
updated: "2025-03-24"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/examples/statistics/box/#boxplot"
---

## 与 box mark 的区别

| | `boxplot` | `box` |
|--|-----------|-------|
| 输入数据 | 明细数据（自动计算统计量） | 需要手动提供 Q1/Q3 等字段 |
| 复合性 | 复合 Mark（包含箱体+须+离群值） | 单一 Mark（只绘制箱体） |
| 适用场景 | 大多数场景（推荐） | 数据已预聚合时 |

## 最小可运行示例

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({ container: 'container', width: 640, height: 480 });

chart.options({
  type: 'boxplot',
  data: [
    { group: 'A', value: 10 },
    { group: 'A', value: 14 },
    { group: 'A', value: 12 },
    { group: 'A', value: 25 },   // 离群值
    { group: 'A', value: 11 },
    { group: 'A', value: 13 },
    { group: 'B', value: 20 },
    { group: 'B', value: 22 },
    { group: 'B', value: 18 },
    { group: 'B', value: 5 },    // 离群值
    { group: 'B', value: 21 },
  ],
  encode: {
    x: 'group',   // 分组字段
    y: 'value',   // 数值字段（自动计算统计量）
  },
});

chart.render();
```

## 配置样式

```javascript
chart.options({
  type: 'boxplot',
  data,
  encode: {
    x: 'category',
    y: 'score',
    color: 'category',   // 按类别着色
  },
  style: {
    boxFill: '#1890ff',          // 箱体填充色
    boxFillOpacity: 0.3,         // 箱体透明度
    boxStroke: '#1890ff',        // 箱体边框色
    medianStroke: '#ff4d4f',     // 中位数线颜色
    medianLineWidth: 2,          // 中位数线宽
    whiskerStroke: '#666',       // 须线颜色
    outlierFill: '#ff4d4f',      // 离群点颜色
    outlierR: 4,                 // 离群点半径
  },
});
```

## 水平箱线图

```javascript
chart.options({
  type: 'boxplot',
  data,
  encode: {
    x: 'score',      // x 轴为数值
    y: 'category',   // y 轴为分类
  },
  coordinate: { transform: [{ type: 'transpose' }] },
});
```

## 常见错误与修正

### 错误：用 box 替代 boxplot 但不提供统计字段
```javascript
// ❌ 错误：box mark 需要手动提供 Q1/median/Q3/min/max 字段
chart.options({
  type: 'box',
   rawDetailData,   // 原始明细数据
  encode: { x: 'group', y: 'value' },  // ❌ box 需要 y 为 [min, Q1, median, Q3, max]
});

// ✅ 使用原始明细数据时，应该用 boxplot（自动计算统计量）
chart.options({
  type: 'boxplot',
  data: rawDetailData,
  encode: { x: 'group', y: 'value' },  // ✅ boxplot 自动计算
});
```
