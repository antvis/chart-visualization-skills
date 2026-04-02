---
id: "g2-comp-view"
title: "G2 View 组合"
description: |
  View 组合用于创建多视图图表。可以将多个 mark 组合在一起，
  共享数据、比例尺、坐标轴等配置。

library: "g2"
version: "5.x"
category: "compositions"
tags:
  - "组合"
  - "view"
  - "多视图"
  - "复合图表"

related:
  - "g2-comp-space-layer"
  - "g2-comp-space-flex"
  - "g2-core-chart-init"

use_cases:
  - "多系列图表"
  - "复合图表"
  - "共享配置的多 mark 图表"

anti_patterns:
  - "单一 mark 图表不需要 View 组合"

difficulty: "intermediate"
completeness: "full"
created: "2025-03-26"
updated: "2025-03-26"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/manual/core/composition"
---

## 核心概念

View 组合允许将多个 mark 组合在一起：
- 共享数据和配置
- 统一管理比例尺和坐标轴
- 支持嵌套组合

**特点：**
- 子 mark 继承父级配置
- 支持数据合并
- 可配置坐标轴、图例等

## 最小可运行示例

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({
  container: 'container',
  width: 640,
  height: 480,
});

chart.options({
  type: 'view',
  data: [
    { month: 'Jan', value: 100, type: 'A' },
    { month: 'Feb', value: 120, type: 'A' },
    { month: 'Jan', value: 80, type: 'B' },
    { month: 'Feb', value: 90, type: 'B' },
  ],
  children: [
    {
      type: 'line',
      encode: { x: 'month', y: 'value', color: 'type' },
    },
    {
      type: 'point',
      encode: { x: 'month', y: 'value', color: 'type' },
    },
  ],
});

chart.render();
```

## 常用变体

### 共享坐标轴配置

```javascript
chart.options({
  type: 'view',
  data,
  axis: {
    x: { title: 'Month' },
    y: { title: 'Value' },
  },
  children: [
    { type: 'line', encode: { x: 'month', y: 'value', color: 'type' } },
    { type: 'point', encode: { x: 'month', y: 'value', color: 'type' } },
  ],
});
```

### 共享比例尺

```javascript
chart.options({
  type: 'view',
  data,
  scale: {
    color: {
      range: ['#1890ff', '#52c41a'],
    },
  },
  children: [
    { type: 'line', encode: { x: 'month', y: 'value', color: 'type' } },
    { type: 'point', encode: { x: 'month', y: 'value', color: 'type' } },
  ],
});
```

### 子 mark 独立数据

```javascript
chart.options({
  type: 'view',
  children: [
    {
      type: 'interval',
      data: [{ category: 'A', value: 100 }],
      encode: { x: 'category', y: 'value' },
    },
    {
      type: 'line',
       [{ x: 0, y: 50 }, { x: 1, y: 150 }],
      encode: { x: 'x', y: 'y' },
      scale: { x: { type: 'identity' }, y: { domain: [0, 200] } },
    },
  ],
});
```

### 带图例配置

```javascript
chart.options({
  type: 'view',
  data,
  encode: { color: 'type' },
  legend: {
    color: { position: 'top' },
  },
  children: [
    { type: 'line', encode: { x: 'month', y: 'value', color: 'type' } },
    { type: 'point', encode: { x: 'month', y: 'value', color: 'type' } },
  ],
});
```

## 完整类型参考

```typescript
interface ViewComposition {
  type: 'view';
  data?: DataOption;
  encode?: EncodeOption;
  scale?: ScaleOption;
  axis?: AxisOption;
  legend?: LegendOption;
  transform?: TransformOption[];
  slider?: SliderOption;
  children: MarkSpec[];  // 子 mark 数组
}
```

## 与 SpaceLayer/SpaceFlex 的区别

| 组合类型 | 用途 | 特点 |
|---------|------|------|
| view | 多 mark 叠加 | 共享坐标系 |
| spaceLayer | 多图层叠加 | 独立坐标系 |
| spaceFlex | 多视图排列 | 并排/堆叠布局 |

## 常见错误与修正

### 错误 1：children 格式错误

```javascript
// ❌ 错误：children 应该是数组
chart.options({
  type: 'view',
  children: { type: 'line', ... },
});

// ✅ 正确
chart.options({
  type: 'view',
  children: [{ type: 'line', ... }],
});
```

### 错误 2：子 mark 未指定 type

```javascript
// ❌ 错误：子 mark 必须有 type
chart.options({
  type: 'view',
  children: [{ encode: { x: 'a', y: 'b' } }],
});

// ✅ 正确
chart.options({
  type: 'view',
  children: [{ type: 'line', encode: { x: 'a', y: 'b' } }],
});
```

### 错误 3：混淆 data 和 children 的数据

```javascript
// ⚠️ 注意：View 的 data 会与子 mark 的 data 合并
// 如果子 mark 有自己的 data，会覆盖父级的 data

// 方式 1：父级提供数据
chart.options({
  type: 'view',
  data,
  children: [
    { type: 'line', encode: { x: 'a', y: 'b' } },
  ],
});

// 方式 2：子 mark 独立数据
chart.options({
  type: 'view',
  children: [
    { type: 'line', data, encode: { x: 'a', y: 'b' } },
  ],
});
```