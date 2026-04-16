---
id: "g6-plugin-contextmenu-toolbar"
title: "G6 右键菜单（contextmenu）与工具栏（toolbar）"
description: |
  contextmenu：右键点击元素弹出操作菜单。
  toolbar：在画布角落显示工具栏按钮（缩放、适配、撤销等）。

library: "g6"
version: "5.x"
category: "plugins"
subcategory: "interaction"
tags:
  - "插件"
  - "右键菜单"
  - "工具栏"
  - "contextmenu"
  - "toolbar"

related:
  - "g6-plugin-tooltip"
  - "g6-plugin-history"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 右键菜单（contextmenu）

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [
       { id: 'n1', data: { label: '用户A' } },
       { id: 'n2', data: { label: '用户B' } },
    ],
    edges: [{ source: 'n1', target: 'n2' }],
  },
  node: {
    type: 'circle',
    style: {
      size: 40,
      fill: '#1783FF',
      stroke: '#fff',
      labelText: (d) => d.data.label,
      labelPlacement: 'bottom',
    },
  },
  layout: { type: 'circular' },
  behaviors: ['drag-canvas', 'zoom-canvas'],
  plugins: [
    {
      type: 'contextmenu',
      trigger: 'contextmenu',          // 'click' | 'contextmenu'（默认）
      // 返回菜单项列表
      getItems: (event) => {
        // 根据点击的元素类型返回不同菜单
        if (event.targetType === 'node') {
          return [
             { id: 'view',   value: 'view',   name: '查看详情' },
             { id: 'edit',   value: 'edit',   name: '编辑节点' },
             { id: 'delete', value: 'delete', name: '删除节点' },
          ];
        }
        if (event.targetType === 'edge') {
          return [
             { id: 'delete', value: 'delete', name: '删除边' },
          ];
        }
        // 点击画布
        return [
           { id: 'fit',   value: 'fit',   name: '适配视图' },
           { id: 'reset', value: 'reset', name: '重置视图' },
        ];
      },
      // 菜单项点击回调
      onClick: (value, target, current) => {
        if (value === 'delete') {
          const id = current.id;
          if (current.targetType === 'node') {
            graph.removeNodeData([id]);
          } else {
            graph.removeEdgeData([id]);
          }
          graph.draw();
        }
        if (value === 'fit') {
          graph.fitView();
        }
      },
      // 偏移量 [x, y]
      offset: [4, 4],
    },
  ],
});

graph.render();
```

### contextmenu 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `trigger` | `'click' \| 'contextmenu'` | `'contextmenu'` | 触发方式 |
| `getItems` | `(event) => Item[] \| Promise<Item[]>` | — | 菜单项生成函数（与 `getContent` 二选一） |
| `getContent` | `(event) => HTMLElement \| string` | — | 完全自定义菜单 HTML |
| `onClick` | `(value, target, current) => void` | — | 点击菜单项回调 |
| `offset` | `[number, number]` | `[4, 4]` | 菜单偏移 |
| `enable` | `boolean \| ((event) => boolean)` | `true` | 是否启用 |
| `className` | `string` | `'g6-contextmenu'` | 菜单容器 CSS 类名 |

---

## 工具栏（toolbar）

```javascript
plugins: [
  {
    type: 'toolbar',
    position: 'top-right',             // 工具栏位置
    getItems: () => [
       { id: 'zoom-in',   value: 'zoom-in',   name: '放大' },
       { id: 'zoom-out',  value: 'zoom-out',  name: '缩小' },
       { id: 'fit',       value: 'fit',       name: '适配视图' },
       { id: 'undo',      value: 'undo',      name: '撤销' },
       { id: 'redo',      value: 'redo',      name: '重做' },
       { id: 'download',  value: 'download',  name: '导出图片' },
    ],
    onClick: async (value) => {
      if (value === 'zoom-in') await graph.zoomTo(graph.getZoom() * 1.2);
      if (value === 'zoom-out') await graph.zoomTo(graph.getZoom() / 1.2);
      if (value === 'fit') await graph.fitView();
    },
    // 自定义样式
    style: {
      display: 'flex',
      gap: '4px',
      padding: '4px',
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      borderRadius: '4px',
    },
  },
],
```

### toolbar 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `position` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'top-left'` | 工具栏位置 |
| `getItems` | `() => ToolbarItem[] \| Promise<ToolbarItem[]>` | — | **必填**，工具项列表 |
| `onClick` | `(value: string, target: Element) => void` | — | 点击回调 |
| `className` | `string` | — | 工具栏 CSS 类名 |
| `style` | `Partial<CSSStyleDeclaration>` | — | 工具栏容器样式 |

**ToolbarItem：**
```typescript
interface ToolbarItem {
  id: string;
  value: string;     // 点击回调的 value 参数
  name?: string;     // 显示文字或 title
  icon?: string;     // SVG 图标字符串
}
```
