---
id: g6-mds-layout-cluster-graph
title: G6 MDS 布局聚类图谱可视化
description: 使用 G6 的 MDS（多维尺度分析）布局构建图谱可视化，节点根据聚类（cluster）字段显示不同颜色，支持画布缩放、拖拽及元素拖动等交互行为。涵盖数据格式规范、节点样式映射、色板配置及常见错误修正。
library: G6
version: 5.x
category: layout
tags:
  - mds
  - 布局
  - 聚类
  - 图谱
  - 交互
  - 色板
  - palette
---

# G6 MDS 布局聚类图谱可视化

## 概述

MDS（Multidimensional Scaling，多维尺度分析）布局通过构造节点间的距离矩阵，在二维空间中尽可能还原节点在高维空间中的相对距离关系，适合展示节点间的相似度或结构关系。

本 skill 介绍如何：
1. 正确组织 G6 图数据格式（`nodes` + `edges` 顶层结构）
2. 配置 MDS 布局
3. 使用 `palette` 根据节点的 `cluster` 字段自动映射颜色
4. 启用画布缩放、拖拽及元素拖动交互

---

## 关键知识点

### 1. 数据格式

G6 的 `data` 配置项必须包含顶层的 `nodes` 和 `edges` 数组，**不能直接传入节点数组**：

```js
// ✅ 正确
const graph = new Graph({
  data: {
    nodes: [ { id: '0', data: { cluster: 'a' } }, ... ],
    edges: [ { source: '0', target: '1' }, ... ],
  },
});

// ❌ 错误 —— 直接传入节点数组
const graph = new Graph({
  data: [ { id: '0', data: { cluster: 'a' } }, ... ],
});
```

### 2. MDS 布局配置

```js
layout: {
  type: 'mds',
  linkDistance: 100,  // 节点间理想距离，默认 50
  // center 可选，默认 [0, 0]
}
```

### 3. 节点颜色按聚类映射（palette）

使用 `node.palette` 可根据节点数据字段自动分配颜色，无需手动枚举每个 cluster 的颜色：

```js
node: {
  palette: {
    field: 'cluster',   // 根据 data.cluster 字段分组
    color: 'tableau',   // 使用内置色板，也可传入颜色数组
  },
}
```

### 4. 内置交互行为

| 行为名称         | 说明             |
| ---------------- | ---------------- |
| `drag-canvas`    | 拖拽画布         |
| `zoom-canvas`    | 滚轮缩放画布     |
| `drag-element`   | 拖拽节点/边      |

```js
behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
```

---

## 最小可运行示例

```js
import { Graph } from '@antv/g6';

const data = {
  nodes: [
    { id: '0',  data: { cluster: 'a' } },
    { id: '1',  data: { cluster: 'a' } },
    { id: '2',  data: { cluster: 'a' } },
    { id: '3',  data: { cluster: 'a' } },
    { id: '4',  data: { cluster: 'a' } },
    { id: '5',  data: { cluster: 'a' } },
    { id: '6',  data: { cluster: 'a' } },
    { id: '7',  data: { cluster: 'a' } },
    { id: '8',  data: { cluster: 'a' } },
    { id: '9',  data: { cluster: 'a' } },
    { id: '10', data: { cluster: 'a' } },
    { id: '11', data: { cluster: 'a' } },
    { id: '12', data: { cluster: 'a' } },
    { id: '13', data: { cluster: 'b' } },
    { id: '14', data: { cluster: 'b' } },
    { id: '15', data: { cluster: 'b' } },
    { id: '16', data: { cluster: 'b' } },
    { id: '17', data: { cluster: 'b' } },
    { id: '18', data: { cluster: 'c' } },
    { id: '19', data: { cluster: 'c' } },
    { id: '20', data: { cluster: 'c' } },
    { id: '21', data: { cluster: 'c' } },
    { id: '22', data: { cluster: 'c' } },
    { id: '23', data: { cluster: 'c' } },
    { id: '24', data: { cluster: 'c' } },
    { id: '25', data: { cluster: 'c' } },
    { id: '26', data: { cluster: 'c' } },
    { id: '27', data: { cluster: 'c' } },
    { id: '28', data: { cluster: 'c' } },
    { id: '29', data: { cluster: 'c' } },
    { id: '30', data: { cluster: 'c' } },
    { id: '31', data: { cluster: 'd' } },
    { id: '32', data: { cluster: 'd' } },
    { id: '33', data: { cluster: 'd' } },
  ],
  edges: [
    { source: '0',  target: '1'  },
    { source: '0',  target: '2'  },
    { source: '0',  target: '3'  },
    { source: '0',  target: '4'  },
    { source: '0',  target: '5'  },
    { source: '0',  target: '7'  },
    { source: '0',  target: '8'  },
    { source: '0',  target: '9'  },
    { source: '0',  target: '10' },
    { source: '0',  target: '11' },
    { source: '0',  target: '13' },
    { source: '0',  target: '14' },
    { source: '0',  target: '15' },
    { source: '0',  target: '16' },
    { source: '2',  target: '3'  },
    { source: '4',  target: '5'  },
    { source: '4',  target: '6'  },
    { source: '5',  target: '6'  },
    { source: '7',  target: '13' },
    { source: '8',  target: '14' },
    { source: '9',  target: '10' },
    { source: '10', target: '22' },
    { source: '10', target: '14' },
    { source: '10', target: '12' },
    { source: '10', target: '24' },
    { source: '10', target: '21' },
    { source: '10', target: '20' },
    { source: '11', target: '24' },
    { source: '11', target: '22' },
    { source: '11', target: '14' },
    { source: '12', target: '13' },
    { source: '16', target: '17' },
    { source: '16', target: '18' },
    { source: '16', target: '21' },
    { source: '16', target: '22' },
    { source: '17', target: '18' },
    { source: '17', target: '20' },
    { source: '18', target: '19' },
    { source: '19', target: '20' },
    { source: '19', target: '33' },
    { source: '19', target: '22' },
    { source: '19', target: '23' },
    { source: '20', target: '21' },
    { source: '21', target: '22' },
    { source: '22', target: '24' },
    { source: '22', target: '25' },
    { source: '22', target: '26' },
    { source: '22', target: '23' },
    { source: '22', target: '28' },
    { source: '22', target: '30' },
    { source: '22', target: '31' },
    { source: '22', target: '32' },
    { source: '22', target: '33' },
    { source: '23', target: '28' },
    { source: '23', target: '27' },
    { source: '23', target: '29' },
    { source: '23', target: '30' },
    { source: '23', target: '31' },
    { source: '23', target: '33' },
    { source: '32', target: '33' },
  ],
};

const graph = new Graph({
  container: 'container',
  autoFit: 'view',
  padding: 20,
  data,
  node: {
    style: {
      labelText: (d) => d.id,
      labelFill: '#fff',
      labelPlacement: 'center',
      labelFontSize: 10,
    },
    // 根据 cluster 字段自动分配颜色
    palette: {
      field: 'cluster',
      color: 'tableau',
    },
  },
  layout: {
    type: 'mds',
    nodeSize: 32,
    linkDistance: 100,
  },
  behaviors: ['drag-element', 'drag-canvas', 'zoom-canvas'],
});

graph.render();
```

---

## 完整配置说明

### Graph 配置项

| 配置项      | 说明                                         | 类型                    | 示例值                              |
| ----------- | -------------------------------------------- | ----------------------- | ----------------------------------- |
| `container` | 挂载容器的 DOM id 或 HTMLElement             | `string \| HTMLElement` | `'container'`                       |
| `autoFit`   | 自动适配视口，`'view'` 表示缩放至全部可见    | `'view' \| 'center'`    | `'view'`                            |
| `padding`   | 自适应时的内边距（像素）                     | `number \| number[]`    | `20`                                |
| `data`      | 图数据，必须包含 `nodes` 和 `edges` 顶层字段 | `GraphData`             | `{ nodes: [...], edges: [...] }`    |
| `node`      | 节点全局配置（样式、色板等）                 | `NodeOptions`           | 见下方                              |
| `layout`    | 布局算法配置                                 | `LayoutOptions`         | `{ type: 'mds', linkDistance: 100 }`|
| `behaviors` | 交互行为列表                                 | `string[]`              | `['drag-element', 'drag-canvas', 'zoom-canvas']` |

### MDS 布局配置项

| 配置项         | 说明                         | 类型     | 默认值 |
| -------------- | ---------------------------- | -------- | ------ |
| `type`         | 布局类型，固定为 `'mds'`     | `string` | -      |
| `linkDistance` | 节点间理想距离               | `number` | `50`   |
| `center`       | 布局中心坐标 `[x, y]`        | `number[]` | `[0, 0]` |

### 节点 palette 配置项

| 配置项  | 说明                                                   | 类型                    | 示例值      |
| ------- | ------------------------------------------------------ | ----------------------- | ----------- |
| `field` | 用于分组的数据字段名（对应 `node.data` 中的字段）      | `string`                | `'cluster'` |
| `color` | 色板名称或颜色数组                                     | `string \| string[]`    | `'tableau'` |

---

## 常见错误与修正

### 错误 1：直接传入节点数组而非 GraphData 对象

**错误原因**：查询描述中提供的参考数据是一个节点数组（如 `[{"id":"0","data":{"cluster":"a"}},...]`），LLM 可能直接将其赋值给 `data`，导致 G6 无法识别数据格式。

```js
// ❌ 错误写法 —— data 直接是节点数组
const graph = new Graph({
  data: [
    { id: '0', data: { cluster: 'a' } },
    { id: '1', data: { cluster: 'a' } },
    // ...
  ],
});
```

```js
// ✅ 正确写法 —— data 必须是包含 nodes/edges 的对象
const graph = new Graph({
  data: {
    nodes: [
      { id: '0', data: { cluster: 'a' } },
      { id: '1', data: { cluster: 'a' } },
      // ...
    ],
    edges: [
      { source: '0', target: '1' },
      // ...
    ],
  },
});
```

### 错误 2：节点颜色硬编码而非使用 palette 映射

**错误原因**：手动在 `style.fill` 中用 `if/switch` 判断 cluster 值，代码冗余且不易维护。

```js
// ❌ 不推荐 —— 手动枚举颜色
node: {
  style: {
    fill: (d) => {
      if (d.data.cluster === 'a') return '#5B8FF9';
      if (d.data.cluster === 'b') return '#61DDAA';
      if (d.data.cluster === 'c') return '#F6BD16';
      return '#CCC';
    },
  },
},
```

```js
// ✅ 推荐 —— 使用 palette 自动映射
node: {
  palette: {
    field: 'cluster',   // 指定分组字段
    color: 'tableau',   // 使用内置色板
  },
},
```

### 错误 3：缺少 edges 字段导致布局异常

**错误原因**：MDS 布局依赖边的连接关系构建距离矩阵，若 `data` 中缺少 `edges`，布局结果可能退化为随机分布。

```js
// ❌ 错误 —— 缺少 edges
const graph = new Graph({
  data: {
    nodes: [ ... ],
    // 未提供 edges
  },
  layout: { type: 'mds' },
});
```

```js
// ✅ 正确 —— 提供完整的 nodes 和 edges
const graph = new Graph({
  data: {
    nodes: [ ... ],
    edges: [ { source: '0', target: '1' }, ... ],
  },
  layout: { type: 'mds', linkDistance: 100 },
});
```

### 错误 4：标签显示在节点外部而非居中

**错误原因**：默认 `labelPlacement` 为 `'bottom'`，若希望标签显示在节点内部，需显式设置为 `'center'`，同时调整 `labelFill` 颜色以保证可读性。

```js
// ❌ 标签显示在节点下方（默认行为）
node: {
  style: {
    labelText: (d) => d.id,
  },
},
```

```js
// ✅ 标签居中显示在节点内部
node: {
  style: {
    labelText: (d) => d.id,
    labelPlacement: 'center',  // 标签居中
    labelFill: '#fff',          // 白色文字，与节点填充色形成对比
    labelFontSize: 10,
  },
},
```

---

## 扩展：动态切换布局

如需在运行时切换到其他布局（如 Force），可使用 `graph.setLayout`：

```js
// 切换为力导向布局
graph.setLayout({
  type: 'force',
  gravity: 10,
  linkDistance: 80,
});
await graph.layout();
```

---

## 参考文档

- [MDS 布局文档](/manual/layout/mds-layout)
- [布局总览](/manual/layout/overview)
- [节点通用配置项](/manual/element/node/base-node)
- [图数据格式](/manual/data)
- [Graph 配置项](/manual/graph/option)