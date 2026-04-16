---
id: "g6-node-circle"
title: "G6 圆形节点（Circle Node）"
description: |
  使用圆形节点（circle）创建图可视化。圆形是最通用的节点形状，
  支持标签、图标、徽标、端口和多种状态。

library: "g6"
version: "5.x"
category: "elements"
subcategory: "nodes"
tags:
  - "节点"
  - "圆形"
  - "circle"
  - "node"
  - "网络图"
  - "社交网络"

related:
  - "g6-node-rect"
  - "g6-node-image"
  - "g6-state-overview"
  - "g6-core-graph-init"

use_cases:
  - "网络拓扑图"
  - "社交关系图"
  - "知识图谱"
  - "通用节点场景"

anti_patterns:
  - "节点数量极多时（>1000）考虑性能优化，避免复杂样式"
  - "需要显示复杂内容时改用 html 或 react 节点"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/element/node/circle"
---

## 核心概念

圆形节点（`circle`）是 G6 默认的节点类型，外形对称，适合表示无方向性的实体。

**主要样式属性：**
- `size`：节点直径（px），默认 32
- `fill`：填充颜色
- `stroke`：边框颜色
- `lineWidth`：边框宽度
- `labelText`：标签文本（回调函数）
- `labelPlacement`：标签位置（`'center'` | `'top'` | `'bottom'` | `'left'` | `'right'`）

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: [
       { id: 'n1', data: { label: '用户A' } },
       { id: 'n2', data: { label: '用户B' } },
       { id: 'n3', data: { label: '用户C' } },
    ],
    edges: [
       { source: 'n1', target: 'n2' },
       { source: 'n2', target: 'n3' },
       { source: 'n1', target: 'n3' },
    ],
  },
  node: {
    type: 'circle',
    style: {
      size: 40,
      fill: '#1783FF',
      stroke: '#fff',
      lineWidth: 2,
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
      labelFill: '#333',
    },
  },
  layout: { type: 'circular' },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```

## 常用变体

### 按类别着色（Palette）

```javascript
node: {
  type: 'circle',
  style: {
    size: 40,
    labelText: (d) => d.data.name,
    labelPlacement: 'bottom',
  },
  palette: {
    type: 'group',
    field: 'category',        // 数据中的分类字段
    color: 'tableau10',       // 内置色板
  },
},
```

### 数值映射节点大小

```javascript
// 使用 transform 映射节点大小
transforms: [
  {
    type: 'map-node-size',
    field: 'value',           // 数据中的数值字段
    range: [20, 80],          // 映射到的尺寸范围
  },
],
node: {
  type: 'circle',
  style: {
    labelText: (d) => d.data.name,
  },
},
```

### 带图标的节点

```javascript
node: {
  type: 'circle',
  style: {
    size: 48,
    fill: '#1783FF',
    // 图标（需要引入 iconfont 或使用 Unicode）
    iconText: '\ue6a7',          // iconfont unicode
    iconFontFamily: 'iconfont',  // 字体名称
    iconFill: '#fff',
    iconFontSize: 20,
    labelText: (d) => d.data.label,
    labelPlacement: 'bottom',
  },
},
```

### 带徽标（Badge）

```javascript
node: {
  type: 'circle',
  style: {
    size: 40,
    fill: '#1783FF',
    labelText: (d) => d.data.label,
    // 徽标配置
    badges: [
      {
        text: '!',
        placement: 'right-top',  // 徽标位置
        fill: '#ff4d4f',
        textFill: '#fff',
        fontSize: 10,
      },
    ],
  },
},
```

### 带端口（Port）

```javascript
// 端口用于精确控制边的连接位置
node: {
  type: 'circle',
  style: {
    size: 40,
    fill: '#1783FF',
    ports: [
       { key: 'top', placement: 'top' },
       { key: 'bottom', placement: 'bottom' },
       { key: 'left', placement: 'left' },
       { key: 'right', placement: 'right' },
    ],
  },
},
```

### 节点状态样式

```javascript
node: {
  type: 'circle',
  style: {
    size: 40,
    fill: '#1783FF',
    labelText: (d) => d.data.label,
  },
  state: {
    selected: {
      fill: '#ff7875',
      stroke: '#ff4d4f',
      lineWidth: 3,
      // 光晕效果
      haloFill: '#ff7875',
      haloLineWidth: 12,
      haloOpacity: 0.25,
    },
    hover: {
      fill: '#40a9ff',
      cursor: 'pointer',
    },
    inactive: {
      opacity: 0.3,
    },
  },
},
// 配合 hover-activate behavior
behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element', 'hover-activate'],
```

## 完整 Style 属性参考

```typescript
// 节点通用样式属性
interface CircleNodeStyle {
  // 形状
  size?: number;                    // 节点大小（直径）
  
  // 填充与描边
  fill?: string;                    // 填充颜色
  fillOpacity?: number;             // 填充透明度 0~1
  stroke?: string;                  // 描边颜色
  lineWidth?: number;               // 描边宽度
  lineDash?: number[];              // 虚线描边 [实线长, 间隔长]
  opacity?: number;                 // 整体透明度 0~1
  
  // 阴影
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  
  // 光晕（hover/select 效果）
  halo?: boolean;                   // 是否显示光晕
  haloFill?: string;
  haloLineWidth?: number;
  haloOpacity?: number;
  
  // 标签
  labelText?: string | ((d: NodeData) => string);
  labelPlacement?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  labelFill?: string;
  labelFontSize?: number;
  labelFontWeight?: string | number;
  labelBackground?: boolean;        // 是否显示标签背景
  labelBackgroundFill?: string;
  labelBackgroundOpacity?: number;
  labelOffsetX?: number;
  labelOffsetY?: number;
  labelMaxWidth?: number;           // 标签最大宽度（超出省略）
  labelWordWrap?: boolean;          // 是否自动换行
  
  // 图标
  iconText?: string;                // 图标文字/unicode
  iconFontFamily?: string;          // 图标字体
  iconFill?: string;
  iconFontSize?: number;
  iconWidth?: number;
  iconHeight?: number;
  
  // 徽标
  badges?: BadgeStyle[];
  
  // 端口
  ports?: PortStyle[];
  
  // 交互
  cursor?: string;                  // 鼠标样式
}
```

## 常见错误

### 错误1：使用 v4 的 label 属性

```javascript
// ❌ 错误：v4 写法
node: {
  labelCfg: {
    style: { fill: '#333', fontSize: 14 }
  }
}

// ✅ 正确：v5 写法
node: {
  style: {
    labelText: (d) => d.data.label,
    labelFill: '#333',
    labelFontSize: 14,
  }
}
```

### 错误2：直接在数据中设置 label 且忘记配置 labelText

```javascript
// ❌ 节点数据中有 label，但忘记在样式中引用
const nodes = [{ id: 'n1', data: { label: '节点1' } }];
// 没有配置 node.style.labelText，节点不会显示标签

// ✅ 正确
node: {
  style: {
    labelText: (d) => d.data.label,  // 从 data 中读取 label
  },
},
```

### 错误3：size 设置了数组但节点类型不支持

```javascript
// ❌ 对 circle 节点设置 [width, height] 数组
node: {
  type: 'circle',
  style: { size: [60, 40] },  // circle 只接受单个数值
}

// ✅ circle 节点使用单个数值
node: {
  type: 'circle',
  style: { size: 60 },
}

// rect 节点可以使用数组
node: {
  type: 'rect',
  style: { size: [120, 60] },  // [宽, 高]
}
```
