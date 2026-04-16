---
id: "g6-plugin-minimap"
title: "G6 缩略图插件（Minimap）"
description: |
  使用 minimap 插件在画布角落显示全局缩略图，
  帮助用户在大图中快速导航定位。

library: "g6"
version: "5.x"
category: "plugins"
subcategory: "navigation"
tags:
  - "插件"
  - "缩略图"
  - "minimap"
  - "导航"
  - "大图"
  - "plugin"

related:
  - "g6-plugin-tooltip"
  - "g6-behavior-canvas-nav"

use_cases:
  - "大规模图的全局导航"
  - "需要快速定位特定区域"

anti_patterns:
  - "React 节点（html 类型）不支持 minimap 渲染"
  - "节点数量较少时 minimap 意义不大"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/plugin/minimap"
---

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 900,
  height: 600,
   data: { nodes: [...], edges: [...] },
  layout: { type: 'force' },
  behaviors: ['drag-canvas', 'zoom-canvas'],
  plugins: [
    {
      type: 'minimap',
      size: [200, 120],           // 缩略图大小 [宽, 高]
      position: 'right-bottom',   // 位置
    },
  ],
});

graph.render();
```

## 常用变体

### 完整配置

```javascript
plugins: [
  {
    type: 'minimap',
    // 尺寸
    size: [240, 160],
    // 位置：预设值或 [x, y] 坐标
    position: 'right-bottom',     // 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom'
    // 或自定义位置
    // position: [20, 20],        // [right, bottom] 距离
    // 缩略图渲染方式
    shape: 'key',                 // 'key'=简化渲染（性能好）| 'delegate'=代理渲染
    // 视口遮罩样式
    maskStyle: {
      fill: 'rgba(0, 0, 0, 0.1)',
      stroke: '#1783FF',
      lineWidth: 1,
    },
    // 容器样式
    containerStyle: {
      background: '#f5f5f5',
      border: '1px solid #d9d9d9',
      borderRadius: '4px',
    },
    // 内边距
    padding: 10,
    // 刷新延迟（ms）
    delay: 200,
  },
],
```

## 参数参考

```typescript
interface MinimapOptions {
  size?: [number, number];
  position?: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom' | [number, number];
  shape?: 'key' | 'delegate';
  maskStyle?: ShapeStyle;
  containerStyle?: CSSProperties;
  padding?: number;
  delay?: number;
  filter?: (id: string, elementType: string) => boolean;  // 过滤不显示的元素
}
```
