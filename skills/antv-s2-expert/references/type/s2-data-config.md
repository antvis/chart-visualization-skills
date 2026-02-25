# S2DataConfig

Table data configuration.

```ts
const s2DataConfig = {
  data: [],
  meta: [],
  sortParams: [],
  fields: {
    rows: [],
    columns: [],
    values: []
  }
}
```

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| data | [RawData](#rawdata)[] | ✓ | | Raw data |
| fields | [Fields](#fields) | ✓ | | Dimension and measure field configuration |
| meta | [Meta](#meta)[] | | | Field metadata, configures field aliases and value formatting |
| sortParams | [SortParam](#sortparam)[] | | | Sort parameter configuration |
| filterParams | [FilterParam](#filterparam)[] | | | Filter parameter configuration |

## Fields

Configure the dimension fields of the table, corresponding to row and column dimensions.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| rows | `string[] \| CustomTreeNode[]` | | `[]` | Row dimensions (supports custom row headers) |
| columns | `string[] \| CustomTreeNode[]` | | `[]` | Column dimensions (supports custom column headers) |
| values | `string[]` | | `[]` | Measure/value dimensions |
| valueInCols | `boolean` | | | Whether measure dimensions are placed in column headers |
| customValueOrder | `number` | | - | Custom order of measure dimensions in row/column headers (i.e., order of `values`, starting from `0`) |

## Meta

Field metadata. Configures field aliases and value formatting.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| field | `string \| string[] \| RegExp` | | | Field ID (the field configured in [Fields](#fields)) |
| name | `string` | | | Field display name |
| description | `string` | | | Field description, displayed in the tooltip for row headers, column headers, and cells |
| formatter | `(value: unknown, data?: Data \| Data[], meta?: Node \| ViewMeta) => string` | | | Formatter. Cells, row headers and column headers support formatting (corner headers do not). Only cells have the second parameter. Numeric fields: typically used for formatting number units. Text fields: typically used for field enum value aliases |
| renderer | [Renderer](#renderer) | | | Cell rendering type (image, video, etc.) |

### Renderer

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| type | `"IMAGE" \| "VIDEO"` | ✓ | | Rendering type |
| clickToPreview | `boolean` | | `true` | Whether to enable click-to-preview. Effective for image and video types |
| prepareText | `(value: SimpleData) => Promise<string>` | | | Asynchronous text preprocessing before rendering |
| fallback | `string` | | | Fallback display when image/video fails to load |
| timeout | `number` | | `10000` | Image/video loading timeout in ms |
| config | `Partial<ImageStyleProps> \| Partial<HTMLVideoElement> \| HTMLStyleProps` | | | Image/video configuration |

## CustomTreeNode

Custom tree structure configuration, applicable to custom row/column headers for both pivot and detail tables.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| field | `string` | ✓ | | Unique identifier for the current node |
| title | `string` | ✓ | | Display name of the current node |
| collapsed | `boolean` | | `false` | Whether the node is collapsed (effective for non-leaf row header nodes in tree mode) |
| description | `string` | | | Extra description info for the node, displayed in the corresponding row header tooltip |
| children | [CustomTreeNode[]](#customtreenode) | | | Child nodes |

## FilterParam

Used for data filtering in **detail tables**.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| filterKey | `string` | ✓ | | Field ID to filter |
| filteredValues | `unknown[]` | | | Dimension values to exclude |
| customFilter | `(raw: Record<string, string>) => boolean` | | | Custom filter function. Final result must satisfy both customFilter AND not be in filteredValues |

## SortParam

Sort configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| sortFieldId | `string` | ✓ | - | Measure ID, the field to be sorted |
| sortMethod | `"ASC" \| "DESC" \| "asc" \| "desc"` | | - | Sort method |
| sortBy | `string[]` | | - | Custom sort list |
| sortByMeasure | `string` | | - | Sort by measure value (numeric) (pivot table only) |
| query | `Record<string, string>` | | - | Filter condition to narrow sorting scope, e.g., `{ city: 'Baishan' }` |
| type | `string` | | - | Group sort type for displaying icon (pivot table only) |
| sortFunc | `(params: SortFuncParam) => string[]` | | - | Custom sort function |
| nullsPlacement | `"first" \| "last" \| "auto"` | | `"last"` | Null value sort position |

### nullsPlacement

Null value (`null`, `undefined`, `'-'`, empty string) sort position configuration:

| Value | Description |
| --- | --- |
| `'first'` | Nulls always at the beginning |
| `'last'` | Nulls always at the end (**default**, industry best practice) |
| `'auto'` | Nulls at beginning for ascending, at end for descending |

> When a custom `sortFunc` is provided, sorting logic is fully managed by `sortFunc` and `nullsPlacement` is ignored.

### SortFuncParam

Custom sort function parameters.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| sortFieldId | `string` | ✓ | - | Measure ID, the field to be sorted |
| sortMethod | `"ASC" \| "DESC" \| "asc" \| "desc"` | | - | Sort method |
| sortBy | `string[]` | | - | Custom sort list |
| sortByMeasure | `string` | | - | Sort by measure value (pivot table only) |
| query | `Record<string, string>` | | - | Filter condition to narrow sorting scope |
| type | `string` | | - | Group sort type for displaying icon (pivot table only) |
| data | `Array<string \| Record<string, any>>` | | - | Current sorting data list |

## ViewMeta

Data cell data and position information.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| spreadsheet | `SpreadSheet` | | | Table instance |
| id | `string` | | | Cell unique identifier |
| x | `number` | | | Cell x coordinate |
| y | `number` | | | Cell y coordinate |
| width | `number` | | | Cell width |
| height | `number` | | | Cell height |
| data | [ViewMetaData](#viewmetadata) | | | Cell data |
| rowIndex | `number` | | | Cell index in row leaf nodes |
| colIndex | `number` | | | Cell index in column leaf nodes |
| valueField | `string` | | | Measure ID |
| fieldValue | [DataItem](#dataitem) | | | Actual displayed measure value |
| isTotals | `boolean` | | | Whether it is a total: true for grand total, false for subtotal |
| query | `Record<string, any>` | | | Row and column query conditions |
| rowQuery | `Record<string, any>` | | | Row query conditions |
| colQuery | `Record<string, any>` | | | Column query conditions |
| rowId | `string` | | | Cell row ID |
| colId | `string` | | | Cell column ID |

## Data Types

### RawData

```ts
type RawData = Record<string, DataItem>;
```

### SimpleData

```ts
type SimpleData = string | number | null | undefined;
```

### MultiData

Used to support multi-measure custom data cell rendering, e.g., strategy/trend analysis tables.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| values | [SimpleData](#simpledata)[][] | ✓ | | Formatted data, displayed directly in dataCfg |
| originalValues | [SimpleData](#simpledata)[][] | | | Original data, used for raw data export |
| label | `string` | | | Cell subtitle, displayed on a separate line |
| [key: string] | `unknown` | | | Other pass-through fields for custom cell rendering |

### DataItem

```ts
type DataItem = SimpleData | MultiData | MiniChartData | Record<string, unknown>;
```

### ExtraData

```ts
import type { EXTRA_FIELD, VALUE_FIELD } from '@antv/s2';

type ExtraData = {
  [EXTRA_FIELD]: string;
  [VALUE_FIELD]: string | DataItem;
};
```

### Data

```ts
type Data = RawData & ExtraData;
```

### ViewMetaData

```ts
type ViewMetaData = Data | CellData;
```
