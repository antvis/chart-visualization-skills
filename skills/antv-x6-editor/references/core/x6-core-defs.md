---
id: "x6-core-defs"
title: "X6 defs（渐变 / 标记 / 滤镜定义）"
description: |
  X6 通过 graph.defineGradient / graph.defineMarker / graph.defineFilter 三个方法，
  把渐变、箭头标记、SVG 滤镜注册到画布的 <defs> 内并返回引用 id。
  本文档基于 src/graph/defs.ts 与 src/registry/{marker,filter}/* 的真实实现整理。

library: "x6"
version: "3.x"
category: "core"
subcategory: "defs"
tags:
  - "defs"
  - "defineGradient"
  - "defineMarker"
  - "defineFilter"
  - "linearGradient"
  - "radialGradient"
  - "marker"
  - "arrow"
  - "filter"
  - "dropShadow"
  - "outline"
  - "highlight"
  - "blur"

related:
  - "x6-core-marker"
  - "x6-core-filter"
  - "x6-core-attr-registry"
  - "x6-core-edge"

use_cases:
  - "给节点 / 边设置渐变填充"
  - "为自定义箭头标记复用渐变填充"
  - "给节点添加阴影 / 高亮 / 模糊滤镜"
  - "在自定义 attr 中拿到 <defs> 资源的 id"
  - "动态新增 / 移除全局 SVG 资源"

anti_patterns:
  - "直接操作 graph.svg / graph.defs / document.createElementNS 手动创建 <defs> 子节点"
  - "把渐变对象当成字符串 fill"
  - "传给 defineMarker 的对象忘了 tagName"
  - "filter 名字写错（如 dropShadow vs drop-shadow），X6 内置 11 个名字必须严格匹配"

difficulty: "intermediate"
completeness: "full"
---

## 为什么需要 defs

SVG 的 `<defs>` 元素用于声明可被引用的"模板资源"（渐变、滤镜、marker），通过 `url(#id)` 在 `fill / stroke / marker-end / filter` 等属性上使用。

X6 把全部 `<defs>` 操作封装在 `DefsManager`（`src/graph/defs.ts`）里，对外暴露三个 Graph 方法：

| 方法 | 返回 | 内部行为 |
|------|------|----------|
| `graph.defineGradient(options)` | `string`（id） | 在 `<defs>` 中创建 `<linearGradient>` / `<radialGradient>` |
| `graph.defineMarker(options)` | `string`（id） | 在 `<defs>` 中创建 `<marker>` |
| `graph.defineFilter(options)` | `string`（id） | 在 `<defs>` 中创建 `<filter>` |

所有方法都是**幂等**的：内部用 `StringExt.hashcode(JSON.stringify(options))` 拼 id，相同 options 重复调用只会创建一次。

> ⚠️ **禁止**直接读写 `graph.defs` / `graph.svgDoc` 等内部字段；X6 3.x 没有这两个公开属性，强行访问会抛 `Cannot read properties of undefined`。

## `graph.defineGradient`

### 类型定义（核对自 `src/graph/defs.ts`）

```typescript
interface GradientOptions {
  id?: string
  type: string                              // 'linearGradient' | 'radialGradient'
  stops: { offset: number; color: string; opacity?: number }[]
  attrs?: SimpleAttrs                       // 给 <linearGradient> 标签本身的额外属性
}
```

### 大多数场景不用手动调用——直接在 attrs.fill / attrs.stroke 写渐变对象

X6 内置 `fill` attr 注册器（见 `core/x6-core-attr-registry.md`）会判断 fill 值为对象时自动调用 `defineGradient`：

```javascript
attrs: {
  body: {
    fill: {
      type: 'linearGradient',
      stops: [
        { offset: 0,    color: '#1890ff' },
        { offset: 1,    color: '#13c2c2', opacity: 0.6 },
      ],
    },
  },
}
```

> `offset` 既可以传 `0~1` 的数字，也可以传 `'0%' ~ '100%'` 的字符串，源码会原样拼到 `stop-offset`。

### 需要显式调用 defineGradient 的场景

当渐变需要被**自定义 marker 或自定义 attr 引用**时，必须先拿到 id，再写到 marker 的 `fill: 'url(#xxx)'` 上：

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
});

const gradientId = graph.defineGradient({
  type: 'linearGradient',
  stops: [
    { offset: 0, color: '#ff7875' },
    { offset: 1, color: '#ff4d4f' },
  ],
});

graph.addEdge({
  source: { x: 80, y: 80 },
  target: { x: 320, y: 220 },
  attrs: {
    line: {
      stroke: '#ff4d4f',
      strokeWidth: 2,
      targetMarker: {
        // 自定义 marker，filling 用前面的渐变 id
        tagName: 'path',
        d: 'M 12 -6 0 0 12 6 z',
        fill: `url(#${gradientId})`,
      },
    },
  },
});

graph.centerContent();
```

## `graph.defineMarker`

### 类型定义（核对自 `src/registry/marker/index.ts`）

```typescript
interface MarkerResult extends SimpleAttrs {
  id?: string
  tagName?: string                              // 默认 'path'
  refX?: number
  refY?: number
  markerUnits?: 'userSpaceOnUse' | 'strokeWidth'  // 默认 'userSpaceOnUse'
  markerOrient?: 'auto' | 'auto-start-reverse' | number  // 默认 'auto'
  children?: { tagName: string; [attr: string]: any }[]
  // 其他字段会作为 marker 内部 path 的 attrs（fill / stroke / d / size 等）
}
```

### 大多数场景：直接在 edge 的 `targetMarker` / `sourceMarker` 中用内置名字

X6 内置 7 类 marker（`src/registry/marker/`）：

| name | 形状 | 关键参数 |
|------|------|----------|
| `'classic'` | 经典三角箭头（默认） | `size`, `width`, `height`, `offset`, `factor` |
| `'block'` | 实心三角块 | `size`, `width`, `height`, `offset`, `open` |
| `'diamond'` | 菱形 | `size`, `width`, `height`, `offset` |
| `'cross'` | 十字 | `size`, `width`, `height`, `offset` |
| `'circle'` | 圆点 | `r`, `size`, `offset` |
| `'ellipse'` | 椭圆 | `rx`, `ry`, `offset` |
| `'async'` | 异步双箭头 | `size`, `width`, `height`, `offset` |
| `'path'` | 自定义 path | `d`, `offset`, `attrs` |

```javascript
graph.addEdge({
  source: a, target: b,
  attrs: {
    line: {
      stroke: '#333',
      targetMarker: 'classic',                              // 字符串简写
      sourceMarker: { name: 'circle', args: { r: 4 } },     // 对象 + args
    },
  },
});
```

### 需要 defineMarker 的场景：完全自定义 marker（带 filter / children / 渐变）

```javascript
const arrowId = graph.defineMarker({
  tagName: 'path',
  refX: 6,
  refY: 4,
  markerUnits: 'userSpaceOnUse',
  markerOrient: 'auto',
  d: 'M 0 0 L 8 4 L 0 8 z',
  fill: '#1890ff',
});

graph.addEdge({
  source: a, target: b,
  attrs: {
    line: {
      stroke: '#1890ff',
      'marker-end': `url(#${arrowId})`,    // 直接用 SVG marker-end 引用
    },
  },
});
```

带 children（适用于复合 marker，例如带边框的圆形终止符）：

```javascript
graph.defineMarker({
  tagName: 'circle',
  children: [
    { tagName: 'circle', r: 4, fill: '#fff', stroke: '#1890ff', 'stroke-width': 2 },
    { tagName: 'circle', r: 2, fill: '#1890ff' },
  ],
  refX: 5,
  refY: 0,
  markerOrient: 'auto-start-reverse',
});
```

> 源码 `defs.ts:127` 显示：若 `tagName !== 'path'`，会自动删除 `d` 属性，避免从 standard edge 继承的污染。

## `graph.defineFilter`

### 类型定义（核对自 `src/registry/filter/index.ts`）

```typescript
type FilterOptions = (FilterNativeItem | FilterManualItem) & {
  id?: string
  attrs?: SimpleAttrs        // <filter> 标签本身的属性，默认 { x:-1, y:-1, width:3, height:3, filterUnits:'objectBoundingBox' }
}

interface FilterNativeItem {
  name: 'outline' | 'highlight' | 'blur' | 'dropShadow'
      | 'grayScale' | 'sepia' | 'saturate' | 'hueRotate'
      | 'invert'   | 'brightness' | 'contrast'
  args?: { /* 不同 name 对应不同 args，见下表 */ }
}
```

### X6 内置 11 个 filter（核对自 `src/registry/filter/main.ts`）

| name | args 示例 | 效果 |
|------|-----------|------|
| `'outline'`     | `{ color, width, margin, opacity }` | 描边 |
| `'highlight'`   | `{ color, width, blur, opacity }`   | 高亮发光 |
| `'blur'`        | `{ x, y }`                           | 模糊 |
| `'dropShadow'`  | `{ dx, dy, color, blur, opacity }`   | 投影 |
| `'grayScale'`   | `{ amount }`                         | 灰度 |
| `'sepia'`       | `{ amount }`                         | 怀旧 |
| `'saturate'`    | `{ amount }`                         | 饱和度 |
| `'hueRotate'`   | `{ angle }`                          | 色相旋转 |
| `'invert'`      | `{ amount }`                         | 反色 |
| `'brightness'`  | `{ amount }`                         | 亮度 |
| `'contrast'`    | `{ amount }`                         | 对比度 |

> 严格大小写：`dropShadow` 不是 `drop-shadow`、`grayScale` 不是 `grayscale`。

### 通过 attrs.filter 直接使用（推荐）

X6 在 `attrs` 中识别 `filter` 字段，传对象会自动调用 `defineFilter`：

```javascript
graph.addNode({
  shape: 'rect',
  x: 100, y: 100, width: 120, height: 60,
  attrs: {
    body: {
      fill: '#fff',
      stroke: '#8f8f8f',
      filter: {
        name: 'dropShadow',
        args: { dx: 2, dy: 2, blur: 4, color: 'rgba(0,0,0,0.2)' },
      },
    },
  },
});
```

### 显式调用 defineFilter（需要在多处共享或自定义 filter 时）

```javascript
const shadowId = graph.defineFilter({
  name: 'dropShadow',
  args: { dx: 0, dy: 4, blur: 8, color: '#1890ff', opacity: 0.4 },
});

// 多个节点共享同一个滤镜引用
['n1', 'n2', 'n3'].forEach((id, i) => {
  graph.addNode({
    id, shape: 'rect',
    x: 60 + i * 160, y: 100, width: 100, height: 50,
    attrs: { body: { fill: '#fff', filter: `url(#${shadowId})` } },
  });
});
```

### 自定义 filter 标签（`FilterManualItem`）

如果内置 11 项不够，可以传一个不在 native 列表里的 `name`，然后通过 `Registry` 自行扩展 filter 工厂函数（高级用法，多数业务无需触及，详见 `core/x6-core-filter.md`）。

## 三个方法的共性

1. **返回值都是字符串 id**，需要拼成 `url(#id)` 使用
2. **幂等**：相同 options 多次调用只创建一次 DOM（基于 `JSON.stringify` hash）
3. **DefsManager.remove(id)** 可主动移除，但通常不需要

## 常见错误与修正

### ❌ 直接操作 DOM 创建 defs

```javascript
// 错误：graph.defs / graph.svgDoc 都不是公开 API，会报 Cannot read properties of undefined
const defs = graph.defs;
const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
defs.appendChild(grad);

// 正确：用 defineGradient
const id = graph.defineGradient({
  type: 'linearGradient',
  stops: [{ offset: 0, color: '#f00' }, { offset: 1, color: '#0f0' }],
});
attrs.body.fill = `url(#${id})`;
```

### ❌ 渐变直接传字符串

```javascript
// 错误：渐变对象不能被 fromJSON 解析为字符串
attrs: { body: { fill: 'linear-gradient(#f00, #0f0)' } }   // ❌ 这是 CSS 语法

// 正确：传渐变对象
attrs: {
  body: {
    fill: {
      type: 'linearGradient',
      stops: [{ offset: 0, color: '#f00' }, { offset: 1, color: '#0f0' }],
    },
  },
}
```

### ❌ defineMarker 漏写 tagName

```javascript
// 错误：tagName 默认补 'path'，但 d 属性必须配合 path 一起给
graph.defineMarker({ refX: 5, refY: 0 });  // 渲染为空

// 正确：path 类型
graph.defineMarker({ tagName: 'path', d: 'M0 0 L8 4 L0 8 z', fill: '#333' });

// 或者：非 path 元素必须显式指定 tagName 并避免 d
graph.defineMarker({ tagName: 'circle', r: 4, fill: '#333' });
```

### ❌ filter 名字大小写错误

```javascript
// 错误：内置名字严格匹配，写错会抛 Filter not found
filter: { name: 'drop-shadow', args: { dx: 2, dy: 2 } }   // ❌
filter: { name: 'grayscale',  args: { amount: 1 } }       // ❌

// 正确
filter: { name: 'dropShadow', args: { dx: 2, dy: 2 } }    // ✅
filter: { name: 'grayScale',  args: { amount: 1 } }       // ✅
```

### ❌ 重复定义同样的渐变

```javascript
// 错误：每次都拼 id，但 X6 内部已经去重，多此一举
for (const node of nodes) {
  const id = graph.defineGradient({ type: 'linearGradient', stops: [...] });
  // ...
}

// 正确：调用一次拿到 id 即可
const gradientId = graph.defineGradient({ type: 'linearGradient', stops: [...] });
nodes.forEach((n) => n.attr('body/fill', `url(#${gradientId})`));
```
