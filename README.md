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

- 🎨 **infographic-creator**: Create beautiful infographics based on given text content. Use when users request to create infographics.

`Infographic Creator` uses AntV Infographic to transform data, information, and knowledge into a perceptible visual language. It combines visual design with data visualization, providing 50+ templates including lists, sequences, hierarchies, comparisons, relations, and charts. It compresses complex information with intuitive symbols to help audiences quickly understand and remember key points.

- 🖼️ **icon-retrieval**: Search and retrieve icon SVG strings from icon library. Returns up to 5 matching icons by default (customizable).

`Icon Search` helps users find appropriate icons for various use cases including infographics, web development, design, and more. Search by keywords to discover available icons and retrieve their SVG strings directly. Each search returns up to 5 matching icons by default (customizable via topK parameter) with their URLs and complete SVG content.

- 📝 **narrative-text-visualization**: Generate structured narrative text visualizations from data using T8 Syntax.

`Narrative Text Visualization` (T8) transforms unstructured data into semantically rich narrative reports using T8 Syntax - a declarative Markdown-like language for creating data narratives with entity annotations. It's LLM-friendly and framework-agnostic, working seamlessly with HTML, React, and Vue. Perfect for creating data analysis reports, summaries, and insights documents with entities like metrics, values, trends, and dimensions properly labeled. Features include built-in mini charts, standardized styling, and professional formatting. Supports authentic data sources and provides lightweight, technology-agnostic rendering.

- 📋 **antv-s2-expert**: S2 multi-dimensional cross-analysis table development assistant. Use when users need help with S2 pivot tables, table sheets, or any @antv/s2 related development.

`AntV S2 Expert` helps users develop with the S2 multi-dimensional cross-analysis table engine. It provides comprehensive guidance on `@antv/s2` core engine, `@antv/s2-react` and `@antv/s2-vue` framework bindings, `@antv/s2-react-components` advanced analysis components, and `@antv/s2-ssr` server-side rendering. Covers pivot tables, table sheets, custom cells, theming, events, interactions, sorting, totals, tooltips, frozen rows/columns, icons, pagination, and more.

- 📈 **antv-g2-chart**: G2 v5 chart code generator. Use when users need to generate G2 charts — bar charts, line charts, pie charts, scatter plots, area charts, heatmaps, and any statistical data visualization with the G2 library.

`AntV G2 Chart` generates accurate, runnable G2 v5 code following Spec Mode best practices. It covers 30+ chart types (interval, line, area, point, rect, cell, treemap, sankey, chord, wordCloud, gauge, and more), data transforms (stackY, dodgeX, binX, fold, etc.), coordinate systems (cartesian, polar, theta, radial), scales, interactions (brush, slider, legend filter), components (axis, legend, tooltip, annotation), and multi-view compositions. Built-in guard rails prevent common v4→v5 migration pitfalls such as using deprecated chain APIs, invalid palette names, or referencing `d3` in user code.

**Evaluation Results**

Harness Engineering approach has been rigorously tested against 174 chart generation test cases, demonstrating significant improvements over baseline methods:

| Model | Success Rate | Improvement |
| :--- | :--- | :--- |
| qwen3-coder-480b-a35b-instruct | **98.2%** | +18.2% |
| Kimi-K2.5 | **97.7%** | +17.7% |
| GLM-5.1 | **93.6%** | +13.6% |
| DeepSeek-V3.2 | **87.3%** | +7.3% |
| Context7 Baseline | 80% | baseline |

The results show that Harness Engineering enables LLMs to achieve near-production-ready accuracy (up to 98.2%), significantly outperforming the Context7 baseline approach.

> [!TIP]
> More skills are coming soon.

## Library Usage

[![npm version](https://img.shields.io/npm/v/%40antv%2Fchart-visualization-skills)](https://www.npmjs.com/package/@antv/chart-visualization-skills)
![license](https://img.shields.io/github/license/antvis/chart-visualization-skills)

It can be used as a library in your Node.js projects with `CLI` and `API`.

### CLI Usage

We also provide a CLI tool named `antv` for easy usage in your terminal, Install globally:

```bash
npm install -g @antv/chart-visualization-skills
```

**Retrieve or list skills by query**:

```bash
# Retrieve skills by query
antv retrieve "bar chart" --library g2 --topk 10 --content

# List all available skills
antv list --library g2 --category core

# Show skill info
antv info --library g2
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
  list [options]              List all available skills
  info [options]              Show skill info from SKILL.md
  help [command]              display help for command
```

### API Usage

```typescript
import { retrieve } from '@antv/chart-visualization-skills';

const skills = retrieve('bar chart', 'g2', 5);
// with content body: retrieve('bar chart', 'g2', 5, true)
```

```typescript
retrieve(query: string, library?: string, topk?: number, content?: boolean)
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `query` | `string` | — | Search query |
| `library` | `string` | `'g2'` | Library filter (`g2` or `g6`) |
| `topk` | `number` | `7` | Number of results |
| `content` | `boolean` | `false` | Whether to include markdown content |

> Notes:
> - Default retrieval returns lightweight result objects without the `content` field.
> - `content = true` returns markdown content body (frontmatter metadata is excluded).

```typescript
import { info } from '@antv/chart-visualization-skills';

const skillInfo = info('g2');
// => { name: 'antv-g2-chart', description: '...', content: '...' }
```

```typescript
info(library?: string): SkillInfo | undefined
```

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `library` | `string` | `'g2'` | Library to get info for (`g2` or `g6`) |

## License

MIT License - see the [LICENSE](LICENSE) file for details.
