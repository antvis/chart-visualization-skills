# TableSheet Basic Examples

## Example 1: Basic Table Sheet

A flat table with column-based layout, series numbers, and custom empty data placeholders.

```typescript
import { S2DataConfig, S2Options, TableSheet } from '@antv/s2';

const container = document.getElementById('container');

const s2DataConfig: S2DataConfig = {
  fields: {
    columns: ['province', 'city', 'type', 'price', 'cost'],
  },
  meta: [
    {
      field: 'province',
      name: 'Province',
    },
    {
      field: 'city',
      name: 'City',
    },
    {
      field: 'type',
      name: 'Category',
    },
    {
      field: 'price',
      name: 'Price',
    },
    {
      field: 'cost',
      name: 'Cost',
    },
  ],
  data: [
    { province: 'Zhejiang', city: 'Hangzhou', type: 'Furniture', price: 100, cost: 60 },
    { province: 'Zhejiang', city: 'Ningbo', type: 'Stationery', price: 50, cost: 30 },
    // ... more data
  ],
};

const s2Options: S2Options = {
  width: 600,
  height: 480,
  seriesNumber: {
    enable: true,
    text: 'No.',
  },
  placeholder: {
    // Custom empty data cell placeholder
    cell: '-',
    // cell: (meta) => '-',
    // Custom empty placeholder: icon and text sizes can be customized via theme
    // See: https://s2.antv.antgroup.com/api/general/s2-theme#empty
    empty: {
      /**
       * Custom icon, supports customSVGIcons registration and built-in icons
       * @see https://s2.antv.antgroup.com/manual/advanced/custom/custom-icon
       */
      icon: 'Empty',
      description: 'No data available',
    },
  },
};

const s2 = new TableSheet(container, s2DataConfig, s2Options);

await s2.render();
```

## Example 2: Table Sheet with Frozen Rows and Columns

A table with frozen header rows, leading/trailing frozen columns and rows.

```typescript
import { S2DataConfig, S2Options, TableSheet } from '@antv/s2';

const container = document.getElementById('container');

const s2DataConfig: S2DataConfig = {
  fields: {
    columns: ['province', 'city', 'type', 'price'],
  },
  meta: [
    { field: 'province', name: 'Province' },
    { field: 'city', name: 'City' },
    { field: 'type', name: 'Category' },
    { field: 'price', name: 'Price' },
  ],
  data: [
    // ... your data array
  ],
};

const s2Options: S2Options = {
  width: 450,
  height: 480,
  seriesNumber: {
    enable: true,
  },
  frozen: {
    // Number of frozen leading rows
    rowCount: 1,
    // Number of frozen leading columns
    colCount: 1,
    // Number of frozen trailing rows
    trailingRowCount: 1,
    // Number of frozen trailing columns
    trailingColCount: 1,
  },
};

const s2 = new TableSheet(container, s2DataConfig, s2Options);

await s2.render();
```
