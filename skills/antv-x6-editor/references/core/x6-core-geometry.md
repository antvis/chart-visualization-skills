---
id: "x6-core-geometry"
title: "X6 Geometry 几何工具"
description: |
  X6 内置的几何工具集，包括 Point / Line / Rectangle / Ellipse / Polyline / Path / Curve
  以及 Angle、util 工具函数。本文档基于 src/geometry/*.ts 真实源码，
  整理常用 API、典型场景（计算节点位置、路径长度、相交判断、角度转换等）。

library: "x6"
version: "3.x"
category: "core"
subcategory: "geometry"
tags:
  - "geometry"
  - "Point"
  - "Rectangle"
  - "Line"
  - "Ellipse"
  - "Polyline"
  - "Path"
  - "Curve"
  - "Angle"
  - "toDeg"
  - "toRad"
  - "snapToGrid"
  - "containsPoint"
  - "intersect"
  - "BBox"

related:
  - "x6-core-coord"
  - "x6-core-node"
  - "x6-core-edge"
  - "x6-core-router-advanced"

use_cases:
  - "在自定义 router / connector 中计算路径几何"
  - "判断点是否落在某个节点 BBox 内"
  - "计算两点距离 / 中点 / 角度"
  - "用 Rectangle 求交点 / 包含关系"
  - "把鼠标坐标对齐到网格"
  - "角度与弧度互转"

anti_patterns:
  - "把 Geometry 类与 DOM 元素混用"
  - "对 Point / Rectangle 实例直接读写属性后忘了调用 graph.refresh()"
  - "用 Math.atan2 自己拼角度，而忽略 X6 内置 Angle.toDeg"

difficulty: "intermediate"
completeness: "full"
---

## 概述

X6 把所有几何计算抽象在 `src/geometry/` 模块，统一通过 `@antv/x6` 顶层导出。这些类**与 DOM 解耦**——它们只是数学对象，可以在自定义 router、connector、connection-point、attr、tool 等任何回调里使用。

```javascript
import { Point, Line, Rectangle, Ellipse, Polyline, Path, Curve, Angle } from '@antv/x6';
```

> 所有 Geometry 子类都继承自 `Geometry` 基类，方法链式调用（多数返回 `this`）。

## Angle（角度工具，函数式导出）

源码：`src/geometry/angle.ts`。直接命名空间导入：

```javascript
import { Angle } from '@antv/x6';

Angle.toDeg(Math.PI);          // 180   弧度 → 度
Angle.toRad(180);              // π     度 → 弧度
Angle.toRad(720, true);        // 4π    第二参数 over360=true 时不取模 360
Angle.normalize(-30);          // 330   把任意角度规整到 [0, 360)
```

| API | 说明 |
|-----|------|
| `Angle.toDeg(rad)` | 弧度 → 角度，结果模 360 |
| `Angle.toRad(deg, over360?)` | 角度 → 弧度，默认先 `deg % 360` |
| `Angle.normalize(angle)` | 把任意值规整到 `[0, 360)` |

## Point（二维点）

源码：`src/geometry/point.ts`。

### 创建

```javascript
import { Point } from '@antv/x6';

new Point(10, 20);
Point.create(10, 20);                  // 等价
Point.create({ x: 10, y: 20 });        // 从 PointLike
Point.create([10, 20]);                // 从数组
Point.fromPolar(100, Math.PI / 4);     // 极坐标 → 笛卡尔
```

### 常用实例方法（链式）

```javascript
const p = new Point(10, 20);

p.translate(5, 5);                     // (15, 25)，会修改自身并返回 this
p.scale(2, 2);                         // (30, 50)，第三参数 origin 默认 (0,0)
p.rotate(90, new Point(0, 0));         // 绕原点逆时针旋转 90°（度数，不是弧度）
p.distance({ x: 0, y: 0 });            // 与另一点的距离
p.equals({ x: 30, y: 50 });            // 是否相等
const q = p.clone();                   // 深拷贝
p.round(2);                            // 保留 2 位小数
p.toJSON();                            // { x, y }
```

> ⚠️ `rotate` 的角度是**度数**而非弧度。

### 典型场景：在自定义 connection-strategy 中计算端点

```javascript
import { Graph, Point } from '@antv/x6';

Graph.registerConnectionStrategy('snap-by-distance', (args) => {
  const { sourcePoint, targetPoint, type, terminal } = args;
  // 把端点对齐到 10px 网格
  const aligned = new Point(targetPoint.x, targetPoint.y).round();
  return { ...terminal, x: aligned.x, y: aligned.y };
});
```

## Line（线段）

源码：`src/geometry/line.ts`。

### 创建

```javascript
import { Line, Point } from '@antv/x6';

new Line(0, 0, 100, 100);                       // (x1, y1, x2, y2)
new Line({ x: 0, y: 0 }, { x: 100, y: 100 });   // 两个 PointLike
```

### 常用方法

```javascript
const l = new Line(0, 0, 100, 0);

l.start;                            // Point(0,0)
l.end;                              // Point(100,0)
l.center;                           // Point(50,0)（getter）
l.getCenter();                      // 同上

l.length();                         // 100
l.angle();                          // 0（与 X 轴正方向夹角，度数）
l.vector();                         // Point(100, 0)

l.pointAt(0.5);                     // Point(50, 0)，0~1 比例
l.pointAtLength(30);                // Point(30, 0)，按像素长度

l.containsPoint({ x: 50, y: 0 });   // true
l.intersect(new Line(50, -10, 50, 10));  // [Point(50, 0)]
l.translate(0, 10);
l.scale(2, 2);
l.rotate(90, new Point(0, 0));
l.clone();
l.equals(other);
```

## Rectangle（矩形 / BBox，最常用）

源码：`src/geometry/rectangle.ts`。多数 X6 API（`cell.getBBox()`、`node.getBBox()`、`graph.getContentBBox()`）返回的就是 `Rectangle`。

### 创建

```javascript
import { Rectangle } from '@antv/x6';

new Rectangle(10, 20, 100, 60);                   // (x, y, width, height)
Rectangle.create(10, 20, 100, 60);
Rectangle.create({ x: 10, y: 20, width: 100, height: 60 });
Rectangle.create([10, 20, 100, 60]);
Rectangle.fromEllipse(ellipse);
```

### 中心 / 边角 / 尺寸

```javascript
const r = new Rectangle(10, 20, 100, 60);

r.getCenter();           // Point(60, 50)
r.getCenterX();          // 60
r.getCenterY();          // 50
r.getOrigin();           // Point(10, 20)
r.getCorner();           // Point(110, 80) 右下
r.getTopLeft();
r.getTopRight();
r.getBottomLeft();
r.getBottomRight();
r.getTopMiddle();
r.getBottomMiddle();
r.getLeftMiddle();
r.getRightMiddle();
r.toJSON();              // { x, y, width, height }
```

### 几何变换

```javascript
r.translate(5, 5);
r.scale(2, 2);                                  // 第三参数 origin 默认 (0,0)
r.rotate(45);                                   // 围绕中心旋转，返回旋转后的 BBox
r.rotate90();                                   // 90° 旋转（专用快捷）
r.inflate(10);                                  // 向四周膨胀 10px
r.inflate(10, 20);                              // x +10, y +20
r.normalize();                                  // 把负宽 / 负高翻正
r.round(2);
```

### 判断

```javascript
r.containsPoint(50, 50);
r.containsPoint({ x: 50, y: 50 });
r.containsRect(other);
r.intersectsWithLine(line);                      // 返回交点数组 | null
r.intersectsWithRect(other);                     // 返回相交 Rectangle | null
r.intersectsWithLineFromCenterToPoint(target);   // 从中心到 target 的射线与边的交点
r.equals(other);
r.clone();
```

### 典型场景：判断节点是否在画布可视区内

```javascript
import { Rectangle } from '@antv/x6';

const viewport = Rectangle.create(graph.getGraphArea());  // 当前视口
const visibleNodes = graph.getNodes().filter((n) => {
  return viewport.intersectsWithRect(n.getBBox()) != null;
});
```

## Ellipse（椭圆）

源码：`src/geometry/ellipse.ts`。

```javascript
import { Ellipse, Rectangle } from '@antv/x6';

new Ellipse(centerX, centerY, semiAxisA, semiAxisB);
Ellipse.fromRect(rect);              // 从内切矩形

const e = new Ellipse(50, 50, 40, 20);
e.bbox();                            // 外接矩形 Rectangle
e.center();                          // Point(50, 50)
e.containsPoint({ x: 50, y: 50 });   // true
e.intersectionWithLine(line);        // 与线段的交点
e.tangentTheta(point);               // 切线角度
e.clone();
```

## Polyline（多段折线）

源码：`src/geometry/polyline.ts`。

```javascript
import { Polyline, Point } from '@antv/x6';

const pl = new Polyline([new Point(0, 0), new Point(50, 50), new Point(100, 0)]);
// 也支持 PointLike[] / [number, number][]
new Polyline([[0, 0], [50, 50], [100, 0]]);
new Polyline([{x:0,y:0}, {x:50,y:50}, {x:100,y:0}]);

pl.length();                         // 折线总长度
pl.pointAt(0.5);                     // 比例定位
pl.pointAtLength(60);                // 按长度定位
pl.bbox();                           // 外接 Rectangle
pl.simplify();                       // 去掉共线点
pl.clone();
```

## Path / Curve（SVG 路径与三次贝塞尔）

源码：`src/geometry/path/*` 与 `src/geometry/curve.ts`。

```javascript
import { Path, Curve } from '@antv/x6';

const path = new Path();
path
  .moveTo(0, 0)
  .lineTo(100, 0)
  .quadTo(150, 50, 100, 100)
  .curveTo(80, 120, 20, 120, 0, 100)
  .close();

path.length();                       // 弧长（近似）
path.bbox();                         // 外接矩形
path.pointAtLength(50);              // 沿路径取点
path.serialize();                    // 输出标准 SVG d 字符串

// 三次贝塞尔
const c = new Curve(
  { x: 0, y: 0 },
  { x: 30, y: 100 },
  { x: 70, y: 100 },
  { x: 100, y: 0 },
);
c.pointAt(0.5);
c.length();
c.divide(0.5);                       // 切割成两段
```

Path 在自定义 connector / marker 中非常常用：

```javascript
// 自定义 connector
import { Graph, Path, Point } from '@antv/x6';

Graph.registerConnector('curve-connector', (sourcePoint, targetPoint) => {
  const path = new Path();
  path.moveTo(sourcePoint.x, sourcePoint.y);
  path.curveTo(
    sourcePoint.x + 80, sourcePoint.y,
    targetPoint.x - 80, targetPoint.y,
    targetPoint.x, targetPoint.y,
  );
  return path.serialize();
}, true);
```

## util（数值工具）

源码：`src/geometry/util.ts`，不通过 `Geometry` 类名导出，需要从 `@antv/x6` 顶层引用：

```javascript
import { round, random, clamp, snapToGrid, containsPoint, squaredLength } from '@antv/x6';

round(3.14159, 2);                    // 3.14
random();                             // 0~1
random(10);                           // 0~10 整数
random(5, 15);                        // 5~15 整数
clamp(150, 0, 100);                   // 100
snapToGrid(73, 10);                   // 70
containsPoint({ x:0, y:0, width:100, height:100 }, { x: 50, y: 50 });  // true
squaredLength({ x:0, y:0 }, { x:3, y:4 });   // 25
```

> `snapToGrid` 在实现"鼠标拖拽对齐网格"功能时极为常用。

## 端到端示例：用 geometry 工具实现"节点与边居中对齐"按钮

```javascript
import { Graph, Rectangle, Point } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
  panning: true,
  mousewheel: { enabled: true, modifiers: 'ctrl' },
});

// 添加示例内容
const a = graph.addNode({ shape: 'rect', x: 40,  y: 40,  width: 80, height: 40, label: 'A' });
const b = graph.addNode({ shape: 'rect', x: 320, y: 220, width: 80, height: 40, label: 'B' });
graph.addEdge({ source: a, target: b });

graph.centerContent();

// 业务方法：把所有节点中心对齐到画布水平中线
function centerHorizontally() {
  const area = Rectangle.create(graph.getGraphArea());
  const cy = area.getCenterY();
  graph.getNodes().forEach((node) => {
    const bbox = node.getBBox();
    const newY = cy - bbox.height / 2 - area.y; // 转换为节点坐标
    node.position(node.position().x, newY);
  });
}

// 调用方式：
// centerHorizontally();
```

## 常见错误与修正

### ❌ 把度数当弧度传给 Point.rotate

```javascript
// 错误：rotate 接受的是「度数」
new Point(10, 0).rotate(Math.PI / 2);   // 实际只旋转 1.57°

// 正确
new Point(10, 0).rotate(90);
// 或者从弧度转换
import { Angle } from '@antv/x6';
new Point(10, 0).rotate(Angle.toDeg(Math.PI / 2));
```

### ❌ 把 Geometry 对象当 DOM 用

```javascript
// 错误：Rectangle 只是数学对象，没有 DOM 引用
const r = new Rectangle(0, 0, 100, 100);
r.style.background = 'red';            // ❌ TypeError

// 正确：要给画布元素加样式，请用 cell.attr(...) 或 cell.setProp(...)
node.attr('body/fill', 'red');
```

### ❌ 修改 Rectangle 实例属性后忘了同步回 cell

```javascript
// 错误：node.getBBox() 返回的是新的 Rectangle 拷贝，修改它不会影响节点
const bbox = node.getBBox();
bbox.x += 50;                          // ❌ 节点位置没变

// 正确：通过节点 API
node.translate(50, 0);
// 或
node.position(node.position().x + 50, node.position().y);
```

### ❌ 用 `snapToGrid` 时把 gridSize 写成 0

```javascript
// 错误：会得到 NaN
snapToGrid(73, 0);

// 正确：grid 必须 > 0
snapToGrid(73, graph.getGridSize() || 10);
```
