---
id: "x6-core-grid"
title: "X6 网格配置"
description: |
  X6 画布网格配置：dot 点阵、fixedDot 固定点阵、mesh 网格线、doubleMesh 双层网格，以及网格颜色、大小、可见性控制。

library: "x6"
version: "3.x"
category: "core"
subcategory: "grid"
tags:
  - "grid"
  - "网格"
  - "dot"
  - "mesh"
  - "doubleMesh"
  - "对齐"
  - "背景网格"

related:
  - "x6-core-graph-init"
  - "x6-core-background"

use_cases:
  - "显示点阵网格"
  - "显示网格线"
  - "自定义网格颜色和大小"
  - "动态显示/隐藏网格"
  - "双层网格（主次网格线）"

difficulty: "beginner"
completeness: "full"
---

## 基本用法

网格在 Graph 构造函数中通过 `grid` 字段配置：

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  grid: {
    visible: true,
    size: 10,  // 网格步长（像素）
  },
});
```

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `visible` | boolean | `false` | 是否显示网格 |
| `size` | number | `10` | 网格步长（节点移动时吸附到的最小间隔） |
| `type` | string | `'dot'` | 网格类型：`'dot'`、`'fixedDot'`、`'mesh'`、`'doubleMesh'` |
| `args` | object | - | 网格类型对应的参数 |

**注意**：即使 `visible: false`，`size` 仍然生效——节点拖拽时会吸附到 `size` 为步长的网格点上。

## 网格类型

### dot（点阵，默认）

显示为均匀分布的点，缩放时点的大小随之变化：

```javascript
const graph = new Graph({
  container: 'container',
  grid: {
    visible: true,
    size: 10,
    type: 'dot',
    args: {
      color: '#aaaaaa',   // 点的颜色
      thickness: 1,        // 点的大小
    },
  },
});
```

### fixedDot（固定点阵）

与 `dot` 类似，但缩放比例 ≤ 1 时点的大小保持不变（不会太小看不清）：

```javascript
const graph = new Graph({
  container: 'container',
  grid: {
    visible: true,
    size: 10,
    type: 'fixedDot',
    args: {
      color: '#aaaaaa',
      thickness: 2,
    },
  },
});
```

### mesh（网格线）

显示为交叉网格线：

```javascript
const graph = new Graph({
  container: 'container',
  grid: {
    visible: true,
    size: 10,
    type: 'mesh',
    args: {
      color: 'rgba(224, 224, 224, 1)',  // 线条颜色
      thickness: 1,                      // 线条粗细
    },
  },
});
```

### doubleMesh（双层网格）

显示两层网格线——主网格和次网格，次网格通过 `factor` 倍数放大间距：

```javascript
const graph = new Graph({
  container: 'container',
  grid: {
    visible: true,
    size: 10,
    type: 'doubleMesh',
    args: [
      // 第一层：细密网格
      {
        color: 'rgba(224, 224, 224, 1)',
        thickness: 1,
      },
      // 第二层：粗疏网格（间距 = size * factor）
      {
        color: 'rgba(224, 224, 224, 0.2)',
        thickness: 3,
        factor: 4,  // 间距为基础 size 的 4 倍
      },
    ],
  },
});
```

## 编程式 API

```javascript
// 获取网格步长
graph.getGridSize();  // number

// 设置网格步长
graph.setGridSize(20);

// 显示网格
graph.showGrid();

// 隐藏网格
graph.hideGrid();

// 重新绘制网格（切换类型）
graph.drawGrid({
  type: 'mesh',
  args: { color: '#ddd', thickness: 1 },
});
```

## 完整示例

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  grid: {
    visible: true,
    size: 20,
    type: 'doubleMesh',
    args: [
      { color: '#eee', thickness: 1 },
      { color: '#ddd', thickness: 1, factor: 4 },
    ],
  },
});

// 节点会自动吸附到 20px 步长的网格点
graph.addNode({
  x: 100,  // 实际位置会吸附到 size 的整数倍
  y: 100,
  width: 80,
  height: 40,
  label: 'Snaps to grid',
});
```

## 常见错误

### ❌ 混淆 size 和 visible

```javascript
// 错误理解：以为 visible: false 就没有网格效果
const graph = new Graph({
  container: 'container',
  grid: { visible: false, size: 20 },
});
// 实际上节点拖拽时仍会吸附到 20px 网格！
```

### ❌ doubleMesh 的 args 传对象而非数组

```javascript
// 错误：doubleMesh 的 args 必须是数组
grid: {
  type: 'doubleMesh',
  args: { color: '#eee', thickness: 1 },  // ❌ 应为数组
}

// 正确
grid: {
  type: 'doubleMesh',
  args: [
    { color: '#eee', thickness: 1 },
    { color: '#ddd', thickness: 1, factor: 4 },
  ],  // ✅
}
```
