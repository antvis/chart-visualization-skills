---
id: "x6-pattern-flowchart"
title: "X6 流程图"
description: |
  使用 X6 构建流程图、审批流的最佳实践。
  包含开始/结束/判断/步骤节点、条件分支、泳道图等模式。

library: "x6"
version: "3.x"
category: "patterns"
subcategory: "flowchart"
tags:
  - "流程图"
  - "审批流"
  - "条件分支"
  - "菱形"
  - "判断"
  - "泳道"
  - "开始结束"
  - "状态机"
  - "组织架构"

related:
  - "x6-core-node"
  - "x6-core-edge"
  - "x6-core-graph-init"
  - "x6-plugins"

use_cases:
  - "创建审批流程图"
  - "绘制业务流程"
  - "条件判断分支"
  - "泳道图跨部门协作"
  - "状态机图"
  - "组织架构图"

difficulty: "intermediate"
completeness: "full"
---

## 流程图核心元素

| 元素 | 形状 | 用途 |
|------|------|------|
| 开始/结束 | 圆形 / 圆角矩形 | 流程起止点 |
| 步骤 | 矩形 | 处理步骤 |
| 判断 | 菱形 | 条件分支 |
| 连线 | 带箭头的边 | 流程方向 |

## 注册菱形节点

```javascript
import { Graph } from '@antv/x6';

Graph.registerNode('diamond', {
  inherit: 'polygon',
  width: 80,
  height: 80,
  attrs: {
    body: {
      refPoints: '0,10 10,0 20,10 10,20',
      fill: '#fff',
      stroke: '#8f8f8f',
      strokeWidth: 1,
    },
    label: { fontSize: 12 },
  },
}, true);
```

## 完整流程图示例

```javascript
import { Graph } from '@antv/x6';

Graph.registerNode('diamond', {
  inherit: 'polygon', width: 80, height: 80,
  attrs: { body: { refPoints: '0,10 10,0 20,10 10,20', fill: '#fff', stroke: '#8f8f8f' } },
}, true);

const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
  grid: { visible: true },
});

// 开始
const start = graph.addNode({
  shape: 'circle', x: 220, y: 20, width: 60, height: 60, label: 'Start',
  attrs: { body: { stroke: '#52c41a', strokeWidth: 2, fill: '#f6ffed' } },
});

// 步骤
const submit = graph.addNode({
  shape: 'rect', x: 200, y: 120, width: 100, height: 40, label: 'Submit',
  attrs: { body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 } },
});

// 判断
const review = graph.addNode({
  shape: 'diamond', x: 210, y: 200, label: 'Approve?',
});

// 分支结果
const approved = graph.addNode({
  shape: 'rect', x: 80, y: 320, width: 100, height: 40, label: 'Approved',
  attrs: { body: { stroke: '#52c41a', strokeWidth: 2, fill: '#f6ffed', rx: 6, ry: 6 } },
});

const rejected = graph.addNode({
  shape: 'rect', x: 320, y: 320, width: 100, height: 40, label: 'Rejected',
  attrs: { body: { stroke: '#f5222d', strokeWidth: 2, fill: '#fff1f0', rx: 6, ry: 6 } },
});

// 结束
const end = graph.addNode({
  shape: 'circle', x: 220, y: 420, width: 60, height: 60, label: 'End',
  attrs: { body: { stroke: '#f5222d', strokeWidth: 2, fill: '#fff1f0' } },
});

// 连线
const edgeStyle = { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } };
graph.addEdge({ source: start, target: submit, attrs: edgeStyle });
graph.addEdge({ source: submit, target: review, attrs: edgeStyle });
graph.addEdge({ source: review, target: approved, label: 'Yes', attrs: { line: { stroke: '#52c41a', strokeWidth: 1, targetMarker: 'classic' } } });
graph.addEdge({ source: review, target: rejected, label: 'No', attrs: { line: { stroke: '#f5222d', strokeWidth: 1, targetMarker: 'classic' } } });
graph.addEdge({ source: approved, target: end, attrs: edgeStyle });
graph.addEdge({ source: rejected, target: end, attrs: edgeStyle });

graph.centerContent();
```

## 状态机图

适用于订单状态、工作流状态等：

```javascript
const graph = new Graph({ container: 'container', background: { color: '#F2F7FA' } });

const states = [
  { id: 'pending', x: 60, y: 120, label: 'Pending', color: '#fa8c16', bg: '#fff7e6' },
  { id: 'paid', x: 200, y: 120, label: 'Paid', color: '#1890ff', bg: '#e6f7ff' },
  { id: 'shipping', x: 340, y: 120, label: 'Shipping', color: '#722ed1', bg: '#f9f0ff' },
  { id: 'done', x: 480, y: 120, label: 'Done', color: '#52c41a', bg: '#f6ffed' },
];

const nodes = states.map(s => graph.addNode({
  id: s.id, shape: 'circle', x: s.x, y: s.y, width: 70, height: 70, label: s.label,
  attrs: { body: { stroke: s.color, strokeWidth: 2, fill: s.bg } },
}));

const transitions = [
  { from: 'pending', to: 'paid', label: 'pay' },
  { from: 'paid', to: 'shipping', label: 'ship' },
  { from: 'shipping', to: 'done', label: 'confirm' },
];

transitions.forEach(t => {
  graph.addEdge({
    source: t.from, target: t.to, label: t.label,
    attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } },
  });
});
```

## 组织架构图

使用 `router: 'orth'` 实现树形层级：

```javascript
const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
});

const createPerson = (x, y, name, title, color) => {
  return graph.addNode({
    shape: 'rect',
    x,
    y,
    width: 130,
    height: 50,
    attrs: {
      body: { fill: '#fff', stroke: color, strokeWidth: 2, rx: 6, ry: 6 },
      label: { text: `${name}\n${title}`, fontSize: 11, lineHeight: 16 },
    },
  });
};

const ceo = createPerson(310, 30, 'John', 'CEO', '#722ed1');
const cto = createPerson(120, 140, 'Alice', 'CTO', '#1890ff');
const cfo = createPerson(490, 140, 'Bob', 'CFO', '#faad14');
const lead1 = createPerson(40, 260, 'Carol', 'FE Lead', '#1890ff');
const lead2 = createPerson(200, 260, 'Dave', 'BE Lead', '#1890ff');
const acc = createPerson(430, 260, 'Eve', 'Accounting', '#faad14');
const fin = createPerson(570, 260, 'Frank', 'Finance', '#faad14');

const edgeStyle = { attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: null } }, router: 'orth', connector: 'rounded' };

graph.addEdge({ source: ceo, target: cto, ...edgeStyle });
graph.addEdge({ source: ceo, target: cfo, ...edgeStyle });
graph.addEdge({ source: cto, target: lead1, ...edgeStyle });
graph.addEdge({ source: cto, target: lead2, ...edgeStyle });
graph.addEdge({ source: cfo, target: acc, ...edgeStyle });
graph.addEdge({ source: cfo, target: fin, ...edgeStyle });
```

## 泳道图

用大矩形节点作为泳道背景，流程节点置于不同泳道中：

```javascript
const graph = new Graph({ container: 'container', background: { color: '#F2F7FA' } });

// 泳道背景（低 zIndex）
graph.addNode({
  shape: 'rect', x: 20, y: 20, width: 560, height: 100, zIndex: 0,
  label: 'Sales Dept',
  attrs: { body: { fill: '#e6f7ff', stroke: '#91d5ff', rx: 6, ry: 6 }, label: { refX: 30, refY: 0.5, textAnchor: 'start' } },
});

graph.addNode({
  shape: 'rect', x: 20, y: 130, width: 560, height: 100, zIndex: 0,
  label: 'Tech Dept',
  attrs: { body: { fill: '#f6ffed', stroke: '#b7eb8f', rx: 6, ry: 6 }, label: { refX: 30, refY: 0.5, textAnchor: 'start' } },
});

// 流程节点（高 zIndex）
const task1 = graph.addNode({
  shape: 'rect', x: 140, y: 50, width: 100, height: 36, zIndex: 2, label: 'Receive',
  attrs: { body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 4, ry: 4 } },
});

const task2 = graph.addNode({
  shape: 'rect', x: 340, y: 160, width: 100, height: 36, zIndex: 2, label: 'Develop',
  attrs: { body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 4, ry: 4 } },
});

graph.addEdge({ source: task1, target: task2, router: 'orth', connector: 'rounded', attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } } });
```

## 使用 fromJSON 批量加载图数据

使用 `graph.fromJSON` 方法可以一次性加载完整的图结构，包括节点和边。注意以下几点：

- `container` 必须是 DOM 元素或其 ID 字符串
- 不需要手动调用 `graph.render()`，`fromJSON` 会自动渲染
- 节点和边的属性应符合 X6 规范

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
});

graph.fromJSON({
  nodes: [
    {
      id: 'start',
      shape: 'rect',
      x: 200,
      y: 20,
      width: 100,
      height: 40,
      label: 'Start',
      attrs: {
        body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
      },
    },
    {
      id: 'left',
      shape: 'rect',
      x: 80,
      y: 120,
      width: 100,
      height: 40,
      label: 'Branch A',
      attrs: {
        body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
      },
    },
    {
      id: 'right',
      shape: 'rect',
      x: 320,
      y: 120,
      width: 100,
      height: 40,
      label: 'Branch B',
      attrs: {
        body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
      },
    },
    {
      id: 'end',
      shape: 'rect',
      x: 200,
      y: 220,
      width: 100,
      height: 40,
      label: 'End',
      attrs: {
        body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
      },
    },
  ],
  edges: [
    { source: 'start', target: 'left', attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1 } } },
    { source: 'start', target: 'right', attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1 } } },
    { source: 'left', target: 'end', attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1 } } },
    { source: 'right', target: 'end', attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1 } } },
  ],
});

graph.centerContent();
```

## 常见错误与修正

### 错误：graph.render is not a function

**错误代码示例：**

```javascript
const graph = new Graph({ container: 'container' });
graph.fromJSON(data);
graph.render(); // ❌ 错误：graph.render is not a function
```

**原因分析：**
X6 的 `Graph` 实例没有 `render` 方法。使用 `fromJSON` 加载数据后会自动渲染，无需手动调用。

**正确做法：**

```javascript
const graph = new Graph({ container: 'container' });
graph.fromJSON(data); // ✅ 正确：自动渲染
// graph.centerContent(); // 可选：居中内容
```

### 错误：在代码中声明 `const container`

**错误代码示例：**

```javascript
// ❌ 错误：重复声明 container 变量（运行环境已注入）
const container = document.getElementById('container');
const graph = new Graph({ container }); // 报错：Identifier 'container' has already been declared
```

**正确做法：**

```javascript
// ✅ 正确：直接使用字符串 'container'
const graph = new Graph({ container: 'container' });
```

### 错误：节点或边属性格式不正确

**错误代码示例：**

```javascript
// 错误的边定义
{
  id: 'edge1',
  source: 'node1',
  target: 'node2',
  label: '连接' // ❌ 错误：label 应在 attrs 中定义或使用 labels 数组
}
```

**正确做法：**

```javascript
// 正确的边定义
{
  source: 'node1',
  target: 'node2',
  label: '连接', // ✅ 在 fromJSON 中可以直接使用 label
  attrs: {
    line: { stroke: '#8f8f8f', strokeWidth: 1 }
  }
}
```

### 错误：使用了 graph.render() 导致运行时报错

**错误代码示例：**

```javascript
import { Graph } from '@antv/x6'

const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
})

const data = {
  nodes: [...],
  edges: [...]
}

graph.fromJSON(data)
graph.render() // ❌ 错误：graph.render is not a function
```

**原因分析：**
X6 Graph 实例没有 `render` 方法，调用会导致运行时错误。`fromJSON` 方法会自动完成图的渲染。

**正确做法：**

```javascript
import { Graph } from '@antv/x6'

const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
})

graph.fromJSON(data) // ✅ 正确：自动渲染
graph.centerContent() // 可选：居中内容
```

### 错误：导入了不存在的模块或使用了不支持的插件

**错误代码示例：**

```javascript
import { Graph, Shape, Addon } from '@antv/x6' // ❌ 错误：导入了不存在的模块

const graph = new Graph({
  container: 'container',
  plugins: [
    new Addon.Selection({ // ❌ 错误：插件不支持或导入错误
      enabled: true,
      multiple: true,
      rubberband: true,
      modifiers: 'shift',
    }),
  ],
})
```

**原因分析：**
X6 的模块结构中没有 `Shape` 和 `Addon` 模块。插件需要通过 `@antv/x6-plugin-*` 系列包引入。

**正确做法：**

```javascript
import { Graph } from '@antv/x6'

const graph = new Graph({
  container: 'container',
  // 插件需要通过独立包引入，如 @antv/x6-plugin-selection
})
```

### 错误：使用了嵌套节点但未正确配置嵌套关系

**错误代码示例：**

```javascript
const parentNode = graph.addNode({ ... })
const childNode = graph.addNode({ ... })

parentNode.addChild(childNode) // ❌ 错误：未正确配置嵌套关系
```

**原因分析：**
X6 中嵌套节点需要在创建时通过 `parent` 属性指定父节点，或通过 `embedding` 插件进行管理。

**正确做法：**

```javascript
const parentNode = graph.addNode({ id: 'parent', ... })
const childNode = graph.addNode({ parent: 'parent', ... }) // ✅ 正确：通过 parent 属性指定
```
</skill>