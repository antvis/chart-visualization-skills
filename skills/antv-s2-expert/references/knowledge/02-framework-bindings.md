# Framework Bindings (React & Vue)

## React: @antv/s2-react

The `@antv/s2-react` package provides `<SheetComponent />`, a ready-to-use React wrapper around `@antv/s2`.

### Installation

```bash
npm install @antv/s2 @antv/s2-react
```

### Basic Usage

```tsx
import React from 'react';
import { SheetComponent } from '@antv/s2-react';
import '@antv/s2-react/dist/s2-react.min.css';

const App = () => (
  <SheetComponent
    sheetType="pivot"
    dataCfg={s2DataConfig}
    options={{ width: 600, height: 400 }}
  />
);
```

### SheetComponent Props (SpreadsheetProps)

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `sheetType` | `'pivot' \| 'table' \| 'gridAnalysis' \| 'strategy' \| 'editable'` | `'pivot'` | | Sheet type |
| `dataCfg` | `S2DataConfig` | | ✓ | Data configuration |
| `options` | `SheetComponentOptions` | | ✓ | Table options (extends `S2Options`, tooltip content accepts `ReactNode`) |
| `themeCfg` | `ThemeCfg` | | | Custom theme configuration |
| `adaptive` | `boolean \| { width?: boolean, height?: boolean, getContainer: () => HTMLElement }` | `false` | | Auto-resize with window |
| `loading` | `boolean` | | | Loading state |
| `partDrillDown` | `PartDrillDown` | | | Drill-down configuration |

### Key Event Props

Events are passed as `onXxx` props on `<SheetComponent />`:

| Prop | Description |
|------|-------------|
| `onRowCellClick` | Row header cell click |
| `onColCellClick` | Column header cell click |
| `onDataCellClick` | Data cell click |
| `onCornerCellClick` | Corner header cell click |
| `onDataCellHover` | Data cell hover |
| `onRowCellCollapsed` | Row expand/collapse callback |
| `onDataCellBrushSelection` | Data cell brush selection |
| `onMounted` | Table instance mounted (receives `SpreadSheet` instance) |
| `onDestroy` | Table destroyed |
| `onScroll` | Cell scroll event |
| `onCopied` | Copy event |
| `onAfterRender` | Render complete |
| `onLayoutResizeColWidth` | Column width resize |
| `onLayoutResizeRowHeight` | Row height resize |

### Getting the S2 Instance in React

Use the `onMounted` callback to access the underlying `SpreadSheet` instance:

```tsx
const App = () => {
  const s2Ref = React.useRef<SpreadSheet>();

  return (
    <SheetComponent
      sheetType="pivot"
      dataCfg={s2DataConfig}
      options={s2Options}
      onMounted={(instance) => {
        s2Ref.current = instance;
      }}
    />
  );
};
```

### Using @antv/s2 Directly in React

If you need more control, use the core library directly:

```tsx
import React from 'react';
import { PivotSheet } from '@antv/s2';

const App = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const s2 = new PivotSheet(containerRef.current, dataCfg, options);
    s2.render();

    return () => {
      s2.destroy();
    };
  }, []);

  return <div ref={containerRef} />;
};
```

---

## Vue 3: @antv/s2-vue

The `@antv/s2-vue` package provides a `<SheetComponent />` for Vue 3.0.

### Installation

```bash
npm install @antv/s2 @antv/s2-vue
```

### Basic Usage (Pivot Table)

```vue
<template>
  <SheetComponent
    :sheetType="'pivot'"
    :dataCfg="s2DataConfig"
    :options="s2Options"
    @rowCellClick="handleRowCellClick"
  />
</template>

<script setup>
import { SheetComponent } from '@antv/s2-vue';
import '@antv/s2-vue/dist/s2-vue.min.css';

const s2DataConfig = {
  fields: {
    rows: ['province', 'city'],
    columns: ['type'],
    values: ['price'],
  },
  data: [/* ... */],
};

const s2Options = { width: 600, height: 400 };

const handleRowCellClick = (data) => {
  console.log('Row clicked:', data);
};
</script>
```

### Basic Usage (Detail Table)

```vue
<template>
  <SheetComponent
    :sheetType="'table'"
    :dataCfg="s2DataConfig"
    :options="s2Options"
  />
</template>
```

### Vue Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `sheetType` | `'pivot' \| 'table' \| 'editable'` | `'pivot'` | | Sheet type |
| `dataCfg` | `S2DataConfig` | | ✓ | Data configuration |
| `options` | `SheetComponentOptions` | | ✓ | Table options |
| `themeCfg` | `ThemeCfg` | | | Custom theme configuration |
| `adaptive` | `boolean \| { width?: boolean, height?: boolean, getContainer: () => HTMLElement }` | `false` | | Auto-resize with window |
| `loading` | `boolean` | | | Loading state |
| `showPagination` | `boolean \| { onShowSizeChange?, onChange? }` | `false` | | Show default pagination (requires `pagination` in options) |

### Vue Events

Events use camelCase names (without `on` prefix), e.g., `@rowCellClick`:

| Event | Description |
|-------|-------------|
| `rowCellClick` | Row header cell click |
| `colCellClick` | Column header cell click |
| `dataCellClick` | Data cell click |
| `cornerCellClick` | Corner header cell click |
| `dataCellHover` | Data cell hover |
| `rowCellCollapsed` | Row expand/collapse |
| `colCellExpanded` | Column expand (hidden columns) |
| `colCellHidden` | Column hidden |
| `rowCellRender` | Row cell render |
| `colCellRender` | Column cell render |
| `dataCellRender` | Data cell render |
| `scroll` | Cell scroll event |

### Vue Custom Table Instance

Pass a `spreadsheet` factory function via event:

```vue
<template>
  <SheetComponent
    :dataCfg="dataCfg"
    :options="options"
    @spreadsheet="createSpreadSheet"
  />
</template>

<script setup>
import { PivotSheet } from '@antv/s2';

const createSpreadSheet = (container, dataCfg, options) => {
  return new PivotSheet(container, dataCfg, options);
};
</script>
```

---

## Comparison

| Feature | React (`@antv/s2-react`) | Vue (`@antv/s2-vue`) |
|---------|--------------------------|----------------------|
| Component | `<SheetComponent />` | `<SheetComponent />` |
| Sheet types | pivot, table, gridAnalysis, strategy, editable | pivot, table, editable |
| Events | `onXxxClick` props | `@xxxClick` events |
| Tooltip content | `ReactNode` (JSX) | Vue slots / render |
| Instance access | `onMounted` prop | `spreadsheet` event |
| CSS import | `@antv/s2-react/dist/s2-react.min.css` | `@antv/s2-vue/dist/s2-vue.min.css` |
