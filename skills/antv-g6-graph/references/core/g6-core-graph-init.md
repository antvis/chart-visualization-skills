---
id: "g6-core-graph-init"
title: "G6 图实例初始化"
description: |
  使用 new Graph({...}) 创建图实例的完整配置指南。
  包含容器、尺寸、数据、样式、布局、交互的一次性配置方式。

library: "g6"
version: "5.x"
category: "core"
subcategory: "init"
tags:
  - "初始化"
  - "Graph"
  - "容器"
  - "配置"
  - "graph init"
  - "container"
  - "new Graph"

related:
  - "g6-core-data-structure"
  - "g6-node-circle"
  - "g6-layout-force"

use_cases:
  - "创建任意类型的图可视化"
  - "配置图的基本外观和行为"

anti_patterns:
  - "不要使用 v4 的 new G6.Graph() 和 graph.data() 方式"
  - "不要在构造函数外多次修改基础配置"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/graph/graph"
---

## 核心概念

Graph 是 G6 的核心容器，管理所有元素（节点、边、Combo）和操作（交互、渲染）。

**G6 v5 与 v4 的关键区别：**
- 所有配置在 `new Graph({...})` 中一次完成
- 数据在构造函数中通过 `data` 字段传入（不再使用 `graph.data()`）
- 节点标签通过 `style.labelText` 回调配置（不再用 `label` 或 `labelCfg`）
- `behaviors` 直接是数组（不再有 Mode 模式概念）

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',   // 必填：DOM 元素 id 或 HTMLElement
  width: 800,
  height: 600,
  data: {
    nodes: [
      { id: 'node1', data: { label: '节点1' } },
      { id: 'node2', data: { label: '节点2' } },
      { id: 'node3', data: { label: '节点3' } },
    ],
    edges: [
      { id: 'e1', source: 'node1', target: 'node2' },
      { id: 'e2', source: 'node2', target: 'node3' },
    ],
  },
  layout: { type: 'force' },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```

## 完整配置说明

### 容器与尺寸

```javascript
const graph = new Graph({
  container: 'container',         // 字符串 id 或 DOM 元素
  width: 800,                     // 画布宽度（px）
  height: 600,                    // 画布高度（px）
  autoFit: 'view',                // 自动适配：'center' | 'view' | false
  padding: [20, 20, 20, 20],      // 内边距 [top, right, bottom, left]
  devicePixelRatio: 2,            // 设备像素比，高清屏设置
});
```

### 渲染器配置

```javascript
const graph = new Graph({
  container: 'container',
  renderer: () => new CanvasRenderer(),    // 默认 Canvas 渲染器
  // renderer: () => new SVGRenderer(),    // SVG 渲染器（需单独引入）
  // renderer: () => new WebGLRenderer(),  // WebGL 渲染器（需单独引入）
});
```

### 完整示例（包含所有常用配置）

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  // 容器
  container: 'container',
  width: 960,
  height: 600,
  autoFit: 'view',

  // 数据
  data: {
    nodes: [
      { id: 'n1', data: { label: '产品', type: 'product', value: 80 } },
      { id: 'n2', data: { label: '用户', type: 'user', value: 50 } },
      { id: 'n3', data: { label: '订单', type: 'order', value: 30 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', data: { label: '购买' } },
      { id: 'e2', source: 'n2', target: 'n3', data: { label: '生成' } },
    ],
  },

  // 节点配置
  node: {
    type: 'circle',
    style: {
      size: 40,
      fill: '#1783FF',
      stroke: '#fff',
      lineWidth: 2,
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
      labelFill: '#333',
    },
  },

  // 边配置
  edge: {
    type: 'line',
    style: {
      stroke: '#aaa',
      lineWidth: 1.5,
      endArrow: true,
      labelText: (d) => d.data.label,
    },
  },

  // 布局
  layout: {
    type: 'force',
    preventOverlap: true,
    nodeSize: 40,
    linkDistance: 100,
  },

  // 主题
  theme: 'light',

  // 交互行为
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element', 'click-select'],

  // 插件
  plugins: ['grid-line', 'minimap'],

  // 动画
  animation: true,
});

await graph.render();
```

## 边数据的 ID 规则

**⚠️ 重要：边的 ID 自动生成规则**

当边数据中未指定 `id` 时，G6 会自动以 `${source}-${target}` 格式生成边 ID。

**这意味着：如果两条边的 source 和 target 相同（即平行边），它们会生成相同的 ID，导致 `Edge already exists` 错误。**

```javascript
// ❌ 错误：两条边 source/target 相同，自动生成的 id 均为 "A-B"，报错
edges: [
  { source: 'A', target: 'B' },
  { source: 'A', target: 'B' },  // 重复！
]

// ✅ 正确：为每条边显式指定唯一 id
edges: [
  { id: 'e1', source: 'A', target: 'B' },
  { id: 'e2', source: 'A', target: 'B' },
]
```

**最佳实践：始终为边数据显式指定唯一 `id`，避免自动生成 ID 冲突。**

```javascript
// ✅ 推荐写法：每条边都有唯一 id
const edges = [
  { id: 'e-0-1', source: '0', target: '1' },
  { id: 'e-0-2', source: '0', target: '2' },
  { id: 'e-1-2', source: '1', target: '2' },
];

// ✅ 动态生成边时，使用索引确保 id 唯一
const edges = rawEdges.map((e, i) => ({
  id: `edge-${i}`,
  source: e.source,
  target: e.target,
}));
```

## 生命周期方法

```javascript
// 渲染（必须调用）
await graph.render();

// 更新数据后重绘
graph.draw();

// 适配视图
graph.fitView();
graph.fitCenter();

// 销毁
graph.destroy();

// 监听事件
graph.on('node:click', (event) => {
  const { target } = event;
  console.log('点击节点:', target.id);
});

// 获取渲染状态
console.log(graph.rendered);   // boolean
console.log(graph.destroyed);  // boolean
```

## 动态操作

```javascript
// 添加节点
graph.addNodeData([{ id: 'n4', data: { label: '新节点' } }]);
await graph.draw();

// 删除节点（关联边也会删除）
graph.removeNodeData(['n4']);
await graph.draw();

// 更新元素样式
graph.updateNodeData([{ id: 'n1', style: { fill: 'red' } }]);
await graph.draw();

// 设置元素状态
graph.setElementState('n1', 'selected');
graph.setElementState('n1', []);  // 清除状态

// 缩放
graph.zoomTo(1.5);
graph.zoomTo(1, true);  // 带动画

// 移动视口
graph.translateTo([400, 300]);

// 定位到某元素
graph.focusElement('n1');
```

## 树形数据转换

如果数据是树形结构（有父子层级关系），需要使用 `treeToGraphData` 工具函数将其转换为 G6 标准图数据格式后再传入 `data`。

```javascript
import { Graph, treeToGraphData } from '@antv/g6';

const treeData = {
  id: 'root',
  children: [
    { id: 'child1', children: [{ id: 'leaf1' }] },
    { id: 'child2' },
  ],
};

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: treeToGraphData(treeData),   // ✅ 必须转换后传入
  layout: { type: 'compact-box' },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

> ⚠️ `treeToGraphData` 需从 `@antv/g6` 中显式导入，不可直接调用未导入的函数。

## 常见错误

### 错误1：缺少 container

```javascript
// ❌ 错误
const graph = new Graph({ width: 800, height: 600 });

// ✅ 正确
const graph = new Graph({ container: 'container', width: 800, height: 600 });
```

### 错误2：使用 v4 的 graph.data() 方式

```javascript
// ❌ 错误（v4 写法）
const graph = new G6.Graph({ container: 'container', width: 800, height: 600 });
graph.data({ nodes: [...], edges: [...] });
graph.render();

// ✅ 正确（v5 写法）
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: { nodes: [...], edges: [...] },
});
graph.render();
```

### 错误3：数据中直接写标签

```javascript
// ❌ 错误：节点数据直接写 label
{ id: 'node1', label: 'Node 1' }

// ✅ 正确：业务数据放在 data 字段
{ id: 'node1', data: { label: 'Node 1' } }
// 然后在样式中：
node: {
  style: {
    labelText: (d) => d.data.label,
  },
}
```

### 错误4：使用 v4 的 modes 配置

```javascript
// ❌ 错误（v4 modes）
modes: { default: ['drag-canvas', 'zoom-canvas'] }

// ✅ 正确（v5 behaviors）
behaviors: ['drag-canvas', 'zoom-canvas']
```

### 错误5：autoFit 与固定尺寸冲突

```javascript
// ❌ autoFit: true 同时设置 width/height 会产生不可预期结果
const graph = new Graph({
  autoFit: true,   // 旧写法
  width: 800,
  height: 600,
});

// ✅ 正确：使用 'view' 或 'center'
const graph = new Graph({
  autoFit: 'view',   // 或 'center'，或 false（手动控制）
  width: 800,
  height: 600,
});
```

### 错误6：边 ID 冲突导致 "Edge already exists"

当动态生成边数据时，若多条边的 source 和 target 相同（平行边），未指定 id 会导致自动生成的 id 重复，抛出 `Edge already exists` 错误。

```javascript
// ❌ 错误：随机生成边时可能产生重复的 source-target 对
const edges = [];
for (let i = 0; i < 34; i++) {
  for (let j = 0; j < 3; j++) {
    const target = Math.floor(Math.random() * 34);
    if (target !== i) {
      edges.push({ source: `${i}`, target: `${target}` }); // 没有 id，可能重复！
    }
  }
}

// ✅ 正确方案1：为每条边指定唯一 id（推荐）
const edges = [];
let edgeIndex = 0;
for (let i = 0; i < 34; i++) {
  for (let j = 0; j < 3; j++) {
    const target = Math.floor(Math.random() * 34);
    if (target !== i) {
      edges.push({ id: `edge-${edgeIndex++}`, source: `${i}`, target: `${target}` });
    }
  }
}

// ✅ 正确方案2：对已有边数组去重后添加 id
const edgeSet = new Set();
const edges = [];
let edgeIndex = 0;
for (let i = 0; i < 34; i++) {
  for (let j = 0; j < 3; j++) {
    const target = Math.floor(Math.random() * 34);
    const key = `${i}-${target}`;
    if (target !== i && !edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({ id: `edge-${edgeIndex++}`, source: `${i}`, target: `${target}` });
    }
  }
}
```

### 错误7：树形数据未转换直接传入

```javascript
// ❌ 错误：树形结构数据不能直接传给 data
const graph = new Graph({
  data: { id: 'root', children: [...] },  // 错误！
});

// ❌ 错误：treeToGraphData 未导入就使用
const graph = new Graph({
  data: treeToGraphData(treeData),  // ReferenceError: treeToGraphData is not defined
});

// ✅ 正确：从 @antv/g6 导入后使用
import { Graph, treeToGraphData } from '@antv/g6';
const graph = new Graph({
  data: treeToGraphData(treeData),
});
```