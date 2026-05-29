---
id: "x6-core-anchor"
title: "X6 锚点（Anchor）"
description: |
  边连接到节点/边时的锚点定位策略。
  包含 nodeAnchor（节点锚点）和 edgeAnchor（边锚点）两类，控制连线端点在目标元素上的精确位置。

library: "x6"
version: "3.x"
category: "core"
subcategory: "anchor"
tags:
  - "anchor"
  - "锚点"
  - "nodeAnchor"
  - "edgeAnchor"
  - "连线端点"
  - "center"
  - "top"
  - "bottom"
  - "left"
  - "right"
  - "midSide"
  - "orth"
  - "ratio"

related:
  - "x6-core-edge"
  - "x6-intermediate-connection-point"
  - "x6-core-ports"

use_cases:
  - "控制连线连接到节点的哪个位置"
  - "设置边连接到另一条边的锚点"
  - "正交布局中自动对齐连线端点"
  - "连线从节点中心/边缘/最近侧连出"

difficulty: "intermediate"
completeness: "full"
---

## 核心概念

**Anchor（锚点）** 决定连线端点在目标元素上的参考位置。X6 中有两类锚点：

- **nodeAnchor**：边连接到节点时的锚点位置
- **edgeAnchor**：边连接到另一条边时的锚点位置

锚点与 connectionPoint 配合使用：anchor 确定参考点，connectionPoint 确定最终连接位置（通常是 anchor 到节点边界的交点）。

## 节点锚点（Node Anchor）

### 配置方式

在边的 `source` / `target` 中通过 `anchor` 字段设置：

```javascript
graph.addEdge({
  source: { cell: node1, anchor: 'center' },
  target: { cell: node2, anchor: { name: 'midSide', args: { direction: 'H' } } },
});
```

也可在 Graph 的 `connecting` 中设置全局默认：

```javascript
const graph = new Graph({
  container: 'container',
  connecting: {
    anchor: 'center', // 全局默认节点锚点
  },
});
```

### 内置节点锚点

| 名称 | 说明 | 参数 |
|------|------|------|
| `center` | 节点 BBox 中心（**默认值**） | `dx`, `dy`, `rotate` |
| `top` | 节点顶部中心 | `dx`, `dy`, `rotate` |
| `bottom` | 节点底部中心 | `dx`, `dy`, `rotate` |
| `left` | 节点左侧中心 | `dx`, `dy`, `rotate` |
| `right` | 节点右侧中心 | `dx`, `dy`, `rotate` |
| `topLeft` | 节点左上角 | `dx`, `dy`, `rotate` |
| `topRight` | 节点右上角 | `dx`, `dy`, `rotate` |
| `bottomLeft` | 节点左下角 | `dx`, `dy`, `rotate` |
| `bottomRight` | 节点右下角 | `dx`, `dy`, `rotate` |
| `midSide` | 距离对端最近的一侧中点 | `direction`, `padding`, `rotate` |
| `orth` | 正交锚点，使连线保持正交 | `padding` |
| `nodeCenter` | 节点实际中心（非 magnet BBox） | `dx`, `dy` |

### BBox 锚点参数

`center`、`top`、`bottom`、`left`、`right`、`topLeft`、`topRight`、`bottomLeft`、`bottomRight` 共享参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `dx` | `number \| string` | `0` | X 方向偏移，支持百分比如 `'25%'` |
| `dy` | `number \| string` | `0` | Y 方向偏移，支持百分比如 `'25%'` |
| `rotate` | `boolean` | `false` | 是否跟随节点旋转 |

### midSide 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `direction` | `'H' \| 'V'` | 无 | 限制方向，`H` 只选左/右，`V` 只选上/下 |
| `padding` | `number` | 无 | BBox 膨胀值 |
| `rotate` | `boolean` | `false` | 是否跟随节点旋转 |

### orth 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `padding` | `number` | `0` | 距 BBox 边界的内边距 |

## 边锚点（Edge Anchor）

当一条边连接到另一条边时使用。

### 内置边锚点

| 名称 | 说明 | 参数 |
|------|------|------|
| `ratio` | 边路径上按比例定位（**默认值**） | `ratio` |
| `length` | 边路径上按长度定位 | `length` |
| `closest` | 边路径上距对端最近的点 | 无 |
| `orth` | 正交锚点，从对端画正交线与边路径的交点 | `fallbackAt` |

### ratio 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `ratio` | `number` | `0.5` | 位置比例，0~1 之间；大于 1 时自动除以 100 |

### length 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `length` | `number` | `20` | 从路径起点算起的长度（像素） |

### orth 参数（边锚点）

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fallbackAt` | `number \| string` | 无 | 无正交交点时的回退位置，数值为比例（0~1）或像素长度字符串如 `'20'` |

`orth` 边锚点会从对端参考点画水平线和垂直线，取与边路径的交点中最近的一个。若无交点则使用 `fallbackAt` 指定的回退位置，若 `fallbackAt` 也未指定则退化为 `closest`。

## 完整示例

### 使用 midSide 实现自动侧边连线

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  connecting: {
    anchor: { name: 'midSide', args: { direction: 'H' } },
    connectionPoint: 'boundary',
    router: 'orth',
    connector: 'rounded',
  },
});

const node1 = graph.addNode({
  shape: 'rect',
  x: 100,
  y: 100,
  width: 120,
  height: 60,
  label: '开始',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 6, ry: 6 } },
});

const node2 = graph.addNode({
  shape: 'rect',
  x: 400,
  y: 250,
  width: 120,
  height: 60,
  label: '结束',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 6, ry: 6 } },
});

// midSide 自动选择离对端最近的一侧
graph.addEdge({
  source: node1,
  target: node2,
  attrs: { line: { stroke: '#8f8f8f', targetMarker: 'classic' } },
});
```

### 单独指定 source/target 锚点

```javascript
graph.addEdge({
  source: { cell: node1, anchor: 'right' },
  target: { cell: node2, anchor: { name: 'left', args: { dy: 10 } } },
  attrs: { line: { stroke: '#8f8f8f', targetMarker: 'classic' } },
});
```

### 边连接到边

```javascript
const edge1 = graph.addEdge({
  source: node1,
  target: node2,
});

// edge2 连接到 edge1 的中点
graph.addEdge({
  source: node3,
  target: { cell: edge1, anchor: { name: 'ratio', args: { ratio: 0.5 } } },
  attrs: { line: { stroke: '#f5222d', targetMarker: 'classic' } },
});
```

## 常见错误

### ❌ 混淆 anchor 与 connectionPoint

```javascript
// 错误：anchor 不决定最终连接位置，它只是参考点
graph.addEdge({
  source: { cell: node1, anchor: 'boundary' }, // ❌ boundary 是 connectionPoint，不是 anchor
  target: node2,
});

// 正确：anchor 设置参考位置，connectionPoint 决定边界交点
graph.addEdge({
  source: { cell: node1, anchor: 'center', connectionPoint: 'boundary' },
  target: node2,
});
```

### ❌ 字符串简写与对象格式混用错误

```javascript
// 正确的两种写法
anchor: 'center'                                    // 字符串简写
anchor: { name: 'midSide', args: { direction: 'H' } }  // 对象格式（带参数时）
```
