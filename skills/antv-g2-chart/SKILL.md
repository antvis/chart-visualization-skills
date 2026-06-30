---
name: antv-g2-chart
description: "Use this skill whenever the user wants to create, customize, or troubleshoot G2 v5 chart visualizations. Triggers include: any mention of 'G2', 'antv g2', '@antv/g2', 'G2 chart', 'G2 可视化', or requests to produce charts like bar charts (柱状图), line charts (折线图), pie charts (饼图), scatter plots (散点图), area charts (面积图), heatmap (热力图), radar charts (雷达图), treemap (矩形树图), funnel charts (漏斗图), sankey diagrams (桑基图), gauge (仪表盘), wordcloud (词云), boxplot (箱线图), as well as G2-specific topics like encode channels, scale config, coordinate systems, transforms, interactions, themes, labels, and animations. Also use when debugging G2 rendering errors, V4→V5 migration issues, or chart type selection. Do NOT use for G6 graph/network visualization, X6 editor diagrams, or S2 pivot tables."
---

# G2 v5 Chart Visualization

## Overview

G2 v5 is AntV's grammar-of-graphics charting library. It uses **Spec Mode** — a declarative, JSON-like configuration style where `chart.options()` defines the entire visualization in one call.

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

## Quick Reference

| User Intent | Retrieve Query |
|---|---|
| Chart initialization, container, autoFit | `POST /api/v1/context {"query":"chart init","library":"g2","topK":3,"content":true}` |
| Bar / column chart | `POST /api/v1/context {"query":"bar chart interval","library":"g2","topK":5,"content":true}` |
| Line / area chart | `POST /api/v1/context {"query":"line area chart","library":"g2","topK":5,"content":true}` |
| Pie / donut / rose chart | `POST /api/v1/context {"query":"pie chart theta","library":"g2","topK":5,"content":true}` |
| Scatter / bubble | `POST /api/v1/context {"query":"scatter point bubble","library":"g2","topK":5,"content":true}` |
| Treemap / sunburst / pack | `POST /api/v1/context {"query":"treemap sunburst pack","library":"g2","topK":5,"content":true}` |
| Heatmap / density / boxplot | `POST /api/v1/context {"query":"heatmap density boxplot","library":"g2","topK":5,"content":true}` |
| Funnel / gauge / wordcloud | `POST /api/v1/context {"query":"funnel gauge wordcloud","library":"g2","topK":5,"content":true}` |
| Encode channels (x, y, color, size) | `POST /api/v1/context {"query":"encode channel","library":"g2","topK":3,"content":true}` |
| Scale / palette / color range | `POST /api/v1/context {"query":"scale palette color","library":"g2","topK":3,"content":true}` |
| Coordinate (polar, theta, transpose) | `POST /api/v1/context {"query":"coordinate polar theta transpose","library":"g2","topK":5,"content":true}` |
| Transform (stack, normalize, sort) | `POST /api/v1/context {"query":"transform stack normalize","library":"g2","topK":5,"content":true}` |
| Axis / legend / tooltip / labels | `POST /api/v1/context {"query":"axis legend tooltip label","library":"g2","topK":5,"content":true}` |
| Interaction (brush, highlight, drilldown) | `POST /api/v1/context {"query":"interaction brush highlight","library":"g2","topK":5,"content":true}` |
| Theme / dark mode | `POST /api/v1/context {"query":"theme dark classicDark","library":"g2","topK":3,"content":true}` |
| Animation | `POST /api/v1/context {"query":"animation animate","library":"g2","topK":3,"content":true}` |
| Data fetch / filter / sort | `POST /api/v1/context {"query":"data fetch filter sort","library":"g2","topK":3,"content":true}` |
| Facet / view composition | `POST /api/v1/context {"query":"facet view composition","library":"g2","topK":3,"content":true}` |
| Chart type selection guide | `POST /api/v1/context {"query":"chart type selection","library":"g2","topK":3,"content":true}` |
| Rendering troubleshoot | `POST /api/v1/context {"query":"rendering troubleshoot debug","library":"g2","topK":3,"content":true}` |
| Library constraints (MUST read first) | `POST /info {"library":"g2"}` |

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

### MUST: `chart.options()` called exactly ONCE

Multiple calls **overwrite** each other. For multi-mark overlays, use `type: 'view'` + `children`:

```javascript
// ❌ WRONG — second options() overwrites the first
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

### MUST: `labels` is plural, range encoding uses y/y1

```javascript
// ❌ WRONG
label: { text: 'sold' }
encode: { y: ['start', 'end'] }

// ✅ CORRECT
labels: [{ text: 'sold' }]
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

## Content Retrieval

Skill content is retrieved via an antv HTTP API server.

Then use POST requests to retrieve relevant reference docs:

```bash
# Retrieve skills by query (hybrid search = FTS + vector + RRF)
curl -X POST https://antv.antgroup.com/api/v1/context \
  -H 'Content-Type: application/json' \
  -d '{"query":"bar chart stacked","library":"g2","topK":5,"content":true,"includeInfo":true}'

# Get core constraints (always read first before generating code)
curl -X POST https://antv.antgroup.com/api/v1/info \
  -H 'Content-Type: application/json' \
  -d '{"library":"g2"}'

# Get a specific skill by exact ID
curl -X POST https://antv.antgroup.com/api/v1/get \
  -H 'Content-Type: application/json' \
  -d '{"id":"g2-comp-axis-config"}'

# List all available skills
curl -X POST https://antv.antgroup.com/api/v1/list \
  -H 'Content-Type: application/json' \
  -d '{"library":"g2"}'
```

**Important**: Always call `/api/v1/info` first to load the core constraints, then `/api/v1/context` for specific topic docs. The `includeInfo: true` option in `/api/v1/context` automatically prepends constraints as the first result.

## How to Use

When a user asks about G2 chart development:

1. Call `POST /api/v1/info {"library":"g2"}` to load the core constraints
2. Identify the user's intent from the Quick Reference table above
3. Call `POST /api/v1/context` with the matching query, `content: true`, `includeInfo: true`
4. Generate code following the Critical Rules and retrieved reference docs
5. Always provide complete, runnable code examples

## Dependencies

- `@antv/g2` — G2 v5 charting engine