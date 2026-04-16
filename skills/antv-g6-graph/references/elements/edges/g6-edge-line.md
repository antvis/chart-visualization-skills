---
id: "g6-edge-line"
title: "G6 直线边（Line Edge）"
description: |
  使用直线边（line）连接节点，是最简单的边类型。
  支持箭头、标签、虚线等样式配置。

library: "g6"
version: "5.x"
category: "elements"
subcategory: "edges"
tags:
  - "边"
  - "直线"
  - "line"
  - "edge"
  - "箭头"
  - "有向图"

related:
  - "g6-edge-cubic"
  - "g6-edge-polyline"
  - "g6-node-circle"

use_cases:
  - "简单网络图"
  - "拓扑图"
  - "有向图"
  - "流程图（配合折线边）"

anti_patterns:
  - "节点较近且边较多时直线容易重叠，考虑用 cubic 或 quadratic"
  - "平行边场景（同源同目标多条边）使用 process-parallel-edges 变换"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/element/edge/line"
---

## 核心概念

直线边（`line`）是 G6 中最简单的边类型，直接连接两个节点，不带任何弯曲。

**主要样式属性：**
- `stroke`：边颜色
- `lineWidth`：边宽度
- `endArrow`：终点箭头（`true` 或箭头配置对象）
- `startArrow`：起点箭头
- `lineDash`：虚线配置

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: [
       { id: 'n1', data: { label: 'A' } },
       { id: 'n2', data: { label: 'B' } },
       { id: 'n3', data: { label: 'C' } },
    ],
    edges: [
       { id: 'e1', source: 'n1', target: 'n2', data: { label: '连接' } },
       { id: 'e2', source: 'n2', target: 'n3' },
    ],
  },
  node: {
    type: 'circle',
    style: {
      size: 36,
      fill: '#1783FF',
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      labelFill: '#fff',
    },
  },
  edge: {
    type: 'line',
    style: {
      stroke: '#999',
      lineWidth: 1.5,
      endArrow: true,              // 显示箭头
      labelText: (d) => d.data.label,
    },
  },
  layout: { type: 'dagre', rankdir: 'LR' },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```

## 常用变体

### 带权重的边（宽度映射）

```javascript
edge: {
  type: 'line',
  style: {
    stroke: '#aaa',
    lineWidth: (d) => Math.max(1, d.data.weight / 10),  // 按权重设置宽度
    endArrow: true,
    labelText: (d) => d.data.weight ? `${d.data.weight}` : '',
    labelFontSize: 12,
    labelFill: '#666',
  },
},
```

### 虚线边

```javascript
edge: {
  type: 'line',
  style: {
    stroke: '#aaa',
    lineWidth: 1.5,
    lineDash: [4, 4],        // 虚线：[实线长度, 间隔长度]
    endArrow: true,
  },
},
```

### 自定义箭头

```javascript
edge: {
  type: 'line',
  style: {
    stroke: '#1783FF',
    lineWidth: 2,
    endArrow: {
      type: 'triangle',      // 'triangle' | 'circle' | 'diamond' | 'rect' | 'vee' | 'simple'
      fill: '#1783FF',
      stroke: '#1783FF',
      size: 10,
    },
    startArrow: {
      type: 'circle',
      fill: '#fff',
      stroke: '#1783FF',
      size: 8,
    },
  },
},
```

### 按边类型着色

```javascript
edge: {
  type: 'line',
  style: {
    stroke: (d) => {
      const colors = {
        'dependency': '#4096ff',
        'extends': '#52c41a',
        'implements': '#fa8c16',
      };
      return colors[d.data.type] || '#aaa';
    },
    lineWidth: 1.5,
    endArrow: true,
    lineDash: (d) => d.data.type === 'implements' ? [4, 4] : [],
    labelText: (d) => d.data.type,
    labelFontSize: 11,
  },
},
```

### 处理平行边

```javascript
// 同一对节点之间有多条边时，使用 process-parallel-edges 变换
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: [
       { id: 'a', data: { label: 'A' } },
       { id: 'b', data: { label: 'B' } },
    ],
    edges: [
       { id: 'e1', source: 'a', target: 'b', data: { label: '调用' } },
       { id: 'e2', source: 'a', target: 'b', data: { label: '回调' } },
       { id: 'e3', source: 'b', target: 'a', data: { label: '返回' } },
    ],
  },
  // 使用变换处理平行边
  transforms: ['process-parallel-edges'],
  edge: {
    type: 'quadratic',          // 平行边用曲线更美观
    style: {
      stroke: '#aaa',
      endArrow: true,
      labelText: (d) => d.data.label,
    },
  },
  layout: { type: 'force' },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});
```

## 边状态样式

```javascript
edge: {
  type: 'line',
  style: {
    stroke: '#aaa',
    lineWidth: 1,
    endArrow: true,
  },
  state: {
    selected: {
      stroke: '#1783FF',
      lineWidth: 3,
    },
    hover: {
      stroke: '#40a9ff',
      lineWidth: 2,
    },
    inactive: {
      opacity: 0.2,
    },
  },
},
```

## 常见错误

### 错误1：边标签不显示

```javascript
// ❌ 数据中有 label，但没有配置 labelText
const edges = [{ source: 'n1', target: 'n2', data: { label: '关系' } }];
edge: { type: 'line', style: { stroke: '#aaa' } }  // 没有 labelText

// ✅ 需要配置 labelText
edge: {
  type: 'line',
  style: {
    stroke: '#aaa',
    labelText: (d) => d.data.label || '',  // 从 data 中读取
  },
},
```

### 错误2：箭头方向不符合预期

```javascript
// ❌ 以为 startArrow 是在 source 端，但实际渲染位置混淆
// 明确：endArrow 在 target（终点）端，startArrow 在 source（起点）端

// ✅ 有向图使用 endArrow
edge: {
  type: 'line',
  style: {
    endArrow: true,    // 箭头在 target 端
  },
},
```
