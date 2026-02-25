# SheetComponent

## React SheetComponent (`@antv/s2-react`)

Out-of-the-box React component `<SheetComponent />` based on `@antv/s2`.

```tsx
import { SheetComponent } from '@antv/s2-react';
import '@antv/s2-react/dist/s2-react.min.css';

<SheetComponent sheetType="pivot" />
```

### SpreadsheetProps

React SheetComponent props.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| sheetType | `"pivot" \| "table" \| "gridAnalysis" \| "strategy" \| "editable"` | | `pivot` | Table type: 1. `pivot`: Pivot table 2. `table`: Detail table 3. `gridAnalysis`: Grid analysis table 4. `strategy`: Trend analysis table 5. `editable`: Editable table |
| spreadsheet | `(container: HTMLElement \| string, dataCfg: S2DataConfig, options: SheetComponentOptions) => SpreadSheet` | | | Custom spreadsheet constructor |
| dataCfg | [S2DataConfig](/api/general/s2-data-config) | ✓ | | Data configuration |
| options | [SheetComponentOptions](#sheetcomponentoptions) | ✓ | | Table options configuration |
| partDrillDown | [PartDrillDown](/api/components/drill-down) | | | Dimension drill-down properties |
| adaptive | `boolean \| { width?: boolean, height?: boolean, getContainer: () => HTMLElement }` | | `false` | Whether to auto-adapt to window size |
| themeCfg | [ThemeCfg](/api/general/s2-theme) | | | Custom table theme style |
| loading | `boolean` | | | Control table loading state |
| onMounted | `(spreadsheet: SpreadSheet) => void` | | | Table mounted event, provides the table instance |
| onUpdate | `(renderOptions: S2RenderOptions) => S2RenderOptions \| void` | | | Table update event when data or options change. Allows manual control of render mode |
| onUpdateAfterRender | `(renderOptions: S2RenderOptions) => void` | | | Table update event triggered after re-render (`s2.render()`) completes |
| onLoading | `(loading: boolean) => void` | | | Loading state change event |
| onDestroy | `() => void` | | | Table destroy event |
| onBeforeRender | `() => void` | | | Event before render starts |
| onAfterRender | `() => void` | | | Event after render completes |

#### Row Header Cell Events

| Property | Type | Description |
| --- | --- | --- |
| onRowCellHover | `(data: TargetCellInfo) => void` | Row header mouse hover |
| onRowCellClick | `(data: TargetCellInfo) => void` | Row header mouse click |
| onRowCellDoubleClick | `(data: TargetCellInfo) => void` | Row header mouse double click |
| onRowCellContextMenu | `(data: TargetCellInfo) => void` | Row header right-click menu |
| onRowCellMouseDown | `(data: TargetCellInfo) => void` | Row header mouse down |
| onRowCellMouseUp | `(data: TargetCellInfo) => void` | Row header mouse up |
| onRowCellMouseMove | `(data: TargetCellInfo) => void` | Row header mouse move |
| onRowCellCollapsed | `({ isCollapsed: boolean, collapseFields: Record<string, boolean>, node: Node }) => void` | Node expand/collapse callback |
| onRowCellAllCollapsed | `(isCollapsed: boolean) => void` | All nodes expand/collapse callback |
| onRowCellScroll | `({ position: CellScrollPosition }) => void` | Row header cell scroll |
| onRowCellRender | `(cell: Cell) => void` | Row header cell render complete |
| onRowCellSelected | `(cells: Cell[], detail: CellSelectedDetail) => void` | Row header cell selected |
| onRowCellBrushSelection | `(cells: RowCell[]) => void` | Row header brush selection (pivot table only) |

#### Column Header Cell Events

| Property | Type | Description |
| --- | --- | --- |
| onColCellHover | `(data: TargetCellInfo) => void` | Column header mouse hover |
| onColCellClick | `(data: TargetCellInfo) => void` | Column header mouse click |
| onColCellDoubleClick | `(data: TargetCellInfo) => void` | Column header mouse double click |
| onColCellContextMenu | `(data: TargetCellInfo) => void` | Column header right-click menu |
| onColCellMouseDown | `(data: TargetCellInfo) => void` | Column header mouse down |
| onColCellMouseUp | `(data: TargetCellInfo) => void` | Column header mouse up |
| onColCellMouseMove | `(data: TargetCellInfo) => void` | Column header mouse move |
| onColCellExpanded | `(expandedNode: Node) => void` | Column header expanded callback (when `tooltip.operation.hiddenColumns = true`) |
| onColCellHidden | `(data: { currentHiddenColumnsInfo: HiddenColumnsInfo, hiddenColumnsDetail: HiddenColumnsInfo[] }) => void` | Column header hidden callback |
| onColCellRender | `(cell: Cell) => void` | Column header cell render complete |
| onColCellSelected | `(cells: Cell[], detail: CellSelectedDetail) => void` | Column header cell selected |
| onColCellBrushSelection | `(cells: ColCell[]) => void` | Column header brush selection |

#### Data Cell Events

| Property | Type | Description |
| --- | --- | --- |
| onDataCellHover | `(data: TargetCellInfo) => void` | Data cell mouse hover |
| onDataCellClick | `(data: TargetCellInfo) => void` | Data cell mouse click |
| onDataCellDoubleClick | `(data: TargetCellInfo) => void` | Data cell double click |
| onDataCellContextMenu | `(data: TargetCellInfo) => void` | Data cell right-click menu |
| onDataCellMouseDown | `(data: TargetCellInfo) => void` | Data cell mouse down |
| onDataCellMouseUp | `(data: TargetCellInfo) => void` | Data cell mouse up |
| onDataCellMouseMove | `(data: TargetCellInfo) => void` | Data cell mouse move |
| onDataCellBrushSelection | `(dataCells: DataCell[]) => void` | Data cell brush selection |
| onDataCellSelectMove | `(metas: CellMeta[]) => void` | Data cell keyboard arrow key move |
| onDataCellEditStart | `(meta: ViewMeta, cell: S2CellType) => void` | Data cell edit start (editable table only) |
| onDataCellEditEnd | `(meta: ViewMeta, cell: S2CellType) => void` | Data cell edit end (editable table only) |
| onDataCellRender | `(cell: Cell) => void` | Data cell render complete |
| onDataCellSelected | `(cells: Cell[], detail: CellSelectedDetail) => void` | Data cell selected |

#### Corner Header Cell Events

| Property | Type | Description |
| --- | --- | --- |
| onCornerCellHover | `(data: TargetCellInfo) => void` | Corner cell mouse hover |
| onCornerCellClick | `(data: TargetCellInfo) => void` | Corner cell mouse click |
| onCornerCellDoubleClick | `(data: TargetCellInfo) => void` | Corner cell mouse double click |
| onCornerCellContextMenu | `(data: TargetCellInfo) => void` | Corner cell right-click menu |
| onCornerCellMouseUp | `(data: TargetCellInfo) => void` | Corner cell mouse up |
| onCornerCellMouseMove | `(data: TargetCellInfo) => void` | Corner cell mouse move |
| onCornerCellRender | `(cell: Cell) => void` | Corner cell render complete |
| onCornerCellSelected | `(cells: Cell[], detail: CellSelectedDetail) => void` | Corner cell selected |

#### Merged Cell Events

| Property | Type | Description |
| --- | --- | --- |
| onMergedCellsHover | `(data: TargetCellInfo) => void` | Merged cell mouse hover |
| onMergedCellsClick | `(data: TargetCellInfo) => void` | Merged cell mouse click |
| onMergedCellsDoubleClick | `(data: TargetCellInfo) => void` | Merged cell mouse double click |
| onMergedCellsContextMenu | `(data: TargetCellInfo) => void` | Merged cell right-click menu |
| onMergedCellsMouseDown | `(data: TargetCellInfo) => void` | Merged cell mouse down |
| onMergedCellsMouseUp | `(data: TargetCellInfo) => void` | Merged cell mouse up |
| onMergedCellsMouseMove | `(data: TargetCellInfo) => void` | Merged cell mouse move |
| onMergedCellsRender | `(cell: Cell) => void` | Merged cell render complete |
| onSeriesNumberCellRender | `(cell: Cell) => void` | Series number cell render complete |

#### Layout Events

| Property | Type | Description |
| --- | --- | --- |
| onLayoutCellRender | `(cell: S2CellType) => void` | Individual cell layout render complete |
| onLayoutAfterHeaderLayout | `(layoutResult: LayoutResult) => void` | Header layout structure ready |
| onLayoutPagination | `({ pageSize: number, pageCount: number, total: number, current: number }) => void` | Pagination event |
| onLayoutAfterCollapseRows | `({ collapseFields: Record<string, boolean>, meta: Node }) => void` | Callback after collapsing rows in tree mode |

#### Resize Events

| Property | Type | Description |
| --- | --- | --- |
| onLayoutResize | `(params: ResizeParams) => void` | Table overall resize event |
| onLayoutResizeSeriesWidth | `(params: ResizeParams) => void` | Series number column width event |
| onLayoutResizeRowWidth | `(params: ResizeParams) => void` | Row header cell width change |
| onLayoutResizeRowHeight | `(params: ResizeParams) => void` | Row header cell height change |
| onLayoutResizeColWidth | `(params: ResizeParams) => void` | Column header cell width change |
| onLayoutResizeColHeight | `(params: ResizeParams) => void` | Column header cell height change |
| onLayoutResizeTreeWidth | `(params: ResizeParams) => void` | Tree row header overall width change |
| onLayoutResizeMouseDown | `(event: MouseEvent, resizeInfo?: ResizeInfo) => void` | Resize hot area mouse down |
| onLayoutResizeMouseUp | `(event: MouseEvent, resizeInfo?: ResizeInfo) => void` | Resize hot area mouse up |
| onLayoutResizeMouseMove | `(event: MouseEvent, resizeInfo?: ResizeInfo) => void` | Resize hot area mouse move |

#### Global Events

| Property | Type | Description |
| --- | --- | --- |
| onKeyBoardDown | `(event: KeyboardEvent) => void` | Keyboard down event |
| onKeyBoardUp | `(event: KeyboardEvent) => void` | Keyboard up event |
| onCopied | `(data: CopyableList) => void` | Copy event |
| onActionIconHover | `(event: FederatedPointerEvent) => void` | Action icon hover event |
| onActionIconClick | `(event: FederatedPointerEvent) => void` | Action icon click event |
| onContextMenu | `(event: FederatedPointerEvent) => void` | Right-click cell event |
| onMouseHover | `(event: FederatedPointerEvent) => void` | Table mouse hover event |
| onMouseUp | `(event: FederatedPointerEvent) => void` | Table mouse up event |
| onSelected | `(cells: Cell[], detail: CellSelectedDetail) => void` | Cell selected event |
| onReset | `(event: KeyboardEvent) => void` | Interaction state reset event |
| onLinkFieldJump | `(data: { field: string, meta: Node \| ViewMeta, record: Data }) => void` | Link field jump event |
| onScroll | `({ position: CellScrollPosition }) => void` | Cell scroll event (includes row header and data cells) |

#### Sort & Filter Events

| Property | Type | Description |
| --- | --- | --- |
| onRangeSort | `(params: SortParam[]) => void` | Group sort trigger callback (pivot table only) |
| onRangeSorted | `(event: FederatedPointerEvent) => void` | Group sort completed callback (pivot table only) |
| onRangeFilter | `(data: { filterKey: string, filteredValues: string[] }) => void` | Filter trigger callback |
| onRangeFiltered | `(data: DataType[]) => void` | Filter completed callback |

### SheetComponentOptions

> `@antv/s2-react` component `options` inherits from [S2Options](/api/general/s2-options) with two differences:
> - Type changed from `S2Options` to `SheetComponentOptions`
> - Tooltip `content` changed from `Element | string` to `ReactNode` (any JSX element)

```ts
import type { S2Options } from '@antv/s2';

type SheetComponentOptions = S2Options<React.ReactNode>
```

## Common Types

### FederatedPointerEvent

> Alias: GEvent

[AntV/G Event Object](https://g.antv.antgroup.com/api/event/event-object)

### TargetCellInfo

Interaction callback return information.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| target | `S2CellType` | | | Interaction target object |
| event | `FederatedPointerEvent` | | | AntV/G event |
| viewMeta | `Node` | | | Current node information |

### CellScrollPosition

Cell scroll position information.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| scrollX | `number` | | | Horizontal scroll offset (relative to scrollbar track length) |
| scrollY | `number` | | | Vertical scroll offset (relative to scrollbar track length) |

### HiddenColumnsInfo

Hidden column header node information (when column hiding is enabled).

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| hideColumnNodes | `Node[]` | | | Currently hidden node info |
| displaySiblingNode | `{ prev: Node, next: Node }` | | | Displayed sibling node info |

### ResizeParams

Table resize and cell style information.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| info | [ResizeInfo](#resizeinfo) | | | Resize configuration info |
| style | `Style` | | | Style-related configuration from options |

### ResizeInfo

Table resize (cell width/height drag) configuration information.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| theme | `ResizeArea` | | | Resize hot area configuration |
| type | `"Horizontal" \| "Vertical"` | | | Resize direction |
| offsetX | `number` | | | Horizontal offset |
| offsetY | `number` | | | Vertical offset |
| width | `number` | | | Dragged width |
| height | `number` | | | Dragged height |
| size | `number` | | | Hot area size |
| effect | `"Field" \| "Cell" \| "Tree" \| "Series"` | | | Area affected by drag |
| isResizeArea | `boolean` | | | Whether it belongs to a resize hot area |
| id | `string` | | | Field ID |
| cell | `S2CellType` | | | Cell info for the resize hot area |
| meta | `Node` | | | Cell metadata for the resize hot area |
| resizedWidth | `number` | | | Width after drag |
| resizedHeight | `number` | | | Height after drag |

### CellSelectedDetail

Cell selected detail information.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| interactionName | `InteractionName` | | | Interaction name that triggered the selection |
| targetCell | `S2CellType` | | | Cell that triggered the selection |
| event | `FederatedPointerEvent \| Event \| KeyboardEvent` | | | Event object that triggered the selection |

### S2RenderOptions

Custom render mode.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| reloadData | `boolean` | | | Whether to reload data |
| rebuildDataSet | `boolean` | | | Whether to rebuild dataset |
| rebuildHiddenColumnsDetail | `boolean` | | | Whether to rebuild hidden columns detail |
