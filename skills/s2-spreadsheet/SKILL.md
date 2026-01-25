---
name: s2-spreadsheet
description: Create interactive spreadsheet and pivot table visualizations using S2. Use when users need to display tabular data, cross-tabulation analysis, or data grids with advanced features like sorting, filtering, and aggregation.
---

# S2 Spreadsheet Skill

This skill provides spreadsheet and pivot table visualization capabilities using AntV S2. S2 is a powerful data grid solution designed for multi-dimensional data analysis with features like cross-tabulation, sorting, filtering, and custom rendering.

## Overview

S2 (SpreadSheet) is designed for:
- **Tabular Data Display**: Show structured data in grid format
- **Pivot Tables**: Multi-dimensional data analysis with aggregation
- **Data Grids**: Interactive tables with sorting, filtering, and editing
- **Cross-tabulation**: Analyze data across multiple dimensions
- **Custom Rendering**: Flexible cell rendering and styling

## Workflow

To create spreadsheet visualizations, follow these steps:

### 1. Understand the Requirements

Analyze the user's request to determine:
- The type of table needed (simple table, pivot table, or data grid)
- Data structure and dimensions
- Required features (sorting, filtering, aggregation)
- Display preferences (styling, themes)

### 2. Choose Table Type

**Simple Table (TableSheet)**:
- Best for: Displaying flat tabular data
- Features: Sorting, filtering, column resizing
- Use case: Data lists, reports, simple datasets

**Pivot Table (PivotSheet)**:
- Best for: Multi-dimensional analysis
- Features: Row/column dimensions, aggregation, drill-down
- Use case: Business intelligence, cross-tabulation, data analysis

### 3. Prepare Data Structure

**For Simple Tables**:
```javascript
const data = [
  { name: 'Product A', sales: 1200, region: 'North' },
  { name: 'Product B', sales: 800, region: 'South' },
  // ... more rows
];

const columns = [
  { field: 'name', title: 'Product Name' },
  { field: 'sales', title: 'Sales' },
  { field: 'region', title: 'Region' }
];
```

**For Pivot Tables**:
```javascript
const data = [
  { province: 'Zhejiang', city: 'Hangzhou', type: 'Furniture', price: 7789 },
  { province: 'Zhejiang', city: 'Hangzhou', type: 'Office Supplies', price: 2367 },
  // ... more rows
];

const dataCfg = {
  fields: {
    rows: ['province', 'city'],
    columns: ['type'],
    values: ['price']
  }
};
```

### 4. Generate HTML Visualization

Create a complete HTML file with S2 integration:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>S2 Spreadsheet Visualization</title>
    <script src="https://unpkg.com/@antv/s2@latest/dist/index.min.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/@antv/s2@latest/dist/style.min.css">
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        }
        #container {
            width: 100%;
            height: 600px;
        }
    </style>
</head>
<body>
    <div id="container"></div>
    <script>
        // For Simple Table
        const s2 = new S2.TableSheet(document.getElementById('container'), {
            data: [/* your data */],
            columns: [/* your columns */],
            width: 800,
            height: 600
        });

        // Or for Pivot Table
        // const s2 = new S2.PivotSheet(document.getElementById('container'), {
        //     dataCfg: {/* your data config */},
        //     options: {/* your options */}
        // });

        s2.render();
    </script>
</body>
</html>
```

### 5. Configuration Options

**Common Options**:
- `width` / `height`: Dimensions
- `theme`: Color scheme and styling
- `interaction`: Enable/disable interactions
- `tooltip`: Customize tooltips
- `style`: Cell styles, fonts, colors

**Pivot Table Specific**:
- `totals`: Show row/column totals
- `valueInCols`: Display values in columns
- `hierarchyType`: Tree or grid layout

## Best Practices

1. **Data Preparation**: Ensure data is clean and properly formatted
2. **Performance**: For large datasets (>10k rows), consider pagination or virtual scrolling
3. **Responsive Design**: Set appropriate container dimensions
4. **Accessibility**: Use clear column headers and meaningful data labels
5. **Theming**: Match the table style to your application design

## Example Use Cases

- **Sales Reports**: Display sales data with filtering and sorting
- **Financial Analysis**: Create pivot tables for multi-dimensional financial data
- **Data Dashboards**: Embed interactive tables in dashboards
- **Business Intelligence**: Analyze data across multiple dimensions
- **Data Exploration**: Allow users to explore and drill down into datasets

## Output Format

When creating an S2 visualization:
1. Generate a complete HTML file named `<title>-spreadsheet.html`
2. Include all necessary scripts and styles
3. Provide clear instructions for opening and using the visualization
4. Mention available interactions (sorting, filtering, etc.)

## Reference

- Official S2 Documentation: https://s2.antv.antgroup.com/
- API Reference: https://s2.antv.antgroup.com/api
- Examples: https://s2.antv.antgroup.com/examples
