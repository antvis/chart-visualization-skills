# Sorting

## Overview

S2 supports multiple sorting methods for table data: ascending/descending by field value, sorting by a custom list, sorting by measure values, and fully custom sort functions. Sorting is configured via `sortParams` in `S2DataConfig`.

## SortParam Configuration

| Property | Description | Type | Default | Required |
|---|---|---|---|---|
| `sortFieldId` | Field ID to sort by | `string` | - | ✓ |
| `sortMethod` | Sort direction | `'ASC' \| 'DESC' \| 'asc' \| 'desc'` | - | |
| `sortBy` | Custom ordered list of dimension values | `string[]` | - | |
| `sortByMeasure` | Sort by a measure value (pivot table) | `string` | - | |
| `query` | Filter condition to narrow sort scope, e.g. `{ city: 'Beijing' }` | `Record<string, string>` | - | |
| `type` | Group sort — used to display sort icon (pivot table) | `string` | - | |
| `sortFunc` | Custom sort function | `(params: SortFuncParam) => string[]` | - | |
| `nullsPlacement` | Position of null values in sort | `'first' \| 'last' \| 'auto'` | `'last'` | |

### nullsPlacement

Controls where empty values (`null`, `undefined`, `'-'`, empty string) appear:

| Value | Behavior |
|---|---|
| `'first'` | Nulls always appear first |
| `'last'` | Nulls always appear last (default, matches Excel/Google Sheets behavior) |
| `'auto'` | Ascending: nulls first; Descending: nulls last |

Use `sortFieldId: '*'` as a wildcard for global default null placement. Specific field configs take priority over the wildcard.

> When `sortFunc` is defined, it takes full control — `nullsPlacement` is ignored.

## Sort Methods

### 1. Ascending/Descending (`sortMethod`)

Sort row/column header values. Supports numbers, numeric strings, and general strings (falls back to `localeCompare`).

```ts
const s2DataConfig = {
  sortParams: [
    { sortFieldId: 'province', sortMethod: 'DESC' },
    { sortFieldId: 'type', sortMethod: 'ASC' },
  ],
};
```

### 2. Custom Value List (`sortBy`)

Sort by an explicit ordered list. Multi-level headers perform group-internal sorting.

```ts
const s2DataConfig = {
  sortParams: [
    { sortFieldId: 'province', sortBy: ['Zhejiang', 'Jilin'] },
    { sortFieldId: 'city', sortBy: ['Zhoushan', 'Hangzhou', 'Baishan', 'Changchun'] },
  ],
};
```

### 3. Sort by Measure Value (`sortByMeasure`)

Sort row/col header dimensions by their corresponding numeric (cross-tab) values. Must use `query` to specify which measure column to sort by.

#### Sort by Detail Data

```ts
import { EXTRA_FIELD } from '@antv/s2';

const s2DataConfig = {
  sortParams: [
    {
      sortFieldId: 'city',
      sortByMeasure: 'number',
      sortMethod: 'ASC',
      query: {
        type: 'Office Supplies',
        sub_type: 'Paper',
        [EXTRA_FIELD]: 'number',
      },
    },
  ],
};
```

#### Sort by Aggregated (Total) Data

Use `TOTAL_VALUE` as `sortByMeasure` to sort by subtotal/grand total values:

```ts
import { EXTRA_FIELD, TOTAL_VALUE } from '@antv/s2';

const s2DataConfig = {
  sortParams: [
    {
      sortFieldId: 'province',
      sortByMeasure: TOTAL_VALUE,
      sortMethod: 'ASC',
      query: {
        type: 'Furniture',
        [EXTRA_FIELD]: 'number',
      },
    },
  ],
};
```

### 4. Custom Sort Function (`sortFunc`)

Full control over sorting logic. The function receives a `SortFuncParam` object:

| Property | Description | Type |
|---|---|---|
| `sortFieldId` | Field being sorted | `string` |
| `sortMethod` | Sort direction | `'ASC' \| 'DESC'` |
| `sortBy` | Custom sort list (if provided) | `string[]` |
| `sortByMeasure` | Measure to sort by (if provided) | `string` |
| `query` | Filter conditions | `Record<string, string>` |
| `data` | Current data list to sort | `Array<string \| CellData>` |

#### Sort by Dimension Values

```ts
const s2DataConfig = {
  sortParams: [
    {
      sortFieldId: 'province',
      sortFunc: (params) => {
        const { data } = params;
        return data.sort((a, b) => a.localeCompare(b));
      },
    },
  ],
};
```

#### Sort by Measure Values

```ts
const s2DataConfig = {
  sortParams: [
    {
      sortFieldId: 'city',
      sortByMeasure: 'price',
      query: { type: 'Paper', [EXTRA_FIELD]: 'price' },
      sortFunc: (params) => {
        const { data, sortByMeasure, sortFieldId } = params;
        return data
          .map((item) => item.raw)
          .sort((a, b) => b[sortByMeasure] - a[sortByMeasure])
          .map((item) => item[sortFieldId]);
      },
    },
  ],
};
```

### 5. Null Value Placement (`nullsPlacement`)

```ts
const s2DataConfig = {
  sortParams: [
    // Global: all fields default nulls first
    { sortFieldId: '*', nullsPlacement: 'first' },
    // Override: 'city' field nulls last
    { sortFieldId: 'city', nullsPlacement: 'last' },
  ],
};
```

## Group Sort

Group sort only affects ordering within a group — parent dimension order is preserved. For example, sorting cities within each province by a measure value won't change the province order.

> Only one sort state can exist per row/column header at a time. A new sort replaces the previous one on that axis.

### Using Group Sort API

```ts
const meta = cell.getMeta();

s2.groupSortByMethod('asc', meta);   // ascending
s2.groupSortByMethod('desc', meta);  // descending
s2.groupSortByMethod('none', meta);  // no sort
```

### Listening to Sort Events

```ts
s2.on(S2Event.RANGE_SORT, (sortParams) => {
  console.log('sort params:', sortParams);
});
```

### React Group Sort with Tooltip Menu

```ts
import { Menu } from 'antd';

const s2Options = {
  showDefaultHeaderActionIcon: true,
  tooltip: {
    operation: {
      sort: true,
      menu: {
        render: (props) => <Menu {...props} />,
      },
    },
  },
};
```

## Priority Rules

1. `sortParams` overrides the original data order.
2. Among multiple items in `sortParams`, later items have higher priority.
3. Within a single item: `sortFunc` > `sortBy` > `sortByMeasure` > `sortMethod`.
