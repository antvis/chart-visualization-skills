# Custom Cell Rendering

## Overview

S2 allows full customization of cell rendering through two main approaches:

1. **Cell class hooks** in `S2Options`: Replace cell classes via `dataCell`, `colCell`, `rowCell`, `cornerCell`.
2. **Drawing custom shapes**: Use `@antv/g` graphics API to add arbitrary shapes to cells or the canvas.

Each S2 cell is a [Group](https://g.antv.antgroup.com/api/basic/group) from the `@antv/g` graphics library. You can add any G shape (Rect, Image, Text, etc.) or even embed charts from `@antv/g2`.

## Custom Cell via S2Options Hooks

The `S2Options` object accepts factory functions that return custom cell instances:

```ts
const s2Options = {
  dataCell: (viewMeta, spreadsheet) => {
    return new CustomDataCell(viewMeta, spreadsheet);
  },
  colCell: (node, spreadsheet, headerConfig) => {
    return new CustomColCell(node, spreadsheet, headerConfig);
  },
  rowCell: (node, spreadsheet, headerConfig) => {
    return new CustomRowCell(node, spreadsheet, headerConfig);
  },
  cornerCell: (node, spreadsheet, headerConfig) => {
    return new CustomCornerCell(node, spreadsheet, headerConfig);
  },
};
```

## Extending Base Cell Classes

S2 provides base classes to extend: `DataCell`, `ColCell`, `RowCell`, `CornerCell`.

### Example: Custom Corner Cell with Background Image

```ts
import { Image as GImage } from '@antv/g';
import { CornerCell } from '@antv/s2';

class CustomCornerCell extends CornerCell {
  drawBackgroundShape() {
    const url = 'https://example.com/bg.png';
    this.backgroundShape = this.appendChild(
      new GImage({
        style: {
          ...this.getBBoxByType(),
          src: url,
        },
      }),
    );
    this.drawTextShape();
  }
}

const s2Options = {
  cornerCell: (node, spreadsheet, headerConfig) => {
    return new CustomCornerCell(node, spreadsheet, headerConfig);
  },
};
```

### Example: Custom Data Cell with Extra Shapes

```ts
import { Rect } from '@antv/g';
import { DataCell } from '@antv/s2';

class CustomDataCell extends DataCell {
  initCell() {
    super.initCell();
    // Add a custom colored indicator
    this.appendChild(
      new Rect({
        style: {
          x: 0,
          y: 0,
          width: 4,
          height: this.getMeta().height,
          fill: '#1890FF',
        },
      }),
    );
  }
}

const s2Options = {
  dataCell: (viewMeta, spreadsheet) => {
    return new CustomDataCell(viewMeta, spreadsheet);
  },
};
```

## Drawing Shapes Directly on Canvas

After rendering, you can add shapes directly to the canvas:

```ts
import { Rect } from '@antv/g';

await s2.render();

s2.getCanvas().appendChild(
  new Rect({
    style: {
      x: 300,
      y: 200,
      width: 100,
      height: 100,
      fill: '#1890FF',
      fillOpacity: 0.8,
      stroke: '#F04864',
      lineWidth: 4,
      radius: 100,
      zIndex: 999,
    },
  }),
);
```

## Drawing Shapes on Specific Cells

Get a cell instance and append shapes to it:

```ts
import { Rect } from '@antv/g';

await s2.render();

const targetCell = s2.facet.getDataCells()[0];
targetCell?.appendChild(
  new Rect({
    style: {
      x: 0,
      y: 0,
      width: 20,
      height: 20,
      fill: '#396',
      fillOpacity: 0.8,
      radius: 10,
      zIndex: 999,
    },
  }),
);
```

## Adding Custom Icons to Cells

```ts
import { GuiIcon } from '@antv/s2';

await s2.render();

const targetCell = s2.facet.getDataCells()[0];
const meta = targetCell.getMeta();
const size = 12;

const icon = new GuiIcon({
  x: meta.x + meta.width - size,
  y: meta.y + meta.height - size,
  name: 'Trend',
  width: size,
  height: size,
  fill: 'red',
});

icon.addEventListener('click', (e) => {
  console.log('icon clicked:', e);
});

targetCell.appendChild(icon);
```

---

## Custom Cell Size Configuration

Cell sizes are controlled via `s2Options.style`. See the [Theme & Style](./03-theme-style.md) reference for full details.

### Quick Reference: Size Priority

**Data cell width**: `colCell.widthByField > colCell.width > dataCell.width`
**Data cell height**: `rowCell.heightByField > rowCell.height > dataCell.height`

### Setting Data Cell Size

```ts
const s2Options = {
  style: {
    dataCell: { width: 100, height: 90 },
  },
};
```

### Dynamic Row Header Size

```ts
const s2Options = {
  style: {
    rowCell: {
      width: (rowNode) => (rowNode.isLeaf ? 300 : 200),
      height: (rowNode) => (rowNode.level % 2 === 0 ? 300 : null), // null = default
    },
  },
};
```

### Per-field Width/Height

```ts
import { EXTRA_FIELD } from '@antv/s2';

const s2Options = {
  style: {
    rowCell: {
      widthByField: {
        city: 100,
        'root[&]Zhejiang[&]Hangzhou': 60,
        [EXTRA_FIELD]: 20,
      },
      heightByField: {
        'root[&]Zhejiang[&]Hangzhou': 60,
      },
    },
  },
};
```

### Dynamic Column Header Size

```ts
const s2Options = {
  style: {
    colCell: {
      width: (colNode) => (colNode.colIndex <= 2 ? 100 : 50),
      height: (colNode) => (colNode.colIndex <= 2 ? 100 : null),
    },
  },
};
```

### Hiding Column Headers

Set height to `0` to hide column headers:

```ts
const s2Options = {
  style: {
    colCell: { height: 0 },
  },
};
```

Optionally hide the split line:

```ts
s2.setTheme({
  splitLine: {
    horizontalBorderColorOpacity: 0,
  },
});
```

### TableSheet Row Height

For TableSheet, use `rowCell.heightByField` with **row indices** (0-based):

```ts
const s2Options = {
  style: {
    rowCell: {
      height: 40,
      heightByField: {
        '0': 130,  // first row
        '2': 60,   // third row
      },
    },
  },
};
```

---

## Custom Row/Column Header Grouping

By default, header grouping is generated from the data. You can provide a custom tree structure:

```ts
const customTree = [
  {
    field: 'a-1',
    title: 'Custom Node A-1',
    children: [
      {
        field: 'a-1-1',
        title: 'Custom Node A-1-1',
        children: [
          { field: 'measure-1', title: 'Measure 1', children: [] },
          { field: 'measure-2', title: 'Measure 2', children: [] },
        ],
      },
    ],
  },
];

// Use as row header (pivot table)
const s2DataConfig = {
  fields: {
    rows: customTree,
    columns: ['type', 'sub_type'],
    values: ['measure-1', 'measure-2'],
    valueInCols: false, // values must be in rows when custom row headers
  },
  data: [/* ... */],
};

// Use as column header (pivot or table)
const s2DataConfig = {
  fields: {
    columns: customTree,
    rows: ['type'],
    values: ['measure-1'],
    valueInCols: true,
  },
  data: [/* ... */],
};
```

> **Note**: When using custom headers, default sort icons and subtotal/grand total configurations for the customized axis are not supported.
