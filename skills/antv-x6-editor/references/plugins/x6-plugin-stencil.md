---
id: "x6-plugin-stencil"
title: "X6 Stencil 拖拽面板插件"
description: |
  Stencil 是侧边栏拖拽面板，提供预定义节点模板的分组展示和搜索功能。
  用户可从 Stencil 面板将节点拖拽到画布中，常用于流程图编辑器、DAG 编辑器的工具箱。

library: "x6"
version: "3.x"
category: "plugins"
subcategory: "stencil"
tags:
  - "stencil"
  - "拖拽面板"
  - "侧边栏"
  - "工具箱"
  - "节点模板"
  - "分组"
  - "搜索"
  - "drag"
  - "面板"

related:
  - "x6-plugins"
  - "x6-plugin-dnd"
  - "x6-core-graph-init"
  - "x6-pattern-flowchart"

use_cases:
  - "流程图编辑器的左侧节点面板"
  - "带分组的节点工具箱"
  - "支持搜索的组件库面板"
  - "从侧边栏拖入预定义节点到画布"

difficulty: "intermediate"
completeness: "full"
---

## 核心概念

**Stencil** 是一个独立的侧边面板组件，内部维护独立的小画布用于展示节点模板。用户从 Stencil 中拖拽节点到目标画布，Stencil 内部使用 Dnd 插件实现拖拽逻辑。

Stencil 特性：
- 支持**分组**展示节点模板
- 支持**搜索过滤**
- 支持**折叠/展开**分组
- 支持自定义**布局**（网格布局等）
- 拖拽时可自定义 dragNode 和 dropNode

## 基本用法

```javascript
import { Graph, Stencil } from '@antv/x6';

// 1. 创建目标画布
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  grid: { visible: true },
});

// 2. 通过 graph.use() 注册 Stencil 插件
const stencil = new Stencil({
  title: '组件库',
  target: graph,
  stencilGraphWidth: 200,
  stencilGraphHeight: 300,
  groups: [
    { name: 'basic', title: '基础节点' },
    { name: 'advanced', title: '高级节点' },
  ],
});
graph.use(stencil);

// 3. 将 Stencil 容器挂载到 DOM
document.getElementById('stencil-container').appendChild(stencil.container);

// 4. 加载节点模板到分组（推荐使用 graph.createNode 创建节点模板）
const rect = graph.createNode({
  shape: 'rect',
  width: 80,
  height: 40,
  label: '矩形',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f' } },
});

const circle = graph.createNode({
  shape: 'circle',
  width: 60,
  height: 60,
  label: '圆形',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f' } },
});

stencil.load([rect, circle], 'basic');

stencil.load(
  [
    graph.createNode({
      shape: 'rect',
      width: 80,
      height: 40,
      label: '自定义',
      attrs: { body: { fill: '#efdbff', stroke: '#9254de', rx: 6, ry: 6 } },
    }),
  ],
  'advanced',
);
```

## 配置项

### StencilOptions

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `target` | `Graph` | ✓ | - | 目标画布实例 |
| `title` | `string` | | `'Stencil'` | 面板标题 |
| `groups` | `StencilGroup[]` | | - | 分组配置 |
| `stencilGraphWidth` | `number` | | `200` | 面板内画布宽度 |
| `stencilGraphHeight` | `number` | | `800` | 面板内画布高度 |
| `stencilGraphPadding` | `number` | | - | 面板内画布内边距 |
| `stencilGraphOptions` | `Options` | | - | 面板内画布额外配置 |
| `collapsable` | `boolean` | | `false` | 分组是否可折叠 |
| `search` | `boolean \| Function \| object` | | - | 搜索配置 |
| `placeholder` | `string` | | `'Search'` | 搜索输入框占位文本 |
| `notFoundText` | `string` | | `'No matches found'` | 搜索无结果提示 |
| `layout` | `Function` | | 网格布局 | 节点布局函数 |
| `layoutOptions` | `object` | | - | 布局参数 |
| `getDragNode` | `Function` | | 克隆源节点 | 自定义拖拽时的节点 |
| `getDropNode` | `Function` | | 克隆拖拽节点 | 自定义放置到画布的节点 |
| `validateNode` | `Function` | | - | 验证节点是否可放置 |

### StencilGroup

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `name` | `string` | ✓ | - | 分组唯一标识 |
| `title` | `string` | | `name` | 分组显示标题 |
| `collapsed` | `boolean` | | `false` | 是否默认折叠 |
| `collapsable` | `boolean` | | 继承父级 | 是否可折叠 |
| `graphWidth` | `number` | | 继承 `stencilGraphWidth` | 该组画布宽度 |
| `graphHeight` | `number` | | 继承 `stencilGraphHeight` | 该组画布高度 |
| `graphPadding` | `number` | | 继承 | 该组画布内边距 |
| `graphOptions` | `Options` | | - | 该组画布额外配置 |
| `layout` | `Function` | | 继承父级 | 该组节点布局函数 |
| `layoutOptions` | `object` | | 继承父级 | 该组布局参数 |

## 搜索配置

### 启用搜索

```javascript
const stencil = new Stencil({
  target: graph,
  search: true,  // 默认按 shape 名称搜索
  placeholder: '搜索节点...',
  notFoundText: '未找到匹配节点',
  groups: [{ name: 'basic', title: '基础节点' }],
});
```

### 自定义搜索过滤

```javascript
const stencil = new Stencil({
  target: graph,
  search(cell, keyword, groupName, stencil) {
    // 按 label 文本搜索
    return cell.attr('label/text')?.includes(keyword) || false;
  },
  groups: [{ name: 'basic', title: '基础节点' }],
});
```

## 自定义拖拽和放置节点

```javascript
const stencil = new Stencil({
  target: graph,
  groups: [{ name: 'basic', title: '基础节点' }],

  // 拖拽过程中展示的节点（可简化显示）
  getDragNode(sourceNode, options) {
    return sourceNode.clone();
  },

  // 放置到画布上的节点（可添加额外属性）
  getDropNode(draggingNode, options) {
    const node = draggingNode.clone();
    node.setAttrs({
      body: { stroke: '#1890ff', strokeWidth: 2 },
    });
    return node;
  },

  // 验证是否允许放置
  validateNode(droppingNode, options) {
    // 返回 false 阻止放置
    return true;
  },
});
```

## 自定义布局

默认使用 2 列网格布局。可自定义：

```javascript
const stencil = new Stencil({
  target: graph,
  groups: [{ name: 'basic', title: '基础节点' }],
  layoutOptions: {
    columns: 2,        // 列数
    columnWidth: 90,   // 列宽
    rowHeight: 80,     // 行高
    dx: 10,            // X 偏移
    dy: 10,            // Y 偏移
    resizeToFit: false,
  },
});
```

## API 方法

| 方法 | 说明 |
|------|------|
| `stencil.load(nodes, groupName?)` | 加载节点数组到指定分组 |
| `stencil.load({ groupA: nodes, groupB: nodes })` | 按对象映射批量加载到多个分组 |
| `stencil.unload(nodes, groupName?)` | 从指定分组移除节点 |
| `stencil.unload({ groupA: nodes })` | 按对象映射批量移除 |
| `stencil.toggleGroup(groupName)` | 切换分组的展开/折叠状态 |
| `stencil.isGroupCollapsed(groupName)` | 判断分组是否折叠 |
| `stencil.container` | 获取 Stencil 的 DOM 容器元素 |

## 完整示例：流程图编辑器工具箱

```javascript
import { Graph, Stencil, Snapline, History } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  grid: { visible: true, size: 10 },
  connecting: {
    allowBlank: false,
    router: 'orth',
    connector: 'rounded',
  },
});

graph.use(new Snapline({ enabled: true }));
graph.use(new History({ enabled: true }));

const stencil = new Stencil({
  title: '流程节点',
  target: graph,
  stencilGraphWidth: 180,
  stencilGraphHeight: 400,
  collapsable: true,
  search: true,
  placeholder: '搜索节点',
  groups: [
    { name: 'basic', title: '基础形状', collapsed: false },
    { name: 'flow', title: '流程控制', collapsed: false },
  ],
  layoutOptions: {
    columns: 2,
    columnWidth: 80,
    rowHeight: 60,
    dx: 10,
    dy: 10,
  },
});

document.getElementById('stencil-container').appendChild(stencil.container);

// 基础形状
const rect = graph.createNode({
  shape: 'rect',
  width: 60,
  height: 40,
  label: '矩形',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 4, ry: 4 } },
});

const circle = graph.createNode({
  shape: 'circle',
  width: 50,
  height: 50,
  label: '圆形',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f' } },
});

const ellipse = graph.createNode({
  shape: 'ellipse',
  width: 60,
  height: 40,
  label: '椭圆',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f' } },
});

stencil.load([rect, circle, ellipse], 'basic');

// 流程控制
const decision = graph.createNode({
  shape: 'polygon',
  width: 60,
  height: 40,
  label: '判断',
  attrs: {
    body: {
      fill: '#fff',
      stroke: '#8f8f8f',
      refPoints: '0,10 10,0 20,10 10,20',
    },
  },
});

const subProcess = graph.createNode({
  shape: 'rect',
  width: 60,
  height: 40,
  label: '子流程',
  attrs: { body: { fill: '#e6f7ff', stroke: '#1890ff', rx: 4, ry: 4 } },
});

stencil.load([decision, subProcess], 'flow');
```

## 常见错误与修正

### ❌ 错误使用 layout 配置为对象

```javascript
// 错误：layout 应为函数，不能是对象
const stencil = new Stencil({
  target: graph,
  layout: { columns: 1 }, // ❌ 报错：t.call is not a function
});

// 正确：使用 layoutOptions 配置布局参数
const stencil = new Stencil({
  target: graph,
  layoutOptions: { columns: 1 }, // ✅
});
```

### ❌ 直接传 shape 配置对象而非 Node 实例

```javascript
// 错误：直接传 shape 配置对象可能导致渲染异常
stencil.load([{ shape: 'rect', width: 80, height: 40 }], 'basic'); // ❌

// 正确：使用 graph.createNode 创建节点实例
const node = graph.createNode({ shape: 'rect', width: 80, height: 40 });
stencil.load([node], 'basic'); // ✅
```

### ❌ 忘记将 Stencil 容器挂载到 DOM

```javascript
// 错误：只注册了插件，但没有将 stencil 面板挂载到页面 DOM
const stencil = new Stencil({ target: graph, groups: [...] });
graph.use(stencil);
// 缺少 DOM 挂载，面板不会显示 ❌

// 正确：注册后还需将 stencil.container 挂载到 DOM
const stencil = new Stencil({ target: graph, groups: [...] });
graph.use(stencil);
document.getElementById('panel').appendChild(stencil.container); // ✅
```

### ❌ 忘记设置 target

```javascript
// 错误：缺少 target
const stencil = new Stencil({
  groups: [{ name: 'basic', title: '基础' }],
}); // ❌ 拖拽无目标

// 正确：必须指定目标画布
const stencil = new Stencil({
  target: graph,  // ✅
  groups: [{ name: 'basic', title: '基础' }],
});
```

### ❌ 传数组但不指定 groupName（有分组时）

```javascript
// 不推荐：有多个分组时，不指定 groupName 会加载到默认分组
stencil.load([{ shape: 'rect', width: 80, height: 40 }]); // 可能不是预期分组

// 推荐方式一：指定 groupName
stencil.load([{ shape: 'rect', width: 80, height: 40 }], 'basic'); // ✅

// 推荐方式二：使用对象映射批量加载
stencil.load({
  basic: [{ shape: 'rect', width: 80, height: 40 }],
  advanced: [{ shape: 'circle', width: 60, height: 60 }],
}); // ✅
```

</skill>