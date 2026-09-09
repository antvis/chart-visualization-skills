---
id: "g2-theme-builtin"
title: "G2 内置主题配置"
description: |
  G2 v5 内置 classic、classicDark、light、dark、academy 五种主题。
  通过 theme 字段或 Chart 构造函数中的 theme 参数全局切换，也可局部覆盖样式变量。
library: "g2"
version: "5.x"
category: "themes"
tags:
  - "theme"
  - "主题"
  - "dark"
  - "深色主题"
  - "classicDark"
  - "spec"
related:
  - "g2-design-default-aesthetics"
  - "g2-core-chart-init"
  - "g2-mark-interval-basic"
use_cases:
  - "切换图表整体配色风格"
  - "适配深色模式（Dark Mode）"
  - "统一多图表的视觉风格"
---


## 内置主题列表

| 主题名 | 说明 |
|--------|------|
| `'classic'` | 稳定的经典浅色预设，适合作为嵌入式图表的显式视觉基线 |
| `'classicDark'` | 深色主题（深色背景，明亮配色） |
| `'light'` | 引擎默认主题 |
| `'dark'` | 内置深色主题 |
| `'academy'` | 学术风主题（灰色调，适合论文/报告） |

> `classic` 不是运行时默认值；G2 未传入 theme 时会推断为 `light`。需要跨页面保持一致外观时，应显式指定主题。

## 基本用法（切换主题）

```javascript
import { Chart } from '@antv/g2';

// 方式 1：构造函数中指定
const chart = new Chart({
  container: 'container',
  width: 640,
  height: 480,
  theme: 'classicDark',    // 深色主题
});

chart.options({
  type: 'interval',
  data: [
    { genre: 'Sports',   sold: 275 },
    { genre: 'Strategy', sold: 115 },
    { genre: 'Action',   sold: 120 },
  ],
  encode: { x: 'genre', y: 'sold', color: 'genre' },
});

chart.render();
```

```javascript
// 方式 2：options 中指定
const chart = new Chart({ container: 'container', width: 640, height: 480 });

chart.options({
  type: 'interval',
  data,
  encode: { x: 'genre', y: 'sold', color: 'genre' },
  theme: 'academy',        // 学术主题
});

chart.render();
```

## 深色主题示例

```javascript
const chart = new Chart({
  container: 'container',
  width: 700,
  height: 400,
  theme: 'classicDark',
});

chart.options({
  type: 'view',
  data,
  encode: { x: 'month', y: 'value' },
  children: [
    {
      type: 'area',
      style: { fillOpacity: 0.3 },
    },
    {
      type: 'line',
      style: { lineWidth: 2 },
    },
  ],
});

chart.render();
```

## 运行时切换主题

```javascript
const chart = new Chart({ container: 'container', width: 640, height: 480 });

chart.options({ type: 'interval', data, encode: { x: 'x', y: 'y' } });
chart.render();

// 通过 options 更新主题，再重新渲染。
// Chart 没有已验证的 chart.theme() 快捷 API。
chart.options({ theme: 'classicDark' });
chart.render();
```

## 局部覆盖主题变量

```javascript
chart.options({
  type: 'interval',
  data,
  encode: { x: 'genre', y: 'sold' },
  theme: {
    defaultColor: '#ff6b35',         // 默认颜色（第一个系列的颜色）
    defaultStrokeColor: '#333',      // 默认边框色
    // 覆盖色板
    colors10: [
      '#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#1a936f',
      '#88d498', '#c6dabf', '#eaf4d3', '#7b2d8b', '#ff3a5c',
    ],
  },
});
```

## 自定义主题注册

```javascript
import { Chart, register } from '@antv/g2';

// 注册自定义主题
register('theme.myTheme', {
  defaultColor: '#e63946',
  background: '#f8f9fa',
  colors10: ['#e63946', '#457b9d', '#1d3557', '#a8dadc', '#f1faee'],
  // ... 其他变量
});

const chart = new Chart({ container: 'container', width: 640, height: 480 });

chart.options({
  type: 'interval',
  data,
  encode: { x: 'genre', y: 'sold', color: 'genre' },
  theme: 'myTheme',   // 使用自定义主题
});

chart.render();
```

## 常见错误与修正

### 错误：theme 传入了非字符串/对象类型
```javascript
// ❌ 错误：theme 值不存在
chart.options({ theme: 'midnightBlue' });

// ✅ 正确：使用内置主题名
chart.options({ theme: 'classicDark' });   // 深色主题
chart.options({ theme: 'dark' });          // 也是内置深色主题
chart.options({ theme: 'classic' });       // 显式经典浅色主题
chart.options({ theme: 'light' });         // 引擎默认主题
chart.options({ theme: 'academy' });       // 学术主题
```

### 错误：切换主题后忘记重新渲染
```javascript
// ❌ 错误：更新主题后没有重新渲染
chart.options({ theme: 'classicDark' });
// 图表没有变化！

// ✅ 正确：切换后需调用 render()
chart.options({ theme: 'classicDark' });
chart.render();
```
