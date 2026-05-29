---
id: "x6-core-port-layout"
title: "X6 连接桩布局（Port Layout）"
description: |
  连接桩在节点上的位置布局策略和标签布局策略。
  port layout 控制端口在节点边界上的分布位置，port label layout 控制端口标签的显示位置和方向。

library: "x6"
version: "3.x"
category: "core"
subcategory: "port-layout"
tags:
  - "port"
  - "layout"
  - "连接桩布局"
  - "端口位置"
  - "top"
  - "bottom"
  - "left"
  - "right"
  - "absolute"
  - "ellipse"
  - "line"
  - "label"

related:
  - "x6-core-ports"
  - "x6-core-node"
  - "x6-core-edge"

use_cases:
  - "控制连接桩在节点四边的分布"
  - "自定义连接桩的绝对位置"
  - "椭圆形分布端口"
  - "控制端口标签的位置和方向"

difficulty: "intermediate"
completeness: "full"
---

## 核心概念

X6 中端口的布局分为两层：

- **Port Layout（端口位置布局）**：决定端口在节点 BBox 上的坐标位置
- **Port Label Layout（端口标签布局）**：决定端口标签相对于端口的位置、角度和文字锚点

两者通过端口组（group）的 `position` 和 `label.position` 字段配置。

## 端口位置布局（Port Layout）

### 配置方式

在节点的 `ports.groups` 中通过 `position` 字段设置：

```javascript
graph.addNode({
  shape: 'rect',
  x: 100,
  y: 100,
  width: 120,
  height: 60,
  ports: {
    groups: {
      in: {
        position: 'left',  // 字符串简写
        attrs: { circle: { r: 5, magnet: true, stroke: '#8f8f8f', fill: '#fff' } },
      },
      out: {
        position: { name: 'right', args: { strict: true } },  // 对象格式带参数
        attrs: { circle: { r: 5, magnet: true, stroke: '#8f8f8f', fill: '#fff' } },
      },
    },
    items: [
      { id: 'in1', group: 'in' },
      { id: 'in2', group: 'in' },
      { id: 'out1', group: 'out' },
    ],
  },
});
```

### 内置端口位置布局

| 名称 | 说明 |
|------|------|
| `'left'` | 沿节点左边均匀分布 |
| `'right'` | 沿节点右边均匀分布 |
| `'top'` | 沿节点顶边均匀分布 |
| `'bottom'` | 沿节点底边均匀分布 |
| `'line'` | 沿自定义线段均匀分布 |
| `'absolute'` | 每个端口独立指定绝对坐标 |
| `'ellipse'` | 沿椭圆弧分布 |
| `'ellipseSpread'` | 沿椭圆均匀展开分布 |

### left / right / top / bottom 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `strict` | `boolean` | `false` | 是否严格等间距。`false`：端口占据中间区域均匀分布；`true`：包含两端边距的等间距分布 |
| `dx` | `number` | `0` | 每个端口的 X 偏移 |
| `dy` | `number` | `0` | 每个端口的 Y 偏移 |

**strict 的区别**：
- `strict: false`（默认）：N 个端口将边分成 N 等份，端口在每个等份的中点。例如 2 个端口在 1/4 和 3/4 位置。
- `strict: true`：N 个端口将边分成 N+1 等份，端口在等分点上。例如 2 个端口在 1/3 和 2/3 位置。

### line 参数

沿自定义线段分布端口。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `start` | `{ x, y }` | 节点左上角 | 线段起点（相对于节点 BBox） |
| `end` | `{ x, y }` | 节点右下角 | 线段终点（相对于节点 BBox） |
| `strict` | `boolean` | `false` | 是否严格等间距 |
| `dx` | `number` | `0` | X 偏移 |
| `dy` | `number` | `0` | Y 偏移 |

### absolute 参数

每个端口独立指定位置。通过端口 items 中每个端口的 `args` 设置：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `x` | `number \| string` | `0` | X 坐标，支持百分比如 `'50%'` |
| `y` | `number \| string` | `0` | Y 坐标，支持百分比如 `'50%'` |
| `angle` | `number` | `0` | 旋转角度 |

### ellipse / ellipseSpread 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `start` | `number` | `0` | 起始角度（度数） |
| `step` | `number` | `20`（ellipse）/ `360/N`（ellipseSpread） | 角度步长 |
| `compensateRotate` | `boolean` | `false` | 是否补偿旋转角度，使端口始终朝外 |
| `dr` | `number` | `0` | 径向偏移（正值向外，负值向内） |
| `dx` | `number` | `0` | X 偏移 |
| `dy` | `number` | `0` | Y 偏移 |

**ellipse vs ellipseSpread**：
- `ellipse`：端口以 `start` 为中心，向两侧按 `step` 角度展开
- `ellipseSpread`：端口沿椭圆均匀分布，步长自动计算为 `360/N`

## 端口标签布局（Port Label Layout）

### 配置方式

在端口组的 `label.position` 中设置：

```javascript
ports: {
  groups: {
    in: {
      position: 'left',
      label: {
        position: 'left',  // 标签显示在端口左侧
      },
      attrs: { circle: { r: 5, magnet: true, stroke: '#8f8f8f', fill: '#fff' } },
    },
  },
}
```

### 内置标签布局

| 名称 | 说明 |
|------|------|
| `'left'` | 标签在端口左侧，右对齐 |
| `'right'` | 标签在端口右侧，左对齐 |
| `'top'` | 标签在端口上方，居中 |
| `'bottom'` | 标签在端口下方，居中 |
| `'outside'` | 标签在端口外侧（相对于节点中心） |
| `'outsideOriented'` | 同 outside，但文字方向跟随角度 |
| `'inside'` | 标签在端口内侧（靠近节点中心） |
| `'insideOriented'` | 同 inside，但文字方向跟随角度 |
| `'radial'` | 径向布局，标签沿径向向外偏移 |
| `'radialOriented'` | 同 radial，但文字方向跟随径向角度 |
| `'manual'` | 手动指定位置 |

### outside / inside 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `offset` | `number` | `15` | 标签与端口的距离 |

### radial 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `offset` | `number` | `20` | 标签沿径向的偏移距离 |

## 完整示例

### 四边端口（最常用）

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  connecting: { allowBlank: false, router: 'orth', connector: 'rounded' },
});

graph.addNode({
  shape: 'rect',
  x: 200,
  y: 150,
  width: 160,
  height: 80,
  label: '处理节点',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 6, ry: 6 } },
  ports: {
    groups: {
      in: {
        position: 'left',
        label: { position: 'left' },
        attrs: { circle: { r: 5, magnet: true, stroke: '#1890ff', fill: '#fff' } },
      },
      out: {
        position: 'right',
        label: { position: 'right' },
        attrs: { circle: { r: 5, magnet: true, stroke: '#52c41a', fill: '#fff' } },
      },
    },
    items: [
      { id: 'in1', group: 'in', attrs: { text: { text: '输入1' } } },
      { id: 'in2', group: 'in', attrs: { text: { text: '输入2' } } },
      { id: 'out1', group: 'out', attrs: { text: { text: '输出' } } },
    ],
  },
});
```

### 绝对定位端口

```javascript
graph.addNode({
  shape: 'rect',
  x: 100,
  y: 100,
  width: 160,
  height: 80,
  label: '自定义端口位置',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', rx: 6, ry: 6 } },
  ports: {
    groups: {
      custom: {
        position: 'absolute',
        attrs: { circle: { r: 5, magnet: true, stroke: '#8f8f8f', fill: '#fff' } },
      },
    },
    items: [
      { id: 'p1', group: 'custom', args: { x: 0, y: '25%' } },
      { id: 'p2', group: 'custom', args: { x: '100%', y: '25%' } },
      { id: 'p3', group: 'custom', args: { x: '50%', y: '100%' } },
    ],
  },
});
```

### 椭圆分布端口

```javascript
graph.addNode({
  shape: 'ellipse',
  x: 200,
  y: 150,
  width: 120,
  height: 120,
  label: '服务',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f' } },
  ports: {
    groups: {
      around: {
        position: { name: 'ellipseSpread', args: { start: 0 } },
        label: { position: 'outside' },
        attrs: { circle: { r: 4, magnet: true, stroke: '#8f8f8f', fill: '#fff' } },
      },
    },
    items: [
      { id: 'p1', group: 'around', attrs: { text: { text: 'API' } } },
      { id: 'p2', group: 'around', attrs: { text: { text: 'DB' } } },
      { id: 'p3', group: 'around', attrs: { text: { text: 'MQ' } } },
      { id: 'p4', group: 'around', attrs: { text: { text: 'RPC' } } },
    ],
  },
});
```

### strict 模式对比

```javascript
// 2 个端口在左边：
// strict: false → 位于 1/4 和 3/4 处（默认，视觉上更居中）
// strict: true  → 位于 1/3 和 2/3 处（等间距，含两端间距）

graph.addNode({
  shape: 'rect',
  x: 100, y: 100, width: 120, height: 80,
  ports: {
    groups: {
      left: {
        position: { name: 'left', args: { strict: true } },
        attrs: { circle: { r: 5, magnet: true, stroke: '#8f8f8f', fill: '#fff' } },
      },
    },
    items: [
      { id: 'p1', group: 'left' },
      { id: 'p2', group: 'left' },
    ],
  },
});
```

## 常见错误

### ❌ 混淆 port layout 和 port label layout

```javascript
// 错误：position 是端口位置布局，不是标签位置
ports: {
  groups: {
    in: {
      position: 'outside', // ❌ 'outside' 是标签布局，不是端口位置布局
    },
  },
}

// 正确
ports: {
  groups: {
    in: {
      position: 'left',               // ✅ 端口位置布局
      label: { position: 'outside' }, // ✅ 标签布局
    },
  },
}
```

### ❌ absolute 布局忘记在 items 中传 args

```javascript
// 错误：absolute 需要每个 item 指定位置
ports: {
  groups: { custom: { position: 'absolute' } },
  items: [
    { id: 'p1', group: 'custom' }, // ❌ 缺少 args，默认 (0,0)
  ],
}

// 正确
ports: {
  groups: { custom: { position: 'absolute' } },
  items: [
    { id: 'p1', group: 'custom', args: { x: '50%', y: 0 } }, // ✅
  ],
}
```
