---
id: "x6-plugin-clipboard"
title: "X6 Clipboard 复制粘贴插件"
description: |
  Clipboard 插件提供画布元素的复制（Copy）、剪切（Cut）、粘贴（Paste）能力，支持跨画布粘贴和 localStorage 持久化。

library: "x6"
version: "3.x"
category: "plugins"
subcategory: "clipboard"
tags:
  - "Clipboard"
  - "复制"
  - "粘贴"
  - "剪切"
  - "copy"
  - "paste"
  - "cut"

related:
  - "x6-plugins"
  - "x6-plugin-selection"
  - "x6-plugin-keyboard"

use_cases:
  - "复制选中的节点和边"
  - "剪切选中元素"
  - "粘贴到画布（带偏移）"
  - "跨页面复制粘贴"
  - "Ctrl+C/Ctrl+V 快捷键"

difficulty: "beginner"
completeness: "full"
---

## 基本用法

```javascript
import { Graph, Clipboard } from '@antv/x6';

const graph = new Graph({ container: 'container' });
graph.use(new Clipboard({ enabled: true }));

// 复制
graph.copy(cells);

// 粘贴
graph.paste();

// 剪切
graph.cut(cells);
```

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enabled` | boolean | `false` | 是否启用剪贴板 |
| `useLocalStorage` | boolean | `false` | 是否使用 localStorage 存储（支持跨页面粘贴） |

## 编程式 API

### copy(cells, options?)

复制指定元素到剪贴板：

```javascript
// 复制选中元素
const cells = graph.getSelectedCells();
graph.copy(cells);

// 深拷贝（包括子元素）
graph.copy(cells, { deep: true });

// 使用 localStorage（跨页面）
graph.copy(cells, { useLocalStorage: true });
```

### cut(cells, options?)

剪切：复制后从画布中删除：

```javascript
const cells = graph.getSelectedCells();
graph.cut(cells);
```

### paste(options?)

粘贴剪贴板内容到画布：

```javascript
// 默认粘贴（偏移 20px）
graph.paste();

// 自定义偏移
graph.paste({ offset: 40 });

// 指定偏移方向
graph.paste({ offset: { dx: 30, dy: 30 } });

// 粘贴时修改节点属性
graph.paste({
  offset: 20,
  nodeProps: { zIndex: 10 },
  edgeProps: { zIndex: 5 },
});

// 从 localStorage 粘贴
graph.paste({ useLocalStorage: true });
```

### getCellsInClipboard()

获取当前剪贴板中的元素：

```javascript
const cells = graph.getCellsInClipboard();
console.log('剪贴板中有', cells.length, '个元素');
```

### isClipboardEmpty()

判断剪贴板是否为空：

```javascript
if (!graph.isClipboardEmpty()) {
  graph.paste();
}
```

## 事件监听

```javascript
graph.on('clipboard:changed', ({ cells }) => {
  console.log('剪贴板内容变化:', cells.length, '个元素');
});
```

## 完整示例：复制粘贴 + 快捷键

```javascript
import { Graph, Selection, Clipboard, Keyboard } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});

graph.use(new Selection({ enabled: true, rubberband: true }));
graph.use(new Clipboard({ enabled: true }));
graph.use(new Keyboard({ enabled: true, global: true }));

// Ctrl+C 复制
graph.bindKey('ctrl+c', () => {
  const cells = graph.getSelectedCells();
  if (cells.length) {
    graph.copy(cells);
  }
});

// Ctrl+X 剪切
graph.bindKey('ctrl+x', () => {
  const cells = graph.getSelectedCells();
  if (cells.length) {
    graph.cut(cells);
  }
});

// Ctrl+V 粘贴
graph.bindKey('ctrl+v', () => {
  if (!graph.isClipboardEmpty()) {
    const cells = graph.paste({ offset: 20 });
    graph.cleanSelection();
    graph.select(cells);  // 选中粘贴的元素
  }
});

// 添加示例节点
graph.addNode({ x: 100, y: 100, width: 100, height: 50, label: 'Copy me' });
```

## 跨页面复制粘贴

启用 `useLocalStorage` 后，复制的数据存储在浏览器 localStorage 中，可以在同域名下的不同页面间粘贴：

```javascript
graph.use(new Clipboard({
  enabled: true,
  useLocalStorage: true,  // 启用跨页面
}));

// 页面 A 复制
graph.copy(graph.getSelectedCells(), { useLocalStorage: true });

// 页面 B 粘贴
graph.paste({ useLocalStorage: true });
```

## 常见错误

### ❌ 复制时传入空数组

```javascript
// 错误：未检查是否有选中元素
graph.bindKey('ctrl+c', () => {
  graph.copy(graph.getSelectedCells());  // 如果没选中任何元素，传入空数组
  // 此时剪贴板会被清空！
});
```

```javascript
// 正确：先检查
graph.bindKey('ctrl+c', () => {
  const cells = graph.getSelectedCells();
  if (cells.length) {
    graph.copy(cells);
  }
});
```

### ❌ 未注册 Clipboard 就调用 copy/paste

```javascript
// 错误：插件未注册
const graph = new Graph({ container: 'container' });
graph.copy(cells);   // ❌ 无效
graph.paste();       // ❌ 无效
```

```javascript
// 正确：先注册插件
import { Graph, Clipboard } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Clipboard({ enabled: true }));
graph.copy(cells);   // ✅
graph.paste();       // ✅
```
