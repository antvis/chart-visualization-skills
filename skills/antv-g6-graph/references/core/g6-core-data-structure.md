---
id: "g6-core-data-structure"
title: "G6 数据结构"
description: |
  G6 5.x 的图数据格式规范，包含 NodeData、EdgeData、ComboData 的完整字段说明，
  数据操作 API 和最佳实践。

library: "g6"
version: "5.x"
category: "core"
subcategory: "data"
tags:
  - "数据结构"
  - "NodeData"
  - "EdgeData"
  - "ComboData"
  - "data structure"
  - "graph data"
  - "nodes"
  - "edges"

related:
  - "g6-core-graph-init"
  - "g6-node-circle"
  - "g6-edge-line"

use_cases:
  - "定义图的数据格式"
  - "从服务端加载数据并渲染图"
  - "动态增删节点和边"

anti_patterns:
  - "不要把业务属性直接放在节点顶层，应放在 data 字段"
  - "不要在 style 中放业务逻辑数据，style 只放渲染相关属性"
  - "不要生成重复边（相同 source+target 的边），会导致 Edge already exists 错误"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/data"
---

## 核心概念

G6 是数据驱动的图可视化引擎，使用标准 JSON 格式描述图结构。

**GraphData 基本结构：**
```typescript
interface GraphData {
  nodes?: NodeData[];
  edges?: EdgeData[];
  combos?: ComboData[];
}
```

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [
      { id: 'n1', data: { name: '节点A', type: 'user' } },
      { id: 'n2', data: { name: '节点B', type: 'product' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', data: { weight: 5 } },
    ],
  },
  node: {
    style: { labelText: (d) => d.data.name },
  },
  layout: { type: 'force' },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

## NodeData 完整结构

```typescript
interface NodeData {
  id: string;                      // 必填，唯一标识符
  type?: string;                   // 节点类型，如 'circle', 'rect', 'image'
  data?: Record<string, unknown>;  // 业务数据（推荐存放自定义属性）
  style?: NodeStyle;               // 节点样式（覆盖全局配置）
  states?: string[];               // 初始状态列表
  combo?: string;                  // 所属 combo 的 id
  children?: string[];             // 树形数据中子节点 id 列表
}

// 示例
const nodes = [
  {
    id: 'user-001',
    type: 'circle',                  // 覆盖全局节点类型
    data: {
      name: '张三',
      role: 'admin',
      score: 95,
    },
    style: {
      fill: '#ff7875',               // 覆盖全局样式
      size: 60,
    },
    states: ['selected'],            // 初始为选中状态
  },
];
```

## EdgeData 完整结构

```typescript
interface EdgeData {
  id?: string;                     // 可选，唯一标识，未指定时自动生成
  source: string;                  // 必填，起点节点 id
  target: string;                  // 必填，终点节点 id
  type?: string;                   // 边类型，如 'line', 'cubic', 'polyline'
  data?: Record<string, unknown>;  // 业务数据
  style?: EdgeStyle;               // 边样式（覆盖全局配置）
  states?: string[];               // 初始状态列表
}

// 示例
const edges = [
  {
    id: 'edge-001',
    source: 'user-001',
    target: 'product-001',
    data: {
      type: 'purchase',
      amount: 299,
      date: '2024-01-15',
    },
    style: {
      stroke: '#ff4d4f',
      lineWidth: 2,
    },
  },
];
```

## ComboData 完整结构

```typescript
interface ComboData {
  id: string;                      // 必填，唯一标识符
  type?: string;                   // combo 类型：'circle' | 'rect'
  data?: Record<string, unknown>;  // 业务数据
  style?: ComboStyle;              // combo 样式
  states?: string[];               // 初始状态
  combo?: string;                  // 父 combo id（嵌套 combo）
}

// 示例：节点分组
const data = {
  nodes: [
    { id: 'n1', combo: 'group1', data: { label: '成员1' } },
    { id: 'n2', combo: 'group1', data: { label: '成员2' } },
    { id: 'n3', combo: 'group2', data: { label: '成员3' } },
  ],
  edges: [
    { source: 'n1', target: 'n3' },
  ],
  combos: [
    { id: 'group1', data: { label: '团队A' } },
    { id: 'group2', data: { label: '团队B' } },
  ],
};
```

## 树形数据

树形布局（mindmap、compact-box 等）使用 `treeToGraphData()` 转换，必须从 `@antv/g6` 中导入：

```javascript
import { Graph, treeToGraphData } from '@antv/g6';

// 树形结构数据
const treeData = {
  id: 'root',
  data: { label: '根节点' },
  children: [
    {
      id: 'child1',
      data: { label: '子节点1' },
      children: [
        { id: 'grandchild1', data: { label: '孙节点1' } },
        { id: 'grandchild2', data: { label: '孙节点2' } },
      ],
    },
    {
      id: 'child2',
      data: { label: '子节点2' },
    },
  ],
};

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: treeToGraphData(treeData),   // 转换为 GraphData 格式
  layout: {
    type: 'mindmap',
    direction: 'H',
  },
  behaviors: ['drag-canvas', 'zoom-canvas', 'collapse-expand'],
});

graph.render();
```

## 远程数据加载

```javascript
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: { nodes: [], edges: [] },  // 初始空数据
  layout: { type: 'force' },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

// 异步加载数据
fetch('https://api.example.com/graph-data')
  .then((res) => res.json())
  .then((data) => {
    graph.setData(data);     // 或在 render 前设置
    graph.render();
  });

// 推荐方式：等待 render 后再更新
await graph.render();
const data = await fetch('/api/data').then((r) => r.json());
graph.setData(data);
await graph.draw();
```

## 数据操作 API

```javascript
// 读取数据
const allNodes = graph.getNodeData();
const oneNode = graph.getNodeData('n1');
const allEdges = graph.getEdgeData();
const oneEdge = graph.getEdgeData('e1');

// 新增
graph.addNodeData([
  { id: 'n10', data: { label: '新节点' } },
]);
graph.addEdgeData([
  { source: 'n1', target: 'n10' },
]);
await graph.draw();

// 更新
graph.updateNodeData([
  { id: 'n1', data: { label: '更新后' }, style: { fill: 'red' } },
]);
await graph.draw();

// 删除
graph.removeNodeData(['n10']);    // 会同时删除关联的边
graph.removeEdgeData(['e1']);
await graph.draw();

// 批量更新数据（替换全量）
graph.setData({ nodes: [...], edges: [...] });
await graph.draw();
```

## 样式与数据的分离（最佳实践）

```javascript
// ✅ 推荐：业务数据放 data，样式通过回调函数从 data 计算
const nodes = [
  { id: 'n1', data: { name: '高优先级', priority: 'high', value: 100 } },
  { id: 'n2', data: { name: '低优先级', priority: 'low', value: 30 } },
];

const graph = new Graph({
  container: 'container',
  data: { nodes, edges: [] },
  node: {
    style: {
      // 通过回调函数将数据映射为样式
      fill: (d) => d.data.priority === 'high' ? '#ff4d4f' : '#1783FF',
      size: (d) => Math.max(20, d.data.value / 2),
      labelText: (d) => d.data.name,
    },
  },
});
```

## 常见错误与修正

### 错误1：业务属性放在节点顶层

```javascript
// ❌ 错误：label、type 等业务属性直接在节点顶层
{ id: 'n1', label: '节点1', category: 'user', value: 100 }

// ✅ 正确：业务属性放在 data 字段
{ id: 'n1', data: { label: '节点1', category: 'user', value: 100 } }
```

### 错误2：边缺少 source 或 target

```javascript
// ❌ 错误：缺少 source 或 target
{ id: 'e1', from: 'n1', to: 'n2' }    // v4 写法

// ✅ 正确
{ id: 'e1', source: 'n1', target: 'n2' }
```

### 错误3：节点 id 重复

```javascript
// ❌ 错误：id 重复会导致渲染异常
const nodes = [
  { id: 'node1', data: { label: 'A' } },
  { id: 'node1', data: { label: 'B' } },   // 重复 id
];

// ✅ 正确：每个节点 id 必须唯一
const nodes = [
  { id: 'node-a', data: { label: 'A' } },
  { id: 'node-b', data: { label: 'B' } },
];
```

### 错误4：边的 source/target 引用了不存在的节点

```javascript
// ❌ 错误：引用了不存在的节点 id
const edges = [
  { source: 'n1', target: 'n999' },  // n999 不存在
];

// ✅ 正确：确保 source 和 target 都存在于 nodes 中
```

### 错误5：重复边导致 "Edge already exists" 错误

G6 不允许存在重复边（相同 source 和 target 的边）。动态生成边时必须去重，否则会抛出 `Edge already exists: xxx-yyy` 错误。

```javascript
// ❌ 错误：随机生成边时可能产生重复边
const edges = [];
for (let i = 0; i < 34; i++) {
  for (let j = 0; j < 3; j++) {
    const target = Math.floor(Math.random() * 34);
    if (target !== i) {
      edges.push({ source: `${i}`, target: `${target}` }); // 可能重复！
    }
  }
}

// ✅ 正确：使用 Set 去重，确保每对 source-target 唯一
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

**最佳实践：优先使用明确的静态边数据，避免随机生成边。** 如果必须动态生成，务必在添加前检查重复：

```javascript
// ✅ 推荐：使用明确的边数据，不依赖随机生成
const data = {
  nodes: Array.from({ length: 10 }, (_, i) => ({ id: `${i}` })),
  edges: [
    { source: '0', target: '1' },
    { source: '0', target: '2' },
    { source: '1', target: '3' },
    { source: '2', target: '3' },
    // 每对 source-target 只出现一次
  ],
};

const graph = new Graph({
  container: 'container',
  autoFit: 'view',
  data,
  node: {
    style: {
      labelText: (d) => d.id,
      labelPlacement: 'center',
      labelFill: '#fff',
    },
  },
  layout: { type: 'circular' },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```

### 错误6：treeToGraphData 未导入

```javascript
// ❌ 错误：忘记从 @antv/g6 导入 treeToGraphData
import { Graph } from '@antv/g6';
// ...
data: treeToGraphData(treeData),  // ReferenceError: treeToGraphData is not defined

// ✅ 正确：必须显式导入
import { Graph, treeToGraphData } from '@antv/g6';
// ...
data: treeToGraphData(treeData),
```