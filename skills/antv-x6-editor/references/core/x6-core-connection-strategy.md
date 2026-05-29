---
id: "x6-core-connection-strategy"
title: "X6 连接策略（Connection Strategy）"
description: |
  连接策略决定连线落点时 source/target 端点数据的生成方式：使用默认锚点（noop）、固定到绝对坐标（pinAbsolute）、固定到相对位置（pinRelative）。

library: "x6"
version: "3.x"
category: "core"
subcategory: "connection-strategy"
tags:
  - "connectionStrategy"
  - "连接策略"
  - "pinAbsolute"
  - "pinRelative"
  - "连线落点"
  - "锚点固定"

related:
  - "x6-core-anchor"
  - "x6-core-connection-point"
  - "x6-core-edge"

use_cases:
  - "连线精确落到鼠标释放位置"
  - "连线固定到节点边缘的相对位置"
  - "自定义连线端点位置逻辑"

difficulty: "advanced"
completeness: "full"
---

## 概念说明

当用户通过拖拽创建连线时，连线的 source/target 端点默认连接到节点的锚点（anchor）。**连接策略**（Connection Strategy）可以改变这个默认行为，让端点锚定到更精确的位置。

三种内置策略：

| 策略 | 说明 |
|------|------|
| `noop` | 默认行为，不做额外处理，使用正常的 anchor 计算 |
| `pinAbsolute` | 将端点固定到鼠标释放时的绝对坐标位置（相对于节点左上角的 x/y 偏移） |
| `pinRelative` | 将端点固定到鼠标释放时的相对位置（0~1 比例值） |

## 基本用法

在 Graph 的 `connecting` 配置中设置：

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  connecting: {
    connectionStrategy: 'pinRelative',
  },
});
```

## pinAbsolute

端点固定到鼠标释放位置对应的绝对坐标（像素值）：

```javascript
const graph = new Graph({
  container: 'container',
  connecting: {
    connectionStrategy: 'pinAbsolute',
  },
});
```

连线创建后，edge 的 source/target 数据会包含 `anchor` 字段：

```javascript
// 连线数据示例
{
  source: { cell: 'node1', anchor: { name: 'topLeft', args: { dx: 50, dy: 20 } } },
  target: { cell: 'node2', anchor: { name: 'topLeft', args: { dx: 30, dy: 40 } } },
}
```

## pinRelative

端点固定到鼠标释放位置的相对比例（0~1）：

```javascript
const graph = new Graph({
  container: 'container',
  connecting: {
    connectionStrategy: 'pinRelative',
  },
});
```

相对位置用比例表示，节点移动或缩放后连线端点会自动跟随：

```javascript
// 连线数据示例（end 值为 -1~1 的相对量）
{
  source: { cell: 'node1', anchor: { name: 'nodeCenter', args: { dx: '20%', dy: '30%' } } },
  target: { cell: 'node2', anchor: { name: 'nodeCenter', args: { dx: '-10%', dy: '15%' } } },
}
```

## 使用场景对比

| 场景 | 推荐策略 |
|------|----------|
| 普通流程图/DAG（连线到端口） | `noop`（默认） |
| 自由连线到节点任意位置 | `pinRelative` |
| 精确定位（如电路图） | `pinAbsolute` |

## 与端口配合

当连线连接到端口（port）时，连接策略通常不需要配置（端口本身就是精确的锚点）。连接策略主要用于**没有端口、直接连接到节点本体**的场景。

```javascript
const graph = new Graph({
  container: 'container',
  connecting: {
    allowBlank: false,
    // 有端口时通常不需要 connectionStrategy
    // 无端口且需精确落点时使用：
    connectionStrategy: 'pinRelative',
  },
});
```

## 自定义连接策略

可以注册自定义策略：

```javascript
import { Graph } from '@antv/x6';

Graph.registerConnectionStrategy('myStrategy', (terminal, cellView, magnet, coords, edge, type, options) => {
  // terminal: 当前的端点数据 { cell, port, ... }
  // cellView: 目标节点/边的视图
  // magnet: 触发连接的 DOM 元素
  // coords: 鼠标释放时的画布坐标 { x, y }
  // 返回修改后的 terminal 数据
  return {
    ...terminal,
    anchor: {
      name: 'center',
    },
  };
});

const graph = new Graph({
  container: 'container',
  connecting: {
    connectionStrategy: 'myStrategy',
  },
});
```

## 常见错误

### ❌ 对有端口的节点使用 pinAbsolute

```javascript
// 不推荐：节点有端口时再用 pinAbsolute 会导致锚点计算混乱
const graph = new Graph({
  container: 'container',
  connecting: { connectionStrategy: 'pinAbsolute' },
});
graph.addNode({
  x: 100, y: 100, width: 80, height: 40,
  ports: { items: [{ id: 'p1', group: 'out' }] },  // 已有端口
});
// 连线时会忽略端口位置，连到鼠标释放的绝对位置
```

```javascript
// 正确：有端口时使用默认策略（noop），让连线自然连接到端口
const graph = new Graph({
  container: 'container',
  connecting: { allowBlank: false },  // ✅ 使用默认策略
});
```
