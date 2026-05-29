---
id: "x6-pattern-uml"
title: "X6 UML 类图"
description: |
  使用 X6 构建 UML 类图的最佳实践：类/接口节点、属性和方法分区、继承/实现/关联/依赖等关系连线。

library: "x6"
version: "3.x"
category: "patterns"
subcategory: "uml"
tags:
  - "UML"
  - "类图"
  - "class diagram"
  - "继承"
  - "接口"
  - "关联"

related:
  - "x6-intermediate-custom-node"
  - "x6-core-edge"
  - "x6-core-ports"
  - "x6-intermediate-custom-edge"

use_cases:
  - "软件架构类图"
  - "类继承关系展示"
  - "接口实现关系"
  - "类属性和方法展示"

difficulty: "advanced"
completeness: "full"
---

## 场景特点

UML 类图的核心特征：
- **分区节点**：每个类节点分为三部分——类名、属性列表、方法列表
- **关系连线**：继承（空心三角箭头）、实现（虚线+空心三角）、关联（实线）、依赖（虚线箭头）
- **可见性标记**：`+`（public）、`-`（private）、`#`（protected）
- **端口连接**：连线通常连接到节点四边

## 注册 UML 类节点

使用 `Shape.HTML.register()` 注册自定义 HTML 节点实现分区效果：

```javascript
import { Graph, Shape } from '@antv/x6';

Shape.HTML.register({
  shape: 'uml-class',
  effect: ['data'],  // data 变化时重新渲染
  html(node) {
    const data = node.getData() || {};
    const { className, stereotype, attributes, methods } = data;

    const div = document.createElement('div');
    div.style.cssText = 'width:100%;height:100%;border:2px solid #333;background:#fff;font-family:monospace;font-size:12px;display:flex;flex-direction:column;overflow:hidden;';

    // 类名区
    const header = document.createElement('div');
    header.style.cssText = 'padding:6px 8px;text-align:center;font-weight:bold;border-bottom:1px solid #333;';
    if (stereotype) {
      header.innerHTML = `<div style="font-size:10px;font-style:italic;">\u00AB${stereotype}\u00BB</div>`;
    }
    header.innerHTML += `<div>${className || 'ClassName'}</div>`;
    div.appendChild(header);

    // 属性区
    const attrSection = document.createElement('div');
    attrSection.style.cssText = 'padding:4px 8px;border-bottom:1px solid #333;min-height:20px;';
    (attributes || []).forEach((attr) => {
      const line = document.createElement('div');
      line.textContent = attr;
      attrSection.appendChild(line);
    });
    div.appendChild(attrSection);

    // 方法区
    const methodSection = document.createElement('div');
    methodSection.style.cssText = 'padding:4px 8px;min-height:20px;';
    (methods || []).forEach((method) => {
      const line = document.createElement('div');
      line.textContent = method;
      methodSection.appendChild(line);
    });
    div.appendChild(methodSection);

    return div;
  },
});
```

## 完整示例：类继承关系

```javascript
import { Graph, Shape } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 900,
  height: 700,
  background: { color: '#fff' },
  grid: { visible: true, size: 10 },
  panning: { enabled: true, modifiers: 'ctrl' },
  mousewheel: { enabled: true, modifiers: 'ctrl' },
  connecting: {
    router: 'orth',
    connector: 'rounded',
  },
});

// 基类 Animal
const animal = graph.addNode({
  shape: 'uml-class',
  x: 300,
  y: 50,
  width: 220,
  height: 140,
  data: {
    className: 'Animal',
    stereotype: 'abstract',
    attributes: [
      '# name: String',
      '# age: int',
    ],
    methods: [
      '+ getName(): String',
      '+ setName(name: String): void',
      '+ makeSound(): void {abstract}',
    ],
  },
});

// 子类 Dog
const dog = graph.addNode({
  shape: 'uml-class',
  x: 100,
  y: 300,
  width: 220,
  height: 120,
  data: {
    className: 'Dog',
    attributes: [
      '- breed: String',
    ],
    methods: [
      '+ makeSound(): void',
      '+ fetch(): void',
    ],
  },
});

// 子类 Cat
const cat = graph.addNode({
  shape: 'uml-class',
  x: 450,
  y: 300,
  width: 220,
  height: 120,
  data: {
    className: 'Cat',
    attributes: [
      '- indoor: boolean',
    ],
    methods: [
      '+ makeSound(): void',
      '+ purr(): void',
    ],
  },
});

// 接口
const serializable = graph.addNode({
  shape: 'uml-class',
  x: 600,
  y: 50,
  width: 200,
  height: 100,
  data: {
    className: 'Serializable',
    stereotype: 'interface',
    attributes: [],
    methods: [
      '+ serialize(): String',
      '+ deserialize(s: String): void',
    ],
  },
});

// 继承关系：空心三角箭头
graph.addEdge({
  source: dog.id,
  target: animal.id,
  attrs: {
    line: {
      stroke: '#333',
      strokeWidth: 1.5,
      targetMarker: {
        name: 'path',
        d: 'M 0 -8 L 12 0 L 0 8 Z',
        fill: '#fff',
        stroke: '#333',
        strokeWidth: 1.5,
      },
    },
  },
  router: 'orth',
  connector: 'rounded',
});

graph.addEdge({
  source: cat.id,
  target: animal.id,
  attrs: {
    line: {
      stroke: '#333',
      strokeWidth: 1.5,
      targetMarker: {
        name: 'path',
        d: 'M 0 -8 L 12 0 L 0 8 Z',
        fill: '#fff',
        stroke: '#333',
        strokeWidth: 1.5,
      },
    },
  },
  router: 'orth',
  connector: 'rounded',
});

// 实现关系：虚线 + 空心三角箭头
graph.addEdge({
  source: cat.id,
  target: serializable.id,
  attrs: {
    line: {
      stroke: '#333',
      strokeWidth: 1.5,
      strokeDasharray: '8 4',
      targetMarker: {
        name: 'path',
        d: 'M 0 -8 L 12 0 L 0 8 Z',
        fill: '#fff',
        stroke: '#333',
        strokeWidth: 1.5,
      },
    },
  },
  router: 'orth',
  connector: 'rounded',
});
```

## 使用 SVG 节点替代方案

如果不需要 HTML 的复杂渲染，可以用纯 SVG markup 实现简化版：

```javascript
Graph.registerNode('uml-class-simple', {
  inherit: 'rect',
  width: 200,
  height: 120,
  attrs: {
    body: { fill: '#fff', stroke: '#333', strokeWidth: 2 },
    label: {
      text: 'ClassName',
      fontSize: 14,
      fontWeight: 'bold',
      fill: '#333',
      refY: 16,
      refX: 0.5,
    },
  },
}, true);
```

## UML 关系连线样式

| 关系类型 | 线条样式 | 箭头 |
|----------|----------|------|
| 继承（Generalization） | 实线 | 空心三角 |
| 实现（Realization） | 虚线 `strokeDasharray: '8 4'` | 空心三角 |
| 关联（Association） | 实线 | 普通箭头或无 |
| 依赖（Dependency） | 虚线 `strokeDasharray: '5 3'` | 开放箭头 `'classic'` |
| 聚合（Aggregation） | 实线 | 空心菱形 |
| 组合（Composition） | 实线 | 实心菱形 |

### 自定义菱形箭头（聚合/组合）

```javascript
// 空心菱形（聚合）
targetMarker: {
  name: 'path',
  d: 'M 0 0 L 8 -5 L 16 0 L 8 5 Z',
  fill: '#fff',
  stroke: '#333',
  strokeWidth: 1.5,
}

// 实心菱形（组合）
targetMarker: {
  name: 'path',
  d: 'M 0 0 L 8 -5 L 16 0 L 8 5 Z',
  fill: '#333',
  stroke: '#333',
  strokeWidth: 1.5,
}
```

## 最佳实践

1. **HTML 节点用于复杂分区**：属性、方法列表多时用 HTML 节点灵活度更高
2. **正交路由**：`router: 'orth'` 保持连线整齐
3. **节点高度动态计算**：`height = headerHeight + attrCount * lineHeight + methodCount * lineHeight`
4. **继承箭头朝向父类**：source 是子类，target 是父类
5. **虚线表示弱关系**：实现、依赖用虚线，继承、关联用实线
