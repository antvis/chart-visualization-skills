## 常见错误

### ❌ 使用已废弃的独立插件包

```javascript
// 错误：独立插件包已废弃
import { Selection } from '@antv/x6-plugin-selection';
import { History } from '@antv/x6-plugin-history';

// 正确：从 @antv/x6 直接导入
import { Graph, Selection, History } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Selection({ enabled: true, rubberband: true }));
graph.use(new History({ enabled: true }));
```

### ❌ 在构造函数中传入插件选项

```javascript
// 错误：3.x 不支持构造函数选项模式
const graph = new Graph({
  container: 'container',
  selecting: { enabled: true },  // ❌
  snapline: { enabled: true },   // ❌
  history: { enabled: true },    // ❌
});

// 正确：使用 graph.use() 注册插件
import { Graph, Selection, Snapline, History } from '@antv/x6';
const graph = new Graph({ container: 'container' });
graph.use(new Selection({ enabled: true }));
graph.use(new Snapline({ enabled: true }));
graph.use(new History({ enabled: true }));
```

### ❌ 混淆 CSS 属性和 SVG 属性

```javascript
// 错误：使用 CSS 属性名
attrs: {
  body: {
    'background-color': '#fff',  // ❌
    'border-radius': '6px',      // ❌
  }
}

// 正确：使用 SVG 属性名
attrs: {
  body: {
    fill: '#fff',               // ✅ 背景色
    rx: 6,                      // ✅ 圆角
    ry: 6,
    stroke: '#8f8f8f',          // ✅ 边框色
    strokeWidth: 1,             // ✅ 边框宽度
  }
}
```

### ❌ 缺少 container

```javascript
// 错误：遗漏 container
const graph = new Graph({});

// 正确：container 必填
const graph = new Graph({ container: 'container' });
```

### ❌ 连接桩未设置 magnet

```javascript
// 错误：端口无法连线
ports: {
  items: [{ id: 'port1', group: 'out' }],
  groups: {
    out: { position: 'right', attrs: { circle: { r: 5 } } }
  }
}

// 正确：设置 magnet: true
ports: {
  items: [{ id: 'port1', group: 'out' }],
  groups: {
    out: { position: 'right', attrs: { circle: { r: 5, magnet: true, stroke: '#8f8f8f' } } }
  }
}
```

### ❌ 事件回调使用位置参数

```javascript
// 错误：参数不是位置传递
graph.on('node:click', (node, e) => { ... });

// 正确：解构对象参数
graph.on('node:click', ({ node, e }) => { ... });
```

---