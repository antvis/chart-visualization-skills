---
name: antv-g2-chart
description: "Use this skill whenever the user wants to create, customize, or troubleshoot G2 v5 chart visualizations. Triggers include: any mention of 'G2', 'antv g2', '@antv/g2', 'G2 chart', 'G2 可视化', or requests to produce charts like bar charts (柱状图), line charts (折线图), pie charts (饼图), scatter plots (散点图), area charts (面积图), heatmap (热力图), radar charts (雷达图), treemap (矩形树图), funnel charts (漏斗图), sankey diagrams (桑基图), gauge (仪表盘), wordcloud (词云), boxplot (箱线图), as well as G2-specific topics like encode channels, scale config, coordinate systems, transforms, interactions, themes, labels, and animations. Also use when debugging G2 rendering errors, V4→V5 migration issues, or chart type selection. Do NOT use for G6 graph/network visualization, X6 editor diagrams, or S2 pivot tables."
tools:
  - curl
---

# G2 v5 Chart Visualization

## Overview

G2 v5 is AntV's grammar-of-graphics charting library. It uses **Spec Mode** — a declarative, JSON-like configuration style. Generated examples should start from a complete spec; runtime code may later merge a local update through `chart.options()`.

```javascript
import { Chart } from '@antv/g2';

const chart = new Chart({ container: 'container', autoFit: true });
chart.options({
  type: 'interval',
  data: [{ genre: 'Sports', sold: 275 }],
  encode: { x: 'genre', y: 'sold' },
});
chart.render();
```

### CDN Usage

```html
<script src="https://unpkg.com/@antv/g2@5/dist/g2.min.js"></script>
<script>
  const chart = new G2.Chart({ container: 'container', autoFit: true });
  chart.options({
    type: 'interval',
    data: [{ genre: 'Sports', sold: 275 }],
    encode: { x: 'genre', y: 'sold' },
  });
  chart.render();
</script>
```

## Content Retrieval Service

When using AntV G2 for data visualization, if you need to understand the concepts, usage, API, examples, and other aspects of G2 v5, you can use the provided context retrieval service. When using the skill, content is retrieved via an antv HTTP API server using GET requests.

- Host: `https://sive.antv.antgroup.com`
- Endpoint: `/api/v1/context/retrieve`
- Method: `GET`
- Parameters: `query`, `library`, `topK`, `content`, `maxTokens`

Retrieve reference documents by query (hybrid search = FTS + vector + RRF fusion).

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | ✅ | Search keywords, e.g. `bar chart interval` |
| `library` | string | ✅ | Library name: `g2`, `g6`, `x6` |
| `topK` | number | | Number of results to return (default: 5) |
| `content` | boolean | | Return full reference doc markdown (default: true) |
| `maxTokens` | number | | Max tokens per result (default: unlimited) |

```bash
curl "https://sive.antv.antgroup.com/api/v1/context/retrieve?query=bar+chart+stacked&library=g2"
```

## Critical Rules

### MUST: Use V5 Spec Mode ONLY

```javascript
// ❌ WRONG — V4 chain API (deprecated, will not render)
chart.interval()
  .data([...])
  .encode('x', 'genre')
  .encode('y', 'sold')
  .style({ radius: 4 });

// ✅ CORRECT — V5 Spec Mode
chart.options({
  type: 'interval',
  data: [...],
  encode: { x: 'genre', y: 'sold' },
  style: { radius: 4 },
});
```

### Multi-mark overlays use `view + children`

`chart.options()` supports incremental deep-merge updates, which is useful for runtime interaction. For generated one-shot code, provide a complete initial spec. To create independent overlay marks, use one `type: 'view'` with `children`; sequentially changing the root `type` does not create an overlay.

```javascript
// ❌ WRONG — this changes one root mark from line to point; it does not overlay them
chart.options({ type: 'line', data, encode: { x: 'date', y: 'value' } });
chart.options({ type: 'point', data, encode: { x: 'date', y: 'value' } });

// ✅ CORRECT — children array for multi-mark
chart.options({
  type: 'view',
  data,
  children: [
    { type: 'line',  encode: { x: 'date', y: 'value' } },
    { type: 'point', encode: { x: 'date', y: 'value' } },
  ],
});
```

### MUST: `container` is mandatory, `chart.render()` at the end

```javascript
// ❌ WRONG — no container, no render
const chart = new Chart();
chart.options({ type: 'interval', data });

// ✅ CORRECT
const chart = new Chart({ container: 'container', autoFit: true });
chart.options({ type: 'interval', data, encode: { x: 'genre', y: 'sold' } });
chart.render();
```

### MUST: Correct mark types only

| ❌ Hallucinated (from ECharts/Vega) | ✅ G2 correct replacement |
|---|---|
| `type: 'ruleX'` | `type: 'lineX'` |
| `type: 'ruleY'` | `type: 'lineY'` |
| `type: 'regionX'` | `type: 'rangeX'` |
| `type: 'regionY'` | `type: 'rangeY'` |
| `type: 'venn'` | `type: 'path'` + transform |

**Legal G2 marks**: `interval`, `line`, `area`, `point`, `rect`, `cell`, `text`, `image`, `path`, `polygon`, `shape`, `link`, `connector`, `vector`, `lineX`, `lineY`, `rangeX`, `rangeY`, `range`, `box`, `boxplot`, `density`, `heatmap`, `beeswarm`, `treemap`, `pack`, `partition`, `tree`, `sankey`, `chord`, `wordCloud`, `gauge`, `liquid`. `sunburst` requires `@antv/g2-extension-plot`.

### MUST: `encode` is an object, `transform` is an array

```javascript
// ❌ WRONG
.encode('x', 'genre')
.transform: { type: 'stackY' }

// ✅ CORRECT
encode: { x: 'genre', y: 'sold' }
transform: [{ type: 'stackY' }]
```

### MUST: `labels` is plural; range encodings use mark-appropriate channels

```javascript
// ❌ WRONG
label: { text: 'sold' }

// ✅ CORRECT
labels: [{ text: 'sold' }]
// Interval / link ranges may use either a two-field array or y + y1.
encode: { y: ['start', 'end'] }
// RangeY explicitly uses y + y1.
encode: { y: 'start', y1: 'end' }
```

### MUST: No d3 in user code

```javascript
// ❌ WRONG — d3 is not exposed in user scope
const total = d3.sum(data, d => d.value);

// ✅ CORRECT — use native JS or G2 built-in transforms
const total = data.reduce((sum, d) => sum + d.value, 0);
```

### MUST: No white/near-white fill, no `padding` as array

```javascript
// ❌ WRONG
style: { fill: '#fff' }       // invisible on white background
padding: [40, 30, 40, 50]     // invalid in G2 v5

// ✅ CORRECT
encode: { color: 'group' }    // let G2 assign colors
padding: 40                   // single number or 'auto'
```

### MUST: Transpose is a transform, not a coordinate type

```javascript
// ❌ WRONG
coordinate: { type: 'transpose' }

// ✅ CORRECT
coordinate: { transform: [{ type: 'transpose' }] }
```

## Default Aesthetics / 默认视觉基线

目标是默认清晰、克制、可读，而不是给每张图添加相同装饰。先遵守以下决策，再按需检索 `default+aesthetics+design` 获取完整示例。

> 注意区分两种“默认”。G2 引擎默认（`theme/create.ts`）是 `line.lineWidth: 1`、`area.fillOpacity: 0.85`、矩形 `radius` 无圆角；本节 Mark 基线里的 `radius: 4` / `lineWidth: 2` / `fillOpacity: 0.5~0.6` 是本 skill 的**约定值**，用来覆写引擎默认让生成示例更好看，必须显式写在 `style` 里，不是省略即生效。

1. **通用**：`container`、完整初始 `chart.options()` spec、`chart.render()` 是必须项；普通嵌入式图优先 `autoFit: true`、`theme: 'classic'` 与 `padding: 'auto'`。`classic` 是为稳定视觉显式选择的浅色预设，不是引擎默认主题（引擎默认推断为 `light`）；深色容器使用 `classicDark`。两者共用同一套 `category10` 色板（首选 `#5B8FF9`），因此稳定主色在浅/深主题下都可用。
2. **颜色表达语义**：仅当颜色表示独立的系列、状态或分组时使用 `encode.color` 和图例。单指标分类比较使用稳定单色（如 `style.fill: '#5B8FF9'`，作为样式值是合法的）并关闭颜色图例，避免彩虹柱和冗余图例。禁止的是把 hex 字符串存进数据后作为 `encode.color` 的类别字段编码。
3. **Mark 基线**（约定值，覆写引擎默认）：interval 用 `radius: 4`（引擎默认无圆角）；line 用 `lineWidth: 2`（引擎默认 `1`）；area 用 `fillOpacity: 0.5~0.6`（引擎默认 `0.85`，偏实，降下来更透气）。这些值都需显式写在 `style` 里，不是省略即生效；不需要渐变、阴影或自定义动画。
4. **文本只用已知语义**：字段/单位/来源明确时，添加语义化轴标题、tooltip 名称和 formatter；报告语境或用户提供标题时添加顶层 `title`。信息未知时省略，不编造单位、来源或副标题。
5. **标签按密度选择**：少量且需精确读取的数据可加标签；密集散点、多系列折线、类别很多时默认依赖 tooltip。inside 标签用 `contrastReverse`，发生碰撞时使用 `overlapHide` / `overlapDodgeY` / `overflowHide`；`dx` / `dy` 只用于避让后的细微调整。
6. **特殊图**：饼/环图的少量类别优先外置标签，类别较多时改用 legend；不要默认同时重复两者。气泡图保持 G2 默认 sqrt size 映射，按数据范围设置 `size.range`，仅在 size legend 无助理解时隐藏它。

渐变、阴影、滑块、滚动条、自定义动画和 3D 气泡都属于用户明确要求“报告级 / 精致”时的增强项；添加前必须确认不会掩盖数据或降低标签对比度。

## Quick Reference

| User Intent | Retrieve Query |
|---|---|
| Chart initialization, container, autoFit | `GET /api/v1/context/retrieve?query=chart+init&library=g2` |
| Bar / column chart | `GET /api/v1/context/retrieve?query=bar+chart+interval&library=g2` |
| Line / area chart | `GET /api/v1/context/retrieve?query=line+area+chart&library=g2` |
| Pie / donut / rose chart | `GET /api/v1/context/retrieve?query=pie+chart+theta&library=g2` |
| Scatter / bubble | `GET /api/v1/context/retrieve?query=scatter+point+bubble&library=g2` |
| Treemap / sunburst / pack | `GET /api/v1/context/retrieve?query=treemap+sunburst+pack&library=g2` |
| Heatmap / density / boxplot | `GET /api/v1/context/retrieve?query=heatmap+density+boxplot&library=g2` |
| Funnel / gauge / wordcloud | `GET /api/v1/context/retrieve?query=funnel+gauge+wordcloud&library=g2` |
| Encode channels (x, y, color, size) | `GET /api/v1/context/retrieve?query=encode+channel&library=g2` |
| Scale / palette / color range | `GET /api/v1/context/retrieve?query=scale+palette+color&library=g2` |
| Coordinate (polar, theta, transpose) | `GET /api/v1/context/retrieve?query=coordinate+polar+theta+transpose&library=g2` |
| Transform (stack, normalize, sort) | `GET /api/v1/context/retrieve?query=transform+stack+normalize&library=g2` |
| Axis / legend / tooltip / labels | `GET /api/v1/context/retrieve?query=axis+legend+tooltip+label&library=g2` |
| Interaction (brush, highlight, drilldown) | `GET /api/v1/context/retrieve?query=interaction+brush+highlight&library=g2` |
| Theme / dark mode | `GET /api/v1/context/retrieve?query=theme+dark+classicDark&library=g2` |
| Default aesthetics / 视觉基线 | `GET /api/v1/context/retrieve?query=default+aesthetics+design&library=g2` |
| Animation | `GET /api/v1/context/retrieve?query=animation+animate&library=g2` |
| Data fetch / filter / sort | `GET /api/v1/context/retrieve?query=data+fetch+filter+sort&library=g2` |
| Facet / view composition | `GET /api/v1/context/retrieve?query=facet+view+composition&library=g2` |
| Chart type selection guide | `GET /api/v1/context/retrieve?query=chart+type+selection&library=g2` |
| Rendering troubleshoot | `GET /api/v1/context/retrieve?query=rendering+troubleshoot+debug&library=g2` |

## Dependencies

- `@antv/g2` — G2 v5 charting engine
