---
id: "g6-pattern-tree-graph"
title: "G6 树形图模式"
description: |
  使用 G6 创建树形可视化的完整示例，包含思维导图、组织架构图、
  文件树等常见树形图模式，支持折叠/展开。

library: "g6"
version: "5.x"
category: "patterns"
subcategory: "tree"
tags:
  - "模式"
  - "树形图"
  - "思维导图"
  - "组织架构"
  - "tree"
  - "mindmap"
  - "hierarchy"
  - "pattern"

related:
  - "g6-layout-mindmap"
  - "g6-layout-dagre"
  - "g6-core-data-structure"
  - "g6-node-rect"

use_cases:
  - "组织架构图"
  - "思维导图"
  - "文件目录树"
  - "层次分类展示"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
---

## 思维导图（水平展开）

```javascript
import { Graph, treeToGraphData } from '@antv/g6';

const treeData = {
  id: 'root',
       { label: '核心主题', level: 0 },
  children: [
    {
      id: 'branch-a',
           { label: '分支A', level: 1 },
      children: [
         { id: 'leaf-a1', data: { label: '子项A1', level: 2 } },
         { id: 'leaf-a2', data: { label: '子项A2', level: 2 } },
         { id: 'leaf-a3', data: { label: '子项A3', level: 2 } },
      ],
    },
    {
      id: 'branch-b',
           { label: '分支B', level: 1 },
      children: [
         { id: 'leaf-b1', data: { label: '子项B1', level: 2 } },
         { id: 'leaf-b2', data: { label: '子项B2', level: 2 } },
      ],
    },
    {
      id: 'branch-c',
           { label: '分支C', level: 1 },
      children: [
         { id: 'leaf-c1', data: { label: '子项C1', level: 2 } },
      ],
    },
  ],
};

const COLORS = {
  0: { fill: '#1783FF', text: '#fff', stroke: '#1783FF' },
  1: { fill: '#e6f4ff', text: '#1783FF', stroke: '#91caff' },
  2: { fill: '#f5f5f5', text: '#333', stroke: '#d9d9d9' },
};

const graph = new Graph({
  container: 'container',
  width: 1000,
  height: 600,
  autoFit: 'view',

   treeToGraphData(treeData),

  node: {
    type: 'rect',
    style: {
      size: (d) => {
        const sizes = { 0: [120, 44], 1: [100, 36], 2: [90, 30] };
        return sizes[d.data.level] || [90, 30];
      },
      radius: (d) => d.data.level === 0 ? 22 : 15,
      fill: (d) => COLORS[d.data.level]?.fill || '#f5f5f5',
      stroke: (d) => COLORS[d.data.level]?.stroke || '#d9d9d9',
      lineWidth: 1,
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      labelFill: (d) => COLORS[d.data.level]?.text || '#333',
      labelFontSize: (d) => ({ 0: 16, 1: 14, 2: 12 }[d.data.level] || 12),
      labelFontWeight: (d) => d.data.level === 0 ? 'bold' : 'normal',
      cursor: 'pointer',
    },
  },

  edge: {
    type: 'cubic-horizontal',
    style: {
      stroke: '#c0d8f0',
      lineWidth: 1.5,
    },
  },

  layout: {
    type: 'mindmap',
    direction: 'H',
    getWidth: (d) => ({ 0: 120, 1: 100, 2: 90 }[d.data?.level] || 90),
    getHeight: (d) => ({ 0: 44, 1: 36, 2: 30 }[d.data?.level] || 30),
    getHGap: () => 50,
    getVGap: () => 8,
  },

  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    {
      type: 'collapse-expand',
      trigger: 'click',
      animation: true,
    },
  ],
});

graph.render();
```

## 组织架构图（从上到下）

```javascript
import { Graph, treeToGraphData } from '@antv/g6';

const orgData = {
  id: 'ceo',
       { name: '李总', title: 'CEO', dept: '董事会' },
  children: [
    {
      id: 'cto',
           { name: '张总', title: 'CTO', dept: '技术部' },
      children: [
         { id: 'fe-lead', data: { name: '王工', title: '前端负责人', dept: '前端组' } },
         { id: 'be-lead', data: { name: '陈工', title: '后端负责人', dept: '后端组' } },
      ],
    },
    {
      id: 'cmo',
           { name: '刘总', title: 'CMO', dept: '市场部' },
      children: [
         { id: 'marketing1', data: { name: '赵策划', title: '市场专员', dept: '市场部' } },
      ],
    },
    {
      id: 'cfo',
           { name: '钱总', title: 'CFO', dept: '财务部' },
    },
  ],
};

const graph = new Graph({
  container: 'container',
  width: 900,
  height: 600,
  autoFit: 'view',

   treeToGraphData(orgData),

  node: {
    type: 'rect',
    style: {
      size: [150, 56],
      radius: 6,
      fill: '#f0f5ff',
      stroke: '#adc6ff',
      lineWidth: 1,
      // 主标题：name
      labelText: (d) => `${d.data.name}\n${d.data.title}`,
      labelPlacement: 'center',
      labelFontSize: 13,
      labelFill: '#1d39c4',
      labelWordWrap: true,
      cursor: 'pointer',
    },
    state: {
      selected: {
        fill: '#1783FF',
        stroke: '#1783FF',
        labelFill: '#fff',
      },
    },
  },

  edge: {
    type: 'cubic-vertical',
    style: {
      stroke: '#adc6ff',
      lineWidth: 1.5,
    },
  },

  layout: {
    type: 'compact-box',
    direction: 'TB',
    getHeight: () => 56,
    getWidth: () => 150,
    getVGap: () => 50,
    getHGap: () => 20,
  },

  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    'click-select',
    {
      type: 'collapse-expand',
      trigger: 'dblclick',      // 双击折叠/展开
    },
  ],
});

graph.render();
```

## 关键说明

| 场景 | 推荐布局 | 推荐边类型 | 特点 |
|------|----------|------------|------|
| 思维导图 | `mindmap` | `cubic-horizontal` | 双向展开，H方向 |
| 组织架构图 | `compact-box` | `cubic-vertical` | 从上到下，TB方向 |
| 文件树 | `indented` | `line` | 缩进展示 |
| 知识树 | `dendrogram` | `cubic-vertical` | 叶节点对齐 |

## 折叠展开

```javascript
// 程序控制折叠
graph.collapse('branch-a');    // 折叠节点（隐藏子树）
graph.expand('branch-a');      // 展开节点

// 监听折叠事件
graph.on('node:collapse', (event) => {
  console.log('折叠：', event.target.id);
});
graph.on('node:expand', (event) => {
  console.log('展开：', event.target.id);
});
```
