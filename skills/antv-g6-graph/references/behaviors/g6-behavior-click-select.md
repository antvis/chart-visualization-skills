---
id: "g6-behavior-click-select"
title: "G6 点击选中交互（Click Select）"
description: |
  使用 click-select 行为实现点击节点/边选中，支持多选、邻居高亮、
  状态联动等功能。

library: "g6"
version: "5.x"
category: "behaviors"
subcategory: "selection"
tags:
  - "交互"
  - "点击"
  - "选中"
  - "click-select"
  - "behavior"
  - "选择"

related:
  - "g6-behavior-hover-activate"
  - "g6-behavior-drag-element"
  - "g6-state-overview"

use_cases:
  - "点击节点查看详情"
  - "选中节点高亮关联关系"
  - "多选节点批量操作"

anti_patterns:
  - "不需要选中时不要配置，否则影响点击事件处理"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/behavior/click-select"
---

## 核心概念

`click-select` 让用户通过点击选中节点/边，支持：
- 选中状态标记（默认状态名 `selected`）
- 邻居节点/边联动高亮
- 多选（Shift/Ctrl + 点击）
- 点击空白取消选中

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
    },
    state: {
      selected: {
        fill: '#ff4d4f',
        stroke: '#cf1322',
        lineWidth: 3,
        halo: true,
        haloFill: '#ff4d4f',
        haloOpacity: 0.2,
      },
    },
  },
  layout: { type: 'force', preventOverlap: true },
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    'click-select',              // 字符串简写
  ],
});

graph.render();
```

## 常用变体

### 完整配置（含邻居高亮）

```javascript
behaviors: [
  'drag-canvas',
  'zoom-canvas',
  {
    type: 'click-select',
    // 支持多选（按住 Shift 或 Ctrl 点击）
    multiple: true,
    // 触发方式
    trigger: ['click'],           // 'click' | 'dblclick'
    // 选中状态名
    state: 'selected',
    // 邻居状态名
    neighborState: 'highlight',
    // 未选中元素的状态名
    unselectedState: 'inactive',
    // 展开几跳的邻居（0=只选自身）
    degree: 1,
    // 点击回调
    onClick: (event) => {
      const { targetType, target } = event;
      if (targetType === 'node') {
        console.log('选中节点:', target.id);
      }
    },
  },
],
// 配套状态样式
node: {
  state: {
    selected: { fill: '#ff4d4f', lineWidth: 3 },
    highlight: { fill: '#ffa940', opacity: 1 },
    inactive: { opacity: 0.3 },
  },
},
edge: {
  state: {
    highlight: { stroke: '#ffa940', lineWidth: 2 },
    inactive: { opacity: 0.2 },
  },
},
```

### 点击后展示详情面板

```javascript
// 监听选中事件
graph.on('node:click', (event) => {
  const nodeId = event.target.id;
  const nodeData = graph.getNodeData(nodeId);
  
  // 更新 UI 面板
  document.getElementById('detail-panel').innerHTML = `
    <h3>${nodeData.data.name}</h3>
    <p>${nodeData.data.description}</p>
  `;
});
```

### 通过 API 设置选中状态

```javascript
// 选中特定节点
graph.setElementState('n1', 'selected');

// 多状态叠加
graph.setElementState('n1', ['selected', 'highlight']);

// 清除状态
graph.setElementState('n1', []);

// 获取当前选中节点
const selectedNodes = graph.getElementDataByState('node', 'selected');
```

## 常见错误

### 错误1：配置了 click-select 但状态样式未定义

```javascript
// ❌ 只有行为，没有状态样式，节点点击后无视觉反馈
behaviors: ['click-select'],

// ✅ 同时配置状态样式
behaviors: ['click-select'],
node: {
  state: {
    selected: {
      fill: '#ff4d4f',
      lineWidth: 3,
    },
  },
},
```

### 错误2：point 事件与 click-select 冲突

```javascript
// click-select 内部会消费 click 事件
// 若需要自定义 click 逻辑，使用 onClick 回调
behaviors: [
  {
    type: 'click-select',
    onClick: (event) => {
      // 自定义处理
    },
  },
],
```
