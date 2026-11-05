---
id: "x6-core-model-query"
title: "X6 图模型查询与遍历 API"
description: |
  Graph Model 的图结构查询 API：获取邻居节点、连接边、前驱/后继、根/叶节点、图遍历搜索等。
library: x6
version: 3.x
category: "core"
tags:
  - model
  - query
  - neighbors
  - traverse
  - graph-algorithm
  - getConnectedEdges
  - getNeighbors
  - getSuccessors
  - getPredecessors
---

# 图模型查询与遍历 API

## 概述

X6 的 Graph Model 提供丰富的图结构查询能力，用于获取节点间的拓扑关系（邻居、前驱、后继）、连接边、根/叶节点等。这些 API 通过 `graph.model` 或直接通过 `graph` 代理调用。

## 获取元素

### getCells / getNodes / getEdges

```javascript
// 获取所有元素
const cells = graph.getCells();

// 只获取节点
const nodes = graph.getNodes();

// 只获取边
const edges = graph.getEdges();
```

### getCellById

```javascript
const cell = graph.getCellById('node-1');
```

## 连接边查询

### getConnectedEdges — 获取与节点相连的所有边

```javascript
// 获取所有连接边（入边 + 出边）
const edges = graph.getConnectedEdges(node);

// 只获取出边
const outEdges = graph.getConnectedEdges(node, { outgoing: true });

// 只获取入边
const inEdges = graph.getConnectedEdges(node, { incoming: true });

// 包含间接连接（通过边连接的边）
const allEdges = graph.getConnectedEdges(node, { indirect: true });

// 深度搜索（包含嵌入子节点的连接边）
const deepEdges = graph.getConnectedEdges(node, { deep: true });
```

**options 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `incoming` | boolean | 包含入边 |
| `outgoing` | boolean | 包含出边 |
| `indirect` | boolean | 包含间接连接 |
| `deep` | boolean | 包含嵌入子节点的边 |
| `enclosed` | boolean | deep 模式下是否包含内部边 |

> 注意：`incoming` 和 `outgoing` 都不传时，默认都为 `true`。

### getOutgoingEdges — 获取出边

```javascript
const outEdges = graph.getOutgoingEdges(node);
// 返回 Edge[] | null
```

### getIncomingEdges — 获取入边

```javascript
const inEdges = graph.getIncomingEdges(node);
// 返回 Edge[] | null
```

## 邻居节点查询

### getNeighbors — 获取邻居节点

```javascript
// 获取所有邻居（入方向 + 出方向）
const neighbors = graph.getNeighbors(node);

// 只获取下游邻居
const downstream = graph.getNeighbors(node, { outgoing: true });

// 只获取上游邻居
const upstream = graph.getNeighbors(node, { incoming: true });
```

### isNeighbor — 判断两节点是否为邻居

```javascript
const isNear = graph.isNeighbor(node1, node2);
const isDownstream = graph.isNeighbor(node1, node2, { outgoing: true });
```

## 前驱与后继

### getSuccessors — 获取所有后继节点

从当前节点沿出边方向可达的所有节点（递归遍历）：

```javascript
const successors = graph.getSuccessors(node);

// 限制距离
const near = graph.getSuccessors(node, { distance: 1 });  // 只获取直接后继
const farther = graph.getSuccessors(node, { distance: [2, 3] });  // 距离 2~3 的后继
```

### isSuccessor — 判断是否为后继

```javascript
const isAfter = graph.isSuccessor(node1, node2);  // node2 是否是 node1 的后继
```

### getPredecessors — 获取所有前驱节点

从当前节点沿入边方向可达的所有节点（递归遍历）：

```javascript
const predecessors = graph.getPredecessors(node);
```

### isPredecessor — 判断是否为前驱

```javascript
const isBefore = graph.isPredecessor(node1, node2);  // node2 是否是 node1 的前驱
```

## 根节点与叶节点

### getRoots — 获取根节点（无入边的节点）

```javascript
const roots = graph.getRootNodes();
```

### getLeafs — 获取叶节点（无出边的节点）

```javascript
const leafs = graph.getLeafNodes();
```

### isRoot / isLeaf — 判断是否为根/叶

```javascript
graph.isRootNode(node);  // true if no incoming edges
graph.isLeafNode(node);  // true if no outgoing edges
```

## 图遍历搜索

### searchCell — 图搜索（BFS/DFS）

```javascript
// 从 node 开始广度优先搜索
graph.searchCell(node, (cell, distance) => {
  console.log(`${cell.id} 距离起点: ${distance}`);
}, { breadthFirst: true });

// 深度优先搜索（默认）
graph.searchCell(node, (cell, distance) => {
  if (cell.id === 'target') {
    return false;  // 返回 false 停止搜索
  }
});
```

### getShortestPath — 最短路径

```javascript
const path = graph.getShortestPath(sourceNode, targetNode);
// 返回节点 ID 数组
```

## 完整示例：DAG 拓扑分析

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({ container: 'container', width: 800, height: 600 });

const a = graph.addNode({ shape: 'rect', x: 50, y: 200, width: 80, height: 40, label: 'A' });
const b = graph.addNode({ shape: 'rect', x: 200, y: 100, width: 80, height: 40, label: 'B' });
const c = graph.addNode({ shape: 'rect', x: 200, y: 300, width: 80, height: 40, label: 'C' });
const d = graph.addNode({ shape: 'rect', x: 400, y: 200, width: 80, height: 40, label: 'D' });

graph.addEdge({ source: a, target: b });
graph.addEdge({ source: a, target: c });
graph.addEdge({ source: b, target: d });
graph.addEdge({ source: c, target: d });

// 查询 A 的后继
const successors = graph.getSuccessors(a);
console.log('A 的后继:', successors.map(n => n.id));  // [B, C, D]

// 查询 D 的前驱
const predecessors = graph.getPredecessors(d);
console.log('D 的前驱:', predecessors.map(n => n.id));  // [B, C, A]

// 获取根节点
const roots = graph.getRootNodes();
console.log('根节点:', roots.map(n => n.id));  // [A]

// 获取叶节点
const leafs = graph.getLeafNodes();
console.log('叶节点:', leafs.map(n => n.id));  // [D]

// 获取 B 的邻居
const neighbors = graph.getNeighbors(b);
console.log('B 的邻居:', neighbors.map(n => n.id));  // [A, D]
```

## 常见错误

```javascript
// ❌ 错误：getConnectedEdges 返回可能为空数组，而 getOutgoingEdges 返回 null
const edges = graph.getOutgoingEdges(node);
edges.forEach(e => ...);  // TypeError: null.forEach

// ✅ 正确：先判空
const edges = graph.getOutgoingEdges(node);
if (edges) {
  edges.forEach(e => ...);
}

// 或使用 getConnectedEdges（始终返回数组）
const edges = graph.getConnectedEdges(node, { outgoing: true });
edges.forEach(e => ...);  // 安全，空数组
```
