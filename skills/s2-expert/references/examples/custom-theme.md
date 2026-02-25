# Custom Theme Examples

## Example 1: Built-in Theme (Dark Mode)

Use a built-in theme by name via `setThemeCfg`.

```typescript
import { PivotSheet, S2DataConfig, S2Options } from '@antv/s2';

const s2DataConfig: S2DataConfig = {
  fields: {
    rows: ['province', 'city'],
    columns: ['type'],
    values: ['price', 'cost'],
  },
  meta: [
    { field: 'province', name: 'Province' },
    { field: 'city', name: 'City' },
    { field: 'type', name: 'Category' },
    { field: 'price', name: 'Price' },
    { field: 'cost', name: 'Cost' },
  ],
  data: [/* ... */],
};

const s2Options: S2Options = {
  width: 600,
  height: 480,
};

const s2 = new PivotSheet(container, s2DataConfig, s2Options);

// Available built-in themes: 'default', 'dark', 'gray', 'colorful'
s2.setThemeCfg({
  name: 'dark',
});

await s2.render();
```

## Example 2: Custom Palette

Create a custom color palette and apply it with `setThemeCfg`.

```typescript
import { PivotSheet, S2DataConfig, S2Options, ThemeCfg } from '@antv/s2';

const s2DataConfig: S2DataConfig = {
  fields: {
    rows: ['province', 'city'],
    columns: ['type'],
    values: ['price', 'cost'],
  },
  meta: [
    { field: 'province', name: 'Province' },
    { field: 'city', name: 'City' },
    { field: 'type', name: 'Category' },
    { field: 'price', name: 'Price' },
    { field: 'cost', name: 'Cost' },
  ],
  data: [/* ... */],
};

const s2Options: S2Options = {
  width: 600,
  height: 480,
};

const s2Palette: ThemeCfg['palette'] = {
  basicColors: [
    '#FFFFFF',
    '#F8F5FE',
    '#EDE1FD',
    '#873BF4',
    '#7232CF',
    '#7232CF',
    '#7232CF',
    '#AB76F7',
    '#FFFFFF',
    '#DDC7FC',
    '#9858F5',
    '#B98EF8',
    '#873BF4',
    '#282B33',
    '#121826',
  ],
  // Semantic colors for conditional formatting
  semanticColors: {
    red: '#FF4D4F',
    green: '#29A294',
  },
};

const s2 = new PivotSheet(container, s2DataConfig, s2Options);

s2.setThemeCfg({
  palette: s2Palette,
});

await s2.render();
```

## Example 3: Custom Theme Schema

Fully customize theme properties using `setTheme` for fine-grained control over every cell type, borders, colors, fonts, and interaction states.

```typescript
import {
  FONT_FAMILY,
  S2DataConfig,
  S2Options,
  S2Theme,
  TableSheet,
} from '@antv/s2';

const s2DataConfig: S2DataConfig = {
  fields: {
    columns: ['province', 'city', 'type', 'price', 'cost'],
  },
  meta: [
    { field: 'province', name: 'Province' },
    { field: 'city', name: 'City' },
    { field: 'type', name: 'Category' },
    { field: 'price', name: 'Price' },
    { field: 'cost', name: 'Cost' },
  ],
  data: [/* ... */],
};

const s2Options: S2Options = {
  width: 600,
  height: 480,
};

const BORDER_COLOR = 'rgb(39, 44, 65)';
const BACK_COLOR = 'rgb(67, 72, 91)';
const HEADER_BACK_COLOR = '#353c59';
const CELL_ACTIVE_BACK_COLOR = '#434c6c';

const customTheme: S2Theme = {
  background: {
    color: HEADER_BACK_COLOR,
  },
  empty: {
    icon: {
      fill: '#fff',
      width: 64,
      height: 41,
      margin: { top: 0, right: 0, bottom: 24, left: 0 },
    },
    description: {
      fontFamily: FONT_FAMILY,
      fontSize: 12,
      fontWeight: 'normal',
      fill: '#fff',
      opacity: 1,
    },
  },
  cornerCell: {
    cell: {
      horizontalBorderColor: BORDER_COLOR,
      verticalBorderColor: BORDER_COLOR,
      padding: { top: 12, right: 8, bottom: 12, left: 8 },
      backgroundColor: HEADER_BACK_COLOR,
    },
    text: { fill: '#fff' },
    bolderText: { fill: '#fff', opacity: 0.4 },
  },
  splitLine: {
    horizontalBorderColor: BORDER_COLOR,
    horizontalBorderColorOpacity: 1,
    horizontalBorderWidth: 2,
    verticalBorderColor: BORDER_COLOR,
    verticalBorderColorOpacity: 1,
    verticalBorderWidth: 2,
    showShadow: true,
    shadowWidth: 10,
    shadowColors: {
      left: 'rgba(0,0,0,0.1)',
      right: 'rgba(0,0,0,0)',
    },
  },
  colCell: {
    cell: {
      horizontalBorderColor: BORDER_COLOR,
      verticalBorderColor: BORDER_COLOR,
      verticalBorderWidth: 2,
      horizontalBorderWidth: 2,
      padding: { top: 12, right: 8, bottom: 12, left: 8 },
      backgroundColor: HEADER_BACK_COLOR,
      interactionState: {
        hover: {
          backgroundColor: CELL_ACTIVE_BACK_COLOR,
          backgroundOpacity: 1,
        },
        selected: {
          backgroundColor: 'rgb(63, 69, 97)',
        },
      },
    },
    text: { fill: '#fff' },
    bolderText: { fill: '#fff', opacity: 0.4 },
  },
  dataCell: {
    icon: {
      size: 14,
      margin: { left: 10 },
    },
    cell: {
      interactionState: {
        hover: {
          backgroundColor: CELL_ACTIVE_BACK_COLOR,
          backgroundOpacity: 1,
        },
        hoverFocus: {
          backgroundColor: CELL_ACTIVE_BACK_COLOR,
          backgroundOpacity: 1,
          borderColor: 'blue',
        },
        selected: {
          backgroundColor: CELL_ACTIVE_BACK_COLOR,
          backgroundOpacity: 1,
        },
        unselected: {
          backgroundOpacity: 1,
          opacity: 1,
        },
        prepareSelect: {
          borderColor: CELL_ACTIVE_BACK_COLOR,
        },
      },
      horizontalBorderColor: BORDER_COLOR,
      verticalBorderColor: BORDER_COLOR,
      verticalBorderWidth: 2,
      horizontalBorderWidth: 2,
      padding: { top: 0, right: 8, bottom: 2, left: 0 },
      backgroundColorOpacity: 0.9,
      backgroundColor: BACK_COLOR,
      crossBackgroundColor: BACK_COLOR,
    },
    text: { fill: '#fff' },
  },
};

const s2 = new TableSheet(container, s2DataConfig, s2Options);

// Apply fully custom theme via setTheme
s2.setTheme(customTheme);

await s2.render();
```
