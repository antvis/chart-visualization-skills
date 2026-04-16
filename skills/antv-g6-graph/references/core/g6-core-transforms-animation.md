---
id: "g6-core-transforms-animation"
title: "G6 数据变换（Transforms）与动画系统"
description: |
  Transforms：在渲染前对图数据进行处理（节点大小映射、平行边处理等）。
  动画：元素进入/退出/更新动画，视口动画，自定义动画配置。

library: "g6"
version: "5.x"
category: "core"
subcategory: "data"
tags:
  - "transforms"
  - "动画"
  - "map-node-size"
  - "process-parallel-edges"
  - "animation"

related:
  - "g6-core-graph-init"
  - "g6-core-graph-api"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 数据变换（Transforms）

Transforms 是在数据绑定到图元素前的处理管道，用于数据到可视属性的映射。

### map-node-size（节点大小映射）

将节点数据字段映射到节点尺寸区间：

```javascript
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [
       { id: 'n1', data: { label: 'A', value: 10 } },
       { id: 'n2', data: { label: 'B', value: 50 } },
       { id: 'n3', data: { label: 'C', value: 100 } },
    ],
    edges: [
       { source: 'n1', target: 'n2' },
       { source: 'n2', target: 'n3' },
    ],
  },
  // transforms 在 Graph 配置顶层
  transforms: [
    {
      type: 'map-node-size',
      field: 'value',          // 映射的数据字段（从 node.data 中读取）
      range: [16, 60],         // 映射到的尺寸范围 [最小, 最大]（px）
    },
  ],
  node: {
    type: 'circle',
    style: {
      // size 不需要再手动设置，transform 自动计算
      fill: '#1783FF',
      stroke: '#fff',
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
    },
  },
  layout: { type: 'force', preventOverlap: true },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

### process-parallel-edges（平行边处理）

当两个节点之间存在多条边时，自动将它们错开展示：

```javascript
transforms: [
  {
    type: 'process-parallel-edges',
    offset: 15,                // 平行边之间的间距（px）
    // 只对有平行关系的边应用曲线
  },
],
edge: {
  type: 'quadratic',           // 推荐与 quadratic 配合使用
  style: {
    stroke: '#aaa',
    endArrow: true,
  },
},
```

### 内置 Transforms 列表

| 类型 | 说明 | 常用参数 |
|------|------|---------|
| `map-node-size` | 数据驱动节点大小 | `field`, `range` |
| `process-parallel-edges` | 平行边错开展示 | `offset` |
| `place-radial-labels` | 径向布局标签自动定位 | — |
| `arrange-draw-order` | 调整元素渲染顺序 | `nodeBeforeEdge` |
| `get-edge-actual-ends` | 计算边的实际端点（端口支持） | — |
| `update-related-edge` | 节点移动时更新关联边 | — |

---

## 动画系统

### 全局动画开关

```javascript
const graph = new Graph({
  container: 'container',
  // 禁用所有动画（提升大图性能）
  animation: false,
  // ...
});
```

### 元素进入/退出/更新动画

```javascript
const graph = new Graph({
  container: 'container',
    { nodes: [...], edges: [...] },
  node: {
    type: 'circle',
    style: { size: 40, fill: '#1783FF' },
    // 动画配置（每个阶段独立）
    animation: {
      // 节点初始进入动画
      enter: [
        {
          fields: ['opacity'],         // 动画属性
          from: { opacity: 0 },        // 起始值
          to: { opacity: 1 },          // 结束值
          duration: 500,
          easing: 'ease-in',
        },
      ],
      // 节点更新动画（数据变化时）
      update: [
        {
          fields: ['fill', 'size'],
          duration: 300,
          easing: 'linear',
        },
      ],
      // 节点退出动画（删除时）
      exit: [
        {
          fields: ['opacity'],
          to: { opacity: 0 },
          duration: 300,
        },
      ],
    },
  },
});
```

### 视口动画配置

所有视口操作（fitView, focusElement, zoomTo, translateTo）都支持动画参数：

```javascript
// ViewportAnimationEffectTiming
await graph.fitView({
  padding: 20,
  // 动画配置
  easing: 'ease-in-out',
  duration: 600,
});

await graph.zoomTo(1.5, {
  easing: 'ease-out',
  duration: 400,
});

await graph.focusElement('n1', {
  easing: 'ease-in-out',
  duration: 500,
});
```

### 常用 easing 值

| 值 | 说明 |
|----|------|
| `'linear'` | 匀速 |
| `'ease'` | 先慢后快再慢 |
| `'ease-in'` | 先慢后快 |
| `'ease-out'` | 先快后慢 |
| `'ease-in-out'` | 先慢快慢 |
| `'cubic-bezier(...)` | 自定义三次贝塞尔 |

---

## 性能优化建议

```javascript
// 1. 大规模图（> 1000 节点）禁用动画
animation: false,

// 2. 使用 optimize-viewport-transform 行为减少渲染
behaviors: [
  'drag-canvas',
  'zoom-canvas',
  {
    type: 'optimize-viewport-transform',
    // 视口变换时隐藏细节（标签等），提升帧率
    shapes: (id, elementType) => {
      if (elementType === 'node') return ['label', 'icon', 'halo'];
      return ['label'];
    },
  },
],

// 3. 布局完成后停止力导向迭代
layout: {
  type: 'force',
  maxIteration: 300,           // 限制最大迭代次数
  minMovement: 0.5,            // 收敛阈值
},
```
