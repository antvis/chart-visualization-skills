---
name: gpt-vis
description: Create AI-powered visualizations using GPT-Vis. Use when users need intelligent, context-aware visualizations that can be generated from natural language descriptions, with support for various chart types and automatic data interpretation.
---

# GPT-Vis AI-Powered Visualization Skill

This skill provides AI-powered visualization capabilities using AntV GPT-Vis. GPT-Vis is designed to work seamlessly with Large Language Models (LLMs) to generate visualizations from natural language descriptions and structured data.

## Overview

GPT-Vis (AI-Powered Visualization) is designed for:
- **Natural Language to Visualization**: Convert text descriptions to charts
- **LLM Integration**: Optimized for AI-generated visualizations
- **Streaming Support**: Real-time chart generation as data streams
- **Multi-Chart Types**: Support for various statistical and business charts
- **Markdown Integration**: Embed visualizations in markdown documents
- **Code Block Rendering**: Render charts from code blocks in markdown

## Workflow

To create GPT-Vis visualizations, follow these steps:

### 1. Understand the Requirements

Analyze the user's request to determine:
- The visualization intent from natural language
- Data structure and format
- Chart type needed (auto-detected or specified)
- Rendering context (standalone HTML or markdown)
- Streaming requirements

### 2. Choose Chart Type

GPT-Vis supports various chart types:

**Statistical Charts**:
- Line Chart: Trends and time series
- Bar Chart: Categorical comparisons
- Column Chart: Vertical comparisons
- Pie Chart: Part-to-whole relationships
- Area Chart: Accumulated values
- Scatter Chart: Correlations

**Advanced Charts**:
- Dual Axes Chart: Two different scales
- Heatmap: Matrix data visualization
- Radar Chart: Multi-dimensional comparison
- Funnel Chart: Conversion processes
- Gauge Chart: KPI indicators
- Word Cloud: Text frequency

**Specialized**:
- Network Graph: Relationships and connections
- Sankey Diagram: Flow visualization
- Tree Map: Hierarchical data
- Mind Map: Concept relationships

### 3. Data Format

GPT-Vis accepts data in various formats:

**Array Format**:
```javascript
const data = [
  { category: 'A', value: 100 },
  { category: 'B', value: 200 },
  { category: 'C', value: 150 }
];
```

**Time Series Format**:
```javascript
const data = [
  { date: '2024-01', sales: 1200 },
  { date: '2024-02', sales: 1500 },
  { date: '2024-03', sales: 1300 }
];
```

**Hierarchical Format**:
```javascript
const data = {
  name: 'Root',
  children: [
    { name: 'Child 1', value: 100 },
    { name: 'Child 2', value: 200 }
  ]
};
```

### 4. Generate HTML Visualization

Create a complete HTML file with GPT-Vis integration:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GPT-Vis Visualization</title>
    <script src="https://unpkg.com/@antv/gpt-vis@latest/dist/gpt-vis.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            margin: 0 0 20px 0;
            color: #333;
            font-size: 24px;
        }
        .description {
            margin-bottom: 20px;
            color: #666;
            line-height: 1.6;
        }
        #chart-container {
            width: 100%;
            min-height: 400px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>AI-Powered Visualization</h1>
        <div class="description">
            This chart is generated using GPT-Vis, an AI-powered visualization library
            designed to work seamlessly with Large Language Models.
        </div>
        <div id="chart-container"></div>
    </div>
    <script>
        const { GPTVis } = window;

        // Initialize GPT-Vis
        const vis = new GPTVis({
            container: 'chart-container',
            autoFit: true,
            padding: 'auto'
        });

        // Define your data
        const data = [
            // Your data here
        ];

        // Define chart specification
        const spec = {
            type: 'line', // Chart type
            data: data,
            encode: {
                x: 'date',
                y: 'value'
            },
            title: {
                text: 'Chart Title'
            },
            legend: {
                position: 'top'
            },
            tooltip: {
                shared: true
            },
            theme: 'light' // 'light' or 'dark'
        };

        // Render the chart
        vis.render(spec);

        // Handle window resize
        window.addEventListener('resize', () => {
            vis.changeSize();
        });
    </script>
</body>
</html>
```

### 5. Markdown Integration

GPT-Vis can render charts directly from markdown code blocks:

````markdown
# Sales Report

Here's the sales trend for Q1 2024:

```vis-chart
{
  "type": "line",
  "data": [
    {"month": "Jan", "sales": 1200},
    {"month": "Feb", "sales": 1500},
    {"month": "Mar", "sales": 1300}
  ],
  "encode": {
    "x": "month",
    "y": "sales"
  }
}
```
````

### 6. Streaming Support

GPT-Vis supports streaming data for real-time updates:

```javascript
const vis = new GPTVis({
    container: 'chart-container',
    streaming: true
});

// Initial render
vis.render(spec);

// Update data as it streams
function updateData(newDataPoint) {
    const currentData = vis.getData();
    currentData.push(newDataPoint);
    vis.changeData(currentData);
}
```

### 7. Configuration Options

**Chart Configuration**:
```javascript
const spec = {
    type: 'line',
    data: data,
    encode: {
        x: 'field1',
        y: 'field2',
        color: 'category' // Optional color encoding
    },
    title: {
        text: 'Chart Title',
        subtext: 'Subtitle'
    },
    legend: {
        position: 'top', // 'top', 'bottom', 'left', 'right'
        layout: 'horizontal'
    },
    tooltip: {
        shared: true,
        showMarkers: true
    },
    axis: {
        x: {
            title: 'X Axis',
            tickCount: 5
        },
        y: {
            title: 'Y Axis',
            nice: true
        }
    },
    theme: 'light', // 'light' or 'dark'
    animation: true
};
```

**Theme Customization**:
```javascript
const customTheme = {
    colors: ['#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16'],
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial',
    backgroundColor: '#ffffff',
    padding: [20, 20, 20, 20]
};

vis.render(spec, { theme: customTheme });
```

## Best Practices

1. **Data Preparation**: Ensure data is clean and properly formatted
2. **Chart Selection**: Let GPT-Vis auto-detect chart type when possible
3. **Responsive Design**: Use `autoFit: true` for responsive charts
4. **Streaming**: Enable streaming for real-time data updates
5. **Accessibility**: Provide meaningful titles and axis labels
6. **Performance**: Limit data points for smooth rendering
7. **Error Handling**: Validate data before rendering

## Example Use Cases

- **AI Assistants**: Generate charts from conversational queries
- **Data Analysis**: Quick visualization of datasets
- **Report Generation**: Automated chart creation in reports
- **Dashboard Creation**: Dynamic dashboard components
- **Documentation**: Embed charts in markdown documentation
- **Real-time Monitoring**: Streaming data visualization
- **Educational Tools**: Interactive data exploration

## LLM Integration

GPT-Vis is optimized for LLM-generated visualizations:

**Natural Language to Chart**:
```
User: "Show me a line chart of monthly sales"
LLM: Generates GPT-Vis specification
GPT-Vis: Renders the chart
```

**Automatic Chart Type Selection**:
```javascript
// LLM can generate minimal spec, GPT-Vis infers chart type
const spec = {
    data: data,
    encode: { x: 'date', y: 'value' }
    // type is automatically inferred
};
```

**Progressive Rendering**:
```javascript
// Support for streaming LLM responses
vis.renderStream(specStream);
```

## Advanced Features

**Multi-View Composition**:
```javascript
const spec = {
    type: 'view',
    children: [
        { type: 'line', data: data1, encode: { x: 'x', y: 'y1' } },
        { type: 'bar', data: data2, encode: { x: 'x', y: 'y2' } }
    ]
};
```

**Interactive Filters**:
```javascript
const spec = {
    type: 'line',
    data: data,
    encode: { x: 'date', y: 'value', color: 'category' },
    interaction: {
        filter: true,
        brush: true,
        zoom: true
    }
};
```

**Custom Annotations**:
```javascript
const spec = {
    type: 'line',
    data: data,
    encode: { x: 'date', y: 'value' },
    annotations: [
        {
            type: 'line',
            start: ['2024-01', 0],
            end: ['2024-01', 100],
            text: 'Important Event'
        }
    ]
};
```

## Output Format

When creating a GPT-Vis visualization:
1. Generate a complete HTML file named `<title>-gpt-vis.html`
2. Include clear chart title and description
3. Use appropriate chart type for the data
4. Enable responsive behavior
5. Provide data source information
6. Add interaction hints if applicable

## Integration with Other Tools

**Markdown Renderers**:
- Use `vis-chart` code blocks in markdown
- Automatic chart rendering in documentation
- Support for MDX and other markdown variants

**AI Platforms**:
- ChatGPT plugins
- Claude artifacts
- Custom AI assistants
- Chatbot interfaces

**Web Frameworks**:
- React components
- Vue components
- Angular components
- Vanilla JavaScript

## Reference

- Official GPT-Vis Documentation: <https://gpt-vis.antv.antgroup.com/>
- API Reference: <https://gpt-vis.antv.antgroup.com/api>
- Examples: <https://gpt-vis.antv.antgroup.com/examples>
- GitHub Repository: <https://github.com/antvis/GPT-Vis>
