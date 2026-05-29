---
id: "x6-core-ports"
title: "X6 连接桩（Ports）配置"
description: |
  X6 连接桩的定义、分组、位置、样式、动态显隐。
  连接桩是节点上的连线锚点，用于 DAG/流程图等场景。

library: "x6"
version: "3.x"
category: "core"
subcategory: "ports"
tags:
  - "连接桩"
  - "端口"
  - "ports"
  - "magnet"
  - "锚点"
  - "连线"
  - "position"
  - "group"
  - "动态端口"
  - "DAG"

related:
  - "x6-core-node"
  - "x6-core-edge"
  - "x6-core-graph-init"

use_cases:
  - "为节点添加连接桩"
  - "配置端口分组和位置"
  - "创建 DAG 节点的输入输出端口"
  - "动态添加/删除端口"
  - "鼠标悬停时显示端口"

anti_patterns:
  - "不要遗漏 magnet: true，否则端口无法连线"
  - "不要在 items 中重复 group 已定义的 attrs"
  - "Graph.registerNode 已声明 ports.items 时，addNode 不要再传同名 id 的 ports.items，会触发 Duplicitied port id"
  - "node.addPort 添加的 id 不能与 registerNode/addNode 已有 ports.items 中的 id 重名"

difficulty: "intermediate"
completeness: "full"
---

## 基础端口配置

```javascript
graph.addNode({
  shape: 'rect',
  x: 100, y: 60,
  width: 120, height: 50,
  label: 'DAG Node',
  ports: {
    groups: {
      in: {
        position: 'left',
        attrs: {
          circle: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' },
        },
      },
      out: {
        position: 'right',
        attrs: {
          circle: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' },
        },
      },
    },
    items: [
      { id: 'in1', group: 'in' },
      { id: 'out1', group: 'out' },
    ],
  },
});
```

## 端口位置

| position | 说明 |
|----------|------|
| `'top'` | 顶部居中 |
| `'bottom'` | 底部居中 |
| `'left'` | 左侧居中 |
| `'right'` | 右侧居中 |

多个同组端口会自动均匀分布：

```javascript
ports: {
  groups: {
    in: { position: 'top' },
    out: { position: 'bottom' },
  },
  items: [
    { id: 'in1', group: 'in' },
    { id: 'in2', group: 'in' },   // 两个 top 端口会均匀分布
    { id: 'out1', group: 'out' },
  ],
}
```

## 通过端口连线

```javascript
// 边连接到指定端口
graph.addEdge({
  source: { cell: node1, port: 'out1' },
  target: { cell: node2, port: 'in1' },
  attrs: { line: { stroke: '#1890ff', strokeWidth: 1, targetMarker: 'classic' } },
});

// 也可用节点 ID
graph.addEdge({
  source: { cell: 'node-1', port: 'out1' },
  target: { cell: 'node-2', port: 'in1' },
});
```

## DAG 节点注册（常用模式）

```javascript
Graph.registerNode('dag-node', {
  inherit: 'rect',
  width: 140,
  height: 50,
  attrs: {
    body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 },
  },
  ports: {
    groups: {
      in: {
        position: 'left',
        attrs: { circle: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' } },
      },
      out: {
        position: 'right',
        attrs: { circle: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' } },
      },
    },
  },
}, true);

// 使用时只需指定 items
graph.addNode({
  shape: 'dag-node',
  x: 100, y: 60,
  label: 'ETL Task',
  ports: { items: [{ id: 'in1', group: 'in' }, { id: 'out1', group: 'out' }] },
});
```

## 动态操作端口

```javascript
// 添加端口
node.addPort({ id: 'new-port', group: 'out' });

// 删除端口
node.removePort('port-id');

// 获取所有端口
const ports = node.getPorts();

// 判断端口是否存在
const hasPort = node.hasPort('port-id');
```

## 鼠标悬停显示端口

```javascript
const graph = new Graph({
  container: 'container',
});

// 默认隐藏端口
graph.addNode({
  shape: 'rect',
  x: 100, y: 60,
  width: 120, height: 50,
  ports: {
    groups: {
      in: {
        position: 'left',
        attrs: {
          circle: {
            magnet: true, r: 5, stroke: '#1890ff', fill: '#fff',
            style: { visibility: 'hidden' },
          },
        },
      },
      out: {
        position: 'right',
        attrs: {
          circle: {
            magnet: true, r: 5, stroke: '#1890ff', fill: '#fff',
            style: { visibility: 'hidden' },
          },
        },
      },
    },
    items: [{ id: 'in1', group: 'in' }, { id: 'out1', group: 'out' }],
  },
});

// 鼠标进入时显示
graph.on('node:mouseenter', ({ node }) => {
  node.getPorts().forEach((port) => {
    node.portProp(port.id, 'attrs/circle/style/visibility', 'visible');
  });
});

// 鼠标离开时隐藏
graph.on('node:mouseleave', ({ node }) => {
  node.getPorts().forEach((port) => {
    node.portProp(port.id, 'attrs/circle/style/visibility', 'hidden');
  });
});
```

## 端口样式自定义

```javascript
ports: {
  groups: {
    in: {
      position: 'top',
      attrs: {
        circle: {
          magnet: true,
          r: 6,
          stroke: '#52c41a',
          fill: '#f6ffed',
          strokeWidth: 2,
        },
      },
      label: {
        position: 'top',  // 标签位置
      },
    },
  },
  items: [
    { id: 'in1', group: 'in', attrs: { text: { text: 'input' } } },
  ],
}
```

## 连接验证

配合 `connecting` 配置限制端口连线规则：

```javascript
const graph = new Graph({
  container: 'container',
  connecting: {
    allowBlank: false,
    allowNode: false,        // 只允许连接到端口
    allowLoop: false,        // 禁止自环
    validateConnection({ sourcePort, targetPort, sourceCell, targetCell }) {
      // 不允许输出端口连输出端口
      if (sourcePort && sourcePort.startsWith('out') && targetPort && targetPort.startsWith('out')) {
        return false;
      }
      // 不允许连接到自身
      if (sourceCell === targetCell) return false;
      return true;
    },
  },
});
```

## 常见错误与修正

### 错误 1：端口未正确分组导致无法连线

**错误示例：**
```javascript
// 错误：没有定义 groups，直接使用 group 属性
graph.addNode({
  shape: 'rect',
  x: 100, y: 60,
  width: 120, height: 50,
  ports: {
    items: [
      { id: 'port1', group: 'top' },  // group 未定义
      { id: 'port2', group: 'bottom' },
    ],
  },
});
```

**修正方法：**
```javascript
// 正确：先定义 groups，再在 items 中引用
graph.addNode({
  shape: 'rect',
  x: 100, y: 60,
  width: 120, height: 50,
  ports: {
    groups: {
      top: {
        position: 'top',
        attrs: { circle: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' } },
      },
      bottom: {
        position: 'bottom',
        attrs: { circle: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' } },
      },
    },
    items: [
      { id: 'port1', group: 'top' },
      { id: 'port2', group: 'bottom' },
    ],
  },
});
```

### 错误 2：端口未设置 magnet 导致无法连线

**错误示例：**
```javascript
// 错误：缺少 magnet: true
ports: {
  groups: {
    in: {
      position: 'left',
      attrs: { circle: { r: 5, stroke: '#1890ff', fill: '#fff' } }, // 缺少 magnet
    },
  },
  items: [{ id: 'in1', group: 'in' }],
}
```

**修正方法：**
```javascript
// 正确：设置 magnet: true
ports: {
  groups: {
    in: {
      position: 'left',
      attrs: { circle: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' } },
    },
  },
  items: [{ id: 'in1', group: 'in' }],
}
```

### 错误 3：端口样式设置错误导致显示异常

**错误示例：**
```javascript
// 错误：在 items 中重复设置 group 已定义的 attrs
ports: {
  groups: {
    in: {
      position: 'left',
      attrs: { circle: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' } },
    },
  },
  items: [
    { id: 'in1', group: 'in', attrs: { circle: { r: 10 } } }, // 重复设置 circle
  ],
}
```

**修正方法：**
```javascript
// 正确：避免在 items 中重复设置 group 已定义的 attrs
ports: {
  groups: {
    in: {
      position: 'left',
      attrs: { circle: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' } },
    },
  },
  items: [
    { id: 'in1', group: 'in' },
  ],
}
```

### 错误 4：创建边时未正确引用节点导致连接失败

**错误示例：**
```javascript
// 错误：source 和 target 应该是节点实例或节点 ID 字符串
const edge = graph.addEdge({
  source: 'source',
  target: 'target',
  attrs: {
    line: {
      stroke: '#5F95FF',
      strokeWidth: 2,
      targetMarker: {
        name: 'classic',
        size: 8,
      },
    },
  },
})
```

**修正方法：**
```javascript
// 正确：确保 source 和 target 是有效的节点引用
const sourceNode = graph.addNode({
  id: 'source',
  shape: 'rect',
  label: 'hello',
  x: 40,
  y: 100,
  width: 100,
  height: 40,
})

const targetNode = graph.addNode({
  id: 'target',
  shape: 'rect',
  label: 'world',
  x: 340,
  y: 100,
  width: 100,
  height: 40,
})

const edge = graph.addEdge({
  source: sourceNode, // 或者 'source'
  target: targetNode, // 或者 'target'
  attrs: {
    line: {
      stroke: '#5F95FF',
      strokeWidth: 2,
      targetMarker: {
        name: 'classic',
        size: 8,
      },
    },
  },
})
```

### 错误 5：端口配置中缺少必要的 selector 定义

**错误示例：**
```javascript
// 错误：portMarkup 使用了未定义的 selector
ports: {
  groups: {
    in: {
      position: 'left',
      attrs: { portBody: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' } },
    },
  },
  items: [{ id: 'in1', group: 'in' }],
}
```

**修正方法：**
```javascript
// 正确：portMarkup 中定义 selector 名称
ports: {
  groups: {
    in: {
      position: 'left',
      attrs: { portBody: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' } },
    },
  },
  items: [{ id: 'in1', group: 'in' }],
  portMarkup: [
    {
      tagName: 'circle',
      selector: 'portBody', // 与 attrs 中的 key 一致
    },
  ],
}
```

### 错误 6：使用未声明的 group 名称导致端口不显示

**错误示例：**
```javascript
// 错误：items 中使用了未在 groups 中定义的 group 名称
graph.addNode({
  shape: 'rect',
  x: 100,
  y: 60,
  width: 120,
  height: 50,
  ports: {
    groups: {
      in: {
        position: 'left',
        attrs: { circle: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' } },
      },
    },
    items: [
      { id: 'port1', group: 'top' }, // group 'top' 未定义
    ],
  },
});
```

**修正方法：**
```javascript
// 正确：确保 items 中使用的 group 名称已在 groups 中定义
graph.addNode({
  shape: 'rect',
  x: 100,
  y: 60,
  width: 120,
  height: 50,
  ports: {
    groups: {
      in: {
        position: 'left',
        attrs: { circle: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' } },
      },
      top: {
        position: 'top',
        attrs: { circle: { magnet: true, r: 5, stroke: '#1890ff', fill: '#fff' } },
      },
    },
    items: [
      { id: 'port1', group: 'top' },
    ],
  },
});
```

### 错误 7：container 引用无效导致渲染失败

**错误示例：**
```javascript
// 错误：container 变量未定义或为 null
const graph = new Graph({
  container: container, // ❌ container 未声明，应使用字符串 'container'
});
```

**修正方法：**
```javascript
// 正确：使用字符串 'container'（运行环境已注入，禁止声明 const container）
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
});
```

### 错误 8：动态修改边属性时未正确使用 API

**错误示例：**
```javascript
// 错误：使用 edge.attr() 和 edge.prop() 修改边属性时参数格式不正确
setTimeout(() => {
  edge.attr('line/stroke', '#ff4d4f')
  edge.attr('line/strokeWidth', 2)
  edge.prop('vertices', [{ x: 200, y: 200 }])
}, 2000)
```

**修正方法：**
```javascript
// 正确：使用正确的 API 调用方式
edge.attr('line/stroke', '#1890ff');
edge.prop('vertices', [{ x: 200, y: 50 }]);
```

### 错误 9：创建支持从连接桩拖拽连线的画布时配置不当

**错误示例：**
```javascript
// 错误：connecting 配置不完整或错误
const graph = new Graph({
  container: 'container',
  connecting: {
    snap: true,
    allowBlank: true,
    allowLoop: false,
    highlight: true,
    connector: 'rounded',
    connectionPoint: 'anchor',
    router: {
      name: 'manhattan',
      args: {
        padding: 1,
      },
    },
    createEdge() {
      return new Shape.Edge({
        attrs: {
          line: {
            stroke: '#5F95FF',
            strokeWidth: 2,
            targetMarker: {
              name: 'classic',
              size: 8,
            },
          },
        },
        zIndex: 0,
      })
    },
  },
})
```

**修正方法：**
```javascript
// 正确：使用完整的 connecting 配置
const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
  connecting: {
    allowBlank: true,
    allowMulti: true,
    allowLoop: true,
    allowNode: true,
    allowEdge: false,
    allowPort: true,
    createEdge() {
      return this.createEdge({
        attrs: {
          line: {
            stroke: '#8f8f8f',
            strokeWidth: 1,
          },
        },
      });
    },
  },
});
```

## ⚠️ `registerNode` + `addNode` 端口合并行为（必读）

X6 3.x 在 `new Cell(metadata)` 时执行 `ObjectExt.merge({}, defaults, metadata)` 把注册时的 ports 与 `addNode` 时的 ports **递归合并**；同时 `node.addPort` / `node.addPorts` 走的是 `[...current.items, ...new]` **简单拼接**。两条路径**都不会做 id 去重**，只要出现同名 id，X6 立刻抛 `Error: Duplicitied port id.`，整张画布无法渲染。

### ❌ 反例（典型 Duplicitied port id）

```javascript
// 注册时声明了 in1
Graph.registerNode('my-node', {
  inherit: 'rect',
  width: 120, height: 60,
  ports: {
    groups: { in: { position: 'left', attrs: { circle: { magnet: true, r: 4 } } } },
    items: [{ id: 'in1', group: 'in' }],
  },
});

// addNode 又写了一遍 in1 → 数组按下标 merge，相当于 items: [{ id: 'in1' }, { id: 'in1' }] → 报错
graph.addNode({
  shape: 'my-node', x: 100, y: 100,
  ports: { items: [{ id: 'in1', group: 'in' }] },
});
// → Error: Duplicitied port id.
```

### ✅ 正确写法（三选一）

**1. 注册只声明 groups，items 全在 addNode 时给：**
```javascript
Graph.registerNode('my-node', {
  inherit: 'rect',
  width: 120, height: 60,
  ports: {
    groups: { in: { position: 'left', attrs: { circle: { magnet: true, r: 4 } } } },
    // items 不写，留给 addNode
  },
});
graph.addNode({ shape: 'my-node', x: 100, y: 100,
  ports: { items: [{ id: 'in1', group: 'in' }] } });
```

**2. 注册里完整声明 items，addNode 不再传 ports：**
```javascript
Graph.registerNode('my-node', {
  inherit: 'rect',
  width: 120, height: 60,
  ports: {
    groups: { in: { position: 'left', attrs: { circle: { magnet: true, r: 4 } } } },
    items: [{ id: 'in1', group: 'in' }],
  },
});
graph.addNode({ shape: 'my-node', x: 100, y: 100 }); // 直接复用 registry 里的端口
```

**3. 注册声明部分端口，运行时追加端口用 `node.addPort` 且 id 不重名：**
```javascript
const node = graph.addNode({ shape: 'my-node', x: 100, y: 100 }); // 已有 in1
node.addPort({ id: 'in2', group: 'in' }); // ✅ 新 id
node.addPort({ id: 'in1', group: 'in' }); // ❌ Duplicitied port id
```

> 排错小贴士：看到 `Duplicitied port id.` 一律先去 grep 同一个 port id，往往是 registry 已经声明、addNode 又重复传了一遍。
