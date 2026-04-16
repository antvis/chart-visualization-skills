---
id: "g6-behavior-drag-element"
title: "G6 拖拽元素交互（Drag Element）"
description: |
  使用 drag-element 和 drag-element-force 实现节点拖拽。
  普通拖拽用于固定布局，force 版用于力导向图保持物理模拟。

library: "g6"
version: "5.x"
category: "behaviors"
subcategory: "dragging"
tags:
  - "交互"
  - "拖拽"
  - "drag-element"
  - "behavior"
  - "移动节点"

related:
  - "g6-behavior-click-select"
  - "g6-behavior-drag-canvas"
  - "g6-layout-force"

use_cases:
  - "手动调整节点位置"
  - "交互式力导向图"
  - "可编辑图表"

anti_patterns:
  - "力导向布局中不要用普通 drag-element，要用 drag-element-force"
  - "生成边数据时不要使用随机方式，避免产生重复边导致 Edge already exists 错误"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/behavior/drag-element"
---

## 核心概念

- `drag-element`：拖拽节点到指定位置，其他节点不动（适合非力导向布局）
- `drag-element-force`：拖拽时物理模拟继续（适合力导向布局）

## 重要注意事项

### 边数据不能重复

G6 中每条边必须唯一（相同 source + target 的边不能重复添加），否则会抛出 `Edge already exists: {source}-{target}` 错误。

**生成边数据时必须做去重处理**，不能使用随机方式直接 push 边，需要用 Set 或 Map 记录已存在的边。

```javascript
// ❌ 错误：随机生成边，可能产生重复
const edges = [];
for (let i = 0; i < 34; i++) {
  for (let j = 0; j < 3; j++) {
    const target = Math.floor(Math.random() * 34);
    edges.push({ source: `${i}`, target: `${target}` }); // 可能重复！
  }
}

// ✅ 正确：用 Set 去重
const edges = [];
const edgeSet = new Set();
for (let i = 0; i < 34; i++) {
  for (let j = 0; j < 3; j++) {
    const target = Math.floor(Math.random() * 34);
    const key = `${i}-${target}`;
    const reverseKey = `${target}-${i}`;
    if (target !== i && !edgeSet.has(key) && !edgeSet.has(reverseKey)) {
      edgeSet.add(key);
      edges.push({ source: `${i}`, target: `${target}` });
    }
  }
}
```

### 数据应直接使用题目提供的数据

当题目提供了具体的节点和边数据时，应直接使用，不要自行随机生成，避免重复边等问题。

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const data = {
  nodes: [
    { id: '0' },
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
  ],
  edges: [
    { source: '0', target: '1' },
    { source: '0', target: '2' },
    { source: '1', target: '3' },
    { source: '2', target: '4' },
    { source: '3', target: '5' },
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
  layout: { type: 'circular' },
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    'drag-element',
  ],
});

graph.render();
```

## 常用变体

### 力导向图中的拖拽

```javascript
behaviors: [
  'drag-canvas',
  'zoom-canvas',
  'drag-element-force',       // 力导向布局必须用 force 版
],
layout: { type: 'force', preventOverlap: true },
```

### 完整配置

```javascript
behaviors: [
  'drag-canvas',
  'zoom-canvas',
  {
    type: 'drag-element',
    // 是否启用，默认可拖拽节点和 Combo
    enable: (event) => ['node', 'combo'].includes(event.targetType),
    // 拖拽动画
    animation: true,
    // 拖拽结束后的操作效果：'move' | 'link' | 'none'
    dropEffect: 'move',
    // 拖拽时隐藏关联边（提升性能）：'none' | 'out' | 'in' | 'both' | 'all'
    hideEdge: 'none',
    // 拖拽时显示幽灵节点（影子节点）
    shadow: true,
    // 拖拽状态名
    state: 'selected',
    // 自定义鼠标样式
    cursor: {
      default: 'default',
      grab: 'grab',
      grabbing: 'grabbing',
    },
  },
],
```

### 多选后批量拖拽

```javascript
// 配合 click-select 实现多选拖拽
behaviors: [
  'drag-canvas',
  'zoom-canvas',
  {
    type: 'click-select',
    multiple: true,
    state: 'selected',
  },
  {
    type: 'drag-element',
    // 拖拽时会同时移动所有 selected 状态的节点
    state: 'selected',
  },
],
```

## 常见错误与修正

### 错误1：力导向图用普通 drag-element

```javascript
// ❌ 力导向图中拖拽后节点不参与物理模拟
layout: { type: 'force' },
behaviors: ['drag-element'],   // 错误！

// ✅ 力导向图使用 drag-element-force
layout: { type: 'force' },
behaviors: ['drag-element-force'],
```

### 错误2：随机生成边导致重复边报错

**错误现象**：`Edge already exists: 12-20`

**原因**：使用随机方式生成边数据时，可能产生相同 source + target 的重复边，G6 不允许重复边存在。

```javascript
// ❌ 错误：随机生成可能产生重复边
const edges = [];
for (let i = 0; i < 34; i++) {
  const numEdges = 2 + Math.floor(Math.random() * 2);
  for (let j = 0; j < numEdges; j++) {
    const target = Math.floor(Math.random() * 34);
    if (target !== i) {
      edges.push({ source: `${i}`, target: `${target}` }); // 可能重复！
    }
  }
}

// ✅ 正确方案1：直接使用题目提供的固定数据
const data = {
  nodes: [{ id: '0' }, { id: '1' }, /* ... */ { id: '33' }],
  edges: [
    { source: '0', target: '1' },
    { source: '0', target: '2' },
    // ... 使用确定的、不重复的边数据
  ],
};

// ✅ 正确方案2：生成时用 Set 去重
const edges = [];
const edgeSet = new Set();
for (let i = 0; i < 34; i++) {
  for (let j = i + 1; j < 34; j++) {
    // 按顺序生成，天然不重复
    if (Math.random() < 0.1) { // 控制边的密度
      edgeSet.add(`${i}-${j}`);
      edges.push({ source: `${i}`, target: `${j}` });
    }
  }
}
```

### 错误3：节点数据中 label 字段位置错误

G6 5.x 中节点的 label 通过样式配置，不是在 data 字段中：

```javascript
// ❌ 错误：G6 5.x 不支持直接在 data 中配置 label
nodes: [{ id: 'n1', label: 'A' }]

// ✅ 正确：通过 node.style.labelText 配置
node: {
  style: {
    labelText: (d) => d.id,  // 或 d.data?.label
    labelPlacement: 'center',
    labelFill: '#fff',
  },
},
```

### 错误4：treeToGraphData 未导入

如果使用树形数据需要转换为图数据，必须从 `@antv/g6` 中导入 `treeToGraphData`：

```javascript
// ❌ 错误：直接使用未导入的函数
data: treeToGraphData(treeData),  // ReferenceError: treeToGraphData is not defined

// ✅ 正确：先导入再使用
import { Graph, treeToGraphData } from '@antv/g6';

const graph = new Graph({
  data: treeToGraphData(treeData),
  // ...
});
```