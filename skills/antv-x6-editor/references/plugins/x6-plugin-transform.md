---
id: "x6-plugin-transform"
title: "X6 Transform 缩放旋转插件"
description: |
  Transform 插件为节点提供可视化的缩放（Resize）和旋转（Rotate）操控手柄，用户可以通过拖拽手柄调整节点尺寸和角度。

library: "x6"
version: "3.x"
category: "plugins"
subcategory: "transform"
tags:
  - "Transform"
  - "缩放"
  - "旋转"
  - "resize"
  - "rotate"
  - "拖拽调整大小"
  - "节点变换"

related:
  - "x6-plugins"
  - "x6-core-node"
  - "x6-core-events"

use_cases:
  - "拖拽调整节点大小"
  - "旋转节点角度"
  - "限制节点最小/最大尺寸"
  - "保持节点宽高比缩放"
  - "禁止特定节点缩放"

difficulty: "beginner"
completeness: "full"
---

## 基本用法

```javascript
import { Graph, Transform } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new Transform({
  resizing: { enabled: true },
  rotating: { enabled: true },
}));
```

## 配置项

### resizing 配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | boolean \| function | `false` | 是否启用缩放，可传函数按节点过滤 |
| `minWidth` | number | `0` | 最小宽度 |
| `maxWidth` | number | `Infinity` | 最大宽度 |
| `minHeight` | number | `0` | 最小高度 |
| `maxHeight` | number | `Infinity` | 最大高度 |
| `orthogonalResizing` | boolean | `true` | 是否启用正交缩放（仅水平/垂直方向） |
| `restrictedResizing` | boolean \| number | `false` | 限制缩放范围（`true` 限制在画布内，数字为边距） |
| `preserveAspectRatio` | boolean | `false` | 是否保持宽高比 |
| `allowReverse` | boolean | `true` | 达到最小尺寸时是否允许控制点反转 |
| `autoScrollOnResizing` | boolean | `true` | 缩放时是否自动滚动画布 |

### rotating 配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | boolean \| function | `false` | 是否启用旋转，可传函数按节点过滤 |
| `rotateGrid` | number | `15` | 旋转角度步进（每次吸附到的角度间隔） |

## 编程式 API

```javascript
// 为指定节点创建变换控件
graph.createTransformWidget(node);

// 清除所有变换控件
graph.clearTransformWidgets();
```

## 事件监听

```javascript
// 缩放开始
graph.on('node:resize', ({ node, e }) => {
  console.log('开始缩放:', node.id);
});

// 缩放中
graph.on('node:resizing', ({ node, e }) => {
  console.log('缩放中:', node.getSize());
});

// 缩放结束
graph.on('node:resized', ({ node, e }) => {
  console.log('缩放完成:', node.getSize());
});

// 旋转开始
graph.on('node:rotate', ({ node, e }) => {
  console.log('开始旋转:', node.id);
});

// 旋转中
graph.on('node:rotating', ({ node, e }) => {
  console.log('旋转中:', node.getAngle());
});

// 旋转结束
graph.on('node:rotated', ({ node, e }) => {
  console.log('旋转完成:', node.getAngle());
});
```

## 完整示例：限制尺寸 + 保持比例

```javascript
import { Graph, Transform } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  grid: { visible: true },
});

graph.use(new Transform({
  resizing: {
    enabled: true,
    minWidth: 40,
    minHeight: 40,
    maxWidth: 400,
    maxHeight: 400,
    preserveAspectRatio: true,  // 保持宽高比
  },
  rotating: {
    enabled: true,
    rotateGrid: 15,  // 每 15° 吸附
  },
}));

graph.addNode({
  x: 200,
  y: 200,
  width: 120,
  height: 80,
  label: 'Resize & Rotate me',
  attrs: { body: { fill: '#EFF4FF', stroke: '#5F95FF' } },
});
```

## 按节点过滤

`enabled` 可以传入函数，按节点判断是否允许缩放/旋转：

```javascript
graph.use(new Transform({
  resizing: {
    enabled(node) {
      // 仅 shape 为 'rect' 的节点可缩放
      return node.shape === 'rect';
    },
  },
  rotating: {
    enabled(node) {
      // 通过节点 data 控制是否可旋转
      return node.getData()?.rotatable !== false;
    },
  },
}));
```

## 常见错误

### ❌ 在构造函数中配置 resizing/rotating

```javascript
// 错误：3.x 不支持
const graph = new Graph({
  container: 'container',
  resizing: { enabled: true },   // ❌
  rotating: { enabled: true },   // ❌
});
```

```javascript
// 正确
import { Graph, Transform } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Transform({
  resizing: { enabled: true },
  rotating: { enabled: true },
}));  // ✅
```

### ❌ 混淆 Transform 和 CSS transform

```javascript
// 错误：不要用 CSS 变换来旋转 X6 节点
node.attr('body/transform', 'rotate(45deg)');  // ❌ 不生效且可能破坏布局
```

```javascript
// 正确：使用 node API 设置角度
node.rotate(45);  // ✅ 通过 X6 模型层旋转
```
