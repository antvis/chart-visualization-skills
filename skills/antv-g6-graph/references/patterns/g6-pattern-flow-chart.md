---
id: "g6-pattern-flow-chart"
title: "G6 流程图模式"
description: |
  使用 G6 创建流程图，包含不同形状节点（开始/结束/判断/处理）、
  dagre 层次布局、折线边等完整配置。

library: "g6"
version: "5.x"
category: "patterns"
subcategory: "flowchart"
tags:
  - "模式"
  - "流程图"
  - "flowchart"
  - "dagre"
  - "有向图"
  - "工作流"
  - "pattern"

related:
  - "g6-layout-dagre"
  - "g6-node-rect"
  - "g6-edge-polyline"
  - "g6-edge-cubic"

use_cases:
  - "业务流程图"
  - "工作流编排"
  - "状态机图"
  - "决策流程"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
---

## 完整示例

```javascript
import { Graph } from '@antv/g6';

const data = {
  nodes: [
     { id: 'start', data: { label: '开始', type: 'start' } },
     { id: 'input', data: { label: '用户输入', type: 'process' } },
     { id: 'validate', data: { label: '数据有效?', type: 'decision' } },
     { id: 'process1', data: { label: '处理数据', type: 'process' } },
     { id: 'error', data: { label: '返回错误', type: 'process' } },
     { id: 'save', data: { label: '保存结果', type: 'process' } },
     { id: 'end', data: { label: '结束', type: 'end' } },
  ],
  edges: [
     { source: 'start', target: 'input' },
     { source: 'input', target: 'validate' },
     { source: 'validate', target: 'process1', data: { label: '是' } },
     { source: 'validate', target: 'error', data: { label: '否' } },
     { source: 'process1', target: 'save' },
     { source: 'error', target: 'end' },
     { source: 'save', target: 'end' },
  ],
};

// 按节点类型配置样式
const NODE_STYLE = {
  start: { fill: '#f6ffed', stroke: '#52c41a', size: [100, 36] },
  end: { fill: '#fff1f0', stroke: '#ff4d4f', size: [100, 36] },
  process: { fill: '#e6f4ff', stroke: '#91caff', size: [140, 44] },
  decision: { fill: '#fff7e6', stroke: '#ffd591', size: [140, 44] },
};

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 650,
  autoFit: 'view',

  data,

  node: {
    // 根据 type 选择不同节点形状
    type: (d) => {
      if (d.data.type === 'decision') return 'diamond';
      return 'rect';
    },
    style: {
      size: (d) => NODE_STYLE[d.data.type]?.size || [120, 40],
      radius: (d) => ['start', 'end'].includes(d.data.type) ? 18 : 4,
      fill: (d) => NODE_STYLE[d.data.type]?.fill || '#f5f5f5',
      stroke: (d) => NODE_STYLE[d.data.type]?.stroke || '#d9d9d9',
      lineWidth: 1.5,
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      labelFill: '#333',
      labelFontSize: 13,
      cursor: 'pointer',
    },
    state: {
      selected: { lineWidth: 3 },
      active: { lineWidth: 2, opacity: 0.8 },
    },
  },

  edge: {
    type: 'polyline',
    style: {
      stroke: '#aaa',
      lineWidth: 1.5,
      radius: 6,
      endArrow: true,
      labelText: (d) => d.data.label || '',
      labelFontSize: 11,
      labelFill: '#999',
      labelBackground: true,
      labelBackgroundFill: '#fff',
      labelBackgroundOpacity: 0.9,
    },
  },

  layout: {
    type: 'dagre',
    rankdir: 'TB',
    ranksep: 60,
    nodesep: 40,
    nodeSize: [140, 44],
  },

  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    'click-select',
  ],

  plugins: [
    {
      type: 'tooltip',
      getContent: (event, items) => {
        const [item] = items;
        if (!item) return '';
        const typeLabel = {
          start: '开始节点',
          end: '结束节点',
          process: '处理节点',
          decision: '判断节点',
        };
        return `<div style="padding:8px 12px">
          <div>${item.data.label}</div>
          <div style="color:#999;font-size:11px">${typeLabel[item.data.type] || ''}</div>
        </div>`;
      },
    },
  ],
});

graph.render();
```

## 关键说明

- **节点形状多样化**：根据 `type` 字段选择 `rect`（矩形）、`diamond`（菱形）等
- **dagre 布局**：`rankdir: 'TB'` 从上到下排列，`nodeSize` 与实际节点大小一致
- **polyline 边**：正交折线边更符合流程图视觉习惯，`radius` 设置折角圆滑
- **边标签背景**：`labelBackground: true` 让边上的条件标签清晰可读
