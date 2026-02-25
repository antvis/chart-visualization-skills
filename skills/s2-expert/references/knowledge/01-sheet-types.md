# S2 Sheet Types

## PivotSheet (Pivot Table)

A pivot table (also called a cross table or multi-dimensional table) displays relationships between multiple variables, helping users discover interactions between data dimensions. It is one of the most commonly used chart types in business BI analysis.

### Data Configuration

The pivot table organizes data using `rows`, `columns`, and `values`:

```ts
const s2DataConfig = {
  fields: {
    rows: ['province', 'city'],
    columns: ['type', 'sub_type'],
    values: ['price'],
  },
  data: [
    { province: 'Zhejiang', city: 'Hangzhou', type: 'Furniture', sub_type: 'Table', price: '1' },
    { province: 'Zhejiang', city: 'Hangzhou', type: 'Furniture', sub_type: 'Sofa', price: '2' },
    { province: 'Zhejiang', city: 'Hangzhou', type: 'Office', sub_type: 'Pen', price: '3' },
    { province: 'Zhejiang', city: 'Hangzhou', type: 'Office', sub_type: 'Paper', price: '4' },
  ],
};
```

### Basic Usage

```ts
import { PivotSheet } from '@antv/s2';

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

### React Usage

```tsx
import { SheetComponent } from '@antv/s2-react';
import '@antv/s2-react/dist/s2-react.min.css';

const App = () => (
  <SheetComponent
    sheetType="pivot"
    dataCfg={s2DataConfig}
    options={{ width: 400, height: 200 }}
  />
);
```

### Display Modes (hierarchyType)

#### Grid Mode (flat)

Each dimension level has an independent column. No expand/collapse support.

```ts
const s2Options = { hierarchyType: 'grid' };
```

#### Tree Mode

All dimension levels share one column, with indentation to distinguish levels. Supports expand/collapse.

```ts
const s2Options = { hierarchyType: 'tree' };
```

#### Grid-Tree Mode

Combines grid and tree: each dimension level has an independent column, with expand/collapse support.

```ts
const s2Options = {
  hierarchyType: 'grid-tree',
  style: {
    rowCell: {
      expandDepth: 1, // default expand level (starts from 0)
    },
  },
};
```

### Series Number (Row Index)

```ts
const s2Options = {
  seriesNumber: {
    enable: true,
    text: 'No.' // custom header text
  },
};
```

### Frozen Row Header

By default, the row header area is frozen (has its own scrollable area). Disable with:

```ts
const s2Options = {
  frozen: {
    rowHeader: false, // default: true
  },
};
```

Control the max frozen width ratio (default `0.5`, range `0-1`):

```ts
const s2Options = {
  frozen: {
    rowHeader: 0.2,
  },
};
```

### Frozen Rows and Columns

```ts
const s2Options = {
  frozen: {
    rowCount: 1,          // freeze N leaf rows from top
    trailingRowCount: 1,  // freeze N leaf rows from bottom
    colCount: 1,          // freeze N leaf columns from left
    trailingColCount: 1,  // freeze N leaf columns from right
  },
};
```

---

## TableSheet (Detail Table)

The detail table (TableSheet) is a flat table that displays raw data rows directly under column headers. It's ideal for high-volume detail data scenarios and can replace DOM-based table components for better performance.

TableSheet shares many capabilities with PivotSheet: basic interactions, theming, copy/export, and custom cells. It additionally supports row/column freezing.

### Data Configuration

For TableSheet, only `columns` is needed in `fields` (no `rows` or `values`):

```ts
const s2DataConfig = {
  fields: {
    columns: ['province', 'city', 'type', 'price'],
  },
  meta: [
    { field: 'province', name: 'Province' },
    { field: 'city', name: 'City' },
    { field: 'type', name: 'Type' },
    { field: 'price', name: 'Price' },
  ],
  data: [
    { province: 'Zhejiang', city: 'Hangzhou', type: 'Pen', price: '1' },
    { province: 'Zhejiang', city: 'Hangzhou', type: 'Paper', price: '2' },
  ],
};
```

### Basic Usage

```ts
import { TableSheet } from '@antv/s2';

async function bootstrap() {
  const container = document.getElementById('container');
  const s2 = new TableSheet(container, s2DataConfig, s2Options);
  await s2.render();
}

bootstrap();
```

### React Usage

```tsx
import { SheetComponent } from '@antv/s2-react';
import '@antv/s2-react/dist/s2-react.min.css';

const App = () => (
  <SheetComponent
    sheetType="table"
    dataCfg={s2DataConfig}
    options={{ width: 400, height: 200 }}
  />
);
```

### Row/Column Freezing

```ts
const s2Options = {
  frozen: {
    rowCount: 2,           // freeze rows from top
    trailingRowCount: 1,   // freeze rows from bottom
    colCount: 1,           // freeze columns from left
    trailingColCount: 1,   // freeze columns from right
  },
};
```

### Series Number

```ts
const s2Options = {
  seriesNumber: {
    enable: true,
    text: 'No.'
  },
};
```

---

## When to Use Each Type

| Scenario | Sheet Type |
|----------|-----------|
| Multi-dimensional aggregation/cross-analysis | **PivotSheet** |
| Exploring relationships between multiple dimensions | **PivotSheet** |
| Displaying raw detail/record data | **TableSheet** |
| Large-volume flat data with column-based layout | **TableSheet** |
| Need subtotals/grand totals | **PivotSheet** |
| Simple list with sorting and filtering | **TableSheet** |
