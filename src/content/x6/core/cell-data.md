---
id: "x6-core-cell-data"
title: "X6 Cell 数据操作 API（prop/attr/data）"
description: |
  节点和边的数据读写 API：prop() 通用属性操作、attr() 样式属性操作、getData()/setData() 业务数据操作。
library: x6
version: 3.x
category: "core"
tags:
  - cell
  - data
  - prop
  - attr
  - getData
  - setData
  - node
  - edge
---

# Cell 数据操作 API

## 概述

X6 中每个 Cell（节点或边）都有三层数据操作 API：

| API | 作用 | 典型使用场景 |
|-----|------|-------------|
| `prop()` | 读写任意属性（shape、size、position 等） | 修改节点位置、大小 |
| `attr()` | 读写 `attrs` 下的样式属性 | 修改填充色、边框、文字 |
| `getData()` / `setData()` | 读写 `data` 字段（业务数据） | 存储业务状态、自定义数据 |

## prop — 通用属性操作

`prop()` 是最底层的属性操作方法，可以读写 Cell 的任意属性。

### 读取属性

```javascript
// 获取所有属性
const allProps = node.prop();

// 获取指定属性
const position = node.prop('position');    // { x: 100, y: 200 }
const shape = node.prop('shape');          // 'rect'

// 获取嵌套路径属性
const fill = node.prop('attrs/body/fill'); // '#fff'
```

### 设置属性

```javascript
// 设置单个属性
node.prop('position', { x: 200, y: 300 });

// 通过路径设置嵌套属性
node.prop('attrs/body/fill', '#f0f0f0');

// 批量设置多个属性（深度合并）
node.prop({
  position: { x: 200, y: 300 },
  size: { width: 120, height: 60 },
});
```

### 删除属性

```javascript
// 设置为 null 即删除
node.prop('attrs/body/stroke', null);
```

### setProp / removeProp

```javascript
// setProp 等价于 prop(key, value)
node.setProp('label', 'Hello');
node.setProp({ label: 'Hello', size: { width: 100, height: 40 } });

// removeProp 删除指定属性
node.removeProp('data');
node.removeProp('attrs/body/stroke');
```

## attr — 样式属性操作

`attr()` 是 `prop('attrs', ...)` 的快捷方式，专门操作 `attrs` 下的 SVG 样式。

### 读取样式

```javascript
// 获取所有 attrs
const attrs = node.attr();
// { body: { fill: '#fff', stroke: '#333' }, label: { text: 'Hello' } }

// 获取指定选择器的属性
const bodyAttrs = node.attr('body');        // { fill: '#fff', stroke: '#333' }
const fill = node.attr('body/fill');        // '#fff'
```

### 设置样式

```javascript
// 设置指定路径的值
node.attr('body/fill', '#ff0000');
node.attr('label/text', '新标题');

// 批量设置
node.attr({
  body: { fill: '#ff0000', stroke: '#333' },
  label: { text: '新标题', fontSize: 14 },
});
```

### 边的 attr 操作

```javascript
edge.attr('line/stroke', '#ff0000');
edge.attr('line/strokeWidth', 3);
edge.attr('line/targetMarker', 'classic');
```

## getData / setData — 业务数据操作

`data` 字段用于存储与渲染无关的业务数据，是最常用的状态存储方式。

### 初始化时设置 data

```javascript
const node = graph.addNode({
  shape: 'rect',
  x: 100, y: 100, width: 120, height: 60,
  data: {
    status: 'running',
    progress: 0.75,
    taskId: 'task-001',
  },
});
```

### 读取 data

```javascript
const data = node.getData();
// { status: 'running', progress: 0.75, taskId: 'task-001' }
```

### 设置 data（深度合并，默认行为）

```javascript
// 深度合并：只更新指定字段，保留其他字段
node.setData({ status: 'completed' });
// data 变为：{ status: 'completed', progress: 0.75, taskId: 'task-001' }
```

### 设置 data（浅合并）

```javascript
// 浅合并：Object.assign 行为
node.setData({ status: 'failed', error: 'timeout' }, { deep: false });
```

### 替换 data（完全覆盖）

```javascript
// 完全覆盖，丢弃旧数据
node.replaceData({ status: 'new', version: 2 });
// 等价于
node.setData({ status: 'new', version: 2 }, { overwrite: true });
```

### 删除 data

```javascript
node.removeData();
```

## 监听数据变化

```javascript
// 监听单个节点数据变化
node.on('change:data', ({ current, previous }) => {
  console.log('data 从', previous, '变为', current);
});

// 通过 graph 监听所有节点数据变化
graph.on('node:change:data', ({ node, current, previous }) => {
  console.log(`${node.id} data changed`);
});

// 监听 attrs 变化
graph.on('node:change:attrs', ({ node }) => {
  console.log(`${node.id} attrs changed`);
});
```

## 批量操作（Batch）

多次 prop/attr/setData 调用会触发多次事件。可以用 batch 合并为一次：

```javascript
graph.startBatch('update');
node.prop('position', { x: 200, y: 300 });
node.attr('body/fill', '#ff0000');
node.setData({ status: 'updated' });
graph.stopBatch('update');
// 只触发一次 batch:stop 事件
```

## 完整示例：动态状态更新

```javascript
import { Graph, Shape } from '@antv/x6';

// 注册带状态渲染的 HTML 节点
Shape.HTML.register({
  shape: 'status-node',
  effect: ['data'],
  html(node) {
    const { status, label } = node.getData() || {};
    const colors = { running: '#52c41a', error: '#f5222d', pending: '#faad14' };
    const div = document.createElement('div');
    div.style.cssText = `
      width: 100%; height: 100%; display: flex; align-items: center;
      padding: 8px; border: 2px solid ${colors[status] || '#d9d9d9'};
      border-radius: 4px; background: #fff;
    `;
    div.innerHTML = `<span style="color:${colors[status] || '#333'}">${label || 'Node'}</span>`;
    return div;
  },
});

const graph = new Graph({ container: 'container', width: 800, height: 600 });

const node = graph.addNode({
  shape: 'status-node',
  x: 100, y: 100, width: 160, height: 50,
  data: { status: 'pending', label: '数据处理' },
});

// 模拟状态更新 —— setData 触发 effect 重新渲染
setTimeout(() => node.setData({ status: 'running' }), 1000);
setTimeout(() => node.setData({ status: 'error', label: '数据处理（失败）' }), 3000);
```

## 常见错误

```javascript
// ❌ 错误：直接修改 getData() 返回的对象不会触发更新
const data = node.getData();
data.status = 'done';  // 不会触发重新渲染！

// ✅ 正确：通过 setData 修改
node.setData({ status: 'done' });

// ❌ 错误：attr 路径分隔符用 '.' 而非 '/'
node.attr('body.fill', '#fff');  // 错误，不生效

// ✅ 正确：使用 '/' 作为路径分隔符
node.attr('body/fill', '#fff');

// ❌ 错误：prop 设置 attrs 时只传部分会丢失其他
node.prop('attrs', { body: { fill: '#f00' } });
// 这会覆盖整个 attrs，丢失 label 等其他选择器！

// ✅ 正确：使用路径形式或 attr() 方法
node.prop('attrs/body/fill', '#f00');  // 只修改 body.fill
node.attr('body/fill', '#f00');        // 等价
```
