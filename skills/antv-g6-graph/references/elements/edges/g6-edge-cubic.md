---
id: "g6-edge-cubic"
title: "G6 三次贝塞尔曲线边（Cubic Edge）"
description: |
  使用三次贝塞尔曲线边（cubic）连接节点，曲线平滑，适用于任意布局。
  提供 cubic、cubic-horizontal、cubic-vertical 三种变体。

library: "g6"
version: "5.x"
category: "elements"
subcategory: "edges"
tags:
  - "边"
  - "曲线"
  - "cubic"
  - "贝塞尔"
  - "bezier"
  - "edge"

related:
  - "g6-edge-line"
  - "g6-edge-polyline"
  - "g6-layout-dagre"

use_cases:
  - "通用图形（各种布局皆适用）"
  - "层次图的边（cubic-vertical 配合 dagre TB）"
  - "水平流程图（cubic-horizontal 配合 dagre LR）"
  - "平行边场景"

anti_patterns:
  - "树形图用 cubic-vertical 或 cubic-horizontal，不要用 polyline"
  - "边非常密集时曲线会增加视觉复杂度，考虑 edge-bundling 插件"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/element/edge/cubic"
---

## 核心概念

`cubic` 使用三次贝塞尔曲线连接两点，比直线更美观，适用于任意节点位置。

**三种变体：**
- `cubic`：通用曲线，适合所有布局
- `cubic-horizontal`：水平方向的 S 形曲线，配合 LR/RL 方向布局
- `cubic-vertical`：垂直方向的 S 形曲线，配合 TB/BT 方向布局

**控制曲率的关键参数：**
- `curveOffset`：曲线弯曲程度（正负值控制方向）
- `curvePosition`：控制点位置（0~1）
- `controlPoints`：自定义控制点坐标

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: [
       { id: 'n1', data: { label: 'A' } },
       { id: 'n2', data: { label: 'B' } },
       { id: 'n3', data: { label: 'C' } },
    ],
    edges: [
       { source: 'n1', target: 'n2' },
       { source: 'n2', target: 'n3' },
       { source: 'n3', target: 'n1' },  // 回环边
    ],
  },
  node: {
    type: 'circle',
    style: {
      size: 40,
      fill: '#1783FF',
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      labelFill: '#fff',
    },
  },
  edge: {
    type: 'cubic',                 // 通用曲线
    style: {
      stroke: '#aaa',
      lineWidth: 1.5,
      endArrow: true,
    },
  },
  layout: { type: 'circular', radius: 150 },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

## 常用变体

### 垂直层次图（配合 dagre TB）

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [
       { id: 'root', data: { label: '根节点' } },
       { id: 'a', data: { label: '子节点A' } },
       { id: 'b', data: { label: '子节点B' } },
       { id: 'c', data: { label: '子节点C' } },
    ],
    edges: [
       { source: 'root', target: 'a' },
       { source: 'root', target: 'b' },
       { source: 'root', target: 'c' },
    ],
  },
  node: {
    type: 'rect',
    style: {
      size: [100, 36],
      radius: 4,
      fill: '#f0f5ff',
      stroke: '#adc6ff',
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
    },
  },
  edge: {
    type: 'cubic-vertical',       // 垂直 S 形曲线
    style: {
      stroke: '#adc6ff',
      endArrow: true,
    },
  },
  layout: {
    type: 'dagre',
    rankdir: 'TB',
    ranksep: 60,
    nodesep: 20,
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});
```

### 水平流程图（配合 dagre LR）

```javascript
edge: {
  type: 'cubic-horizontal',      // 水平 S 形曲线
  style: {
    stroke: '#91caff',
    lineWidth: 2,
    endArrow: {
      type: 'triangle',
      fill: '#91caff',
      size: 8,
    },
    labelText: (d) => d.data.label,
    labelBackground: true,
    labelBackgroundFill: '#fff',
    labelBackgroundOpacity: 0.9,
  },
},
layout: {
  type: 'dagre',
  rankdir: 'LR',                  // 从左到右
  ranksep: 80,
  nodesep: 30,
},
```

### 辐射布局中的曲线边

```javascript
// 辐射布局中 cubic 效果最好
edge: {
  type: 'cubic',
  style: {
    stroke: '#ccc',
    lineWidth: 1,
    endArrow: false,
    curveOffset: 30,              // 控制弯曲幅度
  },
},
layout: {
  type: 'radial',
  unitRadius: 100,
  focusNode: 'center',
},
```

### 渐变色边

```javascript
// 使用线性渐变（需要 @antv/g 的渐变支持）
edge: {
  type: 'cubic',
  style: {
    stroke: 'l(0) 0:#1783FF 1:#FF6B6B',  // 渐变色
    lineWidth: 2,
    endArrow: true,
  },
},
```

## 常见错误

### 错误1：方向不匹配

```javascript
// ❌ dagre LR 布局用 cubic-vertical（垂直曲线）
layout: { type: 'dagre', rankdir: 'LR' },
edge: { type: 'cubic-vertical' },   // 方向不匹配，曲线不美观

// ✅ LR 布局用 cubic-horizontal
layout: { type: 'dagre', rankdir: 'LR' },
edge: { type: 'cubic-horizontal' },

// ✅ TB 布局用 cubic-vertical
layout: { type: 'dagre', rankdir: 'TB' },
edge: { type: 'cubic-vertical' },
```

### 错误2：curveOffset 方向混淆

```javascript
// curveOffset 正值向右/上弯，负值向左/下弯
edge: {
  type: 'cubic',
  style: {
    curveOffset: 50,   // 正值向一侧弯
    // curveOffset: -50,  // 负值向另一侧弯
  },
},
```
