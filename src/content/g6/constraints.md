---
id: "g6-constraints"
title: "G6 v5 核心约束（必须遵守）"
description: "G6 v5 必须遵守的核心约束规则，包括初始化规范、数据结构、节点/边样式、布局、交互行为、插件等强制规范"
library: "g6"
version: "5.x"
category: "__constraints__"
tags:
  - "constraints"
  - "核心约束"
  - "MUST"
use_cases: []
anti_patterns: []
---

## 核心约束（必须遵守）

### 初始化规范
- `container` 参数必填，传入 DOM 元素 ID 字符串或 DOM 元素对象
- 使用 `new Graph({...})` 构造函数，**不得使用** `new G6.Graph()` (v4 写法)
- 所有配置在构造函数中一次性完成，不得事后多次调用配置方法覆盖
- `graph.render()` 返回 Promise，异步渲染；若需等待完成请 `await graph.render()`

### 数据结构规范
- 数据格式：`{ nodes: [...], edges: [...], combos?: [...] }`
- 每个节点必须有唯一 `id`（字符串）；业务数据放在 `data` 字段
- 边必须有 `source` 和 `target`，值为节点 `id`
- **禁止**使用 v4 的 `graph.data()` 方法传数据

### 节点/边样式规范
- 样式通过 `node.style` / `edge.style` 配置，支持静态值和回调函数
- 回调函数签名：`(datum: NodeData | EdgeData) => value`
- 标签文本通过 `style.labelText` 设置（**不是** `label` 或 `labelCfg`）
- 节点大小通过 `style.size` 设置（单个数值或 [width, height] 数组）

### 布局规范
- `layout` 配置放在 Graph 选项中：`{ type: 'force', ... }`
- `force` 布局**不支持** `preventOverlap` / `nodeSize`（G6 v4 参数，v5 静默忽略）；防重叠请改用 `d3-force` + `collide`
- 树形布局（mindmap, compact-box, dendrogram, indented）需要树形数据或 `treeToGraphData()` 转换
- 力导向布局异步运行，`graph.render()` 后会持续迭代
- **`nodeStrength` 必须为非负数**（≥ 0），负值会导致布局计算异常或节点行为不可预测

### 交互行为规范
- `behaviors` 为字符串数组或配置对象数组
- 常用行为字符串简写：`'drag-canvas'`, `'zoom-canvas'`, `'drag-element'`, `'click-select'`
- G6 v5 **移除了 Mode（模式）概念**，所有 behavior 直接在数组中配置
- 复杂配置使用对象形式：`{ type: 'click-select', multiple: true }`

### 插件规范
- `plugins` 为数组，与 `behaviors` 类似
- 简写：`'minimap'`, `'grid-line'`, `'tooltip'`
- 复杂配置：`{ type: 'tooltip', getContent: (e, items) => '...' }`

---