---
id: "x6-core-edge"
title: "X6 边配置与样式"
description: |
  X6 边的创建、路由器、连接器、箭头、标签、顶点配置。
  包含 orth/manhattan/smooth/rounded 等路由与连接器的使用方式。

library: "x6"
version: "3.x"
category: "core"
subcategory: "edge"
tags:
  - "边"
  - "edge"
  - "连线"
  - "路由器"
  - "router"
  - "连接器"
  - "connector"
  - "箭头"
  - "marker"
  - "targetMarker"
  - "标签"
  - "label"
  - "vertices"
  - "orth"
  - "manhattan"
  - "smooth"
  - "rounded"
  - "strokeDasharray"
  - "虚线"

related:
  - "x6-core-node"
  - "x6-core-ports"
  - "x6-core-graph-init"

use_cases:
  - "创建节点之间的连线"
  - "设置边的路由器和连接器"
  - "配置边的箭头样式"
  - "给边添加文本标签"
  - "创建虚线/曲线边"
  - "设置边的中间顶点"

anti_patterns:
  - "不要混淆 router 和 connector 的作用"
  - "不要遗漏 source/target"

difficulty: "beginner"
completeness: "full"
---

## 添加边

```javascript
// 方式1：传入节点实例
graph.addEdge({ source: sourceNode, target: targetNode });

// 方式2：传入节点 ID
graph.addEdge({ source: 'node1', target: 'node2' });

// 方式3：连接到端口
graph.addEdge({
  source: { cell: 'node1', port: 'out1' },
  target: { cell: 'node2', port: 'in1' },
});

// 方式4：使用坐标点
graph.addEdge({
  source: { x: 100, y: 50 },
  target: { x: 400, y: 50 },
});
// 或用简写
graph.addEdge({
  sourcePoint: [100, 50],
  targetPoint: [400, 50],
});
```

## 边样式

```javascript
graph.addEdge({
  source: node1,
  target: node2,
  attrs: {
    line: {
      stroke: '#8f8f8f',        // 线条颜色
      strokeWidth: 1,           // 线宽
      strokeDasharray: '5 3',   // 虚线（5px 线 + 3px 间隔）
      targetMarker: 'classic',  // 目标端箭头
      sourceMarker: null,       // 源端无箭头
    },
  },
});
```

## 箭头类型

```javascript
// 内置箭头
targetMarker: 'classic'        // 经典三角箭头
targetMarker: 'block'          // 实心三角
targetMarker: 'circle'         // 圆形
targetMarker: 'circlePlus'     // 带+号圆形
targetMarker: 'diamond'        // 菱形
targetMarker: 'ellipse'        // 椭圆
targetMarker: 'cross'          // 十字
targetMarker: 'async'          // 异步标记

// 自定义箭头
targetMarker: {
  name: 'block',
  width: 12,
  height: 8,
  offset: -4,
  fill: '#333',
}
```

## 路由器（Router）

路由器决定边经过的路径点（拐点）。

```javascript
// 正交路由（垂直/水平折线）
graph.addEdge({ source, target, router: 'orth' });

// Manhattan 路由（智能绕障）
graph.addEdge({ source, target, router: 'manhattan' });

// 路由器带配置
graph.addEdge({
  source, target,
  router: { name: 'orth', args: { padding: 20 } },
});

// ER 图专用路由
graph.addEdge({ source, target, router: 'er' });

// Metro 地铁线路由
graph.addEdge({ source, target, router: 'metro' });
```

## 连接器（Connector）

连接器决定路径点之间如何绘制线条。

```javascript
// 圆角折线
graph.addEdge({ source, target, router: 'orth', connector: 'rounded' });

// 贝塞尔曲线
graph.addEdge({ source, target, connector: 'smooth' });

// 跳线（交叉处跳跃）
graph.addEdge({ source, target, connector: 'jumpover' });

// 连接器带配置
graph.addEdge({
  source, target,
  connector: { name: 'rounded', args: { radius: 10 } },
});
```

## 边标签

```javascript
// 简写
graph.addEdge({ source, target, label: 'Yes' });

// 详细配置
graph.addEdge({
  source, target,
  labels: [
    {
      position: 0.5,           // 标签在边上的位置（0-1）
      attrs: {
        text: { text: 'label text', fontSize: 12, fill: '#333' },
        rect: { fill: '#fff', stroke: '#8f8f8f', rx: 3, ry: 3 },
      },
    },
  ],
});

// 多个标签
graph.addEdge({
  source, target,
  labels: [
    { position: 0.25, attrs: { text: { text: 'start' } } },
    { position: 0.75, attrs: { text: { text: 'end' } } },
  ],
});
```

## 顶点（Vertices）

手动指定边的中间拐点：

```javascript
graph.addEdge({
  source: node1,
  target: node2,
  vertices: [
    { x: 200, y: 50 },
    { x: 200, y: 200 },
  ],
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } },
});
```

## 动态修改边

```javascript
// 修改样式
edge.attr('line/stroke', '#f5222d');
edge.attr('line/strokeWidth', 2);

// 修改标签
edge.setLabels([{ attrs: { text: { text: 'Updated' } } }]);

// 修改路由器
edge.setRouter('manhattan');

// 修改连接器
edge.setConnector('smooth');

// 修改源/目标
edge.setSource(newSourceNode);
edge.setTarget({ cell: 'node3', port: 'in1' });
```

## 常用边样式组合

### 流程图边

```javascript
graph.addEdge({
  source, target,
  router: 'orth',
  connector: 'rounded',
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } },
});
```

### 血缘图边

```javascript
graph.addEdge({
  source: { cell: srcNode, port: 'out1' },
  target: { cell: tgtNode, port: 'in1' },
  connector: 'smooth',
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1 } },
});
```

### 虚线边（调用关系）

```javascript
graph.addEdge({
  source, target,
  attrs: {
    line: { stroke: '#aaa', strokeWidth: 1, strokeDasharray: '5 3', targetMarker: 'classic' },
  },
});
```

### 高亮状态边

```javascript
graph.addEdge({
  source, target,
  attrs: { line: { stroke: '#1890ff', strokeWidth: 2, targetMarker: 'classic' } },
});
```
