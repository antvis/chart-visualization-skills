---
id: "g6-node-rect"
title: "G6 矩形节点（Rect Node）"
description: |
  使用矩形节点（rect）创建图可视化。矩形节点适合展示模块、组件、流程步骤等，
  支持设置宽高比、圆角、标签等。

library: "g6"
version: "5.x"
category: "elements"
subcategory: "nodes"
tags:
  - "节点"
  - "矩形"
  - "rect"
  - "node"
  - "流程图"
  - "组织架构"
  - "UML"

related:
  - "g6-node-circle"
  - "g6-layout-dagre"
  - "g6-state-overview"

use_cases:
  - "流程图节点"
  - "组织架构图"
  - "UML 图"
  - "文件树"
  - "架构图"

anti_patterns:
  - "不适合表示无方向性的实体（改用 circle）"
  - "节点内容极其复杂时改用 html 节点"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/element/node/rect"
---

## 核心概念

矩形节点（`rect`）有清晰的边界，适合表示模块、组件、流程步骤等需要区分方向性的实体。

**与 circle 的主要区别：**
- `size` 接受 `[width, height]` 数组，支持不同宽高
- 可设置 `radius` 实现圆角矩形
- 内容区域更大，适合显示多行信息

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [
       { id: 'start', data: { label: '开始' } },
       { id: 'process1', data: { label: '处理数据' } },
       { id: 'decision', data: { label: '是否通过?' } },
       { id: 'end', data: { label: '结束' } },
    ],
    edges: [
       { source: 'start', target: 'process1' },
       { source: 'process1', target: 'decision' },
       { source: 'decision', target: 'end' },
    ],
  },
  node: {
    type: 'rect',
    style: {
      size: [120, 40],           // [宽, 高]
      radius: 4,                 // 圆角
      fill: '#f0f5ff',
      stroke: '#adc6ff',
      lineWidth: 1,
      labelText: (d) => d.data.label,
      labelPlacement: 'center',  // 标签居中
      labelFill: '#333',
    },
  },
  layout: {
    type: 'dagre',
    rankdir: 'TB',               // 从上到下
    ranksep: 50,
    nodesep: 30,
  },
  edge: {
    type: 'cubic-vertical',
    style: {
      endArrow: true,
      stroke: '#adc6ff',
    },
  },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```

## 常用变体

### 组织架构图

```javascript
import { Graph, treeToGraphData } from '@antv/g6';

const orgData = {
  id: 'ceo',
      data: { label: 'CEO', dept: '董事会' },
  children: [
    {
      id: 'cto',
      data: { label: 'CTO', dept: '技术部' },
      children: [
         { id: 'dev1', data: { label: '前端负责人', dept: '前端组' } },
         { id: 'dev2', data: { label: '后端负责人', dept: '后端组' } },
      ],
    },
    {
      id: 'cmo',
      data: { label: 'CMO', dept: '市场部' },
    },
  ],
};

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: treeToGraphData(orgData),
  node: {
    type: 'rect',
    style: {
      size: [140, 50],
      radius: 6,
      fill: '#e6f4ff',
      stroke: '#91caff',
      lineWidth: 1,
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      labelFontSize: 14,
      labelFontWeight: 'bold',
    },
  },
  edge: {
    type: 'cubic-vertical',
    style: { stroke: '#91caff', endArrow: true },
  },
  layout: {
    type: 'compact-box',
    direction: 'TB',
    getHeight: () => 50,
    getWidth: () => 140,
    getVGap: () => 40,
    getHGap: () => 20,
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

### 不同颜色区分类型

```javascript
node: {
  type: 'rect',
  style: {
    size: [120, 40],
    radius: 4,
    fill: (d) => {
      const colors = {
        start: '#f6ffed',
        process: '#e6f4ff',
        decision: '#fff7e6',
        end: '#fff1f0',
      };
      return colors[d.data.type] || '#fafafa';
    },
    stroke: (d) => {
      const colors = {
        start: '#73d13d',
        process: '#4096ff',
        decision: '#ffa940',
        end: '#ff4d4f',
      };
      return colors[d.data.type] || '#d9d9d9';
    },
    labelText: (d) => d.data.label,
    labelPlacement: 'center',
  },
},
```

### 带子标题的矩形节点

```javascript
// 使用自定义 HTML 节点显示多行内容
import { Graph, ExtensionCategory, register } from '@antv/g6';

// 或者使用 labelText 换行
node: {
  type: 'rect',
  style: {
    size: [160, 60],
    radius: 8,
    fill: '#f0f5ff',
    stroke: '#adc6ff',
    // 主标题
    labelText: (d) => d.data.title,
    labelPlacement: 'center',
    labelOffsetY: -10,
    labelFontSize: 14,
    labelFontWeight: 'bold',
  },
},
```

## 常见错误

### 错误1：对 rect 使用单个数字 size

```javascript
// ❌ 可运行，但只设置了宽度，高度将为默认值
node: {
  type: 'rect',
  style: { size: 100 },
}

// ✅ 推荐：明确设置宽和高
node: {
  type: 'rect',
  style: { size: [120, 40] },  // [宽, 高]
}
```

### 错误2：标签超出节点边界

```javascript
// ❌ 长标签溢出节点
node: {
  type: 'rect',
  style: {
    size: [80, 30],
    labelText: (d) => d.data.longDescription,  // 过长
  },
}

// ✅ 设置最大宽度和省略
node: {
  type: 'rect',
  style: {
    size: [120, 40],
    labelText: (d) => d.data.label,
    labelMaxWidth: 100,       // 最大宽度
    labelWordWrap: false,     // 超出省略
  },
}
```

### 错误3：与 dagre 布局搭配时忘设置节点大小

```javascript
// ❌ 未设置节点大小，dagre 无法正确计算间距
layout: {
  type: 'dagre',
},
// 没有设置 nodeSize

// ✅ 告诉 dagre 节点尺寸
layout: {
  type: 'dagre',
  nodeSize: [120, 40],  // 与节点 size 一致
  ranksep: 50,
  nodesep: 20,
},
```
