---
id: "g6-node-diamond-ellipse-hexagon"
title: "G6 多边形节点（Diamond / Ellipse / Hexagon）"
description: |
  使用菱形（diamond）、椭圆（ellipse）、六边形（hexagon）节点创建图可视化。
  适合流程图决策节点、强调纵向关系、蜂窝布局等场景。

library: "g6"
version: "5.x"
category: "elements"
subcategory: "nodes"
tags:
  - "节点"
  - "菱形"
  - "椭圆"
  - "六边形"
  - "diamond"
  - "ellipse"
  - "hexagon"

related:
  - "g6-node-circle"
  - "g6-node-rect"
  - "g6-state-overview"

use_cases:
  - "流程图决策节点（diamond）"
  - "蜂窝/蜂巢布局（hexagon）"
  - "强调纵向关系（ellipse）"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 菱形节点（diamond）

菱形节点常用于流程图中的决策节点（判断分支）。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: [
       { id: 'start', data: { label: '开始' } },
       { id: 'decision', data: { label: '是否满足条件？' } },
       { id: 'yes', data: { label: '执行A' } },
       { id: 'no', data: { label: '执行B' } },
    ],
    edges: [
       { source: 'start', target: 'decision' },
       { source: 'decision', target: 'yes', data: { label: '是' } },
       { source: 'decision', target: 'no', data: { label: '否' } },
    ],
  },
  node: {
    // 通过回调按节点 id 指定不同类型
    type: (d) => (d.id === 'decision' ? 'diamond' : 'rect'),
    style: {
      size: (d) => (d.id === 'decision' ? 60 : [100, 40]),
      fill: (d) => (d.id === 'decision' ? '#faad14' : '#1783FF'),
      stroke: '#fff',
      lineWidth: 2,
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      labelFill: '#fff',
      labelFontSize: 12,
    },
  },
  edge: {
    style: {
      endArrow: true,
      labelText: (d) => d.data.label,
      labelBackground: true,
    },
  },
  layout: { type: 'dagre', rankdir: 'TB', nodesep: 30, ranksep: 40 },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

### diamond 样式属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `size` | `number` | 节点整体尺寸，控制宽高 |
| `fill` | `string` | 填充颜色 |
| `stroke` | `string` | 描边颜色 |
| `lineWidth` | `number` | 描边宽度 |

---

## 椭圆节点（ellipse）

椭圆节点默认尺寸 [45, 35]，适合数据库实体（ER 图）等场景。

```javascript
node: {
  type: 'ellipse',
  style: {
    size: [80, 50],          // [宽, 高]
    fill: '#722ED1',
    stroke: '#fff',
    lineWidth: 2,
    labelText: (d) => d.data.label,
    labelPlacement: 'center',
    labelFill: '#fff',
  },
},
```

### ellipse 特有属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `size` | `[number, number]` | `[宽度, 高度]`，分别对应 rx×2, ry×2 |

---

## 六边形节点（hexagon）

六边形节点适合蜂窝布局，具有良好的空间利用率。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: Array.from({ length: 12 }, (_, i) => ({
      id: `h${i}`,
           { label: `区域${i + 1}`, value: Math.random() * 100 },
    })),
    edges: [],
  },
  node: {
    type: 'hexagon',
    style: {
      size: 60,              // 外接圆半径 * 2
      fill: (d) => {
        const level = Math.floor(d.data.value / 33);
        return ['#52c41a', '#faad14', '#ff4d4f'][level] || '#1783FF';
      },
      stroke: '#fff',
      lineWidth: 2,
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      labelFill: '#fff',
      labelFontSize: 11,
    },
  },
  layout: { type: 'grid', cols: 4 },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

### hexagon 特有属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `size` | `number` | 等价于 `outerR * 2`（外接圆直径） |

---

## 常见错误

### 错误：为 diamond/hexagon 设置数组 size

```javascript
// ❌ diamond/hexagon/star/triangle 只接受单个数值
node: {
  type: 'diamond',
  style: { size: [60, 40] },
}

// ✅ 正确
node: {
  type: 'diamond',
  style: { size: 60 },
}

// 只有 ellipse/rect 支持 [width, height] 数组
node: {
  type: 'ellipse',
  style: { size: [80, 50] },
}
```
