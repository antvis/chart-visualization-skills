---
id: "g2-constraints"
title: "G2 v5 Core Constraints / 核心约束"
description: "G2 v5 必须遵守的核心约束规则，包括 Spec Mode、encode、transform、coordinate、scale.color.palette 等强制规范和禁止模式"
library: "g2"
version: "5.x"
category: "__constraints__"
tags:
  - "constraints"
  - "核心约束"
  - "MUST"
  - "禁止模式"
use_cases: []
anti_patterns: []
---

## Core Constraints / 核心约束 (MUST follow)

1. **`container` is mandatory**: `new Chart({ container: 'container', ... })`
2. **Use Spec Mode ONLY**: `chart.options({ type: 'interval', data, encode: {...} })`（V4 链式 API 见 Forbidden Patterns）
3. **`chart.options()` 只能调用一次**：多次调用会完整覆盖前一次配置，只有最后一次生效。多 mark 叠加必须用 `type: 'view'` + `children` 数组，而不是多次调用 `chart.options()`
4. **`encode` object**: `encode: { x, y }`（禁止 V4 的 `.position('x*y')`）
5. **`transform` must be array**: `transform: [{ type: 'stackY' }]`
6. **`labels` is plural**: Use `labels: [{ text: 'field' }]` not `label: {}`
7. **`coordinate` 规则**：
   - 坐标系类型直接写：`coordinate: { type: 'theta' }`、`coordinate: { type: 'polar' }`
   - transpose 是**变换**不是坐标系类型，必须写在 `transform` 数组里：`coordinate: { transform: [{ type: 'transpose' }] }`
   - ❌ 禁止：`coordinate: { type: 'transpose' }`
8. **范围编码**（甘特图、candlestick 等）：`encode: { y: 'start', y1: 'end' }`，禁止 `y: ['start', 'end']`
9. **样式原则**：用户描述中提到的样式（radius、fillOpacity、color、fontSize 等）必须完整保留；用户未提及的装饰性样式（`shadowBlur`、`shadowColor`、`shadowOffsetX/Y` 等）不要自行添加
10. **`animate` 规则**：用户未明确要求动画时不要添加 `animate` 配置（G2 自带默认动画），只有用户明确描述动画需求时才添加
11. **`scale.color.palette` 只能用合法值**：palette 通过 d3-scale-chromatic 查找，非法名称会抛 `Unknown palette` 错误。**不要推断或创造不存在的名称**（如 `'blueOrange'`、`'redGreen'`、`'hot'`、`'jet'`、`'coolwarm'` 等均非法）。合法的常用值：顺序色阶 `'blues'|'greens'|'reds'|'ylOrRd'|'viridis'|'plasma'|'turbo'`；发散色阶 `'rdBu'|'rdYlGn'|'spectral'`；不确定时用 `range: ['#startColor', '#endColor']` 自定义替代
12. **禁止在用户代码中使用 `d3.*`**：G2 内部使用 d3，但 `d3` 对象不会暴露到用户代码作用域，调用 `d3.sum()` 等会抛 `ReferenceError: d3 is not defined`。如需聚合，优先使用 G2 内置选项（如 `sortX` 的 `reducer: 'sum'`），不得不自定义时用原生 JS：`d3.sum(arr, d=>d.v)` → `arr.reduce((s,d)=>s+d.v,0)`；`d3.max(arr, d=>d.v)` → `Math.max(...arr.map(d=>d.v))`
13. **用户未指定配色时，禁止使用白色或近白色作为图形填充色**：`style: { fill: '#fff' }`、`style: { fill: 'white' }`、`style: { fill: '#ffffff' }` 等在白色背景下会让图形完全不可见。未指定配色时应依赖 G2 的 `encode.color` 自动分配主题色，或使用有明确视觉区分度的颜色（如 `'#5B8FF9'`）。以下是合法例外：label 文字 `fill: '#fff'`（深色背景内标签）、分隔线 `stroke: '#fff'`（堆叠/pack/treemap 的分隔白线）
14. **`padding` 只接受 `number | 'auto'`，禁止数组形式**：`padding: [40, 30, 40, 50]` 在 G2 v5 中无效（会被忽略或报错）。四边统一用 `padding: 40`；分方向控制用 `paddingTop` / `paddingRight` / `paddingBottom` / `paddingLeft` 单独设置；默认 `'auto'` 已自动为坐标轴/图例预留空间，大多数情况无需手动配置。**禁止设置 `padding: 0`**——会关闭自动计算，导致坐标轴/图例被截断；只需调整某一方向时单独设置对应方向即可
15. **`autoFit: true` 时禁止同时设置 `width`**：`autoFit` 会完全忽略 `width`，同时出现时 `width` 无效。`autoFit: true` 时只设 `height`；需要固定宽高时去掉 `autoFit` 改用 `width` + `height`
16. **用户未指定容器时**： `container` 默认为 `'container'`，不要通过 `document.createElement('div')` 进行创建，代码末尾必须有 `chart.render();`
17. **禁止在数据中存放 hex 色值并通过 `encode.color` 映射**：`encode.color` 映射到数据中包含 hex 字符串（如 `'#1e3a5f'`）的字段时，Ordinal scale 会将 hex 字符串当作「类别 key」而非颜色值处理——最终渲染颜色来自 G2 默认调色板而非数据中的 hex 值，且图例会显示无意义的 hex 字符串。正确做法：移除数据中的 color 字段，将 hex 色值放入 `scale.color.range`，`encode.color` 指向有业务含义的字段（如 `'group'`），通过 `scale.color.domain` + `range` 精确配对。**例外情况**：若必须直接使用数据中的动态颜色，需显式配置 `scale: { color: { type: 'identity' } }`。
18. **Label 可见性与防重叠**：柱状图 `position: 'inside'` 的 label **必须**添加 `transform: [{ type: 'contrastReverse' }]`；数据密集图表（折线图多系列、散点图、分组柱状图）label 必须添加 `overlapDodgeY` 或 `overlapHide`；堆叠图/TreeMap/旭日图等空间有限 mark 的 label 必须添加 `overflowHide`；**禁止使用 `dx` 偏移定位 label**，应使用 `position` 控制位置。详见 [标签配置](references/components/g2-comp-label-config.md)
19. **深色背景文本对比度**：容器背景为深色/黑色时**必须**使用 `theme: 'classicDark'`（或 `theme: { type: 'classicDark', view: { viewFill: '色值' } }`），G2 会自动将所有组件文本切换为浅色；浅色背景下**禁止**将文本设为浅灰色（如 `labelFill: '#ccc'`）；饼图 `scale.color.range` 中**禁止**包含与背景相同或近似的颜色。详见 [深色主题适配](references/concepts/g2-concept-dark-theme-adaptation.md)

### 1.1 Forbidden Patterns / 禁止使用的写法

**禁止使用 V4 语法**，必须使用 V5 Spec 模式：


```javascript
// ❌ 禁止：V4 createView
const view = chart.createView();
view.options({...});

// ❌ 禁止：V4 链式 API 调用
chart.interval()
  .data([...])
  .encode('x', 'genre')
  .encode('y', 'sold')
  .style({ radius: 4 });

// ❌ 禁止：V4 链式 encode
chart.line().encode('x', 'date').encode('y', 'value');

// ❌ 禁止：V4 source
chart.source(data);

// ❌ 禁止：V4 position
chart.interval().position('genre*sold');

// ✅ 正确：V5 Spec 模式
chart.options({
  type: 'interval',
  data: [...],
  encode: { x: 'genre', y: 'sold' },
  style: { radius: 4 },
});
```

**原因**：V5 使用 Spec 模式，结构清晰，易于序列化、动态生成和调试。

#### `createView` 的正确 V5 替代方案

`chart.createView()` 在 V4 中用于"多视图共享容器但数据各异"，V5 中对应两种场景：

**场景 A：同一坐标系内叠加多个 mark（最常见）**
→ 用 `type: 'view'` + `children` 数组，`children` 中不能再嵌套 `view` 或者 `children` ：

```javascript
// ✅ 多 mark 叠加（折线 + 散点）
chart.options({
  type: 'view',
  data,
  children: [
    { type: 'line',  encode: { x: 'date', y: 'value' } },
    { type: 'point', encode: { x: 'date', y: 'value' } },
  ],
});
```

**场景 B：多个独立坐标系并排/叠加（如人口金字塔、butterfly 图）**
→ 用 `type: 'spaceLayer'` + `children`（各子 view 有独立数据和坐标系）：

```javascript
// ✅ 人口金字塔：左右两侧独立视图叠加，共享 Y 轴
chart.options({
  type: 'spaceLayer',
  children: [
    {
      type: 'interval',
      data: leftData,                              // 左侧数据（负值或翻转）
      coordinate: { transform: [{ type: 'transpose' }, { type: 'reflectX' }] },
      encode: { x: 'age', y: 'male' },
      axis: { y: { position: 'right' } },
    },
    {
      type: 'interval',
      data: rightData,                             // 右侧数据
      coordinate: { transform: [{ type: 'transpose' }] },
      encode: { x: 'age', y: 'female' },
      axis: { y: false },
    },
  ],
});

// ✅ 更简单方案：单一视图 + 负值技巧（数据可在一个数组里）
chart.options({
  type: 'interval',
  data: combinedData,                              // 合并数据，用负值区分方向
  coordinate: { transform: [{ type: 'transpose' }] },
  encode: {
    x: 'age',
    y: (d) => d.sex === 'male' ? -d.population : d.population,
    color: 'sex',
  },
  axis: {
    y: { labelFormatter: (d) => Math.abs(d) },     // 显示绝对值
  },
});
```

**选择原则**：
- 两侧数据结构相同、只是方向相反 → **优先用负值技巧**（单 `interval`，代码最简洁）
- 两侧需要完全独立的坐标系/比例尺 → 用 `spaceLayer`

### 1.2 禁止使用的幻觉 Mark 类型 / Hallucinated Mark Types

以下类型来自其他图表库（如 ECharts、Vega），**G2 中不存在**，使用将导致运行时报错：

| ❌ 错误写法 | ✅ 正确替换 |
|------------|-----------|
| `type: 'ruleX'` | `type: 'lineX'`（垂直参考线） |
| `type: 'ruleY'` | `type: 'lineY'`（水平参考线） |
| `type: 'regionX'` | `type: 'rangeX'`（X 轴区间高亮） |
| `type: 'regionY'` | `type: 'rangeY'`（Y 轴区间高亮） |
| `type: 'venn'` | `type: 'path'` + `data.transform: [{ type: 'venn' }]` |

**G2 合法 mark 类型完整列表**（不得凭空创造其他 type）：
- 基础：`interval`、`line`、`area`、`point`、`rect`、`cell`、`text`、`image`、`path`、`polygon`、`shape`
- 连接：`link`、`connector`、`vector`
- 参考线/区域：`lineX`、`lineY`、`rangeX`、`rangeY`；`range`（极少用，仅在 x/y 均需限定二维矩形时使用，且数据的 x/y 字段必须是 `[start,end]` 数组）
- 统计：`box`、`boxplot`、`density`、`heatmap`、`beeswarm`
- 层次/关系：`treemap`、`pack`、`partition`、`tree`、`sankey`、`chord`
- 特殊：`wordCloud`、`gauge`、`liquid`
- 需引入扩展包：`sunburst`（需 `@antv/g2-extension-plot`，见 [旭日图](references/marks/g2-mark-sunburst.md)）
---
