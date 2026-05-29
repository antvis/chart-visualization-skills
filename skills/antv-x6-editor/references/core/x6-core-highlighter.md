---
id: "x6-core-highlighter"
title: "X6 高亮器（Highlighter）"
description: |
  节点和边的高亮效果配置。
  用于连线交互时高亮可连接的节点/端口，或自定义选中状态的视觉反馈。
  内置 stroke、className、opacity 三种高亮策略。

library: "x6"
version: "3.x"
category: "core"
subcategory: "highlighter"
tags:
  - "highlighter"
  - "高亮"
  - "stroke"
  - "className"
  - "opacity"
  - "highlighting"
  - "magnetAvailable"
  - "nodeAvailable"
  - "连线高亮"

related:
  - "x6-core-graph-init"
  - "x6-core-ports"
  - "x6-core-edge"

use_cases:
  - "连线时高亮可连接的端口"
  - "连线时高亮可连接的节点"
  - "自定义选中元素的高亮样式"
  - "鼠标悬停时的视觉反馈"

difficulty: "intermediate"
completeness: "full"
---

## 核心概念

**Highlighter（高亮器）** 为节点/边提供视觉高亮效果。X6 在连线交互时会自动触发高亮：

- **magnetAvailable**：拖拽连线时，可连接的端口（magnet）高亮
- **nodeAvailable**：拖拽连线时，可连接的节点高亮
- **default**：默认高亮样式（如 `graph.highlightCell()` 手动触发时使用）

## 配置方式

在 Graph 构造函数的 `highlighting` 字段中配置：

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  connecting: {
    highlight: true,  // 必须启用，连线时才会触发高亮
  },
  highlighting: {
    default: {
      name: 'stroke',
      args: { padding: 3 },
    },
    magnetAvailable: {
      name: 'className',
      args: { className: 'available-magnet' },
    },
    nodeAvailable: {
      name: 'className',
      args: { className: 'available-node' },
    },
  },
});
```

## 内置高亮器

### stroke

在元素周围绘制描边高亮框（SVG path），最常用的高亮方式。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `padding` | `number` | `3` | 高亮框与元素的间距 |
| `rx` | `number` | `0` | 高亮框圆角 X |
| `ry` | `number` | `0` | 高亮框圆角 Y |
| `attrs` | `object` | `{ 'stroke-width': 3, stroke: '#FEB663' }` | 高亮框的 SVG 属性 |

```javascript
highlighting: {
  default: {
    name: 'stroke',
    args: {
      padding: 5,
      rx: 4,
      ry: 4,
      attrs: {
        'stroke-width': 2,
        stroke: '#1890ff',
        'stroke-dasharray': '5 3',
      },
    },
  },
}
```

### className

通过添加 CSS 类名实现高亮，适合用 CSS 动画实现复杂效果。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `className` | `string` | `'x6-highlighted'` | 添加到元素上的 CSS 类名 |

```javascript
highlighting: {
  magnetAvailable: {
    name: 'className',
    args: { className: 'port-available' },
  },
}
```

配套 CSS：

```css
.port-available circle {
  fill: #52c41a;
  stroke: #52c41a;
  transition: all 0.2s;
}
```

### opacity

通过添加降低透明度的 CSS 类名实现高亮（实际效果为非高亮元素变淡）。

无参数，直接使用：

```javascript
highlighting: {
  nodeAvailable: {
    name: 'opacity',
    args: {},
  },
}
```

## highlighting 配置项

| 字段 | 触发时机 | 说明 |
|------|----------|------|
| `default` | `graph.highlightCell()` 手动调用时 | 默认高亮样式 |
| `magnetAvailable` | 拖拽连线时，经过可连接的 magnet | 端口/元素高亮 |
| `nodeAvailable` | 拖拽连线时，经过可连接的节点 | 节点高亮 |

**注意**：必须在 `connecting` 中设置 `highlight: true` 才会在连线交互时触发 `magnetAvailable` 和 `nodeAvailable` 高亮。

## Graph 默认配置

X6 Graph 的默认 highlighting 配置（源码）：

```javascript
highlighting: {
  default: {
    name: 'stroke',
    args: { padding: 3 },
  },
  nodeAvailable: {
    name: 'className',
    args: { className: 'x6-available-node' },
  },
  magnetAvailable: {
    name: 'className',
    args: { className: 'x6-available-magnet' },
  },
}
```

## 完整示例

### 连线时高亮可用端口

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  connecting: {
    highlight: true,
    allowBlank: false,
    router: 'orth',
    connector: 'rounded',
  },
  highlighting: {
    magnetAvailable: {
      name: 'stroke',
      args: {
        padding: 4,
        attrs: { 'stroke-width': 2, stroke: '#52c41a' },
      },
    },
  },
});

const node1 = graph.addNode({
  shape: 'rect',
  x: 100,
  y: 100,
  width: 120,
  height: 60,
  label: 'Source',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 6, ry: 6 } },
  ports: {
    groups: {
      out: {
        position: 'right',
        attrs: { circle: { r: 5, magnet: true, stroke: '#8f8f8f', fill: '#fff' } },
      },
    },
    items: [{ id: 'out1', group: 'out' }],
  },
});

const node2 = graph.addNode({
  shape: 'rect',
  x: 400,
  y: 100,
  width: 120,
  height: 60,
  label: 'Target',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 6, ry: 6 } },
  ports: {
    groups: {
      in: {
        position: 'left',
        attrs: { circle: { r: 5, magnet: true, stroke: '#8f8f8f', fill: '#fff' } },
      },
    },
    items: [{ id: 'in1', group: 'in' }],
  },
});

// 从 node1 的 out1 端口拖拽连线时，node2 的 in1 端口会高亮
```

### 手动高亮/取消高亮

通过 `CellView` 的 `highlight()` / `unhighlight()` 方法手动触发高亮：

```javascript
// 获取节点视图
const nodeView = graph.findViewByCell(node1);

// 手动高亮（不传 options 时使用 highlighting.default 配置）
nodeView.highlight();

// 高亮指定子元素，使用自定义高亮器
nodeView.highlight(nodeView.container.querySelector('rect'), {
  highlighter: { name: 'stroke', args: { padding: 5, attrs: { stroke: '#f5222d' } } },
});

// 取消高亮
nodeView.unhighlight();
```

## 常见错误

### ❌ 连线时端口不高亮

```javascript
// 错误：忘记开启 connecting.highlight
const graph = new Graph({
  container: 'container',
  connecting: {
    allowBlank: false,
    // highlight 默认为 false！
  },
  highlighting: {
    magnetAvailable: { name: 'stroke', args: { padding: 4 } },
  },
});
// 连线时端口不会高亮

// 正确：必须设置 highlight: true
const graph = new Graph({
  container: 'container',
  connecting: {
    allowBlank: false,
    highlight: true, // ✅ 开启连线高亮
  },
  highlighting: {
    magnetAvailable: { name: 'stroke', args: { padding: 4 } },
  },
});
```

### ❌ 使用 className 但忘记写 CSS

```javascript
// 问题：className 高亮器只添加类名，不自带样式
highlighting: {
  magnetAvailable: {
    name: 'className',
    args: { className: 'my-highlight' }, // 仅添加类名
  },
}
// 如果没有对应 CSS 规则，视觉上无变化

// 解决：添加 CSS 或改用 stroke 高亮器
```
