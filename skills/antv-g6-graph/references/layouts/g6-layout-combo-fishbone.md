---
id: "g6-layout-combo-fishbone"
title: "G6 复合布局 + 鱼骨布局（combo-combined / fishbone）"
description: |
  combo-combined：专为含 Combo 分组的图设计，外层节点用力导向，Combo 内部用同心圆等布局。
  fishbone：鱼骨图布局，适合层次结构、因果分析、故障分析等场景。

library: "g6"
version: "5.x"
category: "layouts"
subcategory: "hierarchical"
tags:
  - "combo-combined"
  - "fishbone"
  - "复合布局"
  - "鱼骨图"
  - "因果分析"
  - "Combo布局"

related:
  - "g6-combo-overview"
  - "g6-layout-force"
  - "g6-layout-advanced"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-16"
updated: "2026-04-16"
---

## 复合布局（combo-combined）

专为含有 Combo 分组的图设计，默认外层使用力导向（gForce），Combo 内部使用同心圆布局（Concentric），兼顾整体稳定性与内部结构清晰度。

> ⚠️ **autoFit 白屏陷阱**：`combo-combined` 外层默认 `gForce` 为异步力导向布局。在 Graph config 中直接设置 `autoFit: 'view'` 时，`fitView` 会在力导向开始迭代之前执行，节点全部堆在原点，包围盒面积为零，导致缩放比例异常 → **白屏**。
>
> 正确做法：**不在 config 中设置 `autoFit`**，改为监听 `GraphEvent.AFTER_LAYOUT` 再调用 `fitView()`。

```javascript
import { Graph, GraphEvent } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  // ❌ 不要在此设置 autoFit: 'view'，会在力导向迭代前触发导致白屏
   {
    nodes: [
      { id: 'n1', combo: 'c1', data: { label: '节点1' } },
      { id: 'n2', combo: 'c1',  { label: '节点2' } },
      { id: 'n3', combo: 'c1',  { label: '节点3' } },
      { id: 'n4', combo: 'c2',  { label: '节点4' } },
      { id: 'n5', combo: 'c2', data: { label: '节点5' } },
      { id: 'n6', data: { label: '游离节点' } },
    ],
    edges: [
      { source: 'n1', target: 'n4' },
      { source: 'n3', target: 'n5' },
      { source: 'n5', target: 'n6' },
    ],
    combos: [
      { id: 'c1',  { label: '分组A' } },
      { id: 'c2', data: { label: '分组B' } },
    ],
  },
  node: {
    style: {
      size: 24,
      labelText: (d) => d.data.label,
    },
    palette: {
      type: 'group',
      field: (d) => d.combo,
    },
  },
  combo: {
    type: 'rect',
    style: {
      labelText: (d) => d.data.label,  // ✅ 业务数据从 data 字段读取，不要放在 style 字段
      labelPlacement: 'top',
      padding: 20,
    },
  },
  layout: {
    type: 'combo-combined',
    comboPadding: 10,    // Combo 内 padding（影响力计算，建议与视觉 padding 一致）
    nodeSize: 24,        // 节点大小（用于碰撞检测）
    spacing: 8,          // 防止重叠的最小间距
  },
  behaviors: ['drag-element', 'drag-canvas', 'zoom-canvas'],
});

// ✅ 力导向布局完成后再 fitView，避免白屏
graph.on(GraphEvent.AFTER_LAYOUT, () => {
  graph.fitView({ padding: 20 });
});

graph.render();
```
---

## 鱼骨布局（fishbone）

鱼骨图布局，将层次结构数据排列成鱼骨形状。适合展示因果关系（石川图/鱼骨图）、故障分析、多因素分析等场景。

> 注意：fishbone 需要树形数据，通常配合 `treeToGraphData()` 使用。

```javascript
import { Graph, treeToGraphData } from '@antv/g6';

const treeData = {
  id: '结果',
  children: [
    {
      id: '原因A',
      children: [
        { id: '子因A1' },
        { id: '子因A2' },
      ],
    },
    {
      id: '原因B',
      children: [
        { id: '子因B1' },
        { id: '子因B2', children: [{ id: '孙因B2-1' }] },
      ],
    },
    { id: '原因C' },
  ],
};

const graph = new Graph({
  container: 'container',
  width: 900,
  height: 500,
  autoFit: 'view',
   treeToGraphData(treeData),
  node: {
    type: 'rect',
    style: {
      size: [80, 30],
      fill: '#e6f7ff',
      stroke: '#1783FF',
      labelText: (d) => d.id,
      labelPlacement: 'center',
      labelFill: '#333',
    },
  },
  edge: {
    type: 'polyline',
    style: {
      stroke: '#1783FF',
      lineWidth: 2,
    },
  },
  layout: {
    type: 'fishbone',
    direction: 'LR',   // 'LR'：鱼头在左；'RL'：鱼头在右（默认）
    hGap: 60,          // 水平间距
    vGap: 40,          // 垂直间距
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

### fishbone 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `string` | `'fishbone'` | 布局类型 |
| `direction` | `'LR' \| 'RL'` | `'RL'` | 方向：LR 鱼头在左，RL 鱼头在右 |
| `hGap` | `number` | — | 水平间距 |
| `vGap` | `number` | — | 垂直间距 |
| `getRibSep` | `(node) => number` | `() => 60` | 鱼骨间距回调 |
| `nodeSize` | `number \| [number, number] \| Function` | — | 节点大小 |
| `nodeFilter` | `(node) => boolean` | — | 参与布局的节点过滤器 |
| `preLayout` | `boolean` | — | 是否在初始化前预计算布局 |

### 6M 鱼骨图（石川图）示例

```javascript
import { Graph } from '@antv/g6';

// 直接使用带 depth 和 children 字段的扁平数据（G6 fishbone 支持此格式）
const graph = new Graph({
  container: 'container',
  width: 1000,
  height: 600,
  autoFit: 'view',
  data: {
    nodes: [
      { id: '质量问题', depth: 0, children: ['人', '机', '料', '法', '环', '测'] },
      { id: '人', depth: 1, children: ['培训不足', '操作失误'] },
      { id: '培训不足', depth: 2 },
      { id: '操作失误', depth: 2 },
      { id: '机', depth: 1, children: ['设备老化'] },
      { id: '设备老化', depth: 2 },
      { id: '料', depth: 1 },
      { id: '法', depth: 1, children: ['流程缺失'] },
      { id: '流程缺失', depth: 2 },
      { id: '环', depth: 1 },
      { id: '测', depth: 1 },
    ],
    edges: [
      { source: '质量问题', target: '人' },
      { source: '质量问题', target: '机' },
      { source: '质量问题', target: '料' },
      { source: '质量问题', target: '法' },
      { source: '质量问题', target: '环' },
      { source: '质量问题', target: '测' },
      { source: '人', target: '培训不足' },
      { source: '人', target: '操作失误' },
      { source: '机', target: '设备老化' },
      { source: '法', target: '流程缺失' },
    ],
  },
  node: {
    type: 'rect',
    style: {
      size: [80, 32],
      fill: '#fff7e6',
      stroke: '#fa8c16',
      lineWidth: 1,
      labelText: (d) => d.id,
      labelPlacement: 'center',
    },
  },
  edge: {
    type: 'polyline',
    style: { stroke: '#fa8c16', lineWidth: 2 },
  },
  layout: {
    type: 'fishbone',
    direction: 'RL',
    hGap: 60,
    vGap: 48,
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```
