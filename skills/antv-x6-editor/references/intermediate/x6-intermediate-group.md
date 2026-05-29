---
id: "x6-intermediate-group"
title: "X6 群组与嵌套"
description: |
  X6 节点的父子关系（Group）配置指南。
  包含组合节点、交互式嵌入、子节点移动限制、父节点自动扩展、展开/折叠。

library: "x6"
version: "3.x"
category: "intermediate"
subcategory: "group"
tags:
  - "群组"
  - "group"
  - "嵌套"
  - "parent"
  - "children"
  - "embedding"
  - "组合"
  - "折叠"
  - "collapse"
  - "expand"
  - "分组"
  - "restrict"
  - "translating"

related:
  - "x6-core-node"
  - "x6-core-graph-init"
  - "x6-core-events"

use_cases:
  - "将多个节点组合为一个群组"
  - "拖拽节点嵌入另一个节点形成父子关系"
  - "限制子节点只能在父节点内移动"
  - "父节点自动扩展包围子节点"
  - "实现父节点的展开与折叠"

anti_patterns:
  - "不要手动设置 parent/children 字段，应通过 API 操作"
  - "不要忘记开启 embedding 选项才能交互式嵌入"
---

# X6 群组与嵌套

## 基本概念

X6 通过父子关系（parent-children）实现群组功能。父节点移动时子节点跟随，边的路径点也会跟随共同父节点移动。

## 通过 API 组合节点

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});

// 创建父节点
const parent = graph.addNode({
  shape: 'rect',
  x: 40,
  y: 40,
  width: 360,
  height: 200,
  label: 'Parent',
  attrs: {
    body: { fill: '#f5f5f5', stroke: '#d9d9d9', strokeWidth: 1 },
  },
  zIndex: 1,
});

// 创建子节点
const child1 = graph.addNode({
  shape: 'rect',
  x: 80,
  y: 80,
  width: 100,
  height: 40,
  label: 'Child 1',
  attrs: {
    body: { fill: '#fff', stroke: '#8f8f8f', strokeWidth: 1, rx: 6, ry: 6 },
  },
  zIndex: 2,
});

const child2 = graph.addNode({
  shape: 'rect',
  x: 240,
  y: 140,
  width: 100,
  height: 40,
  label: 'Child 2',
  attrs: {
    body: { fill: '#fff', stroke: '#8f8f8f', strokeWidth: 1, rx: 6, ry: 6 },
  },
  zIndex: 2,
});

// 设置父子关系
parent.addChild(child1);
parent.addChild(child2);
```

## 父子关系 API

```javascript
// 添加子节点
parent.addChild(childNode);

// 获取子节点
const children = parent.getChildren(); // Cell[] | null

// 获取父节点
const parentNode = child.getParent(); // Cell | null

// 判断关系
parent.isParentOf(child);  // true
child.isChildOf(parent);   // true

// 获取所有后代节点（递归）
const descendants = parent.getDescendants();

// 移除子节点（不删除节点本身）
parent.removeChild(child);

// 嵌入边（将边设为子节点）
parent.addChild(edge);
```

## 交互式嵌入（Embedding）

通过拖拽将一个节点嵌入另一个节点成为子节点：

```javascript
const graph = new Graph({
  container: 'container',
  embedding: {
    enabled: true,
    // 查找父节点的方法：拖拽节点时遍历画布中的节点，返回的节点为目标父节点
    findParent({ node }) {
      const bbox = node.getBBox();
      return this.getNodes().filter((candidate) => {
        const targetBBox = candidate.getBBox();
        return bbox.isIntersectWithRect(targetBBox);
      });
    },
  },
});
```

### embedding 配置项

| 配置项 | 类型 | 说明 |
|--------|------|------|
| `enabled` | boolean | 是否启用嵌入 |
| `findParent` | Function | 查找父节点的方法，返回节点数组 |
| `validate` | Function | 验证是否允许嵌入 |

## 限制子节点移动范围

将子节点的移动限制在父节点内部：

```javascript
const graph = new Graph({
  container: 'container',
  translating: {
    restrict(cellView) {
      const cell = cellView.cell;
      const parentNode = cell.getParent();
      if (parentNode) {
        return parentNode.getBBox();
      }
      return undefined; // 不限制
    },
  },
});
```

## 自动扩展父节点

监听子节点移动事件，自动扩展父节点使其始终包围子节点：

```javascript
graph.on('node:change:position', ({ node, options }) => {
  if (options.skipParentHandler) return;

  const parentNode = node.getParent();
  if (parentNode) {
    let originSize = parentNode.prop('originSize');
    let originPosition = parentNode.prop('originPosition');
    if (!originSize || !originPosition) {
      originSize = parentNode.getSize();
      originPosition = parentNode.getPosition();
      parentNode.prop('originSize', originSize);
      parentNode.prop('originPosition', originPosition);
    }

    const children = parentNode.getChildren();
    if (children && children.length) {
      // 计算所有子节点的包围盒
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      children.filter(child => child.isNode()).forEach((child) => {
        const bbox = child.getBBox();
        minX = Math.min(minX, bbox.x);
        minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        maxY = Math.max(maxY, bbox.y + bbox.height);
      });

      const padding = 20;
      parentNode.prop(
        {
          position: { x: minX - padding, y: minY - padding },
          size: { width: maxX - minX + 2 * padding, height: maxY - minY + 2 * padding },
        },
        { skipParentHandler: true },
      );
    }
  }
});
```

## 展开与折叠父节点

通过自定义节点实现可折叠的群组：

```javascript
import { Graph } from '@antv/x6';

// 注册可折叠的群组节点
Graph.registerNode(
  'collapsible-group',
  {
    inherit: 'rect',
    width: 200,
    height: 120,
    attrs: {
      body: { fill: '#f5f5f5', stroke: '#d9d9d9', strokeWidth: 1 },
      label: { refX: 10, refY: 10, textAnchor: 'start', textVerticalAnchor: 'top', fontSize: 14 },
    },
  },
  true,
);

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});

const group = graph.addNode({
  shape: 'collapsible-group',
  x: 40,
  y: 40,
  label: 'Group',
});

const child = graph.addNode({
  shape: 'rect',
  x: 60,
  y: 80,
  width: 100,
  height: 40,
  label: 'Child',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', strokeWidth: 1, rx: 6, ry: 6 } },
});

group.addChild(child);

// 切换折叠状态
function toggleCollapse(groupNode, collapsed) {
  const children = groupNode.getDescendants();
  children.forEach((cell) => {
    if (collapsed) {
      cell.hide();
    } else {
      cell.show();
    }
  });
  // 调整父节点大小
  if (collapsed) {
    groupNode.prop('expandedSize', groupNode.getSize());
    groupNode.resize(200, 40);
  } else {
    const size = groupNode.prop('expandedSize');
    if (size) {
      groupNode.resize(size.width, size.height);
    }
  }
}

// 双击切换折叠
graph.on('node:dblclick', ({ node }) => {
  if (node === group) {
    const isCollapsed = node.prop('collapsed') || false;
    node.prop('collapsed', !isCollapsed);
    toggleCollapse(node, !isCollapsed);
  }
});
```

## 可折叠带按钮的群组节点

下面是一个更完整的示例，展示如何创建一个带有折叠按钮的群组节点：

```javascript
import { Graph } from '@antv/x6';

// 注册可折叠群组节点
Graph.registerNode(
  'collapsable-group',
  {
    inherit: 'rect',
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'text', selector: 'label' },
      {
        tagName: 'g',
        selector: 'buttonGroup',
        children: [
          { tagName: 'rect', selector: 'button', attrs: { width: 16, height: 16, rx: 2, ry: 2 } },
          { tagName: 'text', selector: 'buttonSign', attrs: { x: 8, y: 12, textAnchor: 'middle', fontSize: 12 } },
        ],
      },
    ],
    attrs: {
      body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#e6f7ff', rx: 6, ry: 6 },
      label: { refY: 14, textAnchor: 'middle', textVerticalAnchor: 'top', fontSize: 13 },
      button: { fill: '#fff', stroke: '#8f8f8f', cursor: 'pointer', refX: 8, refY: 8 },
      buttonSign: { fill: '#333', cursor: 'pointer' },
    },
  },
  true,
);

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  background: { color: '#F2F7FA' },
});

const group = graph.addNode({
  shape: 'collapsable-group',
  x: 60,
  y: 40,
  width: 300,
  height: 200,
  label: 'Group (Click to collapse)',
  attrs: {
    buttonSign: { text: '-' },
  },
});

const child1 = graph.addNode({
  shape: 'rect',
  x: 100,
  y: 100,
  width: 80,
  height: 40,
  label: 'Task A',
  attrs: {
    body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
  },
});

const child2 = graph.addNode({
  shape: 'rect',
  x: 240,
  y: 100,
  width: 80,
  height: 40,
  label: 'Task B',
  attrs: {
    body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
  },
});

group.addChild(child1);
group.addChild(child2);

graph.addEdge({
  source: child1,
  target: child2,
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1 } },
});

let collapsed = false;
graph.on('node:click', ({ node }) => {
  if (node === group) {
    collapsed = !collapsed;
    const children = group.getChildren();
    if (children) {
      children.forEach((child) => {
        collapsed ? child.hide() : child.show();
      });
    }
    node.attr('buttonSign/text', collapsed ? '+' : '-');
    if (collapsed) {
      node.resize(300, 50);
    } else {
      node.resize(300, 200);
    }
  }
});
```

## 常见错误与修正

### ❌ 未启用 embedding 就尝试拖拽嵌入

```javascript
// 错误：没有配置 embedding，拖拽不会触发嵌入
const graph = new Graph({ container: 'container' });

// 正确：必须启用 embedding
const graph = new Graph({
  container: 'container',
  embedding: { enabled: true },
});
```

### ❌ 手动设置 parent/children 字段

```javascript
// 错误：直接操作内部字段
node.prop('parent', parentId);

// 正确：使用 API
parentNode.addChild(childNode);
```

### ❌ 错误使用 Shape.Group.define 或不存在的 API

```javascript
// 错误：使用了不存在的 API
Shape.Group.define('collapsable-group', { ... });

// 正确：使用 Graph.registerNode 注册自定义节点
Graph.registerNode('collapsable-group', { ... }, true);
```

### ❌ 错误处理折叠逻辑，未正确更新按钮状态和尺寸

```javascript
// 错误：没有正确更新按钮文本和节点尺寸
graph.on('node:click', ({ node }) => {
  if (node.shape === 'collapsable-group') {
    const collapsed = !node.prop('collapsed');
    node.prop('collapsed', collapsed);
    
    if (collapsed) {
      node.getChildren().forEach((child) => child.hide());
    } else {
      node.getChildren().forEach((child) => child.show());
    }
  }
});

// 正确：完整处理折叠状态、按钮文本和节点尺寸
let collapsed = false;
graph.on('node:click', ({ node }) => {
  if (node === group) {
    collapsed = !collapsed;
    const children = group.getChildren();
    if (children) {
      children.forEach((child) => {
        collapsed ? child.hide() : child.show();
      });
    }
    node.attr('buttonSign/text', collapsed ? '+' : '-');
    if (collapsed) {
      node.resize(300, 50);
    } else {
      node.resize(300, 200);
    }
  }
});
```

</skill>