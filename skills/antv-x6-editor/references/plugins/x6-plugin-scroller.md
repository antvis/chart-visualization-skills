---
id: "x6-plugin-scroller"
title: "X6 Scroller 滚动画布插件"
description: |
  Scroller 插件将画布嵌入一个可滚动的容器中，支持画布平移（Pan）、无限滚动、分页显示等能力。

library: "x6"
version: "3.x"
category: "plugins"
subcategory: "scroller"
tags:
  - "Scroller"
  - "滚动"
  - "平移"
  - "pan"
  - "scroll"
  - "画布平移"
  - "无限画布"

related:
  - "x6-plugins"
  - "x6-plugin-minimap"
  - "x6-core-graph-init"

use_cases:
  - "大画布滚动浏览"
  - "画布拖拽平移"
  - "显示分页边界"
  - "画布内容居中"
  - "缩放画布到适合大小"

difficulty: "intermediate"
completeness: "full"
---

## 基本用法

```javascript
import { Graph, Scroller } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new Scroller({
  enabled: true,
  pannable: true,  // 画布可拖拽平移
}));
```

**注意**：使用 Scroller 插件后，画布容器会被包裹在一个滚动容器中。Graph 的 `container` 不再是最外层容器，`scroller.container` 才是。

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | boolean | `true` | 是否启用滚动 |
| `pannable` | boolean \| object | `false` | 是否可拖拽平移。对象形式：`{ enabled: true, eventTypes: ['leftMouseDown'] }` |
| `modifiers` | string \| string[] | - | 平移修饰键，如 `'ctrl'`、`['ctrl', 'meta']` |
| `className` | string | - | 自定义滚动容器 CSS 类名 |
| `width` | number | - | 滚动容器宽度（默认与画布容器同宽） |
| `height` | number | - | 滚动容器高度（默认与画布容器同高） |
| `pageVisible` | boolean | `false` | 是否显示分页边界 |
| `pageBreak` | boolean | `false` | 是否显示分页断点 |
| `pageWidth` | number | - | 分页宽度 |
| `pageHeight` | number | - | 分页高度 |
| `padding` | number \| object | - | 画布四周的额外滚动区域 |
| `autoResize` | boolean | `true` | 容器尺寸变化时自动调整 |

### pannable 对象配置

```javascript
graph.use(new Scroller({
  enabled: true,
  pannable: {
    enabled: true,
    eventTypes: ['leftMouseDown'],  // 仅左键拖拽平移
    // 可选值: 'leftMouseDown', 'rightMouseDown'
  },
}));
```

## 编程式 API

注册 Scroller 后，以下 graph 方法的行为会委托给 Scroller 实现：

```javascript
// 平移控制（Scroller 接管）
graph.enablePanning();
graph.disablePanning();
graph.togglePanning(true);
graph.isPannable();  // boolean

// 居中定位（注册 Scroller 后自动使用 Scroller 实现）
graph.centerPoint(x, y);      // 将画布坐标 (x, y) 居中显示
graph.centerCell(cell);        // 将指定元素居中显示
graph.centerContent();         // 将画布内容居中显示

// 缩放（注册 Scroller 后自动使用 Scroller 实现）
graph.zoom(1.5, { absolute: true });   // 缩放到 150%
graph.zoomToFit({ padding: 20 });      // 自适应缩放，使所有内容可见
graph.zoomToRect(rect);                // 缩放到指定矩形区域
```

### Scroller 插件专有 API

以下方法是 Scroller 插件注册后独有的：

```javascript
// 锁定/解锁滚动
graph.lockScroller();     // 禁止滚动
graph.unlockScroller();   // 恢复滚动

// 更新 Scroller（画布内容变化后手动刷新）
graph.updateScroller();

// 获取/设置滚动条位置
graph.getScrollbarPosition();              // { left: number, top: number }
graph.setScrollbarPosition(left, top);     // 设置滚动条位置

// 获取 Scroller DOM 容器
const scroller = graph.getPlugin('scroller');
const scrollerContainer = scroller.container;
```

## 完整示例

```javascript
import { Graph, Scroller, MiniMap } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});

graph.use(new Scroller({
  enabled: true,
  pannable: true,
  pageVisible: true,
  pageBreak: false,
  modifiers: 'ctrl',  // 按住 Ctrl 拖拽才平移（避免与节点拖拽冲突）
}));

// 添加多个节点，分布在较大区域
for (let i = 0; i < 20; i++) {
  graph.addNode({
    x: Math.random() * 2000,
    y: Math.random() * 1500,
    width: 80,
    height: 40,
    label: `Node ${i + 1}`,
  });
}

// 缩放到适合大小，使所有节点可见
graph.zoomToFit({ padding: 40 });
```

## 与 MiniMap 配合

Scroller 和 MiniMap 搭配使用时，MiniMap 会自动反映 Scroller 的视口区域：

```javascript
import { Graph, Scroller, MiniMap } from '@antv/x6';

const graph = new Graph({ container: 'container' });

graph.use(new Scroller({ enabled: true, pannable: true }));
graph.use(new MiniMap({
  enabled: true,
  container: document.getElementById('minimap'),
  width: 200,
  height: 160,
}));
```

## Scroller vs panning 配置

X6 Graph 本身有 `panning` 配置（不需要插件），但 Scroller 提供更完整的滚动体验：

| 特性 | `panning: true` | Scroller 插件 |
|------|-----------------|---------------|
| 画布拖拽平移 | ✅ | ✅ |
| 滚动条 | ❌ | ✅ |
| 分页显示 | ❌ | ✅ |
| 与 MiniMap 联动 | 部分 | ✅ |
| 无限滚动区域 | ❌ | ✅ |

如果只需简单平移，使用 `panning: true`；如果需要滚动条和分页，使用 Scroller 插件。

## 常见错误

### ❌ 同时使用 panning 和 Scroller

```javascript
// 错误：两者冲突
const graph = new Graph({
  container: 'container',
  panning: true,  // ❌ 与 Scroller 冲突
});
graph.use(new Scroller({ enabled: true, pannable: true }));
```

```javascript
// 正确：使用 Scroller 时不要配置 panning
const graph = new Graph({ container: 'container' });
graph.use(new Scroller({ enabled: true, pannable: true }));  // ✅
```

### ❌ 在构造函数中配置 scroller

```javascript
// 错误：3.x 不支持
const graph = new Graph({
  container: 'container',
  scroller: { enabled: true, pannable: true },  // ❌
});
```

```javascript
// 正确
import { Graph, Scroller } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Scroller({ enabled: true, pannable: true }));  // ✅
```
