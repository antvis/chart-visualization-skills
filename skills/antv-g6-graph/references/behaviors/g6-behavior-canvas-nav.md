---
id: "g6-behavior-canvas-nav"
title: "G6 画布导航交互（拖拽/缩放/滚动）"
description: |
  使用 drag-canvas、zoom-canvas、scroll-canvas 实现画布的拖拽、缩放和滚动导航。
  是几乎所有图可视化的基础交互配置。

library: "g6"
version: "5.x"
category: "behaviors"
subcategory: "navigation"
tags:
  - "交互"
  - "画布"
  - "拖拽"
  - "缩放"
  - "drag-canvas"
  - "zoom-canvas"
  - "scroll-canvas"
  - "behavior"

related:
  - "g6-behavior-click-select"
  - "g6-behavior-drag-element"
  - "g6-plugin-minimap"

use_cases:
  - "大图导航"
  - "基础图交互"
  - "所有图可视化场景"

anti_patterns:
  - "移动端场景需要特别处理触摸事件"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/behavior/drag-canvas"
---

## 核心概念

三种画布导航行为：
- `drag-canvas`：鼠标拖拽移动画布
- `zoom-canvas`：滚轮缩放画布
- `scroll-canvas`：滚轮滚动画布（替代 zoom，适合有滚动条的页面）

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [
      { id: 'node1' },
      { id: 'node2' },
      { id: 'node3' },
      { id: 'node4' },
      { id: 'node5' },
    ],
    edges: [
      { id: 'edge1', source: 'node1', target: 'node2' },
      { id: 'edge2', source: 'node1', target: 'node3' },
      { id: 'edge3', source: 'node2', target: 'node4' },
      { id: 'edge4', source: 'node3', target: 'node5' },
    ],
  },
  layout: { type: 'grid' },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```

## 常用配置

### 完整参数配置

```javascript
behaviors: [
  {
    type: 'drag-canvas',
    // 允许拖拽的方向
    direction: 'both',          // 'both' | 'x' | 'y'
    // 拖拽边界限制
    range: Infinity,            // 超出边界的距离限制
    // 按键触发
    trigger: {
      up: ['ArrowUp'],
      down: ['ArrowDown'],
      left: ['ArrowLeft'],
      right: ['ArrowRight'],
    },
  },
  {
    type: 'zoom-canvas',
    // 缩放范围
    range: [0.1, 10],           // [最小缩放, 最大缩放]
    // 动画
    animation: { duration: 200 },
  },
],
```

### 防止拖拽画布时误触节点

```javascript
behaviors: [
  {
    type: 'drag-canvas',
    // 只在画布背景上拖拽（避免与节点拖拽冲突）
    enable: (event) => event.targetType === 'canvas',
  },
  'drag-element',
],
```

### 键盘方向键移动画布

```javascript
behaviors: [
  {
    type: 'drag-canvas',
    trigger: {
      up: ['ArrowUp'],
      down: ['ArrowDown'],
      left: ['ArrowLeft'],
      right: ['ArrowRight'],
    },
  },
  'zoom-canvas',
],
```

### 适配有页面滚动条的场景

```javascript
// 页面有滚动条时，滚轮默认滚动页面而不是缩放图
// 使用 scroll-canvas 替代 zoom-canvas
behaviors: [
  'drag-canvas',
  'scroll-canvas',    // 滚轮滚动画布（上下左右）
  // 按住 Ctrl 时缩放
  {
    type: 'zoom-canvas',
    key: 'ctrl',      // 按住 Ctrl + 滚轮 才缩放
  },
  'drag-element',
],
```

## 程序控制视口

```javascript
// 缩放到指定比例
graph.zoomTo(1.5);
graph.zoomTo(1.5, true);   // 带动画

// 恢复默认缩放
graph.zoomTo(1);

// 平移画布
graph.translateBy(100, 50);    // 相对移动
graph.translateTo([400, 300]); // 移动到绝对位置

// 自适应视图
graph.fitView();               // 缩放到全图可见
graph.fitCenter();             // 居中但不缩放

// 聚焦某个节点
graph.focusElement('node1');
```

## 常见错误与修正

### 错误1：边数据缺少唯一 id 导致重复边冲突

**错误现象**：`Edge already exists: 12-20`

**原因分析**：G6 5.x 中，如果边数据没有显式指定 `id`，系统会自动以 `${source}-${target}` 作为边的 ID。当通过随机数生成边时，可能产生相同 source-target 组合的重复边，导致 ID 冲突报错。

```javascript
// ❌ 错误示例：随机生成边，可能产生重复的 source-target 组合
const edges = [];
for (let i = 0; i < 34; i++) {
  const target = Math.floor(Math.random() * 34);
  if (target !== i) {
    edges.push({ source: `${i}`, target: `${target}` });
    // 如果同一 source-target 被添加两次，ID "i-target" 重复，报错
  }
}
```

**修正方案1**：为每条边显式指定唯一 `id`

```javascript
// ✅ 正确示例：为每条边指定唯一 id
const edges = [];
let edgeIndex = 0;
for (let i = 0; i < 34; i++) {
  const target = Math.floor(Math.random() * 34);
  if (target !== i) {
    edges.push({
      id: `edge-${edgeIndex++}`,  // 显式指定唯一 id
      source: `${i}`,
      target: `${target}`,
    });
  }
}
```

**修正方案2**：生成边时去重，避免相同 source-target 重复出现

```javascript
// ✅ 正确示例：用 Set 去重，避免重复边
const edgeSet = new Set();
const edges = [];
for (let i = 0; i < 34; i++) {
  const target = Math.floor(Math.random() * 34);
  const key = `${i}-${target}`;
  if (target !== i && !edgeSet.has(key)) {
    edgeSet.add(key);
    edges.push({ source: `${i}`, target: `${target}` });
  }
}
```

**修正方案3（推荐）**：直接使用明确的静态数据，不依赖随机生成

```javascript
// ✅ 推荐：使用确定性数据，避免随机带来的不确定性
const data = {
  nodes: Array.from({ length: 34 }, (_, i) => ({ id: `${i}` })),
  edges: [
    { source: '0', target: '1' },
    { source: '0', target: '2' },
    { source: '1', target: '3' },
    // ... 明确指定的边列表，无重复
  ],
};
```

### 错误2：最小示例代码语法错误

**错误现象**：代码中 `data` 字段缺失或语法不完整导致空白渲染。

**原因**：`Graph` 构造函数中 `data` 字段是必须的，且必须包含 `nodes` 和 `edges` 数组。

```javascript
// ❌ 错误示例：缺少 data 字段
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  { nodes: [...], edges: [...] },  // 语法错误，缺少 data: 键名
  behaviors: ['drag-canvas'],
});

// ✅ 正确示例
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [{ id: 'node1' }, { id: 'node2' }],
    edges: [{ source: 'node1', target: 'node2' }],
  },
  behaviors: ['drag-canvas'],
});
```

### 错误3：treeToGraphData 未定义

**错误现象**：`treeToGraphData is not defined`

**原因**：`treeToGraphData` 是 G6 提供的工具函数，用于将树形结构数据转换为图数据，需要从 `@antv/g6` 中显式导入，不能直接使用。

```javascript
// ❌ 错误示例：未导入直接使用
const data = treeToGraphData(treeData);

// ✅ 正确示例：先导入再使用
import { Graph, treeToGraphData } from '@antv/g6';

const data = treeToGraphData(treeData);
const graph = new Graph({
  container: 'container',
  data,
  behaviors: ['drag-canvas', 'zoom-canvas'],
});
graph.render();
```

### 错误4：画布渲染空白

**常见原因及修正**：

1. **容器尺寸为 0**：确保容器 DOM 元素有明确的宽高，或在 Graph 配置中指定 `width` 和 `height`。
2. **data 为空**：确保 `data.nodes` 数组不为空。
3. **未调用 render()**：必须显式调用 `graph.render()` 才会渲染。
4. **autoFit 配置**：使用 `autoFit: 'view'` 可自动适配视图，避免图形超出画布范围不可见。

```javascript
// ✅ 完整可运行示例
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  autoFit: 'view',
  data: {
    nodes: [{ id: 'node1' }, { id: 'node2' }, { id: 'node3' }],
    edges: [
      { source: 'node1', target: 'node2' },
      { source: 'node2', target: 'node3' },
    ],
  },
  layout: { type: 'circular' },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```