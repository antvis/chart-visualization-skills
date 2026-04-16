---
id: "g6-plugin-background-snapline"
title: "G6 背景插件 + 对齐线插件（background / snapline）"
description: |
  background：为画布设置背景颜色、渐变或图片。
  snapline：拖拽节点时显示智能对齐参考线，支持自动吸附。

library: "g6"
version: "5.x"
category: "plugins"
subcategory: "visual"
tags:
  - "background"
  - "snapline"
  - "对齐线"
  - "背景"
  - "画布背景"
  - "吸附对齐"

related:
  - "g6-plugin-tooltip"
  - "g6-behavior-drag-element"

difficulty: "beginner"
completeness: "full"
created: "2026-04-16"
updated: "2026-04-16"
---

## 背景插件（background）

为图画布设置背景颜色、渐变或背景图片，支持所有 CSS 样式属性。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
   {
    nodes: [
      { id: 'n1',  { label: '节点1' } },
      { id: 'n2', data: { label: '节点2' } },
    ],
    edges: [{ source: 'n1', target: 'n2' }],
  },
  plugins: [
    {
      type: 'background',
      key: 'bg',
      backgroundColor: '#f0f2f5',   // 背景颜色
    },
  ],
});

graph.render();
```

### background 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `string` | `'background'` | 插件类型 |
| `key` | `string` | — | 唯一标识，用于 `graph.updatePlugin()` |
| `backgroundColor` | `string` | — | 背景颜色（CSS color） |
| `backgroundImage` | `string` | — | 背景图片（`'url(...)'`） |
| `backgroundSize` | `string` | `'cover'` | 背景尺寸（CSS background-size） |
| `backgroundRepeat` | `string` | — | 背景重复（CSS background-repeat） |
| `backgroundPosition` | `string` | — | 背景位置 |
| `opacity` | `string` | — | 背景透明度（0-1） |
| `transition` | `string` | `'background 0.5s'` | 过渡动画 |
| `zIndex` | `string` | `-1` | 层叠顺序，默认 -1 在其他元素之下 |
| `width` | `string` | `'100%'` | 背景宽度 |
| `height` | `string` | `'100%'` | 背景高度 |

> 注意：`zIndex` 默认 -1 确保背景在网格线等其他 DOM 插件之下。

### 常见背景样式

```javascript
// 纯色背景
{ type: 'background', backgroundColor: '#f0f2f5' }

// 渐变背景
{ type: 'background', background: 'linear-gradient(45deg, #1890ff, #722ed1)', opacity: '0.8' }

// 图片背景
{
  type: 'background',
  backgroundImage: 'url(https://example.com/bg.png)',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  opacity: '0.2',
}

// 暗色主题背景
{ type: 'background', backgroundColor: '#1a1a2e' }
```

### 动态更新背景

```javascript
const graph = new Graph({
  plugins: [{ type: 'background', key: 'bg', backgroundColor: '#f0f2f5' }],
});

// 动态切换背景
graph.updatePlugin({ key: 'bg', backgroundColor: '#e6f7ff', transition: 'background 1s ease' });
```

---

## 对齐线插件（snapline）

拖拽节点时自动显示水平/垂直对齐参考线，支持自动吸附，便于精确对齐。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
   {
    nodes: [
      { id: 'n1' },
      { id: 'n2' },
      { id: 'n3' },
    ],
    edges: [],
  },
  layout: { type: 'grid' },
  behaviors: ['drag-canvas', 'drag-element'],
  plugins: [
    {
      type: 'snapline',
      key: 'snapline',
      tolerance: 5,        // 触发对齐的距离阈值（px）
      offset: 20,          // 对齐线头尾延伸距离（px）
      autoSnap: true,      // 是否自动吸附到对齐位置
      verticalLineStyle: { stroke: '#1783FF', lineWidth: 1 },
      horizontalLineStyle: { stroke: '#1783FF', lineWidth: 1 },
    },
  ],
});

graph.render();
```

### snapline 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `string` | `'snapline'` | 插件类型 |
| `key` | `string` | — | 唯一标识 |
| `tolerance` | `number` | `5` | 触发对齐的距离阈值（px） |
| `offset` | `number` | `20` | 对齐线头尾延伸距离（px） |
| `autoSnap` | `boolean` | `true` | 是否自动吸附到对齐位置 |
| `shape` | `string \| Function` | `'key'` | 参照图形（`'key'` 为主图形） |
| `verticalLineStyle` | `LineStyle` | `{ stroke: '#1783FF' }` | 垂直对齐线样式 |
| `horizontalLineStyle` | `LineStyle` | `{ stroke: '#1783FF' }` | 水平对齐线样式 |
| `filter` | `(node) => boolean` | `() => true` | 过滤不参与对齐的节点 |

### 自定义对齐线样式

```javascript
plugins: [
  {
    type: 'snapline',
    tolerance: 8,
    autoSnap: false,     // 只显示线，不自动吸附
    verticalLineStyle: {
      stroke: '#F08F56',
      lineWidth: 2,
      lineDash: [4, 4],
    },
    horizontalLineStyle: {
      stroke: '#17C76F',
      lineWidth: 2,
      lineDash: [4, 4],
    },
    // 排除特定节点不参与对齐
    filter: (node) => node.id !== 'fixed-node',
  },
]
```

---

## 组合使用示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 500,
  data: {
    nodes: Array.from({ length: 9 }, (_, i) => ({ id: `n${i}` })),
    edges: [],
  },
  layout: { type: 'grid', cols: 3 },
  node: {
    type: 'rect',
    style: { size: [80, 40], fill: '#1783FF', stroke: '#fff', labelText: (d) => d.id },
  },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
  plugins: [
    {
      type: 'background',
      backgroundColor: '#f8f9fa',
    },
    {
      type: 'snapline',
      tolerance: 6,
      autoSnap: true,
      verticalLineStyle: { stroke: '#ff4d4f', lineWidth: 1 },
      horizontalLineStyle: { stroke: '#52c41a', lineWidth: 1 },
    },
  ],
});

graph.render();
```
