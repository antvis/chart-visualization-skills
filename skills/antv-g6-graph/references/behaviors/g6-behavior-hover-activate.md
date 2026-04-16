---
id: "g6-behavior-hover-activate"
title: "G6 悬停激活交互（Hover Activate）"
description: |
  使用 hover-activate 行为实现鼠标悬停时高亮节点和关联边，
  提升图的可读性。

library: "g6"
version: "5.x"
category: "behaviors"
subcategory: "highlight"
tags:
  - "交互"
  - "悬停"
  - "hover"
  - "hover-activate"
  - "高亮"
  - "activate"

related:
  - "g6-behavior-click-select"
  - "g6-state-overview"

use_cases:
  - "边密集时高亮当前节点关联边"
  - "知识图谱探索"
  - "关系图分析"

anti_patterns:
  - "边较少时 hover-activate 意义不大"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/behavior/hover-activate"
---

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
       { id: 'n4', data: { label: 'D' } },
    ],
    edges: [
       { source: 'n1', target: 'n2' },
       { source: 'n1', target: 'n3' },
       { source: 'n2', target: 'n4' },
       { source: 'n3', target: 'n4' },
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
      cursor: 'pointer',
    },
    state: {
      active: {
        fill: '#ff7875',
        halo: true,
        haloFill: '#ff7875',
        haloOpacity: 0.25,
        haloLineWidth: 12,
      },
      inactive: {
        opacity: 0.3,
      },
    },
  },
  edge: {
    type: 'line',
    style: { stroke: '#ccc', endArrow: true },
    state: {
      active: {
        stroke: '#ff7875',
        lineWidth: 3,
      },
      inactive: {
        opacity: 0.2,
      },
    },
  },
  layout: { type: 'force' },
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    {
      type: 'hover-activate',
      degree: 1,              // 高亮几跳邻居（1=直接邻居）
      state: 'active',        // 激活状态名
      inactiveState: 'inactive',  // 其他元素的状态名
    },
  ],
});

graph.render();
```

## 参数参考

```typescript
interface HoverActivateOptions {
  degree?: number;              // 邻居跳数，默认 1
  state?: string;               // 激活元素状态，默认 'active'
  inactiveState?: string;       // 未激活元素状态，默认 'inactive'
  enable?: boolean | ((event) => boolean);
}
```
