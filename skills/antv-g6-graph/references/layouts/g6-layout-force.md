---
id: "g6-layout-force"
title: "G6 力导向布局（Force Layout）"
description: |
  使用力导向布局（force / d3-force / fruchterman）自动排列节点。
  基于物理模拟，节点间产生斥力，边产生引力，最终达到平衡状态。

library: "g6"
version: "5.x"
category: "layouts"
subcategory: "force"
tags:
  - "布局"
  - "力导向"
  - "force"
  - "d3-force"
  - "fruchterman"
  - "network"
  - "自动布局"

related:
  - "g6-core-graph-init"
  - "g6-behavior-drag-element"
  - "g6-node-circle"

use_cases:
  - "网络关系图"
  - "社交图谱"
  - "知识图谱"
  - "探索性图分析"

anti_patterns:
  - "节点数量超过 1000 时力导向计算较慢，考虑 fruchterman 或 force-atlas2"
  - "需要固定层次顺序时改用 dagre"
  - "树形数据使用 compact-box 或 mindmap"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/layout/force"
---

## 核心概念

力导向布局通过模拟物理力使图自动达到视觉平衡：
- **斥力（repulsion）**：节点间互相排斥，防止重叠
- **引力（edge attraction）**：边将连接的节点拉近
- **向心力（gravity）**：将节点吸引到画布中心

G6 提供三种力导向布局：
| 布局类型 | 特点 |
|----------|------|
| `force` | G6 内置，参数直观，大多数场景够用 |
| `d3-force` | 基于 D3，力类型丰富，高度可定制 |
| `fruchterman` | 性能好，支持 GPU 加速，适合大图 |

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [
       { id: 'n1', data: { label: '节点1' } },
       { id: 'n2', data: { label: '节点2' } },
       { id: 'n3', data: { label: '节点3' } },
       { id: 'n4', data: { label: '节点4' } },
       { id: 'n5', data: { label: '节点5' } },
    ],
    edges: [
       { source: 'n1', target: 'n2' },
       { source: 'n1', target: 'n3' },
       { source: 'n2', target: 'n4' },
       { source: 'n3', target: 'n4' },
       { source: 'n4', target: 'n5' },
    ],
  },
  node: {
    type: 'circle',
    style: {
      size: 36,
      fill: '#1783FF',
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
    },
  },
  edge: {
    type: 'line',
    style: { stroke: '#aaa', endArrow: true },
  },
  layout: {
    type: 'force',
    linkDistance: 100,
    gravity: 10,
  },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```

## 常用变体

### G6 Force 布局（完整参数）

```javascript
layout: {
  type: 'force',
  // 边的理想长度
  linkDistance: 100,
  // 向心力强度（越大节点越聚向中心）
  gravity: 10,
  // 库仑斥力距离缩放（值越小斥力作用范围越大，有助于展开节点）
  coulombDisScale: 0.005,
  // 中心点
  center: [400, 300],     // [x, y]，默认画布中心
  // 最大迭代次数
  maxIteration: 1000,
  // 阻尼系数（0~1，越小收敛越快）
  damping: 0.9,
  // 最小移动距离（小于此值视为收敛）
  minMovement: 0.5,
},
// ⚠️ preventOverlap / nodeSize 是 G6 v4 参数，v5 的 force 布局中被静默忽略
// 若需要防重叠，请改用 d3-force + collide（见下方 D3 Force 示例）
```

### D3 Force 布局

```javascript
layout: {
  type: 'd3-force',
  // 边的连接力（弹簧效果）
  link: {
    distance: 100,         // 理想边长
    strength: 0.8,         // 力强度 0~1
  },
  // 节点间斥力（库仑排斥）
  manyBody: {
    strength: -200,        // 负值为斥力，正值为引力
    distanceMax: 400,
  },
  // 向中心收拢
  center: {
    x: 0,
    y: 0,
    strength: 0.1,
  },
  // 碰撞检测（防重叠）
  collide: {
    radius: 30,
    strength: 0.5,
  },
  // 控制迭代
  alpha: 0.5,
  alphaDecay: 0.028,
  alphaMin: 0.001,
},
```

### Fruchterman 布局（大图推荐）

```javascript
layout: {
  type: 'fruchterman',
  gravity: 1,
  speed: 5,
  clustering: true,              // 开启聚类
  clusterGravity: 10,
  // GPU 加速（需引入 WebGL renderer）
  // workerEnabled: true,        // 在 Web Worker 中运行
},
```

### 拖拽力导向图中的节点

```javascript
// 力导向图中拖拽节点需要使用 drag-element-force
// 这样拖动时其他节点也会实时响应
behaviors: [
  'drag-canvas',
  'zoom-canvas',
  'drag-element-force',  // 替代普通的 drag-element
],
```

### 固定某些节点位置

```javascript
// 通过在节点 style 中设置坐标来固定位置
const nodes = [
   { id: 'center', data: { label: '中心' }, style: { x: 400, y: 300 } },
   { id: 'n1', data: { label: '节点1' } },
   { id: 'n2', data: { label: '节点2' } },
];

// 或在布局配置中指定固定节点
layout: {
  type: 'force',
  // 回调函数：返回 true 的节点将被固定
  nodeFixable: (d) => d.id === 'center',
},
```

## Web Worker 加速（大图）

```javascript
layout: {
  type: 'fruchterman',    // fruchterman 支持 GPU 加速，大图推荐
  gravity: 1,
  speed: 5,
},
// ⚠️ G6 v5 force 布局的 workerEnabled 已移除，大图请改用 fruchterman 或 force-atlas2
```

## 常见错误

### 错误1：力导向图中普通拖拽不响应物理模拟

```javascript
// ❌ drag-element 拖拽不会影响其他节点物理状态
behaviors: ['drag-element'],

// ✅ 使用 drag-element-force 保持物理模拟
behaviors: ['drag-element-force'],
```

### 错误2：force 布局节点重叠 —— 用 v4 的 preventOverlap 无效

```javascript
// ❌ preventOverlap / nodeSize 是 G6 v4 参数，G6 v5 force 布局中被静默忽略，节点依然重叠
layout: {
  type: 'force',
  preventOverlap: true,   // 无效
  nodeSize: 40,           // 无效
},


// ✅ 改用 d3-force + collide 碰撞检测（推荐）
layout: {
  type: 'd3-force',
  link: { distance: 100, strength: 0.8 },
  manyBody: { strength: -200 },
  collide: {
    radius: 25,     // 节点半径（nodeSize / 2）
    strength: 0.7,
  },
},
```

### 错误3：布局未收敛就读取坐标

```javascript
// ❌ render() 后立即读取坐标，布局可能未完成
graph.render();
const pos = graph.getElementPosition('n1');  // 可能不准确

// ✅ 等待布局完成
await graph.render();
const pos = graph.getElementPosition('n1');  // 布局完成后读取
```
