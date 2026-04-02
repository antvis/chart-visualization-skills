---
id: "g2-mark-interval-basic"
title: "G2 基础柱状图（Interval Mark）"
description: |
  使用 Interval Mark 创建基础柱状图。Interval Mark 是 G2 中
  用于绘制柱形、条形、直方图的核心标记类型。
  本文采用 Spec 模式（chart.options({})），通过 encode 映射 x/y/color 通道。

library: "g2"
version: "5.x"
category: "marks"
subcategory: "interval"
tags:
  - "柱状图"
  - "条形图"
  - "分类数据"
  - "比较"
  - "Interval"
  - "bar chart"
  - "bar"
  - "spec"
  - "options"

related:
  - "g2-mark-interval-grouped"
  - "g2-mark-interval-stacked"
  - "g2-mark-interval-normalized"
  - "g2-core-chart-init"
  - "g2-core-encode-channel"
  - "g2-scale-band"

use_cases:
  - "比较不同类别的数值大小"
  - "展示各项目的完成量、销量等指标"
  - "显示排名数据"
  - "对比多个维度的指标值"

anti_patterns:
  - "不适合展示连续数值的趋势变化（改用 Line 或 Area Mark）"
  - "类别超过 20 个时可读性差，考虑分页或过滤"
  - "不适合展示部分与整体的关系（改用堆叠柱状图或饼图）"

difficulty: "beginner"
completeness: "full"
created: "2024-01-01"
updated: "2025-03-01"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/examples/bar/basic"
---

## 核心概念

Interval Mark 将数据映射为矩形区间：
- 在直角坐标系中：柱形（竖向）或条形（横向）
- 在极坐标系中：扇形（饼图）或玫瑰图

**关键 encode 通道：**
- `x`：分类轴，通常映射分类字段，自动使用 Band Scale
- `y`：数值轴，映射数值字段，使用 Linear Scale
- `color`：颜色，用于视觉区分

## 最小可运行示例

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({
  container: 'container',
  width: 640,
  height: 480,
});

chart.options({
  type: 'interval',
  data: [
    { genre: 'Sports',   sold: 275 },
    { genre: 'Strategy', sold: 115 },
    { genre: 'Action',   sold: 120 },
    { genre: 'Shooter',  sold: 350 },
    { genre: 'Other',    sold: 150 },
  ],
  encode: {
    x: 'genre',
    y: 'sold',
    color: 'genre',
  },
});

chart.render();
```

## 常用变体

### 水平条形图（转置坐标系）

```javascript
chart.options({
  type: 'interval',
  data: [...],
  encode: { x: 'genre', y: 'sold', color: 'genre' },
  coordinate: { transform: [{ type: 'transpose' }] },   // 关键：转置坐标系
});
```

### 带数据标签的柱状图

```javascript
chart.options({
  type: 'interval',
  data: [...],
  encode: { x: 'genre', y: 'sold' },
  labels: [
    {
      text: 'sold',            // 显示哪个字段的值
      position: 'outside',     // 'inside' | 'outside' | 'top-left' | 'top-right'
      style: { fontSize: 12, fill: '#333' },
    },
  ],
});
```

### 圆角柱状图

```javascript
chart.options({
  type: 'interval',
  data: [...],
  encode: { x: 'genre', y: 'sold' },
  style: {
    radius: 4,               // 统一圆角
    // 或单独设置：
    // radiusTopLeft: 4,
    // radiusTopRight: 4,
  },
});
```

### 自定义颜色

```javascript
chart.options({
  type: 'interval',
  data: [...],
  encode: { x: 'genre', y: 'sold', color: 'genre' },
  scale: {
    color: {
      range: ['#1890ff', '#2fc25b', '#facc14', '#223273', '#8543e0'],
    },
  },
});
```

### 带 Tooltip 配置

```javascript
chart.options({
  type: 'interval',
  data: [...],
  encode: { x: 'genre', y: 'sold' },
  tooltip: {
    title: 'genre',
    items: [{ field: 'sold', name: '销量' }],
  },
});
```

### Y 轴从指定值开始

```javascript
chart.options({
  type: 'interval',
  data: [...],
  encode: { x: 'genre', y: 'sold' },
  scale: {
    y: { domain: [50, 400] },  // 手动设置 y 轴范围
  },
});
```

### 自定义坐标轴标题

```javascript
chart.options({
  type: 'interval',
  data: [...],
  encode: { x: 'genre', y: 'sold' },
  axis: {
    x: { title: '游戏类型' },
    y: { title: '销量（万份）' },
  },
});
```

## Spec 完整结构速查

```javascript
chart.options({
  // Mark 类型
  type: 'interval',

  // 数据
  data: [...],

  // 通道映射
  encode: {
    x: 'genre',           // x 轴字段
    y: 'sold',            // y 轴字段
    color: 'genre',       // 颜色字段
    shape: 'rect',        // 形状：'rect' | 'hollow'
  },

  // 比例尺
  scale: {
    y: { domain: [0, 500] },
    color: { range: ['#f00', '#00f'] },
  },

  // 坐标系变换
  coordinate: { transform: [{ type: 'transpose' }] },

  // 样式
  style: {
    radius: 4,
    fillOpacity: 0.9,
  },

  // 数据标签（注意是 labels 复数）
  labels: [{ text: 'sold', position: 'outside' }],

  // Tooltip
  tooltip: { title: 'genre', items: [{ field: 'sold' }] },

  // 坐标轴
  axis: {
    x: { title: '游戏类型' },
    y: { title: '销量' },
  },
});
```

## 完整类型参考

```typescript
// chart.options() 传入的 Spec 类型（interval 部分）
interface IntervalSpec {
  type: 'interval';
  data?: DataOption;
  encode?: {
    x?: string | ((d: any) => any);
    y?: string | ((d: any) => any);
    color?: string | ((d: any) => any);
    shape?: 'rect' | 'hollow' | 'funnel' | 'pyramid' | string;
    size?: string | number | ((d: any) => any);
    series?: string;
  };
  transform?: Array<{ type: string; [key: string]: any }>;
  scale?: {
    x?: ScaleOption;
    y?: ScaleOption;
    color?: ScaleOption;
  };
  coordinate?: { type: string; [key: string]: any };
  style?: {
    radius?: number;
    radiusTopLeft?: number;
    radiusTopRight?: number;
    radiusBottomLeft?: number;
    radiusBottomRight?: number;
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
  };
  labels?: LabelOption[];
  tooltip?: TooltipOption;
  axis?: { x?: AxisOption; y?: AxisOption };
  legend?: { color?: LegendOption };
}
```

## 常见错误与修正

### 错误 1：使用 API 链式调用
```javascript
// ❌ 错误（G2 API 链式调用写法）
chart.interval().encode('x', 'genre');

// ✅ 正确（G2 Spec 写法）
chart.options({
  type: 'interval',
  data,
  encode: { x: 'genre', y: 'sold', color: 'genre' },
});
```

### 错误 2：缺少 container 参数
```javascript
// ❌ 错误
const chart = new Chart({ width: 640, height: 480 });

// ✅ 正确
const chart = new Chart({ container: 'container', width: 640, height: 480 });
```

### 错误 3：encode 和 style 混淆
```javascript
// ❌ 错误：style 不接受数据字段名
chart.options({ type: 'interval',  [...], style: { color: 'genre' } });

// ✅ 正确：数据映射用 encode，固定样式用 style
chart.options({
  type: 'interval',
  data: [...],
  encode: { color: 'genre' },   // 数据驱动
  style: { fill: '#1890ff' },   // 固定颜色时才用 style
});
```

### 错误 4：labels 写成 label（单数）
```javascript
// ❌ 错误：Spec 模式中标签字段是 labels（复数）
chart.options({ type: 'interval',  data: [...], label: { text: 'sold' } });

// ✅ 正确
chart.options({ type: 'interval', data: [...], labels: [{ text: 'sold' }] });
```

### 错误 5：y 轴负值处理
```javascript
// ❌ 潜在问题：负值柱体可能超出绘图区域
chart.options({ type: 'interval',  dataWithNegatives, encode: { y: 'value' } });

// ✅ 正确：通过 scale.y.domain 显式包含负值范围
chart.options({
  type: 'interval',
  data: dataWithNegatives,
  encode: { x: 'genre', y: 'value' },
  scale: { y: { domain: [-100, 300] } },
});
```
