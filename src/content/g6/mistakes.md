## 错误模式

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
const graph = new Graph({ });

// 正确：container 必填，值为字符串 ID 或 DOM 元素
const graph = new Graph({ container: 'container' });
// 或传入 DOM 元素
const graph = new Graph({ container: document.getElementById('container') });
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
