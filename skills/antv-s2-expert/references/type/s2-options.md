# S2Options

Spreadsheet configuration options.

```ts
const s2Options = {
  width: 600,
  height: 400,
  hierarchyType: 'grid'
}
```

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| width | `number` | | `600` | Table width |
| height | `number` | | `480` | Table height |
| debug | `boolean` | | `false` | Whether to enable debug mode |
| hierarchyType | `"grid" \| "tree" \| "grid-tree"` | | `grid` | Row header display mode. `grid`: flat grid layout, `tree`: tree structure, `grid-tree`: tree + flat layout (flat layout with expand/collapse) |
| conditions | [Conditions](#conditions) | | | Field marking / conditional formatting configuration |
| totals | [Totals](#totals) | | | Subtotal and grand total configuration |
| tooltip | [Tooltip](#tooltip) | | | Tooltip configuration |
| interaction | [Interaction](#interaction) | | | Table interaction configuration |
| pagination | [Pagination](#pagination) | | | Pagination configuration |
| frozen | [Frozen](#frozen) | | | Row/column header freeze configuration |
| seriesNumber | [SeriesNumber](#seriesnumber) | | | Series number column display and custom text configuration |
| showDefaultHeaderActionIcon | `boolean` | | `true` | Whether to show default row/column header action icons |
| headerActionIcons | [HeaderActionIcon](#headeractionicon)[] | | `false` | Custom row/column header action icons (requires `showDefaultHeaderActionIcon` set to `false`) |
| customSVGIcons | [CustomSVGIcon](#customsvgicon)[] | | `false` | Custom SVG icons |
| style | [Style](#style) | | | Cell style settings, such as layout type, width/height, margins, whether to hide value column headers, etc. |
| hd | `boolean` | | `true` | Whether to enable HD screen adaptation, resolves blurry font rendering on multi-screen switching and retina displays |
| mergedCellsInfo | [MergedCellInfo](#mergedcellinfo)[][] | | | Merged cell information |
| placeholder | [Placeholder](#placeholder) | | | Custom empty data placeholder configuration |
| cornerText | `string` | | | Custom corner header text (only effective in tree mode) |
| cornerExtraFieldText | `string` | | `"Values"` | Custom corner header virtual value field text (effective when "values on row header") |
| dataCell | [DataCellCallback](#datacellcallback) | | | Custom data cell |
| cornerCell | [CellCallback](#cellcallback) | | | Custom corner cell |
| seriesNumberCell | [CellCallback](#cellcallback) | | | Custom series number cell |
| rowCell | [CellCallback](#cellcallback) | | | Custom row header cell |
| colCell | [CellCallback](#cellcallback) | | | Custom column header cell |
| mergedCell | [MergedCellCallback](#mergedcellcallback) | | | Custom merged cell |
| frame | [FrameCallback](#framecallback) | | | Custom table frame/border |
| cornerHeader | [CornerHeaderCallback](#cornerheadercallback) | | | Custom corner header |
| layoutHierarchy | [LayoutHierarchy](#layouthierarchy) | | | Custom hierarchy structure |
| layoutArrange | [LayoutArrange](#layoutarrange) | | | Custom arrangement order (effective in tree mode) |
| layoutCoordinate | [layoutCoordinate](#layoutcoordinate) | | | Custom cell node coordinates |
| layoutCellMeta | [layoutCellMeta](#layoutcellmeta) | | | Custom cell metadata |
| layoutSeriesNumberNodes | [LayoutSeriesNumberNodes](#layoutseriesnumbernodes) | | | Custom series number nodes |
| dataSet | [DataSet](#dataset) | | | Custom dataset |
| facet | `(spreadsheet: SpreadSheet) => BaseFacet` | | | Custom facet |
| device | `"pc" \| "mobile"` | | | Device type |
| transformCanvasConfig | `(renderer: Renderer, spreadsheet: SpreadSheet) => Partial<CanvasConfig> \| void` | | | Custom AntV/G rendering engine configuration and plugin registration |
| rendererConfig | `Partial<RendererConfig>` | | | Custom AntV/G rendering engine configuration |
| future | [Future](#future) | | | Enable experimental features (currently unstable, may change in future) |

## Conditions

Configure field marking. Supports text, background, interval (bar chart), and icon types.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| text | [TextCondition](#textcondition)[] | | - | Text field marking |
| background | [BackgroundCondition](#backgroundcondition)[] | | - | Background field marking |
| interval | [IntervalCondition](#intervalcondition)[] | | - | Bar chart field marking |
| icon | [IconCondition](#iconcondition)[] | | - | Icon field marking |

### Condition

Base condition format. TextCondition, BackgroundCondition, IntervalCondition, IconCondition all inherit from Condition.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| field | `string \| RegExp` | ✓ | | Field ID, or a regex to match field IDs |
| mapping | [ConditionMapping](#conditionmapping) | ✓ | | Mapping function |

#### ConditionMapping

Field marking processing function.

```ts
type ConditionMapping<T = unknown> = (
  fieldValue: number | string,
  data: RawData,
  cell: S2CellType,
) => ConditionMappingResult<T>;
```

### TextCondition

Same as [Condition](#condition). `ConditionMappingResult` is consistent with [TextTheme](/api/general/s2-theme#texttheme), meaning you can control text color, opacity, alignment, font, etc.

```ts
type TextConditionMappingResult = TextTheme;
```

### BackgroundCondition

Same as [Condition](#condition). `ConditionMappingResult`:

```ts
type BackgroundConditionMappingResult = {
  fill: string;
  intelligentReverseTextColor?: boolean;
};
```

### IntervalCondition

Same as [Condition](#condition). `ConditionMappingResult`:

```ts
type IntervalConditionMappingResult = {
  fill?: string;
  isCompare?: boolean;
  minValue?: number;
  maxValue?: number;
};
```

### IconCondition

Icon condition format. The only difference from other [Condition](#condition) types is the additional `position` parameter for customizing icon position relative to text.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| position | `"left" \| "right"` | | `right` | Icon position relative to text |

```ts
type IconConditionMappingResult = {
  fill: string;
  icon: string;
};
```

## SeriesNumber

Series number column configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| enable | `boolean` | | `false` | Whether to show row series numbers |
| text | `string` | | - | Custom row header series number column title |

## Frozen

Row/column header freeze configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| rowHeader | `boolean \| number` | | `true` | Freeze row header. When number, indicates the max frozen area ratio (0, 1), 0 = no freeze. When boolean, true = 0.5, false = 0. (Pivot table only) |
| rowCount | `number` | | `0` | Number of frozen rows from top, counted by leaf nodes |
| colCount | `number` | | `0` | Number of frozen columns from left, counted by leaf nodes |
| trailingRowCount | `number` | | `0` | Number of frozen rows from bottom, counted by leaf nodes |
| trailingColCount | `number` | | `0` | Number of frozen columns from right, counted by leaf nodes |

## Interaction

Interaction configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| linkFields | `string[] \| (meta: Node \| ViewMeta) => boolean` | | | Mark fields as link style for external link navigation |
| selectedCellsSpotlight | `boolean` | | `false` | Whether to enable selected cell spotlight highlight effect |
| hoverHighlight | `boolean` | | `true` | Highlight current cell and its corresponding row/column headers on hover |
| hoverFocus | `boolean \| {duration: number}` | | `true` | After hovering on a cell for 800ms (default), keep highlight and show tooltip. Control hover duration via `duration` |
| hiddenColumnFields | `string[]` | | | Configure default hidden columns. For pivot tables and multi-column detail tables, use column header unique id; for single-column detail tables, use field name |
| copy | [Copy](#copy) | | | Cell copy configuration |
| customInteractions | [CustomInteraction[]](#custominteraction) | | | Custom interactions |
| scrollSpeedRatio | [ScrollSpeedRatio](#scrollspeedratio) | | | Scroll speed ratio for horizontal and vertical directions, default is 1 |
| autoResetSheetStyle | `boolean \| (event: Event \| FederatedPointerEvent, spreadsheet: SpreadSheet) => boolean` | | `true` | Whether to reset interaction state and close Tooltip when clicking outside the table or pressing `ESC` |
| resize | `boolean \| ResizeInteractionOptions` | | `true` | Control whether resize hot areas are displayed |
| brushSelection | `boolean \| BrushSelection` | | `true` | Whether to allow cell brush selection (including row header, column header, data cells). Row/column header brush selection only supports pivot tables |
| multiSelection | `boolean` | | `true` | Whether to allow multi-selection (including row header, column header, data cells) |
| rangeSelection | `boolean` | | `true` | Whether to allow range shortcut multi-selection |
| scrollbarPosition | `"content" \| "canvas"` | | `content` | Control whether scrollbar displays at content edge or canvas edge |
| eventListenerOptions | `false` | | | Options for `addEventListener`, can control whether events trigger during bubble or capture phase |
| selectedCellHighlight | `boolean \| { rowHeader?: boolean, colHeader?: boolean, currentRow?: boolean, currentCol?: boolean }` | | `false` | Row/column highlight linkage after selecting data cells |
| overscrollBehavior | `"auto" \| "contain" \| "none" \| null` | | `auto` | Control behavior when scrolling to boundary, can disable browser default scroll behavior |

### Copy

Cell copy configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| enable | `boolean` | | `true` | Whether to allow copying |
| withFormat | `boolean` | | `true` | Whether to use `formatter` from s2DataConfig Meta when copying data |
| withHeader | `boolean` | | `false` | Whether to include header information when copying data |
| customTransformer | `(transformer: Transformer) => Partial<Transformer>` | | | Custom data format transformer for copying |

### CustomInteraction

Custom interaction, inherits BaseEvent.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| key | `string` | ✓ | | Unique identifier for the interaction |
| interaction | `InteractionConstructor` | ✓ | | Interaction instance |

### ScrollSpeedRatio

```ts
interface ScrollSpeedRatio {
  horizontal?: number; // Horizontal scroll speed ratio, default 1
  vertical?: number;   // Vertical scroll speed ratio, default 1
}
```

### ResizeInteractionOptions

Width/height adjustment configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| rowCellVertical | `boolean` | | `true` | Enable row header vertical resize hot area |
| cornerCellHorizontal | `boolean` | | `true` | Enable corner header horizontal resize hot area |
| colCellHorizontal | `boolean` | | `true` | Enable column header horizontal resize hot area |
| colCellVertical | `boolean` | | `true` | Enable column header vertical resize hot area (ineffective when column header is hidden) |
| rowResizeType | `"all" \| "current" \| "selected"` | | `current` | Row height resize scope. `all`: apply to all cells, `current`: apply to current cell, `selected`: apply to all selected cells |
| colResizeType | `"all" \| "current" \| "selected"` | | `current` | Column width resize scope. `all`: apply to all cells, `current`: apply to current cell, `selected`: apply to all selected cells |
| disable | `(resizeInfo: S2CellType) => boolean` | | | Control whether row height resize takes effect |
| visible | `(cell: S2CellType) => boolean` | | | Custom control whether current cell shows resize hot area |
| minCellWidth | `number` | | `40` | Minimum cell width when dragging |
| minCellHeight | `number` | | `20` | Minimum cell height when dragging |

### BrushSelection

Cell brush selection configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| dataCell | `boolean` | | `true` | Whether to allow data cell brush selection |
| rowCell | `boolean` | | `false` | Whether to allow row header cell brush selection (pivot table only) |
| colCell | `boolean` | | `false` | Whether to allow column header cell brush selection |

## Totals

Row/column subtotal and grand total configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| row | [Total](#total) | | | Row total configuration (ineffective with custom row headers) |
| col | [Total](#total) | | | Column total configuration (ineffective with custom column headers) |

### Total

Subtotal and grand total configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| showGrandTotals | `boolean` | | `false` | Whether to show grand totals |
| showSubTotals | `boolean \| { always: boolean }` | | `false` | Whether to show subtotals. As object, `always` controls whether subtotals display when child dimensions < 2 |
| subTotalsDimensions | `string[]` | | `[]` | Subtotal aggregation dimensions |
| reverseGrandTotalsLayout | `boolean` | | `false` | Grand total layout position, default bottom or right |
| reverseSubTotalsLayout | `boolean` | | `false` | Subtotal layout position, default bottom or right |
| grandTotalsLabel | `string` | | `"Grand Total"` | Grand total alias |
| subTotalsLabel | `string` | | `"Subtotal"` | Subtotal alias |
| calcGrandTotals | [CalcTotals](#calctotals) | | | Custom grand total calculation |
| calcSubTotals | [CalcTotals](#calctotals) | | | Custom subtotal calculation |
| grandTotalsGroupDimensions | `string[]` | | | Grand total group dimensions |
| subTotalsGroupDimensions | `string[]` | | | Subtotal group dimensions |

### CalcTotals

Subtotal/grand total calculation method configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| aggregation | `SUM \| MIN \| MAX \| AVG \| COUNT` | | | Aggregation method |
| calcFunc | `(query: Record<string, any>, data: Record<string, any>[], spreadsheet: SpreadSheet) => number` | | | Custom calculation function |

## Tooltip

Tooltip configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| enable | `boolean` | | `true` | Whether to show tooltip |
| operation | [TooltipOperation](#tooltipoperation) | | | Tooltip operation configuration |
| rowCell | [BaseTooltipConfig](#basetooltipconfig) | | | Row header cell tooltip configuration |
| colCell | [BaseTooltipConfig](#basetooltipconfig) | | | Column header cell tooltip configuration |
| dataCell | [BaseTooltipConfig](#basetooltipconfig) | | | Data cell tooltip configuration |
| cornerCell | [BaseTooltipConfig](#basetooltipconfig) | | | Corner cell tooltip configuration |
| render | [RenderTooltip](#rendertooltip) | | | Custom entire tooltip, can inherit BaseTooltip and override methods |
| content | `ReactNode \| Element \| string` or `(cell, defaultTooltipShowOptions) => ReactNode \| Element \| string` | | | Custom tooltip content |
| autoAdjustBoundary | `"container" \| "body"` | | `body` | Auto adjust tooltip position when exceeding boundary. `container`: chart area, `body`: browser window. Set `null` to disable |
| adjustPosition | `(positionInfo: TooltipPositionInfo) => {x: number, y: number}` | | | Custom tooltip position |
| getContainer | `() => HTMLElement` | | `document.body` | Custom tooltip mount container |
| className | `string` | | | Additional container class name |
| style | `CSSProperties` | | | Additional container style |

### BaseTooltipConfig

Tooltip basic common configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| enable | `boolean` | | `true` | Whether to show tooltip |
| operation | [TooltipOperation](#tooltipoperation) | | | Tooltip operation configuration |
| content | `ReactNode \| Element \| string` or `(cell, defaultTooltipShowOptions) => ReactNode \| Element \| string` | | | Custom tooltip content |

### TooltipOperation

Tooltip operation configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| hiddenColumns | `boolean` | | `true` | Whether to enable hide columns (effective for leaf nodes) |
| sort | `boolean` | | `false` | Whether to enable group sorting |
| tableSort | `boolean` | | `false` | Whether to enable detail table column header sorting |
| menu | [TooltipOperatorMenuOptions](#tooltipoperatormenuoptions) | | | Custom operation menu configuration |

### TooltipOperatorMenuOptions

Tooltip operation menu configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| items | [TooltipOperatorMenuItem[]](#tooltipoperatormenuitem) | | | Operation item list |
| onClick | `(info: TooltipOperatorMenuInfo, cell: S2CellType) => void` | | | Click event |
| selectedKeys | `string[]` | | | Initially selected menu item keys |

### TooltipOperatorMenuItem

Tooltip operation item.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| key | `string` | ✓ | | Unique identifier |
| label | `ReactNode \| string` | | | Name |
| icon | `ReactNode \| Element \| string` | | | Custom icon |
| visible | `boolean \| (cell: S2CellType) => boolean` | | `true` | Whether the item is visible, can pass a function for dynamic control |
| onClick | `(info: { key: string, [key: string]: unknown }, cell: S2CellType) => void` | | | Click event callback |
| children | [TooltipOperatorMenuItem[]](#tooltipoperatormenuitem) | | | Sub-menu items |

## Pagination

Pagination configuration. S2 provides built-in frontend pagination rendering but does not include a pagination component — you need to implement that yourself.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| pageSize | `number` | ✓ | | Number of items per page |
| current | `number` | ✓ | `1` | Current page (starts from 1) |
| total | `number` | | | Total number of data items |

## Style

Style settings.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| layoutWidthType | `"adaptive" \| "colAdaptive" \| "compact"` | | | Cell width layout type. `adaptive`: rows and columns share equal width across the canvas. `colAdaptive`: columns share equal width of remaining space after row headers. `compact`: compact layout, column width equals actual content width (samples first 50 rows per column) |
| compactExtraWidth | `number` | | `0` | Extra width in compact mode, added on top of the calculated compact width |
| compactMinWidth | `number` | | `0` | Minimum cell width in compact mode |
| dataCell | [DataCellStyle](#datacellstyle) | | | Data cell style configuration |
| rowCell | [RowCellStyle](#rowcellstyle) | | | Row header cell style configuration |
| colCell | [ColCellStyle](#colcellstyle) | | | Column header cell style configuration |
| cornerCell | [CornerCellStyle](#cornercellstyle) | | | Corner cell style configuration |
| mergedCell | [MergedCellStyle](#mergedcellstyle) | | | Merged cell style configuration |
| seriesNumberCell | [SeriesNumberCellStyle](#seriesnumbercellstyle) | | | Series number cell style configuration |

### DataCellStyle

Data cell configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| width | `number` | | `96` | Cell width (priority: `colCell.widthByField > colCell.width > dataCell.width`) |
| height | `number` | | `30` | Cell height (priority: `rowCell.heightByField > rowCell.height > dataCell.height`) |
| valuesCfg | `{ originalValueField?: string, widthPercent?: number[], showOriginalValue?: boolean }` | | | Cell value configuration |

Also supports [CellTextWordWrapStyle](#celltextwordwrapstyle).

### ColCellStyle

Column header cell configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| width | `number \| (colNode: Node) => number` | | `96` | Cell width, can be set dynamically based on current column header node (effective for leaf nodes) |
| height | `number \| (colNode: Node) => number` | | `30` | Cell height, can be set dynamically based on current column header node (effective for leaf nodes) |
| widthByField | `Record<string, number>` | | | Set width by field (for drag or preset width scenarios). Priority is higher than `width` |
| heightByField | `Record<string, number>` | | | Set height by field (for drag or preset height scenarios). Priority is higher than `height` |
| hideValue | `boolean` | | `false` | When values are on column headers, hide the value row to make it cleaner (effective only with single value) |

### RowCellStyle

Row header cell configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| width | `number \| (rowNode: Node) => number` | | | Row cell width, can be set dynamically per row node. Also applies to tree mode |
| treeWidth | `number` | | | Row cell width in tree mode. Higher priority than `width`; falls back to `width` when empty |
| height | `number \| (rowNode: Node) => number` | | `30` | Row cell height, can be set dynamically per row node |
| collapseFields | `Record<string, boolean>` | | | Custom collapse nodes in tree mode. Supports id (`'root[&] rowDimensionValue'`) and dimension field (`'city'`) formats. Priority higher than `collapseAll` and `expandDepth` |
| collapseAll | `boolean` | | `false` | Whether to collapse all row headers by default in tree mode |
| expandDepth | `number` | | | Default expand depth in tree mode (depth starts from 0). Set to `null` for lowest priority |
| showTreeLeafNodeAlignDot | `boolean` | | `false` | Whether to show level alignment dots for leaf nodes in tree mode |
| widthByField | `Record<string, number>` | | | Set width by field. Priority higher than `width` |
| heightByField | `Record<string, number>` | | | Set height by field. For pivot tables: field corresponds to `s2DataConfig.fields.rows`. For detail tables: field corresponds to row number (starting from 1). Priority higher than `height` |

### CellTextWordWrapStyle

Cell text word wrap configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| wordWrap | `boolean` | | `true` | Whether text wraps automatically (not recommended for data cells) |
| maxLines | `number` | | `1` | Maximum number of lines. Text beyond this is truncated. When manually dragging to resize or using custom cell height, max lines is recalculated based on line height. Supports `Infinity`. Must be used with `wordWrap` and `textOverflow` |
| textOverflow | `string` | | `ellipsis` | Custom overflow content display (e.g., ellipsis or custom string). Must be used with `wordWrap` and `maxLines` |

## DataCellCallback

```ts
DataCellCallback = (viewMeta: ViewMeta, s2: Spreadsheet) => G.Group;
```

Custom data cell.

## CellCallback

```ts
CellCallback = (node: Node, spreadsheet: SpreadSheet, ...restOptions: unknown[]) => G.Group;
```

Custom cell.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| node | Node | ✓ | - | Current rendering node |
| spreadsheet | SpreadSheet | ✓ | - | Table instance |
| restOptions | `unknown[]` | | - | Additional parameters |

## MergedCellCallback

```ts
MergedCellCallback = (s2: Spreadsheet, cells: S2CellType[], viewMeta: ViewMeta) => MergedCell;
```

Custom merged cell.

## CornerHeaderCallback

```ts
CornerHeaderCallback = (parent: S2CellType, spreadsheet: SpreadSheet, ...restOptions: unknown[]) => void;
```

Custom corner header.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| parent | S2CellType | ✓ | - | Parent cell |
| spreadsheet | SpreadSheet | ✓ | - | Table instance |
| restOptions | `unknown[]` | | - | Additional parameters |

## HeaderActionIconProps

Information returned when clicking a custom action icon.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| iconName | `string` | ✓ | - | Name of the currently clicked icon |
| meta | `Node` | ✓ | - | Meta information of the current cell |
| event | `Event` | ✓ | - | Current click event |

## LayoutResult

Basic data format for layout results.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| colNodes | `Node[]` | | | Column header nodes, corresponding to ColCell (including those outside visible range) |
| colLeafNodes | `Node[]` | | | Column header leaf nodes (including those outside visible range) |
| colsHierarchy | `Hierarchy` | | | Column header node hierarchy structure (including those outside visible range) |
| rowNodes | `Node[]` | | | Row header nodes, corresponding to RowCell (including those outside visible range) |
| rowLeafNodes | `Node[]` | | | Row header leaf nodes (including those outside visible range) |
| rowsHierarchy | `Hierarchy` | ✓ | | Row header node hierarchy structure (including those outside visible range) |
| seriesNumberNodes | `Node[]` | | | Series number nodes, corresponding to SeriesNumberCell (including those outside visible range) |
| cornerNodes | `Node[]` | | | Corner header nodes, corresponding to CornerCell (including those outside visible range) |

## DataSet

Custom dataset.

```ts
DataSet = (spreadsheet: SpreadSheet) => BaseDataSet;
```

## Placeholder

Custom empty data placeholder configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| cell | `((meta: Record<string, any>) => string \| undefined \| null) \| string \| null` | | `'-'` | Empty value cell placeholder |
| empty | [EmptyPlaceholder](#emptyplaceholder) | | | Empty data placeholder (detail table only) |

### EmptyPlaceholder

Empty data placeholder configuration (detail table only).

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| icon | `string` | | `"Empty"` | Custom icon, supports customSVGIcons registered and built-in icons |
| description | `string` | | `"No data"` | Custom description content |

## Future

Enable experimental features.

> **Warning:** These features are currently unstable and may change in the future.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| experimentalReuseCell | `boolean` | | `false` | Whether to reuse cells for performance improvement |

## MergedCellInfo

Set default merged cell information.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| colIndex | `number` | | - | Column index of the cell |
| rowIndex | `number` | | - | Row index of the cell |
| showText | `boolean` | | - | When set to `true`, displays current cell's meta as the merged cell's meta. Defaults to the first selected/clicked cell |
