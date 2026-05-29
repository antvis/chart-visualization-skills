---
id: "x6-plugin-minimap"
title: "X6 MiniMap 小地图插件"
description: |
  MiniMap 插件在独立容器中显示画布的缩略视图，支持通过拖拽视口框快速导航，适合大画布场景。

library: "x6"
version: "3.x"
category: "plugins"
subcategory: "minimap"
tags:
  - "MiniMap"
  - "小地图"
  - "缩略图"
  - "导航"
  - "minimap"
  - "overview"

related:
  - "x6-plugins"
  - "x6-plugin-scroller"
  - "x6-core-graph-init"

use_cases:
  - "大画布全局预览"
  - "通过小地图快速导航"
  - "查看当前视口在全局的位置"

difficulty: "beginner"
completeness: "full"
---

## 基本用法

```javascript
import { Graph, MiniMap } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new MiniMap({
  enabled: true,
  container: document.getElementById('minimap'),
  width: 200,
  height: 160,
}));
```

**重要**：MiniMap 需要一个独立的 DOM 容器，不能与画布共用同一容器。

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `container` | HTMLElement | **必填** | 小地图的 DOM 容器 |
| `width` | number | `300` | 小地图宽度 |
| `height` | number | `200` | 小地图高度 |
| `padding` | number | `10` | 小地图内边距 |
| `scalable` | boolean | `true` | 是否可通过小地图缩放画布（拖拽视口框角落） |
| `minScale` | number | `0.01` | 最小缩放比例 |
| `maxScale` | number | `16` | 最大缩放比例 |
| `graphOptions` | object | `{}` | 传递给内部缩略 Graph 的配置 |
| `createGraph` | function | - | 自定义创建缩略 Graph 的方法 |

## 完整示例

```javascript
import { Graph, Scroller, MiniMap } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  background: { color: '#F2F7FA' },
  grid: { visible: true },
});

// Scroller 提供滚动能力
graph.use(new Scroller({ enabled: true, pannable: true }));

// MiniMap 提供全局预览
graph.use(new MiniMap({
  enabled: true,
  container: document.getElementById('minimap'),
  width: 200,
  height: 160,
  padding: 10,
  scalable: true,
}));

// 添加大量节点
for (let i = 0; i < 30; i++) {
  graph.addNode({
    x: Math.random() * 3000,
    y: Math.random() * 2000,
    width: 100,
    height: 50,
    label: `Node ${i + 1}`,
  });
}
```

## HTML 布局示例

小地图容器需要在 HTML 中提前准备：

```html
<div style="display: flex;">
  <!-- 画布容器 -->
  <div id="container" style="flex: 1; height: 600px;"></div>
  <!-- 小地图容器 -->
  <div id="minimap" style="width: 200px; height: 160px; border: 1px solid #ccc;"></div>
</div>
```

## 常见错误

### ❌ 未提供 container

```javascript
// 错误：缺少 container
graph.use(new MiniMap({
  enabled: true,
  width: 200,
  height: 160,
  // ❌ 缺少 container，小地图无处渲染
}));
```

```javascript
// 正确：提供独立 DOM 容器
graph.use(new MiniMap({
  enabled: true,
  container: document.getElementById('minimap'),  // ✅
  width: 200,
  height: 160,
}));
```

### ❌ container 与画布容器相同

```javascript
// 错误：小地图和画布不能用同一容器
const el = document.getElementById('container');
const graph = new Graph({ container: el });
graph.use(new MiniMap({ container: el }));  // ❌ 冲突
```

```javascript
// 正确：使用独立容器
const graph = new Graph({ container: document.getElementById('container') });
graph.use(new MiniMap({
  container: document.getElementById('minimap'),  // ✅ 独立容器
}));
```

### ❌ 在构造函数中配置 minimap

```javascript
// 错误：3.x 不支持
const graph = new Graph({
  container: 'container',
  minimap: { enabled: true, container: el },  // ❌
});
```

```javascript
// 正确
import { Graph, MiniMap } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new MiniMap({ enabled: true, container: el }));  // ✅
```
