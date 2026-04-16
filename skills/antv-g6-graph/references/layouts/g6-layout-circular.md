---
id: "g6-layout-circular"
title: "G6 环形布局（Circular Layout）"
description: |
  使用环形布局（circular）将节点均匀排列在圆形上。
  适合展示循环关系、对比关系、对等网络。

library: "g6"
version: "5.x"
category: "layouts"
subcategory: "circular"
tags:
  - "布局"
  - "环形"
  - "circular"
  - "circle"
  - "环状"

related:
  - "g6-layout-force"
  - "g6-layout-dagre"
  - "g6-node-circle"

use_cases:
  - "循环依赖图"
  - "对等网络拓扑"
  - "环状组织结构"
  - "节点数量较少的关系图"

anti_patterns:
  - "节点数量过多时圆周太长影响可读性"
  - "需要显示层次关系时改用 dagre"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/layout/circular"
---

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const nodes = Array.from({ length: 8 }, (_, i) => ({
  id: `n${i}`,
  data: { label: `节点${i + 1}` },
}));

const edges = nodes.map((n, i) => ({
  source: n.id,
  target: nodes[(i + 1) % nodes.length].id,
}));

const graph = new Graph({
  container: 'container',
  width: 600,
  height: 600,
  data: { nodes, edges },
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
    type: 'circular',
    radius: 200,          // 圆半径（px）
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

## 常用变体

### 顺时针/逆时针排列

```javascript
layout: {
  type: 'circular',
  radius: 200,
  startAngle: 0,          // 起始角度（弧度）
  endAngle: Math.PI * 2,  // 结束角度
  clockwise: true,        // 顺时针（false=逆时针）
},
```

### 按属性排序节点

```javascript
layout: {
  type: 'circular',
  radius: 200,
  // 按节点数据中的某个字段排序
  ordering: 'degree',     // 按度数排序，可选 'topology' | 'degree' | null
},
```

### 使用已有数据（推荐写法）

当数据已经给定时，直接使用原始数据，不要动态随机生成边：

```javascript
import { Graph } from '@antv/g6';

const data = {
  nodes: [
    { id: '0' }, { id: '1' }, { id: '2' }, { id: '3' },
  ],
  edges: [
    { source: '0', target: '1' },
    { source: '0', target: '2' },
    { source: '1', target: '3' },
  ],
};

const graph = new Graph({
  container: 'container',
  autoFit: 'view',
  data,
  node: {
    style: {
      labelText: (d) => d.id,
      labelFill: '#fff',
      labelPlacement: 'center',
    },
  },
  layout: {
    type: 'circular',
  },
  behaviors: ['drag-canvas', 'drag-element'],
});

graph.render();
```

## 参数参考

```typescript
interface CircularLayoutOptions {
  radius?: number;           // 圆半径，默认根据画布大小计算
  startAngle?: number;       // 起始角度（弧度），默认 0
  endAngle?: number;         // 结束角度（弧度），默认 2π
  clockwise?: boolean;       // 顺时针，默认 true
  divisions?: number;        // 将圆分成几段
  ordering?: 'topology' | 'degree' | null;  // 排序方式，默认 null
  angleRatio?: number;       // 节点间角度比例，默认 1
  workerEnabled?: boolean;
}
```

## 边的 ID 规则与重复边问题

⚠️ **重要**：G6 中边的 ID 规则如下：
- 若边数据中**显式指定了 `id`**，则使用该 `id`。
- 若边数据中**未指定 `id`**，G6 会自动以 `"${source}-${target}"` 作为边的 ID。

因此，**同一对 source-target 之间不能存在多条未指定 id 的边**，否则会报错：
```
Edge already exists: 12-20
```

**解决方案**：
1. **去重**：确保边数组中不存在重复的 source-target 组合。
2. **显式指定 id**：为每条边指定唯一 id，例如 `{ id: 'e-0-1', source: '0', target: '1' }`。

## 常见错误与修正

### ❌ 错误：随机生成边导致重复，触发 "Edge already exists"

```javascript
// ❌ 错误写法：随机生成边，可能产生重复的 source-target 对
const edges = [];
for (let i = 0; i < 34; i++) {
  const numEdges = 2 + Math.floor(Math.random() * 2);
  for (let j = 0; j < numEdges; j++) {
    const target = Math.floor(Math.random() * 34);
    if (target !== i) {
      edges.push({ source: `${i}`, target: `${target}` });
      // 若 source-target 重复，G6 自动生成的 ID 也重复，报错！
    }
  }
}
```

```javascript
// ✅ 正确写法1：使用 Set 去重，避免重复边
const edgeSet = new Set();
const edges = [];
for (let i = 0; i < 34; i++) {
  const numEdges = 2 + Math.floor(Math.random() * 2);
  for (let j = 0; j < numEdges; j++) {
    const target = Math.floor(Math.random() * 34);
    const key = `${i}-${target}`;
    if (target !== i && !edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({ source: `${i}`, target: `${target}` });
    }
  }
}
```

```javascript
// ✅ 正确写法2：为每条边显式指定唯一 id（即使有重复 source-target 也不会冲突）
const edges = [];
let edgeIndex = 0;
for (let i = 0; i < 34; i++) {
  const numEdges = 2 + Math.floor(Math.random() * 2);
  for (let j = 0; j < numEdges; j++) {
    const target = Math.floor(Math.random() * 34);
    if (target !== i) {
      edges.push({ id: `e${edgeIndex++}`, source: `${i}`, target: `${target}` });
    }
  }
}
```

```javascript
// ✅ 正确写法3（最推荐）：题目已给定数据时，直接使用原始数据，不要自行随机生成边
// 当 query 中提供了参考数据（nodes/edges），应直接使用，不要替换为随机生成逻辑
const data = {
  nodes: [ { id: '0' }, { id: '1' }, /* ... */ ],
  edges: [ { source: '0', target: '1' }, /* ... */ ],
};
```

### ❌ 错误：`sortBy` 字段不存在

```javascript
// ❌ 错误：circular 布局没有 sortBy 参数
layout: {
  type: 'circular',
  sortBy: 'degree',   // 不存在此参数！
}

// ✅ 正确：使用 ordering 参数
layout: {
  type: 'circular',
  ordering: 'degree', // 'topology' | 'degree' | null
}
```