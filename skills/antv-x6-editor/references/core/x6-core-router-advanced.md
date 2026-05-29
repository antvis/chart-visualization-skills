---
id: "x6-core-router-advanced"
title: "X6 高级路由器（Router）"
description: |
  X6 除了常用的 orth、manhattan、metro、er 路由器外，还提供 oneside（单侧路由）和 loop（自环路由）等高级路由器。
  适用于单侧出线、自环连线等场景。

library: "x6"
version: "3.x"
category: "core"
subcategory: "edge"
tags:
  - "router"
  - "路由"
  - "oneside"
  - "loop"
  - "自环"
  - "单侧"
  - "边"
  - "连线"

related:
  - "x6-core-edge"
  - "x6-core-connector-advanced"

use_cases:
  - "边从节点同一侧出入"
  - "自环连线（同一节点的边）"
  - "单侧出线布局"
  - "循环依赖表示"

difficulty: "intermediate"
completeness: "full"
---

## 路由器完整列表

| Router | 说明 | 典型场景 |
|--------|------|---------|
| `normal` | 默认，直连无中间点 | 简单连线 |
| `orth` | 正交路由（水平/垂直线段） | 流程图 |
| `manhattan` | 智能正交路由，自动避开障碍 | 复杂流程图 |
| `metro` | 地铁线路风格（45°对角线） | 地铁图 |
| `er` | ER 图路由 | ER 图 |
| `oneside` | 强制从指定侧出入 | 层级布局、单向流 |
| `loop` | 自环路由 | 自环边、循环状态 |

---

## OneSide 路由器

强制边从节点的指定侧（top/bottom/left/right）出入，适用于层次布局或需要统一出线方向的场景。

### 配置项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `side` | `'left' \| 'top' \| 'right' \| 'bottom'` | `'bottom'` | 出线方向 |
| `padding` | `number \| SideOptions` | `40` | 出线点到节点的距离 |

### 示例

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({ container: 'container' });

const source = graph.addNode({
  shape: 'rect',
  x: 50,
  y: 50,
  width: 100,
  height: 40,
  label: 'Source',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 6, ry: 6 } },
});

const target = graph.addNode({
  shape: 'rect',
  x: 300,
  y: 200,
  width: 100,
  height: 40,
  label: 'Target',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 6, ry: 6 } },
});

// 边从底部出入
graph.addEdge({
  source,
  target,
  router: {
    name: 'oneside',
    args: {
      side: 'bottom',
      padding: 50,
    },
  },
  attrs: {
    line: { stroke: '#5b8ff9', strokeWidth: 2, targetMarker: 'classic' },
  },
});

// 边从右侧出入
graph.addEdge({
  source,
  target,
  router: {
    name: 'oneside',
    args: {
      side: 'right',
      padding: 30,
    },
  },
  attrs: {
    line: { stroke: '#52c41a', strokeWidth: 2, targetMarker: 'classic' },
  },
});
```

### 工作原理

OneSide 路由器会：
1. 将 source 和 target 的连接点移动到节点指定侧外部
2. 保持正交路径
3. 如果两个节点的出线点在同一水平/垂直线上，自动对齐

---

## Loop 路由器

用于自环边（source 和 target 是同一个节点，或 sourceAnchor 和 targetAnchor 相同的场景）。

### 配置项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `width` | `number` | `50` | 自环的宽度（到节点中心的距离） |
| `height` | `number` | `80` | 自环的高度（弧线跨度） |
| `angle` | `'auto' \| number` | `'auto'` | 自环方向角度，`'auto'` 自动寻找不与节点重叠的方向 |
| `merge` | `boolean \| number` | - | 是否合并起止点为同一锚点 |

### 示例：自环边

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({ container: 'container' });

const node = graph.addNode({
  shape: 'rect',
  x: 150,
  y: 100,
  width: 100,
  height: 50,
  label: 'State A',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 6, ry: 6 } },
});

// 自环边：source 和 target 指向同一节点
graph.addEdge({
  source: node,
  target: node,
  router: {
    name: 'loop',
    args: {
      width: 60,
      height: 100,
      angle: 'auto',
    },
  },
  connector: { name: 'loop' },
  label: '重试',
  attrs: {
    line: { stroke: '#f5222d', strokeWidth: 2, targetMarker: 'classic' },
  },
});
```

### 示例：指定角度的自环

```javascript
// 自环从顶部出（angle: -90 即顶部方向）
graph.addEdge({
  source: node,
  target: node,
  router: {
    name: 'loop',
    args: {
      width: 50,
      height: 80,
      angle: -90,
    },
  },
  connector: { name: 'loop' },
  attrs: {
    line: { stroke: '#722ed1', strokeWidth: 2, targetMarker: 'classic' },
  },
});
```

### angle 角度说明

- `0`：右侧
- `90`：底部
- `180` 或 `-180`：左侧
- `-90` 或 `270`：顶部
- `'auto'`：自动选择不与节点 BBox 重叠的方向

---

## 路由器简写与对象写法

```javascript
// 简写（无参数时）
graph.addEdge({ source, target, router: 'orth' });

// 对象写法（带参数时）
graph.addEdge({
  source,
  target,
  router: {
    name: 'manhattan',
    args: {
      padding: 20,
      excludeShapes: ['group'],
    },
  },
});
```

---

## 常见错误与修正

### 错误 1: 自环边不使用 loop 路由器

```javascript
// ❌ 错误：自环边使用 orth 路由器，会得到长度为 0 的边
graph.addEdge({ source: node, target: node, router: 'orth' });

// ✅ 正确：自环边使用 loop 路由器 + loop 连接器
graph.addEdge({
  source: node,
  target: node,
  router: { name: 'loop', args: { width: 50,  height: 80 } },
  connector: { name: 'loop' },
});
```

### 错误 2: oneside 的 side 拼写错误

```javascript
// ❌ 错误：side 值拼写错误
router: { name: 'oneside', args: { side: 'buttom' } }

// ✅ 正确：side 取值为 'top' | 'bottom' | 'left' | 'right'
router: { name: 'oneside', args: { side: 'bottom' } }
```

### 错误 3: 自定义节点注册方式错误导致渲染失败

```javascript
// ❌ 错误：使用 Shape.Rectangle.define 注册节点，可能引发 define 方法未定义的问题
Shape.Rectangle.define({
  shape: 'custom-node',
  width: 80,
  height: 40,
  attrs: {
    body: { fill: '#fff', stroke: '#000' },
    label: { text: '', fill: '#333' },
  },
});

// ✅ 正确：使用 Graph.registerNode 注册自定义节点
Graph.registerNode(
  'custom-node',
  {
    inherit: 'rect',
    width: 100,
    height: 40,
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'text', selector: 'label' },
    ],
    attrs: {
      body: {
        stroke: '#8f8f8f',
        strokeWidth: 1,
        fill: '#fff',
        rx: 6,
        ry: 6,
      },
    },
  },
  true,
);
```

### 错误 4: orth 路由器未生效或绕开障碍物失败

```javascript
// ❌ 错误：未正确设置 router 或缺少必要的 graph 配置
graph.addEdge({
  source: sourceNode,
  target: targetNode,
  router: 'orth',
});

// ✅ 正确：确保 graph 初始化时启用 router，并在 addEdge 中显式设置
const graph = new Graph({
  container: 'container',
  connecting: {
    router: 'orth',
  },
});

graph.addEdge({
  source,
  target,
  router: 'orth',
});
```