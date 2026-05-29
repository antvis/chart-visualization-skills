---
id: "x6-core-markup"
title: "X6 Markup（DOM 结构定义）"
description: |
  X6 节点 / 边 / 端口的 DOM 结构通过 markup 描述。
  本文档基于 src/view/markup.ts 与 src/shape/util.ts 的真实实现，
  系统讲解 MarkupJSONMarkup 字段、selector / groupSelector 机制、
  内置 shape 默认 markup、自定义 shape markup 编写规范、字符串 markup 兼容写法。

library: "x6"
version: "3.x"
category: "core"
subcategory: "markup"
tags:
  - "markup"
  - "selector"
  - "groupSelector"
  - "tagName"
  - "DOM"
  - "自定义形状"
  - "custom shape"
  - "registerNode"
  - "label"
  - "body"
  - "lines"

related:
  - "x6-core-shapes"
  - "x6-core-node"
  - "x6-core-edge"
  - "x6-intermediate-custom-node"
  - "x6-intermediate-custom-edge"

use_cases:
  - "自定义节点形状（registerNode 时声明 markup）"
  - "自定义边形状（双线、加粗 hit-area 等）"
  - "理解 attrs 中 selector（body / label / line）的来源"
  - "通过 selector 在 markup 多个子元素上独立设置样式"
  - "通过 groupSelector 一次性给多个子元素设置同一属性"

anti_patterns:
  - "在 markup 中重复使用相同的 selector"
  - "把 attrs 的 key 写成 CSS 选择器（应是 markup 里 selector / groupSelector 的名字）"
  - "在 HTML 节点的 markup 里混用 SVG tagName"
  - "在边 markup 中漏写 lines groupSelector 导致 attrs.lines 失效"

difficulty: "intermediate"
completeness: "full"
---

## 核心概念

**Markup** 是 X6 中节点 / 边 / 端口 / 标签的**底层 DOM 结构描述**。同一个 cell 的 `attrs` 配置必须通过 markup 中声明的 `selector` 或 `groupSelector` 引用到具体的 DOM 元素，才能正确生效。

> 源码位置：`src/view/markup.ts` — `parseJSONMarkup` 负责把 JSON 描述递归构建为 SVG / XHTML 节点。

## MarkupJSONMarkup 字段速查

| 字段 | 类型 | 说明 | 必填 |
|------|------|------|------|
| `tagName` | `string` | DOM 元素标签名（如 `'rect'`、`'circle'`、`'path'`、`'text'`、`'g'`、`'image'`） | ✓ |
| `selector` | `string` | 唯一选择器，`attrs[selector] = {...}` 通过它精准定位元素 | |
| `groupSelector` | `string \| string[]` | 组选择器，一次给多个元素套同一组 attrs；**名字不能与 selector 重名** | |
| `ns` | `string` | 命名空间，默认 `http://www.w3.org/2000/svg`；HTML 元素需写 `Dom.ns.xhtml` | |
| `attrs` | `SimpleAttrs` | DOM 属性（自动 kebab-case 化）；与 `cell.attrs[selector]` 合并，后者优先 | |
| `style` | `Record<string, string \| number>` | inline CSS（通过 `Dom.css` 设置） | |
| `className` | `string \| string[]` | DOM `class` 属性 | |
| `textContent` | `string` | 元素的 `textContent`（注意：动态文本应放到 `attrs.text/text`） | |
| `children` | `MarkupJSONMarkup[]` | 子元素，递归构建 | |

`tagName` 缺失会在 `parseJSONMarkup` 中抛 `TypeError: Invalid tagName`。

## selector vs groupSelector 的区别（关键）

- `selector` 在一个 markup 中**必须唯一**，重复时会抛 `TypeError: Selector must be unique`
- `groupSelector` 允许多个元素共享同一个 name，在 `attrs` 中引用该 name 时会把属性应用到**全部成员**
- 若 `groupSelector` 与某个 `selector` 重名，会抛 `Error: Ambiguous group selector`

```javascript
// 内置 edge markup（节选自 src/shape/edge.ts）
markup: [
  { tagName: 'path', selector: 'wrap', groupSelector: 'lines', attrs: {...} },
  { tagName: 'path', selector: 'line', groupSelector: 'lines', attrs: {...} },
]
attrs: {
  lines: { connection: true, strokeLinejoin: 'round' }, // ← 同时作用于 wrap 和 line
  wrap:  { strokeWidth: 10 },                            // ← 只作用于第一条 path（不可见的 hit area）
  line:  { stroke: '#333', strokeWidth: 2, targetMarker: 'classic' }, // ← 真正的可见线
}
```

## 内置 shape 的默认 markup（核对自 `src/shape/util.ts`）

`createShape(shape, config)` 给所有基础 shape 生成默认 markup：

```javascript
// 等价于
markup: [
  { tagName: shape, selector: 'body' },  // shape: rect / circle / ellipse / polygon / polyline / path / image / text-block
  { tagName: 'text', selector: 'label' },
]
attrs: {
  [shape]: { /* BaseBodyAttr: fill #ffffff, stroke #333333, strokeWidth 2 */ },
  text:    { /* BaseLabelAttr: fontSize 14, fill #000, refX/refY 0.5, anchor middle */ },
}
```

由此可以推出几条易踩点的规则：

1. 内置节点 attrs 中的 `body` selector **真实对应的 tagName 就是该 shape 自身**（rect 的 body 是 `<rect>`，circle 的 body 是 `<circle>`），所以 attrs 里只能写该 tagName 支持的 SVG 属性
2. 内置节点的文本 selector 叫 **`label`**（不叫 `text`），但内部 `attrs.text` 也保留为别名，两者都能命中
3. 边（`edge`）默认 markup 是两条 `path`（`wrap` + `line`），通过 `lines` group 一起控制，自定义边时若覆盖 markup，必须保留 `lines` group 或同步改写 attrs

## 自定义节点：完整 markup 范例

```javascript
import { Graph } from '@antv/x6';

Graph.registerNode(
  'card-node',
  {
    inherit: 'rect',
    width: 180,
    height: 64,
    markup: [
      { tagName: 'rect',  selector: 'body' },
      { tagName: 'image', selector: 'icon' },
      { tagName: 'text',  selector: 'title' },
      { tagName: 'text',  selector: 'subtitle' },
    ],
    attrs: {
      body: {
        refWidth: '100%',       // 跟随节点宽度
        refHeight: '100%',
        fill: '#fff',
        stroke: '#8f8f8f',
        strokeWidth: 1,
        rx: 6,
        ry: 6,
      },
      icon: {
        ref: 'body',
        refX: 8,
        refY: 0.5,             // 相对 body 高度的 50%
        refY2: -10,            // 然后再 -10 像素
        width: 20,
        height: 20,
        'xlink:href': '',
      },
      title: {
        ref: 'body',
        refX: 36,
        refY: 16,
        textAnchor: 'start',
        textVerticalAnchor: 'middle',
        fontSize: 14,
        fill: '#262626',
      },
      subtitle: {
        ref: 'body',
        refX: 36,
        refY: 40,
        textAnchor: 'start',
        textVerticalAnchor: 'middle',
        fontSize: 12,
        fill: '#8c8c8c',
      },
    },
  },
  true,
);

const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
});

graph.addNode({
  shape: 'card-node',
  x: 40, y: 40,
  attrs: {
    icon:     { 'xlink:href': 'https://gw.alipayobjects.com/zos/antfincdn/FLrTNDvlna/antv.png' },
    title:    { text: 'AntV X6' },
    subtitle: { text: 'Graph editor' },
  },
});

graph.centerContent();
```

## 自定义边：带 hit-area 的 markup

```javascript
import { Graph } from '@antv/x6';

Graph.registerEdge(
  'thick-edge',
  {
    inherit: 'edge',
    markup: [
      // 第一条不可见的粗 path 用作点击 hit-area
      { tagName: 'path', selector: 'wrap',  groupSelector: 'lines',
        attrs: { fill: 'none', stroke: 'transparent', strokeWidth: 12, cursor: 'pointer' } },
      // 第二条可见的细 path 是真正的连线
      { tagName: 'path', selector: 'line',  groupSelector: 'lines',
        attrs: { fill: 'none', pointerEvents: 'none' } },
    ],
    attrs: {
      lines: { connection: true, strokeLinejoin: 'round' }, // ← 必须保留
      line:  { stroke: '#1890ff', strokeWidth: 2, targetMarker: 'classic' },
    },
  },
  true,
);
```

## 字符串 markup（兼容写法）

`markup` 也可以是字符串（HTML/SVG 片段），但**不推荐**在自定义 shape 中使用：
- 字符串模式没有 `selector` 概念，无法用 attrs 精准定位
- 通常仅出现在 `getPortContainerMarkup()` 这种"单个 g 容器"的内部场景
- 业务代码请始终使用 JSON markup

```javascript
// ❌ 不推荐
markup: '<rect class="body"/><text class="label"/>'

// ✅ 推荐
markup: [
  { tagName: 'rect', selector: 'body' },
  { tagName: 'text', selector: 'label' },
]
```

## 端口 markup

端口的 markup 通过 `ports.groups[name].markup` 配置，默认 markup 是一个 `<circle>`（见 `Markup.getPortMarkup()`）：

```javascript
ports: {
  groups: {
    in: {
      position: 'left',
      markup: [{ tagName: 'circle', selector: 'circle' }], // ← 默认值
      attrs: {
        circle: { r: 4, magnet: true, stroke: '#8f8f8f', fill: '#fff' },
      },
    },
  },
}
```

> 端口 markup 顶层 tagName 必须是 SVG 元素。若需要 HTML 形态的端口，应该改用 `Shape.HTML.register` 注册整个 HTML 节点，而不是改端口 markup。

## 标签 markup（边标签）

`graph.addEdge` 的 `labels` 默认 markup 是 `<rect> + <text>`，可通过 `defaultLabel` 或单个 label 覆盖：

```javascript
graph.addEdge({
  source: a, target: b,
  defaultLabel: {
    markup: [
      { tagName: 'rect',  selector: 'body' },
      { tagName: 'text',  selector: 'label' },
    ],
    attrs: {
      body:  { fill: '#fff', stroke: '#8f8f8f', rx: 4, ry: 4 },
      label: { fontSize: 12, fill: '#262626', textAnchor: 'middle', textVerticalAnchor: 'middle' },
    },
  },
  labels: [{ position: 0.5, attrs: { label: { text: 'connected' } } }],
});
```

## 常见错误与修正

### ❌ selector 重复

```javascript
// 错误：两个元素都用了 'body'，运行时抛 TypeError: Selector must be unique
markup: [
  { tagName: 'rect', selector: 'body' },
  { tagName: 'rect', selector: 'body' },
]

// 正确：每个 selector 唯一
markup: [
  { tagName: 'rect', selector: 'body' },
  { tagName: 'rect', selector: 'header' },
]
```

### ❌ groupSelector 与 selector 重名

```javascript
// 错误：抛 Error: Ambiguous group selector
markup: [
  { tagName: 'path', selector: 'lines' },
  { tagName: 'path', groupSelector: 'lines' },
]

// 正确：错开命名
markup: [
  { tagName: 'path', selector: 'line', groupSelector: 'lines' },
  { tagName: 'path', selector: 'wrap', groupSelector: 'lines' },
]
```

### ❌ tagName 缺失

```javascript
// 错误：抛 TypeError: Invalid tagName
markup: [{ selector: 'body' }]

// 正确
markup: [{ tagName: 'rect', selector: 'body' }]
```

### ❌ 把 CSS 选择器当成 attrs 的 key

```javascript
// 错误：attrs 的 key 必须是 markup 里的 selector / groupSelector
attrs: {
  '.body': { fill: '#fff' },        // ❌ 不是 CSS 选择器
  'rect.body': { fill: '#fff' },    // ❌
}

// 正确
markup: [{ tagName: 'rect', selector: 'body' }],
attrs: {
  body: { fill: '#fff' },           // ✅ 与 selector 名字对齐
}
```

### ❌ 自定义边漏写 lines groupSelector

```javascript
// 错误：覆盖 markup 时丢了 lines group，attrs.lines.connection = true 失效，
// 边路径不会跟随 source/target 更新
markup: [{ tagName: 'path', selector: 'line' }],
attrs: { lines: { connection: true } },

// 正确：要么保留 groupSelector，要么把 connection 写到 line 上
markup: [{ tagName: 'path', selector: 'line', groupSelector: 'lines' }],
attrs: { lines: { connection: true }, line: { stroke: '#333' } },
// 或
markup: [{ tagName: 'path', selector: 'line' }],
attrs: { line: { connection: true, stroke: '#333' } },
```

### ❌ 用 SVG markup 装 HTML 内容

```javascript
// 错误：把 div 当 SVG 子节点会渲染失败
markup: [
  { tagName: 'rect', selector: 'body' },
  { tagName: 'div',  selector: 'content' },     // ❌ SVG 命名空间下没有 div
]

// 正确：使用 Shape.HTML.register
import { Shape } from '@antv/x6';
Shape.HTML.register({
  shape: 'my-card',
  effect: ['data'],
  html(node) {
    const el = document.createElement('div');
    el.style.cssText = 'width:100%;height:100%;border:1px solid #8f8f8f;';
    el.innerHTML = node.getData()?.html || '';
    return el;
  },
});
```
