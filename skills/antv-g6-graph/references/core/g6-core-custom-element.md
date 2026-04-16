---
id: "g6-core-custom-element"
title: "G6 自定义节点与自定义边"
description: |
  通过继承 BaseNode / BaseEdge 并调用 register() 注册自定义元素类型，
  实现复杂业务形状的图节点和边。

library: "g6"
version: "5.x"
category: "core"
subcategory: "customization"
tags:
  - "自定义节点"
  - "自定义边"
  - "register"
  - "BaseNode"
  - "BaseEdge"
  - "扩展"

related:
  - "g6-node-circle"
  - "g6-node-html"
  - "g6-edge-line"
  - "g6-core-graph-api"

use_cases:
  - "业务卡片节点（带图表的节点）"
  - "带标注的特殊形状边"
  - "自定义连接点逻辑"

anti_patterns:
  - "能用内置节点 + 样式配置实现的，不要自定义"
  - "频繁更新数据时避免在自定义节点中做复杂 DOM 操作"

difficulty: "advanced"
completeness: "full"
created: "2026-04-15"
updated: "2026-04-15"
---

## 自定义节点

### 基础结构

```javascript
import {
  BaseNode,
  ExtensionCategory,
  Graph,
  register,
  Rect,
  Text,
  Circle,
} from '@antv/g6';

class StatusNode extends BaseNode {
  // getKeyShape 返回节点的主要形状（必须实现）
  // 也可以重写 render() 获得完全控制权
  
  /**
   * 绘制节点主体
   */
  render(attributes, container) {
    super.render(attributes, container);
    
    const [width, height] = this.getSize(attributes);
    const { status, label } = attributes;
    
    // 使用 upsert 方法创建/更新形状（第一参数为 key，第二参数为构造函数，第三参数为属性）
    // 主体矩形（会替代默认的 key 形状）
    this.upsert('key', Rect, {
      x: -width / 2,
      y: -height / 2,
      width,
      height,
      fill: this.getStatusColor(status),
      stroke: '#fff',
      lineWidth: 2,
      radius: 6,
    }, container);
    
    // 状态指示点
    this.upsert('status-dot', Circle, {
      cx: width / 2 - 8,
      cy: -height / 2 + 8,
      r: 5,
      fill: status === 'online' ? '#52c41a' : '#ff4d4f',
    }, container);
    
    // 标签（覆盖默认标签行为）
    this.upsert('label', Text, {
      x: 0,
      y: 0,
      text: label || attributes.id,
      fill: '#fff',
      fontSize: 13,
      fontWeight: 'bold',
      textAlign: 'center',
      textBaseline: 'middle',
    }, container);
  }
  
  getStatusColor(status) {
    const colors = { online: '#52c41a', offline: '#ff4d4f', idle: '#faad14' };
    return colors[status] || '#1783FF';
  }
  
  // 返回节点默认大小
  getDefaultStyle() {
    return { size: [120, 50] };
  }
}

// 注册自定义节点类型
register(ExtensionCategory.NODE, 'status-node', StatusNode);

// 使用
const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [
       { id: 'server1', data: { label: 'Web Server', status: 'online' } },
       { id: 'server2', data: { label: 'DB Server', status: 'offline' } },
       { id: 'server3', data: { label: 'Cache', status: 'idle' } },
    ],
    edges: [
       { source: 'server1', target: 'server2' },
       { source: 'server1', target: 'server3' },
    ],
  },
  node: {
    type: 'status-node',
    style: {
      size: [130, 50],
      // 自定义属性通过 style 或直接写在 node 配置中
      status: (d) => d.data.status,
      label: (d) => d.data.label,
    },
  },
  layout: { type: 'dagre', rankdir: 'LR' },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

graph.render();
```

### 关键 API

```typescript
// upsert(key, Shape, attrs, container) - 创建或更新子形状
this.upsert('shape-key', Rect, { x, y, width, height, fill }, container);

// 获取节点尺寸
const [width, height] = this.getSize(attributes);

// 获取 shapeMap（已渲染的所有形状）
const allShapes = this.shapeMap;

// 节点中心坐标（世界坐标系）
const { x, y } = this.getPosition();
```

---

## 自定义边

```javascript
import {
  BaseEdge,
  ExtensionCategory,
  Graph,
  register,
  Path,
} from '@antv/g6';

class ArrowEdge extends BaseEdge {
  /**
   * 返回边的 SVG Path 数据（必须实现）
   */
  getKeyPath(attributes) {
    const { sourcePoint, targetPoint } = attributes;
    
    if (!sourcePoint || !targetPoint) return [['M', 0, 0]];
    
    const [sx, sy] = sourcePoint;
    const [tx, ty] = targetPoint;
    
    // 折线路径：水平 -> 垂直 -> 水平
    const midX = (sx + tx) / 2;
    
    return [
      ['M', sx, sy],
      ['L', midX, sy],
      ['L', midX, ty],
      ['L', tx, ty],
    ];
  }
}

register(ExtensionCategory.EDGE, 'arrow-edge', ArrowEdge);

const graph = new Graph({
  // ...
  edge: {
    type: 'arrow-edge',
    style: {
      stroke: '#aaa',
      lineWidth: 1.5,
      endArrow: true,
    },
  },
});
```

### 自定义边动画（蚂蚁线）

`super.render()` 后通过 `this.shapeMap['key']` 拿到主形状，再调用 Web Animations API：

```javascript
import { BaseEdge, ExtensionCategory, Graph, register } from '@antv/g6';

class DashEdge extends BaseEdge {
  getKeyPath(attributes) {
    const { sourcePoint, targetPoint } = attributes;
    if (!sourcePoint || !targetPoint) return [['M', 0, 0]];
    const [sx, sy] = sourcePoint;
    const [tx, ty] = targetPoint;
    return [['M', sx, sy], ['L', tx, ty]];
  }

  render(attributes, container) {
    super.render(attributes, container);

    const keyShape = this.shapeMap['key'];
    if (keyShape) {
      keyShape.style.lineDash = [10, 10];
      // 蚂蚁线：通过 lineDashOffset 偏移实现流动效果
      keyShape.animate(
        [{ lineDashOffset: 0 }, { lineDashOffset: -20 }],
        { duration: 1000, iterations: Infinity },
      );
    }
  }
}

register(ExtensionCategory.EDGE, 'line-dash', DashEdge);

const graph = new Graph({
  container: 'container',
  width: 800, height: 600,
  data: {
    nodes: [
      { id: 'n1', data: { label: '开始' } },
      { id: 'n2', data: { label: '结束' } },
    ],
    edges: [{ source: 'n1', target: 'n2' }],
  },
  edge: {
    type: 'line-dash',
    style: { stroke: '#999', lineWidth: 2 },
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});
graph.render();
```

---

## 注册类型汇总

```javascript
import { ExtensionCategory, register } from '@antv/g6';

// 注册自定义节点
register(ExtensionCategory.NODE, 'my-node', MyNodeClass);

// 注册自定义边
register(ExtensionCategory.EDGE, 'my-edge', MyEdgeClass);

// 注册自定义 combo
register(ExtensionCategory.COMBO, 'my-combo', MyComboClass);

// 注册自定义布局
register(ExtensionCategory.LAYOUT, 'my-layout', MyLayoutClass);

// 注册自定义行为
register(ExtensionCategory.BEHAVIOR, 'my-behavior', MyBehaviorClass);

// 注册自定义插件
register(ExtensionCategory.PLUGIN, 'my-plugin', MyPluginClass);
```

---

## 自定义节点动画

在 `render()` 中通过 `upsert` 拿到形状引用后，调用 Web Animations API 的 `.animate()`：

```javascript
import { BaseNode, Circle, Text, ExtensionCategory, Graph, register } from '@antv/g6';

class BreathingCircleNode extends BaseNode {
  render(attributes, container) {
    super.render(attributes, container);

    const { color = '#1783FF', label } = attributes;

    // upsert 返回形状实例
    const circle = this.upsert('key', Circle, {
      cx: 0, cy: 0, r: 20,
      fill: color, stroke: '#fff', lineWidth: 2,
    }, container);

    // Web Animations API — 属性名与 @antv/g 形状属性一致
    circle.animate(
      [
        { r: 20, fill: color },
        { r: 25, fill: `${color}DD` },
        { r: 20, fill: color },
      ],
      { duration: 2000, iterations: Infinity },
    );

    if (label) {
      this.upsert('label', Text, {
        x: 0, y: 35,
        text: label, fill: '#333',
        fontSize: 12, textAlign: 'center', textBaseline: 'middle',
      }, container);
    }
  }
}

register(ExtensionCategory.NODE, 'breathing-circle', BreathingCircleNode);

const graph = new Graph({
  container: 'container',
  width: 800, height: 600,
  data: {
    nodes: [
      { id: 'n1', data: { label: '节点1', color: '#1783FF' } },
      { id: 'n2', data: { label: '节点2', color: '#FF6B6B' } },
    ],
    edges: [{ source: 'n1', target: 'n2' }],
  },
  node: {
    type: 'breathing-circle',
    style: {
      color: (d) => d.data.color,
      label: (d) => d.data.label,
    },
  },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});
graph.render();
```

---

## 常见错误

### 错误：使用已移除的 extend API

```javascript
// ❌ extend 已从 G6 v5 正式版移除，调用报 "extend is not a function"
import { Graph, extend } from '@antv/g6';
const ExtGraph = extend(Graph, { nodes: { 'my-node': MyNodeFn } });

// ✅ 使用 BaseNode + register
import { BaseNode, ExtensionCategory, register } from '@antv/g6';
class MyNode extends BaseNode { /* ... */ }
register(ExtensionCategory.NODE, 'my-node', MyNode);
```

### 错误：忘记调用 register 就使用自定义类型

```javascript
// ❌ 没有 register，G6 不认识 'my-node'
const graph = new Graph({
  node: { type: 'my-node' },
});

// ✅ 先 register，再使用
register(ExtensionCategory.NODE, 'my-node', MyNode);
const graph = new Graph({
  node: { type: 'my-node' },
});
```

### 错误：在 render 中直接操作 DOM（应使用 upsert）

```javascript
// ❌ 直接操作 DOM 不受 G6 渲染周期管理
render(attributes, container) {
  const div = document.createElement('div');
  container.appendChild(div);
}

// ✅ 使用 upsert 管理形状生命周期
render(attributes, container) {
  this.upsert('my-shape', Rect, { x: 0, y: 0 }, container);
}
```

### 错误：在 render 中通过 attributes.data 读取节点业务数据 → 白屏

```javascript
// ❌ attributes 是计算后的样式属性集合，不包含节点的 data 字段
// attributes.data 为 undefined，访问 data.color 抛 TypeError → 白屏
render(attributes, container) {
  const { data } = attributes;        // undefined！
  const color = data.color;           // TypeError: Cannot read properties of undefined
}

// ✅ 通过 node.style 回调把 data 映射为样式属性，在 attributes 中直接读取
// 第一步：在 Graph 配置的 node.style 中把数据映射为自定义属性
node: {
  type: 'my-node',
  style: {
    color: (d) => d.data.color,   // 映射为 attributes.color
    label: (d) => d.data.label,   // 映射为 attributes.label
  },
},
// 第二步：在 render() 里直接解构 attributes
render(attributes, container) {
  const { color = '#1783FF', label } = attributes;  // ✅ 正确读取
}
```

### 错误：upsert key 与默认形状冲突导致双重渲染

```javascript
// ❌ key 不是 'key'，super.render() 已创建默认 'key' 形状，
//    再 upsert('circle', ...) 会叠加一个额外圆形
render(attributes, container) {
  super.render(attributes, container);
  this.upsert('circle', Circle, { cx: 0, cy: 0, r: 20 }, container);  // 双圆！
}

// ✅ 使用 'key' 替换默认主形状
render(attributes, container) {
  super.render(attributes, container);
  this.upsert('key', Circle, { cx: 0, cy: 0, r: 20 }, container);  // 替换默认形状
}
```

### 错误：动画使用 CSS 属性（scale）而非形状属性

```javascript
// ❌ scale 是 CSS transform，@antv/g 形状 animate() 使用形状自身的属性名
circle.animate(
  [{ scale: 1 }, { scale: 1.1 }, { scale: 1 }],  // 静默忽略，无任何效果
  { duration: 2000, iterations: Infinity }
);

// ✅ 动画 Circle 形状时使用 r / fill / stroke 等形状属性
circle.animate(
  [{ r: 20 }, { r: 25 }, { r: 20 }],
  { duration: 2000, iterations: Infinity }
);
```
