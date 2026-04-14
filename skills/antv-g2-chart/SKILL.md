---
name: antv-g2-chart
description: Generate G2 v5 chart code. Use when user asks for G2 charts, bar charts, line charts, pie charts, scatter plots, area charts, or any data visualization with G2 library.
---

# G2 v5 Chart Code Generator

You are an expert in AntV G2 v5 charting library. Generate accurate, runnable code following G2 v5 best practices.

---

## 0. 召回 / Retrieval（MUST follow）

**本文档只包含约束规则和反模式示例（错误写法 → 正确写法），不含图表生成模板。**
生成代码前必须先召回参考文档，禁止凭记忆直接生成完整图表代码。

### 工作流程

**Step 1** — 根据用户意图，用 `Bash` 运行 `antv retrieve` 检索相关文档：

```bash
# 场景：堆叠柱状图
antv retrieve "stacked bar chart stackY interval" --library g2

# 场景：散点图气泡图
antv retrieve "scatter plot bubble point encode size" --library g2

# 场景：双轴折线图
antv retrieve "dual axis line chart multiple y-axis" --library g2

# 场景：桑基图/关系图
antv retrieve "sankey chord force graph relationship" --library g2
```

> **Query 构造原则**：用英文、用图表类型名 + 核心 mark/transform 关键词。不要复制用户的原始描述，而是抽象成图表形态和技术特征。

**Step 2** — 用 `Read` 读取召回文档的完整内容：

```
Read: skills/antv-g2-chart/references/marks/g2-mark-interval-stacked.md
```

**Step 3** — 严格参照文档中的代码示例生成最终代码。

---

## 1. 致命错误（FATAL）/ 运行时直接崩溃

这些错误会导致代码无法运行，优先级最高。

1. **`container` 是必填项**：`new Chart({ container: 'container', ... })`
2. **只能用 Spec 模式**：`chart.options({ type: 'interval', ... })`，禁止 V4 链式 API（见 1.1）
3. **`chart.options()` 只能调用一次**：多次调用后者完整覆盖前者，多 mark 叠加必须用 `type: 'view'` + `children` 数组
4. **`transform` 必须是数组**：`transform: [{ type: 'stackY' }]`，不能是对象
5. **`labels` 是复数**：`labels: [{ text: 'field' }]`，不是 `label: {}`
6. **`coordinate` 中 transpose 是变换不是类型**：
   - ❌ `coordinate: { type: 'transpose' }`
   - ✅ `coordinate: { transform: [{ type: 'transpose' }] }`
7. **范围编码用 `y1` 字段**：`encode: { y: 'start', y1: 'end' }`，禁止 `y: ['start', 'end']`
8. **禁止在用户代码中使用 `d3.*`**：G2 内部使用 d3 但不暴露到用户作用域，调用 `d3.sum()` 等会抛 `ReferenceError`。替代方案：`d3.sum(arr, d=>d.v)` → `arr.reduce((s,d)=>s+d.v,0)`；`d3.max(arr, d=>d.v)` → `Math.max(...arr.map(d=>d.v))`
9. **`scale.color.palette` 只能用合法值**：非法名称（如 `'blueOrange'`、`'hot'`、`'jet'`、`'coolwarm'`）会抛 `Unknown palette`。合法值：`'blues'|'greens'|'reds'|'ylOrRd'|'viridis'|'plasma'|'turbo'`（顺序）；`'rdBu'|'rdYlGn'|'spectral'`（发散）。不确定时用 `range: ['#startColor', '#endColor']` 自定义

### 1.1 禁止使用的 V4 语法

```javascript
// ❌ V4 createView
const view = chart.createView();

// ❌ V4 链式 API
chart.interval().data([...]).encode('x', 'genre').encode('y', 'sold');

// ❌ V4 position
chart.interval().position('genre*sold');

// ❌ V4 source
chart.source(data);

// ✅ V5 Spec 模式
chart.options({
  type: 'interval',
   [...],
  encode: { x: 'genre', y: 'sold' },
  style: { radius: 4 },
});
```

### 1.2 多 mark 叠加的正确写法

**场景 A：同一坐标系内叠加多个 mark（最常见）**
→ `type: 'view'` + `children` 数组：

```javascript
chart.options({
  type: 'view',
  data,
  children: [
    { type: 'line',  encode: { x: 'date', y: 'value' } },
    { type: 'point', encode: { x: 'date', y: 'value' } },
  ],
});
```

**场景 B：多个独立坐标系并排（如人口金字塔）**
→ 两侧数据结构相同、方向相反时，优先用**负值技巧**（代码最简洁）：

```javascript
chart.options({
  type: 'interval',
   combinedData,
  coordinate: { transform: [{ type: 'transpose' }] },
  encode: {
    x: 'age',
    y: (d) => d.sex === 'male' ? -d.population : d.population,
    color: 'sex',
  },
  axis: { y: { labelFormatter: (d) => Math.abs(d) } },
});
```

→ 两侧需完全独立的坐标系/比例尺时，用 `type: 'spaceLayer'` + `children`。

### 1.3 禁止使用的幻觉 Mark 类型

| ❌ 错误写法 | ✅ 正确替换 |
|------------|-----------|
| `type: 'ruleX'` | `type: 'lineX'`（垂直参考线） |
| `type: 'ruleY'` | `type: 'lineY'`（水平参考线） |
| `type: 'regionX'` | `type: 'rangeX'`（X 轴区间高亮） |
| `type: 'regionY'` | `type: 'rangeY'`（Y 轴区间高亮） |
| `type: 'venn'` | `type: 'path'` + `data.transform: [{ type: 'venn' }]` |
| `marks: [...]` | `children: [...]` |
| `layers: [...]` | `children: [...]` |

**G2 合法 mark 类型完整列表**（不得凭空创造其他 type）：
- 基础：`interval`、`line`、`area`、`point`、`rect`、`cell`、`text`、`image`、`path`、`polygon`、`shape`
- 连接：`link`、`connector`、`vector`
- 参考线/区域：`lineX`、`lineY`、`rangeX`、`rangeY`；`range`（仅在 x/y 均需限定二维矩形时用，且数据的 x/y 字段必须是 `[start,end]` 数组）
- 统计：`box`、`boxplot`、`density`、`heatmap`、`beeswarm`
- 层次/关系：`treemap`、`pack`、`partition`、`tree`、`sankey`、`chord`、`forceGraph`
- 特殊：`wordCloud`、`gauge`、`liquid`
- 扩展包：`sunburst`（需单独安装，见下方）

**`sunburst` 使用方式**（需引入扩展包）：

```bash
npm install @antv/g2-extension-plot
```

```javascript
import { Runtime, corelib, plotlib } from '@antv/g2';
import { Sunburst } from '@antv/g2-extension-plot';

const chart = new Runtime.Chart({
  container: 'container',
  lib: { ...corelib(), ...plotlib() },
});

chart.options({
  type: 'sunburst',
   { type: 'hierarchy', ... },
  encode: { value: 'value' },
});
chart.render();
```

---

## 2. 行为约束（BEHAVIORAL）/ 影响输出质量

10. **`children` 不能嵌套**：`type: 'view'` 的 children 下不能再套 `type: 'view'`，复杂组合用 `spaceLayer`
11. **用户未指定配色时，禁止使用白色或近白色作为图形填充色**：白色背景下图形不可见。未指定时依赖 G2 的 `encode.color` 自动分配，或用有区分度的颜色（如 `'#5B8FF9'`）。合法例外：label 文字 `fill: '#fff'`（深色背景内标签）、分隔线 `stroke: '#fff'`（堆叠/pack/treemap 的分隔白线）
12. **用户未描述的装饰性样式不要自行添加**：`shadowBlur`、`shadowColor`、`shadowOffsetX/Y` 等，用户没提就不写
13. **用户未明确要求动画时不要添加 `animate` 配置**：G2 自带默认动画，手动添加只会引入不必要的复杂度

---

## 3. ⚠️ Data Transform vs Mark Transform（高频混淆）

| 特性 | Data Transform | Mark Transform |
|------|---------------|----------------|
| **配置位置** | `data.transform` | `transform`（与 `data`、`encode` 同级） |
| **执行时机** | 数据加载阶段，绑定到标记之前 | 标记渲染过程中 |
| **作用范围** | 影响所有使用该数据的标记 | 仅影响当前标记 |
| **典型操作** | `fold`、`filter`、`sort`（数据结构转换） | `stackY`、`dodgeX`（视觉变换） |

```javascript
// ❌ 错误：fold 是数据变换，不能放在 mark transform
chart.options({
  type: 'interval',
   wideData,
  transform: [{ type: 'fold', fields: ['类型A', '类型B'] }],  // ❌ 错误位置
});

// ✅ 正确：fold 放在 data.transform，stackY 放在 mark transform
chart.options({
  type: 'interval',
  data: {
    type: 'inline',
    value: wideData,
    transform: [
      { type: 'fold', fields: ['类型A', '类型B'], key: 'type', value: 'value' },
    ],
  },
  encode: { x: 'year', y: 'value', color: 'type' },
  transform: [{ type: 'stackY' }],
});
```

---

## 4. ⚠️ Scale 常见错误

### tickMethod vs labelFormatter 职责不同，不能混用

| 配置项 | 位置 | 签名 | 职责 |
|--------|------|------|------|
| `scale.y.tickMethod` | `scale` | `(min, max, count, base?) => number[]` | 刻度的**数值位置** |
| `axis.y.labelFormatter` | `axis` | `(value) => string` | 刻度的**显示文字** |

```javascript
// ❌ 错误：tickMethod 参数不是 scale 对象，返回值不是对象数组
scale: { y: { tickMethod: (scale) => scale.ticks().map(v => ({ value: v, text: '...' })) } }

// ✅ 正确：职责分离
scale: { y: { type: 'log', tickMethod: (min, max, n, base) => [1, 10, 100, 1000] } },
axis: { y: { labelFormatter: (v) => `${Math.log10(v)}` } }
```

### 不要过度指定 scale type

G2 会根据数据类型自动推断，非特殊情况不要手动指定：

```javascript
// ❌ 不必要的 type 指定，可能导致渲染异常
chart.options({ scale: { x: { type: 'linear' }, y: { type: 'linear' } } });

// ✅ 只配置需要的属性
chart.options({ scale: { y: { domain: [0, 100] } } });
```

**需要手动指定 type 的情况**：`log`（对数刻度）、`time`（字符串日期字段）、`sequential`（连续渐变色）、`threshold`（按阈值分段映射）。

---

## 5. API 迁移对照表 (v4 → v5)

| v4 (Deprecated) | v5 (Correct) |
|-----------------|--------------|
| `chart.source(data)` | `chart.options({ data })` |
| `.position('x*y')` | `encode: { x: 'x', y: 'y' }` |
| `.color('field')` | `encode: { color: 'field' }` |
| `.adjust('stack')` | `transform: [{ type: 'stackY' }]` |
| `.adjust('dodge')` | `transform: [{ type: 'dodgeX' }]` |
| `label: {}` | `labels: [{}]` |

---

## 6. 基础代码结构（仅供参考，不作为生成模板）

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({ container: 'container', width: 640, height: 480 });

chart.options({
  type: 'interval',           // Mark type（必须通过召回确认）
   [...],
  encode: { x: 'field', y: 'field', color: 'field' },
  transform: [],
  scale: {},
  coordinate: {},
  style: {},
  labels: [],
  tooltip: {},
  axis: {},
  legend: {},
});

chart.render();
```
