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
- **G6 5.x 支持 combo 作为边的源或目标**（即边可以连接 combo）

## Combo 数据结构

| 属性 | 描述 | 类型 | 默认值 | 必选 |
|------|------|------|--------|------|
| `id` | 组合的唯一标识符 | `string` | - | ✓ |
| `type` | 组合类型（`circle`/`rect`） | `string` | - | |
| `data` | 业务数据（标签等） | `object` | - | |
| `style` | 样式配置（位置、折叠状态等） | `object` | - | |
| `combo` | 父 combo ID（用于嵌套） | `string` | - | |
| `states` | 初始状态 | `string[]` | - | |

**重要**：父 combo（被其他 combo 引用的容器）也需要在 `combos` 数组中定义，即使它只有 `id` 字段。

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

嵌套 combo 时，子 combo 通过 `combo` 字段指定父 combo ID，**父 combo 必须在 `combos` 数组中定义**：

```javascript
data: {
  combos: [
     { id: 'parent', data: { label: '母公司' } },           // 父 combo
     { id: 'child1', combo: 'parent', data: { label: '子公司A' } },  // 子 combo
     { id: 'child2', combo: 'parent', data: { label: '子公司B' } },  // 子 combo
  ],
  nodes: [
     { id: 'n1', combo: 'child1', data: { label: '员工1' } },
     { id: 'n2', combo: 'child1', data: { label: '员工2' } },
     { id: 'n3', combo: 'child2', data: { label: '员工3' } },
  ],
},
```

## Combo 作为边的端点

G6 5.x 支持将 combo 作为边的 source 或 target：

```javascript
data: {
  nodes: [
    { id: 'n1', combo: 'c1' },
    { id: 'n2', combo: 'c2' },
  ],
  edges: [
    { source: 'c1', target: 'n2' },    // 从 combo 到节点
    { source: 'c1', target: 'c2' },   // 从 combo 到 combo
  ],
  combos: [
    { id: 'c1', data: { label: '组1' } },
    { id: 'c2', data: { label: '组2' } },
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

## 初始折叠状态

在数据中设置 combo 的初始折叠状态：

```javascript
combos: [
  { 
    id: 'c1', 
    data: { label: '折叠组' },
    style: { collapsed: true }        // 初始折叠
  },
],
```

## Combo 样式属性参考

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fill` | `string` | — | 背景填充色 |
| `stroke` | `string` | — | 边框颜色 |
| `lineWidth` | `number` | `1` | 边框宽度 |
| `padding` | `number \| number[]` | `10` | 内边距 |
| `radius` | `number` | `0` | 圆角（rect combo） |
| `collapsed` | `boolean` | `false` | 是否折叠 |
| `collapsedSize` | `[number, number]` | — | 折叠后尺寸 |
| `collapsedFill` | `string` | — | 折叠后填充色 |
| `labelText` | `string \| ((d) => string)` | — | 标签文字 |
| `labelPlacement` | `'top' \| 'bottom' \| 'center'` | `'top'` | 标签位置 |

## 常见错误与修正

### 错误：将父 combo 错误识别为普通节点

当解析混合数据时，父 combo（被其他 combo 引用的容器）如果没有明显的 combo 特征（如没有 `style.collapsed`），容易被误判为普通节点，导致 `Node not found` 错误。

```javascript
// ❌ 错误：将 combo2 识别为节点
const rawData = [
  {"id":"combo1","combo":"combo2"},  // combo1 属于 combo2
  {"id":"combo2"},                    // 父 combo，但可能被误判为节点
];

// 错误的解析逻辑（导致 combo2 成为节点而非 combo）
const nodes = rawData.filter(item => !item.combo && !item.style?.collapsed);
const combos = rawData.filter(item => item.combo || item.style?.collapsed);

// ✅ 正确：先收集所有 combo ID，包括被引用的父 combo
const comboIds = new Set();
rawData.forEach(item => {
  if (item.combo) comboIds.add(item.combo);  // 收集父 combo ID
  if (item.style?.collapsed !== undefined || item.combo) {
    comboIds.add(item.id);  // 收集明确的 combo
  }
});

// 然后根据 comboIds 分类
const nodes = rawData.filter(item => !comboIds.has(item.id));
const combos = rawData.filter(item => comboIds.has(item.id));
```

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

### 错误：边引用了未定义的 combo 作为端点

```javascript
// ❌ combo 'c1' 未在 combos 数组中定义，但边引用了它
edges: [{ source: 'c1', target: 'n1' }],
nodes: [{ id: 'n1' }],
combos: [],

// ✅ 确保作为边端点的 combo 已定义
combos: [{ id: 'c1', data: { label: '组1' } }],
nodes: [{ id: 'n1' }],
edges: [{ source: 'c1', target: 'n1' }],
```