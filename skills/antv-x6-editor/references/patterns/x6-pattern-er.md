---
id: "x6-pattern-er"
title: "X6 ER 实体关系图"
description: |
  使用 X6 构建 ER 实体关系图的最佳实践。
  适用于数据库建模、表结构可视化等场景。

library: "x6"
version: "3.x"
category: "patterns"
subcategory: "er"
tags:
  - "ER图"
  - "实体关系"
  - "数据库"
  - "表结构"
  - "字段"
  - "HTML节点"
  - "er router"

related:
  - "x6-core-node"
  - "x6-core-edge"
  - "x6-plugins"

use_cases:
  - "数据库表结构可视化"
  - "实体关系建模"
  - "表字段和关联展示"

difficulty: "intermediate"
completeness: "full"
---

## ⚠️ 关键约束（必须遵守）

1. **必须先调用 `Shape.HTML.register()` 注册 `er-entity` 节点，再创建 Graph 实例和添加节点**
2. **`Shape.HTML.register()` 中的 `html(cell)` 函数必须返回一个有效的 DOM 元素**（不能返回 HTML 字符串）
3. **容器使用字符串 `'container'`**，禁止 `document.getElementById('container')`
4. **禁止调用 `graph.render()`** — X6 自动渲染
5. **禁止调用 `graph.dispose()`** — 会导致白屏

## ER 图核心特征

- **表格式节点**：使用 HTML 节点展示表名 + 字段列表
- **关系边**：1:1、1:N、N:M 标注
- **ER 路由器**：`router: 'er'` 专用路由，避免边穿过节点

## HTML 实体节点注册

```javascript
import { Graph, Shape } from '@antv/x6';

Shape.HTML.register({
  shape: 'er-entity',
  width: 200,
  height: 120,
  effect: ['data'],
  html(cell) {
    const data = cell.getData() || {};
    const div = document.createElement('div');
    div.style.cssText = 'width:100%;height:100%;border:1px solid #8f8f8f;border-radius:4px;overflow:hidden;font-size:12px;background:#fff;';

    const header = `<div style="background:#1890ff;color:#fff;padding:6px 8px;font-weight:bold;">${data.name || 'Table'}</div>`;
    const fields = (data.fields || []).map(f =>
      `<div style="padding:4px 8px;border-top:1px solid #eee;">
        <span>${f.name}</span>
        <span style="color:#999;float:right">${f.type}</span>
        ${f.pk ? '<span style="color:#fa8c16;margin-left:4px">PK</span>' : ''}
        ${f.fk ? '<span style="color:#1890ff;margin-left:4px">FK</span>' : ''}
      </div>`
    ).join('');

    div.innerHTML = header + '<div style="max-height:200px;overflow-y:auto">' + fields + '</div>';
    return div;
  },
});
```

## 完整 ER 图示例

```javascript
import { Graph, Shape } from '@antv/x6';

// 注册 ER 实体节点（同上）
Shape.HTML.register({ shape: 'er-entity', width: 200, height: 120, effect: ['data'], html(cell) { /* ... */ } });

const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
  panning: true,
  mousewheel: { enabled: true, modifiers: 'ctrl' },
});

// 用户表
const userTable = graph.addNode({
  shape: 'er-entity',
  x: 40, y: 60,
  data: {
    name: 'User',
    fields: [
      { name: 'id', type: 'INT', pk: true },
      { name: 'name', type: 'VARCHAR(100)' },
      { name: 'email', type: 'VARCHAR(200)' },
      { name: 'created_at', type: 'DATETIME' },
    ],
  },
});

// 订单表
const orderTable = graph.addNode({
  shape: 'er-entity',
  x: 360, y: 40,
  data: {
    name: 'Order',
    fields: [
      { name: 'id', type: 'INT', pk: true },
      { name: 'user_id', type: 'INT', fk: true },
      { name: 'product_id', type: 'INT', fk: true },
      { name: 'amount', type: 'DECIMAL(10,2)' },
      { name: 'status', type: 'VARCHAR(20)' },
    ],
  },
});

// 商品表
const productTable = graph.addNode({
  shape: 'er-entity',
  x: 360, y: 240,
  data: {
    name: 'Product',
    fields: [
      { name: 'id', type: 'INT', pk: true },
      { name: 'name', type: 'VARCHAR(200)' },
      { name: 'price', type: 'DECIMAL(10,2)' },
      { name: 'category_id', type: 'INT', fk: true },
    ],
  },
});

// 关系边
graph.addEdge({
  source: userTable, target: orderTable,
  label: '1:N',
  router: 'er',
  connector: 'rounded',
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } },
});

graph.addEdge({
  source: productTable, target: orderTable,
  label: '1:N',
  router: 'er',
  connector: 'rounded',
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } },
});
```

## 关系类型标注

```javascript
// 1:1 关系
graph.addEdge({ source: tableA, target: tableB, label: '1:1', router: 'er' });

// 1:N 关系
graph.addEdge({ source: tableA, target: tableB, label: '1:N', router: 'er' });

// N:M 关系（通常通过中间表）
graph.addEdge({ source: tableA, target: middleTable, label: 'N', router: 'er' });
graph.addEdge({ source: tableB, target: middleTable, label: 'M', router: 'er' });
```

## 动态调整高度

实体节点高度应随字段数量自适应：

```javascript
function createEntityNode(graph, config) {
  const { x, y, name, fields } = config;
  const headerHeight = 30;
  const fieldHeight = 28;
  const height = headerHeight + fields.length * fieldHeight;

  return graph.addNode({
    shape: 'er-entity',
    x, y,
    width: 200,
    height,
    data: { name, fields },
  });
}
```

## 常见错误与修正

### 错误：使用普通节点而非 HTML 节点导致渲染失败

**错误示例：**
```javascript
// 错误：试图用 rect 节点模拟 ER 表结构，导致结构复杂且无法正确渲染
graph.createNode({
  shape: 'rect',
  x: 40,
  y: 60,
  width: 200,
  height: 120,
  children: [/* 复杂的子元素结构 */]
});
```

**修正方法：**
```javascript
// 正确：使用 Shape.HTML.register 注册自定义 HTML 节点
Shape.HTML.register({
  shape: 'er-entity',
  width: 200,
  height: 120,
  effect: ['data'],
  html(cell) {
    const data = cell.getData() || {};
    const div = document.createElement('div');
    div.style.cssText = 'width:100%;height:100%;border:1px solid #8f8f8f;border-radius:4px;overflow:hidden;font-size:12px;background:#fff;';
    const header = '<div style="background:#1890ff;color:#fff;padding:6px 8px;font-weight:bold;">' + (data.name || 'Entity') + '</div>';
    const fields = (data.fields || []).map(f => '<div style="padding:4px 8px;border-top:1px solid #eee;">' + f.name + ' <span style="color:#999">' + f.type + '</span></div>').join('');
    div.innerHTML = header + fields;
    return div;
  },
});

// 然后直接添加节点
graph.addNode({
  shape: 'er-entity',
  x: 40,
  y: 60,
  data: {
    name: 'User',
    fields: [
      { name: 'id', type: 'INT PK' },
      { name: 'name', type: 'VARCHAR' },
    ],
  },
});
```

### 错误：边未使用 router: 'er' 导致布局混乱

**错误示例：**
```javascript
// 错误：未指定 router，边可能穿过节点
graph.addEdge({
  source: tableA,
  target: tableB,
  label: '1:N'
});
```

**修正方法：**
```javascript
// 正确：使用 router: 'er' 避免边穿过节点
graph.addEdge({
  source: tableA,
  target: tableB,
  label: '1:N',
  router: 'er',
  connector: 'rounded',
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } },
});
```

### 错误：错误使用 Graph.registerNode 注册 HTML 节点

**错误示例：**
```javascript
// 错误：使用 Graph.registerNode 注册 HTML 节点，应使用 Shape.HTML.register
Graph.registerNode('er-entity', {
  inherit: 'rect',
  width: 200,
  height: 100,
  attrs: {
    body: {
      strokeWidth: 1,
      fill: '#ffffff',
      stroke: '#333',
    },
    title: {
      text: '',
      refX: 0.5,
      refY: 0,
      textAnchor: 'middle',
      fontSize: 14,
      fontWeight: 'bold',
      fill: '#333',
    },
    fields: {
      text: '',
      refX: 10,
      refY: 30,
      textAnchor: 'start',
      fontSize: 12,
      fill: '#333',
    },
  },
  markup: [
    {
      tagName: 'rect',
      selector: 'body',
    },
    {
      tagName: 'text',
      selector: 'title',
    },
    {
      tagName: 'text',
      selector: 'fields',
    },
  ],
});
```

**修正方法：**
```javascript
// 正确：使用 Shape.HTML.register 注册 HTML 节点
Shape.HTML.register({
  shape: 'er-entity',
  width: 200,
  height: 120,
  effect: ['data'],
  html(cell) {
    const data = cell.getData() || {};
    const div = document.createElement('div');
    div.style.cssText = 'width:100%;height:100%;border:1px solid #8f8f8f;border-radius:4px;overflow:hidden;font-size:12px;background:#fff;';
    const header = '<div style="background:#1890ff;color:#fff;padding:6px 8px;font-weight:bold;">' + (data.name || 'Entity') + '</div>';
    const fields = (data.fields || []).map(f => '<div style="padding:4px 8px;border-top:1px solid #eee;">' + f.name + ' <span style="color:#999">' + f.type + '</span></div>').join('');
    div.innerHTML = header + fields;
    return div;
  },
});
```

### 错误：调用 graph.dispose() 导致图表白屏

**错误示例：**
```javascript
// 错误：调用 graph.dispose() 会销毁整个画布，导致图表白屏
const graph = new Graph({ container: 'container' });
graph.addNode({ shape: 'rect', x: 100, y: 60, width: 120, height: 50, label: 'Temporary' });
graph.dispose(); // ❌ 错误操作
```

**修正方法：**
```javascript
// 正确：避免调用 graph.dispose()，如需重置画布请使用 graph.clearCells()
const graph = new Graph({ container: 'container' });
graph.addNode({ shape: 'rect', x: 100, y: 60, width: 120, height: 50, label: 'Temporary' });

// 如需清空画布内容，请使用：
// graph.clearCells();

// 如需保存状态后重新加载：
const jsonData = graph.toJSON();
graph.clearCells();
graph.fromJSON(jsonData);
```

</skill>