---
id: "x6-core-port-label-layout"
title: "X6 端口标签布局（Port Label Layout）"
description: |
  X6 连接桩标签的布局策略：side（固定方位）、outside/inside（节点外部/内部）、radial（径向）等，控制端口文字的位置和方向。

library: "x6"
version: "3.x"
category: "core"
subcategory: "port-label-layout"
tags:
  - "port"
  - "label"
  - "port-label-layout"
  - "端口标签"
  - "标签位置"
  - "outside"
  - "inside"
  - "radial"

related:
  - "x6-core-ports"
  - "x6-core-port-layout"
  - "x6-core-node"

use_cases:
  - "端口标签显示在端口左侧/右侧/上方/下方"
  - "端口标签自动朝外显示"
  - "端口标签在节点内部显示"
  - "圆形节点的端口标签径向布局"
  - "自定义端口标签偏移"

difficulty: "intermediate"
completeness: "full"
---

## 概念说明

端口标签布局（Port Label Layout）控制端口文字相对于端口位置的偏移和对齐方式。与端口布局（Port Layout，控制端口在节点上的位置）不同，标签布局只影响文字的显示位置。

## 基本用法

在端口组（groups）中通过 `label.position` 配置：

```javascript
graph.addNode({
  x: 100,
  y: 100,
  width: 160,
  height: 80,
  ports: {
    groups: {
      in: {
        position: 'left',
        label: {
          position: 'left',  // 标签显示在端口左侧
        },
        attrs: { circle: { r: 5, magnet: true, stroke: '#8f8f8f', fill: '#fff' } },
      },
      out: {
        position: 'right',
        label: {
          position: 'right',  // 标签显示在端口右侧
        },
        attrs: { circle: { r: 5, magnet: true, stroke: '#8f8f8f', fill: '#fff' } },
      },
    },
    items: [
      { id: 'in-1', group: 'in', attrs: { text: { text: 'Input' } } },
      { id: 'out-1', group: 'out', attrs: { text: { text: 'Output' } } },
    ],
  },
});
```

## 内置布局策略

### Side 类（固定方位）

| 名称 | 说明 |
|------|------|
| `'left'` | 标签在端口左侧，右对齐 |
| `'right'` | 标签在端口右侧，左对齐 |
| `'top'` | 标签在端口上方，居中对齐 |
| `'bottom'` | 标签在端口下方，居中对齐 |
| `'manual'` | 手动指定位置（通过 args 的 x/y） |

```javascript
label: {
  position: 'right',  // 字符串简写
}

// 等价于对象形式
label: {
  position: {
    name: 'right',
    args: {},  // 可传 x/y/angle/attrs 覆盖默认值
  },
}
```

### InOut 类（节点内外自动判断）

根据端口在节点边缘的位置，自动决定标签朝内还是朝外：

| 名称 | 说明 |
|------|------|
| `'outside'` | 标签在节点外部（远离节点中心方向） |
| `'outsideOriented'` | 同上，且文字自动旋转与边缘平行 |
| `'inside'` | 标签在节点内部（朝向节点中心方向） |
| `'insideOriented'` | 同上，且文字自动旋转与边缘平行 |

```javascript
ports: {
  groups: {
    default: {
      position: 'left',
      label: {
        position: {
          name: 'outside',
          args: { offset: 15 },  // 标签距端口的偏移（像素）
        },
      },
    },
  },
}
```

`outside` 和 `inside` 的判断逻辑：根据端口位置相对于节点中心的角度，自动决定标签放在节点外侧还是内侧。

### Radial 类（径向布局）

适合圆形节点或端口沿圆弧分布的场景：

| 名称 | 说明 |
|------|------|
| `'radial'` | 标签沿径向方向放置（远离节点中心） |
| `'radialOriented'` | 同上，且文字自动旋转为径向方向 |

```javascript
ports: {
  groups: {
    default: {
      position: {
        name: 'ellipse',  // 端口沿椭圆分布
        args: { dr: 0, compensateRotate: false },
      },
      label: {
        position: {
          name: 'radial',
          args: { offset: 20 },  // 标签距端口的径向偏移
        },
      },
    },
  },
}
```

## 配置参数

所有布局策略都支持以下通用参数：

| 参数 | 类型 | 说明 |
|------|------|------|
| `x` | number | 覆盖标签 x 偏移 |
| `y` | number | 覆盖标签 y 偏移 |
| `angle` | number | 标签旋转角度 |
| `attrs` | object | 覆盖标签的 SVG 属性 |

InOut 和 Radial 额外支持：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `offset` | number | `15`/`20` | 标签距端口的偏移距离 |

## 完整示例：输入输出端口

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});

graph.addNode({
  x: 200,
  y: 150,
  width: 200,
  height: 100,
  label: 'Process',
  ports: {
    groups: {
      in: {
        position: 'left',
        label: { position: 'outside' },
        attrs: {
          circle: { r: 5, magnet: true, stroke: '#31d0c6', fill: '#fff', strokeWidth: 2 },
        },
      },
      out: {
        position: 'right',
        label: { position: 'outside' },
        attrs: {
          circle: { r: 5, magnet: true, stroke: '#ff6347', fill: '#fff', strokeWidth: 2 },
        },
      },
    },
    items: [
      { id: 'in-1', group: 'in', attrs: { text: { text: 'data' } } },
      { id: 'in-2', group: 'in', attrs: { text: { text: 'config' } } },
      { id: 'out-1', group: 'out', attrs: { text: { text: 'result' } } },
      { id: 'out-2', group: 'out', attrs: { text: { text: 'error' } } },
    ],
  },
});
```

## 手动定位标签

使用 `manual` 策略完全控制标签位置：

```javascript
label: {
  position: {
    name: 'manual',
    args: {
      x: 10,
      y: -10,
      angle: 0,
      attrs: {
        '.': { 'text-anchor': 'start', fontSize: 12, fill: '#666' },
      },
    },
  },
}
```

## 常见错误

### ❌ 混淆端口布局（position）和标签布局（label.position）

```javascript
// 错误理解：label.position 不是控制端口在节点上的位置
ports: {
  groups: {
    in: {
      position: 'left',         // 端口在节点左侧 ← 端口布局
      label: {
        position: 'left',       // 标签在端口左侧 ← 标签布局（不同概念！）
      },
    },
  },
}
```

### ❌ 标签不显示

```javascript
// 错误：端口 items 缺少 text 属性
items: [{ id: 'p1', group: 'in' }]  // ❌ 标签无内容

// 正确：通过 attrs.text.text 设置标签文字
items: [{ id: 'p1', group: 'in', attrs: { text: { text: 'Port 1' } } }]  // ✅
```
