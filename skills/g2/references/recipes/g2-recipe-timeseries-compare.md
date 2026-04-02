---
id: "g2-recipe-timeseries-compare"
title: "G2 时序对比图（多系列折线图）"
description: |
  多系列时序对比图：fold 将宽表转为长表、Time Scale 处理日期轴、
  折线末端 selector: 'last' 标注系列名，多系列差异通过 color 通道区分。

library: "g2"
version: "5.x"
category: "recipes"
tags:
  - "时序"
  - "多系列"
  - "折线图"
  - "time"
  - "fold"
  - "对比"
  - "spec"

related:
  - "g2-mark-line-basic"
  - "g2-scale-time"
  - "g2-transform-fold"
  - "g2-comp-label-config"

use_cases:
  - "多指标随时间变化的对比"
  - "多地区/产品的趋势对比"
  - "KPI 历史走势分析"

difficulty: "intermediate"
completeness: "full"
created: "2024-01-01"
updated: "2025-03-01"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/examples"
---

## 最小可运行示例（长表数据）

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({
  container: 'container',
  width: 720,
  height: 400,
});

// 长表格式：每行一个数据点
const data = [
  { date: new Date('2024-01'), product: '产品A', revenue: 120 },
  { date: new Date('2024-02'), product: '产品A', revenue: 145 },
  { date: new Date('2024-03'), product: '产品A', revenue: 132 },
  { date: new Date('2024-04'), product: '产品A', revenue: 178 },
  { date: new Date('2024-05'), product: '产品A', revenue: 165 },
  { date: new Date('2024-01'), product: '产品B', revenue: 95 },
  { date: new Date('2024-02'), product: '产品B', revenue: 108 },
  { date: new Date('2024-03'), product: '产品B', revenue: 121 },
  { date: new Date('2024-04'), product: '产品B', revenue: 139 },
  { date: new Date('2024-05'), product: '产品B', revenue: 155 },
];

chart.options({
  type: 'line',
  data,
  encode: {
    x: 'date',
    y: 'revenue',
    color: 'product',    // 按 product 区分系列颜色
  },
  labels: [
    {
      text: 'product',     // 显示系列名称
      selector: 'last',    // 只在最后一个点显示
      position: 'right',
      style: { fontSize: 12 },
    },
  ],
  axis: {
    x: {
      labelFormatter: 'YYYY-MM',   // 时间轴格式：年-月
    },
  },
  interaction: [{ type: 'tooltip' }],
});

chart.render();
```

## 宽表数据 + fold 转换

```javascript
// 宽表格式：每行包含多个指标列
const wideData = [
  { date: '2024-01', DAU: 12000, MAU: 45000, revenue: 8800 },
  { date: '2024-02', DAU: 13500, MAU: 47000, revenue: 9200 },
  { date: '2024-03', DAU: 11800, MAU: 44500, revenue: 8600 },
  { date: '2024-04', DAU: 15200, MAU: 51000, revenue: 10500 },
  { date: '2024-05', DAU: 14600, MAU: 49000, revenue: 9800 },
];

chart.options({
  type: 'line',
  data: wideData,
  transform: [
    {
      type: 'fold',
      fields: ['DAU', 'MAU'],     // 只对比 DAU/MAU（不含 revenue，量级不同）
      key: 'metric',
      value: 'count',
    },
  ],
  encode: {
    x: 'date',
    y: 'count',
    color: 'metric',
  },
  scale: {
    x: { type: 'time' },          // 字符串日期需显式声明
  },
  labels: [
    {
      text: 'metric',
      selector: 'last',
      position: 'right',
    },
  ],
});
```

## 带参考线的时序图

```javascript
chart.options({
  type: 'view',
  data,
  encode: { x: 'date', y: 'value' },
  children: [
    {
      type: 'line',
      encode: { color: 'series' },
      labels: [
        { text: 'series', selector: 'last', position: 'right' },
      ],
    },
    {
      type: 'lineY',   // 水平参考线
       [{ target: 10000 }],
      encode: { y: 'target' },
      style: { stroke: '#ff4d4f', lineDash: [6, 3], lineWidth: 1.5 },
      labels: [
        { text: '目标线', position: 'right', style: { fill: '#ff4d4f' } },
      ],
    },
  ],
  axis: {
    x: { labelFormatter: 'MM/DD' },
    y: { title: '访问量' },
  },
});
```

## 折线 + 面积填充（增强视觉效果）

```javascript
chart.options({
  type: 'view',
  data,
  encode: { x: 'date', y: 'revenue', color: 'product' },
  children: [
    {
      type: 'area',
      style: { fillOpacity: 0.1 },      // 低透明度面积填充
    },
    {
      type: 'line',
      style: { lineWidth: 2 },
    },
  ],
  scale: {
    x: { type: 'time' },
  },
  axis: {
    x: { labelFormatter: 'YYYY-MM' },
    y: { labelFormatter: (v) => `${(v/10000).toFixed(1)}万` },
  },
  interaction: [
    { type: 'tooltip' },
    { type: 'elementHighlight' },
  ],
});
```

## 双 Y 轴（不同量级系列）

```javascript
chart.options({
  type: 'view',
  children: [
    {
      type: 'line',
       revenueData,
      encode: { x: 'date', y: 'revenue', color: () => '收入(万元)' },
      scale: { y: { key: 'revenue' } },   // y 轴 key 唯一，独立轴
    },
    {
      type: 'line',
       userCountData,
      encode: { x: 'date', y: 'count', color: () => '用户数' },
      scale: { y: { key: 'count' } },     // 另一个独立 y 轴
      axis: { y: { position: 'right' } },  // 放在右侧
    },
  ],
});
```

## Tooltip 配置（悬停显示多系列数据）

```javascript
chart.options({
  type: 'line',
  data,
  encode: { x: 'date', y: 'value', color: 'series' },
  tooltip: {
    title: (d) => {
      const date = new Date(d.date);
      return `${date.getFullYear()}年${date.getMonth() + 1}月`;
    },
    items: [
      { field: 'series', name: '系列' },
      { field: 'value', name: '数值', valueFormatter: (v) => v.toLocaleString() },
    ],
  },
  interaction: [{ type: 'tooltip' }],
});
```

## 常见错误与修正

### 错误：字符串日期未声明 time scale 导致排序错乱
```javascript
// ❌ 错误：字符串日期默认被当作分类，按数据原始顺序排列
chart.options({
  type: 'line',
  data: [
    { date: '2024-03', value: 130 },
    { date: '2024-01', value: 100 },   // 乱序数据
  ],
  encode: { x: 'date', y: 'value' },
  // 缺少 scale: { x: { type: 'time' } }，x 轴会按数据顺序显示
});

// ✅ 正确：声明 time scale，G2 自动按时间排序
chart.options({
  type: 'line',
  data,
  encode: { x: 'date', y: 'value' },
  scale: { x: { type: 'time' } },   // ✅ 字符串日期需要显式声明
});
```

### 错误：fold 后 encode 字段名未更新
```javascript
// ❌ 错误：fold 后字段名已变为 metric/count，但 encode 仍用原字段
chart.options({
  transform: [{ type: 'fold', fields: ['A', 'B'], key: 'metric', value: 'count' }],
  encode: { x: 'date', y: 'A', color: 'B' },   // ❌ 字段已不存在
});

// ✅ 正确：使用 fold 配置的 key/value 字段名
chart.options({
  transform: [{ type: 'fold', fields: ['A', 'B'], key: 'metric', value: 'count' }],
  encode: { x: 'date', y: 'count', color: 'metric' },   // ✅
});
```
