---
id: "x6-core-panning"
title: "X6 画布平移（Panning）"
description: |
  X6 画布平移配置：鼠标拖拽平移、修饰键控制、支持左键/右键/滚轮/滚轮按下等多种触发方式。

library: "x6"
version: "3.x"
category: "core"
subcategory: "panning"
tags:
  - "panning"
  - "平移"
  - "拖拽画布"
  - "pan"
  - "画布移动"

related:
  - "x6-core-graph-init"
  - "x6-core-mousewheel"
  - "x6-plugin-scroller"

use_cases:
  - "拖拽空白区域平移画布"
  - "按住修饰键拖拽平移"
  - "右键拖拽平移"
  - "滚轮平移画布"
  - "空格键+拖拽平移"

difficulty: "beginner"
completeness: "full"
---

## 基本用法

画布平移在 Graph 构造函数中通过 `panning` 字段配置：

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  panning: true,  // 简写：启用左键拖拽平移
});
```

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | boolean | `false` | 是否启用平移 |
| `modifiers` | string \| string[] \| null | `null` | 修饰键：`'ctrl'`、`'alt'`、`'shift'`、`'meta'`，或数组组合 |
| `eventTypes` | string[] | `['leftMouseDown']` | 触发方式：`'leftMouseDown'`、`'rightMouseDown'`、`'mouseWheel'`、`'mouseWheelDown'` |

## 简写形式

```javascript
// 布尔值简写
panning: true
// 等价于
panning: { enabled: true, eventTypes: ['leftMouseDown'] }
```

## 对象配置

```javascript
const graph = new Graph({
  container: 'container',
  panning: {
    enabled: true,
    modifiers: 'ctrl',  // 按住 Ctrl 才能拖拽平移
    eventTypes: ['leftMouseDown'],
  },
});
```

## 触发方式说明

| eventType | 说明 |
|-----------|------|
| `'leftMouseDown'` | 鼠标左键拖拽空白区域平移 |
| `'rightMouseDown'` | 鼠标右键拖拽平移 |
| `'mouseWheel'` | 鼠标滚轮滚动平移（非缩放） |
| `'mouseWheelDown'` | 按下滚轮（中键）拖拽平移 |

多种方式组合：

```javascript
panning: {
  enabled: true,
  eventTypes: ['leftMouseDown', 'rightMouseDown'],  // 左键和右键都可平移
}
```

## 修饰键控制

使用 `modifiers` 避免平移与框选冲突：

```javascript
import { Graph, Selection } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  panning: {
    enabled: true,
    modifiers: 'ctrl',  // Ctrl+拖拽 = 平移
  },
});

// 无修饰键拖拽 = 框选
graph.use(new Selection({ enabled: true, rubberband: true }));
```

## 空格键平移

X6 内置支持空格键临时平移（类似设计工具），按住空格键后拖拽即可平移画布，无需额外配置：

```javascript
const graph = new Graph({
  container: 'container',
  panning: { enabled: true },
  // 按住空格 + 鼠标拖拽 = 平移（自动支持）
});
```

## 编程式 API

```javascript
// 启用平移
graph.enablePanning();

// 禁用平移
graph.disablePanning();

// 判断是否启用
graph.isPannable();  // boolean

// 画布平移（编程式）
graph.translateBy(dx, dy);   // 相对平移
graph.translate(tx, ty);     // 设置绝对偏移
```

## 完整示例：平移 + 框选 + 缩放

```javascript
import { Graph, Selection } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  background: { color: '#F2F7FA' },
  grid: { visible: true },
  // Ctrl+拖拽平移（避免与框选冲突）
  panning: { enabled: true, modifiers: 'ctrl' },
  // Ctrl+滚轮缩放
  mousewheel: { enabled: true, modifiers: 'ctrl' },
});

// 无修饰键拖拽 = 框选
graph.use(new Selection({ enabled: true, rubberband: true }));

graph.addNode({ x: 100, y: 100, width: 120, height: 60, label: 'Node A' });
graph.addNode({ x: 400, y: 300, width: 120, height: 60, label: 'Node B' });
```

## Panning 与 Mousewheel 共存

`panning.eventTypes` 中如果包含 `'mouseWheel'`，X6 会用滚轮做**平移**，与 `mousewheel: { enabled: true }` 的**缩放**直接冲突，导致缩放不响应或行为异常。同时配置两者时必须用 `modifiers` 错开触发条件：

```javascript
// ✅ 推荐：左键拖拽平移 + Ctrl+滚轮缩放（互不干扰）
const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
  panning: { enabled: true },                       // 等价 eventTypes: ['leftMouseDown']
  mousewheel: { enabled: true, modifiers: 'ctrl' }, // 仅 Ctrl+滚轮缩放
});

// ✅ 推荐：Shift+拖拽平移 + Ctrl+滚轮缩放（再叠加 Selection rubberband 也不冲突）
const graph2 = new Graph({
  container: 'container',
  panning: { enabled: true, modifiers: 'shift' },
  mousewheel: { enabled: true, modifiers: 'ctrl', minScale: 0.5, maxScale: 3 },
});
```

```javascript
// ❌ 反模式：mouseWheel 放进 panning.eventTypes，又同时启用 mousewheel 缩放
const graph = new Graph({
  container: 'container',
  panning: { enabled: true, eventTypes: ['leftMouseDown', 'mouseWheel'] }, // ❌
  mousewheel: { enabled: true, modifiers: ['ctrl'], minScale: 0.5, maxScale: 3 },
});
```

## Panning vs Scroller

| 特性 | `panning` 配置 | Scroller 插件 |
|------|----------------|---------------|
| 拖拽平移 | ✅ | ✅ |
| 滚动条 | ❌ | ✅ |
| 分页显示 | ❌ | ✅ |
| 无限滚动区域 | ❌ | ✅ |
| 配置方式 | Graph 构造函数 | `graph.use()` |

简单需求用 `panning`，需要滚动条和分页时用 Scroller 插件。**两者不可同时使用**。

## 常见错误

### ❌ panning 和 Scroller 同时使用

```javascript
// 错误：冲突
const graph = new Graph({
  container: 'container',
  panning: true,  // ❌
});
graph.use(new Scroller({ enabled: true, pannable: true }));
```

```javascript
// 正确：二选一
// 方案 A：使用 panning
const graph = new Graph({ container: 'container', panning: true });

// 方案 B：使用 Scroller
const graph = new Graph({ container: 'container' });
graph.use(new Scroller({ enabled: true, pannable: true }));
```

### ❌ panning 与 rubberband 冲突

```javascript
// 问题：无修饰键时，拖拽到底是平移还是框选？
const graph = new Graph({
  container: 'container',
  panning: { enabled: true },  // 无修饰键
});
graph.use(new Selection({ enabled: true, rubberband: true }));  // 也无修饰键
// 结果：框选优先级更高，平移不生效
```

```javascript
// 正确：使用修饰键区分
const graph = new Graph({
  container: 'container',
  panning: { enabled: true, modifiers: 'ctrl' },  // ✅ Ctrl+拖拽平移
});
graph.use(new Selection({ enabled: true, rubberband: true }));  // 普通拖拽框选
```
