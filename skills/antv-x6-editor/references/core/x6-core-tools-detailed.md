---
id: "x6-core-tools-detailed"
title: "X6 内置工具（Tools）详细指南"
description: |
  X6 3.x 提供多种内置工具（Tools），可附加到节点或边上实现交互功能。
  包括 button、button-remove、editor、boundary、vertices、segments、arrowhead、anchor 等工具。

library: "x6"
version: "3.x"
category: "core"
subcategory: "tools"
tags:
  - "tools"
  - "工具"
  - "button"
  - "button-remove"
  - "editor"
  - "boundary"
  - "vertices"
  - "segments"
  - "arrowhead"
  - "anchor"
  - "交互"

related:
  - "x6-intermediate-tools"
  - "x6-core-events"

use_cases:
  - "节点上添加删除按钮"
  - "双击编辑节点/边文本"
  - "拖拽边的中间顶点"
  - "拖拽边的线段"
  - "显示节点边界框"
  - "拖拽箭头改变连接"
  - "拖拽锚点调整连接位置"

difficulty: "intermediate"
completeness: "full"
---

## 内置工具完整列表

### 节点工具

| 工具名称 | 说明 | 典型用途 |
|----------|------|---------|
| `button` | 自定义按钮 | 在节点上添加操作按钮 |
| `button-remove` | 删除按钮 | 点击删除节点 |
| `boundary` | 边界框 | 显示节点的虚线边界 |
| `editor` | 文本编辑器 | 双击编辑节点标签文本 |

### 边工具

| 工具名称 | 说明 | 典型用途 |
|----------|------|---------|
| `button` | 自定义按钮 | 在边上添加操作按钮 |
| `button-remove` | 删除按钮 | 点击删除边 |
| `boundary` | 边界框 | 显示边的包围盒 |
| `vertices` | 顶点工具 | 拖拽添加/移动/删除边的顶点 |
| `segments` | 线段工具 | 拖拽边的正交线段 |
| `arrowhead` | 箭头工具 | 拖拽边的起止箭头改变连接 |
| `anchor` | 锚点工具 | 拖拽调整边在节点上的锚点位置 |
| `editor` | 文本编辑器 | 双击编辑边的标签文本 |

---

## Button 工具

在节点或边上显示一个可点击的按钮。

### 配置项

| 属性 | 类型 | 说明 |
|------|------|------|
| `x` | `number \| string` | 按钮 X 位置（支持百分比如 `'100%'`） |
| `y` | `number \| string` | 按钮 Y 位置 |
| `offset` | `{ x, y }` | 偏移量 |
| `rotate` | `boolean` | 是否跟随节点旋转 |
| `useCellGeometry` | `boolean` | 是否基于节点几何定位 |
| `markup` | `Markup[]` | 自定义按钮 SVG 结构 |
| `onClick` | `function` | 点击回调 |

### 示例：自定义按钮

```javascript
node.addTools([
  {
    name: 'button',
    args: {
      x: '100%',
      y: 0,
      offset: { x: -10, y: 10 },
      markup: [
        {
          tagName: 'circle',
          selector: 'button',
          attrs: {
            r: 8,
            stroke: '#fe854f',
            'stroke-width': 2,
            fill: 'white',
            cursor: 'pointer',
          },
        },
        {
          tagName: 'text',
          textContent: '+',
          selector: 'icon',
          attrs: {
            fill: '#fe854f',
            'font-size': 12,
            'text-anchor': 'middle',
            'pointer-events': 'none',
            y: '0.3em',
          },
        },
      ],
      onClick({ cell }) {
        console.log('Button clicked on', cell.id);
      },
    },
  },
]);
```

---

## Button-Remove 工具

预设的删除按钮，点击后删除所在的节点或边。

### 配置项

继承 Button 的所有配置项，默认带红色 X 图标。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `x` | `number` | `0` | X 位置 |
| `y` | `number` | `0` | Y 位置 |
| `offset` | `{ x, y }` | - | 偏移量 |

### 示例

```javascript
// 节点悬停时显示删除按钮
graph.on('node:mouseenter', ({ node }) => {
  node.addTools([
    {
      name: 'button-remove',
      args: { x: 0, y: 0, offset: { x: 4, y: 4 } },
    },
  ]);
});

graph.on('node:mouseleave', ({ node }) => {
  node.removeTools();
});
```

---

## Editor 工具（文本编辑）

双击节点或边的标签时，弹出就地编辑器修改文本。

### 配置项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `attrs.fontSize` | `number` | `14` | 编辑器字体大小 |
| `attrs.fontFamily` | `string` | `'Arial'` | 字体 |
| `attrs.color` | `string` | `'#000'` | 文字颜色 |
| `attrs.backgroundColor` | `string` | `'#fff'` | 编辑器背景色 |
| `getText` | `function` | - | 获取当前文本的函数 |
| `setText` | `function` | - | 设置新文本的函数 |

### 示例：节点文本编辑

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({ container: 'container' });

const node = graph.addNode({
  shape: 'rect',
  x: 100,
  y: 100,
  width: 120,
  height: 50,
  label: '双击编辑',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 6, ry: 6 } },
});

// 添加编辑器工具
node.addTools([
  {
    name: 'editor',
    args: {
      attrs: {
        fontSize: 14,
        color: '#333',
        backgroundColor: '#fafafa',
      },
      getText({ cell }) {
        return cell.attr('label/text') || '';
      },
      setText({ cell, value }) {
        cell.attr('label/text', value);
      },
    },
  },
]);
```

### 示例：边标签编辑

```javascript
edge.addTools([
  {
    name: 'editor',
    args: {
      getText({ cell }) {
        return cell.getLabelAt(0)?.attrs?.label?.text || '';
      },
      setText({ cell, value }) {
        cell.setLabelAt(0, { attrs: { label: { text: value } } });
      },
    },
  },
]);
```

---

## Boundary 工具

显示节点或边的虚线边界框。

### 配置项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `padding` | `number \| SideOptions` | `10` | 边界距节点的内边距 |
| `rotate` | `boolean` | - | 是否跟随节点旋转 |
| `useCellGeometry` | `boolean` | `true` | 基于节点几何计算 |
| `attrs` | `object` | 虚线矩形 | 边界框样式 |

### 示例

```javascript
node.addTools([
  {
    name: 'boundary',
    args: {
      padding: 8,
      attrs: {
        fill: 'none',
        stroke: '#1890ff',
        'stroke-width': 1,
        'stroke-dasharray': '4, 4',
      },
    },
  },
]);
```

---

## Vertices 工具（边顶点）

在边上显示可拖拽的顶点控制点，可以添加、移动、删除顶点来调整边的路径。

### 配置项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `snapRadius` | `number` | `20` | 吸附半径 |
| `addable` | `boolean` | `true` | 是否允许点击边添加顶点 |
| `removable` | `boolean` | `true` | 是否允许删除顶点 |
| `removeRedundancies` | `boolean` | `true` | 自动移除共线顶点 |
| `stopPropagation` | `boolean` | `true` | 阻止事件冒泡 |
| `attrs` | `object` | 圆形控制点 | 顶点样式 |
| `modifiers` | `ModifierKey` | - | 添加顶点时需按住的修饰键 |

### 示例

```javascript
graph.on('edge:mouseenter', ({ edge }) => {
  edge.addTools([
    {
      name: 'vertices',
      args: {
        snapRadius: 15,
        attrs: {
          r: 5,
          fill: '#fff',
          stroke: '#1890ff',
          'stroke-width': 2,
          cursor: 'move',
        },
      },
    },
  ]);
});

graph.on('edge:mouseleave', ({ edge }) => {
  edge.removeTools();
});
```

### 交互方式

- **添加顶点**：点击边的路径空白处
- **移动顶点**：拖拽已有的顶点控制点
- **删除顶点**：双击顶点（或通过 `removable` 配置）

---

## Segments 工具（线段拖拽）

在正交路由的边上，显示可拖拽的线段控制条，拖拽线段可调整正交路径。

### 配置项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `precision` | `number` | `0.5` | 线段检测精度 |
| `threshold` | `number` | `40` | 线段最小长度阈值 |
| `snapRadius` | `number` | `10` | 吸附半径 |
| `removeRedundancies` | `boolean` | `true` | 自动移除冗余点 |
| `stopPropagation` | `boolean` | `true` | 阻止事件冒泡 |
| `attrs` | `object` | 矩形控制条 | 线段手柄样式 |

### 示例

```javascript
graph.on('edge:mouseenter', ({ edge }) => {
  edge.addTools([
    {
      name: 'segments',
      args: {
        snapRadius: 10,
        attrs: {
          width: 20,
          height: 8,
          x: -10,
          y: -4,
          rx: 4,
          ry: 4,
          fill: '#333',
          stroke: '#fff',
          'stroke-width': 2,
        },
      },
    },
  ]);
});

graph.on('edge:mouseleave', ({ edge }) => {
  edge.removeTools();
});
```

### 关键说明

- **适用于正交路由**（`orth`、`manhattan`）的边
- 只在水平或垂直线段上显示控制条
- 拖拽时自动调整相邻顶点坐标

---

## Arrowhead 工具

在边的起点或终点显示可拖拽的箭头，拖拽可改变边的连接目标。

### 配置项

| 属性 | 类型 | 说明 |
|------|------|------|
| `type` | `'source' \| 'target'` | 箭头在边的哪一端 |
| `attrs` | `object` | 箭头 SVG 样式 |

### 示例

```javascript
edge.addTools([
  { name: 'source-arrowhead' },
  { name: 'target-arrowhead' },
]);
```

### 内置预设

- `'source-arrowhead'`：源端箭头工具
- `'target-arrowhead'`：目标端箭头工具

---

## Anchor 工具

在边的连接端显示锚点控制器，拖拽可调整边在节点上的锚点位置。

### 配置项

| 属性 | 类型 | 说明 |
|------|------|------|
| `type` | `'source' \| 'target'` | 控制哪一端的锚点 |
| `customAnchorAttrs` | `object` | 自定义锚点样式 |
| `defaultAnchorAttrs` | `object` | 默认锚点样式 |
| `resetAnchor` | `boolean \| AnchorConfig` | 双击时重置锚点 |

### 示例

```javascript
edge.addTools([
  {
    name: 'anchor',
    args: {
      type: 'source',
      customAnchorAttrs: {
        'stroke-width': 4,
        stroke: '#33334F',
        fill: '#FFFFFF',
        r: 5,
      },
    },
  },
  {
    name: 'anchor',
    args: { type: 'target' },
  },
]);
```

---

## 工具的添加与管理

### 添加工具

```javascript
// 添加单个工具
node.addTools([{ name: 'button-remove', args: { x: 0, y: 0 } }]);

// 添加多个工具
edge.addTools([
  { name: 'vertices' },
  { name: 'segments' },
  { name: 'source-arrowhead' },
  { name: 'target-arrowhead' },
]);
```

### 移除工具

```javascript
// 移除所有工具
node.removeTools();
```

### 检查工具

```javascript
if (node.hasTools()) {
  node.removeTools();
}
```

### 悬停显示/隐藏模式

```javascript
graph.on('node:mouseenter', ({ node }) => {
  node.addTools([
    { name: 'boundary' },
    { name: 'button-remove', args: { x: 0, y: 0 } },
  ]);
});

graph.on('node:mouseleave', ({ node }) => {
  node.removeTools();
});

graph.on('edge:mouseenter', ({ edge }) => {
  edge.addTools([
    { name: 'vertices' },
    { name: 'button-remove', args: { distance: 20 } },
  ]);
});

graph.on('edge:mouseleave', ({ edge }) => {
  edge.removeTools();
});
```

---

## 常见错误与修正

### 错误 1: 使用不存在的 hideTools/showTools API

```javascript
// ❌ 错误：X6 3.x 不存在此 API
node.hideTools();
node.showTools();

// ✅ 正确：通过 addTools/removeTools 控制显示
node.addTools([...]);
node.removeTools();
```

### 错误 2: 在 Graph 选项中配置工具

```javascript
// ❌ 错误：工具不在 Graph 配置中设置
const graph = new Graph({
  container: 'container',
  tools: ['button-remove'],  // 不存在此配置
});

// ✅ 正确：通过节点/边实例添加
const node = graph.addNode({ ... });
node.addTools([{ name: 'button-remove', args: { x: 0, y: 0 } }]);
```

### 错误 3: addTools 传入非数组

```javascript
// ❌ 错误：addTools 参数应为数组
node.addTools({ name: 'boundary' });

// ✅ 正确：传入数组
node.addTools([{ name: 'boundary' }]);
```
