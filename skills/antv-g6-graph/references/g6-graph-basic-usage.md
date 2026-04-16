---
id: g6-graph-basic-usage
title: G6 图表基础用法
description: 介绍如何使用 AntV G6 创建基础图表，包括节点、边、布局、交互行为和插件的配置方式，涵盖常见图类型的完整示例。
library: G6
version: 5.x
category: basic
tags:
  - graph
  - nodes
  - edges
  - layout
  - behaviors
  - plugins
---

# G6 图表基础用法

## 概述

AntV G6 是一个图可视化引擎，支持多种布局算法、交互行为和插件。本文档介绍如何正确创建和配置 G6 图表实例。

## 核心 API

### Graph 实例创建

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container', // 容器 ID 或 DOM 元素
  width: 800,             // 可选，画布宽度
  height: 600,            // 可选，画布高度
  data: {
    nodes: [...],
    edges: [...],
  },
  layout: { type: 'grid' },
  node: { /* 节点样式配置 */ },
  edge: { /* 边样式配置 */ },
  behaviors: [...],       // 交互行为
  plugins: [...],         // 插件
});

graph.render();
```

### 数据格式

```javascript
const data = {
  nodes: [
    { id: 'node1' },
    { id: 'node2', style: { x: 100, y: 200 } },
    { id: 'node3', data: { label: '节点3', value: 42 }, states: ['active'] },
  ],
  edges: [
    { source: 'node1', target: 'node2' },
    { id: 'edge1', source: 'node2', target: 'node3', states: ['selected'] },
  ],
  combos: [
    { id: 'combo1' },
  ],
};
```

## 常用布局类型

| 布局类型 | 说明 |
|---------|------|
| `grid` | 网格布局 |
| `snake` | 蛇形布局 |
| `radial` | 径向布局 |
| `antv-dagre` | DAG 有向无环图布局 |
| `fruchterman` | 力导向布局（Fruchterman） |
| `d3-force` | D3 力导向布局 |
| `indented` | 缩进树布局 |
| `mindmap` | 脑图布局 |

## 常用交互行为（behaviors）

```javascript
behaviors: [
  'drag-canvas',           // 拖拽画布
  'zoom-canvas',           // 缩放画布
  'drag-element',          // 拖拽元素
  'drag-element-force',    // 力导向图中拖拽元素
  'collapse-expand',       // 折叠/展开节点
  'click-select',          // 点击选中
  'focus-element',         // 聚焦元素
  { type: 'scroll-canvas', direction: 'y' }, // 纵向滚动
  {
    type: 'brush-select',  // 刷选
    enable: true,
    trigger: [],
  },
]
```

## 常用插件（plugins）

```javascript
plugins: [
  {
    type: 'watermark',
    text: 'G6: Graph Visualization',
    textFontSize: 14,
    fill: 'rgba(0, 0, 0, 0.1)',
    rotate: Math.PI / 12,
  },
  {
    type: 'background',
    backgroundColor: '#f0f0f0',
    opacity: 0.2,
  },
  {
    type: 'tooltip',
    trigger: 'click',
    getContent: (e, items) => {
      return `<p>${items[0]?.id}</p>`;
    },
  },
]
```

## 最小可运行示例

### 基础网格布局图

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  data: {
    nodes: [
      { id: 'node1' },
      { id: 'node2' },
      { id: 'node3' },
      { id: 'node4' },
      { id: 'node5' },
    ],
    edges: [
      { source: 'node1', target: 'node2' },
      { source: 'node1', target: 'node3' },
      { source: 'node1', target: 'node4' },
      { source: 'node2', target: 'node3' },
      { source: 'node3', target: 'node4' },
      { source: 'node4', target: 'node5' },
    ],
  },
  layout: { type: 'grid' },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```

### 固定坐标节点图（带刷选）

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  data: {
    nodes: [
      { id: 'node-1', style: { x: 200, y: 250 } },
      { id: 'node-2', style: { x: 250, y: 200 } },
      { id: 'node-3', style: { x: 300, y: 250 } },
      { id: 'node-4', style: { x: 250, y: 300 } },
    ],
    edges: [
      { source: 'node-1', target: 'node-2' },
      { source: 'node-2', target: 'node-3' },
      { source: 'node-3', target: 'node-4' },
      { source: 'node-4', target: 'node-1' },
    ],
  },
  behaviors: [
    {
      key: 'brush-select',
      type: 'brush-select',
      enable: true,
      animation: false,
      trigger: [],
    },
  ],
});

graph.render();
```

### 蛇形布局链状图

```javascript
import { Graph } from '@antv/g6';

const data = {
  nodes: new Array(16).fill(0).map((_, i) => ({ id: `${i}` })),
  edges: new Array(15).fill(0).map((_, i) => ({ source: `${i}`, target: `${i + 1}` })),
};

const graph = new Graph({
  container: 'container',
  data,
  node: {
    style: {
      labelFill: '#fff',
      labelPlacement: 'center',
      labelText: (d) => d.id,
    },
  },
  layout: {
    type: 'snake',
    padding: 50,
  },
  behaviors: ['drag-canvas', 'drag-element'],
});

graph.render();
```

### 径向布局图

```javascript
import { Graph } from '@antv/g6';

const data = {
  nodes: Array.from({ length: 10 }, (_, i) => ({ id: `${i}` })),
  edges: [
    { source: '0', target: '1' },
    { source: '0', target: '2' },
    { source: '0', target: '3' },
    { source: '1', target: '4' },
    { source: '2', target: '5' },
    { source: '3', target: '6' },
    { source: '4', target: '7' },
    { source: '5', target: '8' },
    { source: '6', target: '9' },
  ],
};

const graph = new Graph({
  container: 'container',
  data,
  autoFit: 'center',
  layout: {
    type: 'radial',
    nodeSize: 32,
    unitRadius: 100,
    linkDistance: 200,
  },
  node: {
    style: {
      labelFill: '#fff',
      labelPlacement: 'center',
      labelText: (d) => d.id,
    },
  },
  behaviors: ['drag-canvas', 'drag-element'],
});

graph.render();
```

### DAG 有向无环图（dagre 布局）

```javascript
import { Graph } from '@antv/g6';

const data = {
  nodes: [
    { id: '0' }, { id: '1' }, { id: '2' }, { id: '3' },
    { id: '4' }, { id: '5' }, { id: '6' }, { id: '7' },
    { id: '8' }, { id: '9' },
  ],
  edges: [
    { source: '0', target: '1' },
    { source: '0', target: '2' },
    { source: '1', target: '4' },
    { source: '0', target: '3' },
    { source: '3', target: '4' },
    { source: '4', target: '5' },
    { source: '4', target: '6' },
    { source: '5', target: '7' },
    { source: '5', target: '8' },
    { source: '8', target: '9' },
    { source: '2', target: '9' },
    { source: '3', target: '9' },
  ],
};

const graph = new Graph({
  container: 'container',
  autoFit: 'view',
  data,
  layout: {
    type: 'antv-dagre',
    nodeSize: [60, 30],
    nodesep: 60,
    ranksep: 40,
    controlPoints: true,
  },
  node: {
    type: 'rect',
    style: {
      size: [60, 30],
      radius: 8,
      labelText: (d) => d.id,
      labelBackground: true,
    },
  },
  edge: {
    type: 'polyline',
  },
  behaviors: ['drag-element', 'drag-canvas', 'zoom-canvas'],
});

graph.render();
```

### 带水印插件的图

```javascript
import { Graph } from '@antv/g6';

const data = {
  nodes: [
    { id: 'node-0' }, { id: 'node-1' }, { id: 'node-2' },
    { id: 'node-3' }, { id: 'node-4' }, { id: 'node-5' },
  ],
  edges: [
    { source: 'node-0', target: 'node-1' },
    { source: 'node-0', target: 'node-2' },
    { source: 'node-0', target: 'node-3' },
    { source: 'node-0', target: 'node-4' },
    { source: 'node-1', target: 'node-0' },
    { source: 'node-2', target: 'node-0' },
    { source: 'node-3', target: 'node-0' },
    { source: 'node-4', target: 'node-0' },
    { source: 'node-5', target: 'node-0' },
  ],
};

const graph = new Graph({
  container: 'container',
  data,
  layout: { type: 'grid' },
  behaviors: ['zoom-canvas', 'drag-canvas', 'drag-element'],
  plugins: [
    {
      type: 'watermark',
      text: 'G6: Graph Visualization',
      textFontSize: 14,
      textFontFamily: 'Microsoft YaHei',
      fill: 'rgba(0, 0, 0, 0.1)',
      rotate: Math.PI / 12,
    },
  ],
});

graph.render();
```

### 带背景插件的图

```javascript
import { Graph } from '@antv/g6';

const data = {
  nodes: [
    { id: 'node-0' }, { id: 'node-1' }, { id: 'node-2' },
    { id: 'node-3' }, { id: 'node-4' }, { id: 'node-5' },
  ],
  edges: [
    { source: 'node-0', target: 'node-1' },
    { source: 'node-0', target: 'node-2' },
    { source: 'node-0', target: 'node-3' },
    { source: 'node-0', target: 'node-4' },
    { source: 'node-1', target: 'node-0' },
    { source: 'node-2', target: 'node-0' },
    { source: 'node-3', target: 'node-0' },
    { source: 'node-4', target: 'node-0' },
    { source: 'node-5', target: 'node-0' },
  ],
};

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data,
  layout: { type: 'grid' },
  behaviors: ['zoom-canvas', 'drag-canvas', 'drag-element'],
  plugins: [
    {
      type: 'background',
      width: '800px',
      height: '600px',
      backgroundColor: 'red',
      backgroundSize: 'cover',
      opacity: 0.2,
    },
  ],
});

graph.render();
```

### 带 Tooltip 插件的图

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  data: {
    nodes: [
      { id: '0', data: { label: 'node-0', description: 'This is node-0.' } },
      { id: '1', data: { label: 'node-1', description: 'This is node-1.' } },
      { id: '2', data: { label: 'node-2', description: 'This is node-2.' } },
      { id: '3', data: { label: 'node-3', description: 'This is node-3.' } },
      { id: '4', data: { label: 'node-4', description: 'This is node-4.' } },
      { id: '5', data: { label: 'node-5', description: 'This is node-5.' } },
    ],
    edges: [
      { source: '0', target: '1', data: { description: 'Edge from 0 to 1.' } },
      { source: '0', target: '2', data: { description: 'Edge from 0 to 2.' } },
      { source: '0', target: '3', data: { description: 'Edge from 0 to 3.' } },
      { source: '0', target: '4', data: { description: 'Edge from 0 to 4.' } },
      { source: '0', target: '5', data: { description: 'Edge from 0 to 5.' } },
    ],
  },
  layout: { type: 'grid' },
  plugins: [
    {
      type: 'tooltip',
      trigger: 'click',
      getContent: (e, items) => {
        let result = `<h4>Custom Content</h4>`;
        items.forEach((item) => {
          result += `<p>Type: ${item.data.description}</p>`;
        });
        return result;
      },
    },
  ],
  behaviors: ['drag-canvas', 'drag-element'],
});

graph.render();
```

### 带 Combo 的图

```javascript
import { Graph } from '@antv/g6';

const data = {
  nodes: [
    { id: 'node1', combo: 'combo1', style: { x: 110, y: 150 } },
    { id: 'node2', combo: 'combo1', style: { x: 190, y: 150 } },
    { id: 'node3', combo: 'combo2', style: { x: 150, y: 260 } },
  ],
  edges: [{ source: 'node1', target: 'node2' }],
  combos: [{ id: 'combo1', combo: 'combo2' }, { id: 'combo2' }],
};

const graph = new Graph({
  container: 'container',
  node: {
    style: { labelText: (d) => d.id },
  },
  data,
  behaviors: ['collapse-expand', 'focus-element'],
});

graph.render();
```

### 边状态样式（dagre 布局 + cubic-horizontal 边）

```javascript
import { Graph } from '@antv/g6';

const data = {
  nodes: [
    { id: 'node1' }, { id: 'node2' }, { id: 'node3' },
    { id: 'node4' }, { id: 'node5' }, { id: 'node6' },
  ],
  edges: [
    { id: 'line-default', source: 'node1', target: 'node2' },
    { id: 'line-active', source: 'node1', target: 'node3', states: ['active'] },
    { id: 'line-selected', source: 'node1', target: 'node4', states: ['selected'] },
    { id: 'line-highlight', source: 'node1', target: 'node5', states: ['highlight'] },
    { id: 'line-inactive', source: 'node1', target: 'node6', states: ['inactive'] },
  ],
};

const graph = new Graph({
  container: 'container',
  data,
  node: {
    style: {
      port: true,
      ports: [{ placement: 'right' }, { placement: 'left' }],
    },
  },
  edge: {
    type: 'cubic-horizontal',
    style: {
      labelText: (d) => d.id,
      labelBackground: true,
      endArrow: true,
    },
  },
  layout: {
    type: 'antv-dagre',
    rankdir: 'LR',
    nodesep: 20,
    ranksep: 120,
  },
});

graph.render();
```

### 平行边处理（process-parallel-edges）

```javascript
import { Graph } from '@antv/g6';

const data = {
  nodes: [
    { id: 'A', style: { x: 50, y: 350 } },
    { id: 'B', style: { x: 250, y: 150 } },
    { id: 'C', style: { x: 450, y: 350 } },
  ],
  edges: [
    { source: 'A', target: 'B' },
    { source: 'B', target: 'A' },
    { id: 'B-C:1', source: 'B', target: 'C' },
    { id: 'B-C:2', source: 'B', target: 'C' },
    { source: 'A', target: 'C' },
  ],
};

const graph = new Graph({
  container: 'container',
  autoFit: 'center',
  data,
  node: {
    style: {
      labelText: (d) => d.id,
    },
  },
  edge: {
    style: {
      labelText: (d) => d?.data?.label || `${d.source}->${d.target}`,
      startArrow: false,
    },
  },
  transforms: [
    {
      type: 'process-parallel-edges',
      mode: 'merge',
      style: {
        halo: true,
        haloOpacity: 0.2,
        haloStroke: 'red',
        startArrow: true,
      },
    },
  ],
});

graph.render();
```

### Fruchterman 力导向布局（带集群着色）

```javascript
import { Graph } from '@antv/g6';

const data = {
  nodes: [
    { id: '0', data: { cluster: 'a' } },
    { id: '1', data: { cluster: 'a' } },
    { id: '2', data: { cluster: 'b' } },
    { id: '3', data: { cluster: 'b' } },
    { id: '4', data: { cluster: 'c' } },
    { id: '5', data: { cluster: 'c' } },
  ],
  edges: [
    { source: '0', target: '1' },
    { source: '0', target: '2' },
    { source: '2', target: '3' },
    { source: '3', target: '4' },
    { source: '4', target: '5' },
  ],
};

const graph = new Graph({
  container: 'container',
  data,
  layout: {
    type: 'fruchterman',
    gravity: 5,
    speed: 5,
    clustering: true,
    nodeClusterBy: 'cluster',
    clusterGravity: 16,
  },
  node: {
    style: {
      labelFill: '#fff',
      labelPlacement: 'center',
      labelText: (d) => d.id,
    },
    palette: {
      type: 'group',
      field: 'cluster',
    },
  },
  edge: {
    style: {
      endArrow: true,
    },
  },
  behaviors: ['drag-canvas', 'drag-element'],
});

graph.render();
```

### D3 力导向布局（二维网格图）

```javascript
import { Graph } from '@antv/g6';

function getData(size = 5) {
  const nodes = Array.from({ length: size * size }, (_, i) => ({ id: `${i}` }));
  const edges = [];
  for (let y = 0; y < size; ++y) {
    for (let x = 0; x < size; ++x) {
      if (y > 0) edges.push({ source: `${(y - 1) * size + x}`, target: `${y * size + x}` });
      if (x > 0) edges.push({ source: `${y * size + (x - 1)}`, target: `${y * size + x}` });
    }
  }
  return { nodes, edges };
}

const graph = new Graph({
  data: getData(),
  container: 'container',
  layout: {
    type: 'd3-force',
    manyBody: { strength: -30 },
    link: { strength: 1, distance: 20, iterations: 10 },
  },
  node: {
    style: { size: 10, fill: '#000' },
  },
  edge: {
    style: { stroke: '#000' },
  },
  behaviors: [{ type: 'drag-element-force' }, 'zoom-canvas'],
});

graph.render();
```

### 自定义节点（呼吸动画圆形节点）

```javascript
import { Circle, ExtensionCategory, Graph, register } from '@antv/g6';

class BreathingCircle extends Circle {
  onCreate() {
    const halo = this.shapeMap.halo;
    halo.animate([{ lineWidth: 0 }, { lineWidth: 20 }], {
      duration: 1000,
      iterations: Infinity,
      direction: 'alternate',
    });
  }
}

register(ExtensionCategory.NODE, 'breathing-circle', BreathingCircle);

const graph = new Graph({
  container: 'container',
  data: {
    nodes: [
      { id: 'node-0' }, { id: 'node-1' },
      { id: 'node-2' }, { id: 'node-3' },
    ],
  },
  node: {
    type: 'breathing-circle',
    style: {
      size: 50,
      halo: true,
    },
    palette: ['#3875f6', '#efb041', '#ec5b56', '#72c240'],
  },
  layout: { type: 'grid' },
});

graph.render();
```

### 六边形节点（多状态展示）

```javascript
import { Graph, iconfont } from '@antv/g6';

const style = document.createElement('style');
style.innerHTML = `@import url('${iconfont.css}');`;
document.head.appendChild(style);

const data = {
  nodes: [
    { id: 'default' },
    { id: 'halo' },
    { id: 'badges' },
    { id: 'ports' },
    { id: 'active', states: ['active'] },
    { id: 'selected', states: ['selected'] },
    { id: 'highlight', states: ['highlight'] },
    { id: 'inactive', states: ['inactive'] },
    { id: 'disabled', states: ['disabled'] },
  ],
};

const graph = new Graph({
  container: 'container',
  data,
  node: {
    type: 'hexagon',
    style: {
      size: 40,
      labelText: (d) => d.id,
      iconFontFamily: 'iconfont',
      iconText: '\ue602',
      halo: (d) => d.id === 'halo',
      badges: (d) =>
        d.id === 'badges'
          ? [
              { text: 'A', placement: 'right-top' },
              { text: 'Important', placement: 'right' },
              { text: 'Notice', placement: 'right-bottom' },
            ]
          : [],
      badgeFontSize: 8,
      badgePadding: [1, 4],
      portR: 3,
      ports: (d) =>
        d.id === 'ports'
          ? [
              { placement: 'left' },
              { placement: 'right' },
              { placement: 'top' },
              { placement: 'bottom' },
            ]
          : [],
    },
  },
  layout: { type: 'grid' },
});

graph.render();
```

### 静态网络图（带点击选中和画布重置）

```javascript
import { CanvasEvent, Graph } from '@antv/g6';

const rawData = {
  nodes: [
    { id: 'A', x: 100, y: 100 },
    { id: 'B', x: 300, y: 100 },
    { id: 'C', x: 200, y: 300 },
  ],
  edges: [
    { source: 'A', target: 'B' },
    { source: 'B', target: 'C' },
    { source: 'A', target: 'C' },
  ],
};

const data = {
  nodes: rawData.nodes.map((node) => ({
    ...node,
    style: { x: node.x, y: node.y },
  })),
  edges: rawData.edges,
};

const graph = new Graph({
  container: 'container',
  animation: false,
  data,
  node: {
    style: { size: 12 },
  },
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    'drag-element',
    { type: 'click-select', multiple: true },
  ],
  autoFit: 'view',
});

graph.render();

graph.on(CanvasEvent.CLICK, () => {
  graph.setElementState(
    Object.fromEntries(
      [...data.nodes, ...data.edges].map((element) => [element.id, []])
    )
  );
});
```

## 常见错误与修正

### 错误 1：调用不存在的工具 `list_references`

**错误现象**：渲染报错 `400 LLM is trying to invoke a non-exist tool: "list_references"`

**原因**：LLM 尝试调用不存在的工具来查询文档，导致无法生成代码。

**修正**：直接使用 G6 标准 API 编写代码，无需调用外部工具。参考本文档中的示例即可。

---

### 错误 2：忘记调用 `graph.render()`

**错误示例**：
```javascript
const graph = new Graph({ container: 'container', data });
// 缺少 graph.render()
```

**正确示例**：
```javascript
const graph = new Graph({ container: 'container', data });
graph.render(); // 必须调用 render 才能渲染图表
```

---

### 错误 3：数据格式不正确

**错误示例**：
```javascript
// 错误：直接传入节点数组
const graph = new Graph({
  data: [{ id: 'node1' }, { id: 'node2' }],
});
```

**正确示例**：
```javascript
// 正确：data 必须包含 nodes 和 edges 字段
const graph = new Graph({
  data: {
    nodes: [{ id: 'node1' }, { id: 'node2' }],
    edges: [{ source: 'node1', target: 'node2' }],
  },
});
```

---

### 错误 4：节点坐标应放在 `style` 字段中

**错误示例**：
```javascript
// 错误：直接在节点对象上设置 x/y
{ id: 'node1', x: 100, y: 200 }
```

**正确示例**：
```javascript
// 正确：坐标放在 style 字段中
{ id: 'node1', style: { x: 100, y: 200 } }
```

---

### 错误 5：布局类型名称错误

**错误示例**：
```javascript
layout: { type: 'dagre' } // 错误，G6 v5 中应使用 'antv-dagre'
```

**正确示例**：
```javascript
layout: { type: 'antv-dagre' } // G6 v5 中的正确写法
```

---

### 错误 6：自定义节点未注册就使用

**错误示例**：
```javascript
// 错误：未注册直接使用自定义节点类型
const graph = new Graph({
  node: { type: 'breathing-circle' },
});
```

**正确示例**：
```javascript
import { Circle, ExtensionCategory, Graph, register } from '@antv/g6';

class BreathingCircle extends Circle { /* ... */ }

// 必须先注册
register(ExtensionCategory.NODE, 'breathing-circle', BreathingCircle);

const graph = new Graph({
  node: { type: 'breathing-circle' },
});
```

---

### 错误 7：树形数据未转换直接使用

**错误示例**：
```javascript
// 错误：直接将树形数据传给 data
const graph = new Graph({
  data: { id: 'root', children: [...] },
});
```

**正确示例**：
```javascript
import { Graph, treeToGraphData } from '@antv/g6';

// 正确：使用 treeToGraphData 转换
const graph = new Graph({
  data: treeToGraphData({ id: 'root', children: [...] }),
});
```

---

### 错误 8：`scroll-canvas` 行为配置不完整

**错误示例**：
```javascript
behaviors: ['scroll-canvas'] // 缺少方向配置
```

**正确示例**：
```javascript
behaviors: [{ type: 'scroll-canvas', direction: 'y' }] // 指定滚动方向
```