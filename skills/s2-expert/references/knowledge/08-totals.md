# Subtotals & Grand Totals

## Overview

S2 supports subtotals and grand totals for pivot tables. Row and column headers can each have independent aggregation configuration. Grand totals summarize all dimensions; subtotals summarize a specific dimension. Totals are **not available** when using custom row/column headers.

## Configuration

Configure via `s2Options.totals`:

```ts
const s2Options = {
  totals: {
    row: { /* Total config for rows */ },
    col: { /* Total config for columns */ },
  },
};
```

## Totals Type

| Property | Description | Type | Default |
|---|---|---|---|
| `row` | Row totals configuration (disabled when using custom row headers) | `Total` | - |
| `col` | Column totals configuration (disabled when using custom column headers) | `Total` | - |

## Total

| Property | Description | Type | Default |
|---|---|---|---|
| `showGrandTotals` | Whether to show grand totals | `boolean` | `false` |
| `showSubTotals` | Whether to show subtotals. Object form: `{ always: boolean }` controls display when sub-dimensions < 2. | `boolean \| { always: boolean }` | `false` |
| `subTotalsDimensions` | Dimensions to aggregate for subtotals | `string[]` | `[]` |
| `reverseGrandTotalsLayout` | Grand total position — `true` places it at top/left instead of default bottom/right | `boolean` | `false` |
| `reverseSubTotalsLayout` | Subtotal position — `true` places it at top/left instead of default bottom/right | `boolean` | `false` |
| `grandTotalsLabel` | Display label for grand totals | `string` | `'Grand Total'` |
| `subTotalsLabel` | Display label for subtotals | `string` | `'Subtotal'` |
| `calcGrandTotals` | Custom grand total calculation | `CalcTotals` | - |
| `calcSubTotals` | Custom subtotal calculation | `CalcTotals` | - |
| `grandTotalsGroupDimensions` | Dimensions for grouped grand totals | `string[]` | - |
| `subTotalsGroupDimensions` | Dimensions for grouped subtotals | `string[]` | - |

## CalcTotals

| Property | Description | Type |
|---|---|---|
| `aggregation` | Built-in aggregation method | `'SUM' \| 'MIN' \| 'MAX' \| 'AVG' \| 'COUNT'` |
| `calcFunc` | Custom calculation function | `(query: Record<string, any>, data: Record<string, any>[], spreadsheet: SpreadSheet) => number` |

## Basic Example

```ts
const s2Options = {
  totals: {
    row: {
      showGrandTotals: true,
      showSubTotals: true,
      reverseGrandTotalsLayout: true,   // grand total at top
      reverseSubTotalsLayout: true,     // subtotals at top
      subTotalsDimensions: ['province'], // subtotal by province
      calcGrandTotals: {
        aggregation: 'SUM',
      },
      calcSubTotals: {
        aggregation: 'SUM',
      },
    },
    col: {
      showGrandTotals: true,
      showSubTotals: true,
      reverseGrandTotalsLayout: true,
      reverseSubTotalsLayout: true,
      subTotalsDimensions: ['type'],
      calcGrandTotals: {
        aggregation: 'SUM',
      },
      calcSubTotals: {
        aggregation: 'SUM',
      },
    },
  },
};
```

## Custom Calculation Function

Use `calcFunc` for custom aggregation logic:

```ts
const s2Options = {
  totals: {
    row: {
      showGrandTotals: true,
      showSubTotals: true,
      subTotalsDimensions: ['province'],
      calcGrandTotals: {
        calcFunc: (query, data, spreadsheet) => {
          // `data` is detail-level data matching the query
          // Return the computed total value
          return data.reduce((sum, item) => sum + (item.price || 0), 0);
        },
      },
      calcSubTotals: {
        calcFunc: (query, data, spreadsheet) => {
          return data.reduce((sum, item) => sum + (item.price || 0), 0);
        },
      },
    },
  },
};
```

To access data that includes other aggregated totals (not just detail data):

```ts
import { QueryDataType } from '@antv/s2';

const calcFunc = (query, data, spreadsheet) => {
  const allData = spreadsheet.dataSet.getCellMultiData({
    query,
    queryType: QueryDataType.All, // includes totals
  });
  // Use allData for computation
};
```

## Providing Totals Data Directly

Instead of computing totals, you can include pre-calculated total/subtotal rows in the `data` array. Totals rows omit the dimension keys they aggregate over:

```ts
const s2DataConfig = {
  data: [
    // Regular data
    { province: 'Zhejiang', city: 'Hangzhou', type: 'Pen', price: 1 },
    // Grand total (no dimension keys)
    { price: 15.5 },
    // Row subtotal for Zhejiang (omits city)
    { province: 'Zhejiang', price: 5.5 },
    // Cross subtotal: Zhejiang × Pen
    { province: 'Zhejiang', type: 'Pen', price: 3 },
    // Column subtotal for Pen (omits row dimensions)
    { type: 'Pen', price: 10 },
  ],
};
```

## Priority Rules

1. **Data-provided totals** take priority over calculated totals.
2. `calcFunc` takes priority over `aggregation` (i.e., `calcFunc > aggregation`).
3. When a cell is at the intersection of both row and column totals, **column totals take priority** over row totals.
