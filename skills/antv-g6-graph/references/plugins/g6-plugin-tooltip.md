---
id: "g6-plugin-tooltip"
title: "G6 Tooltip 插件"
description: |
  使用 tooltip 插件在悬停/点击节点或边时显示详细信息面板。
  支持自定义 HTML 内容、位置、触发方式等。

library: "g6"
version: "5.x"
category: "plugins"
subcategory: "interaction"
tags:
  - "插件"
  - "tooltip"
  - "提示"
  - "悬停"
  - "信息面板"
  - "plugin"

related:
  - "g6-plugin-minimap"
  - "g6-behavior-click-select"

use_cases:
  - "悬停节点显示详细属性"
  - "悬停边显示关系信息"
  - "点击元素显示操作面板"

anti_patterns:
  - "tooltip 内容过多时影响性能，考虑侧边栏面板替代"

difficulty: "beginner"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
author: "antv-team"
source_url: "https://g6.antv.antgroup.com/manual/plugin/tooltip"
---

## 最小可运行示例

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  width: 640,
  height: 480,
  data: {
    nodes: [
       { id: 'n1', data: { name: '张三', age: 28, dept: '工程部' } },
       { id: 'n2', data: { name: '李四', age: 35, dept: '产品部' } },
    ],
    edges: [
       { id: 'e1', source: 'n1', target: 'n2', data: { relation: '同事', since: 2020 } },
    ],
  },
  node: {
    type: 'circle',
    style: {
      size: 40,
      fill: '#1783FF',
      labelText: (d) => d.data.name,
      labelPlacement: 'bottom',
    },
  },
  layout: { type: 'force' },
  behaviors: ['drag-canvas', 'zoom-canvas'],
  plugins: [
    {
      type: 'tooltip',
      // 自定义 tooltip 内容
      getContent: (event, items) => {
        const item = items[0];
        if (!item) return '';
        
        const { data } = item;
        return `
          <div style="padding: 8px 12px; min-width: 120px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${data.name || item.id}</div>
            ${data.age ? `<div>年龄：${data.age}</div>` : ''}
            ${data.dept ? `<div>部门：${data.dept}</div>` : ''}
            ${data.relation ? `<div>关系：${data.relation}</div>` : ''}
          </div>
        `;
      },
    },
  ],
});

graph.render();
```

## 常用变体

### 分节点/边显示不同内容

```javascript
plugins: [
  {
    type: 'tooltip',
    trigger: 'hover',             // 'hover' | 'click'
    position: 'right',            // 'top' | 'bottom' | 'left' | 'right' | 'top-left' 等
    enable: (event) => {
      // 只对节点显示 tooltip
      return event.targetType === 'node';
    },
    getContent: (event, items) => {
      const [item] = items;
      const d = item.data;
      return `
        <div style="background:#fff;border:1px solid #eee;padding:12px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.1)">
          <h4 style="margin:0 0 8px">${d.name}</h4>
          <table style="border-collapse:collapse">
            ${Object.entries(d).map(([k, v]) => `
              <tr>
                <td style="color:#999;padding:2px 8px 2px 0">${k}</td>
                <td style="font-weight:500">${v}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    },
  },
],
```

### 点击触发 tooltip

```javascript
plugins: [
  {
    type: 'tooltip',
    trigger: 'click',             // 点击触发
    enterable: true,              // 鼠标可以进入 tooltip 内部
    getContent: (event, items) => {
      const [item] = items;
      return `<div style="padding:8px">
        <a href="/detail/${item.id}" target="_blank">查看详情</a>
      </div>`;
    },
  },
],
```

## 参数参考

```typescript
interface TooltipOptions {
  trigger?: 'hover' | 'click';          // 触发方式，默认 'hover'
  position?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  enable?: boolean | ((event) => boolean);
  getContent?: (event: IPointerEvent, items: ElementDatum[]) => HTMLElement | string;
  onOpenChange?: (open: boolean) => void;
  offset?: [number, number];            // 偏移量 [x, y]
  enterable?: boolean;                  // 鼠标是否可以进入 tooltip
  title?: string | ((items) => string); // tooltip 标题
  container?: HTMLElement;              // 自定义容器
  style?: {                             // 样式
    ['.g6-tooltip']?: CSSProperties;
  };
}
```
