---
id: "x6-core-edge-anchor"
title: "X6 边锚点（Edge Anchor）"
description: |
  边锚点决定边连接到另一条边时的锚定位置。当边的 source 或 target 是另一条边时，edge anchor 用于确定连接点在目标边上的位置。
library: x6
version: 3.x
category: "core"
tags:
  - edge-anchor
  - anchor
  - edge
  - connection
---

# 边锚点（Edge Anchor）

## 概述

当一条边的 `source` 或 `target` 连接到另一条边（而非节点）时，需要使用 Edge Anchor 来确定连接点在目标边路径上的位置。

## 内置 Edge Anchor 类型

| 类型 | 说明 | 参数 |
|------|------|------|
| `ratio` | 按比例定位（默认 0.5 即中点） | `{ ratio: 0~1 }` |
| `length` | 按绝对长度定位（从起点开始的像素距离） | `{ length: number }` |
| `closest` | 距参考点最近的路径点 | 无 |
| `orth` | 正交方向上距参考点最近的交点 | `{ fallbackAt?: number \| string }` |

## 使用方式

边锚点通过 `source.anchor` 或 `target.anchor` 配置：

```javascript
graph.addEdge({
  source: { cell: edge1.id, anchor: { name: 'ratio', args: { ratio: 0.3 } } },
  target: { cell: edge2.id, anchor: { name: 'closest' } },
});
```

## 各类型详解

### ratio — 按比例定位

在目标边路径上按比例取点，`ratio` 为 0~1 之间的小数（默认 0.5 即中点）。如果 ratio > 1，会自动除以 100 作为百分比处理。

```javascript
graph.addEdge({
  source: { cell: anotherEdge.id, anchor: { name: 'ratio', args: { ratio: 0.25 } } },
  target: targetNode,
});
```

### length — 按绝对长度定位

从目标边起点沿路径前进指定像素距离的点（默认 20px）。

```javascript
graph.addEdge({
  source: { cell: anotherEdge.id, anchor: { name: 'length', args: { length: 50 } } },
  target: targetNode,
});
```

### closest — 最近点

取目标边路径上距离参考点最近的点。

```javascript
graph.addEdge({
  source: { cell: anotherEdge.id, anchor: { name: 'closest' } },
  target: targetNode,
});
```

### orth — 正交锚点

从参考点出发，沿水平或垂直方向与目标边路径的交点。如果找不到正交交点，回退到 `fallbackAt` 指定的位置（比例或长度），若未设置 `fallbackAt` 则回退到 `closest`。

```javascript
graph.addEdge({
  source: { cell: anotherEdge.id, anchor: { name: 'orth', args: { fallbackAt: 0.5 } } },
  target: targetNode,
});
```

## 与 Node Anchor 的区别

| 特性 | Node Anchor | Edge Anchor |
|------|-------------|-------------|
| 适用场景 | 边连接到节点 | 边连接到另一条边 |
| 配置位置 | `source/target.anchor` | 同左（自动根据目标类型选用） |
| 内置类型 | center、top、bottom、left、right 等 | ratio、length、closest、orth |

## 自定义 Edge Anchor

通过 `Graph.registerEdgeAnchor` 注册自定义边锚点：

```javascript
import { Graph } from '@antv/x6';

Graph.registerEdgeAnchor('myAnchor', (view, magnet, ref, options, type) => {
  // view: EdgeView 实例
  // ref: 参考点
  // 返回 Point 对象
  const ratio = options.ratio || 0.5;
  return view.getPointAtRatio(ratio);
});

// 使用
graph.addEdge({
  source: { cell: edge1.id, anchor: { name: 'myAnchor', args: { ratio: 0.7 } } },
  target: targetNode,
});
```

## 常见错误

```javascript
// ❌ 错误：edge anchor 只在边连边时生效，节点连接请用 node anchor
graph.addEdge({
  source: { cell: node.id, anchor: { name: 'ratio' } }, // ratio 是 edge anchor，不适用于节点
  target: targetNode,
});

// ✅ 正确：节点连接使用 node anchor
graph.addEdge({
  source: { cell: node.id, anchor: { name: 'center' } },
  target: targetNode,
});
```
