---
id: "g6-behavior-lasso-collapse"
title: "G6 套索选择（lasso-select）与折叠展开（collapse-expand）"
description: |
  lasso-select：自由绘制选区套索选中多个元素。
  collapse-expand：点击/双击节点或 combo 折叠/展开其子树或内部节点。

library: "g6"
version: "5.x"
category: "behaviors"
subcategory: "interaction"
tags:
  - "交互"
  - "套索"
  - "框选"
  - "lasso-select"
  - "collapse-expand"
  - "折叠"
  - "展开"

related:
  - "g6-behavior-click-select"
  - "g6-combo-overview"
  - "g6-pattern-tree-graph"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 套索选择（lasso-select）

允许用户绘制自由曲线选区，圈住的元素被标记为 selected 状态。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: Array.from({ length: 20 }, (_, i) => ({
      id: `n${i}`,
       data: { label: `节点${i}` },
    })),
    edges: Array.from({ length: 15 }, (_, i) => ({
      source: `n${i % 10}`,
      target: `n${(i + 3) % 20}`,
    })),
  },
  node: {
    type: 'circle',
    style: {
      size: 30,
      fill: '#1783FF',
      stroke: '#fff',
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
    },
    state: {
      selected: {
        fill: '#ff4d4f',
        stroke: '#cf1322',
        halo: true,
        haloFill: '#ff4d4f',
        haloOpacity: 0.2,
      },
    },
  },
  layout: { type: 'force', preventOverlap: true },
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    {
      type: 'lasso-select',
      // 鼠标右键拖拽触发套索（避免与拖拽画布冲突）
      trigger: 'pointerdown',
      // 套索样式
      style: {
        fill: 'rgba(99, 149, 255, 0.1)',
        stroke: '#6395ff',
        lineWidth: 1,
        lineDash: [4, 2],
      },
      // 选中状态名
      state: 'selected',
      // 实时更新（拖拽过程中动态高亮）
      immediately: false,
      // 被选范围内的元素类型
      itemTypes: ['node'],         // 只选节点，不选边
    },
  ],
});

graph.render();

// 获取所有选中节点
graph.on('canvas:pointerup', () => {
  const selectedNodes = graph.getElementDataByState('node', 'selected');
  console.log('选中节点:', selectedNodes.map(n => n.id));
});
```

### lasso-select 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `trigger` | `string` | `'pointerdown'` | 触发事件 |
| `immediately` | `boolean` | `false` | 拖拽时实时更新选中状态 |
| `state` | `string` | `'selected'` | 选中状态名 |
| `itemTypes` | `('node' \| 'edge' \| 'combo')[]` | `['node', 'edge', 'combo']` | 参与选择的元素类型 |
| `style` | `PathStyleProps` | — | 套索路径样式 |

---

## 折叠展开（collapse-expand）

点击/双击节点（树图）或 combo 折叠/展开子树。

```javascript
import { Graph, treeToGraphData } from '@antv/g6';

const treeData = {
  id: 'root',
   data: { label: '根节点' },
  children: [
    {
      id: 'branch1',
       data: { label: '分支1' },
      children: [
        { id: 'leaf1', data: { label: '叶子1' } },
        { id: 'leaf2', data: { label: '叶子2' } },
      ],
    },
    {
      id: 'branch2',
      data: { label: '分支2' },
      children: [
        { id: 'leaf3', data: { label: '叶子3' } },
      ],
    },
  ],
};

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: treeToGraphData(treeData),
  node: {
    type: 'rect',
    style: {
      size: [100, 36],
      fill: '#1783FF',
      stroke: '#fff',
      radius: 4,
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      labelFill: '#fff',
    },
  },
  edge: {
    type: 'cubic-horizontal',
    style: { stroke: '#aaa' },
  },
  layout: {
    type: 'mindmap',
    direction: 'H',
    getHeight: () => 36,
    getWidth: () => 100,
    getVGap: () => 10,
    getHGap: () => 60,
  },
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    {
      type: 'collapse-expand',
      trigger: 'click',              // 'click' | 'dblclick'
      animation: true,               // 折叠时带动画
      // 折叠/展开回调
      onCollapse: (id) => console.log('折叠:', id),
      onExpand: (id) => console.log('展开:', id),
    },
  ],
});

graph.render();
```

### collapse-expand 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `trigger` | `'click' \| 'dblclick'` | `'dblclick'` | 触发方式 |
| `animation` | `boolean` | `true` | 折叠/展开动画 |
| `enable` | `boolean \| ((event) => boolean)` | `true` | 是否启用 |
| `align` | `boolean` | `true` | 折叠后是否自动居中 |
| `onCollapse` | `(id: string) => void` | — | 折叠完成回调 |
| `onExpand` | `(id: string) => void` | — | 展开完成回调 |

### 通过 API 控制折叠展开

```javascript
// 折叠节点及其子树
await graph.collapseElement('branch1');

// 展开
await graph.expandElement('branch1');

// 检查状态
console.log(graph.isCollapsed('branch1')); // true/false
```

## 常见错误

### 错误：在非树图中使用 collapse-expand

```javascript
// collapse-expand 只适用于树形数据（每个节点有唯一父节点）
// 在普通网络图中使用会导致意外行为

// ✅ 树图专用，配合 treeToGraphData 使用
import { treeToGraphData } from '@antv/g6';
data: treeToGraphData(treeData),
behaviors: [{ type: 'collapse-expand' }],
```
