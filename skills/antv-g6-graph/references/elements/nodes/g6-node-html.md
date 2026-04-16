---
id: "g6-node-html"
title: "G6 HTML 节点"
description: |
  使用 html 类型节点在图中渲染任意 HTML 内容，适合富文本、按钮、
  表单等复杂 UI 节点场景。

library: "g6"
version: "5.x"
category: "elements"
subcategory: "nodes"
tags:
  - "节点"
  - "html"
  - "富文本"
  - "自定义节点"
  - "HTML"

related:
  - "g6-node-circle"
  - "g6-node-rect"
  - "g6-core-custom-element"

use_cases:
  - "卡片式节点（含图片、文字、按钮）"
  - "节点内嵌 input/select 表单"
  - "复杂多行文本展示"

anti_patterns:
  - "节点数量多（>500）时 HTML 节点性能较差，考虑改用 canvas 节点 + 自定义形状"
  - "不要在 innerHTML 中使用用户输入内容（XSS 风险）"

difficulty: "intermediate"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 核心概念

`html` 节点使用 `foreignObject`（SVG）或 DOM overlay 来渲染 HTML 内容。

**关键属性：**
- `innerHTML`：必填，HTML 字符串或 `HTMLElement`
- `size`：节点尺寸 `[width, height]`，默认 `[160, 80]`
- `dx`/`dy`：水平/垂直偏移

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
        id: 'card1',
         {
          name: '张三',
          role: '前端工程师',
          avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=1',
        },
      },
      {
        id: 'card2',
        data: {
          name: '李四',
          role: '后端工程师',
          avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=2',
        },
      },
    ],
    edges: [{ source: 'card1', target: 'card2' }],
  },
  node: {
    type: 'html',
    style: {
      size: [160, 80],
      // innerHTML 接收回调函数，动态生成 HTML
      innerHTML: (d) => `
        <div style="
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          width: 156px;
          box-sizing: border-box;
          gap: 8px;
        ">
          <img src="${d.data.avatar}" width="36" height="36"
               style="border-radius: 50%; flex-shrink: 0;" />
          <div>
            <div style="font-weight: 600; font-size: 13px; color: #333;">
              ${d.data.name}
            </div>
            <div style="font-size: 11px; color: #999; margin-top: 2px;">
              ${d.data.role}
            </div>
          </div>
        </div>
      `,
    },
  },
  layout: { type: 'dagre', rankdir: 'LR', nodesep: 40, ranksep: 80 },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```

## 常用变体

### 带状态高亮的 HTML 节点

```javascript
node: {
  type: 'html',
  style: {
    size: [180, 90],
    innerHTML: (d) => `
      <div id="node-${d.id}" style="
        padding: 12px 16px;
        background: #fff;
        border: 2px solid #d9d9d9;
        border-radius: 8px;
        font-size: 13px;
        transition: border-color 0.2s;
      ">
        <div style="font-weight: bold;">${d.data.title}</div>
        <div style="color: #666; margin-top: 4px;">${d.data.desc}</div>
      </div>
    `,
  },
},
```

### 节点内嵌按钮（处理 DOM 事件）

```javascript
node: {
  type: 'html',
  style: {
    size: [200, 100],
    innerHTML: (d) => {
      const div = document.createElement('div');
      div.style.cssText = 'padding:12px;background:#fff;border:1px solid #eee;border-radius:8px;';
      div.innerHTML = `<div>${d.data.label}</div>`;
      
      const btn = document.createElement('button');
      btn.textContent = '详情';
      btn.style.cssText = 'margin-top:8px;padding:2px 12px;cursor:pointer;';
      // 阻止事件冒泡到图画布，避免触发拖拽等行为
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('节点详情:', d.id);
      });
      div.appendChild(btn);
      return div;
    },
  },
},
```

## 参数参考

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `innerHTML` | `string \| HTMLElement \| ((d: NodeData) => string \| HTMLElement)` | — | **必填**，HTML 内容 |
| `size` | `[number, number]` | `[160, 80]` | 节点宽高 |
| `dx` | `number` | `0` | 水平偏移 |
| `dy` | `number` | `0` | 垂直偏移 |
| `pointerEvents` | `string` | `'auto'` | 鼠标事件穿透控制 |

## 常见错误

### 错误1：innerHTML 中使用用户输入（XSS）

```javascript
// ❌ 危险：直接插入用户输入
innerHTML: (d) => `<div>${d.data.userInput}</div>`

// ✅ 使用 textContent 或转义
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
innerHTML: (d) => `<div>${escapeHtml(d.data.userInput)}</div>`
```

### 错误2：忘记设置 size 导致节点过小

```javascript
// ❌ 默认 size 可能不够容纳内容
node: {
  type: 'html',
  style: { innerHTML: '<div style="padding:20px">大量内容...</div>' },
}

// ✅ 明确设置 size
node: {
  type: 'html',
  style: {
    size: [240, 120],
    innerHTML: '<div style="padding:20px">大量内容...</div>',
  },
}
```
