---
name: antv-gpt-vis
description: Recommend and generate appropriate data visualization charts using the GPT-Vis library. Supports two output modes — (1) Syntax mode, which generates Syntax or JSON configurations, and (2) Code mode, which generates complete runnable code. Supports 26 chart types.
---

# GPT-Vis Chart Visualization Skill

GPT-Vis is an AI-native visualization library designed for the LLM era. It uses a framework-agnostic architecture, supports 26 chart types, and enables LLMs to easily generate high-quality visualizations through a simple, natural syntax.

## Steps

1. **Intent recognition**: Select the chart type based on user intent and data characteristics
2. **Determine output mode**: Choose Syntax mode or Code mode based on context
3. **Generate output**: Produce content in the selected mode

## Supported Chart Types

| type value         | Use case                                  |
| ------------------ | ----------------------------------------- |
| line               | Time series trends                        |
| area               | Time series trends + totals               |
| column             | Categorical data comparison               |
| bar                | Categorical comparison (long labels)      |
| pie                | Part-to-whole proportions                 |
| scatter            | Relationship between two variables        |
| dual-axes          | Comparison of data at different scales    |
| histogram          | Frequency distribution of continuous values |
| boxplot            | Data distribution and outliers            |
| violin             | Data distribution density                 |
| radar              | Multi-dimensional comparison              |
| funnel             | Process conversion rates                  |
| waterfall          | Cumulative increases and decreases        |
| liquid             | Percentage / progress                     |
| word-cloud         | Word frequency display                    |
| venn               | Set intersection/union relationships      |
| treemap            | Hierarchical data proportions             |
| sankey             | Flow and direction of quantities          |
| flow-diagram       | Process steps                             |
| mindmap            | Hierarchical knowledge organization       |
| indented-tree      | Tree node hierarchy / directories         |
| network-graph      | Relationships between entities            |
| organization-chart | Organizational hierarchy                  |
| fishbone-diagram   | Root cause analysis                       |
| table              | Tabular data display                      |
| summary            | Content summary                           |

## Output Modes

### Mode 1: Syntax Mode (Syntax / JSON)

Used for LLM application integration scenarios. Generates chart configurations consumed by `GPTVis.render()`. Supports two formats:

- **Syntax format**: Markdown-like indentation syntax, suitable for streaming output (renders in real time as the LLM generates tokens)
- **JSON format**: Standard JSON object, suitable for structured API calls

Both formats are equivalent and can be passed directly to `GPTVis.render()`.

### Mode 2: Code Mode

Used when the user needs complete runnable code. Generates output including installation instructions and full code.

## GPTVis API

`GPTVis` is the unified entry class of the library, responsible for creating, rendering, and destroying charts.

### Constructor

```typescript
new GPTVis(options: VisualizationOptions)
```

**VisualizationOptions:**

| Parameter   | Type                                          | Required | Default   | Description                                                    |
| ----------- | --------------------------------------------- | -------- | --------- | -------------------------------------------------------------- |
| `container` | `string \| HTMLElement`                       | Yes      | —         | CSS selector or DOM element                                    |
| `width`     | `number`                                      | No       | —         | Chart width (px)                                               |
| `height`    | `number`                                      | No       | —         | Chart height (px)                                              |
| `theme`     | `'default' \| 'light' \| 'dark' \| 'academy'` | No       | `'light'` | Theme                                                          |
| `wrapper`   | `boolean`                                     | No       | `false`   | Whether to show the outer UI container (tabs, download, copy)  |
| `locale`    | `string`                                      | No       | `'zh-CN'` | Language of the text inside the wrapper                        |

### Methods

#### `render(config: string | object): void`

Renders a chart. Accepts two kinds of input:

- **Syntax string**: Text starting with `vis [type]`, automatically parsed into a configuration object
- **JSON configuration object**: An object containing a `type` field
- **Plain text**: Strings not starting with `vis ` are rendered as the summary type

Calling `render()` multiple times automatically destroys the previous chart before rendering the new one.

#### `destroy(): void`

Destroys the current chart instance and releases resources.

## Syntax Mode: JSON Format

Directly output a JSON object conforming to the chart's TypeScript type; `GPTVis.render()` can consume it directly.

### JSON Example

```json
{
  "type": "column",
  "data": [
    { "category": "Product A", "value": 30, "group": "Online" },
    { "category": "Product B", "value": 50, "group": "Online" }
  ],
  "title": "Product Sales Comparison",
  "axisXTitle": "Product",
  "axisYTitle": "Sales (10k)",
  "stack": true,
  "theme": "academy",
  "style": {
    "palette": ["#5B8FF9", "#61DDAA"]
  }
}
```

## Syntax Mode: Syntax Format

Markdown-like indentation syntax that supports streaming rendering. The first line must be `vis [type]`.

### Syntax Rules

**Basic properties** — `key value`, one per line:

```
title Annual Trend
theme dark
```

**Object arrays** — under `data`, each item starts with `- `, with sub-fields indented:

```
{ data: { time: string; value: number; }[]; }
```

Corresponds to:

```
data
  - time 2020
    value 100
  - time 2021
    value 120
```

**Plain value arrays** — each item starts with `- `:

```
{ data: number[] }
```

Corresponds to:

```
data
  - 10
  - 20
```

**String values containing spaces** — wrap in quotes (single or double); quotes can be omitted when there are no spaces:

```
categories
  - "North America"
  - 'Southeast Asia'
  - Europe
```

**Nested objects** — the object name occupies its own line, with sub-properties indented:

```
{ style?: { backgroundColor?: string; palette?: string[] } }
```

Corresponds to:

```
style
  backgroundColor #f0f2f5
  palette
    - #5B8FF9
    - #61DDAA
```

**Recursive trees** — the `children` array is indented with `- `:

```
type TreeData = { name: string; children?: TreeData[] };
{ data: TreeData; }
```

Corresponds to:

```
data
  name Root
  children
    - name Child A
      children
        - name Grandchild
    - name Child B
```

### Complete Syntax Example

```
vis column
data
  - category Product A
    value 30
    group Online
  - category Product B
    value 50
    group Online
title Product Sales Comparison
axisXTitle Product
axisYTitle Sales (10k)
stack true
theme academy
style
  palette
    - #5B8FF9
    - #61DDAA
```

### Markdown Syntax

When the output is in Markdown format, use `GPT-Vis` as the language tag of the fenced code block, and write the complete [Syntax format](#syntax-mode-syntax-format) in the content area:

````markdown
```GPT-Vis
vis line
data
  - time 2020
    value 100
```
````

**Format:**

````
```GPT-Vis
<complete Syntax content, first line: vis <chart-type>>
```
````

**Syntax rules:**

- The language tag is fixed as `GPT-Vis`
- The content area follows the [Syntax format](#syntax-mode-syntax-format) rules, and **the first line must contain `vis <chart-type>`** (see the full list in [Supported Chart Types](#supported-chart-types) above)
- The code block is converted by the Markdown plugin into <code class="language-gpt-vis"> and rendered on the browser side

> **Note**: In Markdown mode, the content area **must** include the first line `vis <type>`, consistent with the plain Syntax mode format.

## Code Mode

Generate complete runnable code based on the target framework.

### Installation

**NPM:**

```bash
npm install @antv/gpt-vis
```

```javascript
import { GPTVis } from '@antv/gpt-vis';
```

**CDN:**

```html
<script src="https://unpkg.com/@antv/gpt-vis/dist/umd/index.min.js"></script>
```

After loading via CDN, access the main class through `GPTVis.GPTVis`.

### Complete HTML Example

```html
<html>
  <head>
    <script src="https://unpkg.com/@antv/gpt-vis/dist/umd/index.min.js"></script>
  </head>
  <body>
    <div id="container"></div>
    <script>
      const gptVis = new GPTVis.GPTVis({
        container: '#container',
        width: 600,
        height: 400,
      });

      gptVis.render(`
vis line
data
  - time 2020
    value 100
  - time 2021
    value 120
title Annual Trend
`);
    </script>
  </body>
</html>
```

## Chart Type Configurations

### Common Configuration

All charts include the following fields, which are omitted from the individual chart type definitions below. Each section heading is the `type` value (e.g. `line`, `column`), corresponding to the type column in the chart type table above.

```
{ type: string; title?: string; theme?: 'default' | 'light' | 'dark' | 'academy'; style?: { backgroundColor?: string; palette?: string[] } }
```

### line / area

```
{ data: { time: string | number; value: number; group?: string }[]; axisXTitle?: string; axisYTitle?: string; stack?: boolean; style?: { lineWidth?: number } }
```

`stack` is only supported by area.

### column / bar

```
{ data: { category: string; value: number; group?: string }[]; axisXTitle?: string; axisYTitle?: string; stack?: boolean; group?: boolean }
```

### pie

Values must not be percentage numbers.

```
{ data: { category: string; value: number }[]; innerRadius?: number }
```

Set `innerRadius` to 0.6 to turn it into a donut chart.

### scatter

```
{ data: { x: number; y: number; group?: string }[]; axisXTitle?: string; axisYTitle?: string }
```

### dual-axes

```
{ categories: string[]; series: { type: 'line' | 'column'; data: number[]; axisYTitle?: string }[]; axisXTitle?: string; style?: { startAtZero?: boolean } }
```

### histogram

```
{ data: number[]; binNumber?: number; axisXTitle?: string; axisYTitle?: string }
```

### boxplot / violin

Multiple data points are required for the same category to show distribution.

```
{ data: { category: string; value: number; group?: string }[]; axisXTitle?: string; axisYTitle?: string; style?: { startAtZero?: boolean } }
```

### radar

```
{ data: { name: string; value: number; group?: string }[]; align?: boolean }
```

`align`: whether to align the scales of all dimensions. Defaults to false (each axis scales independently); when true, all axes share the same maximum value, suitable for comparing absolute values across multiple series.

### funnel

```
{ data: { category: string; value: number; }[]; }
```

### waterfall

Values can be negative to indicate decrease. `palette` is a color array in the order [positive color, negative color, total color].

```
{ data: { category: string; value: number }[]; axisXTitle?: string; axisYTitle?: string; style?: { palette?: string[] } }
```

### liquid

`percent` ranges from 0 to 1.

```
{ percent: number; shape?: 'rect' | 'circle' | 'pin' | 'triangle' }
```

### word-cloud

```
{ data: { text: string; value: number; }[]; }
```

### venn

Intersections use commas to separate set identifiers: `sets: "A,B"`. `label` is used to display the name of the corresponding set on the chart.

```
{ data: { sets: string | string[]; value: number; label?: string }[] }
```

### treemap

```
type TreeNode = { name: string; value: number; children?: TreeNode[] };
{ data: TreeNode[] }
```

### sankey

```
{ data: { source: string; target: string; value: number }[]; nodeAlign?: 'left' | 'center' | 'right' | 'justify' }
```

### flow-diagram / network-graph

`source`/`target` reference node `name` values.

```
type GraphData = { nodes: { name: string }[]; edges: { source: string; target: string; name?: string }[] };

// flow-diagram
{ data: GraphData }

// network-graph
{ data: GraphData; layout?: 'force' | 'circular' | 'grid' | 'radial' | 'concentric' | 'dagre' }
```

### mindmap / indented-tree / organization-chart

```
type TreeData = { name: string; children?: TreeData[] };

// mindmap
{ data: TreeData; direction?: 'H' | 'LR' | 'RL' }

// indented-tree
{ data: TreeData; direction?: 'LR' | 'RL' | 'H' }

// organization-chart
type OrganizationChartData = {
  name: string;
  description?: string;
  children?: OrganizationChartData[];
};

{ data: OrganizationChartData }
```

mindmap defaults to `'H'`; indented-tree defaults to `'LR'`.

### fishbone-diagram

```
type FishboneNode = { name: string; children?: FishboneNode[] };
{ data: FishboneNode; style?: { texture?: 'rough' | 'default' } }
```

`texture: 'rough'` produces a hand-drawn style.

### table

```
{ data: Record<string, string | number>[]; }
```

### summary

**summary is completely different from other chart types**: it does not use Syntax/JSON configuration, but instead uses T8 syntax (Markdown + semantic annotations).

**⚠️ Before generating a summary, you must**: first read [references/summary.md](references/summary.md) to get the T8 syntax rules, the complete entity type list, attribute field definitions, generation requirements, and examples, and only then generate the content. Skipping this step will cause syntax errors.

## Best Practices

1. Keep pie charts to no more than 5 categories; merge the rest into "Other" or switch to a bar chart
2. Do not use pie charts for trends, and do not use line charts for unordered categories
3. Value fields must be numeric; category fields must be text
4. Distributions of continuous values (e.g. salaries, scores, ages) must use histogram
5. Multi-dimensional field mapping: when there are two categorical dimensions, write the x-axis dimension as `time`/`category` and the other as `group`
6. In Syntax mode, prefer the Syntax format (streaming-friendly)
7. In Code mode, default to the HTML + CDN approach (zero installation); use the npm approach only when the user specifies a framework
