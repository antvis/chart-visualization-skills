---
id: "g2-data-kde"
title: "G2 KDE 核密度估计"
description: |
  KDE（Kernel Density Estimation）数据变换对数据进行核密度估计，
  生成概率密度函数数据，用于密度图、小提琴图等可视化。
  配置在 data.transform 中。

library: "g2"
version: "5.x"
category: "data"
tags:
  - "kde"
  - "核密度估计"
  - "密度图"
  - "小提琴图"
  - "数据变换"
  - "data transform"

related:
  - "g2-mark-density"
  - "g2-mark-boxplot"

use_cases:
  - "密度图（Density Plot）"
  - "小提琴图（Violin Plot）"
  - "多组数据分布比较"

difficulty: "advanced"
completeness: "full"
created: "2025-03-27"
updated: "2025-03-27"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/manual/core/data/kde"
---

## 核心概念

**KDE 是数据变换（Data Transform），不是标记变换（Mark Transform）**

- 数据变换配置在 `data.transform` 中
- 核密度估计是一种非参数统计方法，估计随机变量的概率密度函数
- 底层使用 [pdfast](https://www.npmjs.com/package/pdfast) 库

**输出**：处理后数据增加两个字段（默认 `y` 和 `size`），均为数组类型。

**⚠️ 关键：`field` 是输入，`as` 是输出，encode 必须用输出字段名**

```
kde: field='value' → 输出 as=['y','size'] → encode: { y: 'y', size: 'size' }
                      ↑ 不管 field 叫什么，encode 始终用 as 的值
```

## 最小可运行示例

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({ container: 'container', width: 700, height: 400 });

chart.options({
  type: 'density',
  data: {
    type: 'fetch',
    value: 'https://assets.antv.antgroup.com/g2/species.json',
    transform: [
      {
        type: 'kde',
        field: 'y',              // 进行 KDE 的字段
        groupBy: ['x', 'species'], // 分组字段
        size: 20,                // 生成数据点数量
      },
    ],
  },
  encode: {
    x: 'x',
    y: 'y',
    color: 'species',
    size: 'size',
  },
  tooltip: false,
});

chart.render();
```

## 配置项

| 属性    | 描述                                           | 类型               | 默认值          | 必选 |
| ------- | ---------------------------------------------- | ------------------ | --------------- | ---- |
| field   | 进行核密度算法的数据字段                       | `string`           | -               | ✓    |
| groupBy | 对数据进行分组的分组字段，可以指定多个         | `string[]`         | -               | ✓    |
| as      | 进行 KDE 处理之后，存储的字段                  | `[string, string]` | `['y', 'size']` | 否   |
| min     | 指定处理范围的最小值                           | `number`           | 数据最小值      | 否   |
| max     | 指定处理范围的最大值                           | `number`           | 数据最大值      | 否   |
| size    | 算法最终生成数据的条数，值越大密度曲线越精细   | `number`           | `10`            | 否   |
| width   | 确定一个元素左右影响多少点，值越大曲线越平滑   | `number`           | `2`             | 否   |

## 小提琴图

```javascript
chart.options({
  type: 'view',
  data: { type: 'fetch', value: 'https://assets.antv.antgroup.com/g2/species.json' },
  children: [
    {
      type: 'density',
      data: {
        transform: [
          { type: 'kde', field: 'y', groupBy: ['x', 'species'] },
        ],
      },
      encode: { x: 'x', y: 'y', series: 'species', color: 'species', size: 'size' },
      tooltip: false,
    },
    {
      type: 'boxplot',
      encode: { x: 'x', y: 'y', series: 'species', color: 'species', shape: 'violin' },
      style: { opacity: 0.5, strokeOpacity: 0.5, point: false },
    },
  ],
});
```

## 自定义参数

```javascript
chart.options({
  type: 'density',
  data: {
    transform: [
      {
        type: 'kde',
        field: 'y',
        groupBy: ['x'],
        size: 30,             // 更精细的密度曲线
        width: 3,             // 更平滑
        min: 0,               // 最小值
        max: 8,               // 最大值
        as: ['density_x', 'density_y'],  // 自定义输出字段名
      },
    ],
  },
  encode: { x: 'x', y: 'density_x', size: 'density_y' },
});
```

## 常见错误与修正

### 错误 1：kde 放在 mark transform 中

```javascript
// ❌ 错误：kde 是数据变换，不能放在 mark 的 transform 中
chart.options({
  type: 'density',
  data,
  transform: [{ type: 'kde', field: 'y' }],  // ❌ 错误位置
});

// ✅ 正确：kde 放在 data.transform 中
chart.options({
  type: 'density',
  data: {
    type: 'fetch',
    value: dataUrl,
    transform: [{ type: 'kde', field: 'y', groupBy: ['x'] }],  // ✅ 正确
  },
});
```

### 错误 2：缺少 groupBy

```javascript
// ❌ 错误：groupBy 是必选参数
data: {
  transform: [{ type: 'kde', field: 'y' }],  // 缺少 groupBy
}

// ✅ 正确：指定 groupBy
data: {
  transform: [{ type: 'kde', field: 'y', groupBy: ['category'] }],
}
```

### 错误 3：数据零方差或单点导致 KDE 退化（静默空白）

KDE 底层（pdfast 库）要求 `min < max`。当某分组所有值相同（方差=0）或只有 1 个数据点时，KDE 产生 NaN，该组不渲染。

```javascript
// ❌ 问题：零方差数据
const data = [
  { group: 'A', value: 10 },           // 只有 1 个点
  { group: 'B', value: 20 },
  { group: 'B', value: 20 },           // 全部相同，min=max=20
  { group: 'B', value: 20 },
];
// KDE groupBy: ['group'] 对 B 组处理时，min=max=20，产生 NaN → 不渲染

// ✅ 解决方案1：手动设置 min/max 保证区间非零
transform: [{
  type: 'kde',
  field: 'value',
  groupBy: ['group'],
  min: 0,    // 手动指定，确保 min ≠ max
  max: 100,
}]

// ✅ 解决方案2：数据不足时换图表类型
// KDE 建议每组至少 5-10 个不同值才能产生有意义的密度曲线
// 单点或全同值 → 改用散点图 / 箱线图
```

### 错误 4：encode 字段与 as 不匹配

```javascript
// ❌ 错误：使用默认 as 但 encode 用了其他字段名
data: {
  transform: [{ type: 'kde', field: 'y', groupBy: ['x'] }],  // 默认 as: ['y', 'size']
}
encode: { y: 'density', size: 'density_size' },  // ❌ 字段名不匹配

// ✅ 正确：使用正确的字段名
encode: { y: 'y', size: 'size' },  // ✅ 使用默认输出字段

// 或自定义 as
 {
  transform: [{ type: 'kde', field: 'y', groupBy: ['x'], as: ['density', 'density_size'] }],
},
encode: { y: 'density', size: 'density_size' },  // ✅ 匹配自定义字段
```