---
id: "g6-plugin-edge-bundling-bubble"
title: "G6 边绑定插件 + 气泡集插件（edge-bundling / bubble-sets）"
description: |
  edge-bundling：将相邻边捆绑在一起，减少视觉混乱，揭示高层次结构。
  bubble-sets：用气泡形状圈定节点集合，直观表达集合间的关系（交集、分组等）。

library: "g6"
version: "5.x"
category: "plugins"
subcategory: "advanced"
tags:
  - "edge-bundling"
  - "bubble-sets"
  - "边绑定"
  - "气泡集"
  - "集合关系"
  - "节点分组"

related:
  - "g6-plugin-fisheye-hull-watermark"
  - "g6-layout-circular"
  - "g6-layout-force"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-16"
updated: "2026-04-16"
---

## 边绑定（edge-bundling）

将图中相似方向的边捆绑在一起，减少大规模图中的边交叉与视觉混乱，同时揭示高层次连接模式。基于 FEDB（Force-Directed Edge Bundling）算法。

```javascript
import { Graph } from '@antv/g6';

// 边绑定最适合配合环形布局使用
fetch('https://assets.antv.antgroup.com/g6/circular.json')
  .then((res) => res.json())
  .then((data) => {
    const graph = new Graph({
      container: 'container',
      width: 800,
      height: 600,
      autoFit: 'view',
      data,
      layout: { type: 'circular' },
      node: { style: { size: 20 } },
      behaviors: ['drag-canvas', 'drag-element'],
      plugins: [
        {
          type: 'edge-bundling',
          key: 'bundling',
          bundleThreshold: 0.6,  // 边兼容性阈值（0-1，越大越少被绑定）
          K: 0.1,                // 边强度（吸引力）
        },
      ],
    });

    graph.render();
  });
```

### edge-bundling 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `string` | `'edge-bundling'` | 插件类型 |
| `key` | `string` | — | 唯一标识，用于动态更新 |
| `bundleThreshold` | `number` | `0.6` | 边兼容性阈值：值越大绑定的边越少；0.4 绑定效果明显，0.8 较少绑定 |
| `cycles` | `number` | `6` | 模拟周期数，影响计算质量 |
| `divisions` | `number` | `1` | 初始切割点数，影响边的细分程度 |
| `divRate` | `number` | `2` | 切割点增长率 |
| `iterations` | `number` | `90` | 第一个周期的迭代次数 |
| `iterRate` | `number` | `2/3` | 迭代次数递减率 |
| `K` | `number` | `0.1` | 边强度（吸引力/排斥力）：0.05 弱，0.2 强 |
| `lambda` | `number` | `0.1` | 初始步长 |

```javascript
// 简写形式（使用默认配置）
plugins: ['edge-bundling']

// 自定义配置
plugins: [
  {
    type: 'edge-bundling',
    bundleThreshold: 0.1,   // 低阈值 = 更多边被绑定
    cycles: 8,
    K: 0.2,
  },
]

// 动态更新
graph.updatePlugin({ key: 'bundling', bundleThreshold: 0.8 });
```

---

## 气泡集（bubble-sets）

用有机气泡轮廓圈定指定的节点集合，可用于表达节点分组、集合交叉等关系。支持多个气泡实例并列显示。

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [
      { id: 'n0', data: { cluster: 'a' }, style: { x: 200, y: 150 } },
      { id: 'n1',  { cluster: 'a' }, style: { x: 300, y: 200 } },
      { id: 'n2', data: { cluster: 'a' }, style: { x: 250, y: 300 } },
      { id: 'n3', data: { cluster: 'b' }, style: { x: 500, y: 150 } },
      { id: 'n4',  { cluster: 'b' }, style: { x: 550, y: 280 } },
    ],
    edges: [
      { source: 'n0', target: 'n1' },
      { source: 'n1', target: 'n2' },
      { source: 'n2', target: 'n3' },
      { source: 'n3', target: 'n4' },
    ],
  },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
  plugins: [
    {
      type: 'bubble-sets',
      key: 'bubble-a',
      members: ['n0', 'n1', 'n2'],   // 必填：要圈定的节点 ID
      fill: '#1783FF',
      fillOpacity: 0.1,
      stroke: '#1783FF',
      label: true,
      labelText: 'Group A',
    },
    {
      type: 'bubble-sets',
      key: 'bubble-b',
      members: ['n3', 'n4'],
      fill: '#F08F56',
      fillOpacity: 0.1,
      stroke: '#F08F56',
      label: true,
      labelText: 'Group B',
    },
  ],
});

graph.render();
```

### bubble-sets 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `string` | `'bubble-sets'` | 插件类型 |
| `key` | `string` | — | 唯一标识（多实例时必填） |
| `members` | `string[]` | — | **必填**：要包裹的节点/边 ID 列表 |
| `avoidMembers` | `string[]` | — | 轮廓要避开的节点 ID |
| `fill` | `string` | — | 气泡填充颜色 |
| `fillOpacity` | `number` | — | 填充透明度（建议 0.05-0.2） |
| `stroke` | `string` | — | 边框颜色 |
| `strokeOpacity` | `number` | — | 边框透明度 |
| `label` | `boolean` | `true` | 是否显示标签 |
| `labelText` | `string` | — | 标签文字内容 |
| `labelPlacement` | `string` | `'bottom'` | 标签位置：`left/right/top/bottom/center` |
| `labelBackground` | `boolean` | `false` | 是否显示标签背景 |
| `labelPadding` | `number \| number[]` | `0` | 标签内边距 |
| `labelCloseToPath` | `boolean` | `true` | 标签是否贴合轮廓 |
| `labelAutoRotate` | `boolean` | `true` | 标签是否跟随轮廓旋转 |

### 动态更新气泡集成员

```javascript
// 初始化后更新 members
graph.updatePlugin({
  key: 'bubble-a',
  members: ['n0', 'n1', 'n2', 'n3'],  // 增加 n3 到 Group A
});
```

### 按数据字段自动分组的模式

```javascript
// 渲染后，按 cluster 字段自动构建气泡集
graph.render().then(() => {
  const nodesByCluster = {};
  graph.getNodeData().forEach((node) => {
    const cluster = node.data.cluster;
    nodesByCluster[cluster] = nodesByCluster[cluster] || [];
    nodesByCluster[cluster].push(node.id);
  });

  const colors = { a: '#1783FF', b: '#F08F56', c: '#52C41A' };
  const plugins = Object.entries(nodesByCluster).map(([cluster, ids]) => ({
    type: 'bubble-sets',
    key: `bubble-${cluster}`,
    members: ids,
    fill: colors[cluster] || '#ccc',
    fillOpacity: 0.1,
    stroke: colors[cluster] || '#ccc',
    labelText: `cluster-${cluster}`,
    labelBackground: true,
    labelPadding: 4,
  }));

  graph.setPlugins(plugins);
  graph.draw();
});
```
