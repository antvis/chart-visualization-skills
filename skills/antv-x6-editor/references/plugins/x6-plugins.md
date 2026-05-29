---
id: "x6-plugins"
title: "X6 插件配置"
description: |
  X6 内置插件的使用方式：Selection、Snapline、History、Clipboard、
  Keyboard、MiniMap、Scroller、Transform 等。

library: "x6"
version: "3.x"
category: "plugins"
subcategory: "all"
tags:
  - "插件"
  - "plugin"
  - "import"
  - "Illegal constructor"
  - "is not a constructor"
  - "Embedding"
  - "embedding"
  - "嵌入"
  - "节点嵌入"
  - "Connecting"
  - "Mousewheel"
  - "Panning"
  - "Selection"
  - "选中"
  - "框选"
  - "Snapline"
  - "对齐线"
  - "History"
  - "撤销"
  - "重做"
  - "undo"
  - "redo"
  - "Clipboard"
  - "复制"
  - "粘贴"
  - "Keyboard"
  - "快捷键"
  - "MiniMap"
  - "小地图"
  - "Scroller"
  - "滚动"
  - "Transform"
  - "缩放"
  - "旋转"
  - "Stencil"
  - "侧边栏"
  - "拖拽"

related:
  - "x6-core-graph-init"
  - "x6-core-events"

use_cases:
  - "启用节点框选"
  - "添加对齐辅助线"
  - "实现撤销重做"
  - "配置快捷键"
  - "添加小地图导航"
  - "启用滚动画布"
  - "节点缩放旋转"
  - "侧边栏拖拽创建节点"

anti_patterns:
  - "不要使用 @antv/x6-plugin-xxx 独立包（已废弃）"
  - "不要在 Graph 构造函数中传入 selecting/snapline/history 等选项（3.x 不支持）"

difficulty: "intermediate"
completeness: "full"
---

## 插件使用方式

X6 3.x 中，插件从 `@antv/x6` 直接导入，通过 `graph.use(new Plugin(options))` 注册。每个插件实现 `GraphPlugin` 接口。

```javascript
import { Graph, Selection, Snapline, History } from '@antv/x6';

const graph = new Graph({ container: 'container' });

// 通过 graph.use() 注册插件
graph.use(new Selection({ enabled: true }));
graph.use(new Snapline({ enabled: true }));
graph.use(new History({ enabled: true }));
```

## ⚠️ 插件 import 速查表（输出代码前必查）

X6 11 个内置插件都从 `@antv/x6` **主包**导入；**用到哪些，就必须在 import 行里列出哪些**。

| 用到的写法                                            | 必须 import                          |
| ----------------------------------------------------- | ------------------------------------ |
| `new Selection(...)` 或 `graph.select/unselect/...`   | `Selection`                          |
| `new Snapline(...)`                                   | `Snapline`                           |
| `new History(...)` 或 `graph.undo/redo`               | `History`                            |
| `new Clipboard(...)` 或 `graph.copy/paste/cut`        | `Clipboard`                          |
| `new Keyboard(...)` 或 `graph.bindKey`                | `Keyboard`                           |
| `new MiniMap(...)`                                    | `MiniMap`                            |
| `new Scroller(...)`                                   | `Scroller`                           |
| `new Transform(...)`                                  | `Transform`                          |
| `new Export()` 或 `graph.toPNG/toSVG/toJPEG`          | `Export`                             |
| `new Stencil(...)`                                    | `Stencil`                            |
| `new Dnd(...)`                                        | `Dnd`                                |
| `Shape.HTML.register(...)` / `Shape.HTML.create(...)` | `Shape`（不是 `HTML`）               |

> 推荐**单行合并** import，避免遗漏：
>
> ```javascript
> import { Graph, Shape, Selection, Keyboard, History, Clipboard } from '@antv/x6';
> ```

### ❌ 漏 import Selection 会引发 `Failed to construct 'Selection': Illegal constructor`

评测和 Playground 用的是 X6 **UMD 构建**（`window.X6`），执行前会按 `import` 列表从 `window.X6` 解构出对应类。如果 `Selection` 没出现在 import 里，**标识符 `Selection` 会回退到 `window.Selection`**（浏览器原生 Selection 接口，**不是构造函数**），随后 `new Selection({...})` 抛 `Illegal constructor`。

```javascript
// ❌ 漏写 Selection 导致 Illegal constructor
import { Graph } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Selection({ enabled: true, rubberband: true })); // ❌ Selection 未 import → 回退到 window.Selection
```

```javascript
// ✅ 必须把 Selection 写进 import
import { Graph, Selection } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Selection({ enabled: true, rubberband: true })); // ✅
```

### ❌ `Embedding` / `Connecting` / `Mousewheel` / `Panning` 不是插件，禁止 `new` / `graph.use`

X6 3.x 只有 **11 个插件**（上表所列），下列概念**全部是 `new Graph({ ... })` 构造选项**，不是插件类：

| 概念             | 错误写法（运行时报错）                          | 正确写法（Graph 构造选项）                                                          |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| 节点嵌入         | `import { Embedding } from '@antv/x6'` / `new Embedding(...)` / `graph.use(new Embedding(...))` → `Embedding is not a constructor` | `new Graph({ embedding: { enabled: true, findParent: 'bbox', validate: ({ child, parent }) => true } })` |
| 连线交互         | `new Connecting(...)` / `graph.use(...)`        | `new Graph({ connecting: { snap: true, allowBlank: false, router: 'manhattan', connector: 'rounded' } })` |
| 滚轮缩放         | `new Mousewheel(...)`                           | `new Graph({ mousewheel: { enabled: true, modifiers: ['ctrl'], factor: 1.1 } })`     |
| 平移画布         | `new Panning(...)`                              | `new Graph({ panning: { enabled: true, modifiers: 'shift' } })`                      |
| 网格 / 背景      | `new Grid(...)` / `new Background(...)`         | `new Graph({ grid: true, background: { color: '#f5f5f5' } })`                       |
| 平移节点         | `new Translating(...)`                          | `new Graph({ translating: { restrict: true } })`                                     |
| 高亮             | `new Highlighting(...)`                         | `new Graph({ highlighting: { magnetAvailable: { name: 'stroke', args: {...} } } })` |

> 简易判断：只要在 X6 文档 / 源码里出现 `interface XxxOptions extends ...` 而不是 `class Xxx extends Base`，就**一定**是 Graph 构造选项，不能 `new` / `graph.use`。



```javascript
// ❌ Keyboard / History 未 import
import { Graph } from '@antv/x6';
graph.use(new Keyboard({ enabled: true })); // ❌ Keyboard is not a constructor
graph.use(new History({ enabled: true }));  // ❌ History is not a constructor
```

```javascript
// ✅ 全部写进同一行 import
import { Graph, Keyboard, History } from '@antv/x6';
graph.use(new Keyboard({ enabled: true }));
graph.use(new History({ enabled: true }));
```

### ❌ 用 `Shape.HTML.register` 却忘了 import `Shape`

```javascript
// ❌
import { Graph } from '@antv/x6';
Shape.HTML.register({ shape: 'form', html() { /* ... */ } }); // ❌ Shape is not defined
```

```javascript
// ✅
import { Graph, Shape } from '@antv/x6';
Shape.HTML.register({ shape: 'form', html() { /* ... */ } });
```

## Selection（框选）

```javascript
import { Graph, Selection } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new Selection({
  enabled: true,
  rubberband: true,        // 启用框选
  multiple: true,          // 允许多选
  showNodeSelectionBox: true,  // 显示选中框
  multipleSelectionModifiers: ['ctrl', 'meta'],  // 多选修饰键
}));

// 编程式操作（插件注册后自动挂载到 graph 实例）
graph.select(node);              // 选中
graph.unselect(node);            // 取消选中
graph.isSelected(node);          // 是否选中
graph.getSelectedCells();        // 获取所有选中元素
graph.cleanSelection();          // 清空选择
```

## Snapline（对齐线）

```javascript
import { Graph, Snapline } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new Snapline({
  enabled: true,
  tolerance: 10,           // 吸附容差（像素）
}));
```

## History（撤销/重做）

```javascript
import { Graph, History } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new History({ enabled: true }));

// 撤销
graph.undo();

// 重做
graph.redo();

// 是否可撤销/重做
graph.canUndo();
graph.canRedo();

// 监听事件
graph.on('history:undo', () => console.log('Undone'));
graph.on('history:redo', () => console.log('Redone'));

// 批量操作合并为一次撤销步骤（⚠️ 禁止使用 graph.history.batch()，该方法不存在）
graph.startBatch('custom-batch');
// 执行多个操作...
graph.stopBatch('custom-batch');

// 或使用 batchUpdate 简写
graph.batchUpdate('custom-batch', () => {
  // 这里的所有操作会合并为一次撤销步骤
  graph.addNode({ shape: 'rect', x: 100, y: 100, width: 80, height: 40 });
  graph.addNode({ shape: 'rect', x: 300, y: 100, width: 80, height: 40 });
});
```

## Clipboard（复制/粘贴）

```javascript
import { Graph, Clipboard } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new Clipboard({ enabled: true }));

// 复制选中元素
graph.copy(graph.getSelectedCells());

// 粘贴（偏移 20px）
graph.paste({ offset: 20 });

// 剪切
graph.cut(graph.getSelected( ));
```

## Keyboard（快捷键）

```javascript
import { Graph, Keyboard } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new Keyboard({
  enabled: true,
  global: true,            // 全局快捷键（不限于画布焦点）
}));

// 绑定快捷键
graph.bindKey('ctrl+c', () => {
  const cells = graph.getSelectedCells();
  if (cells.length) graph.copy(cells);
});

graph.bindKey('ctrl+v', () => {
  graph.paste({ offset: 20 });
});

graph.bindKey('ctrl+z', () => {
  graph.undo();
});

graph.bindKey('ctrl+shift+z', () => {
  graph.redo();
});

graph.bindKey('delete', () => {
  const cells = graph.getSelectedCells();
  if (cells.length) graph.removeCells(cells);
});

graph.bindKey('ctrl+a', () => {
  graph.select(graph.getCells());
});
```

## Scroller（滚动画布）

```javascript
import { Graph, Scroller } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new Scroller({
  enabled: true,
  pannable: true,          // 画布可平移
  pageVisible: true,       // 显示分页
  pageBreak: false,
}));
```

## MiniMap（小地图）

```javascript
import { Graph, MiniMap } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new MiniMap({
  enabled: true,
  container: document.getElementById('minimap'),  // 小地图容器
  width: 200,
  height: 160,
}));
```

**注意**：MiniMap 需要一个独立的 DOM 容器。

## Transform（节点缩放/旋转）

```javascript
import { Graph, Transform } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new Transform({
  resizing: {
    enabled: true,           // 允许调整大小
  },
  rotating: {
    enabled: true,           // 允许旋转
  },
}));
```

## Stencil（侧边栏拖拽面板）

Stencil 用于创建可拖拽的节点面板（工具箱）：

```javascript
import { Graph, Stencil } from '@antv/x6';

const graph = new Graph({ container: 'container' });

const stencil = new Stencil({
  title: 'Components',
  target: graph,
  groups: [
    { name: 'basic', title: 'Basic Shapes' },
    { name: 'custom', title: 'Custom Nodes' },
  ],
});
graph.use(stencil);

document.getElementById('stencil').appendChild(stencil.container);

// 向分组中加载节点模板
const basicNodes = [
  graph.createNode({ shape: 'rect', width: 80, height: 40, label: 'Rect' }),
  graph.createNode({ shape: 'circle', width: 60, height: 60, label: 'Circle' }),
];
stencil.load(basicNodes, 'basic');

const customNodes = [
  graph.createNode({ shape: 'dag-node', width: 140, height: 50, label: 'DAG Node' }),
];
stencil.load(customNodes, 'custom');
```

## Dnd（拖拽创建）

简单的拖拽创建节点（不需要侧边栏）：

```javascript
import { Graph, Dnd } from '@antv/x6';

const graph = new Graph({ container: 'container' });

const dnd = new Dnd({ target: graph });
graph.use(dnd);

// 从外部元素开始拖拽
document.getElementById('drag-source').addEventListener('mousedown', (e) => {
  const node = graph.createNode({
    shape: 'rect',
    width: 100,
    height: 40,
    label: 'New Node',
  });
  dnd.start(node, e);
});
```

## 组合使用示例

```javascript
import { Graph, Selection, Snapline, History, Clipboard, Keyboard, Transform } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  background: { color: '#F2F7FA' },
  grid: { visible: true },
  panning: true,
  mousewheel: { enabled: true, modifiers: 'ctrl' },
  connecting: { allowBlank: false, router: 'orth', connector: 'rounded' },
});

// 注册插件
graph.use(new Selection({ enabled: true, rubberband: true, showNodeSelectionBox: true }));
graph.use(new Snapline({ enabled: true }));
graph.use(new History({ enabled: true }));
graph.use(new Clipboard({ enabled: true }));
graph.use(new Keyboard({ enabled: true, global: true }));
graph.use(new Transform({ resizing: { enabled: true } }));

// 快捷键绑定
graph.bindKey('ctrl+c', () => graph.copy(graph.getSelectedCells()));
graph.bindKey('ctrl+v', () => graph.paste({ offset: 20 }));
graph.bindKey('ctrl+z', () => graph.undo());
graph.bindKey('ctrl+shift+z', () => graph.redo());
graph.bindKey('delete', () => graph.removeCells(graph.getSelectedCells()));
```

## 常见错误与修正

### ❌ 错误：在构造函数中传入插件选项

**问题代码**：
```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  selecting: { enabled: true },  // ❌ 3.x 不支持
  snapline: { enabled: true },   // ❌ 3.x 不支持
  history: { enabled: true },    // ❌ 3.x 不支持
});
```

**错误原因**：
X6 3.x 中插件通过 `graph.use()` 注册，不支持构造函数选项模式。

**修正代码**：
```javascript
import { Graph, Selection, Snapline, History } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new Selection({ enabled: true }));
graph.use(new Snapline({ enabled: true }));
graph.use(new History({ enabled: true }));
```

### ❌ 错误：使用 `@antv/x6-plugin-xxx` 独立包

**问题代码**：
```javascript
import { Selection } from '@antv/x6-plugin-selection';  // ❌ 已废弃
import { History } from '@antv/x6-plugin-history';      // ❌ 已废弃
```

**错误原因**：
独立插件包已废弃，3.x 中所有插件直接从 `@antv/x6` 导出。

**修正代码**：
```javascript
import { Graph, Selection, History } from '@antv/x6';  // ✅ 正确
```

### ❌ 错误：调用 `graph.render()`

**问题代码**：
```javascript
const data = { nodes: [...], edges: [...] };
graph.fromJSON(data);
graph.render(); // ❌ 错误
```

**错误原因**：
`graph.fromJSON()` 会自动渲染，无需手动调用 `render()`。

**修正代码**：
```javascript
const data = { nodes: [...], edges: [...] };
graph.fromJSON(data);
```

### ❌ 错误：未正确初始化画布容器或缺少基础节点导致白屏

**问题代码**：
```javascript
import { Graph, Selection, Snapline, History, Keyboard } from '@antv/x6';

const graph = new Graph({
  container: container, // ❌ 应使用字符串 container: 'container'
});

graph.use(new Selection({ enabled: true }));
graph.use(new Snapline({ enabled: true }));
graph.use(new History({ enabled: true }));
graph.use(new Keyboard({ enabled: true }));

// ❌ 没有添加任何节点或边，画布为空白
```

**错误原因**：
1. `container` 参数应为 DOM 元素或其 ID 字符串。
2. 画布中没有添加任何节点或边，导致白屏。

**修正代码**：
```javascript
import { Graph, Selection, Snapline, History, Keyboard, Clipboard } from '@antv/x6';

const graph = new Graph({
  container: 'container', // ✅ 正确：使用字符串 ID
  width: 800,
  height: 600,
  background: { color: '#F2F7FA' },
  grid: { visible: true },
  panning: true,
  mousewheel: { enabled: true, modifiers: 'ctrl' },
  connecting: { allowBlank: false, router: 'orth', connector: 'rounded' },
});

// 注册插件
graph.use(new Selection({ enabled: true, rubberband: true }));
graph.use(new Snapline({ enabled: true }));
graph.use(new History({ enabled: true }));
graph.use(new Keyboard({ enabled: true }));
graph.use(new Clipboard({ enabled: true }));

// 添加基础节点和边
const node1 = graph.addNode({ shape: 'rect', x: 100, y: 100, width: 80, height: 40, label: 'Start' });
const node2 = graph.addNode({ shape: 'circle', x: 300, y: 100, width: 60, height: 60, label: 'End' });
graph.addEdge({ source: node1, target: node2 });

// 快捷键绑定
graph.bindKey('delete', () => {
  const cells = graph.getSelectedCells();
  if (cells.length) graph.removeCells(cells);
});
graph.bindKey('ctrl+z', () => graph.undo());
graph.bindKey('ctrl+shift+z', () => graph.redo());
graph.bindKey('ctrl+c', () => graph.copy(graph.getSelectedCells()));
graph.bindKey('ctrl+v', () => graph.paste({ offset: 20 }));
```

### ❌ 错误：插件方法调用错误（如 keyboard.bindKey）

**问题代码**：
```javascript
const keyboard = new Keyboard({ enabled: true, global: true });
graph.use(keyboard);

keyboard.bindKey(['delete', 'backspace'], () => { ... }); // ❌ 错误
```

**错误原因**：
插件方法应通过 `graph` 实例调用，而不是插件实例。

**修正代码**：
```javascript
graph.use(new Keyboard({ enabled: true, global: true }));

graph.bindKey(['delete', 'backspace'], () => {
  const cells = graph.getSelectedCells();
  if (cells.length) graph.removeCells(cells);
});
```

### ❌ 错误：History 插件的 batch 方法不存在

**问题代码**：
```javascript
graph.history.batch(() => {
  const node1 = graph.addNode(data[0]);
  const node2 = graph.addNode(data[1]);
  graph.addEdge({ source: node1, target: node2 });
});
```

**错误原因**：
History 插件没有 `batch` 方法，应使用 `graph.startBatch()` 和 `graph.stopBatch()` 来控制批量操作。

**修正代码**：
```javascript
graph.startBatch('custom-batch');

const node1 = graph.addNode(data[0]);
const node2 = graph.addNode(data[1]);
graph.addEdge({ source: node1, target: node2 });

graph.stopBatch('custom-batch');
```

---
</skill>
