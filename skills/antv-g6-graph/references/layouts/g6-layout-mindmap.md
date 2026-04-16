---
id: "g6-layout-mindmap"
title: "G6 思维导图布局（Mindmap Layout）"
description: |
  使用思维导图布局（mindmap）展示树形数据，
  根节点居中，子节点向两侧展开。

library: "g6"
version: "5.x"
category: "layouts"
subcategory: "tree"
tags:
  - "布局"
  - "思维导图"
  - "mindmap"
  - "树形"
  - "tree"
  - "分支"

related:
  - "g6-core-data-structure"
  - "g6-layout-dagre"
  - "g6-behavior-collapse-expand"

use_cases:
  - "思维导图"
  - "知识树"
  - "分类目录"
  - "决策树"

anti_patterns:
  - "非树形数据不要用 mindmap 布局（需先用 treeToGraphData 转换）"
  - "深度超过 5 层时节点会过于密集"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/layout/mindmap"
---

## 核心概念

思维导图布局将树形数据以根节点为中心向两侧（或单侧）展开，是知识图谱和分类展示的经典布局。

**使用前提：** 需要树形数据，使用 `treeToGraphData()` 转换后传入。

## 最小可运行示例

```javascript
import { Graph, treeToGraphData } from '@antv/g6';

const treeData = {
  id: 'root',
  data: { label: '中心主题' },
  children: [
    {
      id: 'branch1',
      data: { label: '分支1' },
      children: [
         { id: 'leaf1', data: { label: '子项1.1' } },
         { id: 'leaf2', data: { label: '子项1.2' } },
      ],
    },
    {
      id: 'branch2',
      data: { label: '分支2' },
      children: [
         { id: 'leaf3', data: { label: '子项2.1' } },
         { id: 'leaf4', data: { label: '子项2.2' } },
         { id: 'leaf5', data: { label: '子项2.3' } },
      ],
    },
    {
      id: 'branch3',
      data: { label: '分支3' },
    },
  ],
};

const graph = new Graph({
  container: 'container',
  width: 900,
  height: 600,
  data: treeToGraphData(treeData),
  node: {
    type: 'rect',
    style: {
      size: [120, 36],
      radius: 18,                // 圆角矩形
      fill: (d) => d.id === 'root' ? '#1783FF' : '#f0f5ff',
      stroke: (d) => d.id === 'root' ? '#1783FF' : '#adc6ff',
      lineWidth: 1,
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      labelFill: (d) => d.id === 'root' ? '#fff' : '#333',
    },
  },
  edge: {
    type: 'cubic-horizontal',
    style: {
      stroke: '#adc6ff',
      lineWidth: 1.5,
    },
  },
  layout: {
    type: 'mindmap',
    direction: 'H',             // 'H'=水平展开，'V'=垂直展开
    getWidth: () => 120,        // 节点宽度（用于计算间距）
    getHeight: () => 36,        // 节点高度
    getHGap: () => 40,          // 水平间距
    getVGap: () => 10,          // 垂直间距
  },
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    'collapse-expand',          // 支持折叠/展开
  ],
});

graph.render();
```

## 常用变体

### 向右展开的单侧树

```javascript
layout: {
  type: 'mindmap',
  direction: 'LR',           // 从左到右单侧展开
  getWidth: () => 120,
  getHeight: () => 36,
  getHGap: () => 50,
  getVGap: () => 8,
},
edge: {
  type: 'cubic-horizontal',
},
```

### 垂直展开的树

```javascript
layout: {
  type: 'mindmap',
  direction: 'V',            // 垂直展开
  getWidth: () => 100,
  getHeight: () => 36,
  getHGap: () => 20,
  getVGap: () => 50,
},
edge: {
  type: 'cubic-vertical',
},
```

### 带折叠展开功能

```javascript
const graph = new Graph({
  // ...
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    {
      type: 'collapse-expand',
      trigger: 'click',          // 点击触发折叠/展开
      animation: true,           // 带动画
    },
  ],
});
```

## 参数参考

```typescript
interface MindmapLayoutOptions {
  direction?: 'H' | 'V' | 'LR' | 'RL' | 'TB' | 'BT';
  getWidth?: (node: NodeData) => number;
  getHeight?: (node: NodeData) => number;
  getHGap?: (node: NodeData) => number;
  getVGap?: (node: NodeData) => number;
  getSide?: (node: NodeData) => 'left' | 'right';  // 控制节点在哪侧
  workerEnabled?: boolean;
}
```

## 常见错误

### 错误1：直接使用树形数据而不转换

```javascript
// ❌ 直接传入树形结构
const graph = new Graph({
  data: {
    id: 'root',
    children: [...]
  },
  layout: { type: 'mindmap' },
});

// ✅ 使用 treeToGraphData 转换
import { treeToGraphData } from '@antv/g6';
const graph = new Graph({
  data: treeToGraphData(treeData),
  layout: { type: 'mindmap' },
});
```

### 错误2：getWidth/getHeight 未设置导致节点重叠

```javascript
// ❌ 未告知布局节点大小
layout: { type: 'mindmap' },

// ✅ 提供节点大小给布局算法
layout: {
  type: 'mindmap',
  getWidth: () => 120,   // 与 node.style.size[0] 一致
  getHeight: () => 36,   // 与 node.style.size[1] 一致
  getHGap: () => 40,
  getVGap: () => 10,
},
```
