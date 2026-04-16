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
    ],
    edges: [
       { source: 'n1', target: 'n2' },
       { source: 'n2', target: 'n3' },
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
  },
  layout: { type: 'circular' },
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    'drag-element',           // 拖拽节点
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
    // 允许拖拽的元素类型
    enable: (event) => event.targetType === 'node',
    // 拖拽动画
    animation: true,
    // 拖拽时的视觉效果
    dropEffect: 'move',       // 'move' | 'copy' | 'none'
    // 拖拽时隐藏关联边（提升性能）
    hideEdge: 'none',         // 'none' | 'out' | 'in' | 'both'
    // 拖拽时显示影子节点
    shadow: true,
    // 拖拽状态名
    state: 'selected',
    // 自定义拖拽状态
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
    // 只有选中状态的节点才能拖拽（多选后一起移动）
    state: 'selected',
  },
],
```

## 常见错误

### 错误1：力导向图用普通 drag-element

```javascript
// ❌ 力导向图中拖拽后节点不参与物理模拟
layout: { type: 'force' },
behaviors: ['drag-element'],   // 错误！

// ✅ 力导向图使用 drag-element-force
layout: { type: 'force' },
behaviors: ['drag-element-force'],
```
