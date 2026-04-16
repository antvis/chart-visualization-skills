---
id: "g6-behavior-canvas-nav"
title: "G6 画布导航交互（拖拽/缩放/滚动）"
description: |
  使用 drag-canvas、zoom-canvas、scroll-canvas 实现画布的拖拽、缩放和滚动导航。
  是几乎所有图可视化的基础交互配置。

library: "g6"
version: "5.x"
category: "behaviors"
subcategory: "navigation"
tags:
  - "交互"
  - "画布"
  - "拖拽"
  - "缩放"
  - "drag-canvas"
  - "zoom-canvas"
  - "scroll-canvas"
  - "behavior"

related:
  - "g6-behavior-click-select"
  - "g6-behavior-drag-element"
  - "g6-plugin-minimap"

use_cases:
  - "大图导航"
  - "基础图交互"
  - "所有图可视化场景"

anti_patterns:
  - "移动端场景需要特别处理触摸事件"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/behavior/drag-canvas"
---

## 核心概念

三种画布导航行为：
- `drag-canvas`：鼠标拖拽移动画布
- `zoom-canvas`：滚轮缩放画布
- `scroll-canvas`：滚轮滚动画布（替代 zoom，适合有滚动条的页面）

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
    { nodes: [...], edges: [...] },
  layout: { type: 'force' },
  // 标准三件套
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```

## 常用配置

### 完整参数配置

```javascript
behaviors: [
  {
    type: 'drag-canvas',
    // 允许拖拽的方向
    direction: 'both',          // 'both' | 'x' | 'y'
    // 拖拽边界限制
    range: Infinity,            // 超出边界的距离限制
    // 按键触发（默认空格+拖拽）
    trigger: {
      drag: [],                 // 空数组=直接拖拽，无需按键
      up: ['ArrowUp'],
      down: ['ArrowDown'],
      left: ['ArrowLeft'],
      right: ['ArrowRight'],
    },
    // 与缩放配合时是否响应鼠标位置
    zoomKey: 'ctrl',            // 按住 Ctrl 时滚轮缩放（否则滚动）
  },
  {
    type: 'zoom-canvas',
    // 缩放范围
    range: [0.1, 10],           // [最小缩放, 最大缩放]
    // 触发按键（按住该键时滚轮才缩放）
    key: null,                  // null=始终缩放
    // 缩放中心
    zoomAt: 'cursor',           // 'cursor' | 'center'
    // 动画
    animation: { duration: 200 },
  },
],
```

### 防止拖拽画布时误触节点

```javascript
behaviors: [
  {
    type: 'drag-canvas',
    // 只在画布背景上拖拽（避免与节点拖拽冲突）
    enable: (event) => event.targetType === 'canvas',
  },
  'drag-element',
],
```

### 键盘方向键移动画布

```javascript
behaviors: [
  {
    type: 'drag-canvas',
    trigger: {
      up: ['ArrowUp'],
      down: ['ArrowDown'],
      left: ['ArrowLeft'],
      right: ['ArrowRight'],
    },
  },
  'zoom-canvas',
],
```

### 适配有页面滚动条的场景

```javascript
// 页面有滚动条时，滚轮默认滚动页面而不是缩放图
// 使用 scroll-canvas 替代 zoom-canvas
behaviors: [
  'drag-canvas',
  'scroll-canvas',    // 滚轮滚动画布（上下左右）
  // 按住 Ctrl 时缩放
  {
    type: 'zoom-canvas',
    key: 'ctrl',      // 按住 Ctrl + 滚轮 才缩放
  },
  'drag-element',
],
```

## 程序控制视口

```javascript
// 缩放到指定比例
graph.zoomTo(1.5);
graph.zoomTo(1.5, true);   // 带动画

// 恢复默认缩放
graph.zoomTo(1);

// 平移画布
graph.translateBy(100, 50);    // 相对移动
graph.translateTo([400, 300]); // 移动到绝对位置

// 自适应视图
graph.fitView();               // 缩放到全图可见
graph.fitCenter();             // 居中但不缩放

// 聚焦某个节点
graph.focusElement('node1');
```
