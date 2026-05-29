---
id: "x6-intermediate-connection-point"
title: "X6 连接点与锚点"
description: |
  X6 锚点（Anchor）和连接点（ConnectionPoint）完整指南。
  包含内置锚点类型、连接点计算方式、全局配置与单边配置、自定义锚点和连接点。

library: "x6"
version: "3.x"
category: "intermediate"
subcategory: "connection-point"
tags:
  - "连接点"
  - "connectionPoint"
  - "锚点"
  - "anchor"
  - "nodeAnchor"
  - "sourceAnchor"
  - "targetAnchor"
  - "boundary"
  - "bbox"
  - "rect"
  - "center"
  - "top"
  - "bottom"
  - "left"
  - "right"
  - "midSide"
  - "orth"

related:
  - "x6-core-edge"
  - "x6-core-ports"
  - "x6-core-graph-init"

use_cases:
  - "控制边与节点的精确连接位置"
  - "实现多条边连接到同一节点时的间隔分布"
  - "设置边连接到节点的特定方向（上下左右）"
  - "自定义连接点计算方式"

anti_patterns:
  - "不要混淆 anchor（锚点）和 connectionPoint（连接点）的概念"
  - "不要混淆 port 和 anchor——port 是连接桩，anchor 是锚点位置"
---

# X6 连接点与锚点

## 核心概念

- **锚点（Anchor）**：边在节点上的参考点位置（如中心、顶部、左侧等）
- **连接点（ConnectionPoint）**：根据锚点和参考线计算得到的边的实际起点/终点

默认情况下：
- 锚点为 `center`（节点中心）
- 连接点为 `boundary`（参考线与节点边框的交点）

## 使用方式

### 方式一：全局配置（Graph.connecting）

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  connecting: {
    // 全局锚点配置
    sourceAnchor: 'right',
    targetAnchor: 'left',
    // 全局连接点配置
    connectionPoint: 'anchor',
  },
});
```

### 方式二：单边配置（优先级更高）

```javascript
graph.addEdge({
  source: {
    cell: 'node1',
    anchor: {
      name: 'right',
      args: { dy: -10 },
    },
    connectionPoint: 'anchor',
  },
  target: {
    cell: 'node2',
    anchor: {
      name: 'left',
      args: { dy: -10 },
    },
    connectionPoint: 'anchor',
  },
});
```

## 内置锚点类型

| 锚点 | 位置 | 说明 |
|------|------|------|
| `center` | 节点中心 | 默认值 |
| `top` | 顶部中心 | |
| `bottom` | 底部中心 | |
| `left` | 左侧中心 | |
| `right` | 右侧中心 | |
| `topLeft` | 左上角 | |
| `topRight` | 右上角 | |
| `bottomLeft` | 左下角 | |
| `bottomRight` | 右下角 | |
| `midSide` | 最近侧中心 | 自动选择离参考线最近的一侧 |
| `orth` | 正交点 | 保证连线垂直/水平连接 |
| `nodeCenter` | 节点中心 | 始终为节点几何中心 |

### 锚点参数

所有锚点都支持以下参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `dx` | number \| string | 0 | X 轴偏移量（支持百分比） |
| `dy` | number \| string | 0 | Y 轴偏移量（支持百分比） |
| `rotate` | boolean | false | 是否跟随节点旋转 |

### midSide 额外参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `padding` | number | 0 | 偏移量 |
| `direction` | `'H'` \| `'V'` | - | 限制方向（H=只连左右，V=只连上下） |

## 内置连接点类型

| 连接点 | 说明 |
|--------|------|
| `boundary` | 默认。参考线与节点边框的交点 |
| `bbox` | 参考线与包围盒的交点 |
| `rect` | 参考线与旋转后矩形的交点 |
| `anchor` | 直接使用锚点作为连接点（不计算交点） |

### boundary 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `offset` | number \| Point | 0 | 偏移量 |
| `stroked` | boolean | true | 是否考虑边框宽度 |
| `sticky` | boolean | false | 无交点时使用最近点 |
| `selector` | string | - | 指定用于计算的子元素 |

## 常用配置组合

### DAG 左右连接

```javascript
const graph = new Graph({
  container: 'container',
  connecting: {
    sourceAnchor: 'right',
    targetAnchor: 'left',
    connectionPoint: 'anchor',
    router: 'orth',
    connector: 'rounded',
  },
});
```

### 多条边分散连接（midSide）

```javascript
const graph = new Graph({
  container: 'container',
  connecting: {
    anchor: 'midSide',
    connectionPoint: 'boundary',
  },
});
```

### 正交连接（orth anchor）

保证边从节点的正交方向（上下左右最近侧）连出：

```javascript
const graph = new Graph({
  container: 'container',
  connecting: {
    anchor: 'orth',
    connectionPoint: 'anchor',
    router: 'orth',
    connector: 'rounded',
  },
});
```

### 带偏移的锚点

```javascript
graph.addEdge({
  source: {
    cell: 'node1',
    anchor: { name: 'right', args: { dy: -15 } },  // 右侧偏上
    connectionPoint: 'anchor',
  },
  target: {
    cell: 'node2',
    anchor: { name: 'left', args: { dy: -15 } },   // 左侧偏上
    connectionPoint: 'anchor',
  },
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } },
});

graph.addEdge({
  source: {
    cell: 'node1',
    anchor: { name: 'right', args: { dy: 15 } },   // 右侧偏下
    connectionPoint: 'anchor',
  },
  target: {
    cell: 'node2',
    anchor: { name: 'left', args: { dy: 15 } },    // 左侧偏下
    connectionPoint: 'anchor',
  },
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } },
});
```

## 自定义连接点

```javascript
Graph.registerConnectionPoint(
  'custom-cp',
  (line, view, magnet, args) => {
    // line: 参考线
    // view: 节点视图
    // magnet: 连接的 SVG 元素
    // 返回 Point { x, y }
    const { offset = 0 } = args;
    const bbox = view.getBBox();
    return { x: bbox.x + bbox.width + offset, y: bbox.y + bbox.height / 2 };
  },
  true,
);

// 使用
new Graph({
  connecting: {
    connectionPoint: { name: 'custom-cp', args: { offset: 5 } },
  },
});
```

## 动态修改锚点

```javascript
const edge = graph.addEdge({ source: 'node1', target: 'node2' });

// 修改源锚点
edge.setSource({
  cell: 'node1',
  anchor: { name: 'bottom', args: { dx: 10 } },
  connectionPoint: 'anchor',
});

// 修改目标锚点
edge.setTarget({
  cell: 'node2',
  anchor: 'top',
  connectionPoint: 'boundary',
});
```

## 常见错误

### ❌ 混淆 anchor 和 connectionPoint

```javascript
// 错误：以为 anchor:'right' 就能让边从右侧出发（但默认 connectionPoint 是 boundary，会重新计算交点）
graph.addEdge({
  source: { cell: 'node1', anchor: 'right' },
  target: { cell: 'node2', anchor: 'left' },
});
// 边可能不会精确从右侧中心连出

// 正确：配合 connectionPoint:'anchor' 使用，跳过交点计算
graph.addEdge({
  source: { cell: 'node1', anchor: 'right', connectionPoint: 'anchor' },
  target: { cell: 'node2', anchor: 'left', connectionPoint: 'anchor' },
});
```

### ❌ 混淆 port 和 anchor

```javascript
// port 是连接桩（节点上的连接点 UI），anchor 是边连接位置的计算方式
// 有 port 时 source/target 使用 port 字段：
graph.addEdge({
  source: { cell: 'node1', port: 'out-1' },  // 连接到 port
  target: { cell: 'node2', port: 'in-1' },
});

// 无 port 时使用 anchor 字段控制连接位置：
graph.addEdge({
  source: { cell: 'node1', anchor: 'right' },  // 连接到锚点
  target: { cell: 'node2', anchor: 'left' },
});
```
