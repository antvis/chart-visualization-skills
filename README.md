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

> [!TIP]
> More skills are coming soon.

## License

MIT License - see the [LICENSE](LICENSE) file for details.