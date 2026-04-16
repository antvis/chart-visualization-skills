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
    type: 'cubic',
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
  sortBy: 'degree',       // 按度数排序
  // sortBy: (a, b) => a.data.order - b.data.order,
},
```

## 参数参考

```typescript
interface CircularLayoutOptions {
  radius?: number;           // 圆半径，默认根据画布大小计算
  startAngle?: number;       // 起始角度（弧度），默认 0
  endAngle?: number;         // 结束角度（弧度），默认 2π
  clockwise?: boolean;       // 顺时针，默认 true
  divisions?: number;        // 将圆分成几段
  ordering?: string;         // 排序方式：'topology' | 'degree' | null
  angleRatio?: number;       // 节点间角度比例，默认 1
  workerEnabled?: boolean;
}
```
