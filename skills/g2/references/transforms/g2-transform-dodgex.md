---
id: "g2-transform-dodgex"
title: "G2 DodgeX 分组变换"
description: |
  DodgeX 是 G2 v5 中用于分组展示的 Transform，
  将同一 x 位置的多系列元素在水平方向上错开排列，
  是分组柱状图的核心依赖。

library: "g2"
version: "5.x"
category: "transforms"
tags:
  - "dodgeX"
  - "分组"
  - "并排"
  - "transform"
  - "分组柱状图"
  - "spec"

related:
  - "g2-mark-interval-grouped"
  - "g2-transform-stacky"

use_cases:
  - "创建分组柱状图（并排展示多系列）"
  - "分组散点图"

difficulty: "beginner"
completeness: "partial"
created: "2024-01-01"
updated: "2025-03-01"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/manual/core/transform/dodge-x"
---

## 基本用法

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({ container: 'container', width: 640, height: 480 });

chart.options({
  type: 'interval',
  data,
  encode: { x: 'month', y: 'value', color: 'type' },
  transform: [{ type: 'dodgeX' }],
});

chart.render();
```

## 配置项

```javascript
chart.options({
  type: 'interval',
  data: [...],
  encode: { x: 'month', y: 'value', color: 'type' },
  transform: [
    {
      type: 'dodgeX',
      padding: 0,          // 组内各柱之间的间距（相对于每组宽度，0-1），默认 0
      paddingOuter: 0.1,   // 整组与相邻组的外边距
      reverse: false,      // 是否反转分组顺序
    },
  ],
});
```

## 与 stackY 的区别

```javascript
// dodgeX：各系列并排展示，便于直接对比绝对值
chart.options({ transform: [{ type: 'dodgeX' }] });

// stackY：各系列堆叠展示，便于对比总量和占比
chart.options({ transform: [{ type: 'stackY' }] });
```

## 常见错误与修正

### 错误：transform 写成对象
```javascript
// ❌ 错误
chart.options({ transform: { type: 'dodgeX' } });

// ✅ 正确：必须是数组
chart.options({ transform: [{ type: 'dodgeX' }] });
```
