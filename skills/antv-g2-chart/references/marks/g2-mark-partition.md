---
id: "g2-mark-partition"
title: "G2 旭日图 / 矩形分区（partition）"
description: |
  partition mark 用矩形分区展示层次数据，每层从父节点延伸，子节点填满父节点宽度。
  配合极坐标可绘制旭日图（sunburst）——同心圆环形式的层次可视化。
  支持 drillDown 交互实现层次下钻。

library: "g2"
version: "5.x"
category: "marks"
tags:
  - "partition"
  - "旭日图"
  - "sunburst"
  - "层次数据"
  - "矩形分区"
  - "下钻"

related:
  - "g2-mark-treemap"
  - "g2-interaction-drilldown"
  - "g2-mark-pack"

use_cases:
  - "旭日图展示层次分类的占比（如文件目录）"
  - "组织结构的层次可视化"
  - "多层类别数据的占比展示"

difficulty: "intermediate"
completeness: "full"
created: "2025-03-24"
updated: "2025-03-24"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/examples/general/other/#sunburst"
---

## 最小可运行示例（旭日图）

```javascript
import { Chart } from '@antv/g2';

const data = {
  name: '总计',
  children: [
    {
      name: '技术',
      children: [
        { name: '前端', value: 15 },
        { name: '后端', value: 20 },
        { name: '算法', value: 10 },
      ],
    },
    {
      name: '产品',
      children: [
        { name: '产品经理', value: 8 },
        { name: '用研', value: 5 },
      ],
    },
    {
      name: '设计',
      children: [
        { name: 'UX', value: 7 },
        { name: '视觉', value: 6 },
      ],
    },
  ],
};

const chart = new Chart({ container: 'container', width: 600, height: 600 });

chart.options({
  type: 'sunburst',   // 旭日图 = partition + 极坐标（G2 内置别名）
  data: { value: data },
  encode: {
    value: 'value',   // 叶子节点数值
  },
  style: {
    fillOpacity: 0.9,
    lineWidth: 1,
    stroke: '#fff',
  },
  interaction: { drillDown: true },  // 可选：启用下钻
});

chart.render();
```

## 数据配置形式说明

**为什么 partition/sunburst 使用 ` { value: data }` 而不是 `data`？**

层次数据是**对象**（包含 name/children），不是数组，必须使用完整形式：

```javascript
// ❌ 错误：层次数据不是数组，不能用简写
chart.options({
  type: 'partition',
   hierarchyData,  // ❌ 不工作
});

// ✅ 正确：层次数据必须用完整形式
chart.options({
  type: 'partition',
  data: { value: hierarchyData },  // ✅
});
```

**简写形式仅适用于数组数据**（满足三个条件：内联、是数组、无 transform）。

---

## 矩形分区图（不加极坐标）

```javascript
chart.options({
  type: 'partition',   // 矩形分区（不是旭日图）
  data: { value: data },
  encode: {
    value: 'value',   // 叶子节点数值
  },
  layout: {
    valueField: 'value',   // 决定节点宽度的字段
    sort: (a, b) => b.value - a.value,  // 按值降序排列
  },
  style: {
    fillOpacity: 0.85,
    stroke: '#fff',
    lineWidth: 1,
  },
});
```

## 常见错误与修正

### 错误：data 直接传树形对象而不用 hierarchy 包装
```javascript
// ❌ 错误
chart.options({
  type: 'sunburst',
  data: treeData,   // ❌ 直接传树形数据
});

// ✅ 正确：需要放到 data.value 中
chart.options({
  type: 'sunburst',
  data: { value: treeData },  // ✅
});
```

---

## 节点数据访问规则（重要！）

层次结构图中，回调函数接收到的参数 `d` **不是原始数据对象**，而是 G2 用 d3-hierarchy 包装后的层次节点，**原始数据在 `d.data` 中**。

### 为什么 `encode.color: 'category'` 不起作用？

**根本原因**：当 encode 是字符串时，G2 内部做的是 `datum[fieldName]`，直接访问层次节点属性。层次节点上没有 `category` 属性，返回 `undefined`，导致所有区域显示相同颜色。

```
d['category']        → undefined   ❌（层次节点没有 category 属性）
d.data['category']   → '技术'      ✅（原始数据在 d.data 上）
```

**特例**：`encode.value: 'value'` 字符串可以工作，因为 G2 对层次 mark 的 `value` 通道做了**专项处理**。其他通道（`color`、`shape` 等）无此特殊处理，必须用回调。

### 回调参数 d 的结构

```javascript
// d 是 d3-hierarchy 节点，结构如下：
{
  value: 100,              // 节点数值（d3 计算的子树总和）
  depth: 2,                // 层级深度（0 = 根节点）
  height: 0,               // 子树高度（叶子节点为 0）
   {                  // ← 原始数据在这里！
    name: '前端',
    value: 15,
    category: '技术',
    // ... 其它自定义字段
  },
  path: ['root', '技术', '前端'],
}
```

### encode 中访问字段

```javascript
// ❌ 错误：字符串字段名对 color 通道不起作用
encode: {
  value: 'value',      // ✅ value 通道有专项处理
  color: 'category',   // ❌ d['category'] = undefined → 所有区域颜色相同
}

// ✅ 正确：color 必须用回调函数
encode: {
  value: 'value',
  color: (d) => d.data?.category,  // ✅
}
```

### 常用着色策略

```javascript
// 按第二层父节点着色（推荐，同门类同色）
color: (d) => d.path?.[1] || d.data?.name

// 按层级深度着色
color: (d) => d.depth

// 按自定义字段着色
color: (d) => d.data?.category
color: (d) => d.data?.type

// 按数值着色（连续色板）
color: (d) => d.value
```

### 错误 2：encode.color 使用字符串字段名导致所有区域颜色相同

```javascript
// ❌ 错误：color: 'category' 等价于 d['category']，层次节点上没有此属性 → undefined
chart.options({
  type: 'sunburst',
  data: { value: data },
  encode: {
    value: 'value',
    color: 'category',  // ❌ → 所有扇区相同颜色
  },
});

// ✅ 正确：color 必须用回调，通过 d.data 访问原始字段
chart.options({
  type: 'sunburst',
  data: { value: data },
  encode: {
    value: 'value',
    color: (d) => d.path?.[1] || d.data?.name,  // ✅ 按父节点着色
  },
});
```

### 错误 3：labels 中使用 d.name 导致 undefined

```javascript
// ❌ 错误：partition 节点的原始字段在 d.data 中，d.name 是 undefined
labels: [
  {
    text: (d) => d.name,  // ❌ d.name 是 undefined
  },
]

// ✅ 正确：通过 d.data 访问原始数据字段
labels: [
  {
    text: (d) => d.data?.name || '',  // ✅
  },
]
```

### 配合 scale 自定义颜色

```javascript
encode: {
  value: 'value',
  color: (d) => d.data?.category,
},
scale: {
  color: {
    type: 'sequential',
    palette: 'blues',
  },
}
```
