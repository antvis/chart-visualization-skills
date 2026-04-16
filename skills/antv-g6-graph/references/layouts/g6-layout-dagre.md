---
id: "g6-layout-dagre"
title: "G6 Dagre 层次布局"
description: |
  使用 Dagre 布局自动对 DAG（有向无环图）进行层次排列。
  支持上下/左右方向，适合流程图、组织架构图、依赖关系图。

library: "g6"
version: "5.x"
category: "layouts"
subcategory: "hierarchical"
tags:
  - "布局"
  - "层次"
  - "dagre"
  - "有向图"
  - "DAG"
  - "流程图"
  - "组织架构"

related:
  - "g6-node-rect"
  - "g6-edge-cubic"
  - "g6-edge-polyline"
  - "g6-layout-force"

use_cases:
  - "流程图"
  - "依赖关系图"
  - "工作流图"
  - "构建依赖图"
  - "状态机图"

anti_patterns:
  - "有环图不适合 dagre（会忽略反向边）"
  - "树形数据推荐用 compact-box 或 mindmap"
  - "节点数量超过 500 时 dagre 计算较慢"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/layout/dagre"
---

## 核心概念

Dagre 布局自动将有向无环图（DAG）分层排列：
- **rankdir**：排列方向（TB=从上到下，LR=从左到右）
- **ranksep**：层间距
- **nodesep**：同层节点间距
- **ranker**：排名算法（影响节点在层中的分配）

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [
       { id: 'start', data: { label: '开始' } },
       { id: 'step1', data: { label: '步骤1' } },
       { id: 'step2', data: { label: '步骤2' } },
       { id: 'step3', data: { label: '步骤3' } },
       { id: 'end', data: { label: '结束' } },
    ],
    edges: [
       { source: 'start', target: 'step1' },
       { source: 'start', target: 'step2' },
       { source: 'step1', target: 'step3' },
       { source: 'step2', target: 'step3' },
       { source: 'step3', target: 'end' },
    ],
  },
  node: {
    type: 'rect',
    style: {
      size: [120, 40],
      radius: 4,
      fill: '#f0f5ff',
      stroke: '#adc6ff',
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
    },
  },
  edge: {
    type: 'cubic-vertical',
    style: {
      stroke: '#adc6ff',
      endArrow: true,
    },
  },
  layout: {
    type: 'dagre',
    rankdir: 'TB',         // 从上到下
    ranksep: 60,           // 层间距
    nodesep: 20,           // 节点间距
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

## 常用变体

### 从左到右的流程图

```javascript
layout: {
  type: 'dagre',
  rankdir: 'LR',            // 从左到右
  ranksep: 80,
  nodesep: 30,
  align: 'UL',              // 节点对齐方式
},
edge: {
  type: 'cubic-horizontal', // 配合 LR 方向
  style: {
    stroke: '#91caff',
    endArrow: true,
  },
},
```

### AntV Dagre（更优的节点排名算法）

```javascript
// antv-dagre 是 AntV 团队优化的 Dagre，更适合 Combo 场景
layout: {
  type: 'antv-dagre',
  rankdir: 'TB',
  ranksep: 50,
  nodesep: 20,
  ranker: 'tight-tree',     // 'network-simplex' | 'tight-tree' | 'longest-path'
},
```

### 配合折线边的正交流程图

```javascript
node: {
  type: 'rect',
  style: {
    size: [120, 40],
    radius: 0,               // 直角矩形
    fill: '#fff',
    stroke: '#1783FF',
    lineWidth: 1.5,
    labelText: (d) => d.data.label,
    labelPlacement: 'center',
    // 配置端口
    ports: [
       { key: 'top', placement: 'top' },
       { key: 'bottom', placement: 'bottom' },
    ],
  },
},
edge: {
  type: 'polyline',          // 折线边
  style: {
    stroke: '#1783FF',
    lineWidth: 1.5,
    radius: 6,
    endArrow: true,
  },
},
layout: {
  type: 'dagre',
  rankdir: 'TB',
  ranksep: 60,
  nodesep: 30,
  controlPoints: true,      // 保留控制点
},
```

### 带 Combo 的层次图

```javascript
const graph = new Graph({
  container: 'container',
  width: 900,
  height: 600,
  data: {
    nodes: [
       { id: 'n1', combo: 'group1', data: { label: '模块A' } },
       { id: 'n2', combo: 'group1', data: { label: '模块B' } },
       { id: 'n3', combo: 'group2', data: { label: '模块C' } },
    ],
    edges: [
       { source: 'n1', target: 'n3' },
       { source: 'n2', target: 'n3' },
    ],
    combos: [
       { id: 'group1', data: { label: '子系统1' } },
       { id: 'group2', data: { label: '子系统2' } },
    ],
  },
  combo: {
    type: 'rect',
    style: {
      fill: '#f5f5f5',
      stroke: '#d9d9d9',
      labelText: (d) => d.data.label,
      labelPlacement: 'top',
    },
  },
  layout: {
    type: 'antv-dagre',     // antv-dagre 更好地支持 Combo
    rankdir: 'LR',
    ranksep: 60,
    nodesep: 20,
  },
});
```

## 参数参考

```typescript
interface DagreLayoutOptions {
  rankdir?: 'TB' | 'BT' | 'LR' | 'RL';     // 布局方向，默认 'TB'
  align?: 'UL' | 'UR' | 'DL' | 'DR';        // 节点对齐方式
  nodesep?: number;                           // 同层节点间距，默认 50
  ranksep?: number;                           // 层间距，默认 100
  ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
  nodeSize?: number | [number, number];        // 节点尺寸（用于计算间距）
  controlPoints?: boolean;                    // 是否保留边控制点
  workerEnabled?: boolean;                    // 是否在 Web Worker 中运行
}
```

## 常见错误

### 错误1：有环图用 dagre 导致边丢失

```javascript
// ❌ 有环图（如状态机）用 dagre 会忽略反向边
const edges = [
   { source: 'a', target: 'b' },
   { source: 'b', target: 'c' },
   { source: 'c', target: 'a' },  // 形成环，dagre 会忽略
];

// ✅ 有环图使用 force 布局
layout: { type: 'force', preventOverlap: true },
```

### 错误2：节点大小与布局 nodeSize 不一致

```javascript
// ❌ 节点实际大小与 dagre 的 nodeSize 参数不一致，导致节点重叠
node: {
  type: 'rect',
  style: { size: [200, 60] },   // 实际大小 200x60
},
layout: {
  type: 'dagre',
  nodeSize: 40,   // 参数太小，不匹配
},

// ✅ nodeSize 与节点 size 一致
node: {
  type: 'rect',
  style: { size: [120, 40] },
},
layout: {
  type: 'dagre',
  nodeSize: [120, 40],   // 与节点大小一致
  ranksep: 60,
},
```

### 错误3：边类型与方向不匹配

```javascript
// ❌ TB 方向用了水平曲线边
layout: { type: 'dagre', rankdir: 'TB' },
edge: { type: 'cubic-horizontal' },   // 水平曲线在 TB 方向不美观

// ✅ 匹配方向
layout: { type: 'dagre', rankdir: 'TB' },
edge: { type: 'cubic-vertical' },    // 垂直曲线配合 TB

layout: { type: 'dagre', rankdir: 'LR' },
edge: { type: 'cubic-horizontal' },  // 水平曲线配合 LR
```
