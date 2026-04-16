---
id: "g6-node-react"
title: "G6 React/Vue 自定义节点（react-node / vue-node）"
description: |
  使用 @antv/g6-extension-react 可以用 React 组件定义节点内容。
  支持 Ant Design 等 UI 库，适合包含交互逻辑、表单输入等复杂节点场景。
  节点数据通过 component 回调传入，支持状态响应与图实例双向通信。

library: "g6"
version: "5.x"
category: "elements"
subcategory: "nodes"
tags:
  - "react-node"
  - "vue-node"
  - "React节点"
  - "自定义节点"
  - "富文本节点"
  - "g6-extension-react"

related:
  - "g6-node-html"
  - "g6-core-custom-element"

difficulty: "advanced"
completeness: "full"
created: "2026-04-16"
updated: "2026-04-16"
---

## 方案选择

| 方案 | 推荐场景 |
|------|---------|
| 内置节点（circle/rect 等） | 简单几何图形，需要高性能（>2000 节点） |
| HTML 节点（html） | 轻量富文本，不依赖 React/Vue |
| React 节点（react-node） | 集成 Ant Design 等 UI 库，含交互逻辑 |
| Vue 节点（vue-node） | Vue 项目，集成 Element Plus 等 |

---

## React 节点

### 安装依赖

```bash
npm install @antv/g6-extension-react
# Vue 项目：npm install @antv/g6-extension-vue
```

### 基础示例

```jsx
import { ExtensionCategory, Graph, register } from '@antv/g6';
import { ReactNode } from '@antv/g6-extension-react';

// 1. 注册 React 节点类型
register(ExtensionCategory.NODE, 'react-node', ReactNode);

// 2. 定义 React 组件
const MyNode = ({ data }) => (
  <div style={{
    width: '100%',
    height: '100%',
    background: '#fff',
    border: '1px solid #1783FF',
    borderRadius: 6,
    padding: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    {data.data.label}
  </div>
);

// 3. 在 Graph 中使用
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
   {
    nodes: [
      { id: 'n1', style: { x: 100, y: 200 }, data: { label: '服务A' } },
      { id: 'n2', style: { x: 400, y: 200 },  { label: '服务B' } },
    ],
    edges: [{ source: 'n1', target: 'n2' }],
  },
  node: {
    type: 'react-node',
    style: {
      size: [120, 50],              // 必须指定尺寸
      component: (data) => <MyNode data={data} />,
    },
  },
  behaviors: ['drag-element', 'zoom-canvas', 'drag-canvas'],
});

graph.render();
```

> **重要：** React 节点必须通过 `style.size` 指定宽高（`[width, height]` 或单个数值），否则节点尺寸为 0。

### 响应内置交互状态

节点数据的 `states` 字段反映当前的内置状态（来自 `hover-activate`、`click-select` 等行为）：

```jsx
register(ExtensionCategory.NODE, 'react-node', ReactNode);

const StatefulNode = ({ data }) => {
  const isActive = data.states?.includes('active');
  const isSelected = data.states?.includes('selected');

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: isSelected ? '#fff7e6' : '#fff',
      border: `2px solid ${isActive ? '#1783FF' : '#ddd'}`,
      borderRadius: 6,
      padding: 8,
      boxShadow: isActive ? '0 0 8px rgba(24,144,255,0.6)' : 'none',
      transform: `scale(${isActive ? 1.05 : 1})`,
      transition: 'all 0.2s',
    }}>
      {data.data.label}
    </div>
  );
};

const graph = new Graph({
  node: {
    type: 'react-node',
    style: {
      size: [140, 60],
      component: (data) => <StatefulNode data={data} />,
    },
  },
  behaviors: ['hover-activate', 'click-select', 'drag-element'],
});
```

### 节点与图实例双向通信

将 `graph` 实例注入节点组件，实现节点内部操作触发图更新：

```jsx
register(ExtensionCategory.NODE, 'react-node', ReactNode);

const ActionNode = ({ data, graph }) => {
  const handleToggle = () => {
    graph.updateNodeData([{
      id: data.id,
      data: { expanded: !data.data.expanded },
    }]);
    graph.draw();
  };

  return (
    <div style={{ width: '100%', height: '100%', padding: 10, background: '#fff', border: '1px solid #d9d9d9', borderRadius: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{data.data.name}</div>
      {data.data.expanded && (
        <div style={{ fontSize: 12, color: '#666' }}>{data.data.detail}</div>
      )}
      <button onClick={handleToggle} style={{ marginTop: 6, fontSize: 12 }}>
        {data.data.expanded ? '收起' : '展开'}
      </button>
    </div>
  );
};

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
   {
    nodes: [
      {
        id: 'n1',
        style: { x: 100, y: 100 },
        data: { name: '服务器', detail: 'IP: 192.168.1.1 / 状态: 运行中', expanded: false },
      },
    ],
    edges: [],
  },
  node: {
    type: 'react-node',
    style: {
      size: (datum) => datum.data.expanded ? [200, 120] : [200, 60],
      component: (data) => <ActionNode data={data} graph={graph} />,
    },
  },
  behaviors: ['drag-element', 'zoom-canvas', 'drag-canvas'],
});

graph.render();
```

### 集成 Ant Design 组件

```jsx
import { Badge, Card, Tag } from 'antd';
import { DatabaseFilled } from '@ant-design/icons';
import { ExtensionCategory, Graph, register } from '@antv/g6';
import { ReactNode } from '@antv/g6-extension-react';

register(ExtensionCategory.NODE, 'react-node', ReactNode);

const ServerNode = ({ data }) => {
  const { status, type } = data.data;
  return (
    <Card
      size="small"
      style={{ width: '100%', height: '100%', borderRadius: 8 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><DatabaseFilled /> {data.id}</span>
        <Badge status={status} />
      </div>
      <Tag color={type === 'primary' ? 'blue' : 'default'}>{type}</Tag>
    </Card>
  );
};

const graph = new Graph({
  node: {
    type: 'react-node',
    style: {
      size: [200, 80],
      component: (data) => <ServerNode data={data} />,
    },
  },
});
```

---

## Vue 节点

```javascript
// 安装：npm install @antv/g6-extension-vue
import { ExtensionCategory, Graph, register } from '@antv/g6';
import { VueNode } from '@antv/g6-extension-vue';
import { defineComponent } from 'vue';

register(ExtensionCategory.NODE, 'vue-node', VueNode);

const MyVueNode = defineComponent({
  props: ['data'],
  template: `
    <div style="width:100%;height:100%;background:#fff;border:1px solid #1783FF;border-radius:6px;padding:8px;text-align:center">
      {{ data.data.label }}
    </div>
  `,
});

const graph = new Graph({
  node: {
    type: 'vue-node',
    style: {
      size: [120, 50],
      component: (data) => h(MyVueNode, { data }),
    },
  },
});
```

---

## 注意事项

1. **必须指定 size**：React/Vue 节点必须明确设置 `style.size`，可以是静态值或回调函数。
2. **节点膨胀/收缩时更新 size**：若节点展开后尺寸变化，size 需用回调 `size: (datum) => datum.data.expanded ? [w2, h2] : [w1, h1]`。
3. **性能上限**：React 节点渲染成本较高，不适合超过 500 个节点的场景，超量时改用内置节点。
4. **事件阻止冒泡**：React 组件内的点击事件如不想触发 G6 事件，需 `e.stopPropagation()`。
5. **销毁时清理**：在组件卸载时调用 `graph.destroy()` 防止内存泄漏。
