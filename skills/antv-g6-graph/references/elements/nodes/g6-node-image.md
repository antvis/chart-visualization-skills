---
id: "g6-node-image"
title: "G6 图片节点（Image Node）"
description: |
  使用图片节点（image）展示头像、图标等图片内容。
  支持圆形裁切、标签、状态等。

library: "g6"
version: "5.x"
category: "elements"
subcategory: "nodes"
tags:
  - "节点"
  - "图片"
  - "image"
  - "头像"
  - "icon"
  - "avatar"

related:
  - "g6-node-circle"
  - "g6-node-rect"
  - "g6-core-data-structure"

use_cases:
  - "用户头像社交关系图"
  - "带 Logo 的企业关系图"
  - "图标化的系统架构图"

anti_patterns:
  - "图片过多时注意性能，避免加载大图"
  - "无网络时图片节点可能显示空白，需要设置兜底样式"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/element/node/image"
---

## 核心概念

图片节点（`image`）将节点渲染为图片，支持 URL 图片、Base64 图片等。

**主要属性：**
- `src`：图片 URL（回调函数从 data 中获取）
- `size`：节点大小
- `labelText`：标签文字

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: [
      {
        id: 'n1',
        data: {
          name: '张三',
          avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
        },
      },
      {
        id: 'n2',
        data: {
          name: '李四',
          avatar: 'https://gw.alipayobjects.com/zos/antfincdn/YXH2wo1%26Kb/Avatar.png',
        },
      },
    ],
    edges: [
       { source: 'n1', target: 'n2' },
    ],
  },
  node: {
    type: 'image',
    style: {
      size: 60,
      src: (d) => d.data.avatar,         // 从 data 中获取图片 URL
      labelText: (d) => d.data.name,
      labelPlacement: 'bottom',
    },
  },
  layout: { type: 'circular' },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```

## 常用变体

### 圆形头像（裁剪为圆形）

```javascript
node: {
  type: 'image',
  style: {
    size: 60,
    src: (d) => d.data.avatar,
    // 圆形裁切：通过设置 clipCfg 实现
    clipType: 'circle',
    clipR: 30,           // 与 size/2 相同
    labelText: (d) => d.data.name,
    labelPlacement: 'bottom',
    stroke: '#91caff',
    lineWidth: 2,
  },
},
```

### 带状态标记的图片节点

```javascript
node: {
  type: 'image',
  style: {
    size: 60,
    src: (d) => d.data.avatar,
    labelText: (d) => d.data.name,
    labelPlacement: 'bottom',
    // 右上角徽标（状态指示器）
    badges: [
      {
        text: (d) => d.data.online ? '●' : '○',
        placement: 'right-bottom',
        fill: (d) => d.data.online ? '#52c41a' : '#d9d9d9',
        textFill: '#fff',
      },
    ],
  },
},
```

### 混合本地与远程图片

```javascript
const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: [
      {
        id: 'github',
        data: {
          name: 'GitHub',
          // 使用在线 icon
          icon: 'https://github.githubassets.com/favicons/favicon.svg',
        },
      },
      {
        id: 'npm',
        data: {
          name: 'NPM',
          icon: 'https://static.npmjs.com/favicon-32x32.png',
        },
      },
    ],
    edges: [{ source: 'github', target: 'npm' }],
  },
  node: {
    type: 'image',
    style: {
      size: 50,
      src: (d) => d.data.icon,
      labelText: (d) => d.data.name,
      labelPlacement: 'bottom',
    },
  },
  layout: { type: 'force', linkDistance: 150 },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});
```

## 常见错误

### 错误1：src 写成静态字符串

```javascript
// ❌ 所有节点显示同一张图片
node: {
  type: 'image',
  style: {
    src: 'https://example.com/avatar.png',  // 静态值，所有节点相同
  },
}

// ✅ 使用回调函数从数据中获取
node: {
  type: 'image',
  style: {
    src: (d) => d.data.avatar,  // 每个节点使用自己的图片
  },
}
```

### 错误2：图片加载失败导致空白

```javascript
// ✅ 提供默认图片兜底
node: {
  type: 'image',
  style: {
    src: (d) => d.data.avatar || 'https://example.com/default-avatar.png',
    size: 60,
  },
},
```
