# React SheetComponent Usage Examples

## Example 1: React PivotSheet

Use `SheetComponent` from `@antv/s2-react` to render a pivot table in React. The default `sheetType` is `"pivot"`.

```tsx
import React from 'react';
import type { S2RenderOptions, SpreadSheet } from '@antv/s2';
import { SheetComponent, SheetComponentOptions } from '@antv/s2-react';
import '@antv/s2-react/dist/s2-react.min.css';

const App: React.FC = () => {
  const s2Options: SheetComponentOptions = {
    width: 600,
    height: 480,
  };

  const dataCfg = {
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
    data: [
      // ... your data
    ],
  };

  const onMounted = (spreadsheet: SpreadSheet) => {
    console.log('onMounted:', spreadsheet);
  };

  const onUpdate = (renderOptions: S2RenderOptions) => {
    console.log('onUpdate:', renderOptions);
    return renderOptions;
  };

  const onUpdateAfterRender = (renderOptions: S2RenderOptions) => {
    console.log('onUpdateAfterRender:', renderOptions);
  };

  return (
    <SheetComponent
      dataCfg={dataCfg}
      options={s2Options}
      onMounted={onMounted}
      onUpdate={onUpdate}
      onUpdateAfterRender={onUpdateAfterRender}
    />
  );
};
```

## Example 2: React TableSheet

Set `sheetType="table"` to render a flat table layout.

```tsx
import React from 'react';
import { S2DataConfig, type S2RenderOptions, type SpreadSheet } from '@antv/s2';
import { SheetComponent, SheetComponentOptions } from '@antv/s2-react';
import '@antv/s2-react/dist/s2-react.min.css';

const App: React.FC = () => {
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
    data: [
      // ... your data
    ],
  };

  const s2Options: SheetComponentOptions = {
    width: 600,
    height: 480,
  };

  const onMounted = (spreadsheet: SpreadSheet) => {
    console.log('onMounted:', spreadsheet);
  };

  return (
    <SheetComponent
      dataCfg={s2DataConfig}
      options={s2Options}
      sheetType="table"
      onMounted={onMounted}
    />
  );
};
```

## Example 3: React Editable TableSheet

Set `sheetType="editable"` to enable inline cell editing with frozen rows/columns support.

```tsx
import React from 'react';
import { S2DataConfig } from '@antv/s2';
import {
  SheetComponent,
  SheetComponentOptions,
  type SheetComponentsProps,
} from '@antv/s2-react';
import '@antv/s2-react/dist/s2-react.min.css';

const App: React.FC = () => {
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
    data: [
      // ... your data
    ],
  };

  const s2Options: SheetComponentOptions = {
    width: 480,
    height: 480,
    seriesNumber: {
      enable: true,
    },
    frozen: {
      rowCount: 1,
      colCount: 1,
      trailingRowCount: 1,
      trailingColCount: 1,
    },
  };

  const onDataCellEditStart: SheetComponentsProps['onDataCellEditStart'] = (
    meta,
    cell,
  ) => {
    console.log('onDataCellEditStart:', meta, cell);
  };

  const onDataCellEditEnd: SheetComponentsProps['onDataCellEditEnd'] = (
    meta,
    cell,
  ) => {
    console.log('onDataCellEditEnd:', meta, cell);
  };

  return (
    <SheetComponent
      dataCfg={s2DataConfig}
      options={s2Options}
      sheetType="editable"
      onDataCellEditStart={onDataCellEditStart}
      onDataCellEditEnd={onDataCellEditEnd}
    />
  );
};
```
