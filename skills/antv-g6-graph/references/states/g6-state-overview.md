---
id: "g6-state-overview"
title: "G6 元素状态系统"
description: |
  G6 5.x 的元素状态（States）系统，包含内置状态、自定义状态、
  状态样式配置和状态 API 的完整指南。

library: "g6"
version: "5.x"
category: "states"
subcategory: "overview"
tags:
  - "状态"
  - "state"
  - "selected"
  - "active"
  - "highlight"
  - "inactive"
  - "disabled"

related:
  - "g6-behavior-click-select"
  - "g6-behavior-hover-activate"
  - "g6-core-graph-init"

use_cases:
  - "高亮选中节点"
  - "悬停效果"
  - "禁用/激活节点"
  - "多状态叠加"

anti_patterns:
  - "状态样式中不要使用回调函数（状态样式只支持静态值）"
  - "不要在状态中定义动态数据映射，那是全局样式的工作"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/element/state"
---

## 核心概念

G6 v5 元素状态的特点：
- **多状态共存**：一个元素可以同时拥有多个状态
- **样式叠加**：多个状态的样式会叠加（后设置的优先级更高）
- **完全自定义**：除内置状态外可以定义任意自定义状态

**内置状态名：** `selected`、`active`、`highlight`、`inactive`、`disabled`

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: [
       { id: 'n1', data: { label: 'A' }, states: ['selected'] },  // 初始选中
       { id: 'n2', data: { label: 'B' } },
       { id: 'n3', data: { label: 'C' }, states: ['disabled'] }, // 初始禁用
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
    // 状态样式
    state: {
      selected: {
        fill: '#ff4d4f',
        stroke: '#cf1322',
        lineWidth: 3,
        halo: true,
        haloFill: '#ff4d4f',
        haloOpacity: 0.2,
      },
      active: {
        fill: '#40a9ff',
        stroke: '#1677ff',
      },
      highlight: {
        fill: '#ffa940',
      },
      inactive: {
        opacity: 0.3,
        fill: '#d9d9d9',
      },
      disabled: {
        fill: '#f0f0f0',
        stroke: '#d9d9d9',
        labelFill: '#bfbfbf',
        cursor: 'not-allowed',
      },
    },
  },
  edge: {
    state: {
      selected: { stroke: '#ff4d4f', lineWidth: 3 },
      active: { stroke: '#40a9ff', lineWidth: 2 },
      inactive: { opacity: 0.2 },
    },
  },
  layout: { type: 'force', preventOverlap: true },
  behaviors: ['drag-canvas', 'zoom-canvas', 'click-select'],
});

graph.render();
```

## 状态 API

```javascript
// 设置单个状态
graph.setElementState('node1', 'selected');

// 设置多个状态（叠加）
graph.setElementState('node1', ['selected', 'highlight']);

// 清除所有状态
graph.setElementState('node1', []);

// 清除特定状态（保留其他）
const currentStates = graph.getElementState('node1');
const newStates = currentStates.filter(s => s !== 'selected');
graph.setElementState('node1', newStates);

// 批量设置状态
graph.setElementState({
  node1: 'selected',
  node2: ['highlight'],
  node3: [],
});

// 查询元素状态
const states = graph.getElementState('node1');
// 返回: ['selected', 'highlight']

// 按状态查找元素
const selectedNodes = graph.getElementDataByState('node', 'selected');
const activeEdges = graph.getElementDataByState('edge', 'active');
```

## 自定义状态

```javascript
// 可以使用任意自定义状态名
node: {
  state: {
    // 内置状态
    selected: { fill: '#ff4d4f' },
    // 自定义状态
    warning: {
      fill: '#faad14',
      stroke: '#d48806',
      lineWidth: 2,
    },
    error: {
      fill: '#ff4d4f',
      stroke: '#cf1322',
    },
    success: {
      fill: '#52c41a',
      stroke: '#389e0d',
    },
    loading: {
      opacity: 0.6,
      // 可配合 animation 实现动态效果
    },
  },
},

// 设置自定义状态
graph.setElementState('node1', 'warning');
graph.setElementState('node1', 'error');
```

## 状态样式优先级

```
数据中的 style > 状态样式（后设置的 > 先设置的）> 全局 node/edge style > 主题样式
```

```javascript
// 示例：节点有 selected 和 highlight 两个状态
// selected 样式 + highlight 样式 叠加，highlight 后设置的属性优先
graph.setElementState('n1', ['selected', 'highlight']);
```

## 在渲染完成后操作状态

如果需要在图表渲染完成后执行状态相关操作，可以使用 `await graph.render()` 或监听生命周期事件：

```javascript
import { Graph, GraphEvent } from '@antv/g6';

const graph = new Graph({ /* ... */ });

// 方式1：使用 await
await graph.render();
graph.setElementState('node1', 'selected');

// 方式2：使用 GraphEvent（需要从 @antv/g6 导入）
graph.on(GraphEvent.AFTER_RENDER, () => {
  graph.setElementState('node1', 'selected');
});

// 方式3：使用字符串事件名（无需导入）
graph.on('afterrender', () => {
  graph.setElementState('node1', 'selected');
});
```

## 常见错误与修正

### 错误1：状态样式中使用回调函数

```javascript
// ❌ 错误：状态样式不支持回调函数
node: {
  state: {
    selected: {
      fill: (d) => d.data.color,  // 不生效！
    },
  },
},

// ✅ 状态样式只用静态值
node: {
  state: {
    selected: {
      fill: '#ff4d4f',  // 静态颜色值
    },
  },
},
```

### 错误2：设置状态后忘记定义对应样式

```javascript
// ❌ 设置了状态但没有样式，节点不会有视觉变化
behaviors: ['click-select'],
// node.state 没有配置

// ✅ 设置状态时同时配置状态样式
behaviors: ['click-select'],
node: {
  state: {
    selected: { fill: '#ff4d4f', lineWidth: 3 },
  },
},
```

### 错误3：使用 GraphEvent 但未导入

```javascript
// ❌ 错误：GraphEvent 未定义
import { Graph } from '@antv/g6';

graph.on(GraphEvent.AFTER_RENDER, () => {  // GraphEvent is not defined
  // ...
});

// ✅ 正确：从 @antv/g6 导入 GraphEvent
import { Graph, GraphEvent } from '@antv/g6';

graph.on(GraphEvent.AFTER_RENDER, () => {
  // ...
});

// ✅ 或者使用字符串事件名（无需导入）
import { Graph } from '@antv/g6';

graph.on('afterrender', () => {
  // ...
});
```