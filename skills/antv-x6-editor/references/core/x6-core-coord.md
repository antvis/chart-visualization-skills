---
id: "x6-core-coord"
title: "X6 坐标转换（Coord）"
description: |
  X6 坐标系转换 API：local（画布本地坐标）、graph（视口坐标）、client（浏览器视口坐标）、page（文档坐标）之间的相互转换。

library: "x6"
version: "3.x"
category: "core"
subcategory: "coord"
tags:
  - "coord"
  - "坐标转换"
  - "localToGraph"
  - "clientToLocal"
  - "snapToGrid"
  - "坐标系"

related:
  - "x6-core-graph-init"
  - "x6-core-panning"
  - "x6-core-mousewheel"

use_cases:
  - "鼠标事件坐标转换为画布坐标"
  - "根据屏幕位置添加节点"
  - "拖拽外部元素到画布并定位"
  - "坐标吸附到网格"
  - "自定义右键菜单定位"

difficulty: "intermediate"
completeness: "full"
---

## 坐标系说明

X6 中存在四套坐标系：

| 坐标系 | 说明 | 应用场景 |
|--------|------|----------|
| **local** | 画布本地坐标，节点的 x/y 属于此坐标系 | 节点定位、addNode、节点属性 |
| **graph** | 经过平移/缩放变换后的视口坐标 | 画布实际渲染像素位置 |
| **client** | 浏览器窗口视口坐标（`getBoundingClientRect`） | 鼠标事件的 clientX/clientY |
| **page** | 文档坐标（含页面滚动偏移） | 鼠标事件的 pageX/pageY |

转换关系：

```
local --[matrix]--> graph --[offset]--> client --[scroll]--> page
```

## 点坐标转换 API

### local → 其他

```javascript
// local → graph（应用缩放和平移）
graph.localToGraph({ x: 100, y: 100 });      // Point
graph.localToGraph(100, 100);                  // Point

// local → client（浏览器视口坐标）
graph.localToClient({ x: 100, y: 100 });      // Point

// local → page（文档坐标）
graph.localToPage({ x: 100, y: 100 });        // Point
```

### 其他 → local

```javascript
// graph → local（逆变换）
graph.graphToLocal({ x: 200, y: 150 });       // Point

// client → local（最常用：鼠标事件 → 画布坐标）
graph.clientToLocal({ x: e.clientX, y: e.clientY });   // Point
graph.clientToLocal(e.clientX, e.clientY);              // Point

// client → graph
graph.clientToGraph({ x: e.clientX, y: e.clientY });   // Point

// page → local
graph.pageToLocal({ x: e.pageX, y: e.pageY });         // Point
```

## 矩形坐标转换 API

所有点转换都有对应的矩形版本，返回 `Rectangle` 对象：

```javascript
// local → graph
graph.localToGraphRect({ x: 100, y: 100, width: 200, height: 150 });

// local → client
graph.localToClientRect(100, 100, 200, 150);

// graph → local
graph.graphToLocalRect({ x: 200, y: 150, width: 300, height: 200 });

// client → local
graph.clientToLocalRect(e.clientX, e.clientY, width, height);

// client → graph
graph.clientToGraphRect({ x: 0, y: 0, width: 100, height: 100 });

// page → local
graph.pageToLocalRect({ x: 0, y: 0, width: 100, height: 100 });
```

## snapToGrid

将客户端坐标转换为 local 坐标并吸附到网格：

```javascript
// 将鼠标位置吸附到网格
const pos = graph.snapToGrid(e.clientX, e.clientY);
// 返回吸附后的 local 坐标 Point { x, y }
```

## 常用场景示例

### 场景 1：从外部拖拽元素到画布创建节点

```javascript
document.getElementById('drag-source').addEventListener('drop', (e) => {
  e.preventDefault();
  // 将鼠标释放位置转换为画布坐标，并吸附到网格
  const pos = graph.snapToGrid(e.clientX, e.clientY);
  graph.addNode({
    x: pos.x,
    y: pos.y,
    width: 100,
    height: 50,
    label: 'New Node',
  });
});
```

### 场景 2：自定义右键菜单定位

```javascript
graph.on('node:contextmenu', ({ e, node }) => {
  // 使用 client 坐标定位菜单（相对于浏览器视口）
  const menu = document.getElementById('context-menu');
  menu.style.left = `${e.clientX}px`;
  menu.style.top = `${e.clientY}px`;
  menu.style.display = 'block';
});
```

### 场景 3：获取节点在屏幕上的实际位置

```javascript
const node = graph.getCellById('node1');
const { x, y } = node.getPosition();  // local 坐标

// 转换为浏览器视口坐标（可用于定位浮层）
const clientPos = graph.localToClient({ x, y });
console.log(`节点在屏幕上的位置: (${clientPos.x}, ${clientPos.y})`);
```

### 场景 4：计算画布可视区域内的节点

```javascript
// 获取当前可视区域（graph 坐标系）
const visibleArea = graph.getGraphArea();  // Rectangle

// 转换为 local 坐标系
const localArea = graph.graphToLocalRect(visibleArea);

// 筛选在可视区域内的节点
const visibleNodes = graph.getNodes().filter((node) => {
  const bbox = node.getBBox();
  return localArea.isIntersectWithRect(bbox);
});
```

## 常见错误

### ❌ 直接使用鼠标 clientX/clientY 作为节点坐标

```javascript
// 错误：鼠标坐标是 client 坐标系，不能直接用于节点定位
document.addEventListener('click', (e) => {
  graph.addNode({ x: e.clientX, y: e.clientY, width: 80, height: 40 });  // ❌ 位置不对
});
```

```javascript
// 正确：先转换坐标系
document.addEventListener('click', (e) => {
  const pos = graph.clientToLocal(e.clientX, e.clientY);
  graph.addNode({ x: pos.x, y: pos.y, width: 80, height: 40 });  // ✅
});
```

### ❌ 混淆 localToGraph 和 localToClient

```javascript
// localToGraph：加了画布缩放/平移变换，用于画布内部像素计算
// localToClient：转换到浏览器视口坐标，用于定位 DOM 元素（如弹窗、菜单）
```

### ❌ X6 事件中的坐标已是 local 坐标

```javascript
// X6 事件回调中的 x, y 已经是 local 坐标，无需再转换
graph.on('blank:click', ({ e, x, y }) => {
  // x, y 已经是 local 坐标 ✅
  graph.addNode({ x, y, width: 80, height: 40 });
});
```
