---
id: "g6-plugin-fisheye-hull-watermark"
title: "G6 鱼眼放大（fisheye）、轮廓包围（hull）与水印（watermark）"
description: |
  fisheye：鼠标位置的焦点+上下文放大镜效果。
  hull：对一组节点绘制包围轮廓（凸包/凹包）。
  watermark：在画布上添加文字或图片水印。

library: "g6"
version: "5.x"
category: "plugins"
subcategory: "display"
tags:
  - "插件"
  - "鱼眼"
  - "轮廓"
  - "水印"
  - "fisheye"
  - "hull"
  - "watermark"

related:
  - "g6-plugin-minimap"
  - "g6-plugin-tooltip"

difficulty: "advanced"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 鱼眼放大（fisheye）

鱼眼镜头在鼠标附近放大局部区域，同时保持全局上下文可见。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: Array.from({ length: 50 }, (_, i) => ({
      id: `n${i}`,
           { label: `N${i}` },
    })),
    edges: Array.from({ length: 60 }, (_, i) => ({
      source: `n${i % 25}`,
      target: `n${(i * 3 + 7) % 50}`,
    })),
  },
  node: {
    type: 'circle',
    style: {
      size: 20,
      fill: '#1783FF',
      stroke: '#fff',
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
      labelFontSize: 10,
    },
  },
  layout: { type: 'force', preventOverlap: true, nodeSize: 20 },
  behaviors: ['drag-canvas', 'zoom-canvas'],
  plugins: [
    {
      type: 'fisheye',
      trigger: 'pointermove',        // 'pointermove' | 'drag' | 'click'
      r: 120,                        // 鱼眼镜头半径（px）
      d: 1.5,                        // 放大畸变系数（值越大放大越强）
      // 通过滚轮调整半径
      scaleRBy: 'wheel',
      // 镜头样式
      style: {
        fill: 'rgba(255,255,255,0.1)',
        stroke: '#1783FF',
        lineWidth: 1,
      },
      // 放大区域内节点样式覆盖
      nodeStyle: {
        labelFontSize: 14,
        labelFontWeight: 'bold',
      },
    },
  ],
});

graph.render();
```

### fisheye 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `trigger` | `string` | `'pointermove'` | 触发移动鱼眼的事件 |
| `r` | `number` | `120` | 镜头半径（px） |
| `d` | `number` | `1.5` | 畸变系数，越大放大倍数越高 |
| `scaleRBy` | `'wheel' \| 'drag'` | — | 滚轮/拖拽调整半径 |
| `scaleDBy` | `'wheel' \| 'drag'` | — | 滚轮/拖拽调整畸变 |
| `style` | `Partial<CircleStyleProps>` | — | 镜头外观样式 |
| `nodeStyle` | `NodeStyle \| ((d) => NodeStyle)` | — | 放大区域内节点样式 |

---

## 轮廓包围（hull）

对指定节点集合绘制凸包或凹包轮廓，适合分组可视化。

```javascript
plugins: [
  {
    type: 'hull',
    // 定义一个或多个 hull
    hulls: [
      {
        id: 'hull-team-a',
        members: ['n1', 'n2', 'n3'],   // 节点 id 列表
        type: 'smooth-convex',          // 'convex' | 'smooth-convex' | 'concave'
        padding: 20,                    // 轮廓外扩距离
        style: {
          fill: 'rgba(23, 131, 255, 0.1)',
          stroke: '#1783FF',
          lineWidth: 2,
        },
        labelText: '团队A',
        labelPlacement: 'top',
      },
      {
        id: 'hull-team-b',
        members: ['n4', 'n5', 'n6'],
        type: 'smooth-convex',
        padding: 20,
        style: {
          fill: 'rgba(82, 196, 26, 0.1)',
          stroke: '#52c41a',
          lineWidth: 2,
        },
        labelText: '团队B',
      },
    ],
  },
],
```

### hull 类型说明

| 类型 | 说明 |
|------|------|
| `convex` | 最小凸包，贴合边界 |
| `smooth-convex` | 平滑凸包（默认，推荐） |
| `concave` | 凹包，可绕过内部空洞 |

---

## 水印（watermark）

```javascript
plugins: [
  // 文字水印
  {
    type: 'watermark',
    text: '内部文件 · 禁止外传',
    textFill: '#ccc',
    textFontSize: 14,
    textFontFamily: 'Arial',
    opacity: 0.3,
    rotate: -Math.PI / 6,   // 旋转角度（弧度）
    width: 200,
    height: 100,
  },
  // 图片水印（两者二选一）
  // {
  //   type: 'watermark',
  //   imageURL: 'https://example.com/logo.png',
  //   width: 120,
  //   height: 40,
  //   opacity: 0.15,
  // },
],
```

### watermark 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `text` | `string` | — | 文字水印内容（与 `imageURL` 二选一） |
| `imageURL` | `string` | — | 图片水印 URL |
| `textFill` | `string` | `'#000'` | 文字颜色 |
| `textFontSize` | `number` | `14` | 字体大小 |
| `opacity` | `number` | `0.2` | 水印透明度 |
| `rotate` | `number` | `Math.PI/12` | 旋转角度（弧度） |
| `width` | `number` | `200` | 单个水印宽度 |
| `height` | `number` | `100` | 单个水印高度 |
