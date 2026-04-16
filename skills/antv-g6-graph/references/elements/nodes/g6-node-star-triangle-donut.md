---
id: "g6-node-star-triangle-donut"
title: "G6 特殊形状节点（Star / Triangle / Donut）"
description: |
  使用五角星（star）、三角形（triangle）、环形进度（donut）节点。
  适合特殊标注、方向指示、进度展示等场景。

library: "g6"
version: "5.x"
category: "elements"
subcategory: "nodes"
tags:
  - "节点"
  - "五角星"
  - "三角形"
  - "环形"
  - "star"
  - "triangle"
  - "donut"

related:
  - "g6-node-circle"
  - "g6-node-diamond-ellipse-hexagon"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 五角星节点（star）

五角星节点适合"评分"、"收藏"、"重要标记"等场景。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: [
       { id: 's1', data: { label: '重要', level: 1 } },
       { id: 's2', data: { label: '普通', level: 0 } },
       { id: 's3', data: { label: '关键', level: 2 } },
    ],
    edges: [
       { source: 's1', target: 's2' },
       { source: 's2', target: 's3' },
    ],
  },
  node: {
    type: 'star',
    style: {
      size: 60,                          // 外接圆直径
      fill: (d) => (d.data.level > 0 ? '#faad14' : '#ddd'),
      stroke: '#d48806',
      lineWidth: 2,
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
    },
  },
  layout: { type: 'circular' },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

### star 特有属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `number` | `32` | 外接圆直径 |

> 内圈半径自动计算为 `outerR * 3/8`，无需手动配置。

---

## 三角形节点（triangle）

三角形节点支持四个方向，可用于表示方向/流向。

```javascript
node: {
  type: 'triangle',
  style: {
    size: 50,
    direction: 'up',             // 'up' | 'down' | 'left' | 'right'
    fill: '#1783FF',
    stroke: '#fff',
    lineWidth: 2,
    labelText: (d) => d.data.label,
    labelPlacement: 'bottom',
  },
},
```

### triangle 特有属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `number` | `40` | 节点尺寸 |
| `direction` | `'up' \| 'down' \| 'left' \| 'right'` | `'up'` | 三角形朝向 |

---

## 环形进度节点（donut）

donut 节点在圆形基础上叠加一个或多个环形区域，适合展示多维度比例数据。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: [
      {
        id: 'n1',
        data: {
          label: '服务器A',
          cpu: 60,
          memory: 30,
          disk: 10,
        },
      },
      {
        id: 'n2',
        data: {
          label: '服务器B',
          cpu: 20,
          memory: 50,
          disk: 30,
        },
      },
    ],
    edges: [{ source: 'n1', target: 'n2' }],
  },
  node: {
    type: 'donut',
    style: {
      size: 80,
      fill: '#f0f0f0',
      stroke: '#d9d9d9',
      lineWidth: 1,
      // donuts：每一段的数值（自动归一化为比例）
      donuts: (d) => [d.data.cpu, d.data.memory, d.data.disk],
      // 自定义各段颜色（也可用 donutPalette 色板）
      donutPalette: ['#ff4d4f', '#1890ff', '#52c41a'],
      // 内圈半径，默认 '50%'（相对于 size）
      innerR: '40%',
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
    },
  },
  layout: { type: 'circular' },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

### donut 特有属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `donuts` | `number[] \| DonutRound[] \| ((d) => number[])` | `[]` | 各段数值，自动归一化 |
| `donutPalette` | `string \| string[]` | `'tableau'` | 各段颜色，支持内置色板名 |
| `innerR` | `number \| string` | `'50%'` | 内圈半径，百分比或 px |

### DonutRound 对象格式

```typescript
interface DonutRound {
  value: number;
  color?: string;       // 优先级高于 donutPalette
  label?: string;       // 段标签（当前版本不显示）
}

// 使用对象格式
donuts: (d) => [
    { value: d.data.cpu,    color: '#ff4d4f' },
    { value: d.data.memory, color: '#1890ff' },
    { value: d.data.disk,   color: '#52c41a' },
],
```

---

## 常见错误

### 错误：donuts 设置为 0 时不显示

```javascript
// ❌ 如果所有 donuts 值均为 0，不会渲染环形
donuts: [0, 0, 0]

// ✅ 确保至少有一个非零值
donuts: (d) => [d.data.a || 1, d.data.b, d.data.c]
```
