---
id: "x6-core-background"
title: "X6 画布背景配置"
description: |
  X6 画布背景配置：纯色背景、背景图片、平铺模式（repeat/flip-x/flip-y/flip-xy/watermark）、透明度等。

library: "x6"
version: "3.x"
category: "core"
subcategory: "background"
tags:
  - "background"
  - "背景"
  - "背景色"
  - "背景图片"
  - "水印"
  - "watermark"

related:
  - "x6-core-graph-init"
  - "x6-core-grid"

use_cases:
  - "设置画布背景颜色"
  - "设置画布背景图片"
  - "画布添加水印"
  - "背景图片平铺/翻转"
  - "动态切换背景"

difficulty: "beginner"
completeness: "full"
---

## 基本用法

背景在 Graph 构造函数中通过 `background` 字段配置：

```javascript
import { Graph } from '@antv/x6';

// 纯色背景
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  background: { color: '#F2F7FA' },
});
```

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `color` | string | - | 背景颜色（CSS 颜色值） |
| `image` | string | - | 背景图片 URL |
| `position` | string \| object | `'center'` | 背景图片位置。字符串：CSS background-position；对象：`{ x, y }` |
| `size` | string \| object | `'auto auto'` | 背景图片大小。字符串：`'auto'`/`'contain'`/`'cover'`；对象：`{ width, height }` |
| `repeat` | string | `'no-repeat'` | 平铺模式：`'repeat'`、`'no-repeat'`、`'repeat-x'`、`'repeat-y'`、`'flip-x'`、`'flip-y'`、`'flip-xy'`、`'watermark'` |
| `opacity` | number | `1` | 背景透明度（0~1） |

## 纯色背景

```javascript
const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
});
```

## 背景图片

```javascript
const graph = new Graph({
  container: 'container',
  background: {
    image: 'https://example.com/bg.png',
    size: 'cover',
    position: 'center',
    opacity: 0.5,
  },
});
```

## 平铺模式

### repeat（标准平铺）

```javascript
const graph = new Graph({
  container: 'container',
  background: {
    image: 'https://example.com/tile.png',
    repeat: 'repeat',
    size: { width: 100, height: 100 },
  },
});
```

### flip-x / flip-y / flip-xy（翻转平铺）

图片在水平/垂直方向交替翻转，形成镜像平铺效果：

```javascript
const graph = new Graph({
  container: 'container',
  background: {
    image: 'https://example.com/pattern.png',
    repeat: 'flip-xy',  // 水平和垂直都翻转
    size: { width: 200, height: 200 },
  },
});
```

### watermark（水印）

图片以水印方式平铺，带旋转角度：

```javascript
const graph = new Graph({
  container: 'container',
  background: {
    image: 'https://example.com/watermark.png',
    repeat: 'watermark',
    opacity: 0.1,
  },
});
```

## 编程式 API

```javascript
// 动态设置背景
graph.drawBackground({ color: '#fff' });

// 设置背景图片
graph.drawBackground({
  image: 'https://example.com/bg.png',
  repeat: 'repeat',
  size: { width: 100, height: 100 },
});

// 清除背景
graph.clearBackground();
```

## 完整示例：背景色 + 网格

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  background: { color: '#F2F7FA' },
  grid: { visible: true, size: 10, type: 'dot' },
});

graph.addNode({
  x: 200,
  y: 150,
  width: 120,
  height: 60,
  label: 'Hello',
  attrs: { body: { fill: '#fff', stroke: '#5F95FF' } },
});
```

## 常见错误

### ❌ background 与 grid 的颜色混淆

```javascript
// 注意：grid 的颜色是网格线/点的颜色，不是背景色
const graph = new Graph({
  container: 'container',
  grid: { visible: true, args: { color: '#F2F7FA' } },  // ❌ 这不是设置背景色
});

// 正确：背景色用 background，网格颜色用 grid.args.color
const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },  // ✅ 背景色
  grid: { visible: true, args: { color: '#ddd' } },  // ✅ 网格点颜色
});
```

### ❌ image 路径问题

```javascript
// 注意：image 必须是可访问的 URL 或 Data URL
background: {
  image: './bg.png',  // ⚠️ 相对路径可能在某些环境下无法加载
}

// 推荐：使用绝对 URL 或 import 的资源
background: {
  image: 'https://cdn.example.com/bg.png',  // ✅
}
```
