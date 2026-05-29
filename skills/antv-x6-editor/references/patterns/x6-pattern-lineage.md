---
id: "x6-pattern-lineage"
title: "X6 血缘图（Lineage/Data Lineage）"
description: |
  使用 X6 构建数据血缘图的最佳实践：多输入输出端口、层级布局、表字段级血缘关系、折叠展开等。

library: "x6"
version: "3.x"
category: "patterns"
subcategory: "lineage"
tags:
  - "血缘图"
  - "lineage"
  - "data lineage"
  - "数据血缘"
  - "表关系"
  - "字段级血缘"
  - "DAG"

related:
  - "x6-pattern-dag"
  - "x6-core-ports"
  - "x6-core-edge"
  - "x 6-intermediate-custom-node"
  - "x6-intermediate-layout"

use_cases:
  - "数据仓库表级血缘"
  - "字段级血缘追踪"
  - "ETL 数据流向"
  - "数据资产血缘关系"

difficulty: "advanced"
completeness: "full"
---

## 场景特点

数据血缘图的核心特征：
- **表节点**：每个节点代表一张表/数据集，内部展示字段列表
- **字段级连线**：连线精确连接源表字段到目标表字段（端口到端口）
- **从左到右布局**：数据流从上游到下游，通常 LR（Left-to-Right）布局
- **多端口**：每个节点有多个输入/输出端口（对应字段）
- **正交路由**：连线使用正交路由避免交叉

## 注册自定义表节点

```javascript
const { Graph } = X6;

// 注册血缘表节点
Graph.registerNode('lineage-table', {
  inherit: 'rect',
  width: 220,
  height: 60,
  attrs: {
    body: {
      fill: '#fff',
      stroke: '#d9d9d9',
      strokeWidth: 1,
      rx: 4,
      ry: 4,
    },
    label: {
      fontSize: 14,
      fontWeight: 'bold',
      fill: '#333',
      refY: 14,
      refX: 0.5,
    },
  },
  ports: {
    groups: {
      in: {
        position: 'left',
        label: { position: 'inside' },
        attrs: {
          circle: { r: 4, magnet: true, stroke: '#31d0c6', fill: '#fff', strokeWidth: 1.5 },
        },
      },
      out: {
        position: 'right',
        label: { position: 'inside' },
        attrs: {
          circle: { r: 4, magnet: true, stroke: '#ff6347', fill: '#fff', strokeWidth: 1.5 },
        },
      },
    },
  },
}, true);
```

## 完整示例：三表血缘关系

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>X6 数据血缘图示例</title>
  <style>
    #container {
      width: 1000px;
      height: 600px;
      border: 1px solid #d9d9d9;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <script src="https://unpkg.com/@antv/x6/dist/x6.js"></script>
  <script>
    const { Graph } = X6;

    const graph = new Graph({
      container: document.getElementById('container'),
      width: 1000,
      height: 600,
      background: { color: '#F2F7FA' },
      grid: { visible: true, size: 10 },
      panning: { enabled: true, modifiers: 'ctrl' },
      mousewheel: { enabled: true, modifiers: 'ctrl' },
      connecting: {
        allowBlank: false,
        router: 'orth',
        connector: 'rounded',
      },
    });

    // 源表
    const sourceTable = graph.addNode({
      shape: 'rect',
      x: 50,
      y: 100,
      width: 200,
      height: 130,
      label: 'user_orders',
      attrs: {
        body: { fill: '#fff', stroke: '#5F95FF', strokeWidth: 1.5, rx: 6, ry: 6 },
        label: { fontSize: 14, fontWeight: 'bold', fill: '#333', refY: 16, refX: 0.5 },
      },
      ports: {
        groups: {
          out: {
            position: 'right',
            attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', fill: '#EFF4FF' } },
          },
        },
        items: [
          { id: 'user_id', group: 'out', attrs: { text: { text: 'user_id' } } },
          { id: 'order_id', group: 'out', attrs: { text: { text: 'order_id' } } },
          { id: 'amount', group: 'out', attrs: { text: { text: 'amount' } } },
          { id: 'order_date', group: 'out', attrs: { text: { text: 'order_date' } } },
        ],
      },
    });

    // 中间 ETL 节点
    const etlNode = graph.addNode({
      shape: 'rect',
      x: 380,
      y: 130,
      width: 200,
      height: 100,
      label: 'agg_user_stats',
      attrs: {
        body: { fill: '#fff', stroke: '#73d13d', strokeWidth: 1.5, rx: 6, ry: 6 },
        label: { fontSize: 14, fontWeight: 'bold', fill: '#333', refY: 16, refX: 0.5 },
      },
      ports: {
        groups: {
          in: {
            position: 'left',
            attrs: { circle: { r: 4, magnet: true, stroke: '#73d13d', fill: '#f6ffed' } },
          },
          out: {
            position: 'right',
            attrs: { circle: { r: 4, magnet: true, stroke: '#73d13d', fill: '#f6ffed' } },
          },
        },
        items: [
          { id: 'in_user_id', group: 'in', attrs: { text: { text: 'user_id' } } },
          { id: 'in_amount', group: 'in', attrs: { text: { text: 'amount' } } },
          { id: 'out_user_id', group: 'out', attrs: { text: { text: 'user_id' } } },
          { id: 'out_total', group: 'out', attrs: { text: { text: 'total_amount' } } },
        ],
      },
    });

    // 目标表
    const targetTable = graph.addNode({
      shape: 'rect',
      x: 700,
      y: 150,
      width: 200,
      height: 80,
      label: 'report_summary',
      attrs: {
        body: { fill: '#fff', stroke: '#ff7a45', strokeWidth: 1.5, rx: 6, ry: 6 },
        label: { fontSize: 14, fontWeight: 'bold', fill: '#333', refY: 16, refX: 0.5 },
      },
      ports: {
        groups: {
          in: {
            position: 'left',
            attrs: { circle: { r: 4, magnet: true, stroke: '#ff7a45', fill: '#fff7e6' } },
          },
        },
        items: [
          { id: 'in_uid', group: 'in', attrs: { text: { text: 'user_id' } } },
          { id: 'in_total', group: 'in', attrs: { text: { text: 'total' } } },
        ],
      },
    });

    // 字段级连线
    graph.addEdge({
      source: { cell: sourceTable.id, port: 'user_id' },
      target: { cell: etlNode.id, port: 'in_user_id' },
      attrs: { line: { stroke: '#5F95FF', strokeWidth: 1.5 } },
      router: 'orth',
      connector: 'rounded',
    });

    graph.addEdge({
      source: { cell: sourceTable.id, port: 'amount' },
      target: { cell: etlNode.id, port: 'in_amount' },
      attrs: { line: { stroke: '#5F95FF', strokeWidth: 1.5 } },
      router: 'orth',
      connector: 'rounded',
    });

    graph.addEdge({
      source: { cell: etlNode.id, port: 'out_user_id' },
      target: { cell: targetTable.id, port: 'in_uid' },
      attrs: { line: { stroke: '#73d13d', strokeWidth: 1.5 } },
      router: 'orth',
      connector: 'rounded',
    });

    graph.addEdge({
      source: { cell: etlNode.id, port: 'out_total' },
      target: { cell: targetTable.id, port: 'in_total' },
      attrs: { line: { stroke: '#73d13d', strokeWidth: 1.5 } },
      router: 'orth',
      connector: 'rounded',
    });
  </script>
</body>
</html>
```

## 高亮血缘路径

点击某个字段时，高亮其上下游完整链路：

```javascript
graph.on('node:port:click', ({ node, port }) => {
  // 重置所有边的样式
  graph.getEdges().forEach((edge) => {
    edge.attr('line/stroke', '#d9d9d9');
    edge.attr('line/strokeWidth', 1);
  });

  // 高亮与该端口相关的边
  const relatedEdges = graph.getEdges().filter((edge) => {
    const source = edge.getSource();
    const target = edge.getTarget();
    return (source.cell === node.id && source.port === port) ||
           (target.cell === node.id && target.port === port);
  });

  relatedEdges.forEach((edge) => {
    edge.attr('line/stroke', '#1890ff');
    edge.attr('line/strokeWidth', 3);
  });
});
```

## 布局建议

使用 `@antv/layout` 的 dagre 算法实现自动 LR 布局：

```html
<script src="https://unpkg.com/@antv/layout@latest/dist/layout.min.js"></script>
<script>
  const { DagreLayout } = Layout;

  const dagreLayout = new DagreLayout({
    type: 'dagre',
    rankdir: 'LR',
    nodesep: 40,
    ranksep: 100,
  });

  const layoutData = dagreLayout.layout({
    nodes: graph.getNodes().map((n) => ({
      id: n.id,
      size: { width: n.getSize().width, height: n.getSize().height },
    })),
    edges: graph.getEdges().map((e) => ({
      source: e.getSourceCellId(),
      target: e.getTargetCellId(),
    })),
  });

  layoutData.nodes.forEach((n) => {
    const node = graph.getCellById(n.id);
    if (node) node.setPosition(n.x, n.y);
  });
</script>
```

## 最佳实践

1. **端口 ID 使用字段名**：方便血缘追踪逻辑
2. **正交路由 + 圆角连接器**：`router: 'orth'`, `connector: 'rounded'`
3. **按层着色**：源表、中间表、目标表使用不同颜色
4. **节点高度动态计算**：根据字段数量动态设置 `height = 40 + fields.length * 24`
5. **大规模场景启用虚拟渲染**：超过 200 个节点时配置 `virtual: true`

## 常见错误与修正

### 错误 1：使用未注册的节点类型

**错误代码：**
```javascript
const node = graph.addNode({
  shape: 'dag-node', // 错误：未注册的节点类型
  label: '源表',
});
```

**错误信息：**
```
Node with name 'dag-node' does not exist.
```

**修正方法：**
在使用自定义节点前，必须先注册节点类型。推荐使用 `Graph.registerNode` 注册自定义节点：

```javascript
Graph.registerNode('lineage-node', {
  inherit: 'rect',
  width: 130,
  height: 40,
  attrs: {
    body: { fill: '#fff', stroke: '#d9d9d9', strokeWidth: 1, rx: 4, ry: 4 },
    label: { fontSize: 12 },
  },
  ports: {
    groups: {
      in: { position: 'left', attrs: { circle: { r: 4, magnet: true, stroke: '#8f8f8f', fill: '#fff' } } },
      out: { position: 'right', attrs: { circle: { r: 4, magnet: true, stroke: '#8f8f8f', fill: '#fff' } } },
    },
  },
}, true);

const node = graph.addNode({
  shape: 'lineage-node', // 正确：已注册的节点类型
  label: '源表',
});
```

### 错误 2：布局使用错误的 API

**错误代码：**
```javascript
import { DagreLayout } from '@antv/x6';
const layout = new DagreLayout({...});
const model = layout.layout(graph.toJSON());
graph.fromJSON(model);
```

**错误信息：**
```
TypeError: layout.layout is not a function
```

**修正方法：**
应从 `@antv/layout` 导入 `DagreLayout`，并使用正确的布局方式：

```javascript
import { DagreLayout } from '@antv/layout';

const dagreLayout = new DagreLayout({
  type: 'dagre',
  rankdir: 'LR',
  align: 'UL',
  ranksep: 80,
  nodesep: 30,
});

const layoutData = dagreLayout.layout({
  nodes: graph.getNodes().map((n) => ({
    id: n.id,
    size: { width: n.getSize().width, height: n.getSize().height },
  })),
  edges: graph.getEdges().map((e) => ({
    source: e.getSourceCellId(),
    target: e.getTargetCellId(),
  })),
});

layoutData.nodes.forEach((n) => {
  const node = graph.getCellById(n.id);
  if (node) node.setPosition(n.x, n.y);
});
```

### 错误 3：在浏览器环境中使用 ES Module 导入语法

**错误代码：**
```javascript
import { Graph } from '@antv/x6'
import { DagreLayout } from '@antv/layout'
```

**错误信息：**
```
Cannot use import statement outside a module
```

**修正方法：**
在浏览器环境中，应使用 `<script>` 标签引入 X6 和 layout 库，或使用打包工具（如 Webpack、Vite）处理模块依赖。如果使用 script 标签引入，请确保引入顺序正确，并通过全局变量访问 API：

```html
<script src="https://unpkg.com/@antv/x6/dist/x6.js"></script>
<script src="https://unpkg.com/@antv/layout@latest/dist/layout.min.js"></script>
<script>
  const { Graph } = X6;
  const { DagreLayout } = Layout;

  Graph.registerNode('lineage-node', {
    inherit: 'rect',
    width: 130,
    height: 40,
    attrs: {
      body: { fill: '#fff', stroke: '#d9d9d9', strokeWidth: 1, rx: 4, ry: 4 },
      label: { fontSize: 12 },
    },
    ports: {
      groups: {
        in: { position: 'left', attrs: { circle: { r: 4, magnet: true, stroke: '#8f8f8f', fill: '#fff' } } },
        out: { position: 'right', attrs: { circle: { r: 4, magnet: true, stroke: '#8f8f8f', fill: '#fff' } } },
      },
    },
  }, true);

  const graph = new Graph({
    container: document.getElementById('container'),
    width: 800,
    height: 450,
    background: { color: '#F2F7FA' },
    panning: true,
    mousewheel: { enabled: true, modifiers: 'ctrl' },
  });

  // 添加节点和边...
</script>
```

### 错误 4：在浏览器环境中未正确配置模块系统

**错误代码：**
```html
<script type="text/javascript">
  import { Graph } from '@antv/x6';
</script>
```

**错误信息：**
```
Cannot use import statement outside a module
```

**修正方法：**
若要在浏览器中使用 ES Module 语法，请将脚本标记为 `type="module"`，并使用 CDN 提供的 ESM 版本：

```html
<script type="module">
  import { Graph } from 'https://unpkg.com/@antv/x6?module';
  import { DagreLayout } from 'https://unpkg.com/@antv/layout?module';

  const graph = new Graph({
    container: document.getElementById('container'),
    width: 800,
    height: 450,
    background: { color: '#F2F7FA' },
  });

  // 添加节点和边...
</script>
```

或者使用传统的 IIFE 方式引入库：

```html
<script src="https://unpkg.com/@antv/x6/dist/x6.js"></script>
<script>
  const { Graph } = X6;

  const graph = new Graph({
    container: document.getElementById('container'),
    width: 800,
    height: 450,
    background: { color: '#F2F7FA' },
  });

  // 添加节点和边...
</script>
```

### 错误 5：容器元素未正确指定

**错误代码：**
```javascript
const graph = new Graph({
  container, // 错误：未定义 container 变量
  width: 800,
  height: 450,
});
```

**错误信息：**
```
Uncaught TypeError: Cannot read property 'appendChild' of undefined
```

**修正方法：**
确保 `container` 是一个 DOM 元素或有效的选择器字符串：

```javascript
const graph = new Graph({
  container: document.getElementById('container'), // 正确：获取 DOM 元素
  width: 800,
  height: 450,
});
```

或者：

```javascript
const graph = new Graph({
  container: 'container', // 正确：使用选择器字符串
  width: 800,
  height: 450,
});
```

### 错误 6：使用了错误的端口引用方式

**错误代码：**
```javascript
graph.addEdge({
  source: { cell: sourceTable, port: 'out1' }, // 错误：sourceTable 是 Node 实例，而不是 ID
  target: { cell: etl1, port: 'in1' },
});
```

**错误信息：**
```
Invalid source or target cell reference
```

**修正方法：**
在创建边时，`source.cell` 和 `target.cell` 应该是节点的 ID 字符串，而不是节点对象本身：

```javascript
graph.addEdge({
  source: { cell: sourceTable.id, port: 'out1' }, // 正确：使用节点 ID
  target: { cell: etl1.id, port: 'in1' },
});
```

或者在添加节点时保存节点 ID：

```javascript
const sourceTableId = graph.addNode({...}).id;
const etl1Id = graph.addNode({...}).id;

graph.addEdge({
  source: { cell: sourceTableId, port: 'out1' },
  target: { cell: etl1Id, port: 'in1' },
});
```