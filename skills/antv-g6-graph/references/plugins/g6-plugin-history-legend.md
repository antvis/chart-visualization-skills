---
id: "g6-plugin-history-legend"
title: "G6 撤销重做（history）与图例（legend）"
description: |
  history：记录图操作历史，支持 undo/redo，适合图编辑场景。
  legend：自动从节点/边数据生成图例，支持点击过滤。

library: "g6"
version: "5.x"
category: "plugins"
subcategory: "display"
tags:
  - "插件"
  - "历史"
  - "撤销"
  - "图例"
  - "history"
  - "legend"

related:
  - "g6-plugin-contextmenu-toolbar"
  - "g6-state-overview"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 撤销重做（history）

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [
       { id: 'n1', data: { label: 'A' } },
       { id: 'n2', data: { label: 'B' } },
    ],
    edges: [{ source: 'n1', target: 'n2' }],
  },
  node: {
    type: 'circle',
    style: {
      size: 40,
      fill: '#1783FF',
      stroke: '#fff',
      labelText: (d) => d.data.label,
    },
  },
  layout: { type: 'circular' },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
  plugins: [
    {
      type: 'history',
      stackSize: 50,           // 最大历史记录数，0 = 不限
    },
  ],
});

graph.render();

// 注册快捷键 Ctrl+Z / Ctrl+Y
document.addEventListener('keydown', (e) => {
  const plugin = graph.getPluginInstance('history');
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    if (plugin.canUndo()) plugin.undo();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault();
    if (plugin.canRedo()) plugin.redo();
  }
});

// 监听历史变化更新 UI
const plugin = graph.getPluginInstance('history');
// 或通过 key 获取
// plugins: [{ type: 'history', key: 'myHistory', stackSize: 50 }]

// 批量操作合并为一条历史记录
graph.batch(() => {
  graph.addNodeData([{ id: 'n3', data: { label: 'C' } }]);
  graph.addEdgeData([{ source: 'n1', target: 'n3' }]);
});
graph.draw();
// 上述两步操作通过 batch 合并，undo 时一次性回滚
```

### history 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `stackSize` | `number` | `0` | 历史栈大小，0 表示不限制 |
| `beforeAddCommand` | `(cmd, revert) => boolean \| void` | — | 添加命令前拦截，返回 false 取消 |
| `afterAddCommand` | `(cmd, revert) => void` | — | 添加命令后回调 |

### history API

```javascript
const history = graph.getPluginInstance('history-plugin-key');

history.undo();          // 撤销
history.redo();          // 重做
history.canUndo();       // 是否可撤销（boolean）
history.canRedo();       // 是否可重做（boolean）
history.clear();         // 清空历史
```

---

## 图例（legend）

根据节点/边数据字段自动生成交互式图例。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [
       { id: 'n1', data: { label: 'A', type: '工程师' } },
       { id: 'n2', data: { label: 'B', type: '产品' } },
       { id: 'n3', data: { label: 'C', type: '工程师' } },
       { id: 'n4', data: { label: 'D', type: '设计师' } },
    ],
    edges: [
       { source: 'n1', target: 'n2', data: { relation: '协作' } },
       { source: 'n1', target: 'n3', data: { relation: '上下级' } },
    ],
  },
  node: {
    type: 'circle',
    style: {
      size: 40,
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
    },
    palette: {
      type: 'group',
      field: 'type',           // 图例按此字段分类
    },
  },
  edge: {
    style: {
      stroke: '#aaa',
      endArrow: true,
    },
  },
  layout: { type: 'force', preventOverlap: true },
  behaviors: ['drag-canvas', 'zoom-canvas'],
  plugins: [
    {
      type: 'legend',
      position: 'bottom-left',       // 图例位置
      trigger: 'click',              // 'hover' | 'click'（点击过滤）
      // 节点图例的分类字段
      nodeField: 'type',
      // 边图例的分类字段
      edgeField: 'relation',
      // 图例方向
      orientation: 'horizontal',     // 'horizontal' | 'vertical'
    },
  ],
});

graph.render();
```

### legend 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `position` | `CardinalPlacement` | `'bottom'` | 图例位置 |
| `trigger` | `'hover' \| 'click'` | `'hover'` | 交互触发方式 |
| `nodeField` | `string \| ((d) => string)` | — | 节点分类字段 |
| `edgeField` | `string \| ((d) => string)` | — | 边分类字段 |
| `comboField` | `string \| ((d) => string)` | — | combo 分类字段 |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 图例排列方向 |
| `container` | `HTMLElement \| string` | — | 自定义容器 |
