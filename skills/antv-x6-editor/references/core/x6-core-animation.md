---
id: "x6-core-animation"
title: "X6 动画与过渡"
description: |
  X6 节点和边的动画系统完整指南。
  包含 animate API、配置式动画、注册动画 Shape、动画控制（暂停/恢复/取消）、动画事件。

library: "x6"
version: "3.x"
category: "core"
subcategory: "animation"
tags:
  - "动画"
  - "animation"
  - "animate"
  - "过渡"
  - "transition"
  - "暂停"
  - "pause"
  - "play"
  - "cancel"
  - "finish"
  - "reverse"
  - "Web Animations API"
  - "关键帧"
  - "keyframes"
  - "duration"
  - "iterations"

related:
  - "x6-core-node"
  - "x6-core-edge"
  - "x6-core-events"

use_cases:
  - "为节点添加位置移动动画"
  - "为节点添加大小变化动画"
  - "为自定义属性（如 data）添加动画"
  - "通过配置式声明动画"
  - "注册带动画的自定义 Shape"
  - "控制动画的暂停、恢复、取消"
  - "监听动画完成事件"

anti_patterns:
  - "动画属性路径使用 / 分隔（如 position/x），不要直接写 x"
  - "不要混淆 CSS 动画属性名和 X6 动画配置"
---

# X6 动画与过渡

X6 的 `animate` API 基于 [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) 标准实现，提供强大的动画能力。

## 基本用法

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 400,
  background: { color: '#F2F7FA' },
});

const node = graph.addNode({
  shape: 'rect',
  x: 100,
  y: 140,
  width: 100,
  height: 50,
  label: 'Hello X6',
  attrs: { body: { strokeWidth: 1, rx: 6, ry: 6 } },
});

// 添加位置动画：节点从当前位置移动到 x=300
node.animate(
  { 'position/x': 300 },
  { duration: 1000, direction: 'alternate', iterations: Infinity },
);
```

## animate API 参数

```javascript
cell.animate(keyframes, options);
```

### keyframes — 关键帧

指定动画属性及其目标值。属性路径使用 `/` 分隔，基于 `cell.setPropByPath()` 实现。

```javascript
// 单一目标值（从当前值动画到目标值）
node.animate({ 'position/x': 300 }, { duration: 1000 });

// 数组形式（指定起始值和目标值）
node.animate({ 'position/x': [100, 300] }, { duration: 1000 });

// 多个属性同时动画
node.animate(
  { 'position/x': 300, 'position/y': 200 },
  { duration: 1000 },
);
```

### 常用属性路径

| 路径 | 说明 |
|------|------|
| `position/x` | 节点 X 坐标 |
| `position/y` | 节点 Y 坐标 |
| `size/width` | 节点宽度 |
| `size/height` | 节点高度 |
| `attrs/body/fill` | 节点填充色 |
| `attrs/body/opacity` | 节点透明度 |
| `data/xxx` | 自定义数据属性（用于 HTML 节点） |

### options — 动画配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `duration` | number | - | 动画持续时间（毫秒） |
| `delay` | number | 0 | 延迟开始（毫秒） |
| `direction` | string | `'normal'` | `'normal'`/`'reverse'`/`'alternate'`/`'alternate-reverse'` |
| `iterations` | number | 1 | 重复次数，`Infinity` 表示无限 |
| `easing` | string | `'linear'` | 缓动函数，如 `'ease'`、`'ease-in-out'` |
| `fill` | string | `'none'` | 动画结束后状态：`'forwards'`/`'backwards'`/`'both'`/`'none'` |

## 配置式动画

直接在节点配置中声明动画，节点添加到画布后自动播放：

```javascript
graph.addNode({
  shape: 'rect',
  x: 100,
  y: 140,
  width: 100,
  height: 50,
  label: 'Hello X6',
  attrs: { body: { strokeWidth: 1, rx: 6, ry: 6 } },
  // 配置式动画：数组中每项对应一个 animate 调用
  animation: [
    [
      { 'position/x': 300 },
      { duration: 1000, direction: 'alternate', iterations: Infinity },
    ],
  ],
});
```

`animation` 是一个数组，每一项为 `[keyframes, options]` 元组，节点添加到画布后自动开始播放。

## 注册动画 Shape

为一批节点复用相同的动画效果：

```javascript
import { Graph } from '@antv/x6';

Graph.registerNode(
  'animated-rect',
  {
    inherit: 'rect',
    width: 150,
    height: 60,
    attrs: {
      body: { strokeWidth: 1, rx: 6, ry: 6 },
    },
    animation: [
      [
        { 'position/x': 300 },
        { duration: 1000, direction: 'alternate', iterations: Infinity },
      ],
    ],
  },
  true,
);

// 所有使用 animated-rect 的节点都自动拥有动画
graph.addNode({ shape: 'animated-rect', x: 100, y: 50, label: 'Node 1' });
graph.addNode({ shape: 'animated-rect', x: 100, y: 150, label: 'Node 2' });
```

## 自定义属性动画（HTML 节点）

对 data 中的自定义属性添加动画，配合 HTML 节点实现复杂效果：

```javascript
import { Graph, Shape, Dom } from '@antv/x6';

Shape.HTML.register({
  shape: 'progress-node',
  width: 160,
  height: 40,
  effect: ['data'],
  html(cell) {
    const { progress } = cell.getData() ?? { progress: 0 };
    const div = document.createElement('div');
    Dom.css(div, {
      width: '100%',
      height: '100%',
      background: `linear-gradient(to right, #1890ff ${progress * 100}%, #f0f0f0 ${progress * 100}%)`,
      borderRadius: '4px',
      border: '1px solid #d9d9d9',
    });
    return div;
  },
});

const node = graph.addNode({
  shape: 'progress-node',
  x: 100,
  y: 100,
  data: { progress: 0 },
});

// 对 data/progress 添加动画
node.animate(
  { 'data/progress': 1 },
  { duration: 2000, fill: 'forwards' },
);
```

## 动画控制

`animate` 返回一个动画对象，支持控制操作：

```javascript
const animation = node.animate(
  { 'position/x': [100, 300] },
  { duration: 2000, iterations: Infinity },
);

// 暂停
animation.pause();

// 恢复播放
animation.play();

// 取消动画（恢复到初始状态）
animation.cancel();

// 立即结束动画（跳到最终状态）
animation.finish();

// 反向播放
animation.reverse();

// 更新播放速度（2倍速）
animation.updatePlaybackRate(2);
```

### 获取节点上的所有动画

```javascript
const animations = node.getAnimations(); // Animation[]
animations.forEach((anim) => anim.pause());
```

## 动画事件

### 方式一：Web Animations API 风格

```javascript
const animation = node.animate(
  { 'position/x': [100, 300] },
  { duration: 1000, iterations: 1 },
);

animation.onfinish = () => {
  console.log('动画结束');
};

animation.oncancel = () => {
  console.log('动画被取消');
};
```

### 方式二：X6 事件系统

```javascript
// 监听所有节点动画结束
graph.on('node:animation:finish', ({ node }) => {
  console.log('Node animation finished:', node.id);
});

// 监听所有 cell 动画取消
graph.on('cell:animation:cancel', ({ cell }) => {
  console.log('Animation cancelled:', cell.id);
});
```

支持的事件：
- `cell:animation:finish` — 动画结束
- `cell:animation:cancel` — 动画取消
- `node:animation:finish` — 节点动画结束
- `node:animation:cancel` — 节点动画取消
- `edge:animation:finish` — 边动画结束
- `edge:animation:cancel` — 边动画取消

## `translate` / `rotate` 的内置过渡选项

> ⚠️ X6 3.x **不存在** `cell.transition(path, target, options)` 方法。常被误传的 "transition 方法"其实是 `node.translate()` / `node.rotate()` 等位置变换方法上的一个**布尔/对象 options 字段**，底层仍走 `animate`。

### 真实 API（核对自 `model/node.ts`）

```typescript
node.translate(tx: number, ty: number, options?: {
  transition?: boolean | KeyframeEffectOptions  // ← 这里才是 transition
  restrict?: RectangleLike | null
  exclude?: Cell[]
  // ...
})
```

当 `options.transition` 为 `true` 或对象时，X6 内部会**自动调用一次 `node.animate({'position/x', 'position/y'}, animateOptions)`**，默认 `{ duration: 100, fill: 'forwards' }`。

### 用法示例

```javascript
// 形式一：transition: true，使用默认动画参数（duration 100ms，fill forwards）
node.translate(200, 100, { transition: true });

// 形式二：transition: KeyframeEffectOptions，自定义动画参数
node.translate(200, 100, {
  transition: { duration: 800, easing: 'ease-in-out', fill: 'forwards' },
});
```

### 与 `node.animate` 的关系

| 方式 | 适用场景 |
|------|----------|
| `node.translate(tx, ty, { transition })` | 仅做位置平移，且希望平移本身带过渡动画 |
| `node.animate({ 'position/x', 'position/y' }, options)` | 任意属性、任意关键帧、需要拿到 `animation` 句柄做 pause/play/cancel |
| 配置式 `animation: [[keyframes, options]]` | 节点添加到画布后自动开始的常驻动画 |

`translate({ transition })` 只是 `animate` 的一个语义糖，**任何更复杂的动画都必须用 `animate`**。

## 常见错误与修正

### ❌ 属性路径写法错误

```javascript
// 错误：直接用 x 作为属性名
node.animate({ x: 300 }, { duration: 1000 });

// 正确：使用属性路径 position/x
node.animate({ 'position/x': 300 }, { duration: 1000 });
```

### ❌ 动画结束后节点回到原位

```javascript
// 错误：默认 fill='none'，动画结束后属性恢复
node.animate({ 'position/x': 300 }, { duration: 1000 });

// 正确：设置 fill='forwards' 保持结束状态
node.animate({ 'position/x': 300 }, { duration: 1000, fill: 'forwards' });
```

### ❌ 误用不存在的 `node.transition(path, target, options)` 方法

```javascript
// 错误：X6 3.x 中 cell.transition(path, target, options) 不存在
// 运行时会报：node.transition is not a function
node.transition('position', { x: 300, y: 200 }, { duration: 1000 });

// 正确（位置过渡）：用 translate + transition 选项
node.translate(300 - node.position().x, 200 - node.position().y, {
  transition: { duration: 1000, easing: 'ease-in-out', fill: 'forwards' },
});

// 正确（通用过渡）：用 animate
node.animate(
  { 'position/x': 300, 'position/y': 200 },
  { duration: 1000, easing: 'ease-in-out', fill: 'forwards' },
);
```

### ❌ 容器选择器错误

```javascript
// 错误：直接传入 DOM 元素变量（评测/Playground 环境中 container 由运行环境注入）
const container = document.getElementById('container');
const graph = new Graph({ container });

// 正确：直接使用字符串字面量 'container'
const graph = new Graph({ container: 'container' });
```

### ❌ 用 `complete` 回调监听动画结束

```javascript
// 错误：X6 / Web Animations API 都没有 complete 回调
node.animate({ 'position/x': 300 }, {
  duration: 1000,
  complete: () => console.log('done'),
});

// 正确：监听返回的 Animation 对象的 onfinish
const animation = node.animate(
  { 'position/x': 300 },
  { duration: 1000, fill: 'forwards' },
);
animation.onfinish = () => console.log('done');

// 或者监听 graph 事件（适合多节点场景）
graph.on('node:animation:finish', ({ node }) => {
  console.log('Node animation finished:', node.id);
});
```
