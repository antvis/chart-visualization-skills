---
id: "g6-edge-polyline"
title: "G6 折线边（Polyline Edge）"
description: |
  使用折线边（polyline）连接节点，自动避开节点障碍，
  适合正交布局和流程图场景。

library: "g6"
version: "5.x"
category: "elements"
subcategory: "edges"
tags:
  - "边"
  - "折线"
  - "polyline"
  - "正交"
  - "orthogonal"
  - "流程图"

related:
  - "g6-edge-line"
  - "g6-edge-cubic"
  - "g6-layout-dagre"

use_cases:
  - "正交布局图"
  - "流程图"
  - "UML 类图"
  - "模块依赖图"

anti_patterns:
  - "折线在节点密集时容易绕路，考虑用 cubic 或 line"
  - "折线计算路径较慢，节点极多时注意性能"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/element/edge/polyline"
---

## 核心概念

折线边（`polyline`）自动计算折点，使边以直角折线形式连接节点，视觉整洁。

**特点：**
- 自动避障：自动计算路径绕开节点
- 正交折线：边只有水平和垂直线段
- 可设置 `radius` 让折角变为圆角

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [
       { id: 'n1', data: { label: '步骤1' } },
       { id: 'n2', data: { label: '步骤2' } },
       { id: 'n3', data: { label: '步骤3' } },
       { id: 'n4', data: { label: '步骤4' } },
    ],
    edges: [
       { source: 'n1', target: 'n2' },
       { source: 'n2', target: 'n3' },
       { source: 'n3', target: 'n4' },
       { source: 'n1', target: 'n4' },
    ],
  },
  node: {
    type: 'rect',
    style: {
      size: [100, 40],
      radius: 4,
      fill: '#f0f5ff',
      stroke: '#adc6ff',
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
    },
  },
  edge: {
    type: 'polyline',
    style: {
      stroke: '#adc6ff',
      lineWidth: 1.5,
      radius: 8,                  // 折角圆角
      endArrow: true,
    },
  },
  layout: {
    type: 'dagre',
    rankdir: 'LR',
    ranksep: 60,
    nodesep: 30,
  },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```

## 常见错误

### 错误1：polyline 在 force 布局中效果差

```javascript
// ❌ polyline 在 force 布局（随机位置）下路径计算不准确
layout: { type: 'force' },
edge: { type: 'polyline' },

// ✅ polyline 适合正交/层次布局
layout: { type: 'dagre', rankdir: 'LR' },
edge: { type: 'polyline' },
```
