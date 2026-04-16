---
id: "g6-core-events"
title: "G6 事件系统"
description: |
  G6 v5 事件系统：元素事件（node/edge/combo 的点击、悬停、拖拽）、
  画布事件和图生命周期事件的监听方式与常用事件列表。

library: "g6"
version: "5.x"
category: "core"
subcategory: "events"
tags:
  - "事件"
  - "监听"
  - "node:click"
  - "canvas"
  - "生命周期"

related:
  - "g6-core-graph-api"
  - "g6-behavior-click-select"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 事件监听基础

```javascript
// 监听
graph.on('node:click', (event) => {
  const { target, targetType } = event;
  console.log('点击节点:', target.id);
});

// 取消监听（传入同一函数引用）
const handler = (e) => console.log(e);
graph.on('node:click', handler);
graph.off('node:click', handler);

// 取消该事件的所有监听
graph.off('node:click');
```

---

## 元素事件

元素事件格式：`{元素类型}:{事件类型}`，如 `node:click`、`edge:pointerover`。

| 事件名 | 说明 |
|--------|------|
| `node:click` | 点击节点 |
| `node:dblclick` | 双击节点 |
| `node:pointerover` | 鼠标移入节点 |
| `node:pointerout` | 鼠标移出节点 |
| `node:pointerdown` | 鼠标/触摸按下节点 |
| `node:pointerup` | 鼠标/触摸抬起 |
| `node:contextmenu` | 右键节点 |
| `node:dragstart` | 开始拖拽节点 |
| `node:drag` | 拖拽节点中 |
| `node:dragend` | 拖拽节点结束 |
| `edge:click` | 点击边 |
| `edge:pointerover` | 鼠标移入边 |
| `combo:click` | 点击 combo |
| `combo:dblclick` | 双击 combo |

### 事件对象属性

```typescript
interface IElementEvent {
  target: DisplayObject;    // 触发事件的图形对象
  targetType: string;       // 'node' | 'edge' | 'combo' | 'canvas'
  originalEvent: Event;     // 原始 DOM 事件
  // 坐标（画布坐标系）
  canvas: { x: number; y: number };
  // 坐标（视口坐标系）
  viewport: { x: number; y: number };
  // 坐标（客户端坐标系）
  client: { x: number; y: number };
}
```

### 典型用法

```javascript
// 点击节点获取数据
graph.on('node:click', (event) => {
  const nodeId = event.target.id;
  const nodeData = graph.getNodeData(nodeId);
  console.log(nodeData);
});

// 悬停边高亮
graph.on('edge:pointerover', (event) => {
  graph.setElementState(event.target.id, 'active');
});
graph.on('edge:pointerout', (event) => {
  graph.setElementState(event.target.id, []);
});

// 右键菜单
graph.on('node:contextmenu', (event) => {
  event.originalEvent.preventDefault();
  console.log('右键节点:', event.target.id);
});
```

---

## 画布事件

| 事件名 | 说明 |
|--------|------|
| `canvas:click` | 点击画布空白区域 |
| `canvas:dblclick` | 双击画布 |
| `canvas:pointerdown` | 鼠标按下画布 |
| `canvas:pointerup` | 鼠标抬起 |
| `canvas:pointermove` | 鼠标在画布移动 |
| `canvas:wheel` | 画布滚轮事件 |
| `canvas:contextmenu` | 右键画布 |

```javascript
// 点击空白区域取消选中
graph.on('canvas:click', () => {
  const selected = graph.getElementDataByState('node', 'selected');
  selected.forEach(n => graph.setElementState(n.id, []));
});
```

---

## 图生命周期事件

```javascript
import { GraphEvent } from '@antv/g6';

// 渲染完成
graph.on(GraphEvent.AFTER_RENDER, () => {
  console.log('图渲染完成');
});

// 布局完成
graph.on(GraphEvent.AFTER_LAYOUT, () => {
  console.log('布局完成');
});

// 元素创建后（批量）
graph.on(GraphEvent.AFTER_ELEMENT_CREATE, (event) => {
  console.log('新增元素:', event.data);
});

// 视口变换（缩放/平移）
graph.on(GraphEvent.AFTER_TRANSFORM, (event) => {
  const { translate, zoom } = event.data;
  console.log('视口变换:', zoom);
});
```

### 常用生命周期事件

| 事件常量 | 事件名 | 触发时机 |
|----------|--------|---------|
| `GraphEvent.BEFORE_RENDER` | `beforerender` | render() 开始前 |
| `GraphEvent.AFTER_RENDER` | `afterrender` | render() 完成后 |
| `GraphEvent.BEFORE_DRAW` | `beforedraw` | draw() 开始前 |
| `GraphEvent.AFTER_DRAW` | `afterdraw` | draw() 完成后 |
| `GraphEvent.AFTER_LAYOUT` | `afterlayout` | 布局计算完成 |
| `GraphEvent.AFTER_ELEMENT_CREATE` | `afterelementcreate` | 元素新增后 |
| `GraphEvent.AFTER_ELEMENT_UPDATE` | `afterelementupdate` | 元素更新后 |
| `GraphEvent.AFTER_ELEMENT_DESTROY` | `afterelementdestroy` | 元素删除后 |
| `GraphEvent.AFTER_TRANSFORM` | `aftertransform` | 视口变换后 |
| `GraphEvent.BEFORE_DESTROY` | `beforedestroy` | destroy() 前 |

---

## 常见模式

### 节点拖拽后更新坐标

```javascript
graph.on('node:dragend', (event) => {
  const nodeId = event.target.id;
  const { x, y } = graph.getNodeData(nodeId);
  console.log(`节点 ${nodeId} 新坐标: (${x}, ${y})`);
});
```

### 动态更新 tooltip 数据

```javascript
graph.on('node:pointerover', async (event) => {
  const nodeId = event.target.id;
  const detail = await fetchNodeDetail(nodeId);
  graph.updateNodeData([{ id: nodeId, data: { ...detail } }]);
});
```
