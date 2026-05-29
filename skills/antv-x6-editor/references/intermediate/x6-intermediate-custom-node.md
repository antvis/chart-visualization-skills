---
id: "x6-intermediate-custom-node"
title: "X6 自定义节点"
description: |
  X6 自定义节点完整指南：Graph.registerNode 注册自定义 SVG 节点、Shape.HTML.register 注册 HTML 节点。
  包含 markup/attrs 定制、继承内置节点、HTML 节点渲染与更新、effect 响应式。

library: "x6"
version: "3.x"
category: "intermediate"
subcategory: "custom-node"
tags:
  - "自定义节点"
  - "registerNode"
  - "Graph.registerNode"
  - "Shape.HTML.register"
  - "HTML 节点"
  - "markup"
  - "attrs"
  - "inherit"
  - "foreignObject"
  - "shape"
  - "effect"
  - "自定义形状"
  - "Shape.Group"
  - "分组节点"
  - "父子节点"
  - "embed"
  - "addChild"
  - "box-sizing"
  - "font-size"
  - "Invalid left-hand side"
  - "style 属性"
  - "驼峰"

related:
  - "x6-core-node"
  - "x6-core-graph-init"
  - "x6-intermediate-tools"

use_cases:
  - "注册自定义 SVG 节点形状"
  - "使用 HTML/DOM 渲染复杂节点内容"
  - "继承内置节点并扩展"
  - "实现数据驱动的响应式 HTML 节点"
  - "复用自定义节点配置"

anti_patterns:
  - "不要在 HTML 节点中使用 position:absolute/relative/transform/opacity（可能导致渲染异常）"
  - "不要忘记设置 effect 字段，否则 HTML 节点不会响应 data 变化"
  - "不要使用 Shape.Group / Shape.Group.define / new Shape.Group，X6 3.x 的 Shape 命名空间没有 Group"
  - "不要在 html() 回调里用 el.style.box-sizing / el.style.font-size 等连字符属性，必须用驼峰或方括号写法"
---

# X6 自定义节点

## 方式一：Graph.registerNode（SVG 节点）

通过 `markup`（结构）和 `attrs`（样式）定制节点外观，然后注册为自定义 shape。

### 基本注册

```javascript
import { Graph } from '@antv/x6';

Graph.registerNode(
  'custom-rect',
  {
    inherit: 'rect',  // 继承内置 rect 节点
    width: 120,
    height: 50,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#1890ff',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      },
      label: {
        fontSize: 14,
        fill: '#333',
      },
    },
  },
  true, // 覆盖同名注册
);

// 使用自定义节点
const graph = new Graph({ container: 'container', width: 800, height: 600 });

graph.addNode({
  shape: 'custom-rect',
  x: 100,
  y: 100,
  label: 'Custom Node',
});
```

### 自定义 Markup（多元素节点）

```javascript
Graph.registerNode(
  'status-node',
  {
    inherit: 'rect',
    width: 160,
    height: 60,
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'circle', selector: 'statusIndicator' },
      { tagName: 'text', selector: 'label' },
      { tagName: 'text', selector: 'description' },
    ],
    attrs: {
      body: {
        refWidth: '100%',
        refHeight: '100%',
        fill: '#fff',
        stroke: '#d9d9d9',
        strokeWidth: 1,
        rx: 6,
        ry: 6,
      },
      statusIndicator: {
        r: 5,
        cx: 15,
        cy: 15,
        fill: '#52c41a',  // 绿色=正常
      },
      label: {
        refX: 30,
        refY: 15,
        fontSize: 14,
        fill: '#333',
        textAnchor: 'start',
        textVerticalAnchor: 'middle',
        text: 'Node',
      },
      description: {
        refX: 15,
        refY: 40,
        fontSize: 12,
        fill: '#999',
        textAnchor: 'start',
        textVerticalAnchor: 'middle',
        text: 'Description',
      },
    },
  },
  true,
);

graph.addNode({
  shape: 'status-node',
  x: 100,
  y: 100,
  attrs: {
    label: { text: '数据处理' },
    description: { text: 'ETL Pipeline' },
    statusIndicator: { fill: '#52c41a' },
  },
});
```

### 菱形判断节点（polygon）

```javascript
Graph.registerNode(
  'decision-node',
  {
    inherit: 'polygon',
    width: 80,
    height: 80,
    attrs: {
      body: {
        refPoints: '0,10 10,0 20,10 10,20',  // 菱形顶点
        fill: '#fff',
        stroke: '#faad14',
        strokeWidth: 2,
      },
      label: {
        fontSize: 12,
        fill: '#333',
        refX: 0.5,
        refY: 0.5,
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
    },
  },
  true,
);
```

## 方式二：Shape.HTML.register（HTML 节点）

使用 HTML/DOM 渲染复杂节点内容（表格、图表、富文本等），基于 SVG `foreignObject` 实现。

### 基本用法

```javascript
import { Graph, Shape } from '@antv/x6';

Shape.HTML.register({
  shape: 'custom-html',
  width: 200,
  height: 80,
  html() {
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.background = '#fff';
    div.style.border = '1px solid #d9d9d9';
    div.style.borderRadius = '8px';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.fontSize = '14px';
    div.style.color = '#333';
    div.textContent = 'HTML Node';
    return div;
  },
});

const graph = new Graph({ container: 'container', width: 800, height: 600 });

graph.addNode({
  shape: 'custom-html',
  x: 100,
  y: 100,
});
```

### 响应式 HTML 节点（data 驱动更新）

通过 `effect` 字段声明依赖的属性，当这些属性变化时自动重新调用 `html()` 方法更新 DOM。

```javascript
import { Graph, Shape, Dom } from '@antv/x6';

Shape.HTML.register({
  shape: 'data-card',
  width: 200,
  height: 100,
  effect: ['data'],  // 监听 data 变化
  html(cell) {
    const { title, status, progress } = cell.getData() || {};
    const div = document.createElement('div');
    Dom.css(div, {
      width: '100%',
      height: '100%',
      background: '#fff',
      border: '1px solid #d9d9d9',
      borderRadius: '8px',
      padding: '12px',
      boxSizing: 'border-box',
      fontFamily: 'Arial, sans-serif',
    });
    div.innerHTML = `
      <div style="font-size:14px;font-weight:bold;color:#333">${title || 'Untitled'}</div>
      <div style="font-size:12px;color:#999;margin-top:4px">Status: ${status || 'pending'}</div>
      <div style="margin-top:8px;height:6px;background:#f0f0f0;border-radius:3px">
        <div style="width:${(progress || 0) * 100}%;height:100%;background:#1890ff;border-radius:3px"></div>
      </div>
    `;
    return div;
  },
});

const graph = new Graph({ container: 'container', width: 800, height: 600 });

const node = graph.addNode({
  shape: 'data-card',
  x: 100,
  y: 100,
  data: { title: '数据清洗', status: 'running', progress: 0.6 },
});

// 更新 data 后节点自动刷新
node.setData({ title: '数据清洗', status: 'completed', progress: 1.0 });
```

### ER 图表格式节点

```javascript
Shape.HTML.register({
  shape: 'er-table',
  width: 200,
  height: 150,
  effect: ['data'],
  html(cell) {
    const { tableName, fields } = cell.getData() || {};
    const div = document.createElement('div');
    Dom.css(div, {
      width: '100%',
      height: '100%',
      background: '#fff',
      border: '1px solid #5B8FF9',
      borderRadius: '4px',
      overflow: 'hidden',
      fontFamily: 'monospace',
      fontSize: '12px',
    });
    const header = `<div style="background:#5B8FF9;color:#fff;padding:6px 8px;font-weight:bold">${tableName || 'table'}</div>`;
    const rows = (fields || [])
      .map((f) => `<div style="padding:4px 8px;border-bottom:1px solid #f0f0f0">${f.name}: <span style="color:#999">${f.type}</span></div>`)
      .join('');
    div.innerHTML = header + rows;
    return div;
  },
});

graph.addNode({
  shape: 'er-table',
  x: 100,
  y: 100,
  data: {
    tableName: 'users',
    fields: [
      { name: 'id', type: 'int' },
      { name: 'name', type: 'varchar' },
      { name: 'email', type: 'varchar' },
    ],
  },
});
```

## 配合连接桩（Ports）

自定义节点可以搭配 ports 使用：

```javascript
graph.addNode({
  shape: 'custom-rect',
  x: 100,
  y: 100,
  label: 'With Ports',
  ports: {
    groups: {
      in: {
        position: 'left',
        attrs: { circle: { r: 5, magnet: true, stroke: '#8f8f8f', fill: '#fff' } },
      },
      out: {
        position: 'right',
        attrs: { circle: { r: 5, magnet: true, stroke: '#8f8f8f', fill: '#fff' } },
      },
    },
    items: [
      { id: 'in-1', group: 'in' },
      { id: 'out-1', group: 'out' },
    ],
  },
});
```

## 常见错误

### ❌ `Shape.Group` / `Shape.Group.define()` 不存在

X6 3.x 的 `Shape` 命名空间**只导出**：`Circle / Edge / Ellipse / HTML / Image / Path / Polygon / Polyline / Rect / TextBlock`。**没有 `Group`**。下面写法运行时全部抛 `Cannot read properties of undefined (reading 'define')` / `Shape.Group is not a constructor`：

```javascript
// ❌
Shape.Group.define({ shape: 'dept-group', ... });
new Shape.Group({ ... });
import { Group } from '@antv/x6'; // ❌ 主包也没有 Group 导出
```

**父子分组 / 容器节点的正确做法（三选一）：**

```javascript
// 1) 直接用普通 rect 当父节点，通过 embed / addChild 建立父子关系
const parent = graph.addNode({ shape: 'rect', x: 40, y: 40, width: 300, height: 200, label: '部门', attrs: { body: { fill: '#f5f5f5', stroke: '#999' } } });
const child  = graph.addNode({ shape: 'rect', x: 80, y: 90, width: 100, height: 40, label: '员工A' });
parent.addChild(child);            // 维护父子关系
// 或：parent.embed(child)         // 嵌入（依赖 Graph 的 embedding 配置）

// 2) 注册一个自定义分组形状再用
Graph.registerNode('dept-group', {
  inherit: 'rect',
  width: 300, height: 200,
  attrs: {
    body: { fill: '#f5f5f5', stroke: '#999', strokeDasharray: '4,2' },
    label: { refX: 8, refY: 8, textAnchor: 'start', textVerticalAnchor: 'top' },
  },
});
graph.addNode({ shape: 'dept-group', x: 40, y: 40, label: '部门' });

// 3) 需要 Embedding 嵌入交互时，在 Graph 构造选项里开启（不是插件！）
const graph = new Graph({
  container: 'container',
  embedding: { enabled: true, findParent: 'bbox', frontOnly: false },
});
```

> 同样不存在的还有 `Shape.Cylinder` / `Shape.Diamond` / `Shape.Cloud` 等。需要异形节点时，要么用 `'polygon'` + 自定义 `points`，要么用 `Graph.registerNode` + 自定义 `markup`。

### ❌ HTML 节点 `el.style.box-sizing = '...'` 抛 Invalid left-hand side

在 `Shape.HTML.register` 的 `html(node)` 回调或任何 DOM 操作里，**禁止**直接给 `style` 写连字符属性名——JS 会把 `style.box-sizing` 解析成 `style.box - sizing`（减法表达式）然后报 `Uncaught SyntaxError: Invalid left-hand side in assignment`，整段脚本拒绝执行：

```javascript
// ❌ 全部会抛 Invalid left-hand side in assignment
html() {
  const wrap = document.createElement('div');
  wrap.style.box-sizing      = 'border-box';
  wrap.style.font-size       = '14px';
  wrap.style.background-color= '#fff';
  wrap.style.border-radius   = '8px';
  return wrap;
}
```

**正确写法（任选其一，推荐前两种）：**

```javascript
// 1) 驼峰
wrap.style.boxSizing       = 'border-box';
wrap.style.fontSize        = '14px';
wrap.style.backgroundColor = '#fff';
wrap.style.borderRadius    = '8px';

// 2) 方括号（保留连字符）
wrap.style['box-sizing']     = 'border-box';
wrap.style['font-size']      = '14px';
wrap.style['background-color']= '#fff';
wrap.style['border-radius']  = '8px';

// 3) cssText 一次性写
wrap.style.cssText = 'box-sizing:border-box;font-size:14px;background:#fff;border-radius:8px;';

// 4) Object.assign 批量赋值
Object.assign(wrap.style, {
  boxSizing: 'border-box', fontSize: '14px',
  backgroundColor: '#fff', borderRadius: '8px',
});
```

### ❌ HTML 节点使用 position:absolute 导致渲染异常

```javascript
// 错误：foreignObject 内使用 absolute 定位可能导致显示不全
html() {
  const div = document.createElement('div');
  div.style.position = 'absolute';  // ❌ 可能导致渲染异常
  return div;
}

// 正确：使用 flex 或 normal flow 布局
html() {
  const div = document.createElement('div');
  div.style.display = 'flex';  // ✅
  return div;
}
```

### ❌ 忘记设置 effect 导致节点不更新

```javascript
// 错误：修改 data 后节点不刷新
Shape.HTML.register({
  shape: 'my-node',
  html(cell) {
    const { value } = cell.getData();
    // ...
  },
  // 缺少 effect: ['data']
});

// 正确：声明 effect
Shape.HTML.register({
  shape: 'my-node',
  effect: ['data'],  // ✅ 监听 data 变化
  html(cell) {
    const { value } = cell.getData();
    // ...
  },
});
```

### ❌ registerNode 未设置第三个参数导致重复注册报错

```javascript
// 错误：重复注册时报错
Graph.registerNode('my-node', { ... });
Graph.registerNode('my-node', { ... }); // Error: already registered

// 正确：第三个参数传 true 允许覆盖
Graph.registerNode('my-node', { ... }, true);
```
