# G6 v5 图可视化代码生成技能

## 核心约束（必须遵守）

### 初始化规范
- `container` 参数必填，传入 DOM 元素 ID 字符串或 DOM 元素对象
- 使用 `new Graph({...})` 构造函数，**不得使用** `new G6.Graph()` (v4 写法)
- 所有配置在构造函数中一次性完成，不得事后多次调用配置方法覆盖
- `graph.render()` 返回 Promise，异步渲染；若需等待完成请 `await graph.render()`

### 数据结构规范
- 数据格式：`{ nodes: [...], edges: [...], combos?: [...] }`
- 每个节点必须有唯一 `id`（字符串）；业务数据放在 `data` 字段
- 边必须有 `source` 和 `target`，值为节点 `id`
- **禁止**使用 v4 的 `graph.data()` 方法传数据

### 节点/边样式规范
- 样式通过 `node.style` / `edge.style` 配置，支持静态值和回调函数
- 回调函数签名：`(datum: NodeData | EdgeData) => value`
- 标签文本通过 `style.labelText` 设置（**不是** `label` 或 `labelCfg`）
- 节点大小通过 `style.size` 设置（单个数值或 [width, height] 数组）

### 布局规范
- `layout` 配置放在 Graph 选项中：`{ type: 'force', ... }`
- `force` 布局**不支持** `preventOverlap` / `nodeSize`（G6 v4 参数，v5 静默忽略）；防重叠请改用 `d3-force` + `collide`
- 树形布局（mindmap, compact-box, dendrogram, indented）需要树形数据或 `treeToGraphData()` 转换
- 力导向布局异步运行，`graph.render()` 后会持续迭代

### 交互行为规范
- `behaviors` 为字符串数组或配置对象数组
- 常用行为字符串简写：`'drag-canvas'`, `'zoom-canvas'`, `'drag-element'`, `'click-select'`
- G6 v5 **移除了 Mode（模式）概念**，所有 behavior 直接在数组中配置
- 复杂配置使用对象形式：`{ type: 'click-select', multiple: true }`

### 插件规范
- `plugins` 为数组，与 `behaviors` 类似
- 简写：`'minimap'`, `'grid-line'`, `'tooltip'`
- 复杂配置：`{ type: 'tooltip', getContent: (e, items) => '...' }`

---

## 禁止的错误模式

### ❌ 使用 v4 API

```javascript
// 错误：v4 chainable API
const graph = new G6.Graph({ ... });
graph.data(data);
graph.render();
graph.node((node) => ({ ... }));  // v4 回调

// 正确：v5 构造函数
const graph = new Graph({
  container: 'container',
  data: { nodes: [...], edges: [...] },
  node: { style: { ... } },
});
graph.render();
```

### ❌ 错误的节点 data 结构

```javascript
// 错误：直接在顶层放业务属性
{ id: 'node1', label: 'Node 1', value: 100 }

// 正确：业务属性放在 data 字段
{ id: 'node1', data: { label: 'Node 1', value: 100 } }
```

### ❌ 错误的标签配置

```javascript
// 错误：v4 labelCfg
node: {
  labelCfg: { style: { fill: '#333' } }
}

// 正确：v5 style.labelText
node: {
  style: {
    labelText: (d) => d.data.label,
    labelFill: '#333',
    labelFontSize: 14,
  }
}
```

### ❌ behaviors 使用 Mode 概念

```javascript
// 错误：v4 modes
modes: {
  default: ['drag-canvas', 'zoom-canvas'],
  edit: ['create-edge'],
}

// 正确：v5 直接 behaviors 数组
behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
```

### ❌ 自定义节点 render() 中读取 attributes.data → 白屏

```javascript
// 错误：attributes 是计算后的样式对象，不含节点 data，访问 data.color 抛 TypeError
render(attributes, container) {
  const { data } = attributes;       // undefined
  const fill = data.color;           // TypeError → 白屏
}

// 正确：通过 node.style 回调把 data 字段映射为自定义样式属性
// ① Graph 配置
node: {
  type: 'my-node',
  style: { color: (d) => d.data.color },
},
// ② render() 中直接从 attributes 读取
render(attributes, container) {
  const { color = '#1783FF' } = attributes;  // ✅
}
```

### ❌ 使用 extend 注册自定义节点

```javascript
// 错误：extend 已从 G6 v5 正式版移除，导入后调用会报 "extend is not a function"
import { Graph, extend } from '@antv/g6';
const extendedGraph = extend(Graph, {
  nodes: { 'my-node': MyNodeFn },
});

// 错误：v4 的 group.addShape() API
const MyNode = (node) => (model) => {
  const group = node.group();
  group.addShape('circle', { attrs: { r: 20 } });
};

// 正确：BaseNode 类 + register()
import { BaseNode, Circle, ExtensionCategory, Graph, register } from '@antv/g6';
class MyNode extends BaseNode {
  render(attributes, container) {
    super.render(attributes, container);
    this.upsert('key', Circle, { cx: 0, cy: 0, r: 20, fill: '#1783FF' }, container);
  }
}
register(ExtensionCategory.NODE, 'my-node', MyNode);
const graph = new Graph({ node: { type: 'my-node' } });
```

### ❌ 缺少 container

```javascript
// 错误：遗漏 container
const graph = new Graph({ width: 800, height: 600 });

// 正确：container 必填，值为字符串 ID 或 DOM 元素
const graph = new Graph({ container: 'container', width: 800, height: 600 });
// 或传入 DOM 元素
const graph = new Graph({ container: document.getElementById('container'), width: 800, height: 600 });
```

> 常见变体错误：`container: container`（把字符串 ID 当变量名使用，变量未定义 → ReferenceError → 白屏）

### ❌ autoFit: 'view' 配合异步力导向布局导致白屏

```javascript
// 错误：combo-combined / force / d3-force 等布局是异步迭代的
// autoFit 在布局迭代开始前执行，节点全堆在原点，包围盒为零 → 缩放异常 → 白屏
const graph = new Graph({
  autoFit: 'view',          // ❌ 异步布局下不能在此设置
  layout: { type: 'combo-combined' },
});
graph.render();

// 正确：不设置 autoFit，在 AFTER_LAYOUT 事件后调用 fitView
import { Graph, GraphEvent } from '@antv/g6';
const graph = new Graph({
  layout: { type: 'combo-combined' },
});
graph.on(GraphEvent.AFTER_LAYOUT, () => graph.fitView({ padding: 20 }));
graph.render();
```

> 同步布局（`dagre`、`grid`、`circular` 等）不受此影响，可以直接用 `autoFit: 'view'`。

---

## 基础结构模板

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  // 1. 容器
  container: 'container',       // DOM id 或 HTMLElement
  width: 800,
  height: 600,
  autoFit: 'view',              // 可选：'center' | 'view' | false

  // 2. 数据
  data: {
    nodes: [
       { id: 'n1', data: { label: '节点1' } },
       { id: 'n2', data: { label: '节点2' } },
    ],
    edges: [
       { source: 'n1', target: 'n2' },
    ],
  },

  // 3. 节点样式
  node: {
    type: 'circle',             // 节点类型
    style: {
      size: 40,
      fill: '#1783FF',
      stroke: '#fff',
      lineWidth: 2,
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
    },
  },

  // 4. 边样式
  edge: {
    type: 'line',
    style: {
      stroke: '#aaa',
      lineWidth: 1,
      endArrow: true,
    },
  },

  // 5. 布局
  layout: {
    type: 'force',
    preventOverlap: true,
    nodeSize: 40,
  },

  // 6. 交互
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],

  // 7. 插件（可选）
  plugins: ['grid-line'],

  // 8. 主题（可选）
  theme: 'light',               // 'light' | 'dark'
});

graph.render();
```

---

## 图类型选择指南

| 图类型 | 推荐布局 | 典型场景 |
|--------|----------|----------|
| 网络图/关系图 | `force` / `fruchterman` | 社交网络、知识图谱 |
| 层次/流程图 | `dagre` / `antv-dagre` | 组织架构、工作流 |
| 树形图 | `compact-box` / `mindmap` | 文件树、思维导图 |
| 环形图 | `circular` | 循环依赖、环形关系 |
| 网格图 | `grid` | 棋盘布局、矩阵关系 |
| 同心圆 | `concentric` | 中心辐射关系 |
| 辐射布局 | `radial` | 以某节点为中心的辐射 |

---

## 内置节点类型

| 类型名 | 形状 | 适用场景 |
|--------|------|----------|
| `circle` | 圆形 | 通用节点，网络图 |
| `rect` | 矩形 | 流程图、UML |
| `ellipse` | 椭圆 | 通用，强调纵向 |
| `diamond` | 菱形 | 决策节点 |
| `hexagon` | 六边形 | 蜂窝布局 |
| `triangle` | 三角形 | 特殊标记 |
| `star` | 五角星 | 特殊标记、评分 |
| `donut` | 环形 | 带进度的节点 |
| `image` | 图片 | 头像、图标节点 |
| `html` | HTML | 富文本自定义节点 |

---

## 内置边类型

| 类型名 | 形状 | 适用场景 |
|--------|------|----------|
| `line` | 直线 | 简单图、拓扑图 |
| `cubic` | 三次贝塞尔曲线 | 通用，弧形效果 |
| `cubic-horizontal` | 水平三次曲线 | 水平流程图 |
| `cubic-vertical` | 垂直三次曲线 | 垂直流程图 |
| `quadratic` | 二次贝塞尔曲线 | 轻量弧形边 |
| `polyline` | 折线 | 正交布局 |
| `loop` | 自环 | 节点自身的循环 |

---

## 内置布局算法

| 布局名 | 类型 | 特点 |
|--------|------|------|
| `force` | 力导向 | 物理模拟，自然分布 |
| `d3-force` | 力导向 | 基于 D3，可配置力类型 |
| `fruchterman` | 力导向 | 快速，支持 GPU 加速 |
| `force-atlas2` | 力导向 | 大规模图，聚类效果好 |
| `dagre` | 层次 | DAG，自动分层 |
| `antv-dagre` | 层次 | AntV 优化版 Dagre |
| `circular` | 环形 | 节点排列为圆形 |
| `concentric` | 同心圆 | 按属性值分环 |
| `grid` | 网格 | 规则网格排列 |
| `radial` | 辐射 | 以某节点为中心辐射 |
| `mds` | 降维 | 保持节点相对距离 |
| `random` | 随机 | 调试用 |
| `compact-box` | 树形 | 紧凑树，节省空间 |
| `mindmap` | 树形 | 思维导图风格 |
| `dendrogram` | 树形 | 树状图 |
| `indented` | 树形 | 缩进树 |

---

## 内置交互行为

| 行为名 | 描述 |
|--------|------|
| `drag-canvas` | 拖拽画布 |
| `zoom-canvas` | 滚轮缩放画布 |
| `scroll-canvas` | 滚轮平移画布 |
| `drag-element` | 拖拽节点/边/combo |
| `drag-element-force` | 力导向图中拖拽节点 |
| `click-select` | 点击选中元素 |
| `brush-select` | 框选元素 |
| `lasso-select` | 套索选择 |
| `hover-activate` | 悬停激活元素 |
| `collapse-expand` | 折叠/展开节点（树图） |
| `create-edge` | 交互式创建边 |
| `focus-element` | 聚焦元素（缩放到指定元素） |
| `fix-element-size` | 缩放时保持元素大小不变 |
| `auto-adapt-label` | 自动显示/隐藏标签（防重叠） |
| `optimize-viewport-transform` | 大规模图视口优化 |

---

## 内置插件

| 插件名 | 描述 |
|--------|------|
| `grid-line` | 网格背景线 |
| `background` | 背景颜色/图片 |
| `watermark` | 水印 |
| `minimap` | 缩略图导航 |
| `legend` | 图例 |
| `tooltip` | 元素提示框 |
| `toolbar` | 工具栏（缩放、撤销等） |
| `contextmenu` | 右键菜单 |
| `history` | 撤销/重做 |
| `timebar` | 时间轴过滤 |
| `fisheye` | 鱼眼放大效果 |
| `edge-bundling` | 边捆绑 |
| `edge-filter-lens` | 边过滤镜头 |
| `hull` | 元素轮廓包围 |
| `bubble-sets` | 气泡集合 |
| `snapline` | 对齐辅助线 |
| `fullscreen` | 全屏 |

---

## 元素状态（States）

G6 v5 内置 5 种状态：`selected`、`active`、`highlight`、`inactive`、`disabled`

```javascript
// 在 Graph 配置中为状态设置样式
node: {
  style: {
    fill: '#1783FF',
  },
  state: {
    selected: {
      fill: '#ff6b6b',
      stroke: '#ff4d4d',
      lineWidth: 3,
    },
    hover: {
      fill: '#40a9ff',
    },
  },
},

// 动态设置状态
graph.setElementState('node1', 'selected');
graph.setElementState('node1', ['selected', 'highlight']);
graph.setElementState('node1', []);  // 清除所有状态
```

---

## 主题系统

```javascript
// 内置主题
const graph = new Graph({
  theme: 'light',   // 默认
  // theme: 'dark',
});

// 动态切换主题
graph.setTheme('dark');
graph.render();
```

---

## 数据操作 API

```javascript
// 添加元素
graph.addNodeData([{ id: 'n3', data: { label: '新节点' } }]);
graph.addEdgeData([{ source: 'n1', target: 'n3' }]);

// 更新元素
graph.updateNodeData([{ id: 'n1', style: { fill: 'red' } }]);

// 删除元素
graph.removeNodeData(['n3']);

// 更新数据后需要重新渲染
graph.draw();
```

---

## 常见使用模式

### 数据驱动样式（推荐）

```javascript
node: {
  style: {
    size: (d) => d.data.size || 30,
    fill: (d) => {
      const colorMap = { type1: '#1783FF', type2: '#FF6B6B', type3: '#52C41A' };
      return colorMap[d.data.type] || '#ccc';
    },
    labelText: (d) => d.data.name,
  },
},
```

### 调色板（Palette）映射

```javascript
node: {
  palette: {
    type: 'group',       // 按分类映射颜色
    field: 'category',   // 数据中的分类字段
    color: 'tableau10',  // 内置色板名
  },
},
```

### 连续数值映射节点大小

```javascript
transforms: [
  {
    type: 'map-node-size',
    field: 'value',
    range: [16, 60],
  },
],
```

### 平行边处理

```javascript
transforms: [
  {
    type: 'process-parallel-edges',
    offset: 15,
  },
],
edge: {
  type: 'quadratic',
},
```

---

## 数据操作 API 速查

```javascript
// 增
graph.addNodeData([{ id: 'n3', data: { label: '新节点' } }]);
graph.addEdgeData([{ source: 'n1', target: 'n3' }]);
graph.draw();

// 删
graph.removeNodeData(['n3']);   // 关联边自动删除
graph.draw();

// 改
graph.updateNodeData([{ id: 'n1', data: { label: '更新' } }]);
graph.draw();

// 查
const node = graph.getNodeData('n1');
const selected = graph.getElementDataByState('node', 'selected');
const zoom = graph.getZoom();

// 视口
await graph.fitView({ padding: 20 });
await graph.focusElement('n1', { duration: 500 });
await graph.zoomTo(1.5);

// 状态
graph.setElementState('n1', 'selected');
graph.setElementState('n1', []);          // 清除

// 销毁
graph.destroy();
```

---

## 事件监听速查

```javascript
// 元素事件（node/edge/combo + 事件类型）
graph.on('node:click', (e) => console.log(e.target.id));
graph.on('edge:pointerover', (e) => graph.setElementState(e.target.id, 'active'));
graph.on('canvas:click', () => { /* 点击空白 */ });

// 生命周期事件
import { GraphEvent } from '@antv/g6';
graph.on(GraphEvent.AFTER_RENDER, () => console.log('渲染完成'));
graph.on(GraphEvent.AFTER_LAYOUT, () => console.log('布局完成'));
```

---

## Reference 文档索引

### 核心
- [`g6-core-graph-init`](references/core/g6-core-graph-init.md)：Graph 初始化完整配置
- [`g6-core-data-structure`](references/core/g6-core-data-structure.md)：数据结构规范
- [`g6-core-graph-api`](references/core/g6-core-graph-api.md)：Graph 实例 API（增删改查、视口、状态）
- [`g6-core-events`](references/core/g6-core-events.md)：事件系统（元素事件、画布事件、生命周期）
- [`g6-core-custom-element`](references/core/g6-core-custom-element.md)：自定义节点/边（register + BaseNode/BaseEdge）
- [`g6-core-transforms-animation`](references/core/g6-core-transforms-animation.md)：数据变换（map-node-size）与动画配置

### 节点类型
- [`g6-node-circle`](references/elements/nodes/g6-node-circle.md)：圆形（通用）
- [`g6-node-rect`](references/elements/nodes/g6-node-rect.md)：矩形（流程图）
- [`g6-node-image`](references/elements/nodes/g6-node-image.md)：图片节点
- [`g6-node-diamond-ellipse-hexagon`](references/elements/nodes/g6-node-diamond-ellipse-hexagon.md)：菱形/椭圆/六边形
- [`g6-node-star-triangle-donut`](references/elements/nodes/g6-node-star-triangle-donut.md)：五角星/三角形/环形进度
- [`g6-node-html`](references/elements/nodes/g6-node-html.md)：HTML 富文本节点
- [`g6-node-react`](references/elements/nodes/g6-node-react.md)：React/Vue 自定义节点（@antv/g6-extension-react）

### Combo
- [`g6-combo-overview`](references/elements/combos/g6-combo-overview.md)：Combo 分组（circle/rect，折叠展开）

### 边类型
- [`g6-edge-line`](references/elements/edges/g6-edge-line.md)：直线边
- [`g6-edge-cubic`](references/elements/edges/g6-edge-cubic.md)：三次贝塞尔曲线边
- [`g6-edge-cubic-directional`](references/elements/edges/g6-edge-cubic-directional.md)：有向三次曲线（cubic-horizontal 水平 / cubic-vertical 垂直）
- [`g6-edge-polyline`](references/elements/edges/g6-edge-polyline.md)：折线边
- [`g6-edge-quadratic-loop`](references/elements/edges/g6-edge-quadratic-loop.md)：二次曲线与自环边

### 布局
- [`g6-layout-force`](references/layouts/g6-layout-force.md)：力导向（force/d3-force）
- [`g6-layout-dagre`](references/layouts/g6-layout-dagre.md)：层次/流程图（dagre）
- [`g6-layout-circular`](references/layouts/g6-layout-circular.md)：环形
- [`g6-layout-grid`](references/layouts/g6-layout-grid.md)：网格
- [`g6-layout-mindmap`](references/layouts/g6-layout-mindmap.md)：思维导图
- [`g6-layout-advanced`](references/layouts/g6-layout-advanced.md)：同心圆/辐射/mds/fruchterman
- [`g6-layout-combo-fishbone`](references/layouts/g6-layout-combo-fishbone.md)：复合布局（combo-combined）+ 鱼骨布局（fishbone）

### 数据变换
- [`g6-core-transforms-animation`](references/core/g6-core-transforms-animation.md)：map-node-size 与动画配置
- [`g6-transform-parallel-edges-radial`](references/transforms/g6-transform-parallel-edges-radial.md)：平行边处理（process-parallel-edges）+ 径向标签（place-radial-labels）

### 交互行为
- [`g6-behavior-click-select`](references/behaviors/g6-behavior-click-select.md)：点击选中
- [`g6-behavior-drag-element`](references/behaviors/g6-behavior-drag-element.md)：拖拽节点
- [`g6-behavior-canvas-nav`](references/behaviors/g6-behavior-canvas-nav.md)：画布拖拽+缩放
- [`g6-behavior-hover-activate`](references/behaviors/g6-behavior-hover-activate.md)：悬停激活
- [`g6-behavior-lasso-collapse`](references/behaviors/g6-behavior-lasso-collapse.md)：套索选择 + 折叠展开
- [`g6-behavior-create-edge-focus`](references/behaviors/g6-behavior-create-edge-focus.md)：创建边 + 聚焦元素
- [`g6-behavior-advanced`](references/behaviors/g6-behavior-advanced.md)：fix-element-size / auto-adapt-label / drag-element-force

### 插件
- [`g6-plugin-tooltip`](references/plugins/g6-plugin-tooltip.md)：悬停提示框
- [`g6-plugin-minimap`](references/plugins/g6-plugin-minimap.md)：缩略图
- [`g6-plugin-contextmenu-toolbar`](references/plugins/g6-plugin-contextmenu-toolbar.md)：右键菜单 + 工具栏
- [`g6-plugin-history-legend`](references/plugins/g6-plugin-history-legend.md)：撤销重做 + 图例
- [`g6-plugin-fisheye-hull-watermark`](references/plugins/g6-plugin-fisheye-hull-watermark.md)：鱼眼放大 + 轮廓包围 + 水印
- [`g6-plugin-timebar-gridline`](references/plugins/g6-plugin-timebar-gridline.md)：时间轴 + 网格线
- [`g6-plugin-background-snapline`](references/plugins/g6-plugin-background-snapline.md)：画布背景（background）+ 对齐线（snapline）
- [`g6-plugin-edge-bundling-bubble`](references/plugins/g6-plugin-edge-bundling-bubble.md)：边绑定（edge-bundling）+ 气泡集（bubble-sets）
- [`g6-plugin-fullscreen-title`](references/plugins/g6-plugin-fullscreen-title.md)：全屏（fullscreen）+ 图标题（title）

### 状态与主题
- [`g6-state-overview`](references/states/g6-state-overview.md)：元素状态系统
- [`g6-theme-overview`](references/themes/g6-theme-overview.md)：主题系统

### 场景模板
- [`g6-pattern-network-graph`](references/patterns/g6-pattern-network-graph.md)：网络关系图
- [`g6-pattern-tree-graph`](references/patterns/g6-pattern-tree-graph.md)：树形图/组织架构
- [`g6-pattern-flow-chart`](references/patterns/g6-pattern-flow-chart.md)：流程图
