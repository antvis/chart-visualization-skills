# S2 Overview

## What is S2

[S2](https://github.com/antvis/s2) is a data-driven table visualization engine for visual analysis. The name "S2" comes from the two "S"s in "SpreadSheet", and "2" represents the two dimensions (rows and columns) in pivot tables. It provides beautiful, easy-to-use, high-performance, and extensible multi-dimensional tables.

### Key Features

1. **Out-of-the-box**: Provides ready-to-use `React` and `Vue3` table components with companion analysis components.
2. **Multi-dimensional cross-analysis**: Supports free combination of any dimensions for analysis.
3. **High performance**: Renders full million-row datasets in under 4 seconds; supports sub-second rendering via partial drill-down.
4. **Highly extensible**: Supports arbitrary customization (layout, styles, interactions, data flow, etc.).
5. **Rich interactions**: Single select, range select, row/column select, frozen row headers, drag-to-resize, custom interactions, and more.

## Packages

| Package | Description |
|---------|-------------|
| `@antv/s2` | Core library (framework-agnostic), based on Canvas rendering |
| `@antv/s2-react` | React component wrapper around `@antv/s2` |
| `@antv/s2-vue` | Vue 3.0 component wrapper around `@antv/s2` |

## Core Concepts

### Sheet Types

- **PivotSheet**: Cross-tab / pivot table for multi-dimensional analysis. Data is organized by `rows`, `columns`, and `values`.
- **TableSheet**: Flat detail table (like a traditional data grid). Data rows are displayed directly under column headers.

### Table Structure

A pivot table is composed of five regions:

| Region | Description |
|--------|-------------|
| **Row Header** (`rowHeader`) | Displays row dimension hierarchy. Structure determined by `s2DataConfig.fields.rows`. Supports grid (flat) and tree display modes. |
| **Column Header** (`colHeader`) | Displays column dimension hierarchy. Structure determined by `s2DataConfig.fields.columns`. |
| **Corner Header** (`cornerHeader`) | Top-left area. Used as the layout anchor for calculating row/column sizes and coordinates. Displays row/column field names. |
| **Data Cell** (`dataCell`) | The cross-intersection area of row and column dimensions. Displays measure values — the core data presentation area. |
| **Frame** (`frame`) | Overlay layer above all other regions. Handles separators, scrollbars, and shadow effects between regions. |

### Key Terminology

- **Measure (Indicator)**: Numeric values, e.g., `price`, `quantity`.
- **Dimension**: Analysis perspective, e.g., `province`, `type`.
- **Dimension Value**: Concrete values of a dimension, e.g., `Hangzhou`, `Beijing`.

### Internal Architecture

- **Cell**: A visual unit in the table. Corner, row, column headers are composed of multiple cells. Each supports custom rendering.
- **Node**: Metadata for a cell (including cells outside the visible viewport). One cell corresponds to one node.
- **Facet**: The current visible rendering area. Manages layout and cell rendering.
- **DataSet**: Internal representation of `s2DataConfig`, transformed for efficient processing and rendering.

### Data Flow

```
S2DataConfig → DataSet → Facet (layout) → Nodes → Cells (rendering)
```

1. User provides `S2DataConfig` (fields, data, meta).
2. S2 converts it to an internal `DataSet`.
3. The `Facet` calculates layout based on the dataset.
4. `Node` metadata is generated for each header and data position.
5. Visible `Cell` instances are created and rendered on the Canvas.

## Basic Usage

```ts
import { PivotSheet } from '@antv/s2';

const s2DataConfig = {
  fields: {
    rows: ['province', 'city'],
    columns: ['type'],
    values: ['price'],
  },
  data: [
    { province: 'Zhejiang', city: 'Hangzhou', type: 'Pen', price: '1' },
    { province: 'Zhejiang', city: 'Hangzhou', type: 'Paper', price: '2' },
  ],
  meta: [
    { field: 'price', name: 'Price' },
    { field: 'province', name: 'Province' },
    { field: 'city', name: 'City' },
    { field: 'type', name: 'Type' },
  ],
};

const s2Options = {
  width: 600,
  height: 600,
};

async function bootstrap() {
  const container = document.getElementById('container');
  const s2 = new PivotSheet(container, s2DataConfig, s2Options);
  await s2.render();
}

bootstrap();
```
