---
id: "g6-behavior-create-edge-focus"
title: "G6 创建边（create-edge）与聚焦元素（focus-element）"
description: |
  create-edge：交互式在两个节点间创建新边。
  focus-element：点击/快捷键触发视口动画聚焦到指定元素。

library: "g6"
version: "5.x"
category: "behaviors"
subcategory: "interaction"
tags:
  - "交互"
  - "创建边"
  - "聚焦"
  - "create-edge"
  - "focus-element"

related:
  - "g6-behavior-click-select"
  - "g6-behavior-drag-element"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 交互式创建边（create-edge）

允许用户通过拖拽或点击在两个节点之间创建新边。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: [
       { id: 'n1', data: { label: 'A' } },
       { id: 'n2', data: { label: 'B' } },
       { id: 'n3', data: { label: 'C' } },
    ],
    edges: [],
  },
  node: {
    type: 'circle',
    style: {
      size: 40,
      fill: '#1783FF',
      stroke: '#fff',
      lineWidth: 2,
      labelText: (d) => d.data.label,
      labelPlacement: 'center',
      labelFill: '#fff',
      // 端口（精确连接点）
      ports: [
         { key: 'top',    placement: 'top' },
         { key: 'bottom', placement: 'bottom' },
         { key: 'left',   placement: 'left' },
         { key: 'right',  placement: 'right' },
      ],
    },
  },
  edge: {
    type: 'line',
    style: {
      stroke: '#aaa',
      lineWidth: 1.5,
      endArrow: true,
    },
  },
  layout: { type: 'circular' },
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    'drag-element',
    {
      type: 'create-edge',
      trigger: 'drag',             // 'drag'（拖拽）| 'click'（点击源→点击目标）
      style: {
        // 创建过程中临时边的样式
        stroke: '#1783FF',
        lineWidth: 2,
        lineDash: [4, 2],
        endArrow: true,
      },
      // 边创建完成的回调
      onFinish: (edgeData) => {
        console.log('新建边:', edgeData.source, '->', edgeData.target);
        // 可在此为新边追加业务数据
        graph.updateEdgeData([{
          ...edgeData,
             { weight: 1, label: '新连接' },
        }]);
        graph.draw();
      },
      // 返回 undefined 取消创建，返回修改后的 data 允许创建
      onCreate: (edgeData) => {
        if (edgeData.source === edgeData.target) return undefined; // 禁止自环
        return edgeData;
      },
    },
  ],
});

graph.render();
```

### create-edge 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `trigger` | `'drag' \| 'click'` | `'drag'` | 触发方式 |
| `style` | `EdgeStyleProps` | — | 创建中的临时边样式 |
| `onFinish` | `(edge: EdgeData) => void` | — | 边创建完成回调 |
| `onCreate` | `(edge: EdgeData) => EdgeData \| undefined` | — | 创建拦截，返回 undefined 取消 |
| `enable` | `boolean \| ((event) => boolean)` | `true` | 是否启用 |

---

## 聚焦元素（focus-element）

点击元素后平滑动画将视口移动到该元素的中心位置。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: Array.from({ length: 30 }, (_, i) => ({
      id: `n${i}`,
           { label: `节点${i}`, x: Math.random() * 2000, y: Math.random() * 2000 },
    })),
    edges: [],
  },
  node: {
    type: 'circle',
    style: {
      size: 30,
      fill: '#1783FF',
      stroke: '#fff',
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
    },
  },
  layout: { type: 'random', width: 2000, height: 2000 },
  behaviors: [
    'drag-canvas',
    'zoom-canvas',
    {
      type: 'focus-element',
      // 动画配置
      animation: {
        easing: 'ease-in-out',
        duration: 600,
      },
      // 启用条件（默认点击任意元素均触发聚焦）
      enable: true,
    },
  ],
});

graph.render();
```

### 通过 API 聚焦元素

```javascript
// 以动画方式将视口移动到指定节点
await graph.focusElement('n5', {
  easing: 'ease-in-out',
  duration: 500,
});

// 搜索后聚焦
document.getElementById('search').addEventListener('input', async (e) => {
  const keyword = e.target.value;
  const node = graph.getNodeData().find(n => n.data.label.includes(keyword));
  if (node) {
    await graph.focusElement(node.id, { duration: 500 });
    graph.setElementState(node.id, 'selected');
  }
});
```

### focus-element 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `animation` | `ViewportAnimationEffectTiming` | `{ easing: 'ease-in', duration: 500 }` | 视口动画配置 |
| `enable` | `boolean \| ((event) => boolean)` | `true` | 是否启用 |
