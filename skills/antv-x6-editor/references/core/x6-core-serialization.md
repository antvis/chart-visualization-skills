---
id: "x6-core-serialization"
title: "X6 数据序列化与持久化"
description: |
  X6 图数据的导入导出、JSON 序列化、清空与重载。
  包含 toJSON/fromJSON/clearCells 等方法的使用。

library: "x6"
version: "3.x"
category: "core"
subcategory: "serialization"
tags:
  - "序列化"
  - "toJSON"
  - "fromJSON"
  - "clearCells"
  - "导入"
  - "导出"
  - "持久化"
  - "数据"
  - "保存"
  - "加载"

related:
  - "x6-core-graph-init"
  - "x6-core-node"
  - "x6-core-edge"

use_cases:
  - "保存画布数据到后端"
  - "从后端加载图数据"
  - "清空画布重新加载"
  - "批量导入节点和边"

anti_patterns:
  - "不要手动构造 cells 数组的内部字段"
  - "不要在 fromJSON 后再次 addNode 已存在的节点"

difficulty: "beginner"
completeness: "full"
---

## 导出数据

```javascript
// 导出整个画布数据
const data = graph.toJSON();
// 返回格式: { cells: [...] }
// cells 包含所有节点和边的完整配置

console.log(JSON.stringify(data));
```

## 导入数据

```javascript
// 方式1：fromJSON 加载完整数据（会清空已有内容）
graph.fromJSON({
  nodes: [
    { id: 'node1', shape: 'rect', x: 40, y: 40, width: 100, height: 40, label: 'Node 1' },
    { id: 'node2', shape: 'rect', x: 240, y: 40, width: 100, height: 40, label: 'Node 2' },
  ],
  edges: [
    { source: 'node1', target: 'node2', attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } } },
  ],
});

// 方式2：加载 toJSON 导出的数据
const savedData = graph.toJSON();
// ... 稍后 ...
graph.fromJSON(savedData);
```

## 清空画布

```javascript
// 清空所有节点和边
graph.clearCells();

// 清空后重新加载
graph.clearCells();
graph.fromJSON(newData);
```

## 批量操作

```javascript
// 批量添加
const nodes = [
  { shape: 'rect', x: 40, y: 40, width: 100, height: 40, label: 'A' },
  { shape: 'rect', x: 200, y: 40, width: 100, height: 40, label: 'B' },
];
nodes.forEach(config => graph.addNode(config));

// 冻结画布避免频繁重绘（性能优化）
graph.freeze();
for (let i = 0; i < 100; i++) {
  graph.addNode({ shape: 'rect', x: (i % 10) * 110, y: Math.floor(i / 10) * 70, width: 90, height: 40 });
}
graph.unfreeze();
```

## 获取元素

```javascript
// 获取所有元素（节点 + 边）
const allCells = graph.getCells();

// 仅获取节点
const allNodes = graph.getNodes();

// 仅获取边
const allEdges = graph.getEdges();

// 通过 ID 获取
const cell = graph.getCellById('node1');

// 获取相邻节点
const neighbors = graph.getNeighbors(node);

// 获取连接的边
const connectedEdges = graph.getConnectedEdges(node);
```

## 删除元素

```javascript
// 删除单个节点（连带的边也会被删除）
graph.removeNode('node1');
// 或
graph.removeCell(node);

// 删除单个边
graph.removeEdge('edge1');

// 批量删除
graph.removeCells([node1, node2, edge1]);
```

## 销毁画布

```javascript
// 销毁实例，释放所有资源和事件
graph.dispose();
```

## 完整持久化示例

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({ container: 'container', background: { color: '#F2F7FA' } });

// 加载数据
const initialData = {
  nodes: [
    { id: 'start', shape: 'rect', x: 40, y: 80, width: 100, height: 40, label: 'Start',
      attrs: { body: { stroke: '#52c41a', strokeWidth: 2, fill: '#f6ffed', rx: 6, ry: 6 } } },
    { id: 'end', shape: 'rect', x: 280, y: 80, width: 100, height: 40, label: 'End',
      attrs: { body: { stroke: '#f5222d', strokeWidth: 2, fill: '#fff1f0', rx: 6, ry: 6 } } },
  ],
  edges: [
    { source: 'start', target: 'end', attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } } },
  ],
};

graph.fromJSON(initialData);

// 保存
function save() {
  const data = graph.toJSON();
  localStorage.setItem('graph-data', JSON.stringify(data));
}

// 加载
function load() {
  const raw = localStorage.getItem('graph-data');
  if (raw) {
    graph.fromJSON(JSON.parse(raw));
  }
}
```

## 常见错误与修正

### 错误1：使用 toJSON 导出的数据直接传给 fromJSON 导致报错

```javascript
// ❌ 错误示例：直接使用 toJSON 返回值加载数据
const graph = new Graph({ container: 'container' });
graph.fromJSON([
  { id: 'node1', shape: 'rect', label: 'Node 1', x: 40, y: 40, width: 80, height: 40 },
  { id: 'node2', shape: 'rect', label: 'Node 2', x: 240, y: 40, width: 80, height: 40 },
  { id: 'edge1', source: 'node1', target: 'node2', label: 'Edge' }
]);

const exportedData = graph.toJSON(); // 返回 { cells: [...] }
// 下面这行会报错：The `shape` should be specified when creating a node/edge instance
graph2.fromJSON(exportedData); 
```

```javascript
// ✅ 正确做法：使用 toJSON 返回值中的 cells 字段
const exportedData = graph.toJSON();
graph2.fromJSON(exportedData.cells); // 注意这里传的是 cells 数组

// 或者使用完整结构
graph2.fromJSON({ nodes: exportedData.cells.filter(c => c.shape), edges: exportedData.cells.filter(c => !c.shape) });
```

### 错误2：节点或边缺少必要的 shape 字段

```javascript
// ❌ 错误示例：缺少 shape 字段
graph.fromJSON([
  { id: 'node1', x: 40, y: 40, width: 80, height: 40, label: 'Node 1' }, // 缺少 shape
  { source: 'node1', target: 'node2' } // 缺少 shape，默认为 edge
]);
```

```javascript
// ✅ 正确做法：确保每个节点都有 shape 字段
graph.fromJSON([
  { id: 'node1', shape: 'rect', x: 40, y: 40, width: 80, height: 40, label: 'Node 1' },
  { id: 'edge1', shape: 'edge', source: 'node1', target: 'node2' }
]);
```

### 错误3：节点引用不存在的目标节点

```javascript
// ❌ 错误示例：边引用了不存在的节点
graph.fromJSON([
  { id: 'node1', shape: 'rect', x: 40, y: 40, width: 80, height: 40, label: 'Node 1' },
  { source: 'node1', target: 'node2' } // node2 不存在
]);
```

```javascript
// ✅ 正确做法：确保所有被引用的节点都已定义
graph.fromJSON([
  { id: 'node1', shape: 'rect', x: 40, y: 40, width: 80, height: 40, label: 'Node 1' },
  { id: 'node2', shape: 'rect', x: 240, y: 40, width: 80, height: 40, label: 'Node 2' },
  { source: 'node1', target: 'node2' }
]);
```

### 错误4：使用 fromJSON 时传递数组格式但未正确区分节点和边

```javascript
// ❌ 错误示例：混合节点和边在同一个数组中传递给 fromJSON
const graph = new Graph({ container: 'container' });
graph.fromJSON([
  { id: 'source', shape: 'rect', label: 'Source', x: 40, y: 40, width: 100, height: 40 },
  { id: 'target', shape: 'rect', label: 'Target', x: 200, y: 160, width: 100, height: 40 },
  { source: 'source', target: 'target' } // 边没有 shape 字段，会被误认为是节点
]);
```

```javascript
// ✅ 正确做法：使用对象结构分别指定 nodes 和 edges
graph.fromJSON({
  nodes: [
    { id: 'source', shape: 'rect', label: 'Source', x: 40, y: 40, width: 100, height: 40 },
    { id: 'target', shape: 'rect', label: 'Target', x: 200, y: 160, width: 100, height: 40 }
  ],
  edges: [
    { source: 'source', target: 'target' }
  ]
});
```

### 错误5：toJSON 返回值结构误解

```javascript
// ❌ 错误示例：将 toJSON 返回值直接用于 fromJSON
const graph = new Graph({ container: 'container' });
graph.fromJSON([
  { id: 'node1', shape: 'rect', x: 40, y: 40, width: 80, height: 40, label: 'Node 1' },
  { source: 'node1', target: 'node2' }
]);

const data = graph.toJSON(); // 返回 { cells: [...] }
// 下面这行会报错：The `shape` should be specified when creating a node/edge instance
graph2.fromJSON(data);
```

```javascript
// ✅ 正确做法：使用 toJSON 返回值中的 cells 字段
const data = graph.toJSON();
graph2.fromJSON(data.cells); // 注意这里传的是 cells 数组

// 或者使用完整结构
graph2.fromJSON({ nodes: data.cells.filter(c => c.shape), edges: data.cells.filter(c => !c.shape) });
```

### 错误6：使用 fromJSON 加载节点和边时未正确处理边的 shape 字段

```javascript
// ❌ 错误示例：边缺少 shape 字段
const graph = new Graph({ container: 'container' });
graph.fromJSON([
  { id: 'source', shape: 'rect', label: 'Source', x: 40, y: 40, width: 100, height: 40 },
  { id: 'target', shape: 'rect', label: 'Target', x: 200, y: 160, width: 100, height: 40 },
  { source: 'source', target: 'target' } // 边没有 shape 字段，会被误认为是节点
]);
```

```javascript
// ✅ 正确做法：确保边有 shape 字段
const graph = new Graph({ container: 'container' });
graph.fromJSON([
  { id: 'source', shape: 'rect', label: 'Source', x: 40, y: 40, width: 100, height: 40 },
  { id: 'target', shape: 'rect', label: 'Target', x: 200, y: 160, width: 100, height: 40 },
  { id: 'edge1', shape: 'edge', source: 'source', target: 'target' }
]);
```

### 错误7：使用 fromJSON 加载节点和边时传递数组格式但未正确区分节点和边

```javascript
// ❌ 错误示例：混合节点和边在同一个数组中传递给 fromJSON
const graph = new Graph({ container: 'container' });
graph.fromJSON([
  { id: 'source', shape: 'rect', label: 'Source', x: 40, y: 40, width: 100, height: 40 },
  { id: 'target', shape: 'rect', label: 'Target', x: 200, y: 160, width: 100, height: 40 },
  { source: 'source', target: 'target' } // 边没有 shape 字段，会被误认为是节点
]);
```

```javascript
// ✅ 正确做法：使用对象结构分别指定 nodes 和 edges
const graph = new Graph({ container: 'container' });
graph.fromJSON({
  nodes: [
    { id: 'source', shape: 'rect', label: 'Source', x: 40, y: 40, width: 100, height: 40 },
    { id: 'target', shape: 'rect', label: 'Target', x: 200, y: 160, width: 100, height: 40 }
  ],
  edges: [
    { source: 'source', target: 'target' }
  ]
});
```