---
id: "g6-edge-quadratic-loop"
title: "G6 二次贝塞尔边（Quadratic）与自环边（Loop）"
description: |
  使用 quadratic 边实现轻量弧形效果；使用 loop 边处理节点自身连接。
  quadratic 比 cubic 控制点少，性能更好。

library: "g6"
version: "5.x"
category: "elements"
subcategory: "edges"
tags:
  - "边"
  - "二次曲线"
  - "自环"
  - "quadratic"
  - "loop"

related:
  - "g6-edge-line"
  - "g6-edge-cubic"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 二次贝塞尔边（quadratic）

`quadratic` 是比 `cubic` 更轻量的弧形边，只有一个控制点。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: [
       { id: 'a', data: { label: 'A' } },
       { id: 'b', data: { label: 'B' } },
       { id: 'c', data: { label: 'C' } },
    ],
    edges: [
       { source: 'a', target: 'b', data: { label: '正向' } },
       { source: 'b', target: 'a', data: { label: '反向' } },  // 反向平行边
       { source: 'a', target: 'c', data: { label: '直达' } },
    ],
  },
  node: {
    type: 'circle',
    style: {
      size: 40,
      fill: '#1783FF',
      stroke: '#fff',
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      labelFill: '#fff',
    },
  },
  edge: {
    type: 'quadratic',
    style: {
      stroke: '#aaa',
      lineWidth: 1.5,
      endArrow: true,
      // curveOffset：控制弧度大小（正值向右弯，负值向左弯）
      curveOffset: 30,
      // curvePosition：控制点在路径上的相对位置（0~1），默认 0.5
      curvePosition: 0.5,
      labelText: (d) => d.data.label,
      labelBackground: true,
    },
  },
  layout: { type: 'circular' },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

### quadratic 特有属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `curveOffset` | `number` | `30` | 控制点偏移距离（px），控制弧度 |
| `curvePosition` | `number` | `0.5` | 控制点在线段上的比例位置（0~1） |
| `controlPoint` | `[number, number]` | — | 直接指定控制点坐标（覆盖 curveOffset/curvePosition） |

---

## 自环边（loop）

当边的 `source` 和 `target` 相同时，G6 自动渲染为自环。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: [
       { id: 'n1', data: { label: '状态A' } },
       { id: 'n2', data: { label: '状态B' } },
    ],
    edges: [
       { source: 'n1', target: 'n2', data: { label: '转换' } },
      // 自环：source === target
       { source: 'n1', target: 'n1', data: { label: '自循环' } },
       { source: 'n2', target: 'n2', data: { label: '保持' } },
    ],
  },
  node: {
    type: 'circle',
    style: {
      size: 50,
      fill: '#1783FF',
      stroke: '#fff',
      lineWidth: 2,
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      labelFill: '#fff',
    },
  },
  edge: {
    type: 'line',                   // 普通边用 line，自环由 G6 自动处理
    style: {
      stroke: '#aaa',
      lineWidth: 1.5,
      endArrow: true,
      labelText: (d) => d.data.label,
      labelBackground: true,
      // 自环样式属性
      loopPlacement: 'top',         // 'top' | 'bottom' | 'left' | 'right' 等
      loopClockwise: true,          // 顺时针
    },
  },
  layout: { type: 'circular', radius: 100 },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

### loop 样式属性（当 source === target 时生效）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `loopPlacement` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'top-left' \| ...` | `'top'` | 自环方向 |
| `loopClockwise` | `boolean` | `true` | 顺时针方向 |
| `loopDist` | `number` | `20` | 自环距离节点的偏移距离 |

---

## 平行边处理

同向的多条边默认重叠，使用 `process-parallel-edges` transform 自动分开：

```javascript
transforms: [
  {
    type: 'process-parallel-edges',
    offset: 15,                     // 平行边间距
  },
],
edge: {
  type: 'quadratic',                // 推荐用 quadratic 展示平行边
},
```
