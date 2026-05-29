---
id: "x6-plugin-selection"
title: "X6 Selection 框选插件"
description: |
  Selection 插件提供节点/边的点选、多选、框选能力，支持选中框显示、修饰键多选、选中元素拖拽移动等功能。

library: "x6"
version: "3.x"
category: "plugins"
subcategory: "selection"
tags:
  - "Selection"
  - "选中"
  - "框选"
  - "多选"
  - "rubberband"
  - "select"
  - "unselect"
  - "getSelectedCells"

related:
  - "x6-plugins"
  - "x6-plugin-keyboard"
  - "x6-core-events"

use_cases:
  - "框选多个节点"
  - "点击选中节点/边"
  - "Ctrl/Meta 多选"
  - "获取选中元素列表"
  - "选中后批量删除"
  - "选中后批量移动"

difficulty: "beginner"
completeness: "full"
---

## 基本用法

```javascript
import { Graph, Selection } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new Selection({
  enabled: true,
  rubberband: true,  // 启用框选
}));
```

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | boolean | `false` | 是否启用选择功能 |
| `rubberband` | boolean | `false` | 是否启用框选（拖拽矩形框选中元素） |
| `multiple` | boolean | `true` | 是否允许多选 |
| `strict` | boolean | `false` | 严格模式：框选时元素必须完全在框内才被选中 |
| `showNodeSelectionBox` | boolean | `false` | 选中节点时是否显示选中框 |
| `showEdgeSelectionBox` | boolean | `false` | 选中边时是否显示选中框 |
| `movable` | boolean | `true` | 选中的元素是否可以被拖拽移动 |
| `multipleSelectionModifiers` | string[] | `['ctrl', 'meta']` | 多选修饰键 |
| `rubberband` | boolean | `false` | 启用框选 |
| `filter` | function/string[] | - | 过滤不可选中的元素 |
| `content` | function | - | 自定义选中框显示内容 |

## 编程式 API

Selection 插件注册后，以下方法自动挂载到 graph 实例：

```javascript
// 选中元素（支持节点ID、节点实例、数组）
graph.select(node);
graph.select([node1, node2]);
graph.select('node-id');

// 取消选中
graph.unselect(node);
graph.unselect([node1, node2]);

// 判断是否选中
graph.isSelected(node);       // boolean
graph.isSelected('node-id');  // boolean

// 获取选中元素
graph.getSelectedCells();      // Cell[]
graph.getSelectedCellCount();  // number

// 清空选择
graph.cleanSelection();

// 重置选择（替换当前选中为新元素）
graph.resetSelection([node1, node2]);

// 判断选择是否为空
graph.isSelectionEmpty();  // boolean
```

## 动态控制 API

```javascript
// 启用/禁用选择
graph.enableSelection();
graph.disableSelection();
graph.toggleSelection(true);
graph.isSelectionEnabled();  // boolean

// 启用/禁用多选
graph.enableMultipleSelection();
graph.disableMultipleSelection();
graph.toggleMultipleSelection(true);
graph.isMultipleSelection();  // boolean

// 启用/禁用框选
graph.enableRubberband();
graph.disableRubberband();
graph.toggleRubberband(true);
graph.isRubberbandEnabled();  // boolean

// 启用/禁用严格框选
graph.enableStrictRubberband();
graph.disableStrictRubberband();
graph.toggleStrictRubberband(true);
graph.isStrictRubberband();  // boolean

// 选中元素是否可拖拽移动
graph.enableSelectionMovable();
graph.disableSelectionMovable();
graph.toggleSelectionMovable(true);
graph.isSelectionMovable();  // boolean

// 设置框选修饰键
graph.setRubberbandModifiers('alt');
graph.setRubberbandModifiers(['ctrl', 'shift']);

// 设置选中过滤器
graph.setSelectionFilter((cell) => cell.isNode());

// 设置选中框自定义内容
graph.setSelectionDisplayContent((selection, contentElement) => {
  contentElement.textContent = `${selection.length} items`;
});
```

## 事件监听

```javascript
// 选中变化事件
graph.on('selection:changed', ({ added, removed, selected }) => {
  // added: 新增选中的元素
  // removed: 取消选中的元素
  // selected: 当前所有选中元素
  console.log('当前选中:', selected.length, '个元素');
});
```

## 完整示例：框选 + 快捷键删除

```javascript
import { Graph, Selection, Keyboard } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});

graph.use(new Selection({
  enabled: true,
  rubberband: true,
  multiple: true,
  showNodeSelectionBox: true,
  multipleSelectionModifiers: ['ctrl', 'meta'],
}));
graph.use(new Keyboard({ enabled: true }));

// Delete 键删除选中元素
graph.bindKey('delete', () => {
  const cells = graph.getSelectedCells();
  if (cells.length) {
    graph.removeCells(cells);
  }
});

// Ctrl+A 全选
graph.bindKey('ctrl+a', () => {
  graph.select(graph.getCells());
});

// 添加示例数据
graph.addNode({ id: 'node1', x: 100, y: 100, width: 80, height: 40, label: 'Node 1' });
graph.addNode({ id: 'node2', x: 300, y: 100, width: 80, height: 40, label: 'Node 2' });
graph.addEdge({ source: 'node1', target: 'node2' });
```

## 过滤器示例：仅允许选中节点

```javascript
graph.use(new Selection({
  enabled: true,
  rubberband: true,
  filter: (cell) => cell.isNode(),  // 边不可被选中
}));
```

也可以通过 shape 名过滤：

```javascript
graph.use(new Selection({
  enabled: true,
  filter: ['rect', 'circle'],  // 仅允许选中 rect 和 circle 形状
}));
```

## 常见错误

### ❌ 未注册插件就调用 graph.select()

```javascript
// 错误：未注册 Selection 插件
const graph = new Graph({ container: 'container' });
graph.select(node);  // ❌ 无效，不会报错但不生效
```

```javascript
// 正确：先注册插件
import { Graph, Selection } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Selection({ enabled: true }));
graph.select(node);  // ✅
```

### ❌ 在构造函数中配置 selecting

```javascript
// 错误：3.x 不支持
const graph = new Graph({
  container: 'container',
  selecting: { enabled: true, rubberband: true },  // ❌
});
```

```javascript
// 正确：使用 graph.use()
import { Graph, Selection } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Selection({ enabled: true, rubberband: true }));  // ✅
```
