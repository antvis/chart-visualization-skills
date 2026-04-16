---
id: "g6-pattern-network-graph"
title: "G6 网络关系图模式"
description: |
  使用 G6 创建完整网络关系图的最佳实践，包含力导向布局、
  节点着色、Tooltip、交互等完整配置。

library: "g6"
version: "5.x"
category: "patterns"
subcategory: "network"
tags:
  - "模式"
  - "网络图"
  - "关系图"
  - "知识图谱"
  - "社交网络"
  - "pattern"
  - "network graph"

related:
  - "g6-layout-force"
  - "g6-node-circle"
  - "g6-behavior-hover-activate"
  - "g6-plugin-tooltip"

use_cases:
  - "社交关系网络"
  - "知识图谱"
  - "系统依赖关系"
  - "任意无层次的关系网络"

anti_patterns:
  - "有明确层次的数据不要用网络图，改用层次图"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
---

## 完整示例

```javascript
import { Graph, GraphEvent } from '@antv/g6';

const data = {
  nodes: [
     { id: 'person1', data: { name: '张三', role: 'admin', degree: 5 } },
     { id: 'person2', data: { name: '李四', role: 'user', degree: 3 } },
     { id: 'person3', data: { name: '王五', role: 'user', degree: 2 } },
     { id: 'person4', data: { name: '赵六', role: 'admin', degree: 4 } },
     { id: 'person5', data: { name: '孙七', role: 'user', degree: 1 } },
     { id: 'product1', data: { name: '产品A', role: 'product', degree: 4 } },
     { id: 'product2', data: { name: '产品B', role: 'product', degree: 3 } },
  ],
  edges: [
     { source: 'person1', target: 'person2', data: { type: '朋友' } },
     { source: 'person1', target: 'person4', data: { type: '同事' } },
     { source: 'person2', target: 'person3', data: { type: '朋友' } },
     { source: 'person3', target: 'product1', data: { type: '购买' } },
     { source: 'person4', target: 'product1', data: { type: '管理' } },
     { source: 'person4', target: 'product2', data: { type: '管理' } },
     { source: 'person5', target: 'product2', data: { type: '购买' } },
     { source: 'person1', target: 'product1', data: { type: '购买' } },
  ],
};

const graph = new Graph({
  container: 'container',
  width: 960,
  height: 640,
  data,

  node: {
    type: 'circle',
    style: {
      // 节点大小按度数映射
      size: (d) => 20 + d.data.degree * 6,
      // 标签
      labelText: (d) => d.data.name,
      labelPlacement: 'bottom',
      labelFontSize: 12,
      labelFill: '#333',
      cursor: 'pointer',
    },
    // 按角色分类着色
    palette: {
      type: 'group',
      field: 'role',
      color: ['#1783FF', '#52c41a', '#fa8c16'],
    },
    state: {
      active: {
        lineWidth: 3,
        halo: true,
        haloOpacity: 0.25,
        haloLineWidth: 12,
      },
      inactive: {
        opacity: 0.2,
      },
      selected: {
        lineWidth: 3,
        halo: true,
        haloOpacity: 0.3,
        haloLineWidth: 16,
      },
    },
  },

  edge: {
    type: 'line',
    style: {
      stroke: '#e0e0e0',
      lineWidth: 1,
      endArrow: false,
      labelText: (d) => d.data.type,
      labelFontSize: 10,
      labelFill: '#999',
    },
    state: {
      active: {
        stroke: '#1783FF',
        lineWidth: 2,
      },
      inactive: {
        opacity: 0.1,
      },
    },
  },

  layout: {
    type: 'force',
    linkDistance: 100,
    gravity: 10,
  },

  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    'drag-element-force',
    {
      type: 'hover-activate',
      degree: 1,
      state: 'active',
      inactiveState: 'inactive',
    },
    {
      type: 'click-select',
      state: 'selected',
    },
  ],

  plugins: [
    {
      type: 'tooltip',
      getContent: (event, items) => {
        const [item] = items;
        if (!item) return '';
        const d = item.data;
        return `
          <div style="padding:10px 14px;min-width:140px">
            <div style="font-weight:bold;font-size:14px;margin-bottom:6px">${d.name}</div>
            <div style="color:#666;font-size:12px">角色：${d.role}</div>
            <div style="color:#666;font-size:12px">连接数：${d.degree}</div>
          </div>
        `;
      },
    },
    {
      type: 'minimap',
      size: [200, 130],
      position: 'right-bottom',
    },
  ],
});

graph.on(GraphEvent.AFTER_LAYOUT, () => graph.fitView({ padding: 20 }));
graph.render();
```

## 关键配置说明

| 配置项 | 说明 |
|--------|------|
| `node.style.size` 回调 | 按数据中的 `degree` 字段动态设置节点大小 |
| `node.palette` | 按 `role` 字段自动分配颜色 |
| `drag-element-force` | 力导向图专用拖拽行为 |
| `hover-activate` | 悬停高亮节点及邻居，其他节点变暗 |
| `tooltip` | 悬停显示节点详情 |
| `minimap` | 右下角缩略图导航 |
