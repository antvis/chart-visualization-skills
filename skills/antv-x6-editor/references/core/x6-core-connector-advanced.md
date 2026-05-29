---
id: "x6-core-connector-advanced"
title: "X6 高级连接器（Connector）"
description: |
  X6 除了常用的 normal、rounded、smooth 连接器外，还提供 loop（自环连接器）和 jumpover（跳线连接器）。
  适用于自环边绘制、交叉线跳线显示等场景。

library: "x6"
version: "3.x"
category: "core"
subcategory: "edge"
tags:
  - "connector"
  - "连接器"
  - "loop"
  - "jumpover"
  - "跳线"
  - "自环"
  - "交叉"

related:
  - "x6-core-edge"
  - "x6-core-router-advanced"

use_cases:
  - "自环边的曲线绘制"
  - "交叉连线的跳线显示"
  - "避免连线视觉重叠"
  - "状态机自环"

difficulty: "intermediate"
completeness: "full"
---

## 连接器完整列表

| Connector | 说明 | 典型场景 |
|-----------|------|---------|
| `normal` | 默认，直线连接各路由点 | 简单连线 |
| `rounded` | 圆角折线 | 流程图 |
| `smooth` | 贝塞尔曲线 | 平滑连线 |
| `jumpover` | 跳线，交叉处产生弧形跳跃 | 复杂布线图 |
| `loop` | 自环曲线 | 自环边 |

---

## Loop 连接器

专为自环边设计的连接器，使用二次贝塞尔曲线（Q 命令）绘制弧线，配合 `loop` 路由器使用。

### 配置项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `split` | `boolean \| number` | - | 是否拆分曲线 |

### 示例

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({ container: 'container' });

const node = graph.addNode({
  shape: 'rect',
  x: 150,
  y: 100,
  width: 100,
  height: 50,
  label: '状态 A',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 6, ry: 6 } },
});

// 自环边：必须同时使用 loop 路由器和 loop 连接器
graph.addEdge({
  source: node,
  target: node,
  router: {
    name: 'loop',
    args: { width: 60, height: 100, angle: 'auto' },
  },
  connector: { name: 'loop' },
  label: '重试',
  attrs: {
    line: { stroke: '#f5222d', strokeWidth: 2, targetMarker: 'classic' },
  },
});
```

### 关键说明

- **必须配合 `loop` 路由器使用**，路由器提供中间控制点，连接器据此绘制曲线
- 生成的路径使用两段 Q（二次贝塞尔曲线）拼接

---

## Jumpover 连接器

当多条边交叉时，在交叉点处绘制跳线弧形，避免视觉混淆。

### 配置项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `number` | `5` | 跳线弧的大小（半径） |
| `type` | `'arc' \| 'gap' \| 'cubic'` | `'arc'` | 跳线样式类型 |
| `radius` | `number` | `0` | 折线圆角半径 |
| `ignoreConnectors` | `string[]` | `['smooth']` | 忽略与哪些连接器类型的交叉 |

### 跳线类型说明

- **`arc`**：半圆弧跳过（默认），最常用
- **`gap`**：断开间隙
- **`cubic`**：三次曲线跳过，更平滑

### 示例

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  connecting: {
    connector: {
      name: 'jumpover',
      args: {
        size: 8,
        type: 'arc',
      },
    },
  },
});

// 创建多条交叉的边
const node1 = graph.addNode({
  shape: 'rect', x: 50, y: 50, width: 80, height: 40, label: 'A',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 4, ry: 4 } },
});
const node2 = graph.addNode({
  shape: 'rect', x: 300, y: 50, width: 80, height: 40, label: 'B',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 4, ry: 4 } },
});
const node3 = graph.addNode({
  shape: 'rect', x: 50, y: 200, width: 80, height: 40, label: 'C',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 4, ry: 4 } },
});
const node4 = graph.addNode({
  shape: 'rect', x: 300, y: 200, width: 80, height: 40, label: 'D',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 4, ry: 4 } },
});

// 两条交叉边
graph.addEdge({
  source: node1,
  target: node4,
  connector: { name: 'jumpover', args: { size: 8, type: 'arc' } },
  attrs: { line: { stroke: '#5b8ff9', strokeWidth: 2 } },
});

graph.addEdge({
  source: node2,
  target: node3,
  connector: { name: 'jumpover', args: { size: 8, type: 'arc' } },
  attrs: { line: { stroke: '#52c41a', strokeWidth: 2 } },
});
```

### 单条边设置 jumpover

```javascript
// 在单条边上设置
graph.addEdge({
  source: node1,
  target: node2,
  connector: {
    name: 'jumpover',
    args: {
      size: 6,
      type: 'cubic',
      radius: 4,
    },
  },
  attrs: { line: { stroke: '#333', strokeWidth: 2 } },
});
```

### 全局默认设置 jumpover

```javascript
// 在 Graph 初始化时全局配置
const graph = new Graph({
  container: 'container',
  connecting: {
    connector: {
      name: 'jumpover',
      args: { size: 5, type: 'arc' },
    },
  },
});
```

---

## 连接器简写与对象写法

```javascript
// 简写（无参数时）
graph.addEdge({ source, target, connector: 'rounded' });

// 对象写法（带参数时）
graph.addEdge({
  source,
  target,
  connector: {
    name: 'rounded',
    args: { radius: 10 },
  },
});
```

---

## 常见错误与修正

### 错误 1: 自环边只用 loop 连接器不用 loop 路由器

```javascript
// ❌ 错误：缺少 loop 路由器，连接器没有正确的控制点
graph.addEdge({
  source: node,
  target: node,
  connector: { name: 'loop' },
});

// ✅ 正确：路由器和连接器配合使用
graph.addEdge({
  source: node,
  target: node,
  router: { name: 'loop', args: { width: 50, height: 80 } },
  connector: { name: 'loop' },
});
```

### 错误 2: jumpover 不生效

```javascript
// ❌ 错误：只给一条边设置 jumpover，另一条边用 smooth（默认被忽略）
// jumpover 默认忽略 smooth 连接器的交叉

// ✅ 正确：确保需要跳线的边都使用 jumpover 或非忽略的连接器
// 或修改 ignoreConnectors 参数
connector: {
  name: 'jumpover',
  args: { ignoreConnectors: [] },  // 不忽略任何连接器
}
```

### 错误 3: jumpover 的 type 拼写错误

```javascript
// ❌ 错误
connector: { name: 'jumpover', args: { type: 'curve' } }

// ✅ 正确：type 取值为 'arc' | 'gap' | 'cubic'
connector: { name: 'jumpover', args: { type: 'cubic' } }
```
