---
id: "g2-mark-area-basic"
title: "G2 基础面积图（Area Mark）"
description: |
  使用 Area Mark 创建面积图，在折线图的基础上填充线下方区域，
  强调数据的量级和趋势。本文采用 Spec 模式，涵盖单系列、渐变填充等用法。
library: "g2"
version: "5.x"
category: "marks"
subcategory: "area"
tags:
  - "面积图"
  - "Area"
  - "area chart"
  - "趋势"
  - "量级"
  - "填充"
  - "spec"
related:
  - "g2-design-default-aesthetics"
  - "g2-mark-line-basic"
  - "g2-mark-area-stacked"
  - "g2-core-encode-channel"
use_cases:
  - "展示数值随时间的变化趋势，同时强调量级"
  - "叠加折线时作为背景填充"
  - "对比多个系列的总量分布"
anti_patterns:
  - "多系列面积图（无堆叠）时各系列互相遮挡，改用堆叠面积图或折线图"
---


## 最小可运行示例

> 单系列趋势图：用稳定主色 + `style.fillOpacity: 0.5~0.6`（覆写引擎默认 `0.85`，偏实，降一些更透气）。语义化文本（轴标题/单位/tooltip/title）只写数据真实携带的语义，未知则省略，不要照搬本例的销量/件。完整策略见 `g2-design-default-aesthetics`。

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({
  container: 'container',
  autoFit: true,
  height: 360,
  theme: 'classic',
});

chart.options({
  type: 'area',
  data: [
    { month: '1月', sales: 33 },
    { month: '2月', sales: 78 },
    { month: '3月', sales: 56 },
    { month: '4月', sales: 91 },
    { month: '5月', sales: 67 },
    { month: '6月', sales: 45 },
  ],
  encode: { x: 'month', y: 'sales' },
  style: {
    fill: '#5B8FF9',
    fillOpacity: 0.6,
  },
  padding: 'auto',
  title: { title: '上半年月度销量', subtitle: '单位：件' },
  axis: {
    x: { title: '月份' },
    y: { title: '销量 / 件' },
  },
  tooltip: {
    title: 'month',
    items: [{ channel: 'y', name: '销量', valueFormatter: (v) => `${v} 件` }],
  },
});

chart.render();
```

## 渐变填充面积图

```javascript
chart.options({
  type: 'area',
  data,
  encode: { x: 'month', y: 'value' },
  style: {
    fill: 'linear-gradient(180deg, #1890ff 0%, rgba(24,144,255,0.1) 100%)',
    fillOpacity: 0.8,
  },
});
```

## 面积图 + 折线（叠加）

```javascript
// 面积提供背景量感，折线提供精确走势
chart.options({
  type: 'view',
  data,
  children: [
    {
      type: 'area',
      encode: { x: 'month', y: 'value' },
      style: { fillOpacity: 0.2, fill: '#1890ff' },
    },
    {
      type: 'line',
      encode: { x: 'month', y: 'value' },
      style: { stroke: '#1890ff', lineWidth: 2 },
    },
    {
      type: 'point',
      encode: { x: 'month', y: 'value', shape: 'circle' },
      style: { fill: '#1890ff', r: 4 },
    },
  ],
});
```

## 平滑曲线面积图

```javascript
chart.options({
  type: 'area',
  data,
  encode: {
    x: 'month',
    y: 'value',
    shape: 'smooth',    // 平滑插值
  },
  style: { fillOpacity: 0.6 },
});
```

## 时间序列面积图

```javascript
chart.options({
  type: 'area',
  data: [
    { date: new Date('2024-01'), value: 100 },
    { date: new Date('2024-02'), value: 130 },
    { date: new Date('2024-03'), value: 90  },
    { date: new Date('2024-04'), value: 160 },
    { date: new Date('2024-05'), value: 145 },
  ],
  encode: { x: 'date', y: 'value' },
  axis: {
    x: { labelFormatter: 'YYYY-MM' },
  },
});
```

## 常见错误与修正

### 错误 1：在 area mark 上使用 stroke + lineWidth 描边

```javascript
// ❌ 错误：stroke + lineWidth 会包裹整个填充区域（底部、两侧都描边），
// 而不是仅顶部边缘线
chart.options({
  type: 'area',
  data,
  encode: { x: 'date', y: 'value' },
  style: {
    fill: '#FF5924',
    fillOpacity: 0.4,
    stroke: '#FF5924',      // ❌ 描边包裹整个区域
    lineWidth: 2,            // ❌
  },
});

// ✅ 正确：用 view + children 叠加 area（填充）+ line（顶部边缘线）
chart.options({
  type: 'view',
  data,
  children: [
    {
      type: 'area',
      encode: { x: 'date', y: 'value' },
      style: { fill: '#FF5924', fillOpacity: 0.4 },
    },
    {
      type: 'line',
      encode: { x: 'date', y: 'value' },
      style: { stroke: '#FF5924', lineWidth: 2 },
    },
  ],
});
```

### 错误 2：多系列面积图不加 stackY 导致互相遮挡
```javascript
// ❌ 问题：多系列面积相互覆盖，后面的系列遮挡前面的
chart.options({
  type: 'area',
  data: multiSeriesData,
  encode: { x: 'month', y: 'value', color: 'type' },
  // 没有 stackY，各系列从 y=0 开始叠加，互相遮盖
});

// ✅ 方案 1：堆叠面积图（见 g2-mark-area-stacked）
chart.options({
  type: 'area',
  encode: { x: 'month', y: 'value', color: 'type' },
  transform: [{ type: 'stackY' }],
});

// ✅ 方案 2：改用折线图对比多系列
chart.options({
  type: 'line',
  encode: { x: 'month', y: 'value', color: 'type' },
});
```
