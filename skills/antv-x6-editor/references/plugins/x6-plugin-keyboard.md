---
id: "x6-plugin-keyboard"
title: "X6 Keyboard 快捷键插件"
description: |
  Keyboard 插件为画布提供键盘快捷键支持。
  基于 Mousetrap 库实现，支持组合键、序列键和作用域控制。

library: "x6"
version: "3.x"
category: "plugins"
subcategory: "keyboard"
tags:
  - "keyboard"
  - "快捷键"
  - "hotkey"
  - "bindKey"
  - "Mousetrap"
  - "ctrl"
  - "undo"
  - "redo"
  - "delete"
  - "copy"
  - "paste"

related:
  - "x6-plugins"
  - "x6-core-events"

use_cases:
  - "绑定 Ctrl+Z/Ctrl+Y 实现撤销重做"
  - "绑定 Delete/Backspace 删除选中元素"
  - "绑定 Ctrl+C/Ctrl+V 复制粘贴"
  - "自定义快捷键操作画布"

difficulty: "beginner"
completeness: "full"
---

## 核心概念

**Keyboard** 插件基于 [Mousetrap](https://github.com/ccampbell/mousetrap) 库为画布提供快捷键绑定能力。支持：
- 单键：`'delete'`、`'backspace'`、`'escape'`
- 组合键：`'ctrl+z'`、`'ctrl+shift+z'`、`'command+c'`
- 序列键：`'g i'`（依次按 g 然后 i）
- 多键绑定：数组形式同时绑定多个按键

## 基本用法

```javascript
import { Graph, Keyboard } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});

// 注册 Keyboard 插件
const keyboard = new Keyboard({ enabled: true });
graph.use(keyboard);

// 绑定快捷键
keyboard.bindKey('ctrl+z', () => {
  // 撤销操作
});

keyboard.bind(Keyboard.events.KEYDOWN, (e) => {
  console.log('keydown', e);
});

keyboard.bindKey('ctrl+shift+z', () => {
  // 重做操作
});

keyboard.bindKey(['delete', 'backspace'], () => {
  // 删除选中元素
  const cells = graph.getSelectedCells();
  if (cells.length) {
    graph.removeCells(cells);
  }
});
```

## 配置项

### KeyboardOptions

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 是否启用 |
| `global` | `boolean` | `false` | 是否绑定到 document（`true`）还是画布容器（`false`） |
| `format` | `(key: string) => string` | 无 | 按键格式化函数 |
| `guard` | `(e: KeyboardEvent) => boolean` | 无 | 守卫函数，返回 `true` 则阻止快捷键触发 |

### global 参数说明

- `false`（默认）：快捷键仅在画布容器获得焦点时生效。容器会自动设置 `tabindex="-1"` 以确保可聚焦。
- `true`：快捷键绑定到 `document`，全局生效，不需要画布获取焦点。

## API 方法

| 方法 | 说明 |
|------|------|
| `keyboard.bindKey(keys, callback, action?)` | 绑定快捷键 |
| `keyboard.unbindKey(keys, action?)` | 解绑快捷键 |
| `keyboard.trigger(key, action?)` | 手动触发快捷键回调 |
| `keyboard.clear()` | 清除所有绑定 |
| `keyboard.enable()` | 启用键盘 |
| `keyboard.disable()` | 禁用键盘 |
| `keyboard.isEnabled()` | 获取启用状态 |
| `keyboard.toggleEnabled(enabled?)` | 切换启用状态 |

### bindKey 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `keys` | `string \| string[]` | 按键或按键数组 |
| `callback` | `(e: KeyboardEvent) => void` | 回调函数 |
| `action` | `'keypress' \| 'keydown' \| 'keyup'` | 可选，触发时机，默认 `'keydown'` |

### 按键语法（Mousetrap 格式）

| 类型 | 示例 | 说明 |
|------|------|------|
| 单键 | `'a'`、`'1'`、`'delete'` | 单个按键 |
| 修饰组合 | `'ctrl+s'`、`'command+c'` | 修饰键 + 按键 |
| 多修饰 | `'ctrl+shift+z'` | 多个修饰键 |
| 多键绑定 | `['ctrl+z', 'command+z']` | 数组，兼容 Win/Mac |
| 序列键 | `'g i'`（空格分隔） | 依次按下 |

## 完整示例

### 常见编辑器快捷键

```javascript
import { Graph, Keyboard, Selection, Clipboard, History } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});

graph.use(new Selection({ enabled: true, rubberband: true }));
graph.use(new Clipboard({ enabled: true }));
graph.use(new History({ enabled: true }));

const keyboard = new Keyboard({ enabled: true });
graph.use(keyboard);

// 撤销/重做
keyboard.bindKey(['ctrl+z', 'command+z'], () => {
  if (graph.canUndo()) {
    graph.undo();
  }
});

keyboard.bindKey(['ctrl+shift+z', 'command+shift+z'], () => {
  if (graph.canRedo()) {
    graph.redo();
  }
});

// 删除
keyboard.bindKey(['delete', 'backspace'], () => {
  const cells = graph.getSelectedCells();
  if (cells.length) {
    graph.removeCells(cells);
  }
});

// 复制/粘贴
keyboard.bindKey(['ctrl+c', 'command+c'], () => {
  const cells = graph.getSelectedCells();
  if (cells.length) {
    graph.copy(cells);
  }
});

keyboard.bindKey(['ctrl+v', 'command+v'], () => {
  if (!graph.isClipboardEmpty()) {
    const cells = graph.paste({ offset: 32 });
    graph.cleanSelection();
    graph.select(cells);
  }
});

// 全选
keyboard.bindKey(['ctrl+a', 'command+a'], (e) => {
  e.preventDefault();
  graph.select(graph.getCells());
});
```

### 全局模式（不需要画布聚焦）

```javascript
const keyboard = new Keyboard({
  enabled: true,
  global: true,  // 绑定到 document
  guard(e) {
    // 在 input/textarea 中不触发
    const tagName = (e.target as HTMLElement)?.tagName?.toLowerCase();
    return tagName === 'input' || tagName === 'textarea';
  },
});
graph.use(keyboard);
```

## 常见错误

### ❌ 快捷键不生效（未聚焦画布）

```javascript
// 问题：默认模式下，画布容器未获得焦点时快捷键不触发
const keyboard = new Keyboard({ enabled: true });
graph.use(keyboard);
// 需要点击画布后快捷键才生效

// 解决方案一：使用 global 模式
const keyboard = new Keyboard({ enabled: true, global: true });

// 解决方案二：手动聚焦容器
graph.container.focus();
```

### ❌ Mac/Windows 兼容问题

```javascript
// 错误：只绑定 ctrl，Mac 用户无法使用
keyboard.bindKey('ctrl+z', handler); // ❌ Mac 上不生效

// 正确：同时绑定 ctrl 和 command
keyboard.bindKey(['ctrl+z', 'command+z'], handler); // ✅
```

### ❌ 错误使用 graph.bindKey 或 graph.bind

```javascript
// 错误：使用 graph.bindKey（不存在的方法）
graph.bindKey('ctrl+s', handler); // ❌ 报错：graph.bindKey is not a function

// 正确：使用 keyboard 实例调用 bindKey
const keyboard = new Keyboard({ enabled: true });
graph.use(keyboard);
keyboard.bindKey('ctrl+s', handler); // ✅

// 错误：使用 graph.bind 监听 Keyboard.events（已废弃或不存在）
graph.bind(Keyboard.events.KEYDOWN, handler); // ❌ 报错：Cannot read properties of undefined

// 正确：使用 keyboard.bindKey 绑定组合键
keyboard.bindKey('ctrl+d', () => {
  const cells = graph.getSelectedCells();
  if (cells.length) {
    const cloned = graph.cloneCells(cells);
    Object.values(cloned).forEach((cell) => {
      if (cell.isNode()) {
        cell.translate(30, 30);
        graph.addCell(cell);
      }
    });
  }
});
```

### ❌ 快捷键冲突或未阻止默认行为

```javascript
// 错误：未阻止浏览器默认行为，可能导致页面跳转等副作用
keyboard.bindKey('ctrl+s', () => {
  const data = graph.toJSON();
  console.log(data);
}); // ❌ 浏览器会弹出保存对话框

// 正确：在回调中阻止默认行为
keyboard.bindKey('ctrl+s', (e) => {
  e.preventDefault();
  const data = graph.toJSON();
  console.log(data);
  return false; // 可选：返回 false 阻止进一步冒泡
});
```

### ❌ 变量未定义导致运行时错误

```javascript
// 错误：未正确声明 keyboard 变量导致运行时报错 "keyboard is not defined"
const keyboard = new Keyboard({ enabled: true });
graph.use(keyboard);

keyboard.bindKey(['ctrl+c', 'command+c'], () => {
  const cells = graph.getSelectedCells();
  if (cells.length) {
    graph.copy(cells);
  }
});

// 正确：确保 keyboard 变量已声明并正确使用
const keyboard = new Keyboard({ enabled: true });
graph.use(keyboard);

keyboard.bindKey(['ctrl+c', 'command+c'], () => {
  const cells = graph.getSelectedCells();
  if (cells.length) {
    graph.copy(cells);
  }
});
```

### ❌ 使用 graph.bindKey 而不是 keyboard.bindKey

```javascript
// 错误：使用 graph.bindKey（不存在的方法）
graph.bindKey('ctrl+s', handler); // ❌ 报错：graph.bindKey is not a function

// 正确：使用 keyboard 实例调用 bindKey
const keyboard = new Keyboard({ enabled: true });
graph.use(keyboard);
keyboard.bindKey('ctrl+s', handler); // ✅
```

</skill>