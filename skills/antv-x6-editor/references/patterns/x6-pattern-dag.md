---
id: "x6-pattern-dag"
title: "X6 DAG 有向无环图"
description: |
  使用 X6 构建 DAG（有向无环图）的最佳实践。
  适用于数据管道、CI/CD 流水线、任务依赖等场景。

library: "x6"
version: "3.x"
category: "patterns"
subcategory: "dag"
tags:
  - "DAG"
  - "有向无环图"
  - "数据管道"
  - "pipeline"
  - "CI/CD"
  - "流水线"
  - "任务依赖"
  - "数据血缘"
  - "ETL"
  - "端口连线"

related:
  - "x 6-core-ports"
  - "x6-core-edge"
  - "x6-core-node"
  - "x6-plugins"

use_cases:
  - "创建数据处理管道图"
  - "CI/CD 流水线可视化"
  - "任务依赖关系图"
  - "数据血缘分析图"

difficulty: "intermediate"
completeness: "full"
---

## DAG 核心特征

- **有向**：边有方向，从上游流向下游
- **无环**：不存在循环依赖
- **端口连线**：通过 Ports 的 in/out 端口建立连接
- **左右/上下布局**：通常为水平（左→右）或垂直（上→下）流向

## DAG 节点注册

```javascript
import { Graph } from '@antv/x6';

Graph.registerNode('dag-node', {
  inherit: 'rect',
  width: 140,
  height: 50,
  attrs: {
    body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
  },
  ports: {
    groups: {
      in: {
        position: 'left',
        attrs: { circle: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' } },
      },
      out: {
        position: 'right',
        attrs: { circle: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' } },
      },
    },
  },
}, true);
```

## 完整 DAG 示例

以下是一个可直接运行的标准 DAG 数据管道示例。无论用户是否提供参考 JSON，都应输出完整、可运行的代码，并为每个节点分配独立变量名。

```javascript
import { Graph } from '@antv/x6';

Graph.registerNode('dag-node', {
  inherit: 'rect',
  width: 140,
  height: 48,
  attrs: {
    body: { fill: '#fff', stroke: '#5F95FF', strokeWidth: 1, rx: 6, ry: 6 },
    label: { fontSize: 13, fill: '#333' },
  },
  ports: {
    groups: {
      in: { position: 'left', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', fill: '#fff', strokeWidth: 1 } } },
      out: { position: 'right', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', fill: '#fff', strokeWidth: 1 } } },
    },
  },
}, true);

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 500,
  background: { color: '#F2F7FA' },
  grid: { visible: true, size: 10 },
  connecting: {
    allowBlank: false,
    allowLoop: false,
    allowMulti: false,
    router: 'orth',
    connector: 'rounded',
    createEdge() {
      return this.createEdge({
        attrs: { line: { stroke: '#5F95FF', strokeWidth: 1, targetMarker: 'classic' } },
      });
    },
    validateConnection({ sourcePort, targetPort }) {
      return sourcePort !== targetPort;
    },
  },
});

const extract = graph.addNode({ shape: 'dag-node', x: 40, y: 100, label: 'MySQL Source', ports: { items: [{ id: 'out-1', group: 'out' }] } });
const transform = graph.addNode({ shape: 'dag-node', x: 260, y: 60, label: 'Data Clean', ports: { items: [{ id: 'in-1', group: 'in' }, { id: 'out-1', group: 'out' }] } });
const aggregate = graph.addNode({ shape: 'dag-node', x: 260, y: 160, label: 'Aggregate', ports: { items: [{ id: 'in-1', group: 'in' }, { id: 'out-1', group: 'out' }] } });
const load = graph.addNode({ shape: 'dag-node', x: 500, y: 120, label: 'Write to DW', ports: { items: [{ id: 'in-1', group: 'in' }, { id: 'in-2', group: 'in' }] } });

graph.addEdge({ source: { cell: extract, port: 'out-1' }, target: { cell: transform, port: 'in-1' }, attrs: { line: { stroke: '#5F95FF', strokeWidth: 1, targetMarker: 'classic' } } });
graph.addEdge({ source: { cell: extract, port: 'out-1' }, target: { cell: aggregate, port: 'in-1' }, attrs: { line: { stroke: '#5F95FF', strokeWidth: 1, targetMarker: 'classic' } } });
graph.addEdge({ source: { cell: transform, port: 'out-1' }, target: { cell: load, port: 'in-1' }, attrs: { line: { stroke: '#5F95FF', strokeWidth: 1, targetMarker: 'classic' } } });
graph.addEdge({ source: { cell: aggregate, port: 'out-1' }, target: { cell: load, port: 'in-2' }, attrs: { line: { stroke: '#5F95FF', strokeWidth: 1, targetMarker: 'classic' } } });
```

## 从用户数据生成 DAG

当用户提供节点/边参考数据（如 JSON 数组）时，**不要直接复制 JSON 字段**，因为用户数据常把端口 ID 误写为节点 ID，或缺少完整的 `ports` 配置。正确做法是：

1. 根据语义为每个节点创建独立变量（如 `source1`, `etl`, `warehouse`）。
2. 在 `addNode` 中显式补充 `shape: 'dag-node'` 和 `ports.items`。
3. 边使用 `{ cell: nodeVar, port: '...' }` 对象格式，禁止用字符串 ID。
4. 始终输出完整可运行的代码，禁止返回空代码或伪代码。

```javascript
// 反例：不要直接遍历用户 JSON 当节点配置
// 正例：按语义重建节点与边
const etl = graph.addNode({
  shape: 'dag-node',
  x: 260,
  y: 90,
  label: 'ETL Transform',
  ports: {
    items: [
      { id: 'in1', group: 'in' },
      { id: 'in2', group: 'in' },
      { id: 'out1', group: 'out' },
    ],
  },
});
```

## 带状态的 DAG 节点

```javascript
const statusColors = {
  pending: { stroke: '#8f8f8f', fill: '#fff' },
  running: { stroke: '#1890ff', fill: '#e6f7ff' },
  success: { stroke: '#52c41a', fill: '#f6ffed' },
  failed: { stroke: '#f5222d', fill: '#fff1f0' },
};

function setNodeStatus(node, status) {
  const colors = statusColors[status];
  node.attr('body/stroke', colors.stroke);
  node.attr('body/fill', colors.fill);
  node.setData({ status });
}
```

## 连线验证（防止环路）

```javascript
const graph = new Graph({
  container: 'container',
  connecting: {
    allowBlank: false,
    allowLoop: false,
    router: 'orth',
    connector: 'rounded',
    validateConnection({ sourceCell, targetCell }) {
      // 防止自连
      if (sourceCell === targetCell) return false;
      // 检查是否会形成环路（简单实现）
      const edges = graph.getEdges();
      // ... 拓扑排序检测环路
      return true;
    },
  },
});
```

## 数据血缘图（多层 DAG）

数据血缘是 DAG 的典型应用，展示数据从源表到最终报表的流转：

```javascript
// 使用 smooth connector 替代 orth，更适合多层扇出场景
graph.addEdge({
  source: { cell: srcNode, port: 'out1' },
  target: { cell: tgtNode, port: 'in1' },
  connector: 'smooth',
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1 } },
});
```

层次建议：
- **ODS 层**：原始数据源（白色背景）
- **DWD 层**：明细数据（浅蓝色 `#e6f7ff`）
- **DWS 层**：汇总数据（浅绿色 `#f6ffed`）
- **ADS 层**：应用数据（浅橙色 `#fff7e6`）

## 常见错误与修正

### 1. 返回空代码（no code）

**错误表现**：用户提供了参考 JSON 数据后，模型未输出任何代码。  
**原因**：模型被数据中不完整的字段或端口/节点 ID 混淆，导致放弃生成。  
**修正**：始终基于标准 DAG 模板输出完整可运行代码。忽略用户 JSON 中可能错误的 `id` 字段，按节点语义创建独立变量，并显式配置 `ports.items`。

```javascript
// ❌ 错误：未生成代码，或只输出数据注释
// ✅ 正确：直接输出完整代码
const source1 = graph.addNode({
  shape: 'dag-node', x: 40, y: 40, label: 'MySQL Source',
  ports: { items: [{ id: 'out1', group: 'out' }] },
});
```

### 2. 边连接格式错误

**错误表现**：`source: 'source1'` 或 `source: { cell: 'source1' }`（字符串 ID）。  
**修正**：必须使用节点变量引用 + 端口 ID 对象。

```javascript
// ❌ 错误
graph.addEdge({ source: 'source1', target: 'etl' });

// ✅ 正确
graph.addEdge({
  source: { cell: source1, port: 'out1' },
  target: { cell: etl, port: 'in1' },
  attrs: { line: { stroke: '#1890ff', strokeWidth: 1, targetMarker: 'classic' } },
});
```

### 3. 节点缺少端口配置

**错误表现**：`addNode` 时只写了 `shape` 和 `label`，没有 `ports`。  
**修正**：DAG 必须通过端口连线，每个节点在 `addNode` 时必须声明 `ports: { items: [...] }`，并指定 `group: 'in'` 或 `group: 'out'`。

```javascript
// ❌ 错误
graph.addNode({ shape: 'dag-node', label: 'ETL' });

// ✅ 正确
graph.addNode({
  shape: 'dag-node',
  label: 'ETL',
  ports: {
    items: [
      { id: 'in1', group: 'in' },
      { id: 'out1', group: 'out' },
    ],
  },
});
```

### 4. 端口 ID 与节点变量名混淆

**错误表现**：把用户 JSON 里的 `"id": "out1"` 当成节点 ID，导致所有节点 ID 重复或语义丢失。  
**修正**：`out1`/`in1` 应作为 **端口 ID** 放在 `ports.items` 中；节点本身应使用有意义的变量名（如 `source1`, `etl`, `warehouse`）。

```javascript
// ✅ 正确区分
const warehouse = graph.addNode({
  shape: 'dag-node',
  label: 'Data Warehouse',
  ports: { items: [{ id: 'in1', group: 'in' }, { id: 'out1', group: 'out' }] },
});
```

### 5. 错误地使用 addPorts 方法

**错误表现**：在 addNode 后调用 addPorts 添加端口，而不是在 addNode 阶段一次性声明 ports.items。  
**修正**：应在 addNode 时就声明 ports.items，避免后续手动添加端口。

```javascript
// ❌ 错误
const node = graph.addNode({ shape: 'dag-node', label: 'Node' });
node.addPorts([{ id: 'in1', group: 'in' }]);

// ✅ 正确
const node = graph.addNode({
  shape: 'dag-node',
  label: 'Node',
  ports: { items: [{ id: 'in1', group: 'in' }] },
});
```

### 6. 使用字符串 ID 作为 cell 引用

**错误表现**：边连接中使用字符串 ID 而非节点变量引用。  
**修正**：必须使用节点变量引用 + 端口 ID 对象。

```javascript
// ❌ 错误
graph.addEdge({ source: { cell: 'source1', port: 'out1' }, target: { cell: 'etl', port: 'in1' } });

// ✅ 正确
graph.addEdge({ source: { cell: source1, port: 'out1' }, target: { cell: etl, port: 'in1' } });
```

### 7. 错误引入额外依赖

**错误表现**：引入了 `Shape` 或其他非必需模块，导致加载失败。  
**修正**：只引入 `Graph` 即可，避免不必要的模块引入。

```javascript
// ❌ 错误
import { Graph, Shape } from '@antv/x6'

// ✅ 正确
import { Graph } from '@antv/x6';
```

### 8. 错误使用 addNode + addPorts 模式

**错误表现**：先 addNode 再 addPorts，而不是一次性在 addNode 中声明 ports.items。  
**修正**：应在 addNode 时就声明 ports.items。

```javascript
// ❌ 错误
const node = graph.addNode({ shape: 'dag-node', label: 'Node' });
node.addPorts([{ id: 'in1', group: 'in' }]);

// ✅ 正确
const node = graph.addNode({
  shape: 'dag-node',
  label: 'Node',
  ports: { items: [{ id: 'in1', group: 'in' }] },
});
```

### 9. 错误使用 ports 数组而非 items 对象

**错误表现**：在 `addNode` 中使用 `ports: [{ id: 'out', group: 'out' }]` 而非 `ports: { items: [...] }`。  
**修正**：必须使用 `ports: { items: [...] }` 格式，否则端口无法正确渲染。

```javascript
// ❌ 错误
graph.addNode({
  shape: 'dag-node',
  label: 'Node',
  ports: [{ id: 'out', group: 'out' }]
});

// ✅ 正确
graph.addNode({
  shape: 'dag-node',
  label: 'Node',
  ports: { items: [{ id: 'out', group: 'out' }] }
});
```

### 10. 错误使用 createEdge 方法引入额外依赖

**错误表现**：在 `connecting.createEdge` 中使用 `Shape.Edge`，导致引入额外依赖。  
**修正**：应避免使用 `Shape.Edge`，直接使用默认边配置。

```javascript
// ❌ 错误
connecting: {
  createEdge() {
    return new Shape.Edge({
      attrs: { line: { stroke: '#A2B1C3' } }
    });
  }
}

// ✅ 正确
connecting: {
  // 不需要自定义 createEdge
}
```

### 11. 错误使用 ports 数组形式而非 items 对象形式

**错误表现**：在 `addNode` 中使用 `ports: [{ id: 'out1', group: 'out' }]` 而非 `ports: { items: [...] }`。  
**修正**：必须使用 `ports: { items: [...] }` 格式，否则端口无法正确渲染。

```javascript
// ❌ 错误
graph.addNode({
  shape: 'dag-node',
  label: 'Node',
  ports: [{ id: 'out1', group: 'out' }]
});

// ✅ 正确
graph.addNode({
  shape: 'dag-node',
  label: 'Node',
  ports: { items: [{ id: 'out1', group: 'out' }] }
});
```

### 12. 错误使用 addPorts 方法添加端口

**错误表现**：在 addNode 后调用 addPorts 添加端口，而不是在 addNode 阶段一次性声明 ports.items。  
**修正**：应在 addNode 时就声明 ports.items，避免后续手动添加端口。

```javascript
// ❌ 错误
const node = graph.addNode({ shape: 'dag-node', label: 'Node' });
node.addPorts([{ id: 'in1', group: 'in' }]);

// ✅ 正确
const node = graph.addNode({
  shape: 'dag-node',
  label: 'Node',
  ports: { items: [{ id: 'in1', group: 'in' }] },
});
```

### 13. 错误使用插件方式引入功能

**错误表现**：通过 `plugins: [new Selection(...)]` 方式引入插件，导致未正确初始化。  
**修正**：应使用 `graph.use(new Plugin(...))` 方式引入插件。

```javascript
// ❌ 错误
const graph = new Graph({
  plugins: [
    new Selection({ enabled: true }),
  ],
});

// ✅ 正确
import { Selection } from '@antv/x6-plugin-selection';
const graph = new Graph({ /* ... */ });
graph.use(new Selection({ enabled: true }));
```

### 14. 错误使用 createEdge 返回 this.createEdge

**错误表现**：在 `createEdge` 中返回 `this.createEdge(...)` 导致递归调用栈溢出。  
**修正**：应直接返回 `graph.createEdge(...)` 或使用 `new Edge(...)`。

```javascript
// ❌ 错误
createEdge() {
  return this.createEdge({ ... });
}

// ✅ 正确
createEdge() {
  return graph.createEdge({ ... });
}
```