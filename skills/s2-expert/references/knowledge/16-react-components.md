# React Advanced Analysis Components

These components are from `@antv/s2-react-components` and provide advanced analysis features for S2 tables.

```ts
import '@antv/s2-react-components/dist/s2-react-components.min.css';
```

## AdvancedSort

A sort dialog component that provides multi-rule sorting capabilities.

```tsx
import { AdvancedSort } from '@antv/s2-react-components';

<AdvancedSort sheetInstance={s2} />
```

### AdvancedSortProps

| Property | Description | Type | Required | Default |
|----------|-------------|------|----------|---------|
| sheetInstance | Table instance | `SpreadSheet` | ✓ | |
| className | CSS class name | `string` | | |
| icon | Sort button icon | `ReactNode` | | |
| text | Sort button text | `string` | | |
| ruleText | Rule description text | `string` | | |
| dimensions | Available field list | `Dimension[]` | | Defaults to rows + columns + values |
| ruleOptions | Rule configuration list | `RuleOption[]` | | Defaults to alphabetical, manual sort, other fields |
| sortParams | Default existing sort rules | `SortParams` | | |
| onSortOpen | Callback when sort dialog opens | `() => void` | | |
| onSortConfirm | Callback after closing dialog with sort result | `(ruleValues: RuleValue[], sortParams: SortParams) => void` | | |

### Dimension

| Property | Description | Type | Required |
|----------|-------------|------|----------|
| field | Dimension ID | `string` | ✓ |
| name | Dimension display name | `string` | ✓ |
| list | Dimension value list | `string[]` | ✓ |

### RuleValue

Sort result info returned in `onSortConfirm`:

| Property | Description | Type |
|----------|-------------|------|
| field | Dimension ID | `string` |
| name | Dimension name | `string` |
| sortMethod | Sort direction | `'ASC' \| 'DESC'` |
| sortBy | Custom sort list | `string[]` |
| sortByMeasure | Sort by measure field | `string` |

---

## DrillDown

Dimension drill-down component for pivot tables in tree mode.

**Prerequisites**: Pivot table (`sheetType="pivot"`) with tree hierarchy (`hierarchyType="tree"`).

```tsx
import { DrillDown } from '@antv/s2-react-components';

const s2Options = {
  width: 600,
  height: 480,
  hierarchyType: 'tree',
};

<SheetComponent
  sheetType="pivot"
  options={s2Options}
  partDrillDown={{
    render: (props) => <DrillDown {...props} />,
    drillConfig: { dataSet: [...] },
    fetchData: async (meta, drillFields) => {
      const data = await fetchDrillData(meta, drillFields);
      return { drillData: data, drillField: drillFields[0] };
    },
  }}
/>
```

### PartDrillDown

| Property | Description | Type | Required |
|----------|-------------|------|----------|
| drillConfig | Drill-down menu config | `DrillDownProps` | ✓ |
| drillItemsNum | Number of items to display after drill-down (-1 = all) | `number` | |
| fetchData | Callback after clicking drill-down | `(meta: Node, drillFields: string[]) => Promise<PartDrillDownInfo>` | ✓ |
| clearDrillDown | Clear drill-down info for specific rowId (or `{}` to clear all) | `{rowId: string}` | |
| displayCondition | Condition for showing drill-down icon | `(meta: Node, iconName: string) => boolean` | |

### DrillDownProps

| Property | Description | Type | Required |
|----------|-------------|------|----------|
| dataSet | Drill-down data source config | `DataSet[]` | ✓ |
| className | CSS class name | `string` | |
| title | Title | `ReactNode` | |
| searchText | Search box placeholder | `string` | |
| clearText | Reset button text | `ReactNode` | |
| disabledFields | Dimensions not allowed for drilling | `string[]` | |
| drillFields | Allowed drill dimensions | `string[]` | |
| extra | Custom node inserted between search box and menu | `ReactNode` | |

### DataSet

| Property | Description | Type | Required |
|----------|-------------|------|----------|
| name | Display name | `string` | ✓ |
| value | Value | `string` | ✓ |
| type | Dimension type (affects icon) | `'text' \| 'location' \| 'date'` | |
| disabled | Whether selection is disabled | `boolean` | |
| icon | List item icon | `ReactNode` | |

### PartDrillDownInfo (fetchData return)

| Property | Description | Type | Required |
|----------|-------------|------|----------|
| drillData | Drill-down data | `Record<string, string \| number>[]` | ✓ |
| drillField | Drill dimension value | `string` | ✓ |

---

## Export

Export component for copying and downloading table data.

```tsx
import { Export } from '@antv/s2-react-components';

<Export sheetInstance={s2} />
```

### ExportCfgProps

| Property | Description | Type | Default |
|----------|-------------|------|---------|
| sheetInstance | Table instance | `SpreadSheet` | |
| className | CSS class name | `string` | |
| icon | Display icon | `ReactNode` | |
| copyOriginalText | Copy original data button text | `string` | |
| copyFormatText | Copy formatted data button text | `string` | |
| downloadOriginalText | Download original data button text | `string` | |
| downloadFormatText | Download formatted data button text | `string` | |
| fileName | Custom download file name (CSV) | `string` | `'sheet'` |
| async | Async copy/export (default async) | `boolean` | `true` |
| dropdown | Dropdown config, passed to antd `Dropdown` | `DropdownProps` | |
| customCopyMethod | Custom copy processing logic | `(params: CopyAllDataParams) => Promise<string> \| string` | |
| onCopySuccess | Copy success callback | `(data) => void` | |
| onCopyError | Copy error callback | `(error) => void` | |
| onDownloadSuccess | Download success callback | `(data: string) => void` | |
| onDownloadError | Download error callback | `(error) => void` | |

---

## Switcher

Dimension switcher component for rearranging rows, columns, and values via drag-and-drop.

```tsx
import { Switcher } from '@antv/s2-react-components';

<Switcher
  rows={{ items: [{ id: 'province', displayName: 'Province' }] }}
  columns={{ items: [{ id: 'type', displayName: 'Type' }] }}
  values={{ items: [{ id: 'price', displayName: 'Price' }] }}
  onSubmit={(result) => {
    console.log('Switcher result:', result);
  }}
/>
```

### Switcher Props

| Property | Description | Type | Default |
|----------|-------------|------|---------|
| rows | Row header config | `SwitcherField` | |
| columns | Column header config | `SwitcherField` | |
| values | Values config | `SwitcherField` | |
| disabled | Whether disabled | `boolean` | `false` |
| title | Custom title | `ReactNode` | `'Row/Column Switch'` |
| icon | Custom icon | `ReactNode` | `<SwapOutlined />` |
| children | Custom trigger node | `ReactNode` | `<Button />` |
| contentTitleText | Popover title text | `string` | `'Row/Column Switch'` |
| resetText | Reset button text | `string` | `'Reset'` |
| allowExchangeHeader | Allow values to switch between row and column dimensions | `boolean` | `true` |
| onSubmit | Callback after closing with result | `(result: SwitcherResult) => void` | |
| popover | Popover config, passed to antd `Popover` | `PopoverProps` | |

### SwitcherField

| Property | Description | Type | Default | Required |
|----------|-------------|------|---------|----------|
| items | Field configuration objects | `SwitcherItem[]` | - | ✓ |
| expandable | Show expand/collapse checkbox for child items | `boolean` | `false` | |
| expandText | Expand checkbox text | `string` | `'Expand Children'` | |
| selectable | Show visibility checkbox for fields | `boolean` | `false` | |
| allowEmpty | Allow all items to be dragged out of this dimension | `boolean` | `true` | |

### SwitcherItem

| Property | Description | Type | Required |
|----------|-------------|------|----------|
| id | Field ID | `string` | ✓ |
| displayName | Display name (falls back to id) | `string` | |
| checked | Whether field is visible | `boolean` | |
| children | Child items (e.g., YoY/MoM) | `SwitcherItem[]` | |

### SwitcherResult

| Property | Description | Type |
|----------|-------------|------|
| rows | All row field operation results | `SwitcherResultItem` |
| columns | All column field operation results | `SwitcherResultItem` |
| values | All value field operation results | `SwitcherResultItem` |

### SwitcherResultItem

| Property | Description | Type |
|----------|-------------|------|
| items | All fields flattened, ordered by drag result | `SwitcherItem[]` |
| hideItems | All hidden fields flattened, ordered by drag result | `SwitcherItem[]` |
