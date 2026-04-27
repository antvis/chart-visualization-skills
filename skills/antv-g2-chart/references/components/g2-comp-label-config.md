---
id: "g2-comp-label-config"
title: "G2 数据标签配置（labels）"
description: |
  详解 G2 v5 Spec 模式中 labels 字段的配置，涵盖标签文本、位置、格式化、
  选择器（只显示部分标签）及样式定制。注意：Spec 模式中使用 labels（复数）。

library: "g2"
version: "5.x"
category: "components"
tags:
  - "labels"
  - "label"
  - "数据标签"
  - "文字标签"
  - "position"
  - "formatter"
  - "spec"

related:
  - "g2-mark-interval-basic"
  - "g2-mark-line-basic"
  - "g2-comp-annotation"

use_cases:
  - "在柱体上方显示数值"
  - "在折线末端显示系列名称"
  - "在饼图扇区内外显示百分比"

difficulty: "beginner"
completeness: "full"
created: "2024-01-01"
updated: "2025-03-01"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/manual/component/label"
---

## 基本用法

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({ container: 'container', width: 640, height: 480 });

chart.options({
  type: 'interval',
  data,
  encode: { x: 'genre', y: 'sold' },
  labels: [
    {
      text: 'sold',          // 显示哪个字段的值（字段名字符串或函数）
      position: 'outside',   // 标签位置
    },
  ],
});

chart.render();
```

## 常用位置说明

| position 值 | 适用 Mark | 效果 |
|-------------|-----------|------|
| `'outside'` | interval | 柱体顶端外侧（默认） |
| `'inside'` | interval | 柱体内部中央 |
| `'top'` | interval | 柱体顶部（紧贴顶端） |
| `'right'` | interval | 柱体右侧 |
| `'outside'` | arc（饼图）| 扇区外侧引线 |
| `'inside'` | arc（饼图）| 扇区内部 |
| `'top'` | point | 点的上方 |
| `'right'` | line | 折线末端右侧 |

## 格式化标签文本

```javascript
labels: [
  {
    // 推荐：text 函数方式，可访问完整数据行 datum
    text: (d) => `${d.sold.toLocaleString()} 万`,

    // 或字符串字段名（自动取该字段的值）
    // text: 'sold',
  },
],
```

## formatter 用法（仅格式化已取值的文本）

`formatter` 接收的第一个参数是 `text` 已映射的值（非完整 datum），适合对数值进行简单格式化：

```javascript
labels: [
  {
    text: 'yield_rate',              // 先映射字段 yield_rate 的值
    formatter: (val) => `${val}%`,   // val 是 yield_rate 的值，非 datum 对象
  },
],
```

完整签名：`formatter(text, datum, index, data) => string`

## 完整 label 配置项

```javascript
labels: [
  {
    text: (d) => d.value.toFixed(1),  // 标签文本（推荐用函数直接访问 datum）
    position: 'outside',               // 位置

    // ── 样式 ─────────────────────────────────
    style: {
      fontSize: 12,
      fill: '#333',
      fontWeight: 'bold',
      textAlign: 'center',
      dy: -4,                          // y 方向偏移（px）
      dx: 0,                           // x 方向偏移
    },

    // ── 选择器（只显示部分标签）──────────────
    selector: 'last',                  // 'last' | 'first' | (data) => datum
    // 过滤（只对满足条件的数据显示标签）
    filter: (d) => d.value > 50,

    // ── 连接线（饼图外部标签时常用）──────────
    connector: true,
    connectorStroke: '#aaa',
    connectorLineWidth: 1,
  },
],
```

## 折线末端标签

```javascript
// 只在每条折线的最后一个点显示系列名称
chart.options({
  type: 'line',
  data,
  encode: { x: 'month', y: 'value', color: 'type' },
  labels: [
    {
      text: 'type',         // 显示系列名
      selector: 'last',     // 只在最后一个数据点显示
      position: 'right',
      style: { fontSize: 11 },
    },
  ],
});
```

## 堆叠柱中心标签

```javascript
chart.options({
  type: 'interval',
  data,
  encode: { x: 'month', y: 'value', color: 'type' },
  transform: [{ type: 'stackY' }],
  labels: [
    {
      text: (d) => d.value >= 30 ? d.value : '',  // 数值太小时不显示
      position: 'inside',
      style: { fill: 'white', fontSize: 11 },
    },
  ],
});
```

## 常见错误与修正

### 错误：Spec 模式中写成 label（单数）
```javascript
// ❌ 错误：链式 API 是 .label()，但 Spec 模式是 labels（复数，且是数组）
chart.options({ label: { text: 'value' } });

// ✅ 正确：Spec 中用 labels 数组
chart.options({ labels: [{ text: 'value' }] });
```

### 错误：text 传入了数字常量
```javascript
// ❌ 错误：text 为数字 0，所有标签显示 '0'
chart.options({ labels: [{ text: 0 }] });

// ✅ 正确：text 应为字段名字符串或函数
chart.options({ labels: [{ text: 'value' }] });
chart.options({ labels: [{ text: (d) => d.value.toFixed(1) }] });
```

### 错误：formatter 中把第一个参数当成 datum
```javascript
// ❌ 错误：formatter 的第一个参数是已映射的文本值，不是 datum
labels: [{
  text: 'yield_rate',
  formatter: (d) => `${d.yield_rate}%`,  // d 是数值，d.yield_rate 为 undefined
}]

// ✅ 方案一：用 text 函数直接访问 datum（推荐）
labels: [{
  text: (d) => `${d.yield_rate}%`,
}]

// ✅ 方案二：formatter 正确用法（参数是已取值的文本）
labels: [{
  text: 'yield_rate',
  formatter: (val) => `${val}%`,  // val 是 yield_rate 的值
}]
```
