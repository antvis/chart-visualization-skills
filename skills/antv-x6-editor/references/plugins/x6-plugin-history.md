---
id: "x6-plugin-history"
title: "X6 History 撤销重做插件"
description: |
  History 插件提供画布操作的撤销（Undo）和重做（Redo）能力，自动记录节点/边的添加、删除、属性变更等操作。

library: "x6"
version: "3.x"
category: "plugins"
subcategory: "history"
tags:
  - "History"
  - "撤销"
  - "重做"
  - "undo"
  - "redo"
  - "历史记录"
  - "操作回退"

related:
  - "x6-plugins"
  - "x6-plugin-keyboard"
  - "x6-core-events"

use_cases:
  - "撤销上一步操作"
  - "重做已撤销操作"
  - "实现 Ctrl+Z/Ctrl+Y 快捷键"
  - "限制历史栈大小"
  - "忽略特定类型的操作变更"
  - "批量操作作为单次撤销"

difficulty: "beginner"
completeness: "full"
---

## 基本用法

```javascript
import { Graph, History } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new History({ enabled: true }));

// 撤销
graph.undo();

// 重做
graph.redo();
```

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | boolean | `false` | 是否启用历史记录 |
| `stackSize` | number | `0`（不限制） | 历史栈最大容量，超出后最早的记录被丢弃 |
| `ignoreAdd` | boolean | `false` | 忽略元素添加操作 |
| `ignoreRemove` | boolean | `false` | 忽略元素删除操作 |
| `ignoreChange` | boolean | `false` | 忽略元素属性变更操作 |
| `beforeAddCommand` | function | - | 命令入栈前的钩子，返回 `false` 阻止入栈 |
| `afterAddCommand` | function | - | 命令入栈后的回调 |
| `executeCommand` | function | - | 自定义命令执行逻辑 |
| `cancelInvalid` | boolean | `true` | 是否取消无效的命令 |

## 编程式 API

```javascript
// 撤销/重做
graph.undo();            // 撤销上一步
graph.redo();            // 重做
graph.undoAndCancel();   // 撤销但不放入 redoStack（无法 redo 回来）

// 查询状态
graph.canUndo();  // boolean，是否可以撤销
graph.canRedo();  // boolean，是否可以重做

// 栈大小查询
graph.getHistoryStackSize();  // 历史栈容量（stackSize 配置值，0 表示不限）
graph.getUndoStackSize();     // 当前 undo 栈中的记录数
graph.getRedoStackSize();     // 当前 redo 栈中的记录数
graph.getUndoRemainSize();    // undo 栈剩余可用空间

// 清空历史
graph.cleanHistory();

// 启用/禁用
graph.enableHistory();
graph.disableHistory();
graph.toggleHistory(true);
graph.isHistoryEnabled();  // boolean
```

## 事件监听

```javascript
// 撤销时触发
graph.on('history:undo', ({ cmds, options }) => {
  console.log('已撤销');
});

// 重做时触发
graph.on('history:redo', ({ cmds, options }) => {
  console.log('已重做');
});

// 新命令入栈时触发
graph.on('history:add', ({ cmds, options }) => {
  console.log('新增历史记录');
});

// 历史栈清空时触发
graph.on('history:clean', ({ cmds, options }) => {
  console.log('历史已清空');
});

// 任何历史变化时触发（undo/redo/add/clean 都会触发）
graph.on('history:change', ({ cmds, options }) => {
  // 可用于更新 UI 按钮状态
  updateUndoButton(graph.canUndo());
  updateRedoButton(graph.canRedo());
});
```

## 配置限制栈大小

```javascript
graph.use(new History({
  enabled: true,
  stackSize: 50,  // 最多保存 50 步操作
}));
```

## 过滤不需要记录的操作

```javascript
graph.use(new History({
  enabled: true,
  // 忽略所有属性变更（仅记录添加/删除）
  ignoreChange: true,
}));
```

使用 `beforeAddCommand` 进行精细过滤：

```javascript
graph.use(new History({
  enabled: true,
  beforeAddCommand(event, args) {
    // 忽略特定属性的变更
    if (event === 'cell:change:attrs') {
      return false;  // 不记录 attrs 变更
    }
  },
}));
```

## 完整示例：撤销重做 + 快捷键 + UI 状态

```javascript
import { Graph, History, Keyboard } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});

graph.use(new History({ enabled: true, stackSize: 100 }));
graph.use(new Keyboard({ enabled: true, global: true }));

// 绑定快捷键
graph.bindKey('ctrl+z', () => graph.undo());
graph.bindKey('ctrl+shift+z', () => graph.redo());

// 监听历史变化，更新 UI 按钮
graph.on('history:change', () => {
  document.getElementById('undo-btn').disabled = !graph.canUndo();
  document.getElementById('redo-btn').disabled = !graph.canRedo();
});

// 添加测试节点
graph.addNode({ x: 100, y: 100, width: 80, height: 40, label: 'Node' });
// 此时 canUndo() === true
```

## 批量操作合并为单次撤销

X6 的 `model.startBatch()` / `model.stopBatch()` 可以将多个操作合并为一条历史记录：

```javascript
// 批量操作开始
graph.startBatch('custom-batch');

// 以下操作会被合并为一条历史记录
graph.addNode({ id: 'a', x: 100, y: 100, width: 80, height: 40 });
graph.addNode({ id: 'b', x: 300, y: 100, width: 80, height: 40 });
graph.addEdge({ source: 'a', target: 'b' });

// 批量操作结束
graph.stopBatch('custom-batch');

// 一次 undo() 即可撤销上面三个操作
graph.undo();
```

## 常见错误

### ❌ 未注册插件调用 undo/redo

```javascript
const graph = new Graph({ container: 'container' });
graph.undo();  // ❌ 无效，History 插件未注册
```

```javascript
import { Graph, History } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new History({ enabled: true }));
graph.undo();  // ✅
```

### ❌ 在构造函数中配置 history

```javascript
// 错误：3.x 不支持
const graph = new Graph({
  container: 'container',
  history: { enabled: true },  // ❌
});
```

```javascript
// 正确
import { Graph, History } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new History({ enabled: true }));  // ✅
```
