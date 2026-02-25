# Theme & Style Configuration

## Built-in Themes

S2 provides 4 built-in themes:

| Theme Name | Description |
|-----------|-------------|
| `default` | Default theme |
| `colorful` | Colorful blue theme |
| `gray` | Minimalist gray theme |
| `dark` | Dark theme |

### Selecting a Built-in Theme

```ts
const s2 = new PivotSheet(container, s2DataConfig, s2Options);

s2.setThemeCfg({ name: 'colorful' });
await s2.render(false);
```

## Theme Architecture

### Palette

A palette defines the color source for theme generation:

- `basicColors`: 15 color slots that determine the table's color scheme. Theme generation pulls colors from fixed indices (e.g., row header background always uses `basicColors[1]`).
- `basicColorRelations`: Maps `basicColors` indices to the standard 11-color palette derived from a theme color.
- `semanticColors`: Semantic colors like `red`, `green`.
- `others`: Special fixed colors (e.g., search highlight).

### Theme Schema (S2Theme)

The full theme schema (`S2Theme`) describes all visual properties: colors, line widths, font sizes, text alignment, etc. All colors in the schema are derived from the palette.

## Custom Theme Methods

### Method 1: Custom Schema

Override specific theme properties using `setTheme()` or `setThemeCfg({ theme })`:

```ts
const s2 = new PivotSheet(container, s2DataConfig, s2Options);

s2.setTheme({
  background: {
    color: '#353c59',
  },
});
await s2.render(false);
```

### Customize Cell Background Color

```ts
s2.setTheme({
  rowCell: {
    cell: {
      backgroundColor: '#dcdcdc',
    },
  },
});
```

### Customize Cell Text Alignment

Cell text types: `text` (normal), `bolderText` (bold), `seriesText` (series number), `measureText` (measure values).

```ts
s2.setTheme({
  rowCell: {
    text: { textAlign: 'left' },
    bolderText: { textAlign: 'left' },
    seriesText: { textAlign: 'left' },
    measureText: { textAlign: 'left' },
  },
});
```

### Customize Scrollbar

```ts
s2.setTheme({
  scrollBar: {
    thumbColor: '#666',
    thumbHorizontalMinSize: 20,
    thumbVerticalMinSize: 20,
  },
});
```

### Method 2: Custom Palette

Provide your own `basicColors` and `semanticColors`:

```ts
const customPalette = {
  basicColors: [
    '#FFFFFF', '#F8F5FE', '#EDE1FD', '#873BF4', '#7232CF',
    '#AB76F7', '#FFFFFF', '#DDC7FC', '#9858F5', '#B98EF8',
    '#873BF4', '#282B33', '#121826',
  ],
  semanticColors: {
    red: '#FF4D4F',
    green: '#29A294',
  },
};

s2.setThemeCfg({ palette: customPalette });
await s2.render(false);
```

### Method 3: Auto-generate Palette from Theme Color

```ts
import { getPalette, generatePalette, PivotSheet } from '@antv/s2';

const themeColor = '#EA1720';
const palette = getPalette('colorful'); // use built-in as reference
const newPalette = generatePalette({ ...palette, brandColor: themeColor });

s2.setThemeCfg({ palette: newPalette });
await s2.render(false);
```

---

## Style Configuration (s2Options.style)

The `style` property in `S2Options` controls cell dimensions and layout.

### Top-level Style Properties

| Property | Type | Description |
|----------|------|-------------|
| `layoutWidthType` | `'adaptive' \| 'colAdaptive' \| 'compact'` | Cell width layout mode |
| `compactExtraWidth` | `number` | Extra width added in compact mode (default: 0) |
| `compactMinWidth` | `number` | Minimum cell width in compact mode (default: 0) |
| `dataCell` | `DataCell` | Data cell configuration |
| `rowCell` | `RowCell` | Row header cell configuration |
| `colCell` | `ColCell` | Column header cell configuration |
| `cornerCell` | `CornerCell` | Corner header cell configuration |

### layoutWidthType Options

- **`adaptive`**: Rows and columns share equal width, evenly dividing the entire canvas width.
- **`colAdaptive`**: Row headers use compact width; columns evenly divide remaining canvas width.
- **`compact`**: Both row and column headers use compact width based on content (samples the first 50 rows per column).

```ts
const s2Options = {
  style: {
    layoutWidthType: 'compact',
    compactExtraWidth: 12,
    compactMinWidth: 60,
  },
};
```

### DataCell Style

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | `number` | 96 | Cell width (priority: `colCell.widthByField > colCell.width > dataCell.width`) |
| `height` | `number` | 30 | Cell height (priority: `rowCell.heightByField > rowCell.height > dataCell.height`) |

### ColCell Style

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | `number \| (colNode) => number` | 96 | Leaf node width |
| `height` | `number \| (colNode) => number` | 30 | Cell height |
| `widthByField` | `Record<string, number>` | | Width per specific field or node ID |
| `heightByField` | `Record<string, number>` | | Height per specific field or node ID |
| `hideValue` | `boolean` | false | Hide value row in column header (single value only) |

### RowCell Style

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | `number \| (rowNode) => number` | | Row cell width |
| `treeWidth` | `number` | | Width in tree mode (overrides `width`) |
| `height` | `number \| (rowNode) => number` | 30 | Row cell height |
| `widthByField` | `Record<string, number>` | | Width per specific field |
| `heightByField` | `Record<string, number>` | | Height per specific field or row index (TableSheet) |
| `collapseAll` | `boolean` | false | Collapse all rows in tree mode |
| `expandDepth` | `number` | | Default expand depth in tree mode (0-based) |
| `collapseFields` | `Record<string, boolean>` | | Custom collapse state per node ID or field |

### Text Word Wrap Configuration

Applies to all cell types:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `wordWrap` | `boolean` | `true` | Enable text auto-wrap |
| `maxLines` | `number` | `1` | Max text lines before truncation |
| `textOverflow` | `string` | `'ellipsis'` | Overflow indicator text |

### Example: Custom Cell Sizes

```ts
const s2Options = {
  style: {
    dataCell: {
      width: 100,
      height: 40,
    },
    rowCell: {
      width: 80,
      heightByField: {
        'root[&]Zhejiang[&]Hangzhou': 60,
      },
    },
    colCell: {
      width: 120,
      height: 50,
    },
  },
};
```
