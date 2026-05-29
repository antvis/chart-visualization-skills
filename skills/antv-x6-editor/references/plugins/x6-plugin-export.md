---
id: "x6-plugin-export"
title: "X6 导出（Export）"
description: |
  X6 画布内容导出为 SVG/PNG/JPEG 图片的完整指南。
  包含 Export 插件使用、exportSVG、exportPNG、exportJPEG、toSVG、toPNG、toJPEG API。

library: "x6"
version: "3.x"
category: "plugins"
subcategory: "export"
tags:
  - "导出"
  - "export"
  - "SVG"
  - "PNG"
  - "JPEG"
  - "图片"
  - "截图"
  - "下载"
  - "toSVG"
  - "toPNG"
  - "exportPNG"
  - "exportSVG"
  - "dataUri"

related:
  - "x 6-core-graph-init"
  - "x6-plugins"

use_cases:
  - "将画布导出为 SVG 文件"
  - "将画布导出为 PNG 图片"
  - "将画布导出为 JPEG 图片"
  - "获取画布的 DataURI 用于预览"
  - "控制导出图片的分辨率和背景色"

anti_patterns:
  - "不要忘记先调用 graph.use(new Export()) 注册插件"
  - "导出带有跨域图片时注意 CORS 问题"
---

# X6 导出（Export）

## 注册插件

Export 插件需要先注册才能使用导出功能：

```javascript
import { Graph, Export } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  background: { color: '#F2F7FA' },
});

// 注册导出插件
graph.use(new Export());
```

## 导出为文件（自动下载）

### exportSVG — 导出 SVG 文件

```javascript
// 基本用法：自动下载名为 "my-graph.svg" 的文件
graph.exportSVG('my-graph');

// 带配置
graph.exportSVG('my-graph', {
  preserveDimensions: true,  // SVG 尺寸为实际图形大小
  copyStyles: true,          // 复制外部样式
  serializeImages: true,     // 图片转为 DataURI
});
```

### exportPNG — 导出 PNG 文件

```javascript
// 基本用法
graph.exportPNG('my-graph');

// 高清导出（2倍分辨率）
graph.exportPNG('my-graph', {
  ratio: 2,
  backgroundColor: '#ffffff',
  padding: 20,
});
```

### exportJPEG — 导出 JPEG 文件

```javascript
graph.exportJPEG('my-graph', {
  ratio: 2,
  backgroundColor: '#ffffff',
  quality: 0.92,  // 图片质量 0-1
});
```

## 获取 DataURI（不下载）

当需要获取图片数据用于预览、上传等场景时，使用 `to*` 系列方法：

### toSVG

```javascript
graph.toSVG((dataUri) => {
  // dataUri 是 SVG 格式的 data URI
  console.log(dataUri);
}, {
  preserveDimensions: true,
});
```

### toPNG

```javascript
graph.toPNG((dataUri) => {
  // dataUri 是 PNG 格式的 base64 data URI
  // 可用于 img 标签或上传
  const img = new Image();
  img.src = dataUri;
  document.body.appendChild(img);
}, {
  ratio: 2,
  backgroundColor: '#ffffff',
  padding: { top: 20, right: 20, bottom: 20, left: 20 },
});
```

### toJPEG

```javascript
graph.toJPEG((dataUri) => {
  console.log(dataUri);
}, {
  quality: 0.85,
  backgroundColor: '#ffffff',
});
```

## 配置项

### ToSVGOptions

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `preserveDimensions` | boolean \| Size | - | SVG 尺寸：`true` 为实际大小，也可传 `{ width, height }` |
| `viewBox` | RectangleLike | - | 自定义 viewBox |
| `copyStyles` | boolean | `true` | 是否复制外部样式表中的样式 |
| `stylesheet` | string | - | 自定义 CSS 样式表 |
| `serializeImages` | boolean | `true` | 是否将图片 href 转为 DataURI |
| `beforeSerialize` | Function | - | 导出前修改 SVG 元素的回调 |

### ToImageOptions（继承 ToSVGOptions）

| 配置项 | 类型 | 默认  | 说明 |
|--------|------|--------|------|
| `width` | number | - | 导出图片宽度 |
| `height` | number | - | 导出图片高度 |
| `ratio` | number | 1 | 缩放比例（设备像素比） |
| `backgroundColor` | string | - | 背景色 |
| `padding` | number \| SideOptions | - | 内边距 |
| `quality` | number | 0.92 | JPEG 质量（0-1） |

## 完整示例

```javascript
import { Graph, Export } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  width: 800,
  height: 600,
  background: { color: '#F2F7FA' },
  grid: { visible: true },
});

graph.use(new Export());

// 添加节点和边
const source = graph.addNode({
  shape: 'rect',
  x: 40,
  y: 40,
  width: 120,
  height: 50,
  label: 'Source',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', strokeWidth: 1, rx: 6, ry: 6 } },
});

const target = graph.addNode({
  shape: 'rect',
  x: 300,
  y: 200,
  width: 120,
  height: 50,
  label: 'Target',
  attrs: { body: { fill: '#fff', stroke: '#8f8f8f', strokeWidth: 1, rx: 6, ry: 6 } },
});

graph.addEdge({
  source,
  target,
  router: 'orth',
  connector: 'rounded',
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1, targetMarker: 'classic' } },
});

// 导出为 PNG（2x 分辨率）
graph.exportPNG('flowchart', {
  ratio: 2,
  backgroundColor: '#ffffff',
  padding: 20,
});
```

## ⚠️ 关键约束（必须遵守）

**所有导出方法（toPNG / toSVG / toJPEG / exportPNG / exportSVG / exportJPEG）都需要先注册 Export 插件**，否则会报 `graph.toPNG is not a function`。

```javascript
// ✅ 正确的导出代码模板（每次生成导出代码都必须包含这两行）
import { Graph, Export } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Export());  // 必须在调用任何导出方法之前
```

**禁止事项：**
- 禁止在未注册 Export 插件的情况下调用 toPNG/toSVG/exportPNG 等方法
- 禁止 `graph.use(Export)` — 必须是 `graph.use(new Export())`
- 禁止在 `graph.use(new Export())` 之前调用导出方法

## 常见错误与修正

### ❌ 未注册 Export 插件就调用导出方法

```javascript
// 错误：graph.toPNG is not a function / graph.exportPNG is not a function
import { Graph } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.toPNG((dataUri) => { console.log(dataUri); }); // TypeError

// 正确：必须先 import Export 并注册
import { Graph, Export } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Export());
graph.toPNG((dataUri) => { console.log(dataUri); }); // ✅
```

### ❌ 导出时背景色缺失

```javascript
// 错误：导出的图片无背景（透明）
graph.exportPNG('test');

// 正确：指定背景色
graph.exportPNG('test', { backgroundColor: '#ffffff' });
```

### ❌ 使用 toPNG/toSVG 时未传入回调函数

```javascript
// 错误：直接调用返回 undefined
const dataUri = graph.toPNG(); // undefined

// 正确：传入回调函数接收结果（也可用 Async 版本）
graph.toPNG((dataUri) => { console.log(dataUri); });
// 或
const dataUri = await graph.toPNGAsync({ backgroundColor: '#fff' });
```

### ❌ 使用 DOM 容器引用而非 ID 字符串初始化画布

```javascript
// 错误：在某些环境下可能导致容器重复声明
const container = document.getElementById('container');
const graph = new Graph({ container });

// 推荐：使用字符串 ID
const graph = new Graph({ container: 'container' });
```

### ❌ 调用 graph.render() 导致报错

```javascript
// 错误：graph.render is not a function
graph.render();

// 正确：X6 Graph 实例不需要手动调用 render()
// 所有节点和边添加后会自动渲染
```

### ❌ 导出方法调用前未确保插件已注册

```javascript
// 错误：即使引入了 Export，如果没有注册插件，仍然会报错
import { Graph, Export } from '@antv/x6';
const graph = new Graph({ container: 'container' });
// 忘记调用 graph.use(new Export());
graph.toPNG((dataUri) => { console.log(dataUri); }); // ❌ TypeError

// 正确：确保插件已注册
import { Graph, Export } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Export()); // ✅ 必须注册插件
graph.toPNG((dataUri) => { console.log(dataUri); }); // ✅ 正确调用
```

</skill>