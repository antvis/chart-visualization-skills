---
id: "x6-core-html-shape"
title: "X6 HTML Shape 完整指南（Shape.HTML.register）"
description: |
  X6 3.x 富 HTML 节点专项指南：Shape.HTML.register 是唯一注册入口。本文档基于
  src/shape/html.ts 源码，覆盖 HTML shape 注册 API、html 回调三种返回值（string /
  HTMLElement / 函数）、effect 重渲染机制（如 effect: ['data']），以及业务场景模板：
  HTML 卡片节点、HTML 表单节点（input/select/textarea）、HTML 状态徽标节点、HTML
  用户卡片（头像 + 姓名 + 职位）、HTML 数据表格节点。并明确说明 X6 2.x 旧 API
  Graph.registerHTMLComponent 已废弃，3.x 不存在该方法。

library: "x6"
version: "3.x"
category: "core"
subcategory: "shapes"
tags:
  - "HTML shape"
  - "Shape.HTML"
  - "Shape.HTML.register"
  - "html-node"
  - "html node"
  - "HTML 节点"
  - "HTML 卡片"
  - "HTML 表单节点"
  - "HTML 状态节点"
  - "HTML 状态徽标"
  - "HTML 用户卡片"
  - "用户卡片节点"
  - "可编辑表单节点"
  - "富节点"
  - "富 HTML 节点"
  - "foreignObject"
  - "data 重渲染"
  - "data 自动重新渲染"
  - "effect"
  - "effect: ['data']"
  - "registerHTMLComponent"
  - "Graph.registerHTMLComponent"
  - "DOM 节点"
  - "innerHTML"
  - "createElement"

related:
  - "x6-core-shapes"
  - "x6-core-node"
  - "x6-core-cell-data"
  - "x6-intermediate-custom-node"

use_cases:
  - "用 HTML/CSS 渲染卡片、表单、状态徽标、数据表等富 UI 节点"
  - "节点内容随 data 变化时自动重渲染"
  - "在 SVG 节点之外嵌入任意 DOM（含 input、select、img）"
  - "用户卡片节点（头像 + 姓名 + 职位）"
  - "可编辑表单节点（input/select 输入框）"
  - "状态可变节点（online/offline/idle 切换）"

anti_patterns:
  - "使用 Graph.registerHTMLComponent —— X6 3.x 已废弃，源码不存在"
  - "addNode({ shape: 'html', html: '...' }) 直接传 html —— 必须先 register 一个具名 shape"
  - "在 html 回调里返回 undefined / null"
  - "对静态展示型节点滥用 effect: ['data']"

difficulty: "intermediate"
completeness: "full"
---

## 1. 唯一注册入口：`Shape.HTML.register`

X6 3.x 中**所有富 HTML 节点都通过 `Shape.HTML.register` 注册一个具名 shape**，然后用 `graph.addNode({ shape: 'xxx' })` 添加。**没有其他注册方式**。

源码位置：`src/shape/html.ts:38`

```ts
public static register(config: HTMLShapeConfig) {
  const { shape, html, effect, inherit, ...others } = config
  if (!shape) {
    throw new Error('HTML.register should specify `shape` in config.')
  }
  HTMLShapeMaps[shape] = { html, effect }
  Graph.registerNode(shape, { inherit: inherit || 'html', ...others }, true)
}
```

### `HTMLShapeConfig` 字段（完整列表）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `shape` | `string` | ✅ | 注册后的 shape id，用于 `addNode({ shape })` |
| `html` | `string \| HTMLElement \| (cell) => HTMLElement \| string` | ✅ | HTML 内容生成函数或静态 HTML |
| `effect` | `(keyof NodeProperties)[]` | ❌ | 监听哪些 props 变化时重新调用 `html(cell)` 渲染；不填默认仅初次渲染（注：内部 `change:*` 监听仍会触发，但只在 prop 在 effect 列表中时才重渲染）|
| `inherit` | `string` | ❌ | 继承的内置 shape，默认 `'html'` |
| `width` / `height` | `number` | ❌ | 默认尺寸（addNode 时可覆盖） |
| 其他 NodeProperties | — | ❌ | 与 `Graph.registerNode` 的 options 一致 |

## 2. 最小可运行模板（按复杂度递进）

### 2.1 静态 HTML（最简）

`html` 字段直接传字符串：

```javascript
import { Graph, Shape } from '@antv/x6';

Shape.HTML.register({
  shape: 'static-html',
  width: 160,
  height: 80,
  html: '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;border:1px solid #8f8f8f;border-radius:6px;background:#fff;">Hello</div>',
});

const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
});

graph.addNode({ shape: 'static-html', x: 80, y: 60 });
```

### 2.2 函数返回 HTMLElement（推荐）

`html(node)` 返回一个 DOM 元素，用 `node.getData()` 读取业务数据：

```javascript
import { Graph, Shape } from '@antv/x6';

Shape.HTML.register({
  shape: 'card',
  width: 200,
  height: 80,
  html(node) {
    const data = node.getData() || {};
    const div = document.createElement('div');
    div.style.cssText =
      'width:100%;height:100%;padding:8px;box-sizing:border-box;' +
      'border:1px solid #8f8f8f;border-radius:6px;background:#fff;';
    div.innerHTML = `
      <div style="font-size:14px;font-weight:500;">${data.title || ''}</div>
      <div style="font-size:12px;color:#666;">${data.desc || ''}</div>
    `;
    return div;
  },
});

const graph = new Graph({ container: 'container', background: { color: '#F2F7FA' } });

graph.addNode({
  shape: 'card',
  x: 80, y: 60,
  data: { title: 'Hello', desc: 'World' },
});
```

### 2.3 加 effect：data 变化自动重渲染

`effect: ['data']` 让节点的 `data` prop 变化时**自动重新调用 `html(cell)`**，无需手动 `view.render()`：

```javascript
Shape.HTML.register({
  shape: 'status-badge',
  width: 200, height: 50,
  effect: ['data'],
  html(node) {
    const { name, status } = node.getData() || {};
    const colors = { online: '#52c41a', offline: '#ff4d4f', idle: '#faad14' };
    const color = colors[status] || '#d9d9d9';
    const div = document.createElement('div');
    div.style.cssText = `width:100%;height:100%;display:flex;align-items:center;
      padding:0 10px;border:2px solid ${color};border-radius:8px;background:#fff;`;
    div.innerHTML = `
      <div style="width:8px;height:8px;border-radius:50%;background:${color};margin-right:8px;"></div>
      <span style="font-size:13px;">${name || ''}</span>
      <span style="font-size:11px;color:${color};margin-left:auto;">${status || ''}</span>
    `;
    return div;
  },
});

const node = graph.addNode({
  shape: 'status-badge',
  x: 80, y: 60,
  data: { name: 'API Server', status: 'online' },
});

// 修改 data 会自动触发 html(cell) 重新执行 → 视图刷新
setTimeout(() => node.setData({ name: 'API Server', status: 'offline' }), 1000);
```

> **何时该加 `effect: ['data']`**：业务数据动态变化（状态切换、计数更新等）。
> **何时不要加**：纯静态展示节点（卡片标题写死、不会通过 setData 修改）。多余的 effect 会增加重渲染开销。

### 2.4 表单 / 含 input / select 的交互节点

```javascript
Shape.HTML.register({
  shape: 'form-node',
  width: 220, height: 130,
  html(node) {
    const data = node.getData() || {};
    const div = document.createElement('div');
    div.style.cssText =
      'width:100%;height:100%;padding:12px;box-sizing:border-box;' +
      'border:1px solid #d9d9d9;border-radius:8px;background:#fff;';
    div.innerHTML = `
      <div style="font-size:13px;font-weight:500;margin-bottom:8px;">${data.title || ''}</div>
      <div style="margin-bottom:6px;">
        <label style="font-size:11px;color:#666;">Name:</label>
        <input style="width:100%;padding:3px 6px;border:1px solid #d9d9d9;border-radius:4px;font-size:12px;box-sizing:border-box;" value="${data.name || ''}" />
      </div>
      <div>
        <label style="font-size:11px;color:#666;">Type:</label>
        <select style="width:100%;padding:3px 6px;border:1px solid #d9d9d9;border-radius:4px;font-size:12px;">
          <option ${data.type === 'string' ? 'selected' : ''}>string</option>
          <option ${data.type === 'number' ? 'selected' : ''}>number</option>
        </select>
      </div>
    `;
    return div;
  },
});

graph.addNode({
  shape: 'form-node',
  x: 80, y: 40,
  data: { title: 'Variable Config', name: 'userName', type: 'string' },
});
```

### 2.5 用户卡片（头像 + 文本）

```javascript
Shape.HTML.register({
  shape: 'user-card',
  width: 200, height: 60,
  html(node) {
    const data = node.getData() || {};
    const div = document.createElement('div');
    div.style.cssText =
      'width:100%;height:100%;display:flex;align-items:center;padding:8px;' +
      'box-sizing:border-box;border:1px solid #e8e8e8;border-radius:8px;background:#fff;';
    div.innerHTML = `
      <div style="width:36px;height:36px;border-radius:50%;background:#1890ff;
        display:flex;align-items:center;justify-content:center;
        color:#fff;font-weight:bold;margin-right:10px;">
        ${(data.name || 'U')[0]}
      </div>
      <div>
        <div style="font-size:14px;font-weight:500;">${data.name || ''}</div>
        <div style="font-size:12px;color:#999;">${data.role || ''}</div>
      </div>
    `;
    return div;
  },
});
```

## 3. `html` 字段的三种合法返回（源码 `src/shape/html.ts:124-134`）

```ts
let { html } = content;
if (typeof html === 'function') {
  html = html(this.cell);
}
if (html) {
  if (typeof html === 'string') {
    container.innerHTML = html;
  } else {
    Dom.append(container, html);   // 必须是 HTMLElement
  }
}
```

| 返回类型 | 渲染方式 | 适用场景 |
|---------|---------|---------|
| `string` | `container.innerHTML = html` | 静态结构、模板字符串拼接 |
| `HTMLElement` | `Dom.append(container, html)` | 需要 addEventListener / ref 持有 |
| `(cell) => string \| HTMLElement` | 同上，可读 cell 状态 | 内容依赖 data / props |

返回 `null` / `undefined` / 空字符串都会**渲染为空 div**。

## 4. 风格规范（用于跟着 expected 写）

X6 官方 demo 的 HTML shape 通常**保持极简**：

1. **节点宽高**写在 `Shape.HTML.register({ width, height })` 里，作为该 shape 的默认值；`addNode` 时可省略
2. **`addNode`** 只传 `shape` / `x` / `y` / `data`（如需），**不要重复传 width/height**（除非确实要覆盖）
3. **样式用 `cssText` 一行写完** 或精简的 `style.xxx` 赋值，避免长串 `box-shadow / fontFamily / padding` 等装饰性属性堆叠
4. **不要给静态节点加 `effect: ['data']`**——只在 setData 动态修改时才需要
5. **不要在 HTML shape demo 里附带 connecting / addEdge / centerContent**——除非需求明确要求
6. **`background: { color: '#F2F7FA' }`** 是 X6 demo 的常用浅蓝背景色，与 expected 保持一致

## 5. X6 2.x 旧 API 已废弃（重要）

⚠️ **`Graph.registerHTMLComponent(name, factory)` 在 X6 3.x 中不存在**：

```javascript
// ❌ 错误：X6 2.x 旧 API，3.x 源码已无此方法（grep src/ 无任何匹配）
Graph.registerHTMLComponent('user-card', (node) => { /* ... */ });
graph.addNode({ shape: 'html', html: 'user-card', data: {...} });

// ✅ 正确：X6 3.x 统一使用 Shape.HTML.register
Shape.HTML.register({
  shape: 'user-card',
  html(node) { /* ... */ },
});
graph.addNode({ shape: 'user-card', data: {...} });
```

如果在网上或旧 demo 里看到 `Graph.registerHTMLComponent`，**一律替换为 `Shape.HTML.register`**：
- 不再需要把 shape 写成字符串 `'html'` + 用 `html: 'component-name'` 引用
- 直接用注册时的 shape 名作为 `addNode({ shape })`

## 6. 常见错误与修正

### ❌ `addNode` 时 shape 直接写 `'html'`

```javascript
// 错误：'html' 是 X6 内置基础 shape，没有 html 内容定义
graph.addNode({ shape: 'html', html: '<div>x</div>' });
// → 抛 "shape not found" 或渲染空白
```

```javascript
// 正确：先 register 一个具名 shape
Shape.HTML.register({ shape: 'card', html: '<div>x</div>' });
graph.addNode({ shape: 'card', x: 0, y: 0, width: 100, height: 40 });
```

### ❌ `html` 回调返回值忘了

```javascript
Shape.HTML.register({
  shape: 'card',
  html(node) {
    const div = document.createElement('div');
    div.textContent = 'hi';
    // ❌ 忘了 return → foreignObject 内为空
  },
});
```

```javascript
// 正确：必须 return
html(node) {
  const div = document.createElement('div');
  div.textContent = 'hi';
  return div;
}
```

### ❌ 用 `Graph.registerHTMLComponent`（X6 2.x 残留）

参见第 5 节。

### ❌ `effect` 写错 prop 名

```javascript
// 错误：'datas' 不是合法 NodeProperty key
Shape.HTML.register({ shape: 'x', effect: ['datas'], html(n) { /* ... */ } });
// → setData 不会触发重渲染
```

```javascript
// 正确：effect 元素必须是 NodeProperties 的 key（如 'data' / 'attrs' / 'size' / 'position'）
Shape.HTML.register({ shape: 'x', effect: ['data'], html(n) { /* ... */ } });
```

### ❌ HTML 节点尺寸不生效

```javascript
// 错误：div 用 px 写死，但外层 foreignObject 大小是 width/height 决定
html(node) {
  const div = document.createElement('div');
  div.style.width = '300px';   // ⚠️ 节点本身只有 200x80
  div.style.height = '200px';  // → 超出 foreignObject 被裁
  return div;
}
```

```javascript
// 正确：内部用 100% 撑满 foreignObject，节点尺寸由 register/addNode 控制
html(node) {
  const div = document.createElement('div');
  div.style.cssText = 'width:100%;height:100%;...';
  return div;
}
graph.addNode({ shape: 'card', width: 300, height: 200 });
```

## 7. 相关文档

- `core/x6-core-shapes.md` — 全部 10 个内置 shape 概览
- `core/x6-core-node.md` — 节点 API（addNode / setData / 事件）
- `core/x6-core-cell-data.md` — cell.data 的读写与监听
- `intermediate/x6-intermediate-custom-node.md` — 用 Graph.registerNode 注册自定义 SVG 节点
