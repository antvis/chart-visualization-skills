---
id: "x6-core-attr-registry"
title: "X6 自定义属性注册（Attr Registry）"
description: |
  X6 的属性注册机制，用于扩展节点/边的 attrs 配置项。支持自定义 set、position、offset 三种属性处理器。
library: x6
version: 3.x
category: "core"
tags:
  - attr
  - registry
  - custom-attr
  - attrs
---

# 自定义属性注册（Attr Registry）

## 概述

X6 通过属性注册表（Attr Registry）管理所有 `attrs` 中可使用的特殊属性。除了标准 SVG 属性（如 `fill`、`stroke`）会直接设置到 DOM 元素上外，X6 还内置了一系列高级属性（如 `refX`、`refWidth`、`connection` 等），并支持用户自定义注册新属性。

## 内置特殊属性

### 相对定位属性（ref 系列）

基于参考元素（通常是节点 body）的 BBox 进行相对定位和尺寸计算：

| 属性 | 说明 | 值范围 |
|------|------|--------|
| `ref` | 指定参考元素的选择器 | CSS 选择器字符串 |
| `refX` | 相对 X 坐标 | 0~1 为百分比，其他为绝对偏移 |
| `refY` | 相对 Y 坐标 | 同上 |
| `refDx` | 相对于参考元素右侧的 X 偏移 | 像素值 |
| `refDy` | 相对于参考元素底部的 Y 偏移 | 像素值 |
| `refWidth` | 相对宽度 | 0~1 为百分比，其他为绝对调整 |
| `refHeight` | 相对高度 | 同上 |
| `refRx` | 相对圆角 rx | 0~1 为百分比 |
| `refRy` | 相对圆角 ry | 同上 |
| `refCx` | 相对圆心 cx | 0~1 为百分比 |
| `refCy` | 相对圆心 cy | 同上 |
| `refR` | 相对半径（内切） | 0~1 为百分比 |
| `refRCircumscribed` | 相对半径（外接） | 0~1 为百分比 |
| `refD` | 相对路径 d（缩放适配） | SVG path 字符串 |
| `refPoints` | 相对多边形点（缩放适配） | 点坐标字符串 |

```javascript
graph.addNode({
  shape: 'rect',
  x: 100, y: 100, width: 200, height: 80,
  attrs: {
    body: { fill: '#fff', stroke: '#333' },
    icon: {
      ref: 'body',       // 参考 body 元素
      refX: 0.5,         // 水平居中（50%）
      refY: 0.5,         // 垂直居中（50%）
      refWidth: 0.3,     // 宽度为 body 的 30%
      refHeight: 0.3,    // 高度为 body 的 30%
    },
  },
});
```

### 渐变色属性

`fill` 和 `stroke` 支持传入渐变对象，X6 会自动创建 SVG `<defs>` 中的渐变定义：

```javascript
attrs: {
  body: {
    fill: {
      type: 'linearGradient',
      stops: [
        { offset: '0%', color: '#31d0c6' },
        { offset: '100%', color: '#7c68fc' },
      ],
    },
  },
}
```

### 边连线属性

仅在边（Edge）的 attrs 中有效：

| 属性 | 说明 |
|------|------|
| `connection` | 自动跟随边路径（设为 `true` 或 `{ stubs }` 对象） |
| `atConnectionLength` | 沿边路径指定长度处定位（保持切线方向） |
| `atConnectionRatio` | 沿边路径指定比例处定位（保持切线方向） |
| `atConnectionLengthIgnoreGradient` | 沿路径定位但不旋转 |
| `atConnectionRatioIgnoreGradient` | 沿路径比例定位但不旋转 |

```javascript
graph.addEdge({
  source: node1,
  target: node2,
  attrs: {
    line: { connection: true, stroke: '#333', strokeWidth: 2 },
    label: {
      atConnectionRatio: 0.5,  // 标签定位在边的 50% 处
      text: 'Hello',
      textAnchor: 'middle',
      textVerticalAnchor: 'middle',
    },
  },
});
```

### 其他内置属性

| 属性 | 说明 |
|------|------|
| `text` | 设置文本内容（支持多行、text-path 等高级排版） |
| `textWrap` | 文本自动换行配置 |
| `title` | 设置 SVG `<title>` 子元素（tooltip） |
| `html` | 设置元素的 innerHTML |
| `style` | 设置 CSS 样式对象（通过 `elem.style`） |
| `filter` | SVG 滤镜（支持对象形式的快捷语法） |

## 自定义属性注册

### 注册 API

通过 `Graph.registerAttr(name, definition)` 注册自定义属性：

```javascript
import { Graph } from '@antv/x6';

Graph.registerAttr('myAttr', {
  // qualify: 判断是否应用此属性处理器（可选）
  qualify(value, { elem, attrs, cell, view }) {
    return typeof value === 'number';
  },
  // set: 返回要设置的 SVG 属性对象
  set(value, { elem, refBBox, cell, view }) {
    return { opacity: value / 100 };
  },
});
```

### 三种属性定义类型

#### 1. Set 属性 — 计算并设置 SVG 属性

```javascript
Graph.registerAttr('highlightWidth', {
  qualify(value) {
    return typeof value === 'number';
  },
  set(value, { refBBox }) {
    // 返回要设置到 DOM 元素的属性
    return {
      strokeWidth: value,
      stroke: value > 2 ? 'red' : '#333',
    };
  },
});
```

#### 2. Position 属性 — 计算元素位置偏移

```javascript
Graph.registerAttr('centerInParent', {
  position(value, { refBBox }) {
    if (value) {
      return {
        x: refBBox.x + refBBox.width / 2,
        y: refBBox.y + refBBox.height / 2,
      };
    }
    return null;
  },
});
```

#### 3. Offset 属性 — 计算额外位移

```javascript
Graph.registerAttr('circularOffset', {
  offset(value, { refBBox }) {
    const angle = (value * Math.PI) / 180;
    const radius = Math.min(refBBox.width, refBBox.height) / 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  },
});
```

### qualify 函数

`qualify` 用于判断属性值是否应该由此自定义处理器处理。如果返回 `false`，该属性会作为普通 SVG 属性直接设置到元素上。

```javascript
Graph.registerAttr('fill', {
  // 只有当 fill 值是对象时才走渐变处理，字符串值直接作为 SVG fill
  qualify(value) {
    return typeof value === 'object' && value !== null;
  },
  set(fill, { view }) {
    return `url(#${view.graph.defineGradient(fill)})`;
  },
});
```

## 完整示例：自定义进度条属性

```javascript
import { Graph } from '@antv/x6';

// 注册一个 progress 属性，根据百分比动态设置宽度和颜色
Graph.registerAttr('progress', {
  qualify(value) {
    return typeof value === 'number';
  },
  set(value, { refBBox }) {
    const percent = Math.max(0, Math.min(1, value));
    const color = percent > 0.7 ? '#52c41a' : percent > 0.3 ? '#faad14' : '#f5222d';
    return {
      width: refBBox.width * percent,
      fill: color,
    };
  },
});

const graph = new Graph({ container: 'container', width: 800, height: 600 });

graph.addNode({
  shape: 'rect',
  x: 100, y: 100, width: 200, height: 30,
  markup: [
    { tagName: 'rect', selector: 'body' },
    { tagName: 'rect', selector: 'progress' },
    { tagName: 'text', selector: 'label' },
  ],
  attrs: {
    body: { width: 200, height: 30, fill: '#f0f0f0', stroke: '#d9d9d9' },
    progress: { progress: 0.65, height: 30, rx: 0, ry: 0 },
    label: { text: '65%', refX: 0.5, refY: 0.5, textAnchor: 'middle', textVerticalAnchor: 'middle' },
  },
});
```

## 常见错误

```javascript
// ❌ 错误：refX/refY 使用像素值但期望百分比效果
attrs: { icon: { refX: 100, refY: 50 } }
// 当 refX > 1 时，被视为绝对偏移（像素），不是百分比

// ✅ 正确：使用 0~1 的小数表示百分比
attrs: { icon: { refX: 0.5, refY: 0.5 } }  // 居中

// ❌ 错误：对非边元素使用 connection 属性
graph.addNode({
  attrs: { body: { connection: true } }  // connection 只对边有效
});

// ✅ 正确：connection 用于边的 attrs
graph.addEdge({
  attrs: { line: { connection: true, stroke: '#333' } },
});
```
