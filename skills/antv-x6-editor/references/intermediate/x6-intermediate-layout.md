---
id: "x6-intermediate-layout"
title: "X6 布局（Layout）"
description: |
  X6 配合 @antv/layout 和 @antv/hierarchy 实现图布局的完整指南。
  包含 Dagre（有向图）、Grid（网格）、Circle（环形）、Force（力导向）、树形布局、思维导图布局。

library: "x6"
version: "3.x"
category: "intermediate"
subcategory: "layout"
tags:
  - "布局"
  - "layout"
  - "dagre"
  - "grid"
  - "circle"
  - "force"
  - "树形"
  - "tree"
  - "mindmap"
  - "思维导图"
  - "hierarchy"
  - "@antv/layout"
  - "@antv/hierarchy"
  - "rankdir"
  - "自动排列"

related:
  - "x6-core-graph-init"
  - "x6-core-node"
  - "x6-core-edge"
  - "x6-pattern-dag"

use_cases:
  - "对 DAG 节点进行自动层次布局"
  - "将节点排列为网格"
  - "将节点排列为环形"
  - "使用力导向算法自动布局"
  - "树形层次结构自动布局"
  - "思维导图布局"

anti_patterns:
  - "布局算法不会自动添加节点到画布，需要手动调用 graph.fromJSON()"
  - "不要混淆 @antv/layout 和 X6 内置的 port-layout"
---

# X6 布局（Layout）

X6 本身不内置图布局算法，而是通过 `@antv/layout`（通用布局）和 `@antv/hierarchy`（树形布局）计算节点位置，再用 `graph.fromJSON()` 渲染。

## 安装依赖

```bash
# 通用布局（dagre、grid、circle、force 等）
npm install @antv/layout dagre

# 树形布局（思维导图、紧凑树等）
npm install @antv/hierarchy
```

## Dagre 布局（有向图/DAG）

最常用的层次布局，适合流程图、DAG 数据管道。

```javascript
import { Graph } from '@antv/x6';
import { DagreLayout } from '@antv/layout';

// 准备数据
const data = {
  nodes: [
    { id: '1', shape: 'rect', width: 100, height: 40, label: '开始', attrs: { body: { fill: '#fff', stroke: '#8f8f8f', strokeWidth: 1, rx: 6, ry: 6 } } },
    { id: '2', shape: 'rect', width: 100, height: 40, label: '处理', attrs: { body: { fill: '#fff', stroke: '#8f8f8f', strokeWidth: 1, rx: 6, ry: 6 } } },
    { id: '3', shape: 'rect', width: 100, height: 40, label: '结束', attrs: { body: { fill: '#fff', stroke: '#8f8f8f', strokeWidth: 1, rx: 6, ry: 6 } } },
  ],
  edges: [
    { source: '1', target: '2', attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } } },
    { source: '2', target: '3', attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } } },
  ],
};

// 执行布局计算
const dagreLayout = new DagreLayout({
  type: 'dagre',
  rankdir: 'TB',    // 布局方向：TB(上到下) | BT | LR(左到右) | RL
  align: 'UL',     // 对齐方式：UL | UR | DL | DR
  ranksep: 50,     // 层间距
  nodesep: 30,     // 同层节点间距
});

const model = dagreLayout.layout(data);

// 渲染到画布
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  background: { color: '#F2F7FA' },
});

graph.fromJSON(model);
graph.centerContent();
```

### Dagre 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `rankdir` | string | `'TB'` | 布局方向：`'TB'`/`'BT'`/`'LR'`/`'RL'` |
| `align` | string | `'UL'` | 节点对齐：`'UL'`/`'UR'`/`'DL'`/`'DR'` |
| `nodesep` | number | 50 | 同层节点间距 |
| `ranksep` | number | 50 | 层间距 |
| `controlPoints` | boolean | false | 是否保留边的控制点 |

## Grid 布局（网格）

将节点排列为网格。

```javascript
import { Graph } from '@antv/x6';
import { GridLayout } from '@antv/layout';

const data = {
  nodes: Array.from({ length: 12 }, (_, i) => ({
    id: `${i + 1}`,
    shape: 'circle',
    width: 32,
    height: 32,
    label: `${i + 1}`,
    attrs: { body: { fill: '#5F95FF', stroke: 'transparent' }, label: { fill: '#fff' } },
  })),
  edges: [],
};

const gridLayout = new GridLayout({
  type: 'grid',
  width: 600,
  height: 400,
  rows: 3,
  cols: 4,
});

const model = gridLayout.layout(data);

const graph = new Graph({ container: 'container' });
graph.fromJSON(model);
```

## Circle 布局（环形）

将节点排列为环形。

```javascript
import { Graph } from '@antv/x6';
import { CircularLayout } from '@antv/layout';

const circularLayout = new CircularLayout({
  type: 'circular',
  width: 600,
  height: 600,
  radius: 200,
});

const model = circularLayout.layout(data);

const graph = new Graph({ container: 'container' });
graph.fromJSON(model);
```

## Force 布局（力导向）

基于物理模拟的力导向布局。

```javascript
import { Graph } from '@antv/x6';
import { ForceLayout } from '@antv/layout';

const forceLayout = new ForceLayout({
  type: 'force',
  width: 800,
  height: 600,
  preventOverlap: true,
  nodeStrength: -50,
  edgeStrength: 0.1,
});

const model = forceLayout.layout(data);

const graph = new Graph({ container: 'container' });
graph.fromJSON(model);
```

## 树形布局（@antv/hierarchy）

适合层次结构数据，如组织架构图、思维导图。

### 思维导图布局

```javascript
import { Graph } from '@antv/x6';
import Hierarchy from '@antv/hierarchy';

// 树形数据结构
const treeData = {
  id: 'root',
  label: '中心主题',
  children: [
    {
      id: 'c1',
      label: '分支 1',
      children: [
        { id: 'c1-1', label: '子主题 1-1' },
        { id: 'c1-2', label: '子主题 1-2' },
      ],
    },
    {
      id: 'c2',
      label: '分支 2',
      children: [
        { id: 'c2-1', label: '子主题 2-1' },
      ],
    },
  ],
};

// 计算布局
const result = Hierarchy.mindmap(treeData, {
  direction: 'H',      // H（水平）| V（垂直）
  getHeight() { return 30; },
  getWidth() { return 100; },
  getHGap() { return 60; },
  getVGap() { return 20; },
  getSide() { return 'right'; },
});

// 遍历布局结果，转为 X6 数据格式
const model = { nodes: [], edges: [] };

function traverse(node) {
  model.nodes.push({
    id: node.id,
    x: node.x + 400,  // 偏移到画布中心
    y: node.y + 300,
    shape: 'rect',
    width: 100,
    height: 30,
    label: node.data.label || node.id,
    attrs: { body: { fill: '#fff', stroke: '#8f8f8f', strokeWidth: 1, rx: 4, ry: 4 } },
  });
  if (node.children) {
    node.children.forEach((child) => {
      model.edges.push({
        source: node.id,
        target: child.id,
        connector: 'smooth',
        attrs: { line: { stroke: '#A2B1C3', strokeWidth: 1, targetMarker: null } },
      });
      traverse(child);
    });
  }
}

traverse(result);

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  connecting: { connector: 'smooth' },
});

graph.fromJSON(model);
graph.centerContent();
```

### 紧凑树布局

```javascript
import Hierarchy from '@antv/hierarchy';

const result = Hierarchy.compactBox(treeData, {
  direction: 'TB',     // TB | BT | LR | RL | H | V
  getHeight() { return 30; },
  getWidth() { return 100; },
  getHGap() { return 40; },
  getVGap() { return 20; },
});
```

## @antv/hierarchy 布局算法列表

| 算法 | 方法 | 适用场景 |
|------|------|----------|
| 紧凑树 | `Hierarchy.compactBox(data, options)` | 组织架构图、文件树 |
| 思维导图 | `Hierarchy.mindmap(data, options)` | 思维导图 |
| 缩进树 | `Hierarchy.indented(data, options)` | 目录结构 |
| 树形 | `Hierarchy.dendrogram(data, options)` | 系统发育树 |

## 动态布局（数据变更后重新布局）

```javascript
// 添加新节点后重新布局
function relayout() {
  const currentData = graph.toJSON();
  const newModel = dagreLayout.layout(currentData);
  graph.fromJSON(newModel);
  graph.centerContent();
}
```

## 常见错误

### ❌ 布局后直接使用 data 而不调用 fromJSON

```javascript
// 错误：布局只计算位置，不会自动渲染
const model = dagreLayout.layout(data);
// 画布上什么都没有

// 正确：需要手动渲染
const model = dagreLayout.layout(data);
graph.fromJSON(model);
```

### ❌ 未安装 dagre 依赖导致 DagreLayout 报错

```bash
# 错误：@antv/layout 的 DagreLayout 依赖 dagre 包
# Error: Cannot find module 'dagre'

# 正确：需要同时安装
npm install @antv/layout dagre
```
