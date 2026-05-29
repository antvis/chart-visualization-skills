---
id: "x6-core-node"
title: "X6 节点配置与自定义"
description: |
  X6 节点的创建、内置形状、样式配置、自定义节点注册。
  包含 rect/circle/polygon/html 等内置节点及自定义扩展方式。

library: "x6"
version: "3.x"
category: "core"
subcategory: "node"
tags:
  - "节点"
  - "node"
  - "shape"
  - "rect"
  - "circle"
  - "ellipse"
  - "polygon"
  - "html"
  - "自定义节点"
  - "注册节点"
  - "register"
  - "attrs"
  - "label"
  - "菱形"
  - "diamond"

related:
  - "x6-core-graph-init"
  - "x6-core-ports"
  - "x6-core-edge"

use_cases:
  - "添加矩形/圆形/椭圆节点"
  - "创建菱形判断节点"
  - "注册自定义形状"
  - "创建 HTML 富文本节点"
  - "设置节点样式和标签"
  - "动态修改节点属性"

anti_patterns:
  - "不要使用 CSS 属性名（用 SVG 属性）"
  - "不要遗漏 x/y 坐标"

difficulty: "beginner"
completeness: "full"
---

## 添加节点

```javascript
const node = graph.addNode({
  shape: 'rect',          // 形状类型
  x: 100,                 // 左上角 X 坐标
  y: 60,                  // 左上角 Y 坐标
  width: 120,             // 宽度
  height: 50,             // 高度
  label: 'Hello',         // 标签文本（简写）
  attrs: {                // SVG 属性
    body: {
      fill: '#fff',
      stroke: '#8f8f8f',
      strokeWidth: 1,
      rx: 6,              // 圆角 X
      ry: 6,              // 圆角 Y
    },
    label: {
      text: 'Hello',     // 等价于外层 label
      fontSize: 14,
      fill: '#333',
    },
  },
});
```

## 内置节点形状

### rect（矩形）— 最常用

```javascript
graph.addNode({
  shape: 'rect',
  x: 40, y: 40,
  width: 100, height: 40,
  label: 'Rect Node',
  attrs: {
    body: { fill: '#fff', stroke: '#8f8f8f', strokeWidth: 1, rx: 6, ry: 6 },
  },
});
```

### circle（圆形）

```javascript
graph.addNode({
  shape: 'circle',
  x: 200, y: 100,
  width: 60, height: 60,   // 圆形时 width = height = 直径
  label: 'Start',
  attrs: {
    body: { fill: '#f6ffed', stroke: '#52c41a', strokeWidth: 2 },
  },
});
```

### ellipse（椭圆）

```javascript
graph.addNode({
  shape: 'ellipse',
  x: 100, y: 100,
  width: 120, height: 60,
  label: 'Ellipse',
  attrs: {
    body: { fill: '#e6f7ff', stroke: '#1890ff', strokeWidth: 1 },
  },
});
```

### polygon（多边形 / 菱形）

```javascript
// 菱形（判断节点）
Graph.registerNode('diamond', {
  inherit: 'polygon',
  width: 80,
  height: 80,
  attrs: {
    body: {
      refPoints: '0,10 10,0 20,10 10,20',  // 菱形顶点
      fill: '#fff',
      stroke: '#8f8f8f',
      strokeWidth: 1,
    },
  },
}, true);

graph.addNode({ shape: 'diamond', x: 200, y: 100, label: 'Decision?' });
```

### text（纯文本）

```javascript
graph.addNode({
  shape: 'text',
  x: 100, y: 100,
  attrs: {
    text: { text: 'Annotation', fontSize: 14, fill: '#666' },
  },
});
```

### image（图片节点）

```javascript
graph.addNode({
  shape: 'image',
  x: 100, y: 100,
  width: 60, height: 60,
  imageUrl: 'https://example.com/icon.png',
});
```

## HTML 自定义节点

```javascript
import { Graph, Shape } from '@antv/x6';

Shape.HTML.register({
  shape: 'custom-html',
  width: 180,
  height: 80,
  effect: ['data'],      // 当 data 变化时重新渲染
  html(cell) {
    const data = cell.getData() || {};
    const div = document.createElement('div');
    div.style.cssText = 'width:100%;height:100%;border:1px solid #8f8f8f;border-radius:4px;background:#fff;';
    div.innerHTML = `<div style="padding:8px;font-size:12px;">${data.title || 'Node'}</div>`;
    return div;
  },
});

graph.addNode({
  shape: 'custom-html',
  x: 100, y: 100,
  data: { title: 'My HTML Node' },
});
```

## 注册自定义节点

```javascript
Graph.registerNode('my-rect', {
  inherit: 'rect',           // 继承内置 rect
  width: 120,                // 默认宽度
  height: 50,                // 默认高度
  attrs: {
    body: { fill: '#e6f7ff', stroke: '#1890ff', strokeWidth: 2, rx: 8, ry: 8 },
    label: { fontSize: 14, fill: '#333' },
  },
  ports: {                   // 默认端口配置
    groups: {
      in: { position: 'top', attrs: { circle: { magnet: true, r: 5, stroke: '#1890ff' } } },
      out: { position: 'bottom', attrs: { circle: { magnet: true, r: 5, stroke: '#1890ff' } } },
    },
  },
}, true);  // true 表示覆盖已有同名注册

graph.addNode({ shape: 'my-rect', x: 100, y: 80, label: 'Custom' });
```

## 动态修改节点

```javascript
// 修改位置
node.setPosition(200, 100);

// 修改大小
node.setSize(160, 60);

// 修改属性
node.attr('body/fill', '#e6f7ff');
node.attr('label/text', 'Updated');

// 修改数据
node.setData({ status: 'running' });

// 获取信息
const { x, y } = node.getPosition();
const { width, height } = node.getSize();
const data = node.getData();
```

## 节点 ID

```javascript
// 指定 ID
graph.addNode({ id: 'node-1', shape: 'rect', x: 40, y: 40, width: 100, height: 40 });

// 通过 ID 获取节点
const node = graph.getCellById('node-1');

// 不指定 ID 则自动生成 UUID
const node2 = graph.addNode({ shape: 'rect', x: 200, y: 40, width: 100, height: 40 });
console.log(node2.id); // 自动生成的 UUID
```

## 节点层级

```javascript
// 设置 zIndex
graph.addNode({ shape: 'rect', x: 40, y: 40, width: 100, height: 40, zIndex: 10 });

// 动态调整
node.toFront();   // 置顶
node.toBack();    // 置底
```

## 常见错误与修正

### 错误 1：节点拖拽范围限制

错误示例（使用事件手动限制）：

```javascript
// ❌ 错误做法：使用 node:move 事件手动限制
graph.on('node:move', ({ node }) => {
  const boundary = { x: 100, y: 100, width: 600, height: 400 };
  const nodeBBox = node.getBBox();
  let x = nodeBBox.x;
  let y = nodeBBox.y;

  if (x < boundary.x) x = boundary.x;
  if (y < boundary.y) y = boundary.y;
  if (x + nodeBBox.width > boundary.x + boundary.width) {
    x = boundary.x + boundary.width - nodeBBox.width;
  }
  if (y + nodeBBox.height > boundary.y + boundary.height) {
    y = boundary.y + boundary.height - nodeBBox.height;
  }

  if (x !== nodeBBox.x || y !== nodeBBox.y) {
    node.position(x, y);
  }
});
```

正确做法（使用 `translating.restrict` 配置）：

```javascript
// ✅ 正确做法：使用 graph 配置项
const graph = new Graph({
  container: 'container',
  width: 600,
  height: 400,
  translating: {
    restrict: {
      x: 0,
      y: 0,
      width: 600,
      height: 400,
    },
  },
});
```

### 错误 2：节点嵌套关系处理

错误示例（使用 parent 属性）：

```javascript
// ❌ 错误做法：通过 parent 字段设置嵌套关系
graph.addNode({
  id: 'child1',
  shape: 'rect',
  label: 'Child 1',
  x: 100,
  y: 160,
  width: 80,
  height: 40,
  parent: 'innerGroup',
});
```

正确做法（使用 `addChild` 方法）：

```javascript
// ✅ 正确做法：使用 addChild 方法建立父子关系
const outerGroup = graph.addNode({ shape: 'rect', x: 40, y: 40, width: 400, height: 240 });
const innerGroup = graph.addNode({ shape: 'rect', x: 80, y: 100, width: 200, height: 140 });
const child1 = graph.addNode({ shape: 'rect', x: 100, y: 160, width: 80, height: 40 });

outerGroup.addChild(innerGroup);
innerGroup.addChild(child1);
```

### 错误 3：边连接点配置

错误示例（在 graph 配置中设置但未生效）：

```javascript
// ❌ 错误做法：connectionPoint 设置不完整
const graph = new Graph({
  container: 'container',
  connecting: {
    connectionPoint: 'boundary', // 只设置了连接点类型，缺少创建边的配置
  },
});
```

正确做法（完整配置）：

```javascript
// ✅ 正确做法：完整配置连接点和创建边的行为
const graph = new Graph({
  container: 'container',
  connecting: {
    connectionPoint: 'boundary',
    createEdge() {
      return this.createEdge({
        attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } },
      });
    },
  },
});
```

### 错误 4：节点垂直方向拖拽限制

错误示例（使用复杂事件处理）：

```javascript
// ❌ 错误做法：使用复杂的事件处理逻辑
graph.on('node:mousemove', ({ node }) => {
  const nodeId = node.id;
  const nodeY = node.position().y;
  const nodes = graph.getNodes();
  
  nodes.sort((a, b) => a.position().y - b.position().y);
  
  const currentIndex = nodes.findIndex(n => n.id === nodeId);
  let newIndex = currentIndex;
  
  for (let i = 0; i < nodes.length; i++) {
    if (i !== currentIndex) {
      const otherNode = nodes[i];
      const otherY = otherNode.position().y;
      if (nodeY < otherY && currentIndex > i) {
        newIndex = i;
        break;
      } else if (nodeY > otherY && currentIndex < i) {
        newIndex = i;
      }
    }
  }
  
  if (newIndex !== currentIndex) {
    nodes.splice(currentIndex, 1);
    nodes.splice(newIndex, 0, node);
    
    nodes.forEach((n, index) => {
      n.position(100, 20 + index * 60);
    });
  }
});
```

正确做法（使用 `translating.restrict` 限制移动方向）：

```javascript
// ✅ 正确做法：使用 translating.restrict 限制节点只能垂直移动
const graph = new Graph({
  container: 'container',
  translating: {
    restrict(cellView) {
      const cell = cellView.cell;
      const bbox = cell.getBBox();
      return { x: 100, y: 0, width: 1, height: 400 };
    },
  },
});
```

### 错误 5：边连接器配置不生效

错误示例（边连接器配置不正确）：

```javascript
// ❌ 错误做法：在 graph 配置中设置但未在边中生效
const graph = new Graph({
  container: 'container',
  connecting: {
    router: 'manhattan',
    connector: {
      name: 'smooth',
    },
  },
});
```

正确做法（在边中显式指定连接器）：

```javascript
// ✅ 正确做法：在添加边时显式指定 connector
const edge = graph.addEdge({
  source: node1,
  target: node2,
  connector: 'smooth',
  attrs: {
    line: {
      stroke: '#8f8f8f',
      strokeWidth: 1,
    }
  }
});
```

### 错误 6：节点 parent 属性无法正确嵌套

错误示例（使用 parent 属性设置嵌套关系）：

```javascript
// ❌ 错误做法：直接使用 parent 属性
graph.addNode({
  id: 'child1',
  shape: 'rect',
  label: 'Child 1',
  x: 100,
  y: 160,
  width: 80,
  height: 40,
  parent: 'innerGroup',
});
```

正确做法（使用 addChild 方法）：

```javascript
// ✅ 正确做法：使用 addChild 方法建立父子关系
const outerGroup = graph.addNode({ shape: 'rect', x: 40, y: 40, width: 400, height: 240 });
const innerGroup = graph.addNode({ shape: 'rect', x: 80, y: 100, width: 200, height: 140 });
const child1 = graph.addNode({ shape: 'rect', x: 100, y: 160, width: 80, height: 40 });

outerGroup.addChild(innerGroup);
innerGroup.addChild(child1);
```

### 错误 7：节点拖拽范围限制不准确

错误示例（使用复杂事件处理）：

```javascript
// ❌ 错误做法：使用复杂的事件处理逻辑
graph.on('node:mousemove', ({ node }) => {
  const position = node.position();
  const size = node.size();
  
  let newX = position.x;
  let newY = position.y;
  
  if (position.x < 0) newX = 0;
  if (position.y < 0) newY = 0;
  if (position.x + size.width > 600) newX = 600 - size.width;
  if (position.y + size.height > 400) newY = 400 - size.height;
  
  if (newX !== position.x || newY !== position.y) {
    node.position(newX, newY);
  }
});
```

正确做法（使用 `translating.restrict` 配置）：

```javascript
// ✅ 正确做法：使用 translating.restrict 配置
const graph = new Graph({
  container: 'container',
  translating: {
    restrict: {
      x: 0,
      y: 0,
      width: 600,
      height: 400,
    },
  },
});
```

### 错误 8：边连接器使用 smooth 时未正确配置

错误示例（边连接器配置不正确）：

```javascript
// ❌ 错误做法：在 graph 配置中设置但未在边中生效
const graph = new Graph({
  container: 'container',
  connecting: {
    router: 'manhattan',
    connector: {
      name: 'smooth',
    },
  },
});
```

正确做法（在边中显式指定连接器）：

```javascript
// ✅ 正确做法：在添加边时显式指定 connector
const edge = graph.addEdge({
  source: node1,
  target: node2,
  connector: 'smooth',
  attrs: {
    line: {
      stroke: '#8f8f8f',
      strokeWidth: 1,
    }
  }
});
```

### 错误 9：使用 graph.render() 导致报错

错误示例（调用 graph.render() 方法）：

```javascript
// ❌ 错误做法：调用 graph.render()
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});

graph.render(); // 报错：graph.render is not a function
```

正确做法（无需调用 graph.render()）：

```javascript
// ✅ 正确做法：无需调用 graph.render()
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});
```

### 错误 10：在代码中声明 `const container`

`container` 变量由运行环境自动注入，**禁止**在代码中重复声明，否则报 `Identifier 'container' has already been declared`。

```javascript
// ❌ 错误做法：重复声明 container 变量
const container = document.getElementById('container');
const graph = new Graph({ container });

// ✅ 正确做法：直接使用字符串 'container'
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});
```

### 错误 11：使用未注册的自定义边 shape

**⚠️ 关键约束：禁止使用未经 `Graph.registerEdge()` 注册的自定义边 shape 名称。**

X6 内置的边 shape 只有 `'edge'` 和 `'double-edge'`。如果需要自定义边样式，**不要发明新的 shape 名称**，而是在 `attrs` 中配置样式即可：

```javascript
// ❌ 错误：使用未注册的 shape 名称 → 报错 "Edge with name 'xxx' does not exist"
graph.addEdge({
  shape: 'my-custom-edge',  // 未注册，会报错！
  source: 'node1',
  target: 'node2',
});

// ✅ 正确方式 1：使用内置 'edge' shape + 自定义 attrs
graph.addEdge({
  shape: 'edge',
  source: 'node1',
  target: 'node2',
  attrs: {
    line: {
      stroke: '#1890ff',
      strokeWidth: 3,
      strokeDasharray: '5 5',
      targetMarker: 'classic',
    },
  },
});

// ✅ 正确方式 2：先注册再使用
Graph.registerEdge(
  'my-custom-edge',
  {
    inherit: 'edge',
    attrs: {
      line: { stroke: '#1890ff', strokeWidth: 3, targetMarker: 'classic' },
    },
  },
  true,
);
// 注册后才能使用
graph.addEdge({ shape: 'my-custom-edge', source: 'node1', target: 'node2' });
```

**内置可用的边 shape：** `'edge'`、`'double-edge'`。其他所有 shape 名称必须先通过 `Graph.registerEdge()` 注册。

### 错误 12：节点数据格式错误

错误示例（节点数据格式错误）：

```javascript
// ❌ 错误做法：节点数据格式错误
const data = [
  { shape: 'rect', x: 100, y: 20, width: 200, height: 44, label: 'Item 1' },
  { shape: 'rect', x: 10  shape: 'rect', x: 100, y: 140, width: 200, height: 44, label: 'Item 4' },
  { shape: 'rect', x: 100, y: 184, width: 200, height: 44, label: 'Item 5' },
];
```

正确做法（节点数据格式正确）：

```javascript
// ✅ 正确做法：节点数据格式正确
const data = [
  { shape: 'rect', x: 100, y: 20, width: 200, height: 44, label: 'Item 1' },
  { shape: 'rect', x: 100, y: 80, width: 200, height: 44, label: 'Item 2' },
  { shape: 'rect', x: 100, y: 140, width: 200, height: 44, label: 'Item 3' },
  { shape: 'rect', x: 100, y: 200, width: 200, height: 44, label: 'Item 4' },
  { shape: 'rect', x: 100, y: 260, width: 200, height: 44, label: 'Item 5' },
];
```

### 错误 13：使用不存在的 graph.highlightNode() / graph.highlightCell() 方法

**⚠️ X6 没有 `graph.highlightNode()` 和 `graph.highlightCell()` 方法。**

```javascript
// ❌ 错误：这些方法都不存在
graph.highlightNode(node);   // TypeError
graph.highlightCell(cell);   // TypeError

// ✅ 正确方式 1：通过 node.attr() 修改样式实现高亮
const neighbors = graph.getNeighbors(centerNode);
neighbors.forEach((node) => {
  node.attr('body/fill', '#d9f7be');
  node.attr('body/stroke', '#52c41a');
  node.attr('body/strokeWidth', 2);
});

// ✅ 正确方式 2：通过 CSS class 实现高亮（需配合样式表）
neighbors.forEach((node) => {
  const view = graph.findViewByCell(node);
  if (view) view.addClass('highlighted');
});
```

### 错误 14：SVG 渐变定义语法错误

**⚠️ X6 没有 `graph.defs` 属性，禁止使用 `document.createElementNS` 手动创建 SVG 渐变元素。**

```javascript
// ❌ 错误：graph.defs 不存在，且 `graph.svg defs()` 是语法错误
const gradientId = 'gradient-blue-green';
const defs = graph.defs;  // undefined
// 或
const svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'); // 不要这样做
```

正确做法（使用 attrs.fill 配置渐变）：

```javascript
// ✅ 正确做法：使用 attrs.fill 配置渐变
graph.addNode({
  shape: 'rect',
  x: 100,
  y: 60,
  width: 160,
  height: 80,
  label: 'Gradient Node',
  attrs: {
    body: {
      fill: {
        type: 'linearGradient',
        stops: [
          { offset: '0%', color: '#1890ff' },
          { offset: '100%', color: '#52c41a' },
        ],
      },
      stroke: '#8f8f8f',
      strokeWidth: 1,
      rx: 6,
      ry: 6,
    },
    label: {
      fill: '#fff',
      fontSize: 14,
    },
  },
});
```