---
id: "x6-core-mousewheel"
title: "X6 滚轮缩放（Mousewheel）"
description: |
  X6 鼠标滚轮缩放配置：缩放因子、最小/最大缩放比例、修饰键控制、鼠标位置缩放等。

library: "x6"
version: "3.x"
category: "core"
subcategory: "mousewheel"
tags:
  - "mousewheel"
  - "缩放"
  - "zoom"
  - "滚轮"
  - "scale"

related:
  - "x6-core-graph-init"
  - "x6-core-panning"
  - "x6-core-coord"

use_cases:
  - "滚轮缩放画布"
  - "Ctrl+滚轮缩放"
  - "限制缩放范围"
  - "以鼠标位置为中心缩放"

difficulty: "beginner"
completeness: "full"
---

## 基本用法

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  mousewheel: {
    enabled: true,
    modifiers: 'ctrl',  // Ctrl+滚轮缩放
  },
});
```

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | boolean | `false` | 是否启用滚轮缩放 |
| `global` | boolean | `false` | 是否全局监听（`true`: 监听 document，`false`: 仅监听画布容器） |
| `factor` | number | `1.2` | 缩放因子，每次滚动的缩放倍率 |
| `minScale` | number | - | 最小缩放比例 |
| `maxScale` | number | - | 最大缩放比例 |
| `modifiers` | string \| string[] \| null | `null` | 修饰键：`'ctrl'`、`'alt'`、`'shift'`、`'meta'` |
| `guard` | function | - | 自定义判断函数，返回 `false` 阻止缩放 |
| `zoomAtMousePosition` | boolean | `true` | 是否以鼠标位置为中心缩放 |

## 修饰键控制

推荐使用 `modifiers` 避免与页面滚动冲突：

```javascript
mousewheel: {
  enabled: true,
  modifiers: 'ctrl',  // 仅 Ctrl+滚轮 触发缩放
}
```

支持多个修饰键（任一满足即可）：

```javascript
mousewheel: {
  enabled: true,
  modifiers: ['ctrl', 'meta'],  // Ctrl 或 Meta 修饰键
}
```

## 限制缩放范围

```javascript
mousewheel: {
  enabled: true,
  modifiers: 'ctrl',
  minScale: 0.5,   // 最小缩放到 50%
  maxScale: 3,     // 最大缩放到 300%
}
```

## 以鼠标位置为中心缩放

默认行为（`zoomAtMousePosition: true`）是以鼠标位置为中心进行缩放，类似设计工具体验：

```javascript
mousewheel: {
  enabled: true,
  zoomAtMousePosition: true,  // 默认值，以鼠标为中心
}
```

关闭后以画布中心缩放：

```javascript
mousewheel: {
  enabled: true,
  zoomAtMousePosition: false,  // 以画布中心缩放
}
```

## guard 自定义过滤

```javascript
mousewheel: {
  enabled: true,
  guard(e) {
    // 当鼠标在某个特定区域时不缩放
    if (e.target.closest('.no-zoom-area')) {
      return false;
    }
    return true;
  },
}
```

## 编程式缩放 API

```javascript
// 设置绝对缩放比例
graph.zoom(1.5, { absolute: true });  // 缩放到 150%

// 相对缩放
graph.zoom(0.2);    // 放大 20%
graph.zoom(-0.2);   // 缩小 20%

// 以某个点为中心缩放
graph.zoom(2, { absolute: true, center: { x: 400, y: 300 } });

// 获取当前缩放比例
graph.zoom();  // number，当前缩放值

// 自适应缩放（显示所有内容）
graph.zoomToFit({ padding: 20 });

// 缩放到指定区域
graph.zoomToRect({ x: 100, y: 100, width: 400, height: 300 });
```

## 完整示例

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  grid: { visible: true },
  panning: { enabled: true, modifiers: 'ctrl' },
  mousewheel: {
    enabled: true,
    modifiers: 'ctrl',
    minScale: 0.3,
    maxScale: 5,
    zoomAtMousePosition: true,
  },
});

graph.addNode({ x: 200, y: 200, width: 120, height: 60, label: 'Zoom me' });

// 显示当前缩放比例
graph.on('scale', ({ sx }) => {
  console.log(`当前缩放: ${Math.round(sx * 100)}%`);
});
```

## 常见错误与修正

### ❌ 未设置 modifiers 导致页面无法滚动

```javascript
// 问题：没有修饰键，滚轮被画布拦截，页面无法滚动
mousewheel: { enabled: true }  // ⚠️ 任何滚轮事件都会触发缩放
```

```javascript
// 正确：设置修饰键，普通滚轮行为不受影响
mousewheel: { enabled: true, modifiers: 'ctrl' }  // ✅
```

### ❌ 混淆 zoom() 的相对和绝对模式

```javascript
// 注意区分：
graph.zoom(2);                         // 相对：当前比例 + 2（变为 3x）
graph.zoom(2, { absolute: true });     // 绝对：设置为 2x
```

### ❌ 容器未正确指定或 DOM 未就绪导致白屏

```javascript
// 错误示例：容器变量未定义或 DOM 未加载完成
const graph = new Graph({
  container,  // ❌ container 变量未定义
  panning: true,
  mousewheel: {
    enabled: true,
    modifiers: 'ctrl',
    minScale: 0.5,
    maxScale: 3,
  }
});
```

```javascript
// 正确示例：确保 DOM 元素存在并已挂载
const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
  panning: {
    enabled: true,
    modifiers: 'shift',
  },
  mousewheel: {
    enabled: true,
    modifiers: 'ctrl',
    minScale: 0.5,
    maxScale: 3,
  },
});

// 添加节点以确保画布有内容
graph.addNode({ shape: 'rect', x: 60, y: 60, width: 120, height: 50, label: 'Shift+Drag to pan' });
graph.addNode({ shape: 'rect', x: 260, y: 160, width: 120, height: 50, label: 'Ctrl+Wheel to zoom' });
```

### ❌ panning 配置错误导致拖拽无效

```javascript
// 反模式：panning 与 mousewheel 都不指定 modifiers，
// 又同时把 'mouseWheel' 放进 panning.eventTypes，会导致滚轮事件
// 在 panning（平移）和 mousewheel（缩放）之间冲突，体感像「白屏 / 失效」。
const graph = new Graph({
  container: 'container',
  panning: {
    enabled: true,
    eventTypes: ['leftMouseDown', 'mouseWheel'], // ❌ 与 mousewheel 缩放冲突
  },
  mousewheel: {
    enabled: true,
    modifiers: ['ctrl'],
    minScale: 0.5,
    maxScale: 3,
  },
});
```

```javascript
// 正确：用 modifiers 把两种交互错开
// - 普通左键拖拽 = 平移（或 Shift+拖拽，看产品定义）
// - Ctrl + 滚轮  = 缩放
const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
  panning: {
    enabled: true,
    modifiers: 'shift', // 或留空：'leftMouseDown' + 无 modifiers
  },
  mousewheel: {
    enabled: true,
    modifiers: 'ctrl',
    minScale: 0.5,
    maxScale: 3,
  },
});
```

> 备注：`panning` 同时支持布尔简写（`panning: true`，等价于 `{ enabled: true, eventTypes: ['leftMouseDown'] }`），不是「不支持布尔值」。但当 panning 与 mousewheel、Selection rubberband 等同时启用时，**必须用 `modifiers` 区分触发条件**，避免事件互抢。

### ❌ 画布初始化后未添加任何内容导致白屏

```javascript
// 错误示例：只配置了 panning / mousewheel，没有任何节点或边
const graph = new Graph({
  container: 'container',
  panning: { enabled: true, modifiers: 'shift' },
  mousewheel: { enabled: true, modifiers: 'ctrl', minScale: 0.5, maxScale: 3 },
});
// ❌ 渲染验证会判定为「白屏」：画布存在，但视觉上没有任何内容
```

```javascript
// 正确示例：即便用户 query 只描述了交互配置，也至少要 addNode/addEdge 出可见内容
const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
  grid: { visible: true, size: 10 },
  panning: { enabled: true, modifiers: 'shift' },
  mousewheel: { enabled: true, modifiers: 'ctrl', minScale: 0.5, maxScale: 3 },
});

graph.addNode({
  shape: 'rect', x: 60, y: 60, width: 120, height: 50, label: 'Shift+Drag to pan',
  attrs: { body: { fill: '#e6f7ff', stroke: '#1890ff', rx: 6, ry: 6 } },
});
graph.addNode({
  shape: 'rect', x: 260, y: 160, width: 120, height: 50, label: 'Ctrl+Wheel to zoom',
  attrs: { body: { fill: '#f6ffed', stroke: '#52c41a', rx: 6, ry: 6 } },
});
graph.addEdge({
  source: { x: 180, y: 85 },
  target: { x: 260, y: 185 },
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } },
});
```
