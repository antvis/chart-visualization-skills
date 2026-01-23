# Chart Visualization Skills

> Turning data into a visual language for better thinking.

<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*ZFK8SrovcqgAAAAAAAAAAAAAemJ7AQ/original" width="16" /> AntV ![stars](https://img.shields.io/github/stars/antvis?style=social), initiated by Ant Group and open-sourced starting in 2017, reimagines data visualization by embedding the theory of graphical grammar into the JavaScript language. In response to rigid chart libraries that force a trade-off between flexibility and usability, we have categorized data visualization techniques into four series: 2, 6, 7, and 8, which respectively represent _statistical analysis_, _graph analysis_, _geographical analysis_, and _unstructured data visualization_. We have expanded these capabilities across different levels, including chart libraries, R&D tools, and AI-powered intelligent visualization.

## Overview

In the era of data-driven decision-making, efficient and accurate data visualization and analysis are paramount. AntV offers a professional suite of visualization solutions, providing a robust toolkit and a comprehensive set of skills for the entire workflow—from chart design and interactive exploration to in-depth data analysis. It empowers users to swiftly transform complex datasets into intuitive visual charts, significantly lowering the barrier to creation through intelligent design specifications and a rich library of components. Whether for daily reporting, dynamic dashboards, or sophisticated interactive analysis, AntV delivers reliable support. By integrating AI capabilities, these tools further streamline and automate the generation and optimization of visualizations. This allows analysts to focus more on uncovering insights and driving business decisions, truly making data visible and understandable.

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

- **chart-visualization**: A comprehensive chart generation skill powered by AntV that provides 26+ chart types for intelligent data visualization.

`Chart Visualization` intelligently selects the most appropriate chart type from 26+ available options, extracts parameters based on detailed specifications, and generates high-quality chart images. It covers time series, comparisons, part-to-whole, relationships, geographic, hierarchical, statistical, and specialized visualizations.

- **infographic-creator**: 基于给定文字内容创建精美信息图。当用户请求创建信息图时使用。

`Infographic Creator` 使用 AntV Infographic 将数据、信息与知识转化为可感知的视觉语言。它结合视觉设计与数据可视化，提供 50+ 模板，包括列表、序列、层级、对比、关系和图表等多种类型，用直观符号压缩复杂信息，帮助受众快速理解并记住要点。

> [!TIP]
> More skills are coming soon.

## License

MIT License - see the [LICENSE](LICENSE) file for details.