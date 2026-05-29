---
id: "x6-core-shape-advanced"
title: "X6 高级内置 Shape"
description: |
  X6 除了 rect、circle、ellipse 等基础 shape 外，还提供 path、polyline、polygon、text-block 等高级 shape。
  适用于自定义路径图形、折线连接、多边形、富文本节点等场景。

library: "x6"
version: "3.x"
category: "core"
subcategory: "shape"
tags:
  - "shape"
  - "path"
  - "polyline"
  - "polygon"
  - "text-block"
  - "自定义形状"
  - "SVG路径"
  - "折线"
  - "富文本"

related:
  - "x6-core-node"
  - "x6-intermediate-custom-node"

use_cases:
  - "绘制自定义 SVG 路径节点"
  - "绘制折线形状节点"
  - "创建富文本节点"
  - "绘制多边形节点"

difficulty: "intermediate"
completeness: "full"
---

## 内置 Shape 完整列表

X6 3.x 提供以下内置 shape：

| Shape | 说明 | 主要用途 |
|-------|------|---------|
| `rect` | 矩形 | 最常用的节点形状 |
| `circle` | 圆形 | 状态节点、起止节点 |
| `ellipse` | 椭圆 | 决策节点 |
| `polygon` | 多边形 | 自定义多边形（菱形、六边形等） |
| `polyline` | 折线形 | 折线路径形状 |
| `path` | SVG 路径 | 任意 SVG path 形状 |
| `text` | 纯文本 | 文字标签节点 |
| `text-block` | 富文本块 | 自动换行的文本节点 |
| `image` | 图片 | 图片节点 |
| `html` | HTML | 自定义 HTML 内容节点 |

---

## Path 节点

`path` shape 使用 SVG path 数据定义任意形状。通过 `path` 属性（快捷方式）或 `attrs.body.refD` 设置路径数据。

### 基本用法

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({ container: 'container' });

// 使用 path 快捷属性
graph.addNode({
  shape: 'path',
  x: 100,
  y: 50,
  width: 120,
  height: 60,
  path: 'M 0 5 10 0 C 20 0 20 20 10 20 L 0 15 Z',
  attrs: {
    body: {
      fill: '#efdbff',
      stroke: '#9254de',
      strokeWidth: 2,
    },
  },
});

// 使用 attrs.body.refD（路径会自动缩放到节点尺寸）
graph.addNode({
  shape: 'path',
  x: 300,
  y: 50,
  width: 100,
  height: 80,
  attrs: {
    body: {
      refD: 'M 0 0 L 1 0.5 L 0 1 Z',
      fill: '#d9f7be',
      stroke: '#52c41a',
      strokeWidth: 2,
    },
  },
});
```

### 关键说明

- `path` 属性是 `attrs.body.refD` 的快捷写法
- `refD` 中的路径坐标会按节点的 `width`/`height` 等比缩放
- markup 结构：`rect(bg)` + `path(body)` + `text(label)`
- `bg` 是透明的背景矩形，用于事件捕获

---

## Polyline 节点

`polyline` shape 继承自 `polygon`，用于绘制折线/多边形形状。

### 基本用法

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({ container: 'container' });

// 折线形状（不闭合）
graph.addNode({
  shape: 'polyline',
  x: 100,
  y: 50,
  width: 120,
  height: 60,
  attrs: {
    body: {
      refPoints: '0,0 1,0 1,1 0,1',
      fill: '#fff1b8',
      stroke: '#faad14',
      strokeWidth: 2,
    },
  },
});
```

### 与 Polygon 的区别

- `polygon`：闭合多边形，自动闭合路径
- `polyline`：折线形状，不自动闭合（除非首尾点相同）

### Polygon 示例（菱形）

```javascript
graph.addNode({
  shape: 'polygon',
  x: 100,
  y: 50,
  width: 100,
  height: 60,
  attrs: {
    body: {
      refPoints: '0.5,0 1,0.5 0.5,1 0,0.5',
      fill: '#e6f7ff',
      stroke: '#1890ff',
      strokeWidth: 2,
    },
  },
});
```

---

## Text-Block 节点

`text-block` shape 支持自动换行的富文本内容，在支持 `foreignObject` 的浏览器中使用 HTML div 渲染文本，否则回退到 SVG text。

### 基本用法

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({ container: 'container' });

graph.addNode({
  shape: 'text-block',
  x: 100,
  y: 50,
  width: 200,
  height: 80,
  text: '这是一段自动换行的长文本内容，text-block 会自动根据节点宽度进行换行显示。',
  attrs: {
    body: {
      fill: '#f0f0f0',
      stroke: '#8f8f8f',
      strokeWidth: 1,
      rx: 4,
      ry: 4,
    },
    label: {
      style: {
        fontSize: 14,
      },
    },
  },
});
```

### 关键说明

- 使用 `text` 属性（快捷方式）设置文本内容
- 文本自动根据节点宽度换行
- `attrs.label.style` 设置字体样式（CSS 样式，因为使用 HTML 渲染）
- 适合需要多行文本显示的场景

---

## 自定义箭头标记

在 X6 中，可以通过在边的 `attrs.line` 中直接定义 `sourceMarker` 和 `targetMarker` 来使用自定义 SVG path 作为箭头标记。

### 基本用法

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  background: {
    color: '#F2F7FA',
  },
});

graph.addEdge({
  source: [100, 140],
  target: [400, 140],
  label: 'custom-marker',
  attrs: {
    line: {
      sourceMarker: {
        tagName: 'path',
        d: 'M 20 -10 0 0 20 10 Z',
      },
      targetMarker: {
        tagName: 'path',
        stroke: '#D94111',
        strokeWidth: 2,
        fill: '#90C54C',
        d: 'M 20 -10 0 0 20 10 Z',
      },
      stroke: '#8f8f8f',
      strokeWidth: 1,
    },
  },
});
```

### 关键说明

- `sourceMarker` 和 `targetMarker` 可以是字符串（预设标记）或对象（自定义标记）
- 自定义标记对象中必须包含 `tagName` 和 `d` 属性
- `d` 属性定义 SVG path 路径
- 可通过 `stroke`、`fill` 等属性设置样式

---

## 常见错误与修正

### 错误 1: Path 节点使用 d 而非 refD

```javascript
// ❌ 错误：使用 d 属性，路径不会缩放
attrs: { body: { d: 'M 0 0 L 100 50 L 0 100 Z' } }

// ✅ 正确：使用 refD，路径按节点尺寸缩放
attrs: { body: { refD: 'M 0 0 L 1 0.5 L 0 1 Z' } }

// ✅ 正确：使用 path 快捷属性
graph.addNode({ shape: 'path', path: 'M 0 0 L 100 50 L 0 100 Z', ... })
```

### 错误 2: 混淆 polygon 和 polyline

```javascript
// polygon 自动闭合，无需重复首点
attrs: { body: { refPoints: '0,0 1,0 1,1 0,1' } }  // 自动闭合为矩形

// polyline 不自动闭合，如需闭合要手动加首点
attrs: { body: { refPoints: '0,0 1,0 1,1 0,1 0,0' } }  // 手动闭合
```

### 错误 3: text-block 使用 label 而非 text

```javascript
// ❌ 错误：label 属性对 text-block 无效
graph.addNode({ shape: 'text-block', label: '文本内容' })

// ✅ 正确：使用 text 属性
graph.addNode({ shape: 'text-block', text: '文本内容' })
```

### 错误 4: 错误使用 graph.markers.register 注册自定义箭头

```javascript
// ❌ 错误：X6 中没有 graph.markers.register 方法
const customMarker = { tagName: 'path', attrs: { d: 'M 0 -6 L 12 0 L 0 6 Z' } }
graph.markers.register('custom-marker', customMarker)

// ✅ 正确：在 attrs.line 中直接定义 marker
graph.addEdge({
  source: node1,
  target: node2,
  attrs: {
    line: {
      sourceMarker: 'classic',
      targetMarker: {
        tagName: 'path',
        d: 'M 0 -6 L 12 0 L 0 6 Z',
        fill: 'green',
        stroke: 'red',
      },
    },
  },
})
```