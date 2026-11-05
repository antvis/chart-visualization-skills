---
id: "x6-core-transform-api"
title: "X6 画布尺寸与变换 API"
description: |
  画布缩放（zoom/scale）、平移（translate）、旋转（rotate）、适配内容（fitToContent/zoomToFit）、居中（centerContent/centerCell）等变换操作 API 完整指南。
library: x6
version: 3.x
category: "core"
tags:
  - transform
  - zoom
  - scale
  - resize
  - translate
  - fit
  - center
---

# 画布尺寸与变换 API

## 概述

X6 的 TransformManager 提供画布级别的缩放、平移、旋转、尺寸调整和内容适配能力。所有变换 API 通过 `graph` 实例直接调用。

## 画布尺寸

### resize — 调整画布尺寸

```javascript
// 设置画布宽高（像素）
graph.resize(1000, 600);
```

### autoResize — 自动跟随容器尺寸

在 Graph 构造时配置 `autoResize: true`，画布会使用 ResizeObserver 自动跟随父容器尺寸变化：

```javascript
const graph = new Graph({
  container: 'container',
  autoResize: true,  // 自动跟随父容器尺寸
});
```

也可传入指定的 DOM 元素作为监听目标：

```javascript
const graph = new Graph({
  container: 'container',
  autoResize: document.getElementById('wrapper'),
});
```

### getComputedSize — 获取当前画布尺寸

```javascript
const { width, height } = graph.getComputedSize();
```

## 缩放（Zoom / Scale）

### zoom — 缩放画布

```javascript
// 相对缩放：在当前比例基础上增加 0.2
graph.zoom(0.2);

// 绝对缩放：设置为 1.5 倍
graph.zoom(1.5, { absolute: true });

// 以指定中心点缩放
graph.zoom(0.5, { absolute: true, center: { x: 400, y: 300 } });

// 限制缩放范围
graph.zoom(2, { absolute: true, minScale: 0.5, maxScale: 4 });

// 网格对齐缩放
graph.zoom(1.5, { absolute: true, scaleGrid: 0.25 });  // 缩放值对齐到 0.25 的倍数
```

**zoom options 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `absolute` | boolean | `true` 为绝对缩放，`false`（默认）为相对增量 |
| `minScale` | number | 最小缩放比例 |
| `maxScale` | number | 最大缩放比例 |
| `scaleGrid` | number | 缩放值对齐网格 |
| `center` | `{ x, y }` | 缩放中心点（画布坐标） |

### getZoom — 获取当前缩放比例

```javascript
const currentZoom = graph.getZoom();  // 返回 number，如 1.0
```

### scale — 底层缩放（分别设置 sx/sy）

```javascript
// 等比缩放
graph.scale(1.5);

// 非等比缩放
graph.scale(2, 1.5);

// 指定缩放原点
graph.scale(1.5, 1.5, 400, 300);
```

### getScale — 获取当前缩放比例（分轴）

```javascript
const { sx, sy } = graph.getScale();
```

### scaling 配置 — 限制缩放范围

在 Graph 构造时通过 `scaling` 设置全局缩放边界：

```javascript
const graph = new Graph({
  container: 'container',
  scaling: { min: 0.2, max: 4 },  // 全局缩放范围限制
});
```

## 平移（Translate）

### translate — 设置画布平移

```javascript
// 设置绝对平移量
graph.translate(100, 50);
```

### getTranslation — 获取当前平移量

```javascript
const { tx, ty } = graph.getTranslation();
```

## 旋转（Rotate）

### rotate — 旋转画布

```javascript
// 旋转 45 度（默认以画布内容中心为原点）
graph.rotate(45);

// 指定旋转中心
graph.rotate(90, 400, 300);
```

### getRotation — 获取当前旋转角度

```javascript
const angle = graph.getRotation();
```

## 内容适配

### zoomToFit — 缩放并平移使所有内容可见

```javascript
// 基础用法：自动适配所有内容
graph.zoomToFit();

// 带边距
graph.zoomToFit({ padding: 20 });

// 限制缩放范围
graph.zoomToFit({ padding: 20, maxScale: 2, minScale: 0.5 });

// 四边不同边距
graph.zoomToFit({ padding: { top: 20, right: 30, bottom: 20, left: 30 } });
```

### zoomToRect — 缩放到指定矩形区域

```javascript
graph.zoomToRect({ x: 100, y: 100, width: 500, height: 400 });

graph.zoomToRect(
  { x: 0, y: 0, width: 1000, height: 800 },
  { padding: 20, maxScale: 3 },
);
```

### fitToContent — 调整画布尺寸适配内容

调整画布大小使其刚好容纳所有内容（不缩放内容，而是改变画布尺寸）：

```javascript
// 基础用法
graph.fitToContent();

// 带网格对齐和边距
graph.fitToContent({ gridWidth: 10, gridHeight: 10, padding: 20 });

// 完整参数
graph.fitToContent({
  gridWidth: 10,
  gridHeight: 10,
  padding: { top: 20, right: 20, bottom: 20, left: 20 },
  minWidth: 400,
  minHeight: 300,
  maxWidth: 2000,
  maxHeight: 1500,
  allowNewOrigin: 'any',  // 'negative' | 'positive' | 'any'
  border: 10,
});
```

**fitToContent options：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `gridWidth` | number | 宽度对齐网格（默认 1） |
| `gridHeight` | number | 高度对齐网格（默认 1） |
| `padding` | number \| SideOptions | 边距 |
| `minWidth` | number | 最小画布宽度 |
| `minHeight` | number | 最小画布高度 |
| `maxWidth` | number | 最大画布宽度 |
| `maxHeight` | number | 最大画布高度 |
| `border` | number | 内容边框膨胀 |
| `allowNewOrigin` | string | 是否允许调整原点 |
| `contentArea` | RectangleLike | 自定义内容区域 |
| `useCellGeometry` | boolean | 使用几何计算（默认 true） |

### scaleContentToFit — 缩放内容适配画布

缩放画布内容使其适配当前画布可视区域（等比缩放）：

```javascript
graph.scaleContentToFit();

graph.scaleContentToFit({
  padding: 20,
  maxScale: 2,
  minScale: 0.5,
  preserveAspectRatio: true,  // 保持宽高比（默认 true）
});
```

**scaleContentToFit options：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `padding` | number \| SideOptions | 边距 |
| `minScale` / `maxScale` | number | 全局缩放限制 |
| `minScaleX` / `maxScaleX` | number | X 轴缩放限制 |
| `minScaleY` / `maxScaleY` | number | Y 轴缩放限制 |
| `scaleGrid` | number | 缩放对齐网格 |
| `contentArea` | RectangleLike | 自定义内容区域 |
| `viewportArea` | RectangleLike | 自定义视口区域 |
| `preserveAspectRatio` | boolean | 保持宽高比 |

## 居中

### centerContent — 将内容居中显示

```javascript
graph.centerContent();
graph.centerContent({ useCellGeometry: true });
```

### centerCell — 将指定节点居中显示（滚动到节点）

```javascript
const node = graph.addNode({ ... });
graph.centerCell(node);  // 滚动画布使该节点居中显示
```

> **⚠️ 注意**：X6 没有 `graph.scrollToCell()` 方法。要滚动到指定节点，使用 `graph.centerCell(cell)`。

### centerPoint — 将指定坐标居中显示

```javascript
graph.centerPoint(500, 300);
```

## 定位

### positionContent — 将内容定位到指定方位

```javascript
// 将内容定位到画布中心
graph.positionContent('center');

// 其他方位：'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'
graph.positionContent('top-left');
```

### positionCell — 将节点定位到指定方位

```javascript
graph.positionCell(node, 'center');
```

### positionPoint — 将指定点定位到画布指定位置

```javascript
// 将本地坐标 (200, 150) 定位到画布的 50% 50% 处（即居中）
graph.positionPoint({ x: 200, y: 150 }, '50%', '50%');

// 将点定位到画布左上角偏移 100px
graph.positionPoint({ x: 0, y: 0 }, 100, 100);
```

## 内容区域查询

### getContentArea — 获取内容边界（本地坐标）

```javascript
const rect = graph.getContentArea();
// rect: { x, y, width, height }
```

### getContentBBox — 获取内容边界（画布坐标）

```javascript
const bbox = graph.getContentBBox();
```

### getGraphArea — 获取画布可视区域（本地坐标）

```javascript
const area = graph.getGraphArea();
```

## 坐标转换

### localToGraph — 本地坐标转画布坐标

```javascript
const graphPoint = graph.localToGraph({ x: 100, y: 100 });
```

### graphToLocal — 画布坐标转本地坐标

```javascript
const localPoint = graph.graphToLocal({ x: 200, y: 150 });
```

## 完整示例

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  autoResize: true,
  scaling: { min: 0.2, max: 5 },
  mousewheel: { enabled: true, modifiers: 'ctrl' },
  panning: true,
});

// 添加一些节点
graph.addNode({ shape: 'rect', x: 50, y: 50, width: 100, height: 40, label: 'A' });
graph.addNode({ shape: 'rect', x: 300, y: 200, width: 100, height: 40, label: 'B' });
graph.addNode({ shape: 'rect', x: 600, y: 400, width: 100, height: 40, label: 'C' });

// 自动适配所有内容到画布中央
graph.zoomToFit({ padding: 50, maxScale: 1 });

// 监听缩放事件
graph.on('scale', ({ sx, sy }) => {
  console.log(`当前缩放: ${sx.toFixed(2)}x`);
});

// 监听尺寸变化事件
graph.on('resize', ({ width, height }) => {
  console.log(`画布尺寸: ${width} x ${height}`);
});
```

## 常见错误

```javascript
// ❌ 错误：zoom 不传 absolute 时是相对增量，不是设置绝对值
graph.zoom(1.5);  // 这是在当前比例上 +1.5，不是设置为 1.5 倍！

// ✅ 正确：设置绝对缩放比例
graph.zoom(1.5, { absolute: true });

// ❌ 错误：fitToContent 后内容消失（内容为空时返回空矩形）
graph.fitToContent();  // 画布内无元素时可能把尺寸缩为极小

// ✅ 正确：设置最小尺寸保护
graph.fitToContent({ minWidth: 400, minHeight: 300 });

// ❌ 错误：scale 和 zoom 混用导致非预期行为
graph.scale(2, 1.5);  // 非等比缩放
graph.zoom(1);         // zoom 内部用 scale(sx, sy) 会覆盖为等比

// ✅ 正确：统一使用 zoom 或统一使用 scale
graph.zoom(2, { absolute: true });  // 推荐用 zoom 做等比缩放
```
