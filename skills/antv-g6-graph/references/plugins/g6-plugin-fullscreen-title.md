---
id: "g6-plugin-fullscreen-title"
title: "G6 全屏插件 + 标题插件（fullscreen / title）"
description: |
  fullscreen：将图可视化扩展到整个屏幕，支持快捷键触发和编程控制。
  title：为图添加主标题和副标题，支持自定义位置、字体和样式。

library: "g6"
version: "5.x"
category: "plugins"
subcategory: "ui"
tags:
  - "fullscreen"
  - "title"
  - "全屏"
  - "标题"
  - "图标题"
  - "沉浸式"

related:
  - "g6-plugin-contextmenu-toolbar"
  - "g6-plugin-history-legend"

difficulty: "beginner"
completeness: "full"
created: "2026-04-16"
updated: "2026-04-16"
---

## 标题插件（title）

为图画布添加主标题和副标题，支持自定义字体、颜色、对齐方式等样式。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
   {
    nodes: [
      { id: 'n1',  { label: '节点1' } },
      { id: 'n2',  { label: '节点2' } },
    ],
    edges: [{ source: 'n1', target: 'n2' }],
  },
  layout: { type: 'force' },
  behaviors: ['drag-canvas', 'zoom-canvas'],
  plugins: [
    {
      type: 'title',
      key: 'chart-title',
      title: '知识图谱',         // 主标题文字
      subtitle: '数据来源：内部系统', // 副标题文字
      align: 'left',           // 'left' | 'center' | 'right'
      size: 48,                // 标题区域高度（px），默认 44
      padding: [16, 24, 0, 24], // [top, right, bottom, left]
      spacing: 8,              // 主副标题间距（px）
    },
  ],
});

graph.render();
```

### title 配置参数

**容器配置：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `string` | `'title'` | 插件类型 |
| `key` | `string` | — | 唯一标识 |
| `title` | `string` | — | **必填**：主标题文字 |
| `subtitle` | `string` | — | 副标题文字 |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | 标题对齐方式 |
| `size` | `number` | `44` | 标题区域高度（px） |
| `padding` | `number \| number[]` | `[16,24,0,24]` | 内边距 |
| `spacing` | `number` | `8` | 主副标题间距 |

**主标题样式（titleXxx）：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `titleFontSize` | `number` | `16` | 字体大小 |
| `titleFontWeight` | `number` | `bold` | 字体粗细 |
| `titleFill` | `string` | `'#1D2129'` | 字体颜色 |
| `titleFillOpacity` | `number` | `0.9` | 字体透明度 |
| `titleFontFamily` | `string` | `'system-ui, sans-serif'` | 字体 |

**副标题样式（subtitleXxx）：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `subtitleFontSize` | `number` | `12` | 字体大小 |
| `subtitleFontWeight` | `number` | `normal` | 字体粗细 |
| `subtitleFill` | `string` | `'#1D2129'` | 字体颜色 |
| `subtitleFillOpacity` | `number` | `0.65` | 字体透明度 |

### 完整样式示例

```javascript
plugins: [
  {
    type: 'title',
    key: 'title',
    align: 'center',
    size: 60,
    spacing: 4,
    // 主标题
    title: '组织架构图',
    titleFontSize: 20,
    titleFontWeight: 600,
    titleFill: '#262626',
    // 副标题
    subtitle: '2026 Q1 · 共 120 人',
    subtitleFontSize: 13,
    subtitleFill: '#8c8c8c',
  },
]
```

### 动态更新标题

```javascript
graph.updatePlugin({ key: 'title', title: '新标题', subtitle: '更新时间：2026-04-16' });
```

---

## 全屏插件（fullscreen）

将图可视化扩展到全屏，支持快捷键触发或通过 API 编程控制，带有进入/退出回调。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: Array.from({ length: 20 }, (_, i) => ({ id: `n${i}` })),
  },
  layout: { type: 'force' },
  behaviors: ['drag-canvas', 'zoom-canvas'],
  plugins: [
    {
      type: 'fullscreen',
      key: 'fullscreen',
      autoFit: true,     // 全屏后自动适配画布尺寸
      trigger: {
        request: 'F',    // 按 F 进入全屏
        exit: 'Escape',  // 按 Esc 退出全屏
      },
      onEnter: () => console.log('进入全屏'),
      onExit: () => console.log('退出全屏'),
    },
  ],
});

graph.render();
```

### fullscreen 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `string` | `'fullscreen'` | 插件类型 |
| `key` | `string` | — | 唯一标识（编程控制时必填） |
| `autoFit` | `boolean` | `true` | 全屏后是否自动适配画布尺寸 |
| `trigger` | `{ request?: string; exit?: string }` | — | 触发键盘快捷键 |
| `onEnter` | `() => void` | — | 进入全屏的回调 |
| `onExit` | `() => void` | — | 退出全屏的回调 |

### 编程控制全屏

```javascript
const graph = new Graph({
  plugins: [{ type: 'fullscreen', key: 'fs' }],
});

// 通过 API 控制
const fsPlugin = graph.getPluginInstance('fs');
fsPlugin.request();  // 进入全屏
fsPlugin.exit();     // 退出全屏
```

### 配合工具栏使用

```javascript
plugins: [
  { type: 'fullscreen', key: 'fullscreen' },
  {
    type: 'toolbar',
    position: 'top-left',
    onClick: (item) => {
      const fs = graph.getPluginInstance('fullscreen');
      if (item === 'fullscreen') fs.request();
      if (item === 'exit-fullscreen') fs.exit();
    },
    getItems: () => [
      { id: 'fullscreen', value: 'fullscreen' },
      { id: 'exit-fullscreen', value: 'exit-fullscreen' },
    ],
  },
]
```

---

## 标题 + 全屏组合示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 900,
  height: 600,
  data: {
    nodes: Array.from({ length: 15 }, (_, i) => ({
      id: `n${i}`,
      data: { label: `节点${i}` },
    })),
    edges: Array.from({ length: 12 }, (_, i) => ({
      source: `n${i % 10}`,
      target: `n${(i + 3) % 15}`,
    })),
  },
  node: {
    style: {
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
    },
  },
  layout: { type: 'force', preventOverlap: true },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
  plugins: [
    {
      type: 'title',
      title: '关系网络图',
      subtitle: '基于力导向布局',
      align: 'center',
    },
    {
      type: 'fullscreen',
      key: 'fs',
      autoFit: true,
      trigger: { request: 'F', exit: 'Escape' },
    },
    {
      type: 'toolbar',
      position: 'top-right',
      onClick: (item) => {
        if (item === 'fullscreen') graph.getPluginInstance('fs').request();
      },
      getItems: () => [{ id: 'fullscreen', value: 'fullscreen' }],
    },
  ],
});

graph.render();
```
