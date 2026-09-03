# Chart Visualization Skills

> Turning data into a visual language for better thinking.

<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*ZFK8SrovcqgAAAAAAAAAAAAAemJ7AQ/original" width="16" /> AntV ![stars](https://img.shields.io/github/stars/antvis?style=social), initiated by Ant Group and open-sourced starting in 2017, reimagines data visualization by embedding the theory of graphical grammar into the JavaScript language. In response to rigid chart libraries that force a trade-off between flexibility and usability, we have categorized data visualization techniques into four series: 2, 6, 7, and 8, which respectively represent _statistical analysis_, _graph analysis_, _geographical analysis_, and _unstructured data visualization_. We have expanded these capabilities across different levels, including chart libraries, R&D tools, and AI-powered intelligent visualization.

## Overview

In the era of data-driven decision-making, efficient and accurate data visualization and analysis are paramount. AntV offers a professional suite of visualization solutions, providing a robust toolkit and a comprehensive set of skills for the entire workflow—from chart design and interactive exploration to in-depth data analysis. It empowers users to swiftly transform complex datasets into intuitive visual charts, significantly lowering the barrier to creation through intelligent design specifications and a rich library of components. Whether for daily reporting, dynamic dashboards, or sophisticated interactive analysis, AntV delivers reliable support. By integrating AI capabilities, these tools further streamline and automate the generation and optimization of visualizations. This allows analysts to focus more on uncovering insights and driving business decisions, truly making data visible and understandable.

> [!WARNING]
> This project only merges AI-generated code.
>
> **How to contribute:**
> 1. Submit an issue describing the problem clearly
> 2. Assign it to @copilot with your requirements

## Usage

Add this marketplace to Claude Code:
```bash
/plugin marketplace add antvis/chart-visualization-skills
```

Or you can directly install the skills for your multiple agents:

```bash
npx skills add antvis/chart-visualization-skills
```

## Available Skills

- 📊 **chart-visualization**: A comprehensive chart generation skill powered by AntV that provides 26+ chart types for intelligent data visualization.

`Chart Visualization` intelligently selects the most appropriate chart type from 26+ available options, extracts parameters based on detailed specifications, and generates high-quality chart images. It covers time series, comparisons, part-to-whole, relationships, geographic, hierarchical, statistical, and specialized visualizations.

- 📈 **antv-g2-chart**: G2 v5 chart code generator. Use when users need to generate G2 charts — bar charts, line charts, pie charts, scatter plots, area charts, heatmaps, and any statistical data visualization with the G2 library.

`AntV G2 Chart` generates accurate, runnable G2 v5 code following Spec Mode best practices. It covers 30+ chart types (interval, line, area, point, rect, cell, treemap, sankey, chord, wordCloud, gauge, and more), data transforms (stackY, dodgeX, binX, fold, etc.), coordinate systems (cartesian, polar, theta, radial), scales, interactions (brush, slider, legend filter), components (axis, legend, tooltip, annotation), and multi-view compositions. Built-in guard rails prevent common v4→v5 migration pitfalls such as using deprecated chain APIs, invalid palette names, or referencing `d3` in user code.

- 🕸️ **antv-g6-graph**: G6 v5 graph visualization code generator. Use when users need to generate G6 graphs — network graphs, tree graphs, flow charts, mind maps, and any relational or graph-structured data visualization with the G6 library.

`AntV G6 Graph` generates accurate, runnable G6 v5 code following best practices. It covers core graph initialization, data structures (nodes, edges, combos), 10+ layout algorithms (force, dagre, circular, grid, mindmap, fishbone, etc.), all built-in node/edge/combo types, state management, 15+ behaviors (drag-canvas, zoom-canvas, click-select, lasso, etc.), 10+ plugins (minimap, tooltip, toolbar, legend, timebar, etc.), custom element development, transforms, and animation. Built-in guard rails prevent common v4→v5 migration pitfalls such as using deprecated `G6.Graph()` constructors, `graph.data()` APIs, or Mode-based behavior configuration.

- 🎯 **antv-x6-editor**: X6 v3 graph editor for interactive diagrams — flowcharts, DAGs, ER diagrams, org charts, UML, and custom graph editors. Triggers on any X6-related requests (nodes, edges, ports, plugins, layouts, serialization, HTML shapes, stencil, DnD).

`AntV X6 Editor` generates imperative X6 v3 diagram code with strict rule enforcement: no `graph.render()`, string-literal `container`, 11 official plugins only (`Selection`, `History`, `Clipboard`, etc.), proper background + defaults, and always `centerContent()` after modifications. Supports custom HTML nodes, edge routers/connectors, and all interactive editor features.

- 🤖 **gpt-vis**: AI-native visualization for the LLM era, powered by GPT-Vis. Supports 26 chart types with natural syntax that LLMs can generate effortlessly.

`GPT-Vis` provides framework-agnostic chart generation using a simple markdown-like syntax ideal for AI tools. It supports two output modes: (1) **Syntax mode** — generates declarative configuration for `GPTVis.render()` consumption (ideal for streaming), and (2) **Code mode** — generates complete runnable code for HTML/React/Vue. Includes built-in streaming support, fault tolerance, and intelligent defaults.

- 🎨 **infographic-creator**: Create beautiful infographics based on given text content. Use when users request to create infographics.

`Infographic Creator` uses AntV Infographic to transform data, information, and knowledge into a perceptible visual language. It combines visual design with data visualization, providing 50+ templates including lists, sequences, hierarchies, comparisons, relations, and charts. It compresses complex information with intuitive symbols to help audiences quickly understand and remember key points.

- 📝 **narrative-text-visualization**: Generate structured narrative text visualizations from data using T8 Syntax.

`Narrative Text Visualization` (T8) transforms unstructured data into semantically rich narrative reports using T8 Syntax - a declarative Markdown-like language for creating data narratives with entity annotations. It's LLM-friendly and framework-agnostic, working seamlessly with HTML, React, and Vue. Perfect for creating data analysis reports, summaries, and insights documents with entities like metrics, values, trends, and dimensions properly labeled. Features include built-in mini charts, standardized styling, and professional formatting. Supports authentic data sources and provides lightweight, technology-agnostic rendering.

- 🖼️ **icon-retrieval**: Search and retrieve icon SVG strings from icon library. Returns up to 5 matching icons by default (customizable).

`Icon Search` helps users find appropriate icons for various use cases including infographics, web development, design, and more. Search by keywords to discover available icons and retrieve their SVG strings directly. Each search returns up to 5 matching icons by default (customizable via topK parameter) with their URLs and complete SVG content.

**Evaluation Results**

Harness Engineering approach has been rigorously tested against 174 chart generation test cases, demonstrating significant improvements over baseline methods:

| **Model** | **G2** | **G6** |
| :---: | :---: | :---: |
| qwen3-coder-480b-a35b-instruct | ✨ 98.2% <sup><sub>+17.7%</sub></sup> | 94.8% <sup><sub>+15.6%</sub></sup> |
| Kimi-K2.5 | 97.7% <sup><sub>+17.2%</sub></sup> | 96.9% <sup><sub>+17.7%</sub></sup> |
| GLM-5.1 | 93.6% <sup><sub>+13.1%</sub></sup> | 92.8% <sup><sub>+13.6%</sub></sup> |
| DeepSeek-V3.2 | 90.8% <sup><sub>+10.3%</sub></sup> | ✨ 97.9% <sup><sub>+18.7%</sub></sup> |
| Context7 <sub>Baseline</sub> | 80.5% | 79.2% |

The results show that Harness Engineering enables LLMs to achieve near-production-ready accuracy (up to 98.2%), significantly outperforming the Context7 baseline approach.

> [!TIP]
> More skills are coming soon.

## Context Retrieval Service

[![npm version](https://img.shields.io/npm/v/%40antv%2Fchart-visualization-skills)](https://www.npmjs.com/package/@antv/chart-visualization-skills)
![license](https://img.shields.io/github/license/antvis/chart-visualization-skills)

We provide a context HTTP service for the model, intended for AI Coding. You can also use the provided `CLI` and `API` for local retrieval or private deployment.

### HTTP Context Service

- **Host**: `https://sive.antv.antgroup.com`
- **Endpoint**: `/api/v1/context/retrieve`
- **Method**: `GET`
- **Parameters**: `query`, `library`, `topK`, `content`, `maxTokens`

Parameters are as follows:

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

### CLI Usage

We also provide a CLI tool named `antv` for easy usage in your terminal, Install globally:

```bash
npm install -g @antv/chart-visualization-skills
```

**Retrieve skills by query**:

```bash
# Retrieve skills by query (metadata only)
antv retrieve "bar chart" --library g2 --topk 10

# Retrieve skills with full markdown content
antv retrieve "bar chart" --library g2 --content

# Retrieve skills and output as JSON
antv retrieve "bar chart" --library g2 --output json
```

**Usage for the command**:

```
Usage: antv [options] [command]

CLI tool for AntV chart visualization skills retrieval

Options:
  -V, --version               output the version number
  -h, --help                  display help for command

Commands:
  retrieve [options] <query>  Search for skills matching a query
  help [command]              display help for command

Options for retrieve:
  --library <lib>             Filter by library (e.g. g2, g6, x6)
  --topk <n>                  Number of results to return (default: 7)
  --strategy <s>              Retrieval strategy: hybrid | vector (default: hybrid)
  --content                   Include markdown content body in results
  --output <format>           Output format: json | text (default: "text")
```

> Note: Constraints docs (category `__constraints__`) are indexed as regular skill documents and appear naturally in search results when the query matches their content.

### API Usage

```typescript
import { retrieve } from '@antv/chart-visualization-skills';

// With full markdown content (defaults)
const skills = retrieve('bar chart', { library: 'g2', topK: 5 });

// Metadata only (no content body)
const skills = retrieve('bar chart', { library: 'g2', topK: 5, content: false });

// With token budget — content trimmed to fit 4000 tokens
const skills = retrieve('bar chart', {
  library: 'g2',
  maxTokens: 4000,
});
```

```typescript
retrieve(query: string, options?: RetrieveOptions): Promise<QueryResult[]>

interface RetrieveOptions {
  library?: string;    // Library filter, e.g. 'g2' or 'g6'
  topK?: number;       // Number of results (default: 7)
  strategy?: 'hybrid' | 'vector';  // Retrieval strategy (default: 'hybrid')
  maxTokens?: number;  // Token budget — content trimmed to fit when set
}
```

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `library` | `string` | all | Library filter (`g2` / `g6` / `x6`) |
| `topK` | `number` | `7` | Number of results |
| `content` | `boolean` | `true` | Include markdown content body |
| `strategy` | `'hybrid' \| 'vector'` | `'hybrid'` | Retrieval strategy |
| `maxTokens` | `number` | — | Token budget; content trimmed to fit when set |

> Notes:
> - Default retrieval uses **hybrid** strategy: zvec native FTS (jieba) + Vector (HNSW ANN) + RRF fusion.
> - `strategy: 'vector'` uses pure ANN vector similarity search.
> - Constraints docs (category `__constraints__`) are indexed as regular skill documents and appear naturally in search results.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
