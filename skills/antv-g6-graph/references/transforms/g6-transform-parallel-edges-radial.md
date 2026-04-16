---
id: "g6-transform-parallel-edges-radial"
title: "G6 数据变换：平行边处理 + 径向标签（process-parallel-edges / place-radial-labels）"
description: |
  process-parallel-edges：处理两节点间的多条平行边，支持捆绑模式（展开为弧线）和合并模式（折叠为一条）。
  place-radial-labels：为径向布局图（辐射树、径向紧凑树）自动调整标签角度和位置，防止标签重叠。

library: "g6"
version: "5.x"
category: "transforms"
subcategory: "data"
tags:
  - "process-parallel-edges"
  - "place-radial-labels"
  - "平行边"
  - "多边"
  - "径向标签"
  - "transforms"
  - "数据变换"

related:
  - "g6-edge-quadratic-loop"
  - "g6-layout-advanced"
  - "g6-core-transforms-animation"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-16"
updated: "2026-04-16"
---

## 平行边处理（process-parallel-edges）

当两个节点之间存在多条边时，自动处理这些平行边，避免重叠。提供两种模式：
- **bundle 模式**（默认）：将每条边展开为不同曲率的二次贝塞尔曲线
- **merge 模式**：将多条平行边合并为一条聚合边

### 捆绑模式（bundle）

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 500,
   {
    nodes: [
      { id: 'A', style: { x: 100, y: 300 } },
      { id: 'B', style: { x: 400, y: 150 } },
      { id: 'C', style: { x: 700, y: 300 } },
    ],
    edges: [
      // A->B 有 5 条平行边
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `AB-${i}`,
        source: 'A',
        target: 'B',
        data: { label: `关系${i + 1}` },
      })),
      // 双向边也支持
      { source: 'A', target: 'C' },
      { source: 'C', target: 'A' },
    ],
  },
  node: {
    style: {
      labelText: (d) => d.id,
      ports: [{ placement: 'center' }],
    },
  },
  edge: {
    // ⚠️ 捆绑模式下，不要在这里设置全局 edge.type
    // process-parallel-edges 会自动将平行边类型设置为 quadratic
    style: {
      labelText: (d) => d?.data?.label,
      endArrow: true,
    },
  },
  behaviors: ['drag-element', 'drag-canvas', 'zoom-canvas'],
  transforms: [
    {
      type: 'process-parallel-edges',
      mode: 'bundle',   // 默认为 bundle
      distance: 20,     // 捆绑模式下边之间的距离（px）
    },
  ],
});

graph.render();
```

> **重要：** 捆绑模式会强制将平行边类型改为 `quadratic`，因此不能在 `edge.type` 设置全局边类型，否则会覆盖 bundle 处理结果。

### 合并模式（merge）

```javascript
const graph = new Graph({
  // ...
  edge: {
    style: {
      labelText: (d) => `${d.source}->${d.target}`,
      endArrow: true,
    },
  },
  transforms: [
    {
      type: 'process-parallel-edges',
      mode: 'merge',        // 合并为一条聚合边
      style: {              // 合并边的额外样式
        stroke: '#ff7a45',
        lineWidth: 3,
        halo: true,
        haloOpacity: 0.3,
        haloStroke: '#ff7a45',
      },
    },
  ],
});
```

> 注意：合并样式赋值给 `datum.style`，优先级低于 `edge.style`（Graph 配置的默认样式）。

### process-parallel-edges 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `string` | `'process-parallel-edges'` | 变换类型 |
| `key` | `string` | — | 唯一标识，用于动态更新 |
| `mode` | `'bundle' \| 'merge'` | `'bundle'` | 处理模式 |
| `distance` | `number` | `15` | bundle 模式下边间距（px） |
| `edges` | `string[]` | — | 指定要处理的边 ID（默认全部） |
| `style` | `PathStyleProps \| Function` | — | merge 模式的聚合边样式 |

### 简写形式

```javascript
// 使用默认配置（bundle 模式，distance=15）
transforms: ['process-parallel-edges']

// 动态更新配置
graph.updateTransform({ key: 'parallel', mode: 'bundle', distance: 30 });
```

---

## 径向标签（place-radial-labels）

专为径向布局（radial、dendrogram 等）设计的标签自动排布变换。根据节点在圆形布局中的角度，自动调整标签的位置和旋转角度，确保可读性。

```javascript
import { Graph, treeToGraphData } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 800,
  autoFit: 'view',
   treeToGraphData({
    id: 'root',
    children: [
      { id: 'a1', children: [{ id: 'a1-1' }, { id: 'a1-2' }] },
      { id: 'a2', children: [{ id: 'a2-1' }] },
      { id: 'a3', children: [{ id: 'a3-1' }, { id: 'a3-2' }, { id: 'a3-3' }] },
      { id: 'b1' },
      { id: 'b2', children: [{ id: 'b2-1' }, { id: 'b2-2' }] },
    ],
  }),
  node: {
    style: {
      size: 8,
      labelText: (d) => d.id,
      labelFontSize: 12,
    },
  },
  layout: {
    type: 'dendrogram',    // 或 'compact-box' with radial
    radial: true,
  },
  transforms: [
    {
      type: 'place-radial-labels',
      offset: 4,           // 标签距离节点的偏移量（px）
    },
  ],
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

### place-radial-labels 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `string` | `'place-radial-labels'` | 变换类型 |
| `offset` | `number` | — | 标签距离节点的额外偏移量（px） |

### 径向树完整示例

```javascript
import { Graph, treeToGraphData } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 800,
  autoFit: 'view',
  data: treeToGraphData({
    id: '根节点',
    children: Array.from({ length: 6 }, (_, i) => ({
      id: `分支${i + 1}`,
      children: Array.from({ length: 3 }, (_, j) => ({
        id: `${i + 1}-${j + 1}`,
      })),
    })),
  }),
  node: {
    type: 'circle',
    style: {
      size: 10,
      fill: '#1783FF',
      labelText: (d) => d.id,
      labelFontSize: 11,
      labelFill: '#333',
    },
  },
  edge: {
    type: 'line',
    style: { stroke: '#aaa', lineWidth: 1 },
  },
  layout: {
    type: 'radial',          // 辐射布局
    unitRadius: 120,
    preventOverlap: true,
    nodeSize: 20,
  },
  transforms: [
    {
      type: 'place-radial-labels',
      offset: 4,
    },
  ],
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

---

## 组合使用：双向图 + 平行边处理

```javascript
import { Graph } from '@antv/g6';

// 微服务依赖图：A 调用 B 的多个 API，B 返回响应
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 500,
   {
    nodes: [
      { id: 'service-a', data: { label: '服务A' } },
      { id: 'service-b', data: { label: '服务B' } },
      { id: 'service-c', data: { label: '服务C' } },
    ],
    edges: [
      { source: 'service-a', target: 'service-b', data: { label: 'API /users' } },
      { source: 'service-a', target: 'service-b',  { label: 'API /orders' } },
      { source: 'service-b', target: 'service-a', data: { label: '响应' } },
      { source: 'service-b', target: 'service-c', data: { label: '查询' } },
      { source: 'service-c', target: 'service-b',  { label: '结果' } },
    ],
  },
  node: {
    type: 'rect',
    style: {
      size: [120, 40],
      fill: '#e6f7ff',
      stroke: '#1783FF',
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      ports: [{ placement: 'center' }],
    },
  },
  edge: {
    style: {
      labelText: (d) => d?.data?.label,
      labelBackground: true,
      endArrow: true,
      stroke: '#1783FF',
    },
  },
  layout: { type: 'force', linkDistance: 200 },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
  transforms: [
    {
      type: 'process-parallel-edges',
      mode: 'bundle',
      distance: 25,
    },
  ],
});

graph.render();
```
