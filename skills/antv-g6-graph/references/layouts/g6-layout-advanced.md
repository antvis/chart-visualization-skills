---
id: "g6-layout-advanced"
title: "G6 高级布局（concentric / radial / mds / fruchterman）"
description: |
  concentric（同心圆）、radial（辐射）、mds（降维保距）、
  fruchterman（快速力导向）四种布局的配置与使用场景。

library: "g6"
version: "5.x"
category: "layouts"
subcategory: "advanced"
tags:
  - "布局"
  - "同心圆"
  - "辐射"
  - "concentric"
  - "radial"
  - "mds"
  - "fruchterman"

related:
  - "g6-layout-force"
  - "g6-layout-circular"
  - "g6-layout-dagre"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 同心圆布局（concentric）

按节点属性值大小分层，值大的节点排在内圈。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 640,
  data: {
    nodes: Array.from({ length: 20 }, (_, i) => ({
      id: `n${i}`,
           { label: `N${i}`, degree: Math.floor(Math.random() * 10) },
    })),
    edges: Array.from({ length: 25 }, (_, i) => ({
      source: `n${i % 10}`,
      target: `n${(i * 3 + 5) % 20}`,
    })),
  },
  node: {
    type: 'circle',
    style: {
      size: 30,
      fill: '#1783FF',
      stroke: '#fff',
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
    },
  },
  layout: {
    type: 'concentric',
    // 用于排序的字段（值大的在内圈）
    sortBy: 'degree',            // 字段名或 'degree'（自动计算度数）
    // 最小同心圆间距（px）
    minNodeSpacing: 20,
    // 层间距离
    levelDistance: 60,
    // 防止节点重叠
    preventOverlap: true,
    nodeSize: 30,
    // 最外圈半径
    maxLevelDiff: 0.5,
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

---

## 辐射布局（radial）

以指定节点为中心，按图距离向外辐射排列，层次清晰。

```javascript
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 800,
  data: {
    nodes: Array.from({ length: 20 }, (_, i) => ({ id: `n${i}`, data: {} })),
    edges: [
       { source: 'n0', target: 'n1' },
       { source: 'n0', target: 'n2' },
       { source: 'n0', target: 'n3' },
       { source: 'n1', target: 'n4' },
       { source: 'n1', target: 'n5' },
      // ...
    ],
  },
  node: {
    type: 'circle',
    style: {
      size: 30,
      fill: '#1783FF',
      stroke: '#fff',
      labelText: (d) => d.id,
      labelPlacement: 'bottom',
    },
  },
  layout: {
    type: 'radial',
    // 中心节点 id（默认为第一个节点）
    focusNode: 'n0',
    // 每层的间距
    unitRadius: 80,
    // 防重叠
    preventOverlap: true,
    nodeSize: 30,
    // 严格半径（每层节点尽量排在同一半径上）
    strictRadii: true,
    // 子节点之间的间距
    nodeSpacing: 5,
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

---

## 降维布局（mds）

保持节点之间的图距离（最短路径距离）排列，适合展示相似/距离关系。

```javascript
const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
    { nodes: [...], edges: [...] },
  layout: {
    type: 'mds',
    // 边权重字段（从 edge.data 中读取，影响节点距离计算）
    linkDistance: 100,
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});
```

---

## 快速力导向（fruchterman）

比 d3-force 更快，适合中等规模图（数百节点），支持 GPU 加速。

```javascript
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
    { nodes: [...], edges: [...] },
  layout: {
    type: 'fruchterman',
    // 迭代次数（越多越稳定，越慢）
    iterations: 1000,
    // 重力系数（防止节点飞出）
    gravity: 10,
    // 速度（影响收敛速度）
    speed: 5,
    // 是否启用聚类
    clustering: false,
    // 节点间排斥力
    k: undefined,           // 默认自动计算
    // 使用 WebWorker（异步运行，不阻塞主线程）
    workerEnabled: true,
  },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```

### fruchterman 与 force 对比

| 特性 | force（d3-force） | fruchterman |
|------|-----------------|-------------|
| 算法 | D3 力导向 | Fruchterman-Reingold |
| 性能 | 中等 | 较快 |
| GPU 加速 | 不支持 | 支持 |
| 可配置力类型 | 是（link/many/center...） | 否 |
| 大规模图 | 需要优化 | 较好 |

---

## 布局选型指南

```
需要层次关系？
  → 有向无环图（DAG）：dagre / antv-dagre
  → 树形结构：compact-box / mindmap / dendrogram / indented

需要圆形/对称排列？
  → 节点数不多：circular
  → 按属性分层：concentric
  → 以某点为中心：radial

需要物理弹簧效果？
  → 小图（< 200 节点）：force / d3-force
  → 中图（< 500 节点）：fruchterman
  → 大图（> 500 节点）：force-atlas2

需要保持原始位置关系？
  → 使用节点 x/y 坐标 + layout: { type: 'preset' }（或不设置布局）

其他特殊需求？
  → 网格对齐：grid
  → 保持图距离：mds
```
