---
id: "g2-mark-sunburst"
title: "G2 Sunburst Chart Mark"
description: |
  旭日图 Mark。使用 sunburst 标记展示多层级层次化数据，通过同心圆形式展示层级关系。
  适用于组织架构、文件系统、预算分配等场景。

library: "g2"
version: "5.x"
category: "marks"
tags:
  - "旭日图"
  - "sunburst"
  - "层次结构"
  - "多层级"

related:
  - "g2-mark-treemap"
  - "g2-mark-arc-pie"

use_cases:
  - "组织架构展示"
  - "文件系统分析"
  - "预算分配"

anti_patterns:
  - "层级过深（>4层）应使用矩形树图"
  - "类别过多不适合"

difficulty: "intermediate"
completeness: "full"
created: "2025-03-26"
updated: "2025-03-26"
author: "antv-team"
source_url: "https://g2.antv.antgroup.com/manual/core/mark/sunburst"
---

## 核心概念

旭日图通过同心圆展示多层级数据：
- 每个层级用一个环表示
- 环的内外半径表示层级深度
- 角度大小表示数值大小

**需要引入扩展：**
```javascript
import { plotlib } from '@antv/g2-extension-plot';
import { Runtime, corelib, extend } from '@antv/g2';

const Chart = extend(Runtime, { ...corelib(), ...plotlib() });
```

## 最小可运行示例

```javascript
import { plotlib } from '@antv/g2-extension-plot';
import { Runtime, corelib, extend } from '@antv/g2';

const Chart = extend(Runtime, { ...corelib(), ...plotlib() });

const chart = new Chart({
  container: 'container',
  theme: 'classic',
  autoFit: true,
});

chart.options({
  type: 'sunburst',
  data: {
    type: 'fetch',
    value: 'https://gw.alipayobjects.com/os/antvdemo/assets/data/sunburst.json',
  },
  encode: {
    value: 'sum',
  },
});

chart.render();
```

## 数据配置形式说明

**为什么 sunburst 使用 ` { value: data }` 或 ` { type: 'fetch', value: 'url' }` 而不是 `data`？**

层次数据是**对象**（包含 name/children），不是数组，必须使用完整形式：

```javascript
// ❌ 错误：层次数据不是数组，不能用简写
chart.options({
  type: 'sunburst',
  data: hierarchyData,  // ❌ 不工作
});

// ✅ 正确：层次数据必须用完整形式
chart.options({
  type: 'sunburst',
  data: { value: hierarchyData },  // ✅ 内联数据
});

// ✅ 正确：远程数据
chart.options({
  type: 'sunburst',
  data: { type: 'fetch', value: 'https://example.com/data.json' },
});
```

**简写形式仅适用于数组数据**（满足三个条件：内联、是数组、无 transform）。

---

## 常用变体

### 带标签

```javascript
chart.options({
  type: 'sunburst',
  data: { value: hierarchyData },
  encode: { value: 'sum' },
  labels: [
    {
      text: 'name',
      transform: [{ type: 'overflowHide' }],
    },
  ],
});
```

### 自定义颜色

```javascript
chart.options({
  type: 'sunburst',
  data: { value: hierarchyData },
  encode: {
    value: 'sum',
  },
});
```

### 带下钻交互

```javascript
chart.options({
  type: 'sunburst',
  data: { value: hierarchyData },
  encode: { value: 'sum' },
  interaction: {
    drillDown: {
      breadCrumb: {
        rootText: '起始',
      },
    },
  },
});
```

## 完整类型参考

```typescript
interface SunburstOptions {
  type: 'sunburst';
   { value: HierarchyData } | { type: 'fetch'; value: string };
  encode: {
    value: string;                          // 数值字段（字符串可用，有专项处理）
    color?: (d: HierarchyNode) => unknown;  // ⚠️ 颜色必须用回调，不能用字符串
  };
  labels?: Array<{
    text: string;
    transform?: Array<{ type: string }>;
  }>;
  interaction?: {
    drillDown?: {
      breadCrumb?: {
        rootText?: string;
      };
    };
  };
}
```

## 旭日图 vs 矩形树图

| 特性 | 旭日图 | 矩形树图 |
|------|--------|----------|
| 布局 | 圆形 | 矩形 |
| 空间利用 | 较低 | 较高 |
| 层级展示 | 同心圆 | 嵌套矩形 |
| 适用层级 | ≤4 层 | 更深层级 |

## 常见错误与修正

### 错误 1：未引入扩展

```javascript
// ❌ 问题：sunburst 需要扩展库
import { Chart } from '@antv/g2';

// ✅ 正确：引入 plotlib 扩展
import { plotlib } from '@antv/g2-extension-plot';
import { Runtime, corelib, extend } from '@antv/g2';
const Chart = extend(Runtime, { ...corelib(), ...plotlib() });
```

### 错误 2：层级过深

```javascript
// ⚠️ 注意：层级超过 4 层时，外层扇形过小
// 建议使用矩形树图替代
```

### 错误 3：数据格式错误

```javascript
// ❌ 问题：层次数据不能用简写形式
chart.options({
  type: 'sunburst',
   [{ name: 'A', value: 100 }],  // ❌ 数组格式，不是层次结构
});

// ✅ 正确：使用完整形式 + 层级嵌套结构
chart.options({
  type: 'sunburst',
   {
    value: {
      name: 'Root',
      children: [
        { name: 'A', value: 100 },
        { name: 'B', children: [...] }
      ]
    }
  },
  encode: { value: 'sum' },
});
```

---

## 节点数据访问规则（重要！）

层次结构图中，回调函数接收到的参数 `d` **不是原始数据对象**，而是 G2 用 d3-hierarchy 包装后的层次节点，**原始数据在 `d.data` 中**。

### 为什么 `encode.color: 'label'` 不起作用？

**根本原因**：当 encode 是字符串时，G2 内部做的是 `datum[fieldName]`，直接访问层次节点属性。层次节点上没有 `label` 属性，返回 `undefined`，导致所有扇形显示相同颜色。

```
d['label']        → undefined  ❌（层次节点没有 label 属性）
d.data['label']   → 'A类'      ✅（原始数据在 d.data 上）
```

**特例**：`encode.value: 'sum'` 字符串可以工作，因为 G2 对层次 mark 的 `value` 通道做了**专项处理**。其他通道（`color`、`shape` 等）无此特殊处理，必须用回调。

### 回调参数 d 的结构

```javascript
// d 是 d3-hierarchy 节点，结构如下：
{
  value: 100,              // 节点数值（d3 计算的子树总和）
  depth: 2,                // 层级深度（0 = 根节点）
  height: 0,               // 子树高度（叶子节点为 0）
   {                  // ← 原始数据在这里！
    name: '前端',
    sum: 120,
    label: 'A类',
    // ... 其它自定义字段
  },
  path: ['root', '技术', '前端'],
}
```

### encode 中访问字段

```javascript
// ❌ 错误：字符串字段名对 color 通道不起作用
encode: {
  value: 'sum',    // ✅ value 通道有专项处理
  color: 'label',  // ❌ d['label'] = undefined → 所有扇形颜色相同
}

// ✅ 正确：color 必须用回调函数
encode: {
  value: 'sum',
  color: (d) => d.data?.label,  // ✅
}
```

### 常用着色策略

```javascript
// 按第二层父节点着色（推荐，同门类同色）
color: (d) => d.path?.[1] || d.data?.name

// 按层级深度着色
color: (d) => d.depth

// 按自定义字段着色
color: (d) => d.data?.label
color: (d) => d.data?.category

// 按数值着色（连续色板）
color: (d) => d.value
```

### 错误 4：encode.color 使用字符串字段名导致所有扇形颜色相同

```javascript
// ❌ 错误：color: 'label' 等价于 d['label']，层次节点上没有此属性 → undefined
chart.options({
  type: 'sunburst',
  data: { value: data },
  encode: {
    value: 'sum',
    color: 'label',  // ❌ → 所有扇形相同颜色
  },
});

// ✅ 正确：color 必须用回调，通过 d.data 访问原始字段
chart.options({
  type: 'sunburst',
  data: { value: data },
  encode: {
    value: 'sum',
    color: (d) => d.path?.[1] || d.data?.name,  // ✅ 按父节点着色
  },
});
```