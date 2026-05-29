---
id: "x6-core-graph-init"
title: "X6 画布初始化"
description: |
  使用 new Graph({...}) 创建图编辑画布的完整配置指南。
  包含容器、尺寸、背景、网格、平移缩放、连线交互的配置方式。

library: "x6"
version: "3.x"
category: "core"
subcategory: "init"
tags:
  - "初始化"
  - "Graph"
  - "容器"
  - "画布"
  - "背景"
  - "网格"
  - "grid"
  - "background"
  - "container"
  - "new Graph"
  - "panning"
  - "mousewheel"
  - "缩放"
  - "平移"

related:
  - "x6-core-node"
  - "x6-core-edge"
  - "x6-core-ports"

use_cases:
  - "创建图编辑画布"
  - "配置画布背景和网格"
  - "启用画布平移和缩放"
  - "设置画布尺寸"

anti_patterns:
  - "不要遗漏 container 参数"
  - "不要使用 @antv/x6-plugin-xxx 独立包"

difficulty: "beginner"
completeness: "full"
---

## 核心概念

Graph 是 X6 的画布容器，管理所有节点和边。X6 采用**命令式 API**：先创建画布，再通过 `addNode()`/`addEdge()` 逐步添加元素。

**X6 与 G6 的关键区别：**
- X6 是图**编辑**引擎（重交互），G6 是图**可视化**引擎（重布局渲染）
- X6 无内置布局算法，节点位置通过 `x`/`y` 手动指定
- X6 以连接桩（Ports）为核心连线机制

## 基础初始化

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',  // 必填：DOM id 或 HTMLElement
  width: 80 0,              // 可选：不设则自适应容器
  height: 600,
});
```

## 背景和网格

```javascript
const graph = new Graph({
  container: 'container',
  background: {
    color: '#F2F7FA',      // 背景色
  },
  grid: {
    visible: true,         // 显示网格
    size: 10,              // 网格大小
    type: 'dot',           // 'dot' | 'mesh' | 'double-mesh'
  },
});
```

### 双层网格

```javascript
grid: {
  size: 10,
  visible: true,
  type: 'double-mesh',
  args: [
    { color: '#eee', thickness: 1 },
    { color: '#ddd', thickness: 1, factor: 4 },
  ],
},
```

## 平移和缩放

```javascript
const graph = new Graph({
  container: 'container',
  panning: true,                    // 拖拽平移（鼠标左键拖空白区域）
  mousewheel: {
    enabled: true,
    modifiers: 'ctrl',              // 按住 Ctrl + 滚轮缩放
    minScale: 0.2,
    maxScale: 4,
  },
});
```

### 平移配置详解

```javascript
panning: {
  enabled: true,
  modifiers: 'shift',    // 按住 Shift 才能平移
  eventTypes: ['leftMouseDown', 'rightMouseDown'],
}
```

## 画布变换

```javascript
// 居中内容
graph.centerContent();

// 缩放到适应画布
graph.zoomToFit({ padding: 20 });

// 设置缩放比例
graph.zoom(0.5);     // 相对缩放
graph.zoomTo(1.5);   // 绝对缩放

// 滚动到某个节点
graph.centerCell(node);

// 缩放到指定矩形区域（局部放大）
graph.zoomToRect({
  x: 0,
  y: 0,
  width: 400,
  height: 300,
});
```

## 连线交互配置

```javascript
const graph = new Graph({
  container: 'container',
  connecting: {
    allowBlank: false,          // 禁止连接到空白
    allowLoop: false,           // 禁止自环
    allowNode: false,           // 禁止连接到节点（只能连端口）
    allowEdge: false,           // 禁止连接到边
    allowMulti: true,           // 允许多条边
    highlight: true,            // 拖线时高亮可连接点
    router: 'orth',             // 默认路由器
    connector: 'rounded',       // 默认连接器
    createEdge() {              // 拖线时创建的边样式
      return this.createEdge({
        attrs: {
          line: { stroke: '#1890ff', strokeWidth: 2, targetMarker: 'classic' },
        },
      });
    },
    validateConnection({ sourcePort, targetPort }) {
      return sourcePort !== targetPort;  // 自定义验证逻辑
    },
  },
});
```

## 节点移动限制

```javascript
const graph = new Graph({
  container: 'container',
  translating: {
    restrict: true,   // 限制节点在画布范围内移动
  },
});

// 或自定义限制区域
translating: {
  restrict(cellView) {
    return { x: 0, y: 0, width: 800, height: 600 };
  },
},
```

## 节点嵌入（分组）

```javascript
const graph = new Graph({
  container: 'container',
  embedding: {
    enabled: true,
    findParent: 'bbox',   // 使用包围盒检测父节点
  },
});
```

## 数据操作

### 清空画布

使用 `graph.clearCells()` 清空画布上所有节点和边，常用于重置或重新加载数据。

```javascript
// 清空所有节点和边
graph.clearCells();
```

### 添加节点和边

```javascript
// 添加节点
const node = graph.addNode({
  shape: 'rect',
  x: 60,
  y: 60,
  width: 100,
  height: 40,
  label: 'Node 1',
  attrs: {
    body: { stroke: '#1890ff', fill: '#e6f7ff' },
  },
});

// 添加边（传入节点实例或节点 id）
graph.addEdge({
  source: node1,
  target: node2,
  attrs: {
    line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' },
  },
});
```

### 清空后重新加载数据

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  background: { color: '#F2F7FA' },
});

// 加载初始数据
graph.addNode({ shape: 'rect', x: 60, y: 60, width: 100, height: 40, label: 'Old Node 1' });
graph.addNode({ shape: 'rect', x: 240, y: 60, width: 100, height: 40, label: 'Old Node 2' });

// 清空画布
graph.clearCells();

// 重新加载新数据
const newSource = graph.addNode({
  id: 'newSource',
  shape: 'rect',
  x: 60,
  y: 80,
  width: 100,
  height: 40,
  label: 'New Node A',
  attrs: { body: { stroke: '#52c41a', strokeWidth: 2, fill: '#f6ffed' } },
});

const newTarget = graph.addNode({
  id: 'newTarget',
  shape: 'rect',
  x: 260,
  y: 80,
  width: 100,
  height: 40,
  label: 'New Node B',
  attrs: { body: { stroke: '#52c41a', strokeWidth: 2, fill: '#f6ffed' } },
});

graph.addEdge({
  source: newSource,
  target: newTarget,
  attrs: { line: { stroke: '#52c41a', strokeWidth: 2, targetMarker: 'classic' } },
});
```

## 完整配置示例

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  background: { color: '#F2F7FA' },
  grid: { visible: true, size: 10 },
  panning: true,
  mousewheel: { enabled: true, modifiers: 'ctrl' },
  connecting: {
    allowBlank: false,
    router: 'orth',
    connector: 'rounded',
    createEdge() {
      return this.createEdge({
        attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } },
      });
    },
  },
});

// 注册插件
import { Selection, Snapline, History } from '@antv/x6';
graph.use(new Selection({ enabled: true, rubberband: true }));
graph.use(new Snapline({ enabled: true }));
graph.use(new History({ enabled: true }));
```

## 常见错误与修正

### 1. 遗漏 container 参数

```javascript
// ❌ 错误
const graph = new Graph({ width: 800, height: 600 });

// ✅ 正确
const graph = new Graph({ container: 'container', width: 800, height: 600 });
```

### 2. 清空画布后重新加载数据失败

当需要清空画布并重新加载新数据时，必须显式调用 `graph.clearCells()`，然后继续使用 `graph.addNode()` 和 `graph.addEdge()` 添加新元素。

```javascript
// ❌ 错误：直接覆盖变量而未清空画布，导致旧数据残留
graph.addNode({ shape: 'rect', label: 'Old' });
// 缺少 clearCells()

// ✅ 正确：先清空，再加载
graph.clearCells();
graph.addNode({ shape: 'rect', label: 'New' });
```

### 3. 使用已废弃的独立插件包

X6 3.x 已将所有插件内置，无需安装 `@antv/x6-plugin-xxx` 系列包。

```javascript
// ❌ 错误
import { Snapline } from '@antv/x6-plugin-snapline';

// ✅ 正确：从 @antv/x6 导入并通过 graph.use() 注册
import { Graph, Snapline } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Snapline({ enabled: true }));
```

### 4. 边 source/target 格式错误

```javascript
// ❌ 错误：直接传入未定义的变量
graph.addEdge({ source: 'node1', target: 'node2' }); // 若节点未设置 id 或不存在则报错

// ✅ 正确：传入节点实例或确保 id 已存在
const node1 = graph.addNode({ id: 'n1', shape: 'rect', x: 0, y: 0, width: 100, height: 40 });
const node2 = graph.addNode({ id: 'n2', shape: 'rect', x: 200, y: 0, width: 100, height: 40 });
graph.addEdge({ source: node1, target: node2 });
// 或
graph.addEdge({ source: 'n1', target: 'n2' });
```

### 5. container 使用规范

`container` 变量由运行环境自动注入，**禁止**在代码中声明 `const container = ...`，否则报 `Identifier 'container' has already been declared`。

```javascript
// ✅ 正确：直接使用字符串 'container'
const graph = new Graph({ container: 'container' });

// ❌ 错误：重复声明 container 变量
const container = document.getElementById('container');
const graph = new Graph({ container }); // 报错：Identifier 'container' has already been declared
```

### 6. 初始化后未正确调用画布变换方法

```javascript
// ❌ 错误：未调用 centerContent 或 zoomToFit
const graph = new Graph({ container: 'container' });
graph.addNode(...);
// 缺少居中或缩放调用

// ✅ 正确：初始化后调用变换方法
const graph = new Graph({ container: 'container' });
graph.addNode(...);
graph.zoomToFit();
graph.centerContent();
```

### 7. container 必须有效

```javascript
// ✅ 正确：使用字符串 'container'（运行环境已注入）
const graph = new Graph({ container: 'container' });

// ❌ 错误：传入不存在的元素
const graph = new Graph({ container: document.getElementById('not-exist') }); // 报错
```

### 8. 错误使用 `zoomToFit` 后未调用 `centerContent`

```javascript
// ❌ 错误：仅调用 zoomToFit，未居中内容
graph.zoomToFit();

// ✅ 正确：先缩放再居中
graph.zoomToFit();
graph.centerContent();
```

### 9. 错误使用 `source` 和 `target` 为字符串而非节点实例

```javascript
// ❌ 错误：source 和 target 为字符串，但未确保节点存在
graph.addEdge({ source: 'source', target: 'target' });

// ✅ 正确：传入节点实例或确保节点已存在
const sourceNode = graph.addNode({ id: 'source', shape: 'rect', x: 40, y: 40, width: 100, height: 40 });
const targetNode = graph.addNode({ id: 'target', shape: 'rect', x: 200, y: 200, width: 100, height: 40 });
graph.addEdge({ source: sourceNode, target: targetNode });
// 或
graph.addEdge({ source: 'n1', target: 'n2' });
```

### 10. 错误使用 `router` 和 `connector` 配置

```javascript
// ❌ 错误：router 和 connector 配置不正确
connecting: {
  router: 'manhattan',
  connector: {
    name: 'rounded',
    args: {
      radius: 8,
    },
  },
}

// ✅ 正确：使用标准配置
connecting: {
  router: 'orth',
  connector: 'rounded',
}
```

### 11. container 使用字符串 'container'

```javascript
// ✅ 正确：使用默认的 'container' 字符串
const graph = new Graph({ container: 'container' });

// ❌ 错误：在代码中声明 container 变量（运行环境已注入，重复声明会报错）
const container = document.getElementById('my-container');
const graph = new Graph({ container }); // Identifier 'container' has already been declared
```

### 12. 错误使用 `zoomToFit` 和 `centerContent` 顺序

```javascript
// ❌ 错误：先居中再缩放
graph.centerContent();
graph.zoomToFit();

// ✅ 正确：先缩放再居中
graph.zoomToFit();
graph.centerContent();
```

### 13. 错误使用 `mousewheel` 配置

```javascript
// ❌ 错误：未启用 mousewheel
const graph = new Graph({
  container: 'container',
  mousewheel: {
    enabled: false,
  },
});

// ✅ 正确：启用 mousewheel
const graph = new Graph({
  container: 'container',
  mousewheel: {
    enabled: true,
    modifiers: 'ctrl',
  },
});
```

### 14. 错误使用 `panning` 配置

```javascript
// ❌ 错误：未启用 panning
const graph = new Graph({
  container: 'container',
  panning: false,
});

// ✅ 正确：启用 panning
const graph = new Graph({
  container: 'container',
  panning: true,
});
```

### 15. 错误使用 `background` 配置

```javascript
// ❌ 错误：未设置 background
const graph = new Graph({
  container: 'container',
});

// ✅ 正确：设置 background
const graph = new Graph({
  container: 'container',
  background: {
    color: '#F2F7FA',
  },
});
```

### 16. 错误使用 `grid` 配置

```javascript
// ❌ 错误：未设置 grid
const graph = new Graph({
  container: 'container',
});

// ✅ 正确：设置 grid
const graph = new Graph({
  container: 'container',
  grid: {
    visible: true,
    size: 10,
  },
});
```

### 17. 错误使用 `graph.centerContent()` 和 `graph.zoom()` 时画布为空

```javascript
// ❌ 错误：画布为空时调用 centerContent 和 zoom，导致白屏
const graph = new Graph({ container: 'container' });
graph.centerContent(); // 白屏
graph.zoom(0.8);       // 白屏

// ✅ 正确：添加节点后再调用 centerContent 和 zoom
const graph = new Graph({ container: 'container' });
graph.addNode({ shape: 'rect', x: 50, y: 50, width: 100, height: 40, label: 'Node A' });
graph.centerContent();
graph.zoom(0.8);
```

### 18. 错误使用 `graph.zoom()` 参数

```javascript
// ❌ 错误：使用负数作为 zoom 参数
graph.zoom(-0.2); // 不推荐，可能导致异常行为

// ✅ 正确：使用正数或相对值
graph.zoom(0.8);  // 缩小
graph.zoom(1.2);  // 放大
graph.zoomTo(1.0); // 设置绝对缩放比例
```

### 19. 错误使用 `zoomToRect` 方法

```javascript
// ❌ 错误：语法错误或拼写错误导致渲染失败
graph.zoomToRect({
  x: 0,
  y: 0,
  width: 400,
  height: 300
}); // 注意结尾不能有分号或其他语法错误

// ✅ 正确：使用 zoomToRect 缩放到指定矩形区域
graph.zoomToRect({
  x: 0,
  y: 0,
  width: 400,
  height: 300,
});
```

### 20. 错误使用 `container` 变量（重复声明）

```javascript
// ❌ 错误：在代码中重复声明 container 变量
const container = document.getElementById('my-container');
const graph = new Graph({ container });

// ✅ 正确：使用字符串 'container'
const graph = new Graph({ container: 'container' });
```
