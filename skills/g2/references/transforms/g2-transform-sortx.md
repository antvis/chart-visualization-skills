---
id: "g2-transform-sortx"
title: "G2 SortX 排序变换"
description: |
  SortX 对 x 轴的分类数据按指定字段或函数进行排序，
  常用于将柱状图按数值从大到小排列，创建排名图表。
  多系列按分组总量排序用内置 reducer: 'sum'，无需自定义函数。

library: "g2"
version: "5.x"
category: "transforms"
tags:
  - "sortX"
  - "排序"
  - "排名"
  - "transform"
  - "柱状图排序"
  - "spec"

related:
  - "g2-mark-interval-basic"
  - "g2-transform-dodgex"

use_cases:
  - "创建按值降序排列的柱状图（排名图）"
  - "对分类轴自定义排序顺序"
  - "多系列堆叠图按分组总量排序"

difficulty: "beginner"
completeness: "full"
created: "2024-01-01"
updated: "2025-04-02"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/manual/core/transform/sort-x"
---

## 最小可运行示例（按值降序排列）

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({ container: 'container', width: 640, height: 480 });

chart.options({
  type: 'interval',
   [
    { city: '北京', gdp: 3.6 },
    { city: '上海', gdp: 4.3 },
    { city: '广州', gdp: 2.8 },
    { city: '深圳', gdp: 3.2 },
    { city: '杭州', gdp: 1.8 },
    { city: '成都', gdp: 2.0 },
  ],
  encode: { x: 'city', y: 'gdp' },
  transform: [
    {
      type: 'sortX',
      by: 'y',           // 按 y 通道值排序
      reverse: true,     // true = 降序（最大值在左）
    },
  ],
  coordinate: { transform: [{ type: 'transpose' }] },   // 转为水平排名图
});

chart.render();
```

## 配置项

```javascript
transform: [
  {
    type: 'sortX',
    by: 'y',          // 排序依据的 channel 名（'y' | 'x' | 'color' 等）
    reducer: 'max',   // 分组聚合方式（见下方说明），默认 'max'
    reverse: true,    // 是否反转顺序（默认 false = 升序）
    slice: 10,        // 只保留前 N 个（用于 Top N 图表）
  },
],
```

**`reducer` 内置值**（多系列/堆叠场景下对分组内的多个 y 值做聚合）：

| 值 | 含义 |
|----|------|
| `'max'` | 取分组最大值（默认） |
| `'min'` | 取分组最小值 |
| `'sum'` | 取分组总和 ← **多系列按总量排序用这个** |
| `'mean'` | 取分组平均值 |
| `'median'` | 取分组中位数 |
| `'first'` | 取分组第一个值 |
| `'last'` | 取分组最后一个值 |

## Top N 排名图（只展示前 10）

```javascript
chart.options({
  type: 'interval',
  data: fullData,
  encode: { x: 'name', y: 'score' },
  transform: [
    {
      type: 'sortX',
      by: 'y',
      reverse: true,
      slice: 10,   // 只取前 10 名
    },
  ],
  coordinate: { transform: [{ type: 'transpose' }] },
  axis: { x: { title: null } },
});
```

## 自定义排序（按指定字段）

```javascript
// 数据中有 rank 字段，按 rank 排序
chart.options({
  type: 'interval',
  data,
  encode: { x: 'name', y: 'value' },
  transform: [
    { type: 'sortX', by: 'rank', reverse: false },
  ],
});
```

## 按分组总量排序（多系列堆叠图）

多系列图中每个 x 分组有多条数据，用内置 `reducer: 'sum'` 按各分组 y 值之和排序，**不需要自定义函数**：

```javascript
chart.options({
  type: 'interval',
  data,
  encode: { x: 'city', y: 'value', color: 'type' },
  transform: [
    { type: 'stackY' },
    {
      type: 'sortX',
      by: 'y',
      reducer: 'sum',   // ✅ 内置求和，按各城市所有系列总和排序
      reverse: true,
    },
  ],
});
```

## 常见错误与修正

### 错误：用自定义函数代替内置 reducer，且误用不存在的 `{ value }` 参数

`sortX` 没有 `by: ({ value }) => ...` 这种 API。`by` 只接受 **channel 名字符串**，聚合逻辑通过 `reducer` 控制。自定义 `reducer` 函数的签名是 `(GI, V) => number`（`GI` = 该分组的行索引数组，`V` = 整列数值数组），而不是接收数据对象数组。

```javascript
// ❌ 错误：by 不接受函数，({ value }) 参数不存在
transform: [
  {
    type: 'sortX',
    by: ({ value }) => d3.sum(value, (d) => d.sales),   // ❌ by 只能是字符串
    reverse: true,
  },
],

// ❌ 同样错误：即使不用 d3，函数形式也不对
transform: [
  {
    type: 'sortX',
    by: ({ value }) => value.reduce((sum, d) => sum + d.value, 0),  // ❌ by 不支持函数
    reverse: true,
  },
],

// ✅ 正确：按分组总和排序用内置 reducer: 'sum'
transform: [
  {
    type: 'sortX',
    by: 'y',
    reducer: 'sum',   // ✅ 内置聚合，无需自定义函数
    reverse: true,
  },
],
```

### 错误：在任何回调中使用未导入的 `d3`

G2 内部使用 d3，但 `d3` 对象不会暴露到用户代码作用域。调用 `d3.sum()`、`d3.max()` 等会抛出 `ReferenceError: d3 is not defined`。如确需自定义逻辑，用原生 JS 替代：

```javascript
// d3.sum(arr, d => d.v)  →  arr.reduce((s, d) => s + d.v, 0)
// d3.max(arr, d => d.v)  →  Math.max(...arr.map(d => d.v))
// d3.min(arr, d => d.v)  →  Math.min(...arr.map(d => d.v))
// d3.mean(arr, d => d.v) →  arr.reduce((s, d) => s + d.v, 0) / arr.length
```
