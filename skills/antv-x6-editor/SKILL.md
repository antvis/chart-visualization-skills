---
name: antv-x6-editor
description: X6 图编辑引擎代码生成技能，支持流程图、DAG、ER图、血缘图等图编辑场景的节点/边/端口/交互/插件配置
version: 3.x
---

# X6 图编辑引擎代码生成技能

## 核心约束（必须遵守）

<!-- CONSTRAINTS:START -->

### X6 3.x 关键约束（强制）

- **`graph.render()` 不存在**：X6 3.x 中 `new Graph()` / `addNode` / `addEdge` / `fromJSON` 均自动渲染，代码中不得出现 `graph.render()`。
- **不得声明 `container` 变量**：运行环境会作为函数参数注入 `container`。Graph 初始化只使用字符串字面量 `container: 'container'`，禁止 `const/let/var container = ...`，也禁止 `document.getElementById('container')`。
- **使用插件方法前必须先 `graph.use(new Plugin(...))` 注册对应插件**：`graph.toPNG / toSVG / toJPEG` 依赖 `Export`；`graph.select / unselect` 依赖 `Selection`；`graph.undo / redo` 依赖 `History`；`graph.copy / paste / cut` 依赖 `Clipboard`；`graph.bindKey` 依赖 `Keyboard`。未注册插件时对应方法不存在。
- **自定义 shape 必须先注册再使用**：`Graph.registerNode(name, def)` / `Graph.registerEdge(name, def)` / `Shape.HTML.register({ shape, ... })` 必须在首次 `addNode / addEdge` 之前完成。
- **`@antv/x6` 仅导出 11 个插件类**：`Clipboard`、`Dnd`、`Export`、`History`、`Keyboard`、`MiniMap`、`Scroller`、`Selection`、`Snapline`、`Stencil`、`Transform`。`mousewheel`、`embedding`、`panning`、`connecting`、`translating`、`interacting`、`background`、`grid` 是 `new Graph()` 的**构造选项**，不是插件，**不得** import 同名类、不得 `graph.use(new XxxClass())`。例：滚轮缩放写在 Graph 构造中 `mousewheel: { enabled: true, zoomAtMousePosition: true, modifiers: ['ctrl'] }`。
- **节点/边动画使用 `cell.animate(keyframes, options)`（Web Animations API 风格）**：X6 3.x **没有 `node.transition(path, target, options)` 方法**。源码中 `transition` 仅作为 `node.translate(tx, ty, { transition })` / `node.rotate(deg, { transition })` 的 **options 字段**存在（`boolean | KeyframeEffectOptions`），并非独立方法。示例：
  ```javascript
  // 通用动画
  node.animate(
    { fill: ['#fff', '#1890ff'], transform: ['scale(1)', 'scale(1.2)'] },
    { duration: 500, iterations: 1, fill: 'forwards' },
  );
  // 仅平移过渡
  node.translate(120, 0, { transition: { duration: 500, easing: 'ease-in-out' } });
  ```
  多步属性变更可用 `graph.startBatch('animate'); cell.attr(...); graph.stopBatch('animate');` 包装。

### 初始化规范
- `container` 参数必填，**必须使用字符串形式** `container: 'container'`，运行时环境会自动解析为 DOM 元素
- **必须设置背景色**：`background: { color: '#F2F7FA' }`，所有画布都需要统一的浅蓝灰色背景
- **不要添加 `grid` 配置**，除非用户明确要求显示网格
- **不要设置 `width` / `height`**，除非用户明确指定画布尺寸；画布默认自适应容器大小
- 导入方式：`import { Graph } from '@antv/x6'`，**仅导入实际使用到的类**
- **禁止**无条件导入 `Shape`：仅在使用 `Shape.HTML.register()` 等 Shape 静态方法时才导入 `Shape`
- 插件从 `'@antv/x6'` 直接导入，如 `import { Graph, Selection, History } from '@antv/x6'`
- **禁止**使用 `@antv/x6-plugin-xxx` 独立包导入（已废弃）
- 标准初始化模板：
  ```javascript
  import { Graph } from '@antv/x6';
  const graph = new Graph({
    container: 'container',
    background: { color: '#F2F7FA' },
  });
  ```

### 节点操作规范
- **优先使用 `graph.addNode()`** 逐个添加节点，而非 `graph.fromJSON()` 批量导入（除非用户明确要求批量加载数据）
- 内置 shape：`'rect'`、`'circle'`、`'ellipse'`、`'polygon'`、`'polyline'`、`'path'`、`'text'`、`'text-block'`、`'image'`、`'html'`
- 节点样式通过 `attrs` 配置，遵循 SVG 属性命名
- 节点位置通过 `x`、`y` 设置（左上角坐标），尺寸通过 `width`、`height` 设置
- **默认节点样式**（除非用户指定其他样式，所有节点统一使用此默认样式）：
  ```javascript
  attrs: {
    body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
  }
  ```
- **禁止**在 attrs 中使用 CSS 属性名（如 `background-color`），必须用 SVG 属性（如 `fill`）

### 边操作规范
- 使用 `graph.addEdge({ source, target, ... })` 添加边
- `source`/`target` 可以是：节点实例、节点 ID 字符串、`{ cell: node, port: 'portId' }` 对象、坐标 `{ x, y }`
- 边样式：`attrs: { line: { stroke, strokeWidth, strokeDasharray, targetMarker, sourceMarker } }`
- **默认边样式**（除非用户指定其他样式）：`attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1 } }`
- 箭头：`targetMarker: 'classic'`（经典箭头）、`'block'`、`'circle'`、`'diamond'`
- 路由器：`router: 'orth'`（正交）、`'manhattan'`、`'metro'`、`'er'`
- 连接器：`connector: 'rounded'`（圆角）、`'smooth'`（贝塞尔曲线）、`'jumpover'`

### 连接桩（Ports）规范
- 连接桩定义在节点配置的 `ports` 字段中
- 端口组：`ports: { groups: { groupName: { position, attrs, ... } }, items: [{ id, group }] }`
- position 取值：`'top'`、`'bottom'`、`'left'`、`'right'`
- 端口是连线的锚点，设置 `attrs: { circle: { magnet: true } }` 允许从端口拖出连线
- **必须设置 `magnet: true`** 才能从该端口发起或接收连线

### 交互配置规范
- 连线交互在 Graph 配置中通过 `connecting` 字段设置
- `connecting: { allowBlank: false, router: 'orth', connector: 'rounded', createEdge() {...} }`
- 节点移动限制：`translating: { restrict: true }` 或传函数限制区域
- 嵌入：`embedding: { enabled: true }` 允许节点拖入分组

### 插件使用规范
- 插件从 `@antv/x6` 导入，通过 `graph.use(new Plugin(options))` 注册
- 可用插件：`Selection`、`Snapline`、`History`、`Clipboard`、`Keyboard`、`Scroller`、`MiniMap`、`Transform`、`Export`、`Stencil`、`Dnd`
- Selection: `graph.use(new Selection({ enabled: true, rubberband: true }))`
- Snapline: `graph.use(new Snapline({ enabled: true }))`
- History: `graph.use(new History({ enabled: true }))`
- Clipboard: `graph.use(new Clipboard({ enabled: true }))`
- Keyboard: `graph.use(new Keyboard({ enabled: true }))`
- Scroller: `graph.use(new Scroller({ enabled: true }))`
- MiniMap: `graph.use(new MiniMap({ enabled: true, container: minimapContainer }))`
- Transform: `graph.use(new Transform({ resizing: { enabled: true }, rotating: { enabled: true } }))`
- Export: `graph.use(new Export())`（注册后可调用 `graph.toPNG()` / `graph.toSVG()`）
- 动态控制：`graph.enablePlugins('selection')` / `graph.disablePlugins('selection')`
- **禁止**在 Graph 构造函数中直接传入 `selecting`、`snapline` 等选项（3.x 不支持）

### 序列化规范
- 导出：`const data = graph.toJSON()` 返回 `{ cells: [...] }` 对象
- 导入：`graph.fromJSON(data)` 加载整个图数据
- 清空：`graph.clearCells()` 清除所有元素
- **禁止**手动构造 cells 数组中的内部字段（如 `zIndex`、`parent`），应通过 API 操作

### 事件规范
- 节点事件：`graph.on('node:click', ({ node, e }) => {...})`
- 边事件：`graph.on('edge:click', ({ edge, e }) => {...})`
- 画布事件：`graph.on('blank:click', ({ e }) => {...})`
- 变更事件：`graph.on('node:moved', ({ node }) => {...})`
- **事件回调参数是对象**，不是位置参数：`({ node, e })` 而非 `(node, e)`

### 导入规范
- **所有使用到的类都必须出现在 import 语句中**：如使用 `Selection`，必须 `import { Graph, Selection } from '@antv/x6'`
- **禁止**使用 `Graph.Selection`、`Graph.Keyboard` 等命名空间写法（不存在）
- **禁止**使用未导入的类：`new Selection(...)` 必须对应 `import { Selection } from '@antv/x6'`
- **import 自检清单（强制，输出代码前必须逐行核对）**：对代码中**每一个** `new XxxYyy(...)` 调用，`XxxYyy` 必须**字面出现**在第一行 `import { ..., XxxYyy } from '@antv/x6'` 的花括号内。常见漏写：`Selection`、`Keyboard`、`History`、`Clipboard`、`Snapline`、`MiniMap`、`Transform`、`Scroller`、`Export`、`Stencil`、`Dnd`、`Shape`（用到 `Shape.HTML.register` 时）。
- **import 漏写为何会变成 `Illegal constructor` 等运行时错**：评测/Playground 环境用 **UMD 构建**（`window.X6`）执行代码，而不是真正的 ES Module。`Selection`、`Keyboard` 等会**根据 import 列表**从 `window.X6` 解构出来；如果 import 漏写，标识符 `Selection` 会**回退到 `window.Selection`**（浏览器原生 Selection 接口），`new Selection({...})` 会抛 `Failed to construct 'Selection': Illegal constructor`。`Keyboard` / `History` 等同理（会 `is not a constructor`）。
- **import 漏写的标准修法**：把所有用到的插件类合并到同一行 `import { Graph, Selection, Keyboard, History, ... } from '@antv/x6';`，不要分多行 import，也不要遗漏。

### 节点工具（Tools）规范
- 添加工具：`node.addTools([{ name: 'button-remove', args: { x: 0, y: 0 } }])` 或 `graph.addTools(node, [...])`
- 移除工具：`node.removeTools()` 或 `graph.removeTools(node)`
- 检查工具：`node.hasTools()`
- **禁止**使用 `node.hideTools()` / `node.showTools()`（3.x 不存在此 API）
- 悬停显示/隐藏工具的正确方式：
  ```javascript
  graph.on('node:mouseenter', ({ node }) => {
    node.addTools([{ name: 'button-remove', args: { x: 0, y: 0 } }]);
  });
  graph.on('node:mouseleave', ({ node }) => {
    node.removeTools();
  });
  ```

### 渐变色规范
- X6 attrs 中 `fill` 支持渐变对象语法，**禁止**直接操作 `graph.defs` 或 `document.createElementNS` 创建 SVG 渐变
- 线性渐变正确写法：
  ```javascript
  attrs: {
    body: {
      fill: {
        type: 'linearGradient',
        stops: [
          { offset: '0%', color: '#0000ff' },
          { offset: '100%', color: '#00ff00' },
        ],
      },
    },
  }
  ```

### 代码输出规范
- **必须输出纯 JavaScript**，禁止使用 TypeScript 语法（如 `private`、类型注解 `: string`、`as` 类型断言）
- HTML 自定义节点使用 `Shape.HTML.register({ shape, html, effect })` 注册自定义 shape，**禁止**使用 `class extends Node` 方式
- **禁止** `Graph.registerHTMLComponent(name, factory)` —— 这是 X6 2.x 旧 API，3.x 源码已无此方法。所有 HTML 节点统一通过 `Shape.HTML.register` 注册（详见 `references/core/x6-core-html-shape.md`）
- `effect` 数组指定哪些属性变化时触发重新渲染（如 `['data']`）；**纯静态展示节点不要加 effect**
- HTML 节点正确写法：
  ```javascript
  import { Graph, Shape } from '@antv/x6';
  Shape.HTML.register({
    shape: 'my-html',
    effect: ['data'],
    html(node) {
      const div = document.createElement('div');
      div.style.width = '100%';
      div.style.height = '100%';
      div.innerHTML = node.getData().content || '';
      return div;
    },
  });
  const graph = new Graph({ container: 'container' });
  graph.addNode({ shape: 'my-html', x: 100, y: 100, width: 200, height: 80, data: { content: '<div>Hello</div>' } });
  ```

### Stencil 插件规范
- Stencil 通过 `graph.use(new Stencil({ target: graph, groups: [...] }))` 注册
- 注册后通过 `graph.getPlugin('stencil')` 获取实例，将 `stencil.container` 挂载到 DOM
- Stencil 内的节点模板使用 `graph.createNode(...)` 创建（非 `graph.addNode`），再通过 `stencil.load(nodes, groupName)` 加载

### 动态端口规范
- 使用 `node.addPort()` 动态添加端口时，**必须在节点初始化时预定义对应的 ports.groups**
- 如果没有预定义 group，端口无法正确定位，可能导致渲染异常
- 正确写法：
  ```javascript
  const node = graph.addNode({
    ...,
    ports: {
      groups: {
        in: { position: 'left', attrs: { circle: { r: 4, magnet: true, stroke: '#8f8f8f', fill: '#fff' } } },
        out: { position: 'right', attrs: { circle: { r: 4, magnet: true, stroke: '#8f8f8f', fill: '#fff' } } },
      },
    },
  });
  node.addPort({ id: 'port1', group: 'out' });
  ```
- **`registerNode` + `addNode` 的 ports 合并陷阱（强约束）**：`Graph.registerNode(name, { ports: { items: [{ id: 'in1', group: 'in' }] } })` 之后，如果再 `graph.addNode({ shape: name, ports: { items: [{ id: 'in1', group: 'in' }] } })`，X6 内部 `Cell` 构造时 `ObjectExt.merge(defaults, metadata)` 会按数组下标合并、`node.addPorts` 走的也是 `[...current, ...new]` 简单拼接，**不会去重**，运行时直接抛 `Error: Duplicitied port id.`。正确做法二选一：
  - 在 `registerNode` 里只声明 `ports.groups`，把 `ports.items` 留给 `addNode` / 后续 `node.addPort` 提供；
  - 或在 `registerNode` 里完整声明 `ports.items`，`addNode` 时**不再传 `ports.items`**（如需追加端口，调用 `node.addPort({ id: '新id', group: 'xxx' })`，且新 id 不能与 registry 里已声明的重名）。

### DOM/CSS 操作规范（HTML 节点 / Stencil / 自定义工具）
- HTML 节点 `html(node)` 回调里给 DOM 设样式时，**禁止**直接写连字符属性：`el.style.box-sizing = '...'`、`el.style.font-size = '...'` 会被 JS 解析为 `el.style.box - sizing = ...`，抛 `Invalid left-hand side in assignment`。正确写法二选一：
  - 驼峰：`el.style.boxSizing = 'border-box'`、`el.style.fontSize = '14px'`、`el.style.backgroundColor = '#fff'`；
  - 方括号：`el.style['box-sizing'] = 'border-box'`、`el.style['font-size'] = '14px'`；
  - 多条样式优先用 `el.style.cssText = 'box-sizing:border-box;font-size:14px;'` 或 `Object.assign(el.style, { boxSizing: 'border-box', fontSize: '14px' })`。
- 同理，`el.classList.add('...')` / `el.setAttribute('data-x', '...')` 是合法 API；**禁止** `el.class = '...'` / `el['class-name'] = ...`。

### 不存在的 API（禁止使用）
- **禁止** `graph.scrollToCell()` → 正确方式：`graph.centerCell(cell)` 滚动并居中到指定 cell
- **禁止** `graph.highlightCell()` / `graph.highlightNode()` → 正确方式：通过 `node.attr('body/stroke', '#f00')` 或添加 CSS class 实现高亮
- **禁止** `Shape.Cylinder` / `Shape.Diamond` 等不存在的内置 Shape → 用 `'rect'` + `rx/ry` 或 `'polygon'` 自定义
- **禁止** `Shape.Edge.define()` / `Shape.Node.define()` → 正确方式：`Graph.registerEdge()` / `Graph.registerNode()`
- **禁止** `Shape.Group` / `Shape.Group.define()` / `new Shape.Group()` → X6 3.x 的 `Shape` 命名空间**没有** `Group` 导出（实际只有 `Circle / Edge / Ellipse / HTML / Image / Path / Polygon / Polyline / Rect / TextBlock`，运行时会报 `Cannot read properties of undefined (reading 'define')`）。父子分组的正确方式：直接 `graph.addNode({ shape: 'rect', ... })` 创建一个普通节点作为父节点，再通过 `parent.addChild(child)` / `parent.embed(child)` 建立父子关系；或用 `Graph.registerNode('my-group', { inherit: 'rect', markup: [...], attrs: {...} })` 注册一个自定义分组形状再 `addNode({ shape: 'my-group' })`。
- **禁止** 把 `Embedding` 当插件 import / new / `graph.use(new Embedding(...))` → X6 3.x **没有** `Embedding` 插件类（运行时会报 `Embedding is not a constructor`）。节点嵌入是 **Graph 构造选项**：`new Graph({ container, embedding: { enabled: true, findParent: 'bbox', frontOnly: false, validate: ({ child, parent }) => true } })`。Hover 高亮通过 `highlighting.embedding` 配置，嵌入/解除嵌入事件为 `node:embedding` / `node:embedded`。
- **禁止** `history.batch()` → 正确方式：`graph.startBatch('custom'); ...; graph.stopBatch('custom');` 或 `graph.batchUpdate(() => { ... })`
- **禁止** `graph.defs` / `graph.svgDoc` / `document.createElementNS('...', 'linearGradient' | 'defs' | 'marker')` → X6 3.x 不暴露 `graph.defs` / `graph.svgDoc`，运行时会报 `Cannot read properties of undefined`。正确方式：
  - 节点/边普通 `fill` 渐变：直接用 attrs 中的渐变对象语法（`fill: { type: 'linearGradient', stops: [...] }`）
  - 自定义 marker 需要渐变填充：先 `const id = graph.defineGradient({ type: 'linearGradient', stops: [{ offset: 0, color: '#f00' }, { offset: 1, color: '#0f0' }] })`，再在 marker 对象里写 `fill: \`url(#${id})\``
  - 自定义 marker / filter 同理使用 `graph.defineMarker(options)` / `graph.defineFilter(options)`

### 渲染输出规范（必须遵守）
- **画布初始化后必须存在至少一个 `graph.addNode` / `graph.addEdge` / `graph.fromJSON` 调用**，确保画布有可视内容。即使用户 query 只描述了交互（panning / mousewheel / 插件等）配置，也必须自行补 2~3 个示例节点 + 1 条边作为渲染载体，否则视觉验证会被判定为「白屏」。
- **所有节点/边添加完成后，必须在末尾调用 `graph.centerContent()`**（或在画布需要随内容缩放时使用 `graph.zoomToFit({ padding: 20, maxScale: 1 })`）。X6 默认不会自动居中，缺失该调用会导致内容偏向左上角、视觉评分不通过。两者二选一，不可同时调用。
- 多个交互（`panning` + `mousewheel` + `Selection` rubberband）同时启用时，**必须用 `modifiers` 错开触发条件**（例如：panning 用 `'shift'`，mousewheel 用 `'ctrl'`，rubberband 留空）。**禁止**把 `'mouseWheel'` 放进 `panning.eventTypes` 同时又启用 `mousewheel`，两者会争抢滚轮事件。

<!-- CONSTRAINTS:END -->

---

## 禁止的错误模式

### ❌ 使用已废弃的独立插件包

```javascript
// 错误：独立插件包已废弃
import { Selection } from '@antv/x6-plugin-selection';
import { History } from '@antv/x6-plugin-history';

// 正确：从 @antv/x6 直接导入
import { Graph, Selection, History } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Selection({ enabled: true, rubberband: true }));
graph.use(new History({ enabled: true }));
```

### ❌ 在构造函数中传入插件选项

```javascript
// 错误：3.x 不支持构造函数选项模式
const graph = new Graph({
  container: 'container',
  selecting: { enabled: true },  // ❌
  snapline: { enabled: true },   // ❌
  history: { enabled: true },    // ❌
});

// 正确：使用 graph.use() 注册插件
import { Graph, Selection, Snapline, History } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Selection({ enabled: true }));
graph.use(new Snapline({ enabled: true }));
graph.use(new History({ enabled: true }));
```

### ❌ 混淆 CSS 属性和 SVG 属性

```javascript
// 错误：使用 CSS 属性名
attrs: {
  body: {
    'background-color': '#fff',  // ❌
    'border-radius': '6px',      // ❌
  }
}

// 正确：使用 SVG 属性名
attrs: {
  body: {
    fill: '#fff',               // ✅ 背景色
    rx: 6,                      // ✅ 圆角
    ry: 6,
    stroke: '#8f8f8f',          // ✅ 边框色
    strokeWidth: 1,             // ✅ 边框宽度
  }
}
```

### ❌ 缺少 container

```javascript
// 错误：遗漏 container
const graph = new Graph({});

// 正确：container 必填
const graph = new Graph({ container: 'container' });
```

### ❌ 连接桩未设置 magnet

```javascript
// 错误：端口无法连线
ports: {
  items: [{ id: 'port1', group: 'out' }],
  groups: {
    out: { position: 'right', attrs: { circle: { r: 5 } } }
  }
}

// 正确：设置 magnet: true
ports: {
  items: [{ id: 'port1', group: 'out' }],
  groups: {
    out: { position: 'right', attrs: { circle: { r: 5, magnet: true, stroke: '#8f8f8f' } } }
  }
}
```

### ❌ 事件回调使用位置参数

```javascript
// 错误：参数不是位置传递
graph.on('node:click', (node, e) => { ... });

// 正确：解构对象参数
graph.on('node:click', ({ node, e }) => { ... });
```

---

## 基础结构模板

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
});

const source = graph.addNode({
  shape: 'rect',
  x: 40,
  y: 40,
  width: 100,
  height: 40,
  label: 'Source',
  attrs: {
    body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
  },
});

const target = graph.addNode({
  shape: 'rect',
  x: 300,
  y: 200,
  width: 100,
  height: 40,
  label: 'Target',
  attrs: {
    body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
  },
});

graph.addEdge({
  source,
  target,
  attrs: {
    line: { stroke: '#8f8f8f', strokeWidth: 1 },
  },
});

// 内容居中：所有节点/边添加完成后调用，使画布内容相对于容器居中显示
// 如需缩放以适应容器，使用 graph.zoomToFit({ padding: 20, maxScale: 1 }) 替代
graph.centerContent();
```

---

## 场景选择指南

| 场景 | 推荐配置 | 关键特性 |
|------|----------|----------|
| DAG 数据管道 | ports + orth router + connecting | 有向无环、端口连线 |
| ER 实体关系图 | HTML 节点 + er router | 表格式节点、字段展示 |
| 流程图/审批流 | 菱形判断节点 + 分支边 | 条件分支、多路径 |
| 组织架构图 | orth router + 树形布局 | 层级关系、折叠 |
| 血缘分析 | 左右布局 + smooth connector | 多层流转、端口 |
| 网络拓扑 | 圆形节点 + 星型结构 | 设备类型、连接状态 |
| 状态机 | 圆形节点 + 边标签 | 状态转换、事件触发 |

---

## 内置节点类型

| shape | 形状 | 适用场景 |
|-------|------|----------|
| `rect` | 矩形 | 通用节点、流程步骤 |
| `circle` | 圆形 | 状态节点、端点 |
| `ellipse` | 椭圆 | 通用强调 |
| `polygon` | 多边形 | 菱形（判断）、六边形 |
| `text` | 纯文本 | 标注、注释 |
| `image` | 图片 | 图标节点 |
| `html` | HTML | 富文本、表格式节点 |

---

## 路由器与连接器

### 路由器（Router）— 决定边的路径走向
| 类型 | 效果 | 适用场景 |
|------|------|----------|
| `normal` | 直线（默认） | 简单图 |
| `orth` | 正交折线 | 流程图、DAG |
| `manhattan` | 智能正交（绕障） | 复杂布局 |
| `metro` | 地铁线风格 | 地铁图 |
| `er` | ER 图专用 | 实体关系图 |

### 连接器（Connector）— 决定边的线条样式
| 类型 | 效果 | 适用场景 |
|------|------|----------|
| `normal` | 直线段（默认） | 简单图 |
| `rounded` | 圆角折线 | 流程图（推荐） |
| `smooth` | 贝塞尔曲线 | 血缘图、关系图 |
| `jumpover` | 跨线跳跃 | 复杂交叉 |

---

## 插件速查

| 插件 | 注册方式 | 功能 |
|------|----------|------|
| Selection | `graph.use(new Selection({ enabled: true, rubberband: true }))` | 框选节点 |
| Snapline | `graph.use(new Snapline({ enabled: true }))` | 对齐辅助线 |
| History | `graph.use(new History({ enabled: true }))` | 撤销/重做 |
| Clipboard | `graph.use(new Clipboard({ enabled: true }))` | 复制/粘贴 |
| Keyboard | `graph.use(new Keyboard({ enabled: true }))` | 快捷键绑定 |
| Scroller | `graph.use(new Scroller({ enabled: true }))` | 滚动画布 |
| MiniMap | `graph.use(new MiniMap({ enabled: true, container }))` | 小地图导航 |
| Transform | `graph.use(new Transform({ resizing: { enabled: true }, rotating: { enabled: true } }))` | 节点缩放/旋转 |
| Export | `graph.use(new Export())` | 导出 PNG/SVG |
| Stencil | `graph.use(new Stencil({ target: graph, groups: [...] }))` | 侧边栏拖拽面板 |
| Dnd | `graph.use(new Dnd({ target: graph }))` | 拖拽创建节点 |
