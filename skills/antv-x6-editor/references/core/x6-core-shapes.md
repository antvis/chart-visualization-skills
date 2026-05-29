---
id: "x6-core-shapes"
title: "X6 内置 Shape 完整参考"
description: |
  X6 3.x 内置 10 个 shape：rect / circle / ellipse / polygon / polyline / path /
  image / text-block / html / edge。本文档基于 src/shape/*.ts 真实源码，
  系统列出每个 shape 的默认 markup、默认 attrs、专属字段、size / 内容定位规则与典型用法。

library: "x6"
version: "3.x"
category: "core"
subcategory: "shapes"
tags:
  - "shape"
  - "rect"
  - "circle"
  - "ellipse"
  - "polygon"
  - "polyline"
  - "path"
  - "image"
  - "text-block"
  - "html"
  - "edge"
  - "内置节点"
  - "addNode"

related:
  - "x6-core-markup"
  - "x6-core-node"
  - "x6-core-edge"
  - "x6-intermediate-custom-node"

use_cases:
  - "为每种业务场景选择合适的内置 shape"
  - "确认每种 shape 的默认 attrs 与必填字段"
  - "polygon / polyline 节点的 points 字段写法"
  - "path 节点的 path 字段（SVG d 属性快捷写法）"
  - "image 节点的 imageUrl / imageWidth / imageHeight 快捷字段"
  - "text-block 节点的 text 字段（多行文本）"

anti_patterns:
  - "polygon 节点忘了写 points / 写错格式（应为 'x1,y1 x2,y2 ...'）"
  - "path 节点忘了写 path（refD），导致只渲染空 body"
  - "image 节点用 attrs.body 而非 attrs.image 设置属性"
  - "用 Shape.Cylinder / Shape.Diamond / Shape.Group 等不存在的 shape"

difficulty: "beginner"
completeness: "full"
---

## X6 3.x 内置 shape 总览

> 核对自 `src/shape/index.ts`：导出 10 个。`Shape` 命名空间下**只有**这 10 个，没有 `Cylinder / Diamond / Group / Hexagon`。

| 类名 | shape 字符串 | tagName（body） | 适用场景 |
|------|--------------|----------------|----------|
| `Rect`      | `'rect'`       | `<rect>`          | 通用矩形节点、流程步骤（最常用） |
| `Circle`    | `'circle'`     | `<circle>`        | 状态节点、起止端点 |
| `Ellipse`   | `'ellipse'`    | `<ellipse>`       | 椭圆节点、强调 |
| `Polygon`   | `'polygon'`    | `<polygon>`       | 多边形（菱形、六边形、五角星…） |
| `Polyline`  | `'polyline'`   | `<polyline>`      | 折线（开放路径，不闭合） |
| `Path`      | `'path'`       | `<path>`          | 任意 SVG 路径（图标、自由形状） |
| `Image`     | `'image'`      | `<image>`         | 图片节点（图标） |
| `TextBlock` | `'text-block'` | `<rect>` + foreignObject | 多行文本块（HTML 排版） |
| `HTML`      | （需注册）     | `foreignObject`   | 富 HTML 节点 |
| `Edge`      | `'edge'`       | 双 `<path>`       | 默认边类型 |

### 几个易踩点的命名差异

- shape 字符串中 **`text-block`** 是连字符，不是驼峰
- `Shape.HTML` 是**类**，但必须先调用 `Shape.HTML.register({ shape: 'xxx', ... })` 注册一个具名 shape 才能 `addNode({ shape: 'xxx' })`；HTML 不能直接 `addNode({ shape: 'html' })`
- `Edge` 是默认边的 shape 字符串 `'edge'`，几乎所有 `graph.addEdge({...})` 默认 inherit 它，不用显式声明

## 公共默认 attrs（核对自 `src/shape/base.ts`）

所有用 `createShape` 生成的节点 shape（除 `path` / `text-block`）共享：

```javascript
// BaseBodyAttr
attrs.body = { fill: '#ffffff', stroke: '#333333', strokeWidth: 2 }

// BaseLabelAttr（写到 attrs.text，selector 名是 'text'）
attrs.text = {
  fontSize: 14, fill: '#000000',
  refX: 0.5, refY: 0.5,
  textAnchor: 'middle', textVerticalAnchor: 'middle',
  fontFamily: 'Arial, helvetica, sans-serif',
}
```

`label` 字段（顶层）会被 `propHooks` 自动塞到 `attrs/text/text`。即：

```javascript
graph.addNode({ shape: 'rect', label: 'Hello' });
// 等价于
graph.addNode({ shape: 'rect', attrs: { text: { text: 'Hello' } } });
```

> 注意：**内置 shape 的文本 selector 在 attrs 里是 `text`，不是 `label`**。`util.ts:getMarkup` 中 selector 写的是 `'label'`，但 `Base.config` 把 attrs key 注册为 `text`。两者都能命中，但**推荐使用 `attrs.text`**（与基类一致）。

## 1. Rect（矩形，最常用）

**源码（`src/shape/rect.ts`）**：

```javascript
attrs: { body: { refWidth: '100%', refHeight: '100%' } }
```

`refWidth: '100%'` / `refHeight: '100%'` 让 `<rect>` 自动填满节点的 `width / height`。圆角通过 `rx / ry` 设置。

```javascript
graph.addNode({
  shape: 'rect',
  x: 100, y: 60, width: 120, height: 40,
  label: 'Rectangle',
  attrs: {
    body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
  },
});
```

## 2. Circle（圆形）

**源码（`src/shape/circle.ts`）**：

```javascript
attrs: { body: { refCx: '50%', refCy: '50%', refR: '50%' } }
```

通过 `refR: '50%'`，半径自动取 `min(width, height) / 2`。**为了得到正圆，`width` 与 `height` 必须相等**。

```javascript
graph.addNode({
  shape: 'circle',
  x: 60, y: 100, width: 60, height: 60,   // 必须等宽高
  label: 'Start',
  attrs: { body: { fill: '#f6ffed', stroke: '#52c41a', strokeWidth: 2 } },
});
```

## 3. Ellipse（椭圆）

**源码（`src/shape/ellipse.ts`）**：

```javascript
attrs: { body: { refCx: '50%', refCy: '50%', refRx: '50%', refRy: '50%' } }
```

`width / height` 不需要相等，会自动取一半作为 rx / ry。

```javascript
graph.addNode({
  shape: 'ellipse',
  x: 200, y: 80, width: 120, height: 60,
  label: 'Process',
  attrs: { body: { fill: '#e6f7ff', stroke: '#1890ff', strokeWidth: 2 } },
});
```

## 4. Polygon（多边形，含菱形 / 六边形）

**源码（`src/shape/poly.ts`）**：`points` 字段会被 `propHooks` 写入 `attrs/body/refPoints`。

> `refPoints` 是 X6 自定义 attr：以**百分比**坐标输入，自动按节点 BBox 缩放。

### 写法一：顶层 `points` 字段（推荐）

支持以下三种格式：
- `'x1,y1 x2,y2 ...'` 字符串（标准 SVG points）
- `[[x1,y1], [x2,y2]]` 数组的数组
- `[{x,y}, {x,y}]` 对象数组

```javascript
// 菱形（判断节点）：百分比坐标
graph.addNode({
  shape: 'polygon',
  x: 100, y: 100, width: 120, height: 60,
  label: '?',
  points: '60,0 120,30 60,60 0,30',           // ← 字符串形式
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f' } },
});

// 六边形：数组形式
graph.addNode({
  shape: 'polygon',
  x: 240, y: 100, width: 120, height: 60,
  points: [[30, 0], [90, 0], [120, 30], [90, 60], [30, 60], [0, 30]],
  attrs: { body: { fill: '#fff7e6', stroke: '#fa8c16' } },
});
```

### 写法二：直接写 attrs.body.refPoints

```javascript
attrs: { body: { refPoints: '60,0 120,30 60,60 0,30' } }
```

> ⚠️ 不要既写顶层 `points` 又写 `attrs.body.refPoints`，二者会冲突（顶层 propHook 会覆盖）。

## 5. Polyline（折线，开放路径）

与 Polygon 共享 `Poly` 基类（`src/shape/polyline.ts`），用法一致，区别在于 `<polyline>` **不闭合**。

```javascript
graph.addNode({
  shape: 'polyline',
  x: 100, y: 100, width: 120, height: 60,
  points: '0,60 30,0 60,60 90,30 120,60',
  attrs: { body: { fill: 'none', stroke: '#1890ff', strokeWidth: 2 } },
});
```

## 6. Path（任意 SVG 路径）

**源码（`src/shape/path.ts`）**：与其他 shape 不同，path 节点有 3 个 markup 元素（`bg` 透明背景 + `body` 真实路径 + `label` 文本），顶层 `path` 字段会被 propHook 写入 `attrs/body/refD`。

```javascript
graph.addNode({
  shape: 'path',
  x: 100, y: 100, width: 120, height: 80,
  path: 'M 60 0 L 120 80 L 0 80 Z',        // ← 三角形 path
  label: 'Triangle',
  attrs: { body: { stroke: '#722ed1', strokeWidth: 2, fill: '#f9f0ff' } },
});
```

- `refD` 与 `refPoints` 一样会按 BBox 缩放，所以 path 的坐标可以参照节点尺寸写
- path 节点 `attrs.body.fill` 默认为 `none`、`stroke` 为 `#000`、`strokeWidth: 2`（与其他 shape 不同！）
- 需要透明命中区域用于 hover / click：path 节点自带 `bg`，已经设置了 `pointerEvents: 'all'`

## 7. Image（图片）

**源码（`src/shape/image.ts`）**：内部 selector 是 **`image`** 而不是 `body`，因为 createShape 用 `selector: 'image'` 覆盖了默认值。提供 3 个快捷字段：`imageUrl` / `imageWidth` / `imageHeight`。

```javascript
graph.addNode({
  shape: 'image',
  x: 60, y: 60, width: 60, height: 60,
  // 快捷字段（推荐）
  imageUrl: 'https://gw.alipayobjects.com/zos/antfincdn/FLrTNDvlna/antv.png',
  // 等价于：attrs: { image: { 'xlink:href': '...' } }
});

// 也支持完整 attrs 写法
graph.addNode({
  shape: 'image',
  x: 200, y: 60, width: 80, height: 80,
  attrs: {
    image: {
      'xlink:href': 'https://gw.alipayobjects.com/zos/antfincdn/FLrTNDvlna/antv.png',
      width: 80, height: 80,
    },
  },
});
```

> ⚠️ `attrs.body.fill` 等写法对 image 节点**无效**——image 节点根本没有 `body` selector，所有样式都要写在 `attrs.image` 上。

## 8. TextBlock（多行文本块）

**源码（`src/shape/text-block.ts`）**：
- 当浏览器支持 `foreignObject`（绝大多数情况）时，body 是 `<rect>`，文本通过 `foreignObject > div` 渲染，**自动支持换行**
- 不支持时降级为 `<rect> + <text>`
- 顶层 `text` 字段会被 propHook 写到 `attrs/label/text`

```javascript
graph.addNode({
  shape: 'text-block',
  x: 100, y: 100, width: 200, height: 80,
  text: '这是一段很长的多行文本\n会自动换行并居中显示',
  attrs: {
    body: { fill: '#fff', stroke: '#8f8f8f', strokeWidth: 1, rx: 6, ry: 6 },
    label: { style: { fontSize: 13, color: '#262626' } },
  },
});
```

> `text-block` 中 label 样式必须放在 `attrs.label.style`（HTML inline style），不是 SVG 属性。设置颜色用 `style.color` 而不是 `fill`。

## 9. HTML（富 HTML 节点）

`Shape.HTML` 必须先 register，不能直接 addNode。**完整指南、所有业务模板（卡片 / 表单 / 状态徽标）、effect 重渲染机制、以及 X6 2.x 旧 API `Graph.registerHTMLComponent` 已废弃的迁移说明，详见 [`core/x6-core-html-shape.md`](./x6-core-html-shape.md)**。这里只列最简调用方式：

```javascript
import { Graph, Shape } from '@antv/x6';

Shape.HTML.register({
  shape: 'my-html',
  width: 200, height: 80,
  effect: ['data'],
  html(node) {
    const div = document.createElement('div');
    div.style.cssText = 'width:100%;height:100%;border:1px solid #8f8f8f;padding:8px;';
    div.innerHTML = `<b>${node.getData()?.title || ''}</b>`;
    return div;
  },
});

graph.addNode({
  shape: 'my-html',
  x: 100, y: 60,
  data: { title: 'Hello HTML' },
});
```

> ⚠️ X6 3.x **没有** `Graph.registerHTMLComponent` 这个 API（X6 2.x 已废弃）。所有 HTML 节点统一通过 `Shape.HTML.register` 注册。

## 10. Edge（默认边）

`shape: 'edge'` 是 `graph.addEdge` 的默认 shape，几乎不需要显式声明。markup 是两条 path（透明 wrap 用作 hit-area + 真实 line），详见 `core/x6-core-edge.md` 与 `core/x6-core-markup.md`。

```javascript
graph.addEdge({
  source: a, target: b,
  // shape: 'edge',   // 可省略
  attrs: {
    line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' },
  },
});
```

## 选择指南

| 业务意图 | 推荐 shape | 关键字段 |
|----------|-----------|----------|
| 通用流程步骤 | `rect` + rx/ry 圆角 | `attrs.body.{fill,stroke,rx,ry}` |
| 开始 / 结束节点 | `circle` | `width === height` |
| 判断 / 决策 | `polygon`（菱形） | `points: '60,0 120,30 60,60 0,30'` |
| 资源 / 数据库 | `path` | `path: 'M ...'` |
| 带图标节点 | `image`（简单） / `Shape.HTML`（复杂） | `imageUrl` / `html(cell)` |
| 多行文本说明 | `text-block` | `text: '...'` |
| 富 UI（按钮、卡片、表单） | `Shape.HTML.register` | `effect: ['data']` |
| 边 | `edge`（默认，可省略） | `attrs.line.*` |

## 常见错误与修正

### ❌ 用不存在的 shape

```javascript
// 错误：X6 3.x 没有 Cylinder / Diamond / Group / Hexagon
graph.addNode({ shape: 'cylinder', ... });   // ❌ 抛 "shape not found"
graph.addNode({ shape: 'diamond',  ... });   // ❌
new Shape.Group();                            // ❌ Cannot read properties of undefined

// 正确
graph.addNode({ shape: 'polygon', points: '60,0 120,30 60,60 0,30', ... });  // 菱形
graph.addNode({ shape: 'path',    path: 'M 0 20 Q 60 0 120 20 ...', ... });  // 圆柱用 path
```

### ❌ Polygon 漏写 points

```javascript
// 错误：没有 points，<polygon> 元素拿不到任何顶点，渲染为空
graph.addNode({ shape: 'polygon', x: 100, y: 100, width: 120, height: 60 });

// 正确
graph.addNode({
  shape: 'polygon',
  x: 100, y: 100, width: 120, height: 60,
  points: '60,0 120,30 60,60 0,30',
});
```

### ❌ Image 节点把样式写到 attrs.body

```javascript
// 错误：image 节点的 selector 是 'image'，不是 'body'
graph.addNode({
  shape: 'image',
  x: 60, y: 60, width: 60, height: 60,
  attrs: { body: { 'xlink:href': '...' } },   // ❌ 不生效
});

// 正确
graph.addNode({
  shape: 'image',
  x: 60, y: 60, width: 60, height: 60,
  imageUrl: 'https://...',                    // ✅ 快捷字段
});
// 或
graph.addNode({
  shape: 'image',
  x: 60, y: 60, width: 60, height: 60,
  attrs: { image: { 'xlink:href': 'https://...' } },
});
```

### ❌ Path 节点漏写 path

```javascript
// 错误：只渲染 <rect bg> 透明背景，看不到任何路径
graph.addNode({ shape: 'path', x: 100, y: 100, width: 120, height: 80 });

// 正确：path 字段必填
graph.addNode({
  shape: 'path',
  x: 100, y: 100, width: 120, height: 80,
  path: 'M 60 0 L 120 80 L 0 80 Z',
});
```

### ❌ Circle 节点 width !== height

```javascript
// 错误：长方形 width/height 会导致 refR: '50%' 取较小值，节点偏小并居中显示空白
graph.addNode({ shape: 'circle', x: 0, y: 0, width: 100, height: 60 });

// 正确：圆形保持等宽高
graph.addNode({ shape: 'circle', x: 0, y: 0, width: 60, height: 60 });
// 或改用 ellipse
graph.addNode({ shape: 'ellipse', x: 0, y: 0, width: 100, height: 60 });
```

### ❌ HTML 节点直接 addNode 没注册

```javascript
// 错误：'html' 不是默认可用的 shape 字符串
graph.addNode({ shape: 'html', html: '<div>x</div>' });   // ❌ 抛 shape not found

// 正确：先注册一个具名 HTML shape
Shape.HTML.register({
  shape: 'card',
  html(node) { /* ... */ },
});
graph.addNode({ shape: 'card', x: 0, y: 0, width: 200, height: 80 });
```

### ❌ TextBlock 用 SVG 属性设字体颜色

```javascript
// 错误：foreignObject 内是 HTML <div>，fill 无效
attrs: { label: { fill: '#f00' } }

// 正确：用 HTML inline style
attrs: { label: { style: { color: '#f00', fontSize: 14 } } }
```
