---
id: "x6-intermediate-tools"
title: "X6 工具（Tools）"
description: |
  X6 节点和边的小工具配置指南。
  包含内置工具（button、button-remove、boundary、vertices、segments、node-editor、edge-editor、arrowhead）及自定义工具。

library: "x6"
version: "3.x"
category: "intermediate"
subcategory: "tools"
tags:
  - "工具"
  - "tools"
  - "button"
  - "button-remove"
  - "删除按钮"
  - "boundary"
  - "vertices"
  - "segments"
  - "node-editor"
  - "edge-editor"
  - "arrowhead"
  - "source-arrowhead"
  - "target-arrowhead"
  - "小工具"
  - "交互"

related:
  - "x6-core-node"
  - "x6-core-edge"
  - "x6-core-events"

use_cases:
  - "为节点添加删除按钮"
  - "为边添加路径点编辑工具"
  - "双击编辑节点/边文本"
  - "拖拽修改边的起点或终点"
  - "hover 时显示工具"

anti_patterns:
  - "不要忘记在 mouseleave 时移除动态添加的工具"
  - "node-editor 不再需要传入 event 参数（2.8.0+）"
---

# X6 工具（Tools）

工具是渲染在节点/边上的小部件，用于增强交互能力，如删除按钮、路径点编辑、文本编辑等。

## 添加工具

### 创建时添加

```javascript
// 节点工具
graph.addNode({
  shape: 'rect',
  x: 40,
  y: 40,
  width: 100,
  height: 40,
  label: 'Node',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', strokeWidth: 1, rx: 6, ry: 6 } },
  tools: [
    {
      name: 'button-remove',
      args: { x: '100%', y: 0, offset: { x: -10, y: 10 } },
    },
  ],
});

// 边工具
graph.addEdge({
  source: node1,
  target: node2,
  tools: ['vertices', 'segments'],
});
```

### 动态添加/移除

```javascript
// 添加工具
node.addTools([{ name: 'button-remove', args: { x: 10, y: 10 } }]);

// 检查是否有某工具
node.hasTool('button-remove'); // true

// 移除指定工具
node.removeTool('button-remove');

// 移除所有工具
node.removeTools();
```

### Hover 时显示工具

```javascript
graph.on('node:mouseenter', ({ node }) => {
  node.addTools([
    { name: 'boundary' },
    { name: 'button-remove', args: { x: '100%', y: 0, offset: { x: -10, y: 10 } } },
  ]);
});

graph.on('node:mouseleave', ({ node }) => {
  node.removeTools();
});

graph.on('edge:mouseenter', ({ edge }) => {
  edge.addTools([
    { name: 'vertices' },
    { name: 'button-remove', args: { distance: 20 } },
  ]);
});

graph.on('edge:mouseleave', ({ edge }) => {
  edge.removeTools();
});
```

## 节点内置工具

### button — 自定义按钮

在节点指定位置渲染一个按钮，支持自定义点击交互。

```javascript
node.addTools({
  name: 'button',
  args: {
    x: 0,
    y: 0,
    offset: { x: 18, y: 18 },
    markup: [
      { tagName: 'circle', selector: 'button', attrs: { r: 8, fill: '#1890ff', cursor: 'pointer' } },
      { tagName: 'text', selector: 'icon', attrs: { fill: '#fff', fontSize: 12, textAnchor: 'middle', dominantBaseline: 'central', text: '+' } },
    ],
    onClick({ cell }) {
      console.log('Button clicked on', cell.id);
    },
  },
});
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `x` | number \| string | X 坐标（百分比表示相对位置） |
| `y` | number \| string | Y 坐标 |
| `offset` | `{ x, y }` | 在 x/y 基础上的偏移 |
| `markup` | Markup | 按钮的 SVG 结构 |
| `onClick` | Function | 点击回调 `({ e, cell, view }) => void` |

### button-remove — 删除按钮

button 的特例，点击时删除对应节点。支持 button 的所有配置。

```javascript
graph.addNode({
  shape: 'rect',
  x: 40,
  y: 40,
  width: 100,
  height: 40,
  label: 'Delete me',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', strokeWidth: 1, rx: 6, ry: 6 } },
  tools: [
    {
      name: 'button-remove',
      args: { x: '100%', y: 0, offset: { x: -10, y: 10 } },
    },
  ],
});
```

### boundary — 包围框

根据节点包围盒渲染一个矩形，仅用于可视化，不带交互。

```javascript
node.addTools({
  name: 'boundary',
  args: {
    padding: 5,
    attrs: {
      fill: '#7c68fc',
      stroke: '#333',
      'stroke-width': 1,
      'fill-opacity': 0.2,
    },
  },
});
```

### node-editor — 文本编辑

提供节点上文本编辑功能，双击节点即可编辑文本。

```javascript
// 添加 node-editor 工具（2.8.0+ 无需传 event）
node.addTools({
  name: 'node-editor',
});

// 自定义 markup 时需指定 getText/setText
node.addTools({
  name: 'node-editor',
  args: {
    getText: 'attrs/label/text',  // 属性路径
    setText: 'attrs/label/text',
  },
});
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `getText` | string \| Function | 获取文本的属性路径或方法 |
| `setText` | string \| Function | 设置文本的属性路径或方法 |
| `attrs/fontSize` | string | 编辑字体大小，默认 14 |
| `attrs/color` | string | 字体颜色，默认 #000 |

## 边内置工具

### vertices — 路径点编辑

在路径点位置渲染小圆点，支持拖动修改位置、双击删除、单击边添加路径点。

```javascript
graph.addEdge({
  source: node1,
  target: node2,
  vertices: [{ x: 200, y: 100 }],
  tools: [
    {
      name: 'vertices',
      args: { attrs: { fill: '#666' }, snapRadius: 20 },
    },
  ],
});
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `snapRadius` | number | 20 | 路径点吸附半径 |
| `addable` | boolean | true | 是否可添加路径点 |
| `removable` | boolean | true | 双击是否可删除 |

### segments — 线段工具

在每条线段中心渲染工具条，拖动可调整线段两端路径点位置。

```javascript
graph.addEdge({
  source: node1,
  target: node2,
  router: 'orth',
  connector: 'rounded',
  tools: ['segments'],
});
```

### button-remove（边）

在边的指定位置渲染删除按钮。

```javascript
edge.addTools({
  name: 'button-remove',
  args: { distance: 20 },  // 距离起点的距离
});
```

### source-arrowhead / target-arrowhead

在边的起点或终点渲染箭头图形，拖动可修改边的起点/终点。

```javascript
edge.addTools([
  'source-arrowhead',
  'target-arrowhead',
]);
```

### edge-editor — 边文本编辑

双击边即可编辑边上的文本标签。

```javascript
edge.addTools({
  name: 'edge-editor',
  args: {
    attrs: { fontSize: 14, color: '#333' },
  },
});
```

## 常见模式

### 选中时显示工具，取消选中时移除

```javascript
graph.on('node:selected', ({ node }) => {
  node.addTools([
    { name: 'boundary' },
    { name: 'button-remove', args: { x: '100%', y: 0, offset: { x: -10, y: 10 } } },
  ]);
});

graph.on('node:unselected', ({ node }) => {
  node.removeTools();
});
```

### 双击编辑节点文本

```javascript
graph.on('node:dblclick', ({ node }) => {
  node.addTools({ name: 'node-editor' });
});
```

## 常见错误与修正

### ❌ 在 mouseenter 添加工具但忘记在 mouseleave 移除

```javascript
// 错误：工具会无限累积
graph.on('node:mouseenter', ({ node }) => {
  node.addTools([{ name: 'button-remove' }]);
});
// 缺少 mouseleave 处理

// 正确：配对使用
graph.on('node:mouseenter', ({ node }) => {
  node.addTools([{ name: 'button-remove', args: { x: '100%', y: 0, offset: { x: -10, y: 10 } } }]);
});
graph.on('node:mouseleave', ({ node }) => {
  node.removeTools();
});
```

### ❌ 错误使用 graph.render() 方法

```javascript
// 错误：Graph 实例没有 render 方法
const graph = new Graph({ ... });
graph.render(); // ❌ 报错：graph.render is not a function

// 正确：Graph 构造函数会自动渲染，无需手动调用 render()
const graph = new Graph({ ... });
```

### ❌ 工具配置方式错误

```javascript
// 错误：在事件中动态添加 vertices 和 segments 工具
graph.on('edge:mouseenter', ({ cell }) => {
  cell.addTools([
    'vertices',
    'segments'
  ])
})

// 正确：在创建边时直接配置工具
graph.addEdge({
  source: node1,
  target: node2,
  tools: ['vertices', 'segments'],
});
```

### ❌ 错误地使用了 tools.items 配置结构

```javascript
// 错误：tools 配置应为数组，而不是对象
const edge = graph.addEdge({
  source: 'source',
  target: 'target',
  tools: {
    items: [
      { name: 'vertices' },
      { name: 'segments' }
    ]
  }
})

// 正确：tools 应为数组形式
const edge = graph.addEdge({
  source: 'source',
  target: 'target',
  tools: [
    'vertices',
    'segments'
  ]
})
```

### ❌ 错误地为边添加工具时使用了错误的配置格式

```javascript
// 错误：tools 配置应该是一个数组，而不是对象
const edge = graph.addEdge({
  source: 'source',
  target: 'target',
  tools: {
    name: 'segments'
  }
})

// 正确：tools 应为数组形式
const edge = graph.addEdge({
  source: 'source',
  target: 'target',
  tools: [
    'segments'
  ]
})
```

### ❌ 错误地在 Graph 实例上调用 render 方法

```javascript
// 错误：Graph 实例没有 render 方法
const graph = new Graph({ ... });
graph.render(); // ❌ 报错：graph.render is not a function

// 正确：Graph 构造函数会自动渲染，无需手动调用 render()
const graph = new Graph({ ... });
```

### ❌ 错误地在 createEdge 中使用了错误的 tools 配置格式

```javascript
// 错误：createEdge 中 tools 配置应为数组，而不是对象
graph.options.connecting = {
  createEdge() {
    return graph.createEdge({
      shape: 'edge',
      tools: {
        items: [
          'vertices',
          'segments'
        ]
      }
    })
  }
}

// 正确：tools 应为数组形式
graph.options.connecting = {
  createEdge() {
    return graph.createEdge({
      shape: 'edge',
      tools: [
        'vertices',
        'segments'
      ]
    })
  }
}
```

### ❌ 未正确处理节点选中状态导致工具重复添加

```javascript
// 错误：每次点击都会添加边界工具，未清理已有工具
graph.on('node:click', ({ node }) => {
  node.addTools([
    { name: 'boundary' }
  ]);
});

// 正确：先清除已有工具再添加
graph.on('node:click', ({ node }) => {
  graph.getNodes().forEach((n) => n.removeTools());
  node.addTools([
    { name: 'boundary' }
  ]);
});
```

### ❌ 语法错误或不完整的代码片段

```javascript
// 错误：代码不完整导致语法错误
const node2 = graph.addNode({
  shape: 'rect',
  x: 300,
  y: 100,
  width: 10  graph.addEdge({ // ❌ 语法错误
  source: node1,
  target: node2,
  attrs: {
    line: { stroke: '#8f8f8f', strokeWidth: 1 },
  },
});

// 正确：确保代码语法完整
const node2 = graph.addNode({
  shape: 'rect',
  x: 300,
  y: 100,
  width: 100,
  height: 40,
  label: 'Node 2',
  attrs: {
    body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
  },
});

graph.addEdge({
  source: node1,
  target: node2,
  attrs: {
    line: { stroke: '#8f8f8f', strokeWidth: 1 },
  },
});
```

### ❌ 错误地使用 Selection 插件并尝试访问 node.selected 事件

```javascript
// 错误：Selection 插件不会触发 node:selected 事件，且 Selection 插件未正确导入
import { Graph, Selection } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
  plugins: [
    new Selection({
      enabled: true,
      showNodeSelectionBox: true,
    }),
  ],
});

graph.on('node:selected', ({ node }) => {
  node.addTools([
    {
      name: 'boundary',
      args: {
        attrs: {
          stroke: '#31d0c6',
          strokeWidth: 1,
          strokeDasharray: '5 5',
        },
      },
    },
  ]);
});

// 正确：使用 click 事件代替 selected 事件，并移除 Selection 插件
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
});

graph.on('node:click', ({ node }) => {
  graph.getNodes().forEach((n) => n.removeTools());
  node.addTools([
    {
      name: 'boundary',
      args: {
        padding: 6,
        attrs: {
          fill: 'none',
          stroke: '#1890ff',
          strokeWidth: 1,
          strokeDasharray: '5 3',
        },
      },
    },
  ]);
});
```

### ❌ 错误地在 addTools 时传入了错误的数据结构

```javascript
// 错误：addTools 接收的是数组，而不是对象
node.addTools({
  name: 'boundary',
  args: {
    attrs: {
      stroke: '#31d0c6',
      strokeWidth: 1,
      strokeDasharray: '5 5',
    },
  },
});

// 正确：addTools 应该接收数组
node.addTools([
  {
    name: 'boundary',
    args: {
      attrs: {
        stroke: '#31d0c6',
        strokeWidth: 1,
        strokeDasharray: '5 5',
      },
    },
  },
]);
```

## 最小可运行示例

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
});

const source = graph.addNode({
  shape: 'rect',
  x: 40,
  y: 40,
  width: 100,
  height: 40,
  label: 'Source',
  tools: ['button-remove'],
  attrs: {
    body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
  },
});

const target = graph.addNode({
  shape: 'rect',
  x: 160,
  y: 240,
  width: 100,
  height: 40,
  label: 'Target',
  tools: ['button-remove'],
  attrs: {
    body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
  },
});

graph.addEdge({
  source: source,
  target: target,
  vertices: [
    { x: 90, y: 160 },
    { x: 210, y: 160 },
  ],
  tools: ['vertices', 'segments'],
  attrs: {
    line: { stroke: '#8f8f8f', strokeWidth: 1 },
  },
});
```