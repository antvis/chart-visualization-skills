---
id: "g6-edge-cubic-directional"
title: "G6 有向三次贝塞尔曲线边（cubic-horizontal / cubic-vertical）"
description: |
  cubic-horizontal：水平方向三次贝塞尔曲线，控制点沿水平方向分布，适合水平流程图（LR 方向）。
  cubic-vertical：垂直方向三次贝塞尔曲线，控制点沿垂直方向分布，适合垂直层次图（TB 方向）。
  两者是 cubic 边的方向性变体，分别与 dagre/antv-dagre 的 LR 和 TB 方向布局配合使用。

library: "g6"
version: "5.x"
category: "elements"
subcategory: "edges"
tags:
  - "cubic-horizontal"
  - "cubic-vertical"
  - "贝塞尔曲线"
  - "有向边"
  - "流程图边"
  - "层次图边"

related:
  - "g6-edge-cubic"
  - "g6-layout-dagre"
  - "g6-pattern-flow-chart"

difficulty: "beginner"
completeness: "full"
created: "2026-04-16"
updated: "2026-04-16"
---

## 边类型对比

| 类型 | 方向 | 控制点轴 | 最佳配合布局 |
|------|------|---------|-------------|
| `cubic` | 任意 | 两端点间距 | 通用 |
| `cubic-horizontal` | 水平（左→右） | X 轴 | dagre `rankdir: 'LR'` |
| `cubic-vertical` | 垂直（上→下） | Y 轴 | dagre `rankdir: 'TB'` |

---

## 水平三次贝塞尔曲线（cubic-horizontal）

控制点主要沿 X 轴方向分布，忽略 Y 轴变化，产生水平 S 形曲线效果。适合水平方向流程图。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 500,
  data: {
    nodes: [
      { id: 'start', data: { label: '开始' } },
      { id: 'process', data: { label: '处理' } },
      { id: 'decision', data: { label: '判断' } },
      { id: 'end', data: { label: '结束' } },
    ],
    edges: [
      { source: 'start', target: 'process' },
      { source: 'process', target: 'decision' },
      { source: 'decision', target: 'end' },
    ],
  },
  node: {
    type: 'rect',
    style: {
      size: [80, 36],
      fill: '#e6f7ff',
      stroke: '#1783FF',
      radius: 4,
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      // 连接点设置为左右两侧
      ports: [{ placement: 'right' }, { placement: 'left' }],
    },
  },
  edge: {
    type: 'cubic-horizontal',    // 水平三次贝塞尔曲线
    style: {
      stroke: '#1783FF',
      lineWidth: 1.5,
      endArrow: true,
      labelText: (d) => d?.data?.label,
      labelBackground: true,
    },
  },
  layout: {
    type: 'antv-dagre',
    rankdir: 'LR',           // 从左到右，与 cubic-horizontal 配合
    nodesep: 20,
    ranksep: 100,
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

### 样式配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `curvePosition` | `number \| [number, number]` | `[0.5, 0.5]` | 控制点在端点连线上的相对位置（0-1） |
| `curveOffset` | `number \| [number, number]` | `[0, 0]` | 控制点距端点连线的偏移距离（px） |

通用边样式参数（继承自 BaseEdge）：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `stroke` | `string` | — | 边颜色 |
| `lineWidth` | `number` | `1` | 线宽 |
| `endArrow` | `boolean` | `false` | 是否显示终点箭头 |
| `startArrow` | `boolean` | `false` | 是否显示起点箭头 |
| `lineDash` | `number[]` | — | 虚线样式 |
| `labelText` | `string \| Function` | — | 标签文字 |
| `labelBackground` | `boolean` | `false` | 是否显示标签背景 |

---

## 垂直三次贝塞尔曲线（cubic-vertical）

控制点主要沿 Y 轴方向分布，忽略 X 轴变化，产生垂直 S 形曲线效果。适合垂直方向层次图、组织架构图。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 600,
  height: 700,
  data: {
    nodes: [
      { id: 'ceo', data: { label: 'CEO' } },
      { id: 'cto', data: { label: 'CTO' } },
      { id: 'cfo', data: { label: 'CFO' } },
      { id: 'dev1', data: { label: '前端团队' } },
      { id: 'dev2', data: { label: '后端团队' } },
      { id: 'finance', data: { label: '财务部' } },
    ],
    edges: [
      { source: 'ceo', target: 'cto' },
      { source: 'ceo', target: 'cfo' },
      { source: 'cto', target: 'dev1' },
      { source: 'cto', target: 'dev2' },
      { source: 'cfo', target: 'finance' },
    ],
  },
  node: {
    type: 'rect',
    style: {
      size: [100, 36],
      fill: '#f6ffed',
      stroke: '#52c41a',
      radius: 4,
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      // 连接点设置为上下两侧
      ports: [{ placement: 'top' }, { placement: 'bottom' }],
    },
  },
  edge: {
    type: 'cubic-vertical',    // 垂直三次贝塞尔曲线
    style: {
      stroke: '#52c41a',
      lineWidth: 1.5,
      endArrow: true,
    },
  },
  layout: {
    type: 'antv-dagre',
    rankdir: 'TB',          // 从上到下，与 cubic-vertical 配合
    nodesep: 40,
    ranksep: 80,
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

---

## 调整弯曲度

```javascript
edge: {
  type: 'cubic-horizontal',
  style: {
    // curvePosition: 控制点位置（0-1），0.5 为两端点中点
    curvePosition: 0.3,        // 单值：两个控制点相同位置
    // curvePosition: [0.4, 0.6], // 数组：分别控制两个控制点

    // curveOffset: 控制点偏移（px），正值向一侧偏，负值向另一侧
    curveOffset: 30,           // 增大弯曲程度
  },
}
```

---

## 状态样式

```javascript
edge: {
  type: 'cubic-horizontal',
  style: {
    stroke: '#d9d9d9',
    lineWidth: 1,
    endArrow: true,
  },
  state: {
    selected: {
      stroke: '#1783FF',
      lineWidth: 2,
      shadowColor: 'rgba(24,131,255,0.3)',
      shadowBlur: 8,
    },
    active: {
      stroke: '#40a9ff',
      lineWidth: 2,
    },
    inactive: {
      stroke: '#f0f0f0',
      lineWidth: 1,
    },
  },
},
```

---

## 选型指南

```javascript
// 水平流程图（左→右）
// dagre rankdir: 'LR' + edge type: 'cubic-horizontal'
// 节点 ports: [{placement:'right'}, {placement:'left'}]

// 垂直层次图（上→下）
// dagre rankdir: 'TB' + edge type: 'cubic-vertical'
// 节点 ports: [{placement:'top'}, {placement:'bottom'}]

// 通用弧形连接（不依赖方向）
// edge type: 'cubic'（默认）

// 正交折线（流程图风格）
// edge type: 'polyline'
```
