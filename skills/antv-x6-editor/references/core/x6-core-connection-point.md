---
id: "x6-core-connection-point"
title: "X6 连接点（ConnectionPoint）"
description: |
  边与节点边界的实际交点计算策略。
  connectionPoint 决定连线端点在节点边界上的最终落点位置，与 anchor 配合使用。

library: "x6"
version: "3.x"
category: "core"
subcategory: "connection-point"
tags:
  - "connectionPoint"
  - "连接点"
  - "boundary"
  - "bbox"
  - "rect"
  - "anchor"
  - "连线交点"

related:
  - "x6-core-anchor"
  - "x6-core-edge"
  - "x6-core-ports"

use_cases:
  - "控制连线与节点形状边界的交点"
  - "让连线精确连接到节点轮廓"
  - "处理旋转节点的连线交点"
  - "设置连线端点偏移"

difficulty: "intermediate"
completeness: "full"
---

## 核心概念

**ConnectionPoint（连接点）** 是边路径与节点边界的实际交点。它与 anchor 的关系是：

1. **Anchor** → 确定参考点（如节点中心）
2. **ConnectionPoint** → 从对端方向画一条射线到 anchor，计算与节点边界的交点

```
对端 ─────────────── connectionPoint(边界交点) ─── anchor(参考点，节点内部)
                           ↑
                      这是最终连线端点
```

## 配置方式

### 全局配置

```javascript
const graph = new Graph({
  container: 'container',
  connecting: {
    connectionPoint: 'boundary',  // 全局默认
  },
});
```

### 单边配置

```javascript
graph.addEdge({
  source: { cell: node1, connectionPoint: 'boundary' },
  target: { cell: node2, connectionPoint: { name: 'boundary', args: { sticky: true } } },
});
```

## 内置连接点类型

| 名称 | 说明 | 适用场景 |
|------|------|----------|
| `'boundary'` | 与节点实际形状边界的交点（**默认值**） | 圆形、椭圆、多边形等不规则形状 |
| `'bbox'` | 与节点未旋转 BBox 的交点 | 简单矩形节点 |
| `'rect'` | 与节点旋转后 BBox 的交点 | 旋转矩形节点 |
| `'anchor'` | 直接使用 anchor 位置（不计算边界交点） | 需要连线穿入节点内部时 |

## 参数详解

### boundary 参数

最常用的连接点策略，计算射线与节点 SVG 形状的精确交点。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `offset` | `number \| { x, y }` | `0` | 沿连线方向偏移距离 |
| `stroked` | `boolean` | `false` | 是否将 strokeWidth 纳入计算 |
| `selector` | `string \| string[]` | 无 | 指定用于计算交点的子元素选择器 |
| `insideout` | `boolean` | `true` | 参考点在形状内部时是否仍计算交点 |
| `extrapolate` | `boolean` | `false` | 延长射线以确保与形状相交 |
| `sticky` | `boolean` | `false` | 无交点时是否返回最近点（而非 anchor） |
| `precision` | `number` | `2` | Path 元素的交点精度 |

### bbox 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `offset` | `number \| { x, y }` | `0` | 偏移距离 |
| `stroked` | `boolean` | `false` | 是否将 strokeWidth 纳入计算 |

### rect 参数

与 bbox 相同，但会考虑节点旋转角度。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `offset` | `number \| { x, y }` | `0` | 偏移距离 |
| `stroked` | `boolean` | `false` | 是否将 strokeWidth 纳入计算 |

### anchor 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `offset` | `number \| { x, y }` | `0` | 偏移距离 |
| `align` | `'top' \| 'right' \| 'bottom' \| 'left'` | 无 | 对齐方向 |
| `alignOffset` | `number` | `0` | 对齐偏移量 |

## 完整示例

### boundary：精确形状交点

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  connecting: {
    anchor: 'center',
    connectionPoint: 'boundary',
    router: 'orth',
    connector: 'rounded',
  },
});

// 圆形节点 - boundary 会精确计算圆弧交点
const circleNode = graph.addNode({
  shape: 'circle',
  x: 100,
  y: 100,
  width: 80,
  height: 80,
  label: '开始',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f' } },
});

const rectNode = graph.addNode({
  shape: 'rect',
  x: 350,
  y: 100,
  width: 120,
  height: 60,
  label: '处理',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 6, ry: 6 } },
});

graph.addEdge({
  source: circleNode,
  target: rectNode,
  attrs: { line: { stroke: '#8f8f8f', targetMarker: 'classic' } },
});
```

### sticky 模式：确保始终有连接点

```javascript
graph.addEdge({
  source: {
    cell: node1,
    connectionPoint: {
      name: 'boundary',
      args: { sticky: true },  // 无交点时返回最近点
    },
  },
  target: node2,
});
```

### anchor 类型：连线穿入节点

```javascript
// 连线直接连接到 anchor 位置，不停留在边界
graph.addEdge({
  source: {
    cell: node1,
    anchor: 'center',
    connectionPoint: 'anchor',  // 连线到达节点中心
  },
  target: node2,
});
```

### 带偏移的连接点

```javascript
graph.addEdge({
  source: {
    cell: node1,
    connectionPoint: {
      name: 'boundary',
      args: { offset: 10 },  // 连接点从边界外移 10px
    },
  },
  target: node2,
});
```

## connectionPoint 与 anchor 的配合关系

```
场景：node1 → node2

1. 确定 node2 的 anchor 位置（如 center = 节点中心）
2. 从 node1 方向画一条射线指向 node2 的 anchor
3. connectionPoint 计算射线与 node2 边界的交点
4. 该交点就是连线终止端的实际位置
```

| 组合 | 效果 |
|------|------|
| `anchor: 'center'` + `connectionPoint: 'boundary'` | 连线到达节点形状边界（最常用） |
| `anchor: 'center'` + `connectionPoint: 'anchor'` | 连线穿入节点到达中心 |
| `anchor: 'left'` + `connectionPoint: 'boundary'` | 从左侧方向计算边界交点 |
| `anchor: 'midSide'` + `connectionPoint: 'boundary'` | 自动选择最近侧的边界交点 |

## 常见错误

### ❌ 混淆 connectionPoint 与 anchor

```javascript
// 错误：想让连线连到节点边界却用了 anchor
graph.addEdge({
  source: { cell: node1, anchor: 'boundary' }, // ❌ 'boundary' 不是 anchor 类型
  target: node2,
});

// 正确：boundary 是 connectionPoint 类型
graph.addEdge({
  source: { cell: node1, connectionPoint: 'boundary' },
  target: node2,
});
```

### ❌ 圆形节点使用 bbox 导致交点不精确

```javascript
// 不推荐：对圆形节点 bbox 会计算矩形边界交点
connectionPoint: 'bbox'  // 圆形节点会有间隙

// 推荐：使用 boundary 精确计算圆弧交点
connectionPoint: 'boundary'
```
