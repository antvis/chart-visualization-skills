---
id: "x6-intermediate-custom-edge"
title: "X6 自定义边"
description: |
  X6 自定义边完整指南：Graph.registerEdge 注册自定义边、markup/attrs 定制边的外观。
  包含继承内置边、自定义路由器、自定义连接器、注册自定义边。

library: "x6"
version: "3.x"
category: "intermediate"
subcategory: "custom-edge"
tags:
  - "自定义边"
  - "registerEdge"
  - "Graph.registerEdge"
  - "markup"
  - "attrs"
  - "inherit"
  - "edge"
  - "shape"
  - "自定义连线"
  - "router"
  - "connector"

related:
  - "x6-core-edge"
  - "x6-core-graph-init"
  - "x6-intermediate-custom-node"

use_cases:
  - "注册带有固定样式的自定义边"
  - "创建带有多条线段的复合边"
  - "注册自定义路由器"
  - "注册自定义连接器"
  - "创建虚线、动画流动边等特殊效果"

anti_patterns:
  - "不要忘记 Graph.registerEdge 第三个参数传 true 以允许覆盖"
  - "自定义路由器必须返回点数组"
---

# X6 自定义边

## Graph.registerEdge — 注册自定义边

与注册自定义节点类似，通过 `Graph.registerEdge` 注册可复用的边类型。

### 基本注册

```javascript
import { Graph } from '@antv/x6';

Graph.registerEdge(
  'custom-edge',
  {
    inherit: 'edge',  // 继承内置 edge
    attrs: {
      line: {
        stroke: '#1890ff',
        strokeWidth: 2,
        targetMarker: 'classic',
      },
    },
    router: 'orth',
    connector: 'rounded',
  },
  true,
);

const graph = new Graph({ container: 'container', width: 800, height: 600 });

graph.addEdge({
  shape: 'custom-edge',
  source: 'node1',
  target: 'node2',
});
```

### 虚线边

```javascript
Graph.registerEdge(
  'dashed-edge',
  {
    inherit: 'edge',
    attrs: {
      line: {
        stroke: '#888',
        strokeWidth: 1,
        strokeDasharray: '5 3',
        targetMarker: 'classic',
      },
    },
  },
  true,
);
```

### 带标签的流程边

```javascript
Graph.registerEdge(
  'flow-edge',
  {
    inherit: 'edge',
    attrs: {
      line: {
        stroke: '#8f8f8f',
        strokeWidth: 1,
        targetMarker: 'classic',
      },
    },
    router: 'orth',
    connector: 'rounded',
    defaultLabel: {
      markup: [
        { tagName: 'rect', selector: 'labelBody' },
        { tagName: 'text', selector: 'labelText' },
      ],
      attrs: {
        labelBody: {
          ref: 'labelText',
          refX: -5,
          refY: -3,
          refWidth: '100%',
          refHeight: '100%',
          refWidth2: 10,
          refHeight2: 6,
          fill: '#fff',
          stroke: '#d9d9d9',
          strokeWidth: 1,
          rx: 3,
          ry: 3,
        },
        labelText: {
          fontSize: 12,
          fill: '#333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
      position: { distance: 0.5 },
    },
  },
  true,
);

graph.addEdge({
  shape: 'flow-edge',
  source: node1,
  target: node2,
  label: 'Yes',
});
```

### 双线边（复合 markup）

```javascript
Graph.registerEdge(
  'double-edge',
  {
    inherit: 'edge',
    markup: [
      {
        tagName: 'path',
        selector: 'outline',
        attrs: { fill: 'none' },
      },
      {
        tagName: 'path',
        selector: 'line',
        attrs: { fill: 'none' },
      },
    ],
    attrs: {
      outline: {
        connection: true,
        stroke: '#ccc',
        strokeWidth: 8,
      },
      line: {
        connection: true,
        stroke: '#1890ff',
        strokeWidth: 2,
        targetMarker: 'classic',
      },
    },
  },
  true,
);
```

## 自定义路由器（Router）

路由器对路径点进一步处理，在必要时添加额外的点使边按特定规则行走。

```javascript
Graph.registerRouter(
  'custom-router',
  (vertices, args, view) => {
    // vertices: 用户定义的路径点
    // 返回处理后的点数组
    const { offset = 20 } = args;
    const points = [];
    const source = view.sourceAnchor;
    const target = view.targetAnchor;

    // 示例：从 source 先向右走，再转到 target
    points.push({ x: source.x + offset, y: source.y });
    points.push({ x: source.x + offset, y: target.y });

    return points;
  },
  true,
);

// 使用
graph.addEdge({
  source: node1,
  target: node2,
  router: { name: 'custom-router', args: { offset: 40 } },
});
```

## 自定义连接器（Connector）

连接器将路由器返回的点加工成 SVG pathData。

```javascript
Graph.registerConnector(
  'wobble',
  (sourcePoint, targetPoint, routePoints, args) => {
    // 返回 SVG path 字符串
    const { amplitude = 10 } = args;
    const points = [sourcePoint, ...routePoints, targetPoint];
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const midX = (points[i - 1].x + points[i].x) / 2;
      const dy = i % 2 === 0 ? amplitude : -amplitude;
      path += ` Q ${midX} ${points[i - 1].y + dy} ${points[i].x} ${points[i].y}`;
    }
    return path;
  },
  true,
);

// 使用
graph.addEdge({
  source: node1,
  target: node2,
  connector: { name: 'wobble', args: { amplitude: 8 } },
});
```

## 在 connecting 中指定默认边类型

当用户通过交互拖拽创建边时，可以通过 `createEdge` 指定默认边类型：

```javascript
const graph = new Graph({
  container: 'container',
  connecting: {
    allowBlank: false,
    router: 'orth',
    connector: 'rounded',
    createEdge() {
      return this.createEdge({
        shape: 'custom-edge',  // 使用注册的自定义边
        attrs: {
          line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' },
        },
      });
    },
  },
});
```

## 动态修改已注册边的属性

```javascript
const edge = graph.addEdge({ shape: 'custom-edge', source: node1, target: node2 });

// 修改线条颜色
edge.attr('line/stroke', '#f5222d');

// 修改路由器
edge.setRouter('manhattan');

// 修改连接器
edge.setConnector('smooth');

// 修改标签
edge.setLabels([{ attrs: { labelText: { text: 'Updated' } } }]);
```

## 常见错误

### ❌ 重复注册未传覆盖参数

```javascript
// 错误：第二次注册同名 edge 报错
Graph.registerEdge('my-edge', { ... });
Graph.registerEdge('my-edge', { ... }); // Error

// 正确：第三个参数 true 允许覆盖
Graph.registerEdge('my-edge', { ... }, true);
```

### ❌ 自定义路由器未返回数组

```javascript
// 错误：router 必须返回点数组
Graph.registerRouter('bad-router', (vertices) => {
  return { x: 100, y: 100 }; // ❌ 返回单个点
});

// 正确：返回点数组
Graph.registerRouter('good-router', (vertices) => {
  return [{ x: 100, y: 100 }]; // ✅
}, true);
```
