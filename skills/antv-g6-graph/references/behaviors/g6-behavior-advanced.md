---
id: "g6-behavior-advanced"
title: "G6 高级交互行为（fix-element-size / auto-adapt-label / drag-element-force）"
description: |
  fix-element-size：缩放时保持指定元素（标签、边框等）尺寸不变。
  auto-adapt-label：视口空间不足时自动隐藏重叠标签。
  drag-element-force：在力导向布局中实时拖拽节点并更新布局。

library: "g6"
version: "5.x"
category: "behaviors"
subcategory: "interaction"
tags:
  - "交互"
  - "fix-element-size"
  - "auto-adapt-label"
  - "drag-element-force"
  - "性能优化"

related:
  - "g6-behavior-drag-element"
  - "g6-layout-force"

difficulty: "advanced"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 缩放时固定元素尺寸（fix-element-size）

当用户缩小画布时，保持标签、边框等关键视觉元素的绝对像素尺寸，防止字体变得过小难以阅读。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: Array.from({ length: 20 }, (_, i) => ({
      id: `n${i}`,
           { label: `节点${i}` },
    })),
    edges: Array.from({ length: 15 }, (_, i) => ({
      source: `n${i % 10}`,
      target: `n${(i + 5) % 20}`,
    })),
  },
  node: {
    type: 'circle',
    style: {
      size: 36,
      fill: '#1783FF',
      stroke: '#fff',
      lineWidth: 2,
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
      labelFontSize: 12,
    },
  },
  layout: { type: 'force', preventOverlap: true },
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    'drag-element',
    {
      type: 'fix-element-size',
      // 只在缩小时启用（zoom < 1）
      enable: (event) => event.data.scale < 1,
      // 固定节点的标签尺寸
      node: [
         { shape: 'label' },                    // 固定标签（字号、位置不随缩放变化）
         { shape: 'key', fields: ['lineWidth'] }, // 固定节点边框宽度
      ],
      // 固定边的标签和线宽
      edge: [
         { shape: 'label' },
         { shape: 'key', fields: ['lineWidth'] },
         { shape: 'halo', fields: ['lineWidth'] },
      ],
    },
  ],
});

graph.render();
```

### fix-element-size 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enable` | `boolean \| ((event) => boolean)` | `(e) => e.data.scale < 1` | 启用条件 |
| `node` | `FixShapeConfig[]` | — | 节点中要固定的形状列表 |
| `edge` | `FixShapeConfig[]` | — | 边中要固定的形状列表 |
| `combo` | `FixShapeConfig[]` | — | combo 中要固定的形状列表 |
| `reset` | `boolean` | `false` | 是否在重绘时恢复原始样式 |

**FixShapeConfig：**
```typescript
interface FixShapeConfig {
  shape: string;           // 形状名：'key' | 'label' | 'halo' | 'icon' | ...
  fields?: string[];       // 只固定特定属性（如 lineWidth），不指定则固定所有
}
```

---

## 自动隐藏重叠标签（auto-adapt-label）

当视口空间不足时，根据节点重要性（中心度）自动隐藏低优先级标签，避免文字重叠。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: Array.from({ length: 50 }, (_, i) => ({
      id: `n${i}`,
           { label: `节点${i}`, degree: Math.floor(Math.random() * 10) },
    })),
    edges: Array.from({ length: 60 }, (_, i) => ({
      source: `n${i % 25}`,
      target: `n${(i * 3 + 7) % 50}`,
    })),
  },
  node: {
    type: 'circle',
    style: {
      size: 20,
      fill: '#1783FF',
      stroke: '#fff',
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
      labelFontSize: 11,
    },
  },
  layout: { type: 'force', preventOverlap: true, nodeSize: 20 },
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    {
      type: 'auto-adapt-label',
      // 标签间距检测 padding（px）
      padding: 4,
      // 节点重要性排序：使用中心度，度数高的节点标签优先显示
      sortNode: {
        type: 'degree',              // 'degree' | 'betweenness' | 'closeness' | 'eigenvector'
        direction: 'both',           // 'in' | 'out' | 'both'
      },
      // 防抖延迟（ms）
      throttle: 100,
    },
  ],
});

graph.render();
```

### auto-adapt-label 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `padding` | `number` | `0` | 标签碰撞检测额外间距 |
| `sortNode` | `NodeCentralityOptions \| SortFn` | `{ type: 'degree' }` | 节点排序（决定哪些标签优先显示） |
| `sortEdge` | `SortFn` | — | 边排序函数 |
| `sortCombo` | `SortFn` | — | combo 排序函数 |
| `throttle` | `number` | `100` | 防抖延迟（ms） |

---

## 力导向布局中拖拽节点（drag-element-force）

在 d3-force 布局运行时，拖拽节点同时更新布局力场，实现真实的物理效果。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: Array.from({ length: 20 }, (_, i) => ({
      id: `n${i}`,
           { label: `N${i}` },
    })),
    edges: Array.from({ length: 25 }, (_, i) => ({
      source: `n${i % 15}`,
      target: `n${(i * 2 + 3) % 20}`,
    })),
  },
  node: {
    type: 'circle',
    style: {
      size: 30,
      fill: '#1783FF',
      stroke: '#fff',
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      labelFill: '#fff',
    },
  },
  layout: {
    type: 'd3-force',              // 必须使用 d3-force 或 d3-force-3d
    link: { distance: 80 },
    many: { strength: -200 },
  },
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    {
      type: 'drag-element-force',
      // true：拖拽后节点固定在当前位置（不再参与布局）
      // false：松开后继续参与布局力场
      fixed: false,
    },
  ],
});

graph.render();
```

### drag-element-force 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fixed` | `boolean` | `false` | 拖拽松开后节点是否固定 |

> **注意：** `drag-element-force` 只支持 `d3-force` / `d3-force-3d` 布局，与普通 `force` 布局不兼容。普通力导向图请使用 `drag-element`。
