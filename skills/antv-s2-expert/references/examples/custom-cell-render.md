# Custom Cell Rendering Examples

## Example 1: Custom DataCell with Background Image

Extend `DataCell` to override the `drawBackgroundShape` method and add a custom background image to data cells.

```typescript
import { PivotSheet, DataCell, S2DataConfig, S2Options } from '@antv/s2';
import { Image as GImage } from '@antv/g';

/**
 * Custom DataCell - adds a background image to data cells.
 * For TableSheet, extend TableDataCell instead.
 * See: https://github.com/antvis/S2/blob/next/packages/s2-core/src/cell/data-cell.ts
 */
class CustomDataCell extends DataCell {
  // Override the background drawing method to add a background image
  drawBackgroundShape() {
    const url =
      'https://gw.alipayobjects.com/zos/antfincdn/og1XQOMyyj/1e3a8de1-3b42-405d-9f82-f92cb1c10413.png';

    this.backgroundShape = this.appendChild(
      new GImage({
        style: {
          ...this.getBBoxByType(),
          src: url,
        },
      }),
    );
  }
}

const s2DataConfig: S2DataConfig = {
  fields: {
    rows: ['province', 'city'],
    columns: ['type', 'sub_type'],
    values: ['number'],
  },
  meta: [/* ... */],
  data: [/* ... */],
};

const s2Options: S2Options = {
  width: 600,
  height: 480,
  interaction: {
    // Disable hover cross-highlight for visual clarity
    hoverHighlight: false,
  },
  // Register custom DataCell via the dataCell callback
  dataCell: (viewMeta, spreadsheet) => {
    return new CustomDataCell(viewMeta, spreadsheet);
  },
};

const s2 = new PivotSheet(container, s2DataConfig, s2Options);

await s2.render();
```

## Example 2: Custom TableDataCell with Conditional Styling

Extend `TableDataCell` to override `getBackgroundColor` and `getTextStyle` for conditional formatting based on cell data.

```typescript
import {
  TableColCell,
  TableDataCell,
  TableSheet,
  type S2DataConfig,
  type S2Options,
} from '@antv/s2';

/**
 * Custom TableDataCell - conditional background color and text styling.
 * See: https://github.com/antvis/S2/blob/next/packages/s2-core/src/cell/table-data-cell.ts
 */
class CustomDataCell extends TableDataCell {
  getBackgroundColor() {
    // Highlight cells with value >= 6000
    if (this.meta.fieldValue >= 6000) {
      return {
        backgroundColor: 'red',
        backgroundColorOpacity: 0.2,
      };
    }

    return super.getBackgroundColor();
  }

  getTextStyle() {
    const defaultTextStyle = super.getTextStyle();

    // Bold centered text for the first column (series number)
    if (this.meta.colIndex === 0) {
      return {
        ...defaultTextStyle,
        fontWeight: 600,
        textAlign: 'center',
      };
    }

    // Alternating row style for specific columns
    if (this.meta.rowIndex % 2 === 0 && this.meta.colIndex > 0) {
      return {
        ...defaultTextStyle,
        fontSize: 16,
        fill: '#396',
        textAlign: 'left',
      };
    }

    // Highlight high-value data
    if (this.meta.fieldValue >= 600) {
      return {
        ...defaultTextStyle,
        fontSize: 14,
        fontWeight: 700,
        fill: '#f63',
        textAlign: 'center',
      };
    }

    return super.getTextStyle();
  }
}

/**
 * Custom TableColCell - conditional text styling for column headers.
 * See: https://github.com/antvis/S2/blob/next/packages/s2-core/src/cell/table-col-cell.ts
 */
class CustomColCell extends TableColCell {
  getTextStyle() {
    const defaultTextStyle = super.getTextStyle();

    // Style even-indexed columns
    if (this.meta.colIndex % 2 === 0) {
      return {
        ...defaultTextStyle,
        fontSize: 16,
        fill: '#396',
        textAlign: 'left',
      };
    }

    return super.getTextStyle();
  }
}

const s2Options: S2Options = {
  width: 600,
  height: 480,
  seriesNumber: {
    enable: true,
  },
  // Register custom cells via callbacks
  colCell: (node, spreadsheet, headerConfig) => {
    return new CustomColCell(node, spreadsheet, headerConfig);
  },
  dataCell: (viewMeta, spreadsheet) => {
    return new CustomDataCell(viewMeta, spreadsheet);
  },
};

const s2 = new TableSheet(container, s2DataConfig, s2Options);

await s2.render();
```

## Example 3: Custom ColCell with Background Image

Extend `ColCell` to add a background image to column header cells.

```typescript
import { PivotSheet, ColCell, S2Options, S2DataConfig } from '@antv/s2';
import { Image as GImage } from '@antv/g';

/**
 * Custom ColCell - adds a background image to column headers.
 * For TableSheet, extend TableColCell instead.
 * See: https://github.com/antvis/S2/blob/next/packages/s2-core/src/cell/col-cell.ts
 */
class CustomColCell extends ColCell {
  // Override the background drawing method
  drawBackgroundShape() {
    const url =
      'https://gw.alipayobjects.com/zos/antfincdn/og1XQOMyyj/1e3a8de1-3b42-405d-9f82-f92cb1c10413.png';

    this.backgroundShape = this.appendChild(
      new GImage({
        style: {
          ...this.getBBoxByType(),
          src: url,
        },
      }),
    );
  }
}

const s2Options: S2Options = {
  width: 600,
  height: 480,
  interaction: {
    hoverHighlight: false,
  },
  // Register custom ColCell via the colCell callback
  colCell: (node, s2, headConfig) => {
    return new CustomColCell(node, s2, headConfig);
  },
};

const s2 = new PivotSheet(container, s2DataConfig, s2Options);

await s2.render();
```
