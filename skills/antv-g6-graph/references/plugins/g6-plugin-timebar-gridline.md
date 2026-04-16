---
id: "g6-plugin-timebar-gridline"
title: "G6 时间轴（timebar）与网格线（grid-line）"
description: |
  timebar：通过时间轴过滤或播放图数据的时序变化。
  grid-line：在画布背景绘制网格辅助线，支持跟随画布缩放平移。

library: "g6"
version: "5.x"
category: "plugins"
subcategory: "display"
tags:
  - "插件"
  - "时间轴"
  - "网格"
  - "timebar"
  - "grid-line"

related:
  - "g6-plugin-minimap"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 时间轴（timebar）

timebar 允许按时间范围过滤节点/边，或自动播放时序数据。

```javascript
import { Graph } from '@antv/g6';

// 节点/边数据中包含时间戳字段
const data = {
  nodes: [
     { id: 'n1', data: { label: 'A', timestamp: 1000 } },
     { id: 'n2', data: { label: 'B', timestamp: 2000 } },
     { id: 'n3', data: { label: 'C', timestamp: 3000 } },
     { id: 'n4', data: { label: 'D', timestamp: 4000 } },
  ],
  edges: [
     { source: 'n1', target: 'n2', data: { timestamp: 1500 } },
     { source: 'n2', target: 'n3', data: { timestamp: 2500 } },
     { source: 'n3', target: 'n4', data: { timestamp: 3500 } },
  ],
};

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data,
  node: {
    type: 'circle',
    style: {
      size: 40,
      fill: '#1783FF',
      stroke: '#fff',
      labelText: (d) => d.data.label,
    },
  },
  layout: { type: 'dagre', rankdir: 'LR' },
  behaviors: ['drag-canvas', 'zoom-canvas'],
  plugins: [
    {
      type: 'timebar',
      // 时间数据：等间隔刻度
       [1000, 1500, 2000, 2500, 3000, 3500, 4000],
      // 从数据中提取时间值的函数
      getTime: (datum) => datum.data.timestamp,
      // 初始显示时间范围
      values: [1000, 2500],
      // 作用的元素类型
      elementTypes: ['node', 'edge'],
      // 过滤模式
      mode: 'modify',          // 'modify'（修改可见性）| 'visibility'（display none）
      // 时间轴类型
      timebarType: 'time',     // 'time' | 'chart'（趋势折线图）
      // 位置
      position: 'bottom',      // 'bottom' | 'top'
      // 尺寸
      width: 600,
      height: 60,
      // 时间标签格式化
      labelFormatter: (t) => new Date(t).toLocaleDateString(),
      // 变化回调
      onChange: (values) => {
        console.log('时间范围:', values);
      },
    },
  ],
});

graph.render();
```

### timebar 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `number[] \| { time, value }[]` | — | **必填**，时间刻度数据 |
| `getTime` | `(datum) => number` | — | **必填**，从元素数据提取时间值 |
| `values` | `number \| [number, number]` | — | 初始时间范围 |
| `elementTypes` | `ElementType[]` | `['node']` | 过滤的元素类型 |
| `mode` | `'modify' \| 'visibility'` | `'modify'` | 过滤方式 |
| `timebarType` | `'time' \| 'chart'` | `'time'` | 时间轴样式类型 |
| `position` | `'bottom' \| 'top'` | `'bottom'` | 位置 |
| `width` | `number` | `450` | 宽度 |
| `height` | `number` | `60` | 高度 |
| `labelFormatter` | `(time) => string` | — | 时间标签格式化 |
| `loop` | `boolean` | `false` | 播放时循环 |

### timebar 播放控制 API

```javascript
const timebar = graph.getPluginInstance('timebar-key');
timebar.play();      // 自动播放
timebar.pause();     // 暂停
timebar.forward();   // 前进一帧
timebar.backward();  // 后退一帧
timebar.reset();     // 重置到起始
```

---

## 网格线（grid-line）

在画布背景绘制参考网格，辅助对齐和排版。

```javascript
plugins: [
  {
    type: 'grid-line',
    size: 20,                  // 网格单元格大小（px）
    stroke: '#0001',           // 网格线颜色（默认极淡）
    lineWidth: 1,
    // 是否随画布平移/缩放而跟随
    follow: {
      translate: true,         // 随平移跟随
      zoom: false,             // 不随缩放变化（保持像素尺寸）
    },
    // 边框
    border: true,
    borderStroke: '#e8e8e8',
    borderLineWidth: 1,
    borderStyle: 'solid',
  },
],
```

### grid-line 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `number` | `20` | 网格单元格大小（px） |
| `stroke` | `string` | `'#0001'` | 网格线颜色 |
| `lineWidth` | `number \| string` | `1` | 网格线宽度 |
| `follow` | `boolean \| { translate?, zoom? }` | `false` | 是否跟随画布变换 |
| `border` | `boolean` | `true` | 是否绘制边框 |
| `borderStroke` | `string` | `'#eee'` | 边框颜色 |
| `borderLineWidth` | `number` | `1` | 边框宽度 |

> **提示：** `follow: true` 等同于 `{ translate: true, zoom: true }`，网格会随画布缩放，
> 使网格始终覆盖可见区域且间距固定。`follow: false`（默认）网格固定在初始位置。
