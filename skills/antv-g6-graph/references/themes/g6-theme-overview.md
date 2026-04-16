---
id: "g6-theme-overview"
title: "G6 主题系统"
description: |
  G6 5.x 的主题系统，包含内置亮色/暗色主题的使用方法和动态切换。

library: "g6"
version: "5.x"
category: "themes"
subcategory: "overview"
tags:
  - "主题"
  - "theme"
  - "dark"
  - "light"
  - "暗色"
  - "亮色"

related:
  - "g6-state-overview"
  - "g6-core-graph-init"

use_cases:
  - "支持明暗两种模式的图可视化"
  - "统一图的视觉风格"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/theme/overview"
---

## 核心概念

G6 v5 主题是 Graph Options 的子集，包含：
- 背景色（`background`）
- 节点默认样式（`node`）
- 边默认样式（`edge`）
- Combo 默认样式（`combo`）

每个部分都包含：基础样式、调色板、状态样式、动画配置。

**重要限制：** 主题中只支持静态值，不支持回调函数。

## 使用内置主题

```javascript
import { Graph } from '@antv/g6';

// 亮色主题（默认）
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: { nodes: [...], edges: [...] },
  theme: 'light',               // 默认值
  layout: { type: 'force' },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

// 暗色主题
const graphDark = new Graph({
  container: 'container-dark',
  theme: 'dark',
  // ...
});

graph.render();
```

## 动态切换主题

```javascript
// 初始化
const graph = new Graph({
  container: 'container',
  theme: 'light',
  // ...
});
await graph.render();

// 切换主题
document.getElementById('theme-toggle').addEventListener('click', async () => {
  const currentTheme = graph.getTheme();
  await graph.setTheme(currentTheme === 'light' ? 'dark' : 'light');
  await graph.render();
});
```

## 调色板（Palette）

主题中的调色板用于按分类字段自动分配颜色：

```javascript
node: {
  // 使用调色板自动按类别着色
  palette: {
    type: 'group',        // 'group'=按分类 | 'value'=按数值连续映射
    field: 'category',    // 数据中的字段名
    color: 'tableau10',   // 内置色板名
    // 可选：自定义颜色列表
    // color: ['#ff4d4f', '#1783FF', '#52c41a', '#fa8c16'],
  },
},
```

**内置色板：** `tableau10`、`spectral`、`blues`、`greens`、`oranges`、`reds`、`purples`

## 常见组合

### 暗色主题 + 力导向图

```javascript
const graph = new Graph({
  container: 'container',
  width: 900,
  height: 600,
  theme: 'dark',
    { nodes: [...], edges: [...] },
  node: {
    style: {
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
    },
    palette: {
      type: 'group',
      field: 'type',
      color: 'tableau10',
    },
  },
  layout: { type: 'force', preventOverlap: true },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element-force', 'hover-activate'],
});
```
