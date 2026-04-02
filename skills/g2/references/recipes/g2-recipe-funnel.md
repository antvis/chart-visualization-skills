---
id: "g2-recipe-funnel"
title: "G2 漏斗图"
description: |
  G2 v5 漏斗图通过 type: 'interval' + coordinate: { type: 'symmetryY' } 实现，
  配合 transform: [{ type: 'normalizeY' }] 可做百分比漏斗，
  支持转化率标注和对比漏斗（两组数据左右对称）。

library: "g2"
version: "5.x"
category: "recipes"
tags:
  - "funnel"
  - "漏斗图"
  - "转化率"
  - "symmetryY"
  - "conversion"
  - "spec"

related:
  - "g2-mark-interval-basic"
  - "g2-transform-normalizey"
  - "g2-comp-label-config"
  - "g2-coord-transpose"

use_cases:
  - "用户转化流程分析（注册→激活→付费）"
  - "销售漏斗（线索→商机→成交）"
  - "A/B 测试转化率对比"

difficulty: "intermediate"
completeness: "full"
created: "2024-01-01"
updated: "2025-03-01"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/examples"
---

## 最小可运行示例

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({
  container: 'container',
  width: 480,
  height: 400,
});

const data = [
  { stage: '访问',   count: 10000 },
  { stage: '注册',   count: 6200 },
  { stage: '激活',   count: 3800 },
  { stage: '付费',   count: 1500 },
  { stage: '复购',   count: 800 },
];

chart.options({
  type: 'interval',
  data,
  encode: {
    x: 'stage',
    y: 'count',
    color: 'stage',
    shape: 'funnel',
  },
  transform: [
    { type: 'symmetryY' },    // 关键：上下对称（形成漏斗形状）
  ],
  coordinate: { transform: [{ type: 'transpose' }] },   // 转置为水平方向（标准漏斗方向）
  axis: false,                          // 漏斗图通常隐藏坐标轴
  legend: false,
  labels: [
    {
      text: (d) => `${d.stage}：${d.count.toLocaleString()}`,
      position: 'inside',
      style: { fill: 'white', fontSize: 13 },
    },
  ],
});

chart.render();
```

## 百分比漏斗 + 转化率标注

```javascript
// 计算转化率
const dataWithRate = data.map((d, i) => ({
  ...d,
  rate: i === 0 ? '100%' : `${((d.count / data[i - 1].count) * 100).toFixed(1)}%`,
}));

chart.options({
  type: 'interval',
  data: dataWithRate,
  encode: {
    x: 'stage',
    y: 'count',
    color: 'stage',
    shape: 'funnel',
  },
  transform: [
    { type: 'normalizeY' },   // 归一化（高度等比）
    { type: 'symmetryY' },    // 上下对称
  ],
  coordinate: { transform: [{ type: 'transpose' }] },
  axis: false,
  legend: false,
  labels: [
    {
      text: (d) => d.stage,
      position: 'inside',
      style: { fill: 'white', fontSize: 13, fontWeight: 'bold' },
    },
    {
      text: (d) => `转化率 ${d.rate}`,   // 第二个标签：转化率
      position: 'right',
      style: { fill: '#666', fontSize: 11 },
      dx: 8,
    },
  ],
});
```

## 垂直漏斗图（不转置）

```javascript
chart.options({
  type: 'interval',
  data,
  encode: {
    x: 'stage',
    y: 'count',
    color: 'stage',
    shape: 'pyramid', // 金字塔漏斗图
  },
  transform: [
    { type: 'symmetryY' },   // 左右对称
  ],
  // 不加 coordinate: { transform: [{ type: 'transpose' }] }，保持垂直方向
  axis: false,
  legend: false,
  labels: [
    {
      text: (d) => `${d.stage}\n${d.count.toLocaleString()}`,
      position: 'inside',
      style: { fill: 'white', fontSize: 12, textAlign: 'center' },
    },
  ],
});
```

## 对比漏斗（A/B 对比）

```javascript
// 两组数据：A 组在左，B 组在右
const compareData = [
  { stage: '访问', group: 'A', count: 10000 },
  { stage: '注册', group: 'A', count: 6200 },
  { stage: '付费', group: 'A', count: 1500 },
  { stage: '访问', group: 'B', count: 10000 },
  { stage: '注册', group: 'B', count: 7800 },
  { stage: '付费', group: 'B', count: 2100 },
];

chart.options({
  type: 'interval',
  data: compareData,
  encode: {
    x: 'stage',
    y: 'count',
    color: 'group',
  },
  transform: [
    { type: 'dodgeX' },     // 分组排列
    { type: 'symmetryY' },  // 对称
  ],
  coordinate: { transform: [{ type: 'transpose' }] },
  axis: {
    x: { title: null },
    y: false,
  },
  legend: { color: { position: 'top' } },
});
```

## 带渐变色的漏斗图

```javascript
chart.options({
  type: 'interval',
  data,
  encode: {
    x: 'stage',
    y: 'count',
    shape: 'funnel',
  },
  transform: [{ type: 'symmetryY' }],
  coordinate: { transform: [{ type: 'transpose' }] },
  style: {
    // 使用渐变色
    fill: 'l(0) 0:#1890ff 1:#73d13d',   // 从蓝到绿的线性渐变
    stroke: 'white',
    lineWidth: 1,
  },
  axis: false,
  legend: false,
  labels: [
    {
      text: (d) => `${d.stage}（${d.count.toLocaleString()}）`,
      position: 'inside',
      style: { fill: 'white', fontSize: 13 },
    },
  ],
});
```

## 常见错误与修正

### 错误：漏斗图未加 symmetryY transform
```javascript
// ❌ 错误：只有 interval + transpose 是水平柱状图，不是漏斗形状
chart.options({
  type: 'interval',
  data,
  encode: { x: 'stage', y: 'count' },
  coordinate: { transform: [{ type: 'transpose' }] },
  // 缺少 symmetryY，形状不对称，不是漏斗
});

// ✅ 正确：需要 symmetryY 才能形成漏斗形状
chart.options({
  type: 'interval',
  data,
  encode: { x: 'stage', y: 'count', shape: 'pyramid' },
  transform: [{ type: 'symmetryY' }],    // ✅ 关键
  coordinate: { transform: [{ type: 'transpose' }] },
});
```

### 错误：normalizeY 和 symmetryY 顺序错误
```javascript
// ❌ 可能产生意外效果
chart.options({
  transform: [
    { type: 'symmetryY' },    // ❌ 先对称后归一化
    { type: 'normalizeY' },
  ],
});

// ✅ 正确：先归一化（统一高度比例），再对称
chart.options({
  transform: [
    { type: 'normalizeY' },   // ✅ 先归一化
    { type: 'symmetryY' },    // ✅ 再对称
  ],
});
```

### 错误：多次调用 `chart.options()` 叠加漏斗 + 标注

多次调用 `chart.options()` 不会叠加——**每次调用完整替换前一次**，最终只有最后一次生效。漏斗主体 + 连接线 + 转化率标签必须用 `type: 'view'` + `children` 组合。

```javascript
// ❌ 错误：三次调用只有最后一次（text）生效，漏斗和折线消失
chart.options({ type: 'interval', data, encode: { x: 'stage', y: 'count', shape: 'funnel' }, transform: [{ type: 'symmetryY' }] });
chart.options({ type: 'line',     data, encode: { x: 'stage', y: 'count' } });
chart.options({ type: 'text',     data, encode: { x: 'stage', y: 'count', text: 'rate' } });

// ✅ 正确：用 type: 'view' + children 把所有 mark 组合在一次调用里
const dataWithRate = data.map((d, i) => ({
  ...d,
  rate: i === 0 ? '100%' : `${((d.count / data[i - 1].count) * 100).toFixed(1)}%`,
}));

chart.options({
  type: 'view',
   dataWithRate,
  axis: false,
  legend: false,
  children: [
    // 漏斗主体
    {
      type: 'interval',
      encode: { x: 'stage', y: 'count', color: 'stage', shape: 'funnel' },
      transform: [{ type: 'symmetryY' }],
      coordinate: { transform: [{ type: 'transpose' }] },
      style: { stroke: '#fff', lineWidth: 1 },
      labels: [{
        text: (d) => `${d.stage}\n${d.count.toLocaleString()}`,
        position: 'inside',
        style: { fill: '#fff', fontWeight: 'bold', textAlign: 'center' },
      }],
    },
    // 转化率标注（子 mark 使用独立数据：从第二阶段开始）
    {
      type: 'text',
       dataWithRate.slice(1),
      encode: { x: 'stage', y: 'count', text: 'rate' },
      coordinate: { transform: [{ type: 'transpose' }] },
      style: { textAlign: 'left', dx: 8, fontSize: 12, fill: '#666' },
    },
  ],
});
```
