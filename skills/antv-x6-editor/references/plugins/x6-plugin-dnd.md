---
id: "x6-plugin-dnd"
title: "X6 Dnd 拖拽插件"
description: |
  Dnd（Drag and Drop）插件提供从外部拖拽节点到画布的能力。
  用于实现从工具箱/面板拖拽创建新节点的交互，支持拖拽预览、对齐吸附和放置验证。

library: "x6"
version: "3.x"
category: "plugins"
subcategory: "dnd"
tags:
  - "dnd"
  - "drag"
  - "drop"
  - "拖拽"
  - "拖放"
  - "getDragNode"
  - "getDropNode"
  - "validateNode"

related:
  - "x6-plugins"
  - "x6-plugin-stencil"
  - "x6-core-graph-init"

use_cases:
  - "从外部面板拖拽节点到画布"
  - "自定义拖拽预览节点样式"
  - "拖拽放置时的节点验证"
  - "不使用 Stencil 时的简单拖拽创建"

difficulty: "intermediate"
completeness: "full"
---

## 核心概念

**Dnd** 插件实现从外部 DOM 元素将节点拖拽到画布中。与 Stencil 的区别是：
- **Stencil**：封装了完整的侧边栏面板 UI（分组、搜索、布局），内部使用 Dnd
- **Dnd**：底层拖拽能力，不提供 UI，需要自行实现触发拖拽的界面

使用 Dnd 的典型场景：自定义工具栏按钮，点击/拖拽时往画布添加节点。

## 基本用法

```javascript
import { Graph, Dnd } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});

// 创建 Dnd 实例
const dnd = new Dnd({
  target: graph,
  getDragNode(sourceNode, options) {
    return sourceNode.clone();
  },
  getDropNode(draggingNode, options) {
    return draggingNode.clone();
  },
});

// 在外部 DOM 元素上触发拖拽
document.getElementById('btn-rect').addEventListener('mousedown', (e) => {
  const node = graph.createNode({
    shape: 'rect',
    width: 100,
    height: 40,
    label: '新节点',
    attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 6, ry: 6 } },
  });
  dnd.start(node, e);
});
```

## 配置项

### DndOptions

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `target` | `Graph` | ✓ | - | 目标画布实例 |
| `scaled` | `boolean` | | `false` | 拖拽节点是否跟随画布缩放 |
| `delegateGraphOptions` | `Options` | | - | 拖拽代理画布的额外配置 |
| `draggingContainer` | `HTMLElement` | | `document.body` | 拖拽过程中节点的容器元素 |
| `dndContainer` | `HTMLElement` | | - | Dnd 工具箱容器 |
| `getDragNode` | `Function` | | 克隆源节点 | 拖拽过程中展示的节点 |
| `getDropNode` | `Function` | | 克隆拖拽节点 | 放置到画布上的最终节点 |
| `validateNode` | `Function` | | - | 验证是否允许放置 |

### getDragNode

```typescript
getDragNode(sourceNode: Node, options: {
  sourceNode: Node;
  targetGraph: Graph;
  draggingGraph: Graph;
}) => Node
```

自定义拖拽过程中展示的节点。默认为 `sourceNode.clone()`。

### getDropNode

```typescript
getDropNode(draggingNode: Node, options: {
  sourceNode: Node;
  targetGraph: Graph;
  draggingGraph: Graph;
  draggingNode: Node;
}) => Node
```

自定义实际放到画布上的节点。默认为 `draggingNode.clone()`。

### validateNode

```typescript
validateNode(droppingNode: Node, options: {
  sourceNode: Node;
  targetGraph: Graph;
  draggingGraph: Graph;
  draggingNode: Node;
  droppingNode: Node;
}) => boolean | Promise<boolean>
```

验证节点是否允许放置到画布。返回 `false` 或 reject 时取消放置。支持异步验证。

## API 方法

| 方法 | 说明 |
|------|------|
| `dnd.start(node, mouseEvent)` | 开始拖拽。传入源节点和鼠标事件 |

## 完整示例

### 自定义工具栏拖拽

```javascript
import { Graph, Dnd, Snapline } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  grid: { visible: true, size: 10 },
});

graph.use(new Snapline({ enabled: true }));

const dnd = new Dnd({
  target: graph,
  scaled: true,  // 拖拽预览跟随画布缩放

  getDragNode(sourceNode) {
    // 拖拽时展示简化版本
    const node = sourceNode.clone();
    node.setAttrs({ body: { opacity: 0.6 } });
    return node;
  },

  getDropNode(draggingNode) {
    // 放置到画布时恢复正常样式
    const node = draggingNode.clone();
    node.setAttrs({ body: { opacity: 1 } });
    return node;
  },

  validateNode(droppingNode) {
    // 验证：画布上同 shape 节点不超过 5 个
    const shape = droppingNode.shape;
    const count = graph.getNodes().filter((n) => n.shape === shape).length;
    return count < 5;
  },
});

// 工具栏按钮绑定
const shapes = [
  { id: 'btn-rect', shape: 'rect', width: 100, height: 40, label: '矩形' },
  { id: 'btn-circle', shape: 'circle', width: 60, height: 60, label: '圆形' },
];

shapes.forEach(({ id, ...nodeProps }) => {
  document.getElementById(id)?.addEventListener('mousedown', (e) => {
    const node = graph.createNode({
      ...nodeProps,
      attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 4, ry: 4 } },
    });
    dnd.start(node, e);
  });
});
```

### 异步验证放置

```javascript
const dnd = new Dnd({
  target: graph,
  async validateNode(droppingNode) {
    // 异步验证，如调用后端接口
    const isValid = await checkNodePlacement(droppingNode.getData());
    return isValid;
  },
});
```

## Dnd 与 Stencil 的选择

| 场景 | 推荐 |
|------|------|
| 需要完整的侧边栏面板 UI | Stencil |
| 只需要简单的拖拽按钮 | Dnd |
| 需要搜索、分组功能 | Stencil |
| 完全自定义拖拽交互 UI | Dnd |
| 需要从非节点模板的 DOM 元素发起拖拽 | Dnd |

## 常见错误与修正

### ❌ 在 click 事件中调用 start

```javascript
// 错误：必须使用 mousedown 事件，click 时鼠标已抬起无法拖拽
element.addEventListener('click', (e) => {
  dnd.start(node, e); // ❌ 无法触发拖拽
});

// 正确：使用 mousedown
element.addEventListener('mousedown', (e) => {
  dnd.start(node, e); // ✅
});
```

### ❌ 忘记设置 target

```javascript
// 错误：缺少 target 会导致无法放置到画布
const dnd = new Dnd({
  getDragNode: (node) => node.clone(),
}); // ❌

// 正确
const dnd = new Dnd({
  target: graph, // ✅
});
```

### ❌ 容器未正确挂载导致 appendChild 报错

当使用 Stencil 或手动创建容器时，必须确保目标容器已存在并正确挂载到 DOM 中。

```javascript
// 错误：如果 document.getElementById('stencil') 返回 null，则会报错
const stencil = new Stencil({...});
document.getElementById('stencil').appendChild(stencil.container); // ❌ 报错 Cannot read properties of null

// 正确：先创建容器元素并挂载到 DOM 中
const stencilContainer = document.createElement('div');
stencilContainer.id = 'stencil';
document.body.appendChild(stencilContainer);

const stencil = new Stencil({...});
document.getElementById('stencil').appendChild(stencil.container); // ✅
```

### ❌ 使用不存在的 shape 名称

```javascript
// 错误：'cylinder' 不是内置 shape，会报错 Node with name 'cylinder' does not exist.
const cylinder = graph.createNode({
  shape: 'cylinder', // ❌
  width: 80,
  height: 60,
});

// 正确：使用内置 shape 名称，如 'rect', 'circle', 'ellipse', 'polygon' 等
const rect = graph.createNode({
  shape: 'rect',
  width: 100,
  height: 40,
  label: 'Rectangle',
});
```

### ❌ 错误地使用 Shape 构造函数

```javascript
// 错误：Shape.Cylinder 并不是构造函数，会导致报错 Shape.Cylinder is not a constructor
const cylinder = new Shape.Cylinder({ ... }); // ❌

// 正确：使用 graph.createNode 创建节点
const cylinder = graph.createNode({
  shape: 'rect',
  width: 80,
  height: 60,
  label: 'Cylinder',
});
```

### ✅ 推荐的容器创建方式

```javascript
// 创建并挂载 Stencil 容器
const stencilContainer = document.createElement('div');
stencilContainer.style.width = '200px';
stencilContainer.style.position = 'absolute';
stencilContainer.style.left = '0';
stencilContainer.style.top = '0';
stencilContainer.style.bottom = '0';
document.getElementById('container').parentElement.prepend(stencilContainer);

// 初始化 Stencil 并挂载
const stencil = new Stencil({
  title: 'Shapes',
  target: graph,
  groups: [{ name: 'basic', title: 'Basic Shapes' }],
});

stencilContainer.appendChild(stencil.container);
```

### ✅ 正确使用内置 Shape 创建节点

```javascript
import { Graph, Stencil } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});

const stencil = new Stencil({
  title: 'Shapes',
  target: graph,
  groups: [
    { name: 'basic', title: 'Basic Shapes' },
  ],
});

const stencilContainer = document.createElement('div');
document.getElementById('container').parentElement.prepend(stencilContainer);
stencilContainer.appendChild(stencil.container);

// 使用 graph.createNode 创建节点
const rect = graph.createNode({
  shape: 'rect',
  width: 100,
  height: 40,
  label: 'Rectangle',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f' } },
});

const circle = graph.createNode({
  shape: 'circle',
  width: 60,
  height: 60,
  label: 'Circle',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f' } },
});

stencil.load([rect, circle], 'basic');
```

</skill>