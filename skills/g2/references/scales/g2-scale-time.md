---
id: "g2-scale-time"
title: "G2 Time 时间比例尺"
description: |
  Time 比例尺将时间数据（Date 对象或时间戳）映射到连续坐标轴，
  自动处理时间刻度间隔、格式化和排序。当 encode.x 映射 Date 类型数据时自动启用。

library: "g2"
version: "5.x"
category: "scales"
tags:
  - "time"
  - "时间比例尺"
  - "时间轴"
  - "Date"
  - "时间序列"
  - "scale"
  - "spec"

related:
  - "g2-mark-line-basic"
  - "g2-comp-axis-config"
  - "g2-scale-linear"

use_cases:
  - "绘制时间序列折线图、面积图"
  - "控制时间轴的刻度粒度和标签格式"
  - "设置时间轴的显示范围"

difficulty: "intermediate"
completeness: "full"
created: "2024-01-01"
updated: "2025-03-01"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/manual/core/scale/time"
---

## 自动识别（推荐）

当数据字段为 `Date` 对象时，G2 自动使用 Time Scale，无需显式配置：

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({ container: 'container', width: 700, height: 400 });

chart.options({
  type: 'line',
  data: [
    { date: new Date('2024-01-01'), value: 100 },
    { date: new Date('2024-02-01'), value: 130 },
    { date: new Date('2024-03-01'), value: 110 },
    { date: new Date('2024-04-01'), value: 160 },
    { date: new Date('2024-05-01'), value: 145 },
  ],
  encode: { x: 'date', y: 'value' },   // Date 对象自动用 Time Scale
});

chart.render();
```

## 显式配置 Time Scale

```javascript
chart.options({
  type: 'line',
  data,
  encode: { x: 'date', y: 'value' },
  scale: {
    x: {
      type: 'time',               // 显式指定（字符串日期时需要）
      domain: [                   // 限制显示范围
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      ],
      nice: true,                  // 将域扩展到整洁的时间边界
    },
  },
});
```

## 格式化时间轴标签

```javascript
chart.options({
  type: 'line',
  data,
  encode: { x: 'date', y: 'value' },
  axis: {
    x: {
      // 使用 dayjs 格式字符串
      labelFormatter: 'YYYY-MM',           // 年-月：2024-01
      // labelFormatter: 'MM/DD',          // 月/日：01/15
      // labelFormatter: 'YYYY年MM月',     // 中文格式
      // labelFormatter: (d) => `Q${Math.ceil((d.getMonth()+1)/3)}`,  // 自定义
      tickCount: 6,
    },
  },
});
```

## 字符串日期需显式声明 type

```javascript
// 数据中日期是字符串格式
const data = [
  { date: '2024-01-01', value: 100 },
  { date: '2024-02-01', value: 130 },
];

chart.options({
  type: 'line',
  data,
  encode: { x: 'date', y: 'value' },
  scale: {
    x: { type: 'time' },   // 必须显式声明，否则被当作 ordinal scale
  },
});
```

## 常见错误与修正

### 错误 1：日期字符串未声明 time scale 导致排序错误
```javascript
// ❌ 错误：字符串日期不声明 type: 'time'，会被当作分类数据，顺序可能错乱
const data = [
  { date: '2024-03-01', value: 110 },
  { date: '2024-01-01', value: 100 },  // 数据无序
];
chart.options({ type: 'line', data, encode: { x: 'date', y: 'value' } });
// 结果：x 轴顺序是数据原始顺序，不按时间排序

// ✅ 方案 1：将字符串转为 Date 对象（推荐）
const processedData = data.map(d => ({ ...d, date: new Date(d.date) }));

// ✅ 方案 2：显式声明 time scale
chart.options({ scale: { x: { type: 'time' } } });
```
