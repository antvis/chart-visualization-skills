---
id: x6-imperative-api
title: X6 命令式 API 完整指南
description: |
  X6 3.x 命令式 API 完整指南：画布创建、节点边操作、网格配置、边标签、事件交互、
  插件系统、导出功能、自定义节点注册、拖拽限制、高亮配置等核心用法。
library: x6
version: 3.x
category: basic
tags:
  - x6
  - imperative
  - node
  - edge
  - grid
  - plugin
  - interaction
  - export
  - register-node
  - history
  - snapline
  - selection
  - port
  - highlighting

related:
  - x6-core-graph-init
  - x6-core-node
  - x6-core-edge
  - x6-plugins

use_cases:
  - "使用命令式 API 创建节点和边"
  - "配置画布网格和背景"
  - "添加边的多位置标签"
  - "实现节点点击选中交互"
  - "使用插件实现撤销重做"
  - "导出画布为 PNG/SVG"
  - "注册自定义节点并配置连接桩"
  - "限制节点拖拽方向"
  - "配置连接桩高亮效果"

difficulty: beginner
---

## 概述

当用户要求使用 X6 绘制图表、展示关系或实现画布交互时，**必须输出完整的、可运行的 JavaScript 代码**。核心流程：

1. 从 `@antv/x6` 导入 `Graph` 及所需插件
2. 使用 `new Graph({ container: 'container', ... })` 创建画布实例
3. 使用 `graph.addNode()` / `graph.addEdge()` 构建内容
4. 如需插件，使用 `graph.use(new Plugin(options))` 注册
5. 如需交互，使用 `graph.on()` 绑定事件

## 最小可运行示例

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 400,
  background: { color: '#F2F7FA' },
  grid: { visible: true, size: 10, type: 'dot' },
});

const source = graph.addNode({
  shape: 'rect',
  x: 40,
  y: 100,
  width: 80,
  height: 40,
  label: 'Source',
  attrs: {
    body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
  },
});

const target = graph.addNode({
  shape: 'rect',
  x: 200,
  y: 100,
  width: 80,
  height: 40,
  label: 'Target',
  attrs: {
    body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
  },
});

graph.addEdge({
  source,
  target,
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1 } },
});
```

## 核心 API

### 1. 添加节点与边

`source`/`target` 可传入节点实例、节点 ID 字符串、或 `{ cell: node, port: 'portId' }` 对象。

```javascript
const nodeA = graph.addNode({
  shape: 'rect',
  x: 40,
  y: 100,
  width: 80,
  height: 40,
  label: 'A',
  attrs: {
    body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
  },
});

const nodeB = graph.addNode({
  shape: 'rect',
  x: 200,
  y: 100,
  width: 80,
  height: 40,
  label: 'B',
  attrs: {
    body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
  },
});

graph.addEdge({
  source: nodeA,
  target: nodeB,
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1 } },
});
```

### 2. 画布网格配置

```javascript
const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
  grid: {
    visible: true,
    size: 10,
    type: 'dot', // 'dot' | 'fixedDot' | 'mesh'
    args: { color: '#a0a0a0', thickness: 2 },
  },
});
```

### 3. 边的多标签

通过 `labels` 数组在边的不同位置添加标签，`position` 取值 0~1。

```javascript
graph.addEdge({
  source,
  target,
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1 } },
  labels: [
    {
      position: 0.1,
      attrs: {
        label: { text: 'Begin', fill: '#333' },
        rect: { fill: '#f0f0f0', stroke: '#ddd' },
      },
    },
    {
      position: 0.5,
      attrs: {
        label: { text: 'Middle', fill: '#333' },
        rect: { fill: '#e6f7ff', stroke: '#91d5ff' },
      },
    },
    {
      position: 0.9,
      attrs: {
        label: { text: 'End', fill: '#333' },
        rect: { fill: '#f6ffed', stroke: '#b7eb8f' },
      },
    },
  ],
});
```

### 4. 事件交互与动态样式

使用 `node.attr('path/prop', value)` 动态修改样式。

```javascript
let selectedNode = null;

graph.on('node:click', ({ node }) => {
  if (selectedNode) {
    selectedNode.attr('body/stroke', '#8f8f8f');
    selectedNode.attr('body/strokeWidth', 1);
  }
  node.attr('body/stroke', '#1890ff');
  node.attr('body/strokeWidth', 3);
  selectedNode = node;
});

graph.on('blank:click', () => {
  if (selectedNode) {
    selectedNode.attr('body/stroke', '#8f8f8f');
    selectedNode.attr('body/strokeWidth', 1);
    selectedNode = null;
  }
});
```

### 5. 节点可见性

```javascript
const node = graph.addNode({ shape: 'rect', x: 60, y: 140, width: 100, height: 40, label: 'Hidden' });
node.hide();
node.show();
```

### 6. 插件系统

从 `@antv/x6` 导入插件类，通过 `graph.use()` 注册。注册后便捷方法自动挂载到 graph。

```javascript
import { Graph, History, Snapline, Selection, Export } from '@antv/x6';

const graph = new Graph({ container: 'container' });

// 注册插件
graph.use(new History({ enabled: true }));
graph.use(new Snapline({ enabled: true }));
graph.use(new Selection({ enabled: true, rubberband: true, showNodeSelectionBox: true }));
graph.use(new Export());

// History 事件
graph.on('history:change', () => {
  console.log('Can Undo:', graph.canUndo());
  console.log('Can Redo:', graph.canRedo());
});

// 动态启用/禁用
graph.disableSnapline();
graph.enableSnapline();
graph.disableSelection();
graph.enableSelection();
```

### 7. 导出画布

需先注册 Export 插件，然后调用导出方法。

```javascript
import { Graph, Export } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new Export());

graph.toPNG((dataUri) => {
  console.log('PNG exported:', dataUri.substring(0, 50) + '...');
});
```

### 8. 自定义节点注册与连接桩

```javascript
Graph.registerNode(
  'lineage-node',
  {
    inherit: 'rect',
    width: 140,
    height: 40,
    attrs: {
      body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 4, ry: 4 },
    },
    ports: {
      groups: {
        in: {
          position: 'left',
          attrs: { circle: { magnet: true, stroke: '#8f8f8f', r: 4, fill: '#fff' } },
        },
        out: {
          position: 'right',
          attrs: { circle: { magnet: true, stroke: '#8f8f8f', r: 4, fill: '#fff' } },
        },
      },
    },
  },
  true,
);

const src = graph.addNode({
  shape: 'lineage-node',
  x: 40,
  y: 40,
  label: 'ods_user',
  ports: { items: [{ id: 'out1', group: 'out' }] },
});

const dst = graph.addNode({
  shape: 'lineage-node',
  x: 260,
  y: 80,
  label: 'dwd_order_detail',
  ports: { items: [{ id: 'in1', group: 'in' }, { id: 'out1', group: 'out' }] },
});

graph.addEdge({
  source: { cell: src, port: 'out1' },
  target: { cell: dst, port: 'in1' },
  connector: 'smooth',
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1 } },
});
```

### 9. 拖拽限制

通过 `translating.restrict` 返回 `{ x, y, width, height }` 限制移动区域。`width: 1` 表示仅垂直方向移动。

```javascript
const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
  translating: {
    restrict(cellView) {
      return { x: 100, y: 0, width: 1, height: 400 };
    },
  },
});
```

### 10. 高亮效果与连线交互

通过 `highlighting` + `connecting` 配合实现连接桩高亮。

```javascript
const graph = new Graph({
  container: 'container',
  highlighting: {
    magnetAvailable: {
      name: 'stroke',
      args: { attrs: { fill: '#fff', stroke: '#47C769' } },
    },
    magnetAdsorbed: {
      name: 'stroke',
      args: { attrs: { fill: '#fff', stroke: '#31d0c6' } },
    },
  },
  connecting: {
    allowBlank: false,
    createEdge() {
      return this.createEdge({
        attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1 } },
      });
    },
  },
});
```

## 常见错误与修正

| 错误模式 | 修正方案 |
|---------|---------|
| **未生成任何代码** | 必须输出完整代码：`import` → `new Graph()` → `addNode` → `addEdge` |
| **遗漏 Graph 实例化** | 始终以 `new Graph({ container: 'container' })` 开头 |
| **边连接混淆 ID 与实例** | 推荐直接用节点实例；用字符串 ID 需确保节点设置了相同 `id` |
| **自定义节点未注册** | 使用前先 `Graph.registerNode('name', config, true)` |
| **插件未导入或未启用** | 从 `@antv/x6` 导入，`new Plugin({ enabled: true })` + `graph.use()` |
| **样式修改语法错误** | 使用 `node.attr('body/stroke', '#1890ff')` 而非直接赋值 |
| **使用 `new Node()` / `new Edge()`** | 应使用 `graph.addNode()` / `graph.addEdge()` |
| **调用 `graph.render()`** | 命令式 API 自动渲染，无需手动调用 |
| **`connecting.createEdge` 中用 `new Edge()`** | 应使用 `this.createEdge({ ... })` |
| **`translating.restrict` 返回格式错误** | 必须返回 `{ x, y, width, height }` |
| **使用废弃高亮配置项** | 用 `magnetAvailable` / `magnetAdsorbed`，不要用 `nodeHover` / `magnetHover` |
| **导出前未注册 Export 插件** | 先 `graph.use(new Export())`，再调用 `graph.toPNG()` |
