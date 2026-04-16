---
id: "g6-combo-overview"
title: "G6 Combo（组合节点）"
description: |
  使用 combo 对节点进行分组/归类，支持折叠/展开、拖拽移动、
  嵌套 combo。内置 circle-combo 和 rect-combo 两种类型。

library: "g6"
version: "5.x"
category: "elements"
subcategory: "combos"
tags:
  - "combo"
  - "组合"
  - "分组"
  - "折叠"
  - "展开"

related:
  - "g6-node-circle"
  - "g6-behavior-drag-element"
  - "g6-layout-dagre"

use_cases:
  - "组织架构图（部门分组）"
  - "微服务架构（服务分组）"
  - "多层嵌套关系展示"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 核心概念

**Combo** 是对一组节点/子 combo 的包围容器，通过 `combo` 字段关联：
- 节点数据中 `combo: 'comboId'` 表示该节点属于指定 combo
- Combo 自动根据内部元素计算大小
- 支持折叠（collapsed）状态

## 最小可运行示例（rect-combo）

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [
       { id: 'n1', combo: 'c1', data: { label: '前端A' } },
       { id: 'n2', combo: 'c1', data: { label: '前端B' } },
       { id: 'n3', combo: 'c2', data: { label: '后端A' } },
       { id: 'n4', combo: 'c2', data: { label: '后端B' } },
       { id: 'n5', combo: 'c2', data: { label: '后端C' } },
    ],
    edges: [
       { source: 'n1', target: 'n3' },
       { source: 'n2', target: 'n4' },
    ],
    combos: [
       { id: 'c1', data: { label: '前端团队' } },
       { id: 'c2', data: { label: '后端团队' } },
    ],
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
    },
  },
  combo: {
    type: 'rect',                      // 'rect' | 'circle'
    style: {
      fill: '#f0f5ff',
      stroke: '#adc6ff',
      lineWidth: 1,
      radius: 8,                       // 圆角
      padding: 20,                     // 内边距
      labelText: (d) => d.data.label,
      labelPlacement: 'top',
      labelFill: '#1d39c4',
      labelFontWeight: 600,
      // 折叠后的尺寸
      collapsedSize: [60, 30],
      collapsedFill: '#1783FF',
    },
  },
  layout: { type: 'antv-dagre', rankdir: 'LR', nodesep: 20, ranksep: 60 },
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    'drag-element',
    {
      type: 'collapse-expand',
      trigger: 'dblclick',           // 双击 combo 折叠/展开
    },
  ],
});

graph.render();
```

## 圆形 Combo（circle-combo）

```javascript
combo: {
  type: 'circle',
  style: {
    fill: '#f0f5ff',
    stroke: '#adc6ff',
    lineWidth: 1,
    padding: 10,
    labelText: (d) => d.data.label,
    labelPlacement: 'top',
  },
},
```

## 嵌套 Combo

```javascript
data: {
  combos: [
     { id: 'parent', data: { label: '母公司' } },
     { id: 'child1', combo: 'parent', data: { label: '子公司A' } },
     { id: 'child2', combo: 'parent', data: { label: '子公司B' } },
  ],
  nodes: [
     { id: 'n1', combo: 'child1', data: { label: '员工1' } },
     { id: 'n2', combo: 'child1', data: { label: '员工2' } },
     { id: 'n3', combo: 'child2', data: { label: '员工3' } },
  ],
},
```

## 折叠 / 展开 API

```javascript
// 折叠 combo
await graph.collapseElement('c1');

// 展开 combo
await graph.expandElement('c1');

// 判断是否折叠
const isCollapsed = graph.isCollapsed('c1');
```

## Combo 样式属性参考

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fill` | `string` | — | 背景填充色 |
| `stroke` | `string` | — | 边框颜色 |
| `lineWidth` | `number` | `1` | 边框宽度 |
| `padding` | `number \| number[]` | `10` | 内边距 |
| `radius` | `number` | `0` | 圆角（rect combo） |
| `collapsedSize` | `[number, number]` | — | 折叠后尺寸 |
| `collapsedFill` | `string` | — | 折叠后填充色 |
| `labelText` | `string \| ((d) => string)` | — | 标签文字 |
| `labelPlacement` | `'top' \| 'bottom' \| 'center'` | `'top'` | 标签位置 |

## 常见错误

### 错误：将业务数据（labelText）放在 combo 的 `style` 字段而非 `data` 字段

```javascript
// ❌ style 字段用于样式覆盖（坐标、尺寸等），不是业务数据的存储位置
combos: [
  { id: 'a', style: { labelText: 'Combo A' } },
],
combo: {
  style: {
    labelText: (d) => d.style.labelText,  // 可能在样式计算阶段读取失败
  },
},

// ✅ 业务数据放在 data 字段
combos: [
  { id: 'a', data: { label: 'Combo A' } },
],
combo: {
  style: {
    labelText: (d) => d.data.label,
  },
},
```

### 错误：circle combo 使用 `radius` 属性

```javascript
// ❌ radius 只对 rect combo 有效（用于圆角），circle combo 半径由内容自动计算
combo: {
  type: 'circle',
  style: { radius: 10 },   // 无效，不会生效
},

// ✅ circle combo 用 padding 控制内边距
combo: {
  type: 'circle',
  style: { padding: 10 },
},
```

### 错误：节点 combo 字段引用了不存在的 combo id

```javascript
// ❌ combo 'cx' 未在 combos 数组中定义
nodes: [{ id: 'n1', combo: 'cx', data: {} }],
combos: [],

// ✅ 确保 combo id 存在
combos: [{ id: 'cx', data: { label: '组' } }],
nodes: [{ id: 'n1', combo: 'cx', data: {} }],
```
