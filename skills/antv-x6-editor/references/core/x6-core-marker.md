---
id: "x6-core-marker"
title: "X6 箭头标记（Marker）"
description: |
  边的起始端和终止端箭头标记配置。
  包含内置箭头类型（classic、block、diamond、circle、cross、ellipse 等）及自定义箭头。

library: "x6"
version: "3.x"
category: "core"
subcategory: "marker"
tags:
  - "marker"
  - "箭头"
  - "targetMarker"
  - "sourceMarker"
  - "classic"
  - "block"
  - "diamond"
  - "circle"
  - "cross"
  - "ellipse"
  - "arrow"
  - "自定义箭头"
  - "SVG path"
  - "渐变箭头"
  - "defineGradient"
  - "linearGradient"

related:
  - "x6-core-edge"
  - "x6-core-anchor"
  - "x6-intermediate-custom-edge"

use_cases:
  - "给边添加箭头"
  - "自定义箭头样式和大小"
  - "设置起始端和终止端不同的箭头"
  - "空心箭头、菱形箭头、圆形箭头"
  - "自定义 SVG path 箭头"
  - "渐变填充的箭头"

difficulty: "beginner"
completeness: "full"
---

## 核心概念

**Marker（箭头标记）** 是边的起始端（sourceMarker）或终止端（targetMarker）的装饰元素。通过边的 `attrs.line` 配置。

## 配置方式

```javascript
graph.addEdge({
  source: node1,
  target: node2,
  attrs: {
    line: {
      stroke: '#8f8f8f',
      strokeWidth: 1,
      targetMarker: 'classic',       // 终止端箭头（字符串简写）
      sourceMarker: null,            // 起始端无箭头
    },
  },
});
```

## 内置箭头类型

| 名称 | 说明 | 效果 |
|------|------|------|
| `'classic'` | 经典实心箭头（V 形，有凹陷） | ▶ 带内凹 |
| `'block'` | 实心三角形箭头（无凹陷） | ▶ 完整三角 |
| `'diamond'` | 菱形箭头 | ◆ |
| `'circle'` | 圆形箭头 | ● |
| `'circlePlus'` | 带十字的圆形 | ⊕ |
| `'ellipse'` | 椭圆形箭头 | ⬮ |
| `'cross'` | X 形交叉（空心） | ✕ |
| `'async'` | 斜角标记（锐角三角形，常用于异步信号） | ◁ 斜角 |

## 参数配置

使用对象格式可传递参数：

```javascript
attrs: {
  line: {
    targetMarker: {
      name: 'classic',
      size: 10,        // 统一尺寸
      width: 12,       // 宽度（优先级高于 size）
      height: 8,       // 高度（优先级高于 size）
      offset: 0,       // 沿路径方向的偏移
    },
  },
}
```

### classic 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `number` | `10` | 箭头尺寸（width 和 height 的默认值） |
| `width` | `number` | `size` | 箭头宽度 |
| `height` | `number` | `size` | 箭头高度 |
| `offset` | `number` | `-width/2` | 路径方向偏移 |
| `factor` | `number` | `0.75` | 内凹系数，0~1，越大凹陷越浅 |

### block 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `number` | `10` | 箭头尺寸 |
| `width` | `number` | `size` | 箭头宽度 |
| `height` | `number` | `size` | 箭头高度 |
| `offset` | `number` | `-width/2` | 路径方向偏移 |
| `open` | `boolean` | `false` | 是否空心（仅描边） |

### diamond 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `number` | `10` | 菱形尺寸 |
| `width` | `number` | `size` | 菱形宽度 |
| `height` | `number` | `size` | 菱形高度 |
| `offset` | `number` | `-width/2` | 路径方向偏移 |

### circle 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `r` | `number` | `5` | 圆形半径 |

### ellipse 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `rx` | `number` | `5` | X 方向半径 |
| `ry` | `number` | `5` | Y 方向半径 |

### cross 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `number` | `10` | 交叉尺寸 |
| `width` | `number` | `size` | 宽度 |
| `height` | `number` | `size` | 高度 |
| `offset` | `number` | `-width/2` | 路径方向偏移 |

### async 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `width` | `number` | `10` | 宽度 |
| `height` | `number` | `6` | 高度 |
| `offset` | `number` | `-width/2` | 路径方向偏移 |
| `open` | `boolean` | `false` | 是否空心（仅描边） |
| `flip` | `boolean` | `false` | 是否翻转方向 |

## 完整示例

### 常见箭头组合

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});

const node1 = graph.addNode({
  shape: 'rect', x: 50, y: 50, width: 80, height: 40, label: 'A',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 4, ry: 4 } },
});

const node2 = graph.addNode({
  shape: 'rect', x: 300, y: 50, width: 80, height: 40, label: 'B',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 4, ry: 4 } },
});

// 经典箭头
graph.addEdge({
  source: node1,
  target: node2,
  attrs: {
    line: { stroke: '#333', strokeWidth: 1, targetMarker: 'classic' },
  },
});
```

### 自定义箭头大小和颜色

```javascript
graph.addEdge({
  source: node1,
  target: node2,
  attrs: {
    line: {
      stroke: '#1890ff',
      strokeWidth: 2,
      targetMarker: {
        name: 'block',
        size: 14,
        open: true,        // 空心三角
        stroke: '#1890ff',
        fill: 'none',
      },
    },
  },
});
```

### 双向箭头

```javascript
graph.addEdge({
  source: node1,
  target: node2,
  attrs: {
    line: {
      stroke: '#333',
      strokeWidth: 1,
      sourceMarker: 'classic',
      targetMarker: 'classic',
    },
  },
});
```

### ER 图中的菱形和圆形箭头

```javascript
// 一对多关系
graph.addEdge({
  source: tableA,
  target: tableB,
  attrs: {
    line: {
      stroke: '#333',
      strokeWidth: 1,
      sourceMarker: { name: 'diamond', size: 12, fill: '#fff', stroke: '#333' },
      targetMarker: { name: 'classic', size: 10 },
    },
  },
});
```

### 移除默认箭头

```javascript
graph.addEdge({
  source: node1,
  target: node2,
  attrs: {
    line: {
      stroke: '#8f8f8f',
      targetMarker: null,    // 无箭头
    },
  },
});
```

## 自定义 SVG path 箭头

**当内置箭头不够用时**，可以直接传入 `{ tagName, d, ...attrs }` 对象，X6 会自动把它注册到 SVG `<defs>` 并生成对应的 `<marker>` 元素。**不需要也不允许**手工调用 `document.createElementNS` 或访问 `graph.svgDoc`、`graph.defs`（这些都不是 3.x 的公开 API）。

- `tagName` 通常用 `'path'`，配合 `d` 路径
- 路径坐标系：marker 的本地坐标系，原点在边的端点处，**X 轴沿边方向**。常见菱形路径：`'M 20 -10 0 0 20 10 Z'`
- 可直接在对象内写 `fill`、`stroke`、`strokeWidth` 等 SVG 属性

```javascript
graph.addEdge({
  source: [100, 140],
  target: [400, 140],
  attrs: {
    line: {
      stroke: '#8f8f8f',
      strokeWidth: 1,
      // 源端：灰色默认菱形
      sourceMarker: {
        tagName: 'path',
        d: 'M 20 -10 0 0 20 10 Z',
      },
      // 终止端：红边绿底自定义菱形
      targetMarker: {
        tagName: 'path',
        stroke: '#D94111',
        strokeWidth: 2,
        fill: '#90C54C',
        d: 'M 20 -10 0 0 20 10 Z',
      },
    },
  },
});
```

## 渐变填充的箭头

如果一定要给自定义 marker 设置渐变色，**唯一正确**的姿势是使用 X6 公开 API `graph.defineGradient(options)` 拿到 `gradientId`，再把 `fill` 写成 `url(#gradientId)`。

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
});

const source = graph.addNode({
  shape: 'rect', x: 80, y: 100, width: 100, height: 40, label: 'Source',
  attrs: { body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 } },
});

const target = graph.addNode({
  shape: 'rect', x: 360, y: 100, width: 100, height: 40, label: 'Target',
  attrs: { body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 } },
});

// 1) 通过公开 API 注册线性渐变，拿到 id
const gradientId = graph.defineGradient({
  type: 'linearGradient',
  stops: [
    { offset: 0, color: '#ff0000' },
    { offset: 1, color: '#00ff00' },
  ],
});

// 2) 在 marker 对象里通过 url(#id) 引用
graph.addEdge({
  source,
  target,
  attrs: {
    line: {
      stroke: '#8f8f8f',
      strokeWidth: 2,
      sourceMarker: 'classic',
      targetMarker: {
        tagName: 'path',
        d: 'M 0 -10 10 0 0 10 -10 0 Z',
        fill: `url(#${gradientId})`,
        stroke: 'none',
      },
    },
  },
});
```

> ⚠️ `graph.defineGradient` 的 `stops[].offset` 是 `0~1` 的数字（不是 `'0%'` 字符串）。

## 常见错误

### ❌ 手工创建 SVG `<defs>` / `<linearGradient>`

```javascript
// 错误：X6 上没有 graph.svgDoc / graph.defs 这种公开属性，且会绕过 X6 的 defs 管理
const defs = graph.svgDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');           // ❌
const gradient = graph.svgDoc.createElementNS(                                              // ❌
  'http://www.w3.org/2000/svg',
  'linearGradient',
);
gradient.setAttribute('id', 'gradient');
// ...
graph.svgDoc.appendChild(defs);                                                             // ❌ 运行时报错
```

```javascript
// 正确：用 graph.defineGradient 拿到 id 后在 fill 里 url(#id)
const gradientId = graph.defineGradient({
  type: 'linearGradient',
  stops: [
    { offset: 0, color: '#ff0000' },
    { offset: 1, color: '#00ff00' },
  ],
});
attrs.line.targetMarker = {
  tagName: 'path',
  d: 'M 0 -10 10 0 0 10 -10 0 Z',
  fill: `url(#${gradientId})`,
  stroke: 'none',
};
```

### ❌ 将 marker 设置在错误位置

```javascript
// 错误：marker 不是边的顶层属性
graph.addEdge({
  source: node1,
  target: node2,
  targetMarker: 'classic', // ❌ 无效
});

// 正确：marker 在 attrs.line 下
graph.addEdge({
  source: node1,
  target: node2,
  attrs: {
    line: { targetMarker: 'classic' }, // ✅
  },
});
```

### ❌ 空心箭头时忘记设置 fill

```javascript
// 空心箭头需要用 block + open: true，或手动设置 fill: 'none'
attrs: {
  line: {
    targetMarker: {
      name: 'block',
      open: true,  // ✅ block 支持 open 参数
    },
  },
}
```
