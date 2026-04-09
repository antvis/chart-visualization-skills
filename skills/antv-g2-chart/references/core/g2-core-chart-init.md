---
id: "g2-core-chart-init"
title: "G2 Chart 初始化与基础配置"
description: |
  介绍 G2 v5 中 Chart 对象的创建方式、必填与可选参数、
  自适应尺寸、主题配置及生命周期管理。
  必须使用 Spec 声明式写法（chart.options({})），禁止使用链式 API。

library: "g2"
version: "5.x"
category: "core"
tags:
  - "Chart"
  - "初始化"
  - "容器"
  - "autoFit"
  - "主题"
  - "生命周期"
  - "init"
  - "spec"
  - "options"

related:
  - "g2-core-encode-channel"
  - "g2-core-data-binding"
  - "g2-core-lifecycle"
  - "g2-theme-builtin"

use_cases:
  - "开始创建任何 G2 图表"
  - "配置图表画布尺寸和容器"
  - "设置全局主题和内边距"

anti_patterns:
  - "不要在同一个容器上多次 new Chart（会产生多个画布）"
  - "禁止使用链式 API（chart.interval().encode()...）"
  - "禁止在同一图表中多次调用 chart.options({})（后者会覆盖前者，应合并为一次调用）"

difficulty: "beginner"
completeness: "partial"
created: "2024-01-01"
updated: "2025-03-27"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/manual/core/chart"
---

## 核心概念

`Chart` 是 G2 中最顶层的容器对象，负责管理画布、视图、坐标系和渲染。

**必须使用 Spec 模式**：通过 `chart.options({})` 一次性传入完整描述对象，结构清晰，易于序列化和动态生成。

**禁止使用链式 API**：`chart.interval().encode()` 等链式调用禁止使用。

## 最小可运行示例（Spec 模式）

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({
  container: 'container',
  width: 640,
  height: 480,
});

chart.options({
  type: 'line',        // Mark 类型
  data: [
    { x: 1, y: 10 },
    { x: 2, y: 30 },
    { x: 3, y: 20 },
  ],
  encode: { x: 'x', y: 'y' },
});

chart.render();
```

## 完整 Chart 容器配置项

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({
  // ── 必填 ──────────────────────────────
  container: 'container',        // string | HTMLElement：DOM 容器

  // ── 尺寸 ──────────────────────────────
  width: 640,                    // 画布宽度（px），默认 640
  height: 480,                   // 画布高度（px），默认 480
  autoFit: true,                 // 自动适应容器尺寸（忽略 width/height）

  // ── 内边距 ────────────────────────────
  padding: 'auto',               // 'auto' | number | [top, right, bottom, left]
  paddingTop: 40,
  paddingRight: 20,
  paddingBottom: 40,
  paddingLeft: 60,
  inset: 0,                      // 数据区域内缩（防止数据点紧贴边缘）

  // ── 主题 ──────────────────────────────
  theme: 'classic',              // 'classic' | 'classicDark' | 'academy'

  // ── 渲染器 ────────────────────────────
  renderer: undefined,           // 默认 Canvas，可传入 SVG 渲染器

  // ── 像素比 ────────────────────────────
  devicePixelRatio: window.devicePixelRatio,
});
```

## Spec 模式完整结构

```javascript
chart.options({
  // Mark 类型
  type: 'interval',

  // 数据，不同 Mark 直接存在结构上的差异，优先使用对应 mark 中的数据结构
  data: [...],

  // 视觉通道映射
  encode: {
    x: 'genre',
    y: 'sold',
    color: 'genre',
  },

  // 数据变换
  transform: [{ type: 'stackY' }],

  // 比例尺
  scale: {
    y: { domain: [0, 500] },
    color: { range: ['#1890ff', '#52c41a'] },
  },

  // 坐标系
  coordinate: { transform: [{ type: 'transpose' }] },

  // 样式
  style: { radius: 4 },

  // 数据标签
  labels: [{ text: 'sold', position: 'outside' }],

  // Tooltip
  tooltip: { title: 'genre', items: [{ field: 'sold', name: '销量' }] },

  // 坐标轴
  axis: {
    x: { title: '游戏类型' },
    y: { title: '销量' },
  },

  // 图例
  legend: {
    color: { position: 'top' },
  },
});
```

## Spec 模式标准写法

```javascript
// ✅ 正确：Spec 模式（唯一推荐写法）
chart.options({
  type: 'interval',
  data: [...],
  encode: { x: 'genre', y: 'sold', color: 'genre' },
  style: { radius: 4 },
});

// ❌ 禁止：链式 API 模式
chart.interval()
  .data([...])
  .encode('x', 'genre')
  .encode('y', 'sold')
  .encode('color', 'genre')
  .style({ radius: 4 });
```


## 响应式自适应

```javascript
// autoFit：宽度跟随容器，高度可固定
const chart = new Chart({
  container: 'container',
  autoFit: true,
  height: 400,
});

chart.options({ type: 'line', data: [...], encode: { x: 'x', y: 'y' } });
chart.render();
```

## 生命周期

```javascript
// 初次渲染
chart.render();

// 更新 Spec 后重新渲染（changeData 只更新数据）
chart.options({ type: 'bar',  newData, encode: { x: 'x', y: 'y' } });
chart.render();

// 仅更新数据（性能更好）
chart.changeData(newData);

// 销毁
chart.destroy();

// 事件监听
chart.on('afterrender', () => console.log('渲染完成'));
```

## 常见错误与修正

### 错误 0：多次调用 chart.options({})
```javascript
// ❌ 错误：第二次 options() 会完全覆盖第一次，导致配置丢失
chart.options({ type: 'interval', encode: { x: 'genre', y: 'sold' } });
chart.options({ style: { radius: 4 } }); // 前面的 type/encode 丢失！

// ✅ 正确：所有配置合并为一次 chart.options({}) 调用
chart.options({
  type: 'interval',
  encode: { x: 'genre', y: 'sold' },
  style: { radius: 4 },
});
```


### 错误 1：container 指向不存在的 ID
```javascript
// ❌ 错误：DOM 还未加载
const chart = new Chart({ container: 'chart' });

// ✅ 正确：确保 DOM 已存在
document.addEventListener('DOMContentLoaded', () => {
  const chart = new Chart({ container: 'chart', width: 640, height: 400 });
  chart.options({ type: 'line',  [...], encode: { x: 'x', y: 'y' } });
  chart.render();
});
```

### 错误 2：重复初始化同一容器
```javascript
// ❌ 错误：会创建两个画布叠加
const chart1 = new Chart({ container: 'container' });
const chart2 = new Chart({ container: 'container' });

// ✅ 正确：先销毁旧实例
chart1.destroy();
const chart2 = new Chart({ container: 'container' });
```

### 错误 3：autoFit 与固定宽度混用
```javascript
// ❌ 错误：autoFit 会覆盖 width
const chart = new Chart({ container: 'c', autoFit: true, width: 640 });

// ✅ 正确：autoFit 时只设 height
const chart = new Chart({ container: 'c', autoFit: true, height: 400 });
```
