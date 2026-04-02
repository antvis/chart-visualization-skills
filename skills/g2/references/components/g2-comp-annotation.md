---
id: "g2-comp-annotation"
title: "G2 标注（Annotation）"
description: |
  在 G2 v5 中，标注通过额外的 Mark（text、line、image 等）叠加在图表上实现，
  常见的有文字标注、参考线（reference line）、参考区间（reference area）。
  本文采用 Spec 模式的 view + children 方式组合标注。

library: "g2"
version: "5.x"
category: "components"
tags:
  - "annotation"
  - "标注"
  - "参考线"
  - "reference line"
  - "文字标注"
  - "lineX"
  - "lineY"
  - "spec"

related:
  - "g2-core-view-composition"
  - "g2-comp-axis-config"

use_cases:
  - "在图表中添加平均线、目标线"
  - "标注特殊数据点（最大值、最小值）"
  - "添加参考区间背景色"

difficulty: "intermediate"
completeness: "full"
created: "2024-01-01"
updated: "2025-03-01"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/manual/extra-topics/annotation"
---

## 水平参考线（lineY）

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({ container: 'container', width: 640, height: 480 });

chart.options({
  type: 'view',
  data,
  children: [
    // 主图：折线图
    {
      type: 'line',
      encode: { x: 'month', y: 'value' },
    },
    // 标注：y=60 的水平参考线
    {
      type: 'lineY',
       [{ value: 60 }],
      encode: { y: 'value' },
      style: {
        stroke: '#f5222d',
        strokeDasharray: '4 4',
        lineWidth: 1.5,
      },
      labels: [
        {
          text: '目标值: 60',
          position: 'right',
          style: { fill: '#f5222d', fontSize: 11 },
        },
      ],
    },
  ],
});

chart.render();
```

## 垂直参考线（lineX）

```javascript
// 标记某个特殊时间点
{
  type: 'lineX',
  data: [{ date: new Date('2024-03-01') }],
  encode: { x: 'date' },
  style: { stroke: '#722ed1', strokeDasharray: '4 4', lineWidth: 1.5 },
  labels: [
    { text: '版本发布', position: 'top', style: { fill: '#722ed1' } },
  ],
}
```

## 标注最大值点

```javascript
chart.options({
  type: 'view',
  data,
  children: [
    { type: 'line', encode: { x: 'month', y: 'value' } },
    {
      // 用 point + text 标注最大值
      type: 'point',
       data,
      encode: { x: 'month', y: 'value' },
      transform: [{ type: 'select', channel: 'y', selector: 'max' }],  // 只选最大值点
      style: { fill: '#f5222d', r: 5 },
      labels: [
        {
          text: (d) => `最大值\n${d.value}`,
          position: 'top',
          style: { fill: '#f5222d', fontSize: 11 },
        },
      ],
    },
  ],
});
```

## 参考区间（rangeX / rangeY）

```javascript
// 高亮某个 y 值范围（如正常区间）
{
  type: 'rangeY',
  data: [{ min: 40, max: 80 }],
  encode: { y: 'min', y1: 'max' },
  style: {
    fill: '#52c41a',
    fillOpacity: 0.08,
  },
  labels: [
    {
      text: '正常范围',
      position: 'right',
      style: { fill: '#52c41a', fontSize: 11 },
    },
  ],
}
```

## 文字标注（text mark）

```javascript
// 在指定坐标处添加文字
{
  type: 'text',
  data: [{ x: 'Mar', y: 91, label: '最高点' }],
  encode: { x: 'x', y: 'y', text: 'label' },
  style: {
    textAlign: 'center',
    textBaseline: 'bottom',
    fill: '#1890ff',
    fontSize: 12,
    dy: -6,
  },
}
```

## 常见错误与修正

### 错误：在非 view 容器中直接叠加标注
```javascript
// ❌ 错误：多个 chart.options() 会互相覆盖
chart.options({ type: 'line', ... });
chart.options({ type: 'lineY', ... });  // 覆盖了折线图！

// ✅ 正确：用 type: 'view' + children 数组叠加
chart.options({
  type: 'view',
  data,
  children: [
    { type: 'line', ... },
    { type: 'lineY', ... },
  ],
});
```
