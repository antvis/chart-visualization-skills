---
id: "x6-core-filter"
title: "X6 SVG 滤镜（Filter）"
description: |
  X6 内置 SVG 滤镜：outline 描边、highlight 高亮、blur 模糊、dropShadow 阴影、grayScale 灰度、sepia 褐色、saturate 饱和度、hueRotate 色相旋转、invert 反色、brightness 亮度、contrast 对比度。

library: "x6"
version: "3.x"
category: "core"
subcategory: "filter"
tags:
  - "filter"
  - "滤镜"
  - "阴影"
  - "模糊"
  - "高亮"
  - "outline"
  - "drop-shadow"
  - "blur"
  - "grayScale"
  - "SVG filter"

related:
  - "x6-core-node"
  - "x6-core-edge"
  - "x6-core-highlighter"

use_cases:
  - "节点添加阴影效果"
  - "节点高亮描边"
  - "节点模糊效果"
  - "节点灰度/禁用状态"
  - "鼠标悬停高亮"

difficulty: "intermediate"
completeness: "full"
---

## 基本用法

通过节点/边的 `attrs` 中 `filter` 属性使用内置滤镜：

```javascript
graph.addNode({
  x: 100,
  y: 100,
  width: 120,
  height: 60,
  attrs: {
    body: {
      fill: '#fff',
      stroke: '#5F95FF',
      filter: {
        name: 'dropShadow',
        args: { dx: 2, dy: 2, blur: 3, color: 'rgba(0,0,0,0.2)' },
      },
    },
  },
});
```

## 内置滤镜列表

### dropShadow（阴影）

为元素添加投影阴影：

```javascript
attrs: {
  body: {
    filter: {
      name: 'dropShadow',
      args: {
        dx: 2,        // 水平偏移，默认 0
        dy: 2,        // 垂直偏移，默认 0
        blur: 4,      // 模糊半径，默认 4
        color: 'black',  // 阴影颜色，默认 'black'
        opacity: 0.3, // 阴影透明度，默认 1
      },
    },
  },
}
```

### outline（外描边）

在元素外围添加一圈描边（不影响元素本身）：

```javascript
attrs: {
  body: {
    filter: {
      name: 'outline',
      args: {
        color: 'blue',   // 描边颜色，默认 'blue'
        width: 2,        // 描边宽度，默认 1
        margin: 3,       // 描边与元素的间距，默认 2
        opacity: 1,      // 描边透明度，默认 1
      },
    },
  },
}
```

### highlight（高亮光晕）

在元素外围添加发光效果：

```javascript
attrs: {
  body: {
    filter: {
      name: 'highlight',
      args: {
        color: 'red',    // 高亮颜色，默认 'red'
        width: 2,        // 高亮扩展宽度，默认 1
        blur: 5,         // 模糊半径，默认 0
        opacity: 0.8,    // 高亮透明度，默认 1
      },
    },
  },
}
```

### blur（高斯模糊）

```javascript
attrs: {
  body: {
    filter: {
      name: 'blur',
      args: {
        x: 3,  // 水平模糊量，默认 2
        y: 3,  // 垂直模糊量（可选，默认与 x 相同）
      },
    },
  },
}
```

### grayScale（灰度）

```javascript
attrs: {
  body: {
    filter: {
      name: 'grayScale',
      args: {
        amount: 1,  // 灰度程度，0~1，1 为完全灰度
      },
    },
  },
}
```

### sepia（褐色/复古）

```javascript
attrs: {
  body: {
    filter: {
      name: 'sepia',
      args: {
        amount: 1,  // 0~1
      },
    },
  },
}
```

### saturate（饱和度）

```javascript
attrs: {
  body: {
    filter: {
      name: 'saturate',
      args: {
        amount: 0.5,  // < 1 降低饱和度，> 1 增加饱和度
      },
    },
  },
}
```

### hueRotate（色相旋转）

```javascript
attrs: {
  body: {
    filter: {
      name: 'hueRotate',
      args: {
        angle: 90,  // 旋转角度（度）
      },
    },
  },
}
```

### invert（反色）

```javascript
attrs: {
  body: {
    filter: {
      name: 'invert',
      args: {
        amount: 1,  // 0~1，1 为完全反色
      },
    },
  },
}
```

### brightness（亮度）

```javascript
attrs: {
  body: {
    filter: {
      name: 'brightness',
      args: {
        amount: 1.5,  // < 1 变暗，> 1 变亮
      },
    },
  },
}
```

### contrast（对比度）

```javascript
attrs: {
  body: {
    filter: {
      name: 'contrast',
      args: {
        amount: 2,  // < 1 降低对比度，> 1 增加对比度
      },
    },
  },
}
```

## 动态添加/移除滤镜

```javascript
const node = graph.addNode({
  x: 100, y: 100, width: 120, height: 60,
  attrs: { body: { fill: '#EFF4FF', stroke: '#5F95FF' } },
});

// 鼠标悬停时添加阴影
graph.on('node:mouseenter', ({ node }) => {
  node.attr('body/filter', {
    name: 'dropShadow',
    args: { dx: 0, dy: 4, blur: 8, color: 'rgba(0,0,0,0.15)' },
  });
});

// 鼠标离开时移除滤镜
graph.on('node:mouseleave', ({ node }) => {
  node.attr('body/filter', null);
});
```

## 禁用状态示例

使用灰度滤镜表示节点"禁用"：

```javascript
function setNodeDisabled(node, disabled) {
  if (disabled) {
    node.attr('body/filter', { name: 'grayScale', args: { amount: 1 } });
    node.attr('body/opacity', 0.6);
  } else {
    node.attr('body/filter', null);
    node.attr('body/opacity', 1);
  }
}
```

## 常见错误

### ❌ filter 直接写 CSS filter 字符串

```javascript
// 错误：不支持 CSS filter 字符串语法
attrs: {
  body: {
    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',  // ❌
  },
}
```

```javascript
// 正确：使用 X6 的对象语法
attrs: {
  body: {
    filter: {
      name: 'dropShadow',
      args: { dx: 2, dy: 2, blur: 4, color: 'rgba(0,0,0,0.3)' },
    },  // ✅
  },
}
```

### ❌ 滤镜名称拼写错误

```javascript
// 错误：名称拼写不正确
filter: { name: 'drop-shadow', args: {...} }  // ❌ 应为 'dropShadow'
filter: { name: 'grayscale', args: {...} }    // ❌ 应为 'grayScale'
filter: { name: 'hue-rotate', args: {...} }   // ❌ 应为 'hueRotate'
```

正确的滤镜名称（驼峰命名）：`dropShadow`、`grayScale`、`hueRotate`
