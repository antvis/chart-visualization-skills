---
id: "x6-pattern-org-chart"
title: "X6 组织架构图"
description: |
  使用 X6 构建组织架构图（Org Chart）的最佳实践：树形层级布局、自定义人员卡片节点、折叠展开子树等。

library: "x6"
version: "3.x"
category: "patterns"
subcategory: "org-chart"
tags:
  - "组织架构图"
  - "org chart"
  - "组织结构"
  - "树形图"
  - "人员关系"
  - "层级结构"

related:
  - "x6-intermediate-group"
  - "x6-intermediate-custom-node"
  - "x6-intermediate-layout"
  - "x6-core-edge"

use_cases:
  - "公司组织架构展示"
  - "团队层级关系"
  - "汇报关系图"
  - "部门结构可视化"

difficulty: "intermediate"
completeness: "full"
---

## 场景特点

组织架构图的核心特征：
- **树形结构**：自上而下的层级关系
- **自定义卡片节点**：包含姓名、职位、头像等信息
- **竖直边**：连线通常为正交或平滑曲线，从父节点底部到子节点顶部
- **折叠/展开**：子树可折叠，节点多时提升可读性

## 注册卡片节点

```javascript
import { Graph } from '@antv/x6';

Graph.registerNode('org-card', {
  inherit: 'rect',
  width: 180,
  height: 70,
  attrs: {
    body: {
      fill: '#fff',
      stroke: '#e8e8e8',
      strokeWidth: 1,
      rx: 8,
      ry: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: 'bold',
      fill: '#333',
      refY: 20,
      refX: 0.5,
    },
  },
  ports: {
    groups: {
      top: {
        position: 'top',
        attrs: { circle: { r: 0 } },  // 隐藏端口圆点
      },
      bottom: {
        position: 'bottom',
        attrs: { circle: { r: 0 } },
      },
    },
    items: [
      { id: 'top', group: 'top' },
      { id: 'bottom', group: 'bottom' },
    ],
  },
}, true);
```

## 完整示例

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 1000,
  height: 600,
  background: { color: '#F8FAFC' },
  panning: { enabled: true, modifiers: 'ctrl' },
  mousewheel: { enabled: true, modifiers: 'ctrl' },
  interacting: { nodeMovable: false },  // 组织架构图通常禁止自由拖拽
});

// 定义组织数据
const orgData = {
  id: 'ceo',
  label: 'CEO\n张三',
  children: [
    {
      id: 'cto',
      label: 'CTO\n李四',
      children: [
        { id: 'fe-lead', label: '前端负责人\n王五' },
        { id: 'be-lead', label: '后端负责人\n赵六' },
      ],
    },
    {
      id: 'cfo',
      label: 'CFO\n孙七',
      children: [
        { id: 'finance', label: '财务经理\n周八' },
      ],
    },
    {
      id: 'coo',
      label: 'COO\n吴九',
    },
  ],
};

// 递归创建节点和边
function buildOrgChart(data, parentId, yOffset, xCenter) {
  const node = graph.addNode({
    id: data.id,
    x: xCenter - 90,
    y: yOffset,
    width: 180,
    height: 60,
    label: data.label,
    attrs: {
      body: { fill: '#fff', stroke: '#5B8FF9', strokeWidth: 1.5, rx: 8, ry: 8 },
      label: { fontSize: 13, fill: '#333' },
    },
  });

  if (parentId) {
    graph.addEdge({
      source: { cell: parentId },
      target: { cell: data.id },
      attrs: { line: { stroke: '#A3B1BF', strokeWidth: 1.5, targetMarker: null } },
      router: 'orth',
      connector: 'rounded',
    });
  }

  if (data.children && data.children.length > 0) {
    const childCount = data.children.length;
    const spacing = 220;
    const startX = xCenter - ((childCount - 1) * spacing) / 2;

    data.children.forEach((child, index) => {
      buildOrgChart(child, data.id, yOffset + 120, startX + index * spacing);
    });
  }
}

buildOrgChart(orgData, null, 50, 500);
```

## 使用 @antv/hierarchy 布局

对于复杂树形结构，推荐使用 `@antv/hierarchy` 自动计算布局：

```javascript
import { Graph } from '@antv/x6';
import Hierarchy from '@antv/hierarchy';

const result = Hierarchy.compactBox(orgData, {
  direction: 'TB',  // Top-to-Bottom
  getWidth: () => 180,
  getHeight: () => 60,
  getHGap: () => 40,
  getVGap: () => 60,
});

// result 包含计算好的 x, y 坐标
function renderTree(node) {
  graph.addNode({
    id: node.id,
    x: node.x,
    y: node.y,
    width: 180,
    height: 60,
    label: node.data.label,
    attrs: { body: { fill: '#fff', stroke: '#5B8FF9', rx: 8, ry: 8 } },
  });

  if (node.children) {
    node.children.forEach((child) => {
      renderTree(child);
      graph.addEdge({
        source: node.id,
        target: child.id,
        attrs: { line: { stroke: '#A3B1BF', targetMarker: null } },
        router: 'orth',
        connector: 'rounded',
      });
    });
  }
}

renderTree(result);
```

## 折叠展开子树

```javascript
// 标记节点是否已折叠
function toggleCollapse(nodeId) {
  const node = graph.getCellById(nodeId);
  const collapsed = node.getData()?.collapsed;

  // 获取所有后代节点和边
  const descendants = getDescendants(nodeId);

  if (collapsed) {
    // 展开：显示后代
    descendants.forEach((cell) => cell.show());
    node.setData({ collapsed: false });
  } else {
    // 折叠：隐藏后代
    descendants.forEach((cell) => cell.hide());
    node.setData({ collapsed: true });
  }
}

function getDescendants(nodeId) {
  const result = [];
  const edges = graph.getEdges().filter((e) => e.getSourceCellId() === nodeId);

  edges.forEach((edge) => {
    result.push(edge);
    const targetId = edge.getTargetCellId();
    const targetNode = graph.getCellById(targetId);
    if (targetNode) {
      result.push(targetNode);
      result.push(...getDescendants(targetId));
    }
  });

  return result;
}

// 双击节点折叠/展开
graph.on('node:dblclick', ({ node }) => {
  toggleCollapse(node.id);
});
```

## 最佳实践

1. **正交路由 + 无箭头**：组织架构图通常不需要箭头，设置 `targetMarker: null`
2. **禁止自由拖拽**：`interacting: { nodeMovable: false }` 保持布局整齐
3. **自上而下布局**：使用 `@antv/hierarchy` 的 `direction: 'TB'`
4. **颜色区分层级**：不同层级使用不同颜色标识
5. **大组织启用虚拟渲染**：超过 100 人的组织图配置 `virtual: true`
