---
id: "g6-layout-grid"
title: "G6 网格布局（Grid Layout）"
description: |
  使用网格布局（grid）将节点规则地排列在矩形网格中。
  适合节点数量较多且无明显层次或关系的场景。

library: "g6"
version: "5.x"
category: "layouts"
subcategory: "grid"
tags:
  - "布局"
  - "网格"
  - "grid"
  - "矩阵"
  - "规则排列"

related:
  - "g6-layout-force"
  - "g6-layout-circular"

use_cases:
  - "节点列表展示"
  - "无明显拓扑关系的节点集合"
  - "调试和演示用途"

anti_patterns:
  - "有明显拓扑关系时改用 force 或 dagre"
  - "节点数量少时间距过大，不够紧凑"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/layout/grid"
---

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const nodes = Array.from({ length: 12 }, (_, i) => ({
  id: `n${i}`,
  data: { label: `节点${i + 1}`, value: Math.random() * 100 },
}));

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 500,
  data: { nodes, edges: [] },
  node: {
    type: 'circle',
    style: {
      size: 40,
      fill: '#1783FF',
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
    },
  },
  layout: {
    type: 'grid',
    rows: 3,              // 行数
    cols: 4,              // 列数（可选，自动计算）
    rowGap: 40,           // 行间距
    colGap: 40,           // 列间距
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

## 参数参考

```typescript
interface GridLayoutOptions {
  rows?: number;           // 行数
  cols?: number;           // 列数
  rowGap?: number;         // 行间距
  colGap?: number;         // 列间距
  sortBy?: string;         // 按某字段排序
  preventOverlap?: boolean;
  nodeSize?: number | [number, number];
  workerEnabled?: boolean;
}
```
