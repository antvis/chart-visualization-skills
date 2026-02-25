# Frozen Rows and Columns

## Overview

The frozen (freeze) feature pins specific rows and columns so they remain visible while scrolling. This is configured via the `s2Options.frozen` property.

## Frozen Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| rowHeader | `boolean \| number` | `true` | Freeze row header. When `number`, sets the max frozen area ratio (0, 1) — 0 means no freeze. When `boolean`, `true` = 0.5, `false` = 0. **Pivot table only.** |
| rowCount | `number` | `0` | Number of frozen rows from the **top**, counted by leaf nodes. (Not effective in pivot tables with row serial number enabled and custom serial number cells.) |
| colCount | `number` | `0` | Number of frozen columns from the **left**, counted by leaf nodes. |
| trailingRowCount | `number` | `0` | Number of frozen rows from the **bottom**, counted by leaf nodes. (Not effective in pivot tables with row serial number enabled and custom serial number cells.) |
| trailingColCount | `number` | `0` | Number of frozen columns from the **right**, counted by leaf nodes. |

## Usage

### Freeze Row Header (Pivot Table)

```ts
const s2Options = {
  frozen: {
    rowHeader: true,   // Freeze row header with default 0.5 ratio
  },
};

// Or set a custom ratio
const s2Options = {
  frozen: {
    rowHeader: 0.3,    // Row header takes at most 30% of table width
  },
};
```

### Freeze Rows and Columns (Table Sheet)

```ts
const s2Options = {
  frozen: {
    colCount: 2,            // Freeze first 2 columns
    trailingColCount: 1,    // Freeze last 1 column
    rowCount: 3,            // Freeze first 3 rows
    trailingRowCount: 2,    // Freeze last 2 rows
  },
};
```

### Freeze Only Columns

```ts
const s2Options = {
  frozen: {
    colCount: 1,            // Freeze first column
    trailingColCount: 1,    // Freeze last column
  },
};
```

## Notes

- Row/column counts are based on **leaf nodes** in the hierarchy.
- For pivot tables, `rowHeader` controls the row header area freeze. Use `rowCount`/`trailingRowCount` for data row freezing.
- Setting `rowHeader: false` or `rowHeader: 0` disables row header freezing in pivot tables.
