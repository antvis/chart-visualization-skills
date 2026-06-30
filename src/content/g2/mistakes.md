## Common Mistakes / 常见错误

### ⚠️ 最高频错误：禁止多次调用 `chart.options()`

`chart.options()` 是**全量替换**，不是合并。多次调用时**只有最后一次生效**，前面的配置全部丢失。**每个图表只能调用一次 `chart.options()`。**

```javascript
// ❌ Wrong: 多次调用 chart.options() —— 每次完整替换前一次，只有最后一次生效
chart.options({ type: 'interval', data, encode: { x: 'x', y: 'y' } });  // ❌ 被覆盖，不渲染
chart.options({ type: 'line',     data, encode: { x: 'x', y: 'y' } });  // ❌ 被覆盖，不渲染
chart.options({ type: 'text',     data, encode: { x: 'x', y: 'y', text: 'label' } });  // 只有这个生效

// ✅ Correct: 多 mark 叠加必须用 type: 'view' + children，一次 chart.options() 搞定
chart.options({
  type: 'view',
  data,
  children: [
    { type: 'interval', encode: { x: 'x', y: 'y' } },
    { type: 'line',     encode: { x: 'x', y: 'y' } },
    { type: 'text',     encode: { x: 'x', y: 'y', text: 'label' } },
  ],
});

// ✅ 子 mark 需要不同数据时，在 children 里单独指定 data
chart.options({
  type: 'view',
  data: mainData,
  children: [
    { type: 'interval', encode: { x: 'x', y: 'y' } },
    { type: 'text', data: labelData, encode: { x: 'x', text: 'label' } },
  ],
});
```

多 mark 组合规则：
- 只能使用 `children`，禁止 `marks`、`layers` 等属性
- `children` 不能嵌套（`children` 内不能再有 `type: 'view'` + `children`）
- 复杂多坐标系组合用 `spaceLayer`/`spaceFlex`

```javascript
// ❌ Wrong: 使用 marks/layers（禁止）
chart.options({ type: 'view', data, marks: [...] });   // ❌
chart.options({ type: 'view', data, Layers: [...] });  // ❌

// ❌ Wrong: children 嵌套（禁止）
chart.options({ type: 'view', children: [{ type: 'view', children: [...] }] });  // ❌

// ✅ Correct: 复杂多坐标系组合用 spaceLayer
chart.options({
  type: 'spaceLayer',
  children: [
    { type: 'view', children: [...] },
    { type: 'line', encode: { x: 'x', y: 'y' } },
  ],
});
```

### 其他常见错误

```javascript
// ❌ Wrong: padding 数组形式（CSS 简写），G2 v5 不支持，会被忽略
const chart = new Chart({ container: 'container', padding: [40, 30, 40, 50] });  // ❌

// ✅ Correct: 四边统一
const chart = new Chart({ container: 'container', padding: 40 });

// ✅ Correct: 分方向控制
const chart = new Chart({ container: 'container', paddingTop: 40, paddingLeft: 60 });

// ❌ Wrong: missing container
const chart = new Chart({ width: 640, height: 480 });

// ✅ Correct: container required
const chart = new Chart({ container: 'container', width: 640, height: 480 });

// ❌ Wrong: transform as object
chart.options({ transform: { type: 'stackY' } });

// ✅ Correct: transform as array
chart.options({ transform: [{ type: 'stackY' }] });

// ❌ Wrong: label (singular)
chart.options({ label: { text: 'value' } });

// ✅ Correct: labels (plural)
chart.options({ labels: [{ text: 'value' }] });

// ❌ Wrong: labels formatter 把第一个参数当 datum 对象
// formatter 的第一个参数是 text 已映射的值（如 85），不是 datum
// d.value 在数字 85 上为 undefined，结果为 "undefined%"
chart.options({
  labels: [{ text: 'value', formatter: (d) => d.value + '%' }],
});

// ✅ Correct: 用 text 函数直接访问 datum 并格式化（推荐）
chart.options({
  labels: [{ text: (d) => d.value + '%' }],
});

// ✅ Correct: 或用 formatter 的正确用法（val 是已映射的数值）
chart.options({
  labels: [{ text: 'value', formatter: (val) => val + '%' }],
});

// ❌ Wrong: hex 色值放在数据中，被 Ordinal scale 当作类别 key
// 渲染颜色是 G2 默认调色板，图例显示无意义的 '#1e3a5f' 等字符串
const barData = [
  { group: '法律界', value: 85, color: '#1e3a5f' },
  { group: '公司治理专家', value: 78, color: '#2d4a6f' },
];
chart.options({
  type: 'interval',
  data: barData,
  encode: { x: 'group', y: 'value', color: 'color' },
  scale: { color: { type: 'ordinal' } },
});

// ✅ Correct: hex 色值放入 scale.color.range，encode.color 指向业务字段
chart.options({
  type: 'interval',
  data: [
    { group: '法律界', value: 85 },
    { group: '公司治理专家', value: 78 },
  ],
  encode: { x: 'group', y: 'value', color: 'group' },
  scale: {
    color: {
      type: 'ordinal',
      domain: ['法律界', '公司治理专家'],
      range: ['#1e3a5f', '#2d4a6f'],
    },
  },
});

// ✅ Correct (Dynamic Colors): 若必须直接使用数据中的 hex 颜色，需显式指定 identity 比例尺
chart.options({
  type: 'interval',
  data: [
    { group: '法律界', value: 85, color: '#1e3a5f' },
    { group: '公司治理专家', value: 78, color: '#2d4a6f' },
  ],
  encode: { x: 'group', y: 'value', color: 'color' },
  scale: {
    color: { type: 'identity' },
  },
});

// ❌ Wrong: area 图上使用 stroke + lineWidth 会包裹整个填充区域
// 底部和两侧也会被描边，正确做法是 view + children 叠加 area + line
chart.options({
  type: 'area',
  data,
  encode: { x: 'date', y: 'value' },
  style: { fill: '#FF5924', fillOpacity: 0.4, stroke: '#FF5924', lineWidth: 2 },
});

// ✅ Correct: view + area(填充) + line(顶部边缘线)
chart.options({
  type: 'view',
  data,
  children: [
    { type: 'area', encode: { x: 'date', y: 'value' }, style: { fill: '#FF5924', fillOpacity: 0.4 } },
    { type: 'line', encode: { x: 'date', y: 'value' }, style: { stroke: '#FF5924', lineWidth: 2 } },
  ],
});

// ❌ Wrong: unnecessary scale type specification
chart.options({ scale: { x: { type: 'linear' }, y: { type: 'linear' } } });

// ✅ Correct: let G2 infer scale type automatically
chart.options({ scale: { y: { domain: [0, 100] } } });
```