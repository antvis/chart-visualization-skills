---
id: "g6-core-graph-api"
title: "G6 Graph 核心 API 参考"
description: |
  Graph 实例上的常用方法：数据增删改查、视口控制（缩放、平移、适配）、
  元素状态管理、事件监听、动态更新布局/行为/插件等。

library: "g6"
version: "5.x"
category: "core"
subcategory: "api"
tags:
  - "API"
  - "Graph"
  - "数据操作"
  - "视口"
  - "状态"
  - "事件"

related:
  - "g6-core-graph-init"
  - "g6-core-data-structure"
  - "g6-core-events"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 数据操作 API

### 读取数据

```javascript
// 获取所有数据
const allData = graph.getData();         // { nodes, edges, combos }
const nodes   = graph.getNodeData();     // NodeData[]
const edges   = graph.getEdgeData();     // EdgeData[]
const combos  = graph.getComboData();    // ComboData[]

// 按 id 获取单个元素
const node  = graph.getNodeData('n1');
const edge  = graph.getEdgeData('e1');
const combo = graph.getComboData('c1');

// 按 id 数组批量获取
const someNodes = graph.getNodeData(['n1', 'n2', 'n3']);
```

### 添加元素

```javascript
// 添加节点
graph.addNodeData([
   { id: 'n3', data: { label: '新节点', type: 'server' } },
]);

// 添加边
graph.addEdgeData([
   { source: 'n1', target: 'n3', data: { weight: 5 } },
]);

// 添加 combo
graph.addComboData([
   { id: 'c1', data: { label: '新分组' } },
]);

// 添加后需要 draw 生效
graph.draw();
```

### 更新元素

```javascript
// 更新节点数据（只传需要更新的字段）
graph.updateNodeData([
   { id: 'n1', data: { label: '更新后的标签', value: 200 } },
]);

// 更新边
graph.updateEdgeData([
   { id: 'e1', data: { weight: 10 } },
]);

graph.draw();
```

### 删除元素

```javascript
graph.removeNodeData(['n3']);         // 删除节点（关联边自动删除）
graph.removeEdgeData(['e1']);         // 删除边
graph.removeComboData(['c1']);        // 删除 combo

graph.draw();
```

### 批量操作（合并为一次历史记录）

```javascript
// batch 内的操作合并为一次渲染和历史记录
graph.batch(() => {
  graph.addNodeData([{ id: 'n10', data: { label: '批量A' } }]);
  graph.addNodeData([{ id: 'n11', data: { label: '批量B' } }]);
  graph.addEdgeData([{ source: 'n10', target: 'n11' }]);
});
graph.draw();
```

---

## 视口控制 API

### 缩放

```javascript
// 获取当前缩放比例
const zoom = graph.getZoom();         // 返回数字，1.0 = 原始大小

// 缩放到指定比例（带动画）
await graph.zoomTo(1.5, { easing: 'ease-out', duration: 300 });

// 相对缩放（在当前比例基础上）
await graph.zoom(0.8);                // 缩小到当前的 80%
```

### 平移

```javascript
// 获取当前平移量
const { x, y } = graph.getTranslate();

// 平移到绝对位置
await graph.translateTo({ x: 100, y: 200 });

// 相对平移
await graph.translate({ x: 50, y: 0 });
```

### 适配视图

```javascript
// 自动缩放并居中显示所有元素
await graph.fitView({
  padding: 20,                        // 边距
  direction: 'both',                  // 'x' | 'y' | 'both'
  when: 'overflow',                   // 仅内容溢出时适配
});

// 居中（不缩放）
await graph.fitCenter();

// 聚焦到指定元素（平移+缩放到该元素）
await graph.focusElement('n1', {
  easing: 'ease-in-out',
  duration: 500,
});
```

---

## 元素状态 API

```javascript
// 设置单个元素状态
graph.setElementState('n1', 'selected');
graph.setElementState('n1', ['selected', 'highlight']);
graph.setElementState('n1', []);          // 清除所有状态

// 批量设置（推荐，性能更好）
graph.setElementState({
  'n1': 'selected',
  'n2': ['highlight'],
  'e1': 'active',
});

// 读取状态
const states = graph.getElementState('n1'); // string[]

// 按状态查询元素
const selectedNodes = graph.getElementDataByState('node', 'selected');
const activeEdges   = graph.getElementDataByState('edge', 'active');
```

---

## 元素可见性 API

```javascript
// 隐藏/显示（可带动画）
graph.hideElement(['n1', 'n2'], true);     // true = 带动画
graph.showElement(['n1', 'n2'], true);

// 调整 Z 轴顺序
graph.frontElement(['n1']);               // 置顶
graph.backElement(['n1']);                // 置底
```

---

## 关联查询 API

```javascript
// 查询节点的所有关联边
const relatedEdges  = graph.getRelatedEdgesData('n1');
const incomingEdges = graph.getIncomingEdgesData('n1');
const outgoingEdges = graph.getOutgoingEdgesData('n1');

// 查询元素类型
const type = graph.getElementType('n1'); // 'node' | 'edge' | 'combo' | null
```

---

## 布局 / 行为 / 插件动态更新

```javascript
// 动态切换布局
graph.setLayout({ type: 'circular' });
await graph.layout();                    // 重新执行布局

// 动态更新行为（不用重新 render）
graph.setBehaviors([
  'drag-canvas',
  'zoom-canvas',
    { type: 'click-select', multiple: true },
]);

// 局部更新某个行为配置
graph.updateBehavior({
  key: 'click-select',
  multiple: false,
});

// 动态添加/移除插件
graph.setPlugins(['minimap', { type: 'tooltip', getContent: () => '' }]);

// 获取插件实例（需要给插件设置 key）
// plugins: [{ type: 'history', key: 'h1', stackSize: 20 }]
const history = graph.getPluginInstance('h1');
```

---

## 图片导出

```javascript
// 导出为 PNG Data URL
const dataURL = await graph.toDataURL({ type: 'image/png', encoderOptions: 0.9 });

// 下载图片
const link = document.createElement('a');
link.download = 'graph.png';
link.href = dataURL;
link.click();
```

---

## 销毁

```javascript
// 销毁图实例，释放内存
graph.destroy();
```
