---
id: "g6-core-graph-init"
title: "G6 图实例初始化"
description: |
  使用 new Graph({...}) 创建图实例的完整配置指南。
  包含容器、尺寸、数据、样式、布局、交互的一次性配置方式。

library: "g6"
version: "5.x"
category: "core"
subcategory: "init"
tags:
  - "初始化"
  - "Graph"
  - "容器"
  - "配置"
  - "graph init"
  - "container"
  - "new Graph"

related:
  - "g6-core-data-structure"
  - "g6-node-circle"
  - "g6-layout-force"

use_cases:
  - "创建任意类型的图可视化"
  - "配置图的基本外观和行为"

anti_patterns:
  - "不要使用 v4 的 new G6.Graph() 和 graph.data() 方式"
  - "不要在构造函数外多次修改基础配置"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/graph/graph"
---

## 核心概念

Graph 是 G6 的核心容器，管理所有元素（节点、边、Combo）和操作（交互、渲染）。

**G6 v5 与 v4 的关键区别：**
- 所有配置在 `new Graph({...})` 中一次完成
- 数据在构造函数中通过 `data` 字段传入（不再使用 `graph.data()`）
- 节点标签通过 `style.labelText` 回调配置（不再用 `label` 或 `labelCfg`）
- `behaviors` 直接是数组（不再有 Mode 模式概念）

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',   // 必填：DOM 元素 id 或 HTMLElement
  width: 800,
  height: 600,
  data: {
    nodes: [
       { id: 'node1', data: { label: '节点1' } },
       { id: 'node2', data: { label: '节点2' } },
       { id: 'node3', data: { label: '节点3' } },
    ],
    edges: [
       { source: 'node1', target: 'node2' },
       { source: 'node2', target: 'node3' },
    ],
  },
  layout: { type: 'force' },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```

## 完整配置说明

### 容器与尺寸

```javascript
const graph = new Graph({
  container: 'container',         // 字符串 id 或 DOM 元素
  width: 800,                     // 画布宽度（px）
  height: 600,                    // 画布高度（px）
  autoFit: 'view',                // 自动适配：'center' | 'view' | false
  padding: [20, 20, 20, 20],      // 内边距 [top, right, bottom, left]
  devicePixelRatio: 2,            // 设备像素比，高清屏设置
});
```

### 渲染器配置

```javascript
const graph = new Graph({
  container: 'container',
  renderer: () => new CanvasRenderer(),    // 默认 Canvas 渲染器
  // renderer: () => new SVGRenderer(),    // SVG 渲染器（需单独引入）
  // renderer: () => new WebGLRenderer(),  // WebGL 渲染器（需单独引入）
});
```

### 完整示例（包含所有常用配置）

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  // 容器
  container: 'container',
  width: 960,
  height: 600,
  autoFit: 'view',

  // 数据
  data: {
    nodes: [
       { id: 'n1', data: { label: '产品', type: 'product', value: 80 } },
       { id: 'n2', data: { label: '用户', type: 'user', value: 50 } },
       { id: 'n3', data: { label: '订单', type: 'order', value: 30 } },
    ],
    edges: [
       { id: 'e1', source: 'n1', target: 'n2', data: { label: '购买' } },
       { id: 'e2', source: 'n2', target: 'n3', data: { label: '生成' } },
    ],
  },

  // 节点配置
  node: {
    type: 'circle',
    style: {
      size: 40,
      fill: '#1783FF',
      stroke: '#fff',
      lineWidth: 2,
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
      labelFill: '#333',
    },
  },

  // 边配置
  edge: {
    type: 'line',
    style: {
      stroke: '#aaa',
      lineWidth: 1.5,
      endArrow: true,
      labelText: (d) => d.data.label,
    },
  },

  // 布局
  layout: {
    type: 'force',
    preventOverlap: true,
    nodeSize: 40,
    linkDistance: 100,
  },

  // 主题
  theme: 'light',

  // 交互行为
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element', 'click-select'],

  // 插件
  plugins: ['grid-line', 'minimap'],

  // 动画
  animation: true,
});

await graph.render();
```

## 生命周期方法

```javascript
// 渲染（必须调用）
await graph.render();

// 更新数据后重绘
graph.draw();

// 适配视图
graph.fitView();
graph.fitCenter();

// 销毁
graph.destroy();

// 监听事件
graph.on('node:click', (event) => {
  const { target } = event;
  console.log('点击节点:', target.id);
});

// 获取渲染状态
console.log(graph.rendered);   // boolean
console.log(graph.destroyed);  // boolean
```

## 动态操作

```javascript
// 添加节点
graph.addNodeData([{ id: 'n4', data: { label: '新节点' } }]);
await graph.draw();

// 删除节点（关联边也会删除）
graph.removeNodeData(['n4']);
await graph.draw();

// 更新元素样式
graph.updateNodeData([{ id: 'n1', style: { fill: 'red' } }]);
await graph.draw();

// 设置元素状态
graph.setElementState('n1', 'selected');
graph.setElementState('n1', []);  // 清除状态

// 缩放
graph.zoomTo(1.5);
graph.zoomTo(1, true);  // 带动画

// 移动视口
graph.translateTo([400, 300]);

// 定位到某元素
graph.focusElement('n1');
```

## 常见错误

### 错误1：缺少 container

```javascript
// ❌ 错误
const graph = new Graph({ width: 800, height: 600 });

// ✅ 正确
const graph = new Graph({ container: 'container', width: 800, height: 600 });
```

### 错误2：使用 v4 的 graph.data() 方式

```javascript
// ❌ 错误（v4 写法）
const graph = new G6.Graph({ container: 'container', width: 800, height: 600 });
graph.data({ nodes: [...], edges: [...] });
graph.render();

// ✅ 正确（v5 写法）
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: { nodes: [...], edges: [...] },
});
graph.render();
```

### 错误3：数据中直接写标签

```javascript
// ❌ 错误：节点数据直接写 label
{ id: 'node1', label: 'Node 1' }

// ✅ 正确：业务数据放在 data 字段
{ id: 'node1', data: { label: 'Node 1' } }
// 然后在样式中：
node: {
  style: {
    labelText: (d) => d.data.label,
  },
}
```

### 错误4：使用 v4 的 modes 配置

```javascript
// ❌ 错误（v4 modes）
modes: { default: ['drag-canvas', 'zoom-canvas'] }

// ✅ 正确（v5 behaviors）
behaviors: ['drag-canvas', 'zoom-canvas']
```

### 错误5：autoFit 与固定尺寸冲突

```javascript
// ❌ autoFit: true 同时设置 width/height 会产生不可预期结果
const graph = new Graph({
  autoFit: true,   // 旧写法
  width: 800,
  height: 600,
});

// ✅ 正确：使用 'view' 或 'center'
const graph = new Graph({
  autoFit: 'view',   // 或 'center'，或 false（手动控制）
  width: 800,
  height: 600,
});
```
