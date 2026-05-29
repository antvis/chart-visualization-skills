---
id: "x6-plugin-snapline"
title: "X6 Snapline 对齐线插件"
description: |
  Snapline 插件在节点拖拽移动时自动显示对齐辅助线，帮助用户精确对齐节点位置。

library: "x6"
version: "3.x"
category: "plugins"
subcategory: "snapline"
tags:
  - "Snapline"
  - "对齐线"
  - "辅助线"
  - "吸附"
  - "对齐"
  - "snap"

related:
  - "x6-plugins"
  - "x6-core-node"

use_cases:
  - "节点拖拽时显示对齐线"
  - "精确对齐多个节点"
  - "调整吸附容差"

difficulty: "beginner"
completeness: "full"
---

## 基本用法

```javascript
import { Graph, Snapline } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new Snapline({ enabled: true }));
```

拖拽节点时，当节点边缘或中心与其他节点对齐时，会自动显示红色辅助线并吸附到对齐位置。

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | boolean | `true` | 是否启用对齐线 |
| `tolerance` | number | `10` | 吸附容差（像素），节点边缘/中心距离对齐位置小于此值时触发吸附 |
| `sharp` | boolean | `false` | 是否显示截断的对齐线（仅在对齐节点之间显示） |
| `resizing` | boolean | `false` | 节点缩放时是否也显示对齐线 |
| `clean` | boolean \| number | `true` | 对齐线自动清除。`true` 立即清除，数字为延迟毫秒数 |
| `filter` | function \| string[] | - | 过滤不参与对齐计算的节点 |

## 编程式 API

```javascript
// 启用/禁用
graph.enableSnapline();
graph.disableSnapline();
graph.toggleSnapline(true);
graph.isSnaplineEnabled();  // boolean

// 隐藏当前显示的对齐线
graph.hideSnapline();

// 设置过滤器
graph.setSnaplineFilter((node) => {
  return node.getData()?.snapable !== false;
});

// 容差控制
graph.getSnaplineTolerance();      // number，当前容差值
graph.setSnaplineTolerance(20);    // 设置容差

// Sharp（截断样式）控制
graph.isSharpSnapline();           // boolean
graph.enableSharpSnapline();       // 启用截断样式
graph.disableSharpSnapline();      // 禁用截断样式
graph.toggleSharpSnapline(true);

// 缩放时是否也显示对齐线
graph.isSnaplineOnResizingEnabled();   // boolean
graph.enableSnaplineOnResizing();
graph.disableSnaplineOnResizing();
graph.toggleSnaplineOnResizing(true);
```

## 完整示例

```javascript
import { Graph, Snapline } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  grid: { visible: true, size: 10 },
});

graph.use(new Snapline({
  enabled: true,
  tolerance: 15,   // 15px 容差
  sharp: true,     // 截断样式
  resizing: true,  // 缩放时也对齐
}));

// 添加示例节点
graph.addNode({ x: 100, y: 100, width: 120, height: 60, label: 'Node A' });
graph.addNode({ x: 350, y: 200, width: 120, height: 60, label: 'Node B' });
graph.addNode({ x: 200, y: 350, width: 120, height: 60, label: 'Node C' });
// 拖拽 Node C 到与 Node A 左对齐时，会出现竖向对齐线
```

## 过滤器示例

```javascript
// 通过 shape 名过滤：仅特定 shape 参与对齐
graph.use(new Snapline({
  enabled: true,
  filter: ['rect', 'circle'],  // 仅 rect 和 circle 节点参与对齐
}));

// 通过函数过滤
graph.use(new Snapline({
  enabled: true,
  filter(node) {
    // 带有 group 标记的节点不参与对齐
    return node.getData()?.type !== 'group';
  },
}));
```

## 常见错误

### ❌ 在构造函数中配置 snapline

```javascript
// 错误：3.x 不支持
const graph = new Graph({
  container: 'container',
  snapline: { enabled: true },  // ❌
});
```

```javascript
// 正确
import { Graph, Snapline } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Snapline({ enabled: true }));  // ✅
```
