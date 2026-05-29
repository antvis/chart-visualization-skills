---
id: "x6-core-virtual-render"
title: "X6 虚拟渲染"
description: |
  X6 虚拟渲染机制，仅渲染可视区域内的节点和边，适用于大数据量场景（数千节点以上）。
  通过 virtual 配置项启用，可设置缓冲边距，支持与 Scroller 插件联动。

library: "x6"
version: "3.x"
category: "core"
subcategory: "virtual-render"
tags:
  - "virtual"
  - "虚拟渲染"
  - "性能"
  - "大数据量"
  - "可视区域"
  - "按需渲染"
  - "performance"

related:
  - "x6-core-graph-init"
  - "x6-plugins"

use_cases:
  - "渲染数千个节点的大型图"
  - "优化画布滚动/缩放时的性能"
  - "减少 DOM 节点数量"
  - "大型流程图/血缘图的性能优化"

difficulty: "intermediate"
completeness: "full"
---

## 核心概念

**虚拟渲染（Virtual Render）** 是一种性能优化策略：只渲染当前可视区域（加上缓冲边距）内的节点和边，视口外的元素不创建 DOM 节点。当用户平移、缩放画布时，自动更新渲染区域。

适用场景：
- 节点数量超过 500 个
- 大型血缘图、组织架构图、网络拓扑图
- 需要流畅的画布交互体验

## 配置方式

### 基础启用

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  virtual: true,  // 启用虚拟渲染，使用默认缓冲边距 120px
});
```

### 自定义缓冲边距

```javascript
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  virtual: {
    enabled: true,
    margin: 200,  // 可视区域外 200px 范围内的元素也会被渲染
  },
});
```

## 配置项

### virtual 参数

| 类型 | 说明 |
|------|------|
| `boolean` | `true` 启用，`false` 禁用 |
| `{ enabled?: boolean; margin?: number }` | 对象形式，可配置缓冲边距 |

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 是否启用 |
| `margin` | `number` | `120` | 可视区域外的缓冲边距（像素），越大预渲染范围越大，滚动时白屏概率越低 |

## API 方法

| 方法 | 说明 |
|------|------|
| `graph.enableVirtualRender()` | 动态启用虚拟渲染 |
| `graph.disableVirtualRender()` | 动态禁用虚拟渲染（恢复全量渲染） |

## 与 Scroller 联动

虚拟渲染会自动监听 Scroller 插件的滚动事件，在滚动时更新渲染区域：

```javascript
import { Graph, Scroller } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  virtual: { enabled: true, margin: 150 },
});

// Scroller 注册后，虚拟渲染自动绑定其滚动事件
graph.use(new Scroller({ enabled: true }));
```

## 完整示例：大数据量场景

```javascript
import { Graph, Scroller, MiniMap } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 1000,
  height: 600,
  virtual: { enabled: true, margin: 200 },
  async: true,
  grid: { visible: true, size: 10 },
});

graph.use(new Scroller({ enabled: true }));
graph.use(new MiniMap({ enabled: true, container: document.getElementById('minimap-container') }));

// 批量添加大量节点
const nodes = [];
const edges = [];

for (let i = 0; i < 2000; i++) {
  const row = Math.floor(i / 50);
  const col = i % 50;
  nodes.push({
    id: `node-${i}`,
    shape: 'rect',
    x: col * 160,
    y: row * 100,
    width: 120,
    height: 40,
    label: `Node ${i}`,
    attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 4, ry: 4 } },
  });

  // 添加横向边
  if (col > 0) {
    edges.push({
      source: `node-${i - 1}`,
      target: `node-${i}`,
      attrs: { line: { stroke: '#ccc', strokeWidth: 1 } },
    });
  }
}

graph.fromJSON({ nodes, edges });
graph.centerContent();
```

## 动态切换

```javascript
// 数据量小时禁用虚拟渲染（避免频繁计算可视区域的开销）
if (nodeCount < 200) {
  graph.disableVirtualRender();
} else {
  graph.enableVirtualRender();
}
```

## 注意事项

1. **缓冲边距选择**：margin 过小会导致快速滚动时出现白屏（元素未及时渲染）；过大则降低优化效果。推荐 100~200px。
2. **与 async 配合**：虚拟渲染通常搭配 `async: true`（默认值）使用，异步渲染进一步提升大数据量下的初始化性能。
3. **事件监听**：虚拟渲染会监听 `translate`（平移）、`scale`（缩放）、`resize`（容器尺寸变化）事件和 Scroller 的滚动事件来更新渲染区域。
4. **不影响数据**：虚拟渲染只影响 DOM 渲染，`graph.toJSON()` 仍导出所有元素数据。

## 常见错误

### ❌ 大数据量不启用虚拟渲染导致卡顿

```javascript
// 问题：2000 个节点全量渲染，DOM 过多导致交互卡顿
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});
// 添加 2000 个节点... 画布非常卡

// 解决：启用虚拟渲染
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  virtual: true,  // ✅ 只渲染可视区域
});
```

### ❌ 小数据量启用虚拟渲染增加额外开销

```javascript
// 不推荐：只有 20 个节点时无需虚拟渲染
const graph = new Graph({
  container: 'container',
  virtual: { enabled: true, margin: 200 }, // 计算可视区域的开销大于渲染节省的时间
});

// 推荐：数据量小时不启用
const graph = new Graph({
  container: 'container',
  // virtual 默认 false
});
```
