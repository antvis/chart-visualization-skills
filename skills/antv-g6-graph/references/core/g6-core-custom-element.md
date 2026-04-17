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
  /**
   * 绘制节点主体
   * 重写 render() 获得完全控制权，需自行管理所有子形状
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
      // 自定义属性通过 style 回调映射
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

## 继承内置节点扩展（推荐）

对于简单的样式扩展（如添加动画、光晕效果），推荐继承内置节点（如 `Circle`、`Rect`）而非 `BaseNode`，可以复用内置节点的绘制逻辑：

```javascript
import { Circle, ExtensionCategory, Graph, register } from '@antv/g6';

// 继承内置 Circle 节点，添加呼吸动画光晕
class BreathingCircle extends Circle {
  // onCreate 在元素完成创建并执行完入场动画后调用
  // 适合启动循环动画，避免与入场动画冲突
  onCreate() {
    const halo = this.shapeMap.halo;
    if (halo) {
      halo.animate([{ lineWidth: 0 }, { lineWidth: 20 }], {
        duration: 1000,
        iterations: Infinity,
        direction: 'alternate',
      });
    }
  }
}

register(ExtensionCategory.NODE, 'breathing-circle', BreathingCircle);

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  data: {
    nodes: [
      { id: 'node-0' },
      { id: 'node-1' },
      { id: 'node-2' },
      { id: 'node-3' },
    ],
  },
  node: {
    type: 'breathing-circle',
    style: {
      size: 50,
      halo: true,  // 开启光晕形状
    },
    palette: ['#3875f6', '#efb041', '#ec5b56', '#72c240'],
  },
  layout: {
    type: 'grid',
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});

graph.render();
```

### 生命周期钩子

自定义节点/边支持以下生命周期钩子：

```typescript
class MyNode extends BaseNode {
  /**
   * 在元素完成创建并执行完入场动画后调用
   * 适合启动循环动画、绑定事件等一次性初始化操作
   */
  onCreate() {
    const keyShape = this.shapeMap['key'];
    // 启动呼吸动画
    keyShape.animate(
      [{ r: 20 }, { r: 25 }, { r: 20 }],
      { duration: 2000, iterations: Infinity }
    );
  }

  /**
   * 在元素更新并执行完过渡动画后调用
   */
  onUpdate() {
    console.log('Node updated:', this.id);
  }

  /**
   * 在元素完成退场动画并销毁后调用
   */
  onDestroy() {
    console.log('Node destroyed:', this.id);
  }
}
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
   * 使用 this.getEndpoints(attributes) 获取起点和终点坐标
   */
  getKeyPath(attributes) {
    // 获取起点和终点坐标（已考虑连接桩、节点边界等因素）
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes, false);
    
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
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes);
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

## 常见错误与修正

### 错误：在 render() 中启动循环动画导致白屏或动画异常

```javascript
// ❌ render() 在元素创建和更新时都会被调用，在此处启动动画会导致：
//    1. 动画重复启动，性能问题
//    2. 与入场动画冲突，可能导致白屏
//    3. 更新时动画被重置
class BreathingNode extends BaseNode {
  render(attributes, container) {
    super.render(attributes, container);
    const circle = this.upsert('key', Circle, { cx: 0, cy: 0, r: 30 }, container);
    
    // 错误：在 render 中启动动画
    circle.animate(
      [{ r: 30 }, { r: 40 }, { r: 30 }],
      { duration: 2000, iterations: Infinity }
    );
  }
}

// ✅ 使用 onCreate 生命周期钩子，在入场动画完成后启动循环动画
class BreathingNode extends BaseNode {
  render(attributes, container) {
    super.render(attributes, container);
    this.upsert('key', Circle, { cx: 0, cy: 0, r: 30 }, container);
  }
  
  onCreate() {
    const keyShape = this.shapeMap['key'];
    keyShape.animate(
      [{ r: 30 }, { r: 40 }, { r: 30 }],
      { duration: 2000, iterations: Infinity }
    );
  }
}

// ✅ 或者继承内置节点，利用内置的 halo 形状实现呼吸效果（推荐）
class BreathingCircle extends Circle {
  onCreate() {
    const halo = this.shapeMap.halo;
    if (halo) {
      halo.animate(
        [{ lineWidth: 0 }, { lineWidth: 20 }, { lineWidth: 0 }],
        { duration: 2000, iterations: Infinity }
      );
    }
  }
}
```

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

### 错误：自定义边中直接访问 attributes.sourcePoint → 白屏

```javascript
// ❌ attributes 中不存在 sourcePoint / targetPoint 属性
// 直接访问返回 undefined，解构赋值后计算会抛出异常导致白屏
class MyEdge extends BaseEdge {
  getKeyPath(attributes) {
    const { sourcePoint, targetPoint } = attributes;  // undefined!
    const [sx, sy] = sourcePoint;  // TypeError: Cannot read properties of undefined
    return [['M', sx, sy], ['L', tx, ty]];
  }
}

// ✅ 使用 this.getEndpoints(attributes) 获取起点和终点
class MyEdge extends BaseEdge {
  getKeyPath(attributes) {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes, false);
    const [sx, sy] = sourcePoint;
    const [tx, ty] = targetPoint;
    return [['M', sx, sy], ['L', tx, ty]];
  }
}
```
</skill>