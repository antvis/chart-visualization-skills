---
id: "x6-core-connector-params"
title: "X6 Connector 连接器完整参数"
description: |
  X6 五种内置连接器（normal/rounded/smooth/jumpover/loop）的完整参数说明，包含 rounded 的 radius、smooth 的 direction 等关键配置项。
library: x6
version: 3.x
category: "core"
tags:
  - connector
  - rounded
  - smooth
  - normal
  - jumpover
  - loop
  - radius
  - direction
---

# Connector 连接器完整参数

## 概述

连接器（Connector）决定边的线条样式——在路由器计算出的路径点之间如何绘制曲线。X6 3.x 内置 5 种连接器。

## 使用方式

```javascript
// 字符串简写（使用默认参数）
graph.addEdge({ source, target, connector: 'rounded' });

// 对象形式（传递参数）
graph.addEdge({
  source, target,
  connector: { name: 'rounded', args: { radius: 20 } },
});
```

## normal — 直线段（默认）

在路径点之间用直线段连接，无额外参数。

```javascript
graph.addEdge({ source, target, connector: 'normal' });
```

**参数：** 无特殊参数。

---

## rounded — 圆角折线

在折线的转角处用贝塞尔曲线绘制圆角。

```javascript
graph.addEdge({
  source, target,
  router: 'orth',
  connector: { name: 'rounded', args: { radius: 10 } },
});
```

**参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `radius` | number | `10` | 转角圆角半径（px）。值越大圆角越大。实际圆角半径不会超过相邻两段线段长度的一半 |

**示例对比：**

```javascript
// 小圆角
connector: { name: 'rounded', args: { radius: 5 } }

// 大圆角
connector: { name: 'rounded', args: { radius: 30 } }
```

---

## smooth — 贝塞尔曲线

用三次贝塞尔曲线连接起点和终点。如果有路由点则通过 Catmull-Rom 样条拟合。

```javascript
graph.addEdge({
  source, target,
  connector: { name: 'smooth', args: { direction: 'H' } },
});
```

**参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `direction` | `'H'` \| `'V'` | 自动 | 贝塞尔曲线控制点方向。`'H'` 为水平方向（适合左右布局），`'V'` 为垂直方向（适合上下布局）。不传时根据起止点间距自动判断 |

**direction 说明：**
- `'H'`（水平）：控制点在 X 轴方向取中点，产生 S 形水平曲线。适合 DAG 图、血缘图等左右流向布局
- `'V'`（垂直）：控制点在 Y 轴方向取中点，产生 S 形垂直曲线。适合组织架构图等上下流向布局
- 不传：自动根据 `|dx| >= |dy|` 选择 `'H'`，否则选择 `'V'`

**注意：** 当存在路由点（routePoints）时，`direction` 参数无效，改为使用 Catmull-Rom 样条曲线经过所有路由点。

```javascript
// 水平布局的血缘图
graph.addEdge({
  source: { cell: leftNode, port: 'out' },
  target: { cell: rightNode, port: 'in' },
  connector: { name: 'smooth', args: { direction: 'H' } },
});

// 垂直布局的组织架构图
graph.addEdge({
  source: { cell: parentNode, port: 'bottom' },
  target: { cell: childNode, port: 'top' },
  connector: { name: 'smooth', args: { direction: 'V' } },
});
```

---

## jumpover — 跳线

当两条边在画布上交叉时，在交叉点处绘制弧形跳线以区分不同路径。

```javascript
graph.addEdge({
  source, target,
  connector: { name: 'jumpover', args: { size: 5, type: 'arc' } },
});
```

**参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'arc'` \| `'gap'` \| `'cubic'` | `'arc'` | 跳线样式：弧形/间隙/三次曲线 |
| `size` | number | `5` | 跳线大小（半径或间隙宽度） |

---

## loop — 自环连接器

当边的 source 和 target 是同一个节点时使用，绘制从节点出发再回到自身的环形路径。

```javascript
graph.addEdge({
  source: node,
  target: node,
  connector: { name: 'loop', args: { width: 50, height: 80, direction: 'top' } },
});
```

**参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `width` | number | | 环的宽度 |
| `height` | number | | 环的高度 |
| `direction` | string | | 环的方向 |

---

## 自定义连接器

通过 `Graph.registerConnector` 注册自定义连接器：

```javascript
import { Graph, Path } from '@antv/x6';

Graph.registerConnector('wobble', (sourcePoint, targetPoint, routePoints, options) => {
  const path = new Path();
  path.appendSegment(Path.createSegment('M', sourcePoint));
  // 自定义路径逻辑
  path.appendSegment(Path.createSegment('L', targetPoint));
  return options.raw ? path : path.serialize();
});

graph.addEdge({
  source, target,
  connector: { name: 'wobble', args: {} },
});
```

**连接器函数签名：**

```typescript
(
  sourcePoint: PointLike,      // 起点坐标
  targetPoint: PointLike,      // 终点坐标
  routePoints: PointLike[],    // 路由器计算的中间路径点
  options: T,                  // 用户传入的 args
  edgeView: EdgeView,          // 边视图实例
) => Path | string             // 返回 Path 对象或 SVG path 字符串
```

## 完整示例

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  connecting: {
    router: 'orth',
    connector: { name: 'rounded', args: { radius: 8 } },
  },
});

const n1 = graph.addNode({ shape: 'rect', x: 50, y: 50, width: 80, height: 40, label: 'A' });
const n2 = graph.addNode({ shape: 'rect', x: 300, y: 50, width: 80, height: 40, label: 'B' });
const n3 = graph.addNode({ shape: 'rect', x: 300, y: 250, width: 80, height: 40, label: 'C' });

// rounded 圆角折线
graph.addEdge({ source: n1, target: n2, router: 'orth', connector: { name: 'rounded', args: { radius: 15 } } });

// smooth 贝塞尔曲线
graph.addEdge({ source: n1, target: n3, connector: { name: 'smooth', args: { direction: 'H' } } });

// 自环边
graph.addEdge({ source: n2, target: n2, connector: 'loop' });
```

## 常见错误

```javascript
// ❌ 错误：rounded 不搭配路由器使用时没有折线角可圆角化
graph.addEdge({ source, target, connector: 'rounded' });
// 只有起止两点的直线，rounded 无效果

// ✅ 正确：搭配 orth/manhattan 路由器产生折线
graph.addEdge({ source, target, router: 'orth', connector: 'rounded' });

// ❌ 错误：smooth 的 direction 拼写错误
connector: { name: 'smooth', args: { direction: 'horizontal' } }  // 无效

// ✅ 正确：只接受 'H' 或 'V'
connector: { name: 'smooth', args: { direction: 'H' } }
```
