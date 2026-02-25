# Layout Examples

## Example 1: Frozen Rows and Columns

### Table Sheet with Frozen Rows/Columns

Freeze leading and trailing rows/columns in a TableSheet.

```typescript
import { S2DataConfig, S2Options, TableSheet } from '@antv/s2';

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
  data: [/* ... */],
};

const s2Options: S2Options = {
  width: 450,
  height: 480,
  seriesNumber: { enable: true },
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

### PivotSheet with Frozen Rows/Columns and Totals

Freeze rows and columns in a PivotSheet with grand totals.

```typescript
import { PivotSheet, S2Options } from '@antv/s2';

const s2Options: S2Options = {
  width: 600,
  height: 300,
  frozen: {
    rowCount: 1,
    trailingRowCount: 1,
    colCount: 1,
    trailingColCount: 1,
  },
  totals: {
    row: {
      showGrandTotals: true,
      reverseGrandTotalsLayout: true,
    },
  },
  style: {
    colCell: {
      // Set specific column widths by field path
      widthByField: {
        'root[&]Furniture[&]Sofa[&]number': 200,
        'root[&]Stationery[&]Pen[&]number': 200,
      },
    },
  },
};

const s2 = new PivotSheet(container, dataCfg, s2Options);
await s2.render();
```

## Example 2: Custom Cell Sizing

Fine-grained control of row and column dimensions using `style` configuration.

```typescript
import { PivotSheet, S2Options, EXTRA_FIELD } from '@antv/s2';

const s2Options: S2Options = {
  width: 600,
  height: 480,
  hierarchyType: 'grid',
  style: {
    // Data cell size (lower priority than row/col cell width/height)
    dataCell: {
      // Ignored if colCell width is configured
      width: 100,
      // Ignored if rowCell height is configured
      height: 90,
    },
    // Row cell sizing (priority: heightByField > height > dataCell.height)
    rowCell: {
      width: 100,
      // width: (rowNode) => 100,
      // height: (rowNode) => 100,
      heightByField: {
        // By dimension (e.g., city)
        city: 50,
        // By specific node ID
        'root[&]Zhejiang[&]Hangzhou': 30,
        'root[&]Zhejiang[&]Ningbo': 100,
      },
    },
    // Column cell sizing (priority: widthByField > width > dataCell.width)
    colCell: {
      // width: (colNode) => 100,
      // height: (colNode) => 100,
      widthByField: {
        // EXTRA_FIELD is the internal virtual value column (when values are on columns)
        [EXTRA_FIELD]: 60,
        // Specific column node
        'root[&]Furniture[&]Sofa[&]number': 120,
      },
      heightByField: {
        // By dimension
        type: 50,
        [EXTRA_FIELD]: 80,
      },
    },
  },
};

const s2 = new PivotSheet(container, dataCfg, s2Options);
await s2.render();
```

## Example 3: Tree Mode Collapse Configuration

Control expand/collapse behavior in tree hierarchy mode.

```typescript
import { PivotSheet, S2Options } from '@antv/s2';

const s2Options: S2Options = {
  width: 600,
  height: 480,
  hierarchyType: 'tree',
  style: {
    rowCell: {
      // Method 1: Collapse specific nodes by node ID
      collapseFields: { 'root[&]Zhejiang': true },

      // Method 2: Collapse all nodes of a specific dimension
      // collapseFields: { city: true },

      // Method 3: Set expand depth (lower priority than collapseFields;
      //           only effective when collapseFields is not configured or null)
      // expandDepth: 0,

      // Method 4: Collapse all (lowest priority; only effective when
      //           collapseFields and expandDepth are not configured or null)
      // collapseAll: true,
    },
  },
};

const s2 = new PivotSheet(container, dataCfg, s2Options);
await s2.render();
```
