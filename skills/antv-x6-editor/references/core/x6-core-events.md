---
id: "x6-core-events"
title: "X6 事件系统"
description: |
  X6 画布、节点、边的事件监听与处理。
  包含点击、拖拽、变更、键盘等事件的使用方式。

library: "x6"
version: "3.x"
category: "core"
subcategory: "events"
tags:
  - "事件"
  - "event"
  - "click"
  - "mouseenter"
  - "mouseleave"
  - "moved"
  - "added"
  - "removed"
  - "changed"
  - "node:click"
  - "edge:click"
  - "blank:click"
  - "交互"

related:
  - "x6-core-graph-init"
  - "x6-core-node"
  - "x6-core-edge"

use_cases:
  - "监听节点点击事件"
  - "监听边的选中状态"
  - "监听画布空白区域点击"
  - "监听节点移动完成"
  - "监听节点/边的添加和删除"

anti_patterns:
  - "不要用位置参数解构事件回调，必须用对象解构"
  - "不要在高频事件（mousemove）中执行重计算"

difficulty: "beginner"
completeness: "full"
---

## 事件回调格式

**重要**：X6 事件回调参数是**对象解构**，不是位置参数。

```javascript
// ✅ 正确：对象解构
graph.on('node:click', ({ node, e }) => {
  console.log('Clicked node:', node.id);
});

// ❌ 错误：位置参数
graph.on('node:click', (node, e) => { ... });
```

## 节点事件

```javascript
// 点击
graph.on('node:click', ({ node, e }) => {
  console.log('Clicked:', node.id);
});

// 双击
graph.on('node:dblclick', ({ node, e }) => {
  console.log('Double clicked:', node.id);
});

// 右键
graph.on('node:contextmenu', ({ node, e }) => {
  e.preventDefault();
});

// 鼠标进入/离开
graph.on('node:mouseenter', ({ node }) => {
  node.attr('body/stroke', '#1890ff');
});

graph.on('node:mouseleave', ({ node }) => {
  node.attr('body/stroke', '#8f8f8f');
});

// 节点移动中
graph.on('node:moving', ({ node, x, y }) => {
  console.log('Moving to:', x, y);
});

// 节点移动完成
graph.on('node:moved', ({ node }) => {
  const pos = node.getPosition();
  console.log('Moved to:', pos.x, pos.y);
});

// 节点大小改变
graph.on('node:resized', ({ node }) => {
  const size = node.getSize();
  console.log('Resized to:', size.width, size.height);
});
```

## 边事件

```javascript
// 点击
graph.on('edge:click', ({ edge, e }) => {
  console.log('Edge:', edge.id);
});

// 鼠标进入/离开
graph.on('edge:mouseenter', ({ edge }) => {
  edge.attr('line/stroke', '#1890ff');
  edge.attr('line/strokeWidth', 2);
});

graph.on('edge:mouseleave', ({ edge }) => {
  edge.attr('line/stroke', '#8f8f8f');
  edge.attr('line/strokeWidth', 1);
});

// 连线完成
graph.on('edge:connected', ({ edge, isNew }) => {
  if (isNew) {
    console.log('New edge created:', edge.id);
  }
});
```

## 画布事件

```javascript
// 点击空白区域
graph.on('blank:click', ({ e }) => {
  // 取消选择
  graph.cleanSelection();
});

// 画布缩放
graph.on('scale', ({ sx, sy }) => {
  console.log('Scale:', sx, sy);
});

// 画布平移
graph.on('translate', ({ tx, ty }) => {
  console.log('Translate:', tx, ty);
});
```

## 元素变更事件

```javascript
// 节点/边被添加
graph.on('cell:added', ({ cell }) => {
  console.log('Added:', cell.id, cell.isNode() ? 'node' : 'edge');
});

// 节点/边被删除
graph.on('cell:removed', ({ cell }) => {
  console.log('Removed:', cell.id);
});

// 属性变更
graph.on('cell:changed', ({ cell, options }) => {
  console.log('Changed:', cell.id);
});
```

## Selection 事件

```javascript
// 选中变化（需要启用 selecting 插件）
graph.on('selection:changed', ({ added, removed, selected }) => {
  console.log('Selected nodes:', selected.length);
  added.forEach(cell => cell.attr('body/stroke', '#1890ff'));
  removed.forEach(cell => cell.attr('body/stroke', '#8f8f8f'));
});
```

## History 事件

```javascript
// 撤销/重做（需要启用 history 插件）
graph.on('history:undo', () => {
  console.log('Undo performed');
});

graph.on('history:redo', () => {
  console.log('Redo performed');
});
```

## 事件管理

```javascript
// 监听一次
graph.once('node:click', ({ node }) => { ... });

// 移除监听
const handler = ({ node }) => { ... };
graph.on('node:click', handler);
graph.off('node:click', handler);

// 移除所有监听
graph.off('node:click');
```

## 常用事件模式

### 节点状态切换

```javascript
graph.on('node:click', ({ node }) => {
  const data = node.getData() || {};
  const isActive = !data.active;
  node.setData({ active: isActive });
  node.attr('body/fill', isActive ? '#e6f7ff' : '#fff');
  node.attr('body/stroke', isActive ? '#1890ff' : '#8f8f8f');
});
```

### 高亮相邻节点

```javascript
graph.on('node:click', ({ node }) => {
  // 重置所有节点样式
  graph.getNodes().forEach(n => {
    n.attr('body/fill', '#fff');
  });
  // 高亮当前节点
  node.attr('body/fill', '#e6f7ff');
  // 高亮相邻节点
  const neighbors = graph.getNeighbors(node);
  neighbors.forEach(n => {
    n.attr('body/fill', '#d9f7be');
  });
});
```

### 删除选中元素

```javascript
graph.on('blank:click', () => {
  graph.cleanSelection();
});

// 配合 keyboard 插件
graph.bindKey('delete', () => {
  const cells = graph.getSelectedCells();
  if (cells.length) {
    graph.removeCells(cells);
  }
});
```

## 最小可运行示例

```javascript
import { Graph } from '@antv/x6'

// 创建画布
const graph = new Graph({
  container: document.getElementById('container'),
  width: 800,
  height: 600,
  background: { color: '#F2F7FA' },
  grid: { visible: true },
})

// 监听画布事件
graph.on('blank:click', ({ e }) => {
  console.log('点击空白区域')
})

graph.on('cell:added', ({ cell }) => {
  console.log('添加元素:', cell.id)
})

graph.on('cell:removed', ({ cell }) => {
  console.log('删除元素:', cell.id)
})

// 添加节点
graph.addNode({
  shape: 'rect',
  x: 100,
  y: 80,
  width: 100,
  height: 40,
  label: 'Node 1',
  attrs: {
    body: { 
      stroke: '#8f8f8f', 
      strokeWidth: 1, 
      fill: '#fff',
      rx: 6,
      ry: 6
    }
  }
})

// 监听节点事件
graph.on('node:mouseenter', ({ node }) => {
  node.attr('body/stroke', '#1890ff')
  node.attr('body/strokeWidth', 2)
})

graph.on('node:mouseleave', ({ node }) => {
  node.attr('body/stroke', '#8f8f8f')
  node.attr('body/strokeWidth', 1)
})
```

## 常见错误与修正

### 错误：Selection 构造函数使用错误

```javascript
// ❌ 错误：直接使用 new Selection()
graph.use(new Selection({ enabled: true, rubberband: true }));

// ✅ 正确：使用 graph.use() 并正确配置插件
import { Selection } from '@antv/x6-plugin-selection'
graph.use(new Selection({ enabled: true, rubberband: true }))
```

### 错误：插件初始化方式错误

```javascript
// ❌ 错误：使用 plugins 数组初始化插件
const graph = new Graph({
  plugins: [
    new Selection(),
    new Snapline(),
    new Keyboard(),
    new Clipboard(),
    new History()
  ]
});

// ✅ 正确：使用 graph.use() 方法初始化插件
import { Selection, Snapline, History } from '@antv/x6-plugin-selection'

graph.use(new Selection({ enabled: true, rubberband: true }));
graph.use(new Snapline({ enabled: true }));
graph.use(new History({ enabled: true }));
```

### 错误：节点注册方式错误

```javascript
// ❌ 错误：使用 graph.registerNode 注册节点
graph.registerNode('start-event', {
  // ...
}, true);

// ✅ 正确：直接使用内置 shape 或通过继承创建节点
const start = graph.addNode({
  shape: 'circle',
  x: 80,
  y: 200,
  width: 40,
  height: 40,
  attrs: { 
    body: { fill: '#52c41a', stroke: '#389e0d' },
    label: { text: 'Start', fill: '#fff', fontSize: 11 }
  },
  ports: {
    groups: {
      out: {
        position: 'right',
        attrs: {
          circle: { r: 4, magnet: true, stroke: '#52c41a', fill: '#fff' }
        }
      }
    },
    items: [{ id: 'out', group: 'out' }]
  }
});
```

### 错误：创建边时未正确绑定上下文

```javascript
// ❌ 错误：在 createEdge 中使用 graph.createEdge
connecting: {
  createEdge() {
    return graph.createEdge({ ... }); // 错误：this 指向问题
  }
}

// ✅ 正确：使用 this.createEdge
connecting: {
  createEdge() {
    return this.createEdge({ ... }); // 正确：this 指向 graph 实例
  }
}
```

### 错误：节点属性设置不完整导致渲染异常

```javascript
// ❌ 错误：缺少必要的属性设置
const start = graph.addNode({
  shape: 'circle',
  x: 80,
  y: 200,
  width: 40,
  height: 40
});

// ✅ 正确：设置完整的节点属性
const start = graph.addNode({
  shape: 'circle',
  x: 80,
  y: 200,
  width: 40,
  height: 40,
  attrs: { 
    body: { fill: '#52c41a', stroke: '#389e0d' },
    label: { text: 'Start', fill: '#fff', fontSize: 11 }
  },
  ports: {
    groups: {
      out: {
        position: 'right',
        attrs: {
          circle: { r: 4, magnet: true, stroke: '#52c41a', fill: '#fff' }
        }
      }
    },
    items: [{ id: 'out', group: 'out' }]
  }
});
```