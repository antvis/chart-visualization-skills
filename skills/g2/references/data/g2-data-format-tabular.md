---
id: "g2-data-format-tabular"
title: "G2 表格数据格式规范"
description: |
  G2 使用对象数组（Array of Objects）格式的表格数据。
  涵盖标准格式要求、宽表/长表区别、常见后端数据转换方法、
  以及数据预处理技巧（日期转换、缺失值处理）。

library: "g2"
version: "5.x"
category: "data"
tags:
  - "表格数据"
  - "tabular data"
  - "数据格式"
  - "数组对象"
  - "宽表"
  - "长表"
  - "数据转换"
  - "G2数据"

related:
  - "g2-core-chart-init"
  - "g2-data-fold"
  - "g2-data-transform-patterns"

use_cases:
  - "将后端 API 数据转换为 G2 格式"
  - "理解 G2 数据结构要求"
  - "处理日期字段和缺失值"

difficulty: "beginner"
completeness: "full"
created: "2024-01-01"
updated: "2025-03-01"
author: "antv-team"
---

## G2 标准数据格式

G2 接受**对象数组**格式：每一行是一个对象，字段名统一，类型一致。

```javascript
// ✅ 标准格式（对象数组）
const data = [
  { month: 'Jan', product: 'A', sales: 120, date: new Date('2024-01-01') },
  { month: 'Feb', product: 'A', sales: 145, date: new Date('2024-02-01') },
  { month: 'Jan', product: 'B', sales: 95,  date: new Date('2024-01-01') },
  { month: 'Feb', product: 'B', sales: 108, date: new Date('2024-02-01') },
];

chart.options({
  type: 'line',
  data,
  encode: { x: 'month', y: 'sales', color: 'product' },
});
```

## 字段类型规范

| 字段类型 | G2 处理方式 | 注意事项 |
|---------|-----------|---------|
| `string` | 分类数据，自动用 Band Scale / Ordinal Scale | 顺序按数据出现顺序 |
| `number` | 数值数据，自动用 Linear Scale | 确保无 `null`/`undefined`（会导致比例尺计算错误） |
| `Date` 对象 | 时间数据，自动用 Time Scale | 推荐直接传 Date 对象 |
| `string`（日期格式）| 默认当分类处理 | 需显式声明 `scale: { x: { type: 'time' } }` |
| `boolean` | 当分类处理 | `true/false` 会被转为字符串 |

## 宽表 vs 长表

### 宽表（Wide Format）

每一行代表一个主体，多个指标列并排：

```javascript
// 宽表：一行是一个月份，三个指标列
const wideData = [
  { month: 'Jan', productA: 120, productB: 95,  productC: 80 },
  { month: 'Feb', productA: 145, productB: 108, productC: 92 },
  { month: 'Mar', productA: 132, productB: 121, productC: 98 },
];
```

**宽表的问题**：无法直接用 `encode.color: 'product'`，因为没有 product 字段。

### 长表（Long Format / Tidy Data）

每一行代表一个观测值，有分类字段区分：

```javascript
// 长表：每行一个数据点，product 是分类字段
const longData = [
  { month: 'Jan', product: 'A', sales: 120 },
  { month: 'Jan', product: 'B', sales: 95  },
  { month: 'Jan', product: 'C', sales: 80  },
  { month: 'Feb', product: 'A', sales: 145 },
  { month: 'Feb', product: 'B', sales: 108 },
  { month: 'Feb', product: 'C', sales: 92  },
];

// 长表可以直接用 color 通道区分系列
chart.options({
  type: 'line',
  data: longData,
  encode: { x: 'month', y: 'sales', color: 'product' },
});
```

### 宽表转长表（G2 内置 fold transform）

```javascript
chart.options({
  type: 'line',
  data: wideData,    // 传入宽表
  transform: [
    {
      type: 'fold',
      fields: ['productA', 'productB', 'productC'],  // 要折叠的列
      key: 'product',    // 新的分类字段名
      value: 'sales',    // 新的数值字段名
    },
  ],
  encode: { x: 'month', y: 'sales', color: 'product' },   // 使用新字段名
});
```

## 常见后端数据转换

### API 返回嵌套对象

```javascript
// 后端返回
const apiData = {
  Jan: { productA: 120, productB: 95 },
  Feb: { productA: 145, productB: 108 },
};

// 转为 G2 长表格式
const data = Object.entries(apiData).flatMap(([month, products]) =>
  Object.entries(products).map(([product, sales]) => ({
    month,
    product,
    sales,
  }))
);
// 结果：
// [{ month: 'Jan', product: 'productA', sales: 120 }, ...]
```

### API 返回数组 + 字段映射表

```javascript
// 后端返回数组，字段名不直观
const apiData = [
  { dt: '2024-01', p: 'A', v: 120 },
  { dt: '2024-02', p: 'A', v: 145 },
];

// 重命名字段
const data = apiData.map(d => ({
  month: d.dt,
  product: d.p,
  sales: d.v,
}));
```

### CSV 数据处理

```javascript
// CSV 解析后默认所有字段都是字符串，需要转换数值字段
const csvData = [
  { month: 'Jan', sales: '120', growth: '12.5' },  // 字符串
];

const data = csvData.map(d => ({
  month: d.month,
  sales: Number(d.sales),        // 转为数值
  growth: parseFloat(d.growth),  // 转为浮点数
}));
```

## 日期字段处理

```javascript
// 后端常见日期格式 → G2 推荐格式
const data = rawData.map(d => ({
  ...d,
  // 方案 1：转为 Date 对象（G2 自动识别为 Time Scale）
  date: new Date(d.dateStr),

  // 方案 2：保持字符串，但配置 scale
  // date: d.dateStr,   // '2024-01-15' 字符串
}));

// 字符串日期需显式配置
chart.options({
  scale: { x: { type: 'time' } },
});
```

## 缺失值处理

```javascript
// G2 中 null/undefined 值的处理方式
const dataWithNulls = [
  { month: 'Jan', value: 100 },
  { month: 'Feb', value: null },    // 缺失值
  { month: 'Mar', value: 130 },
];

// 折线图：null 会导致折线断开
// 方案 1：用 0 填充（视业务情况）
const filledData = dataWithNulls.map(d => ({
  ...d,
  value: d.value ?? 0,
}));

// 方案 2：移除缺失值行
const cleanData = dataWithNulls.filter(d => d.value != null);

// 方案 3：用前值填充（向前插值）
const interpolatedData = dataWithNulls.map((d, i, arr) => ({
  ...d,
  value: d.value ?? (arr.slice(0, i).reverse().find(x => x.value != null)?.value ?? 0),
}));
```

## 大数据量处理

```javascript
// 前端聚合：数据量 > 10000 时，直接渲染会很慢
// 推荐在传给 G2 前先聚合

// 按月聚合日数据
function aggregateByMonth(data) {
  const grouped = {};
  data.forEach(d => {
    const month = d.date.slice(0, 7);   // 'YYYY-MM'
    if (!grouped[month]) grouped[month] = { month, total: 0, count: 0 };
    grouped[month].total += d.value;
    grouped[month].count += 1;
  });
  return Object.values(grouped).map(g => ({
    month: g.month,
    value: g.total / g.count,   // 月均值
  }));
}

chart.options({
   aggregateByMonth(rawData),   // 传入聚合后的数据（可能从 10000 行降到 12 行）
});
```

## 常见错误与修正

### 错误 1：字段值类型不一致

```javascript
// ❌ 同一字段混合类型，比例尺计算错误
const data = [
  { month: 1, value: 100 },    // month 是数字
  { month: 'Feb', value: 120 },// month 是字符串 ← 类型不一致！
];

// ✅ 统一字段类型
const data = [
  { month: 'Jan', value: 100 },
  { month: 'Feb', value: 120 },
];
```

### 错误 2：数值字段包含字符串

```javascript
// ❌ 数值字段是字符串，G2 当作分类处理
const data = [{ category: 'A', value: '100' }];   // '100' 是字符串

// ✅ 确保数值字段是 number 类型
const data = rawData.map(d => ({ ...d, value: Number(d.value) }));
```
