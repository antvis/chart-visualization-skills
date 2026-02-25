# S2Event

Table event list. Listen to the events you need to implement custom business logic.

```ts
import { S2Event } from '@antv/s2'

s2.on(S2Event.ROW_CELL_CLICK, (event) => {
  console.log('rowCellClick', event)
});
```

> If using `@antv/s2-react` or `@antv/s2-vue` components, events are already wrapped — use the callback props directly instead of manually listening.
>
> ```tsx
> <SheetComponent onRowCellClick={...} />
> ```

## Row Header Cell (RowCell)

| Name | Event | Description |
| --- | --- | --- |
| Collapse/Expand | `S2Event.ROW_CELL_COLLAPSED` | Row header cell expand/collapse in tree mode |
| Collapse/Expand All | `S2Event.ROW_CELL_ALL_COLLAPSED` | Row header cell expand/collapse all in tree mode |
| Click | `S2Event.ROW_CELL_CLICK` | Row header cell click |
| Double Click | `S2Event.ROW_CELL_DOUBLE_CLICK` | Row header cell double click |
| Context Menu | `S2Event.ROW_CELL_CONTEXT_MENU` | Row header cell right-click |
| Hover | `S2Event.ROW_CELL_HOVER` | Row header cell hover |
| Mouse Down | `S2Event.ROW_CELL_MOUSE_DOWN` | Row header cell mouse down |
| Mouse Move | `S2Event.ROW_CELL_MOUSE_MOVE` | Row header cell mouse move |
| Mouse Up | `S2Event.ROW_CELL_MOUSE_UP` | Row header cell mouse up |
| Scroll | `S2Event.ROW_CELL_SCROLL` | Row header cell scroll |
| Brush Selection | `S2Event.ROW_CELL_BRUSH_SELECTION` | Batch select row header cells within brush range. Shows brush range mask during selection, shows tooltip with selected cell info after completion (pivot table only) |
| Cell Render | `S2Event.ROW_CELL_RENDER` | Row header cell layout render complete |
| Cell Selected | `S2Event.ROW_CELL_SELECTED` | Row header cell selected. Provides selected cells, interaction name, and trigger cell info |

## Column Header Cell (ColCell)

| Name | Event | Description |
| --- | --- | --- |
| Click | `S2Event.COL_CELL_CLICK` | Column header cell click |
| Double Click | `S2Event.COL_CELL_DOUBLE_CLICK` | Column header cell double click |
| Context Menu | `S2Event.COL_CELL_CONTEXT_MENU` | Column header cell right-click |
| Hover | `S2Event.COL_CELL_HOVER` | Column header cell hover |
| Mouse Down | `S2Event.COL_CELL_MOUSE_DOWN` | Column header cell mouse down |
| Mouse Move | `S2Event.COL_CELL_MOUSE_MOVE` | Column header cell mouse move |
| Mouse Up | `S2Event.COL_CELL_MOUSE_UP` | Column header cell mouse up |
| Brush Selection | `S2Event.COL_CELL_BRUSH_SELECTION` | Batch select column header cells within brush range. Shows brush range mask during selection, shows tooltip with selected cell info after completion (pivot table only) |
| Cell Render | `S2Event.COL_CELL_RENDER` | Column header cell layout render complete |
| Cell Selected | `S2Event.COL_CELL_SELECTED` | Column header cell selected. Provides selected cells, interaction name, and trigger cell info |

## Data Cell (DataCell)

| Name | Event | Description |
| --- | --- | --- |
| Click | `S2Event.DATA_CELL_CLICK` | Data cell click |
| Double Click | `S2Event.DATA_CELL_DOUBLE_CLICK` | Data cell double click |
| Context Menu | `S2Event.DATA_CELL_CONTEXT_MENU` | Data cell right-click |
| Hover | `S2Event.DATA_CELL_HOVER` | Data cell hover |
| Mouse Down | `S2Event.DATA_CELL_MOUSE_DOWN` | Data cell mouse down |
| Mouse Move | `S2Event.DATA_CELL_MOUSE_MOVE` | Data cell mouse move |
| Mouse Up | `S2Event.DATA_CELL_MOUSE_UP` | Data cell mouse up |
| Brush Selection | `S2Event.DATA_CELL_BRUSH_SELECTION` | Data cell brush selection |
| Arrow Key Move | `S2Event.DATA_CELL_SELECT_MOVE` | Data cell keyboard arrow key move |
| Cell Render | `S2Event.DATA_CELL_RENDER` | Data cell layout render complete |
| Cell Selected | `S2Event.DATA_CELL_SELECTED` | Data cell selected. Provides selected cells, interaction name, and trigger cell info |

## Corner Header Cell (CornerCell)

| Name | Event | Description |
| --- | --- | --- |
| Click | `S2Event.CORNER_CELL_CLICK` | Corner cell click |
| Double Click | `S2Event.CORNER_CELL_DOUBLE_CLICK` | Corner cell double click |
| Context Menu | `S2Event.CORNER_CELL_CONTEXT_MENU` | Corner cell right-click |
| Hover | `S2Event.CORNER_CELL_HOVER` | Corner cell hover |
| Mouse Down | `S2Event.CORNER_CELL_MOUSE_DOWN` | Corner cell mouse down |
| Mouse Move | `S2Event.CORNER_CELL_MOUSE_MOVE` | Corner cell mouse move |
| Mouse Up | `S2Event.CORNER_CELL_MOUSE_UP` | Corner cell mouse up |
| Cell Render | `S2Event.CORNER_CELL_RENDER` | Corner cell layout render complete |
| Cell Selected | `S2Event.CORNER_CELL_SELECTED` | Corner cell selected. Provides selected cells, interaction name, and trigger cell info |

## Merged Cells (MergedCells)

| Name | Event | Description |
| --- | --- | --- |
| Click | `S2Event.MERGED_CELLS_CLICK` | Merged cell click |
| Double Click | `S2Event.MERGED_CELLS_DOUBLE_CLICK` | Merged cell double click |
| Context Menu | `S2Event.MERGED_CELLS_CONTEXT_MENU` | Merged cell right-click |
| Hover | `S2Event.MERGED_CELLS_HOVER` | Merged cell hover |
| Mouse Down | `S2Event.MERGED_CELLS_MOUSE_DOWN` | Merged cell mouse down |
| Mouse Move | `S2Event.MERGED_CELLS_MOUSE_MOVE` | Merged cell mouse move |
| Mouse Up | `S2Event.MERGED_CELLS_MOUSE_UP` | Merged cell mouse up |
| Cell Render | `S2Event.MERGED_CELLS_RENDER` | Merged cell layout render complete |

## Series Number Cell (SeriesNumberCell)

| Name | Event | Description |
| --- | --- | --- |
| Cell Render | `S2Event.SERIES_NUMBER_CELL_RENDER` | Series number cell layout render complete |

## Resize (Width/Height Drag Adjustment)

| Name | Event | Description |
| --- | --- | --- |
| Cell Resize | `S2Event.LAYOUT_RESIZE` | Cell width/height changed |
| Series Column Width Change | `S2Event.LAYOUT_RESIZE_SERIES_WIDTH` | Series number column width changed |
| Resize Mouse Down | `S2Event.LAYOUT_RESIZE_MOUSE_DOWN` | Mouse down during cell resize (row/column headers only) |
| Resize Mouse Move | `S2Event.LAYOUT_RESIZE_MOUSE_MOVE` | Mouse move during cell resize (row/column headers only) |
| Resize Mouse Up | `S2Event.LAYOUT_RESIZE_MOUSE_UP` | Mouse up during cell resize (row/column headers only) |
| Row Width Change | `S2Event.LAYOUT_RESIZE_ROW_WIDTH` | Row header width changed |
| Row Height Change | `S2Event.LAYOUT_RESIZE_ROW_HEIGHT` | Row header height changed |
| Col Width Change | `S2Event.LAYOUT_RESIZE_COL_WIDTH` | Column header width changed |
| Col Height Change | `S2Event.LAYOUT_RESIZE_COL_HEIGHT` | Column header height changed |
| Tree Width Change | `S2Event.LAYOUT_RESIZE_TREE_WIDTH` | Cell width changed in tree mode |

## Layout

| Name | Event | Description |
| --- | --- | --- |
| Header Layout Complete | `S2Event.LAYOUT_AFTER_HEADER_LAYOUT` | Triggered after row and column header layout is complete |
| Data Cell Render Complete | `S2Event.LAYOUT_AFTER_REAL_DATA_CELL_RENDER` | Triggered after data cells in the current visible range are rendered |
| Pagination | `S2Event.LAYOUT_PAGINATION` | Pagination event |
| Col Expanded | `S2Event.COL_CELL_EXPANDED` | Triggered when column header is expanded |
| Col Hidden | `S2Event.COL_CELL_HIDDEN` | Triggered when column header is hidden |
| Col Expand Icon Hover | `S2Event.COL_CELL_EXPAND_ICON_HOVER` | Triggered when hovering over the expand icon of a hidden column header |
| Before Render | `S2Event.LAYOUT_BEFORE_RENDER` | Event before render starts, i.e., before `s2.render()` |
| After Render | `S2Event.LAYOUT_AFTER_RENDER` | Event after render completes, i.e., after `s2.render()` |
| Destroy | `S2Event.LAYOUT_DESTROY` | Triggered after table is destroyed or `s2.destroy()` is called |
| Cell Render | `S2Event.LAYOUT_CELL_RENDER` | Individual cell layout render complete |

## Global

| Name | Event | Description |
| --- | --- | --- |
| Keyboard Down | `S2Event.GLOBAL_KEYBOARD_DOWN` | Keyboard key down |
| Keyboard Up | `S2Event.GLOBAL_KEYBOARD_UP` | Keyboard key up |
| Copied | `S2Event.GLOBAL_COPIED` | Copy selected cells |
| Mouse Up | `S2Event.GLOBAL_MOUSE_UP` | Mouse up in chart area |
| Click | `S2Event.GLOBAL_CLICK` | Click in chart area |
| Preview Click | `S2Event.GLOBAL_PREVIEW_CLICK` | Image/video preview click |
| Context Menu | `S2Event.GLOBAL_CONTEXT_MENU` | Right-click in chart area |
| Selected | `S2Event.GLOBAL_SELECTED` | Cell selected (brush selection, multi-select, single select). Provides selected cells, interaction name, and trigger cell info |
| Hover | `S2Event.GLOBAL_HOVER` | Mouse hover over a cell |
| Reset | `S2Event.GLOBAL_RESET` | Reset interaction styles when clicking blank area or pressing Esc |
| Link Field Jump | `S2Event.GLOBAL_LINK_FIELD_JUMP` | Click on link field text in row/column header or data cell |
| Action Icon Click | `S2Event.GLOBAL_ACTION_ICON_CLICK` | Click on action icon on the right side of a cell (e.g., sort icon) |
| Action Icon Hover | `S2Event.GLOBAL_ACTION_ICON_HOVER` | Hover on action icon on the right side of a cell (e.g., sort icon) |
| Scroll | `S2Event.GLOBAL_SCROLL` | Table scroll (includes data cells and row header cells) |

## Enums

### InterceptType

Interaction intercept types.

```ts
enum InterceptType {
  HOVER = 'hover',
  CLICK = 'click',
  DATA_CELL_BRUSH_SELECTION = 'dataCellBrushSelection',
  ROW_CELL_BRUSH_SELECTION = 'rowCellBrushSelection',
  COL_CELL_BRUSH_SELECTION = 'colCellBrushSelection',
  MULTI_SELECTION = 'multiSelection',
  RESIZE = 'resize',
}
```

### InteractionName

Interaction names.

```ts
enum InteractionName {
  CORNER_CELL_CLICK = 'cornerCellClick',
  DATA_CELL_CLICK = 'dataCellClick',
  ROW_CELL_CLICK = 'rowCellClick',
  COL_CELL_CLICK = 'colCellClick',
  MERGED_CELLS_CLICK = 'mergedCellsClick',
  ROW_COLUMN_CLICK = 'rowColumnClick',
  HEADER_CELL_LINK_CLICK = 'headerCellLinkClick',
  HOVER = 'hover',
  DATA_CELL_BRUSH_SELECTION = 'dataCellBrushSelection',
  ROW_CELL_BRUSH_SELECTION = 'rowCellBrushSelection',
  COL_CELL_BRUSH_SELECTION = 'colCellBrushSelection',
  COL_ROW_RESIZE = 'rowColResize',
  DATA_CELL_MULTI_SELECTION = 'dataCellMultiSelection',
  ROW_CELL_MULTI_SELECTION = 'rowCellMultiSelection',
  COL_CELL_MULTI_SELECTION = 'colCellMultiSelection',
  RANGE_SELECTION = 'rangeSelection',
  SELECTED_CELL_MOVE = 'selectedCellMove',
  GLOBAL_RESET = 'globalReset',
}
```

### InteractionStateName

Interaction state names.

```ts
enum InteractionStateName {
  ALL_SELECTED = 'allSelected',
  SELECTED = 'selected',
  ROW_CELL_BRUSH_SELECTED = 'rowCellBrushSelected',
  COL_CELL_BRUSH_SELECTED = 'colCellBrushSelected',
  DATA_CELL_BRUSH_SELECTED = 'dataCellBrushSelected',
  UNSELECTED = 'unselected',
  HOVER = 'hover',
  HOVER_FOCUS = 'hoverFocus',
  HIGHLIGHT = 'highlight',
  SEARCH_RESULT = 'searchResult',
  PREPARE_SELECT = 'prepareSelect',
}
```

### CellType

Cell types.

```ts
enum CellType {
  DATA_CELL = 'dataCell',
  ROW_CELL = 'rowCell',
  COL_CELL = 'colCell',
  SERIES_NUMBER_CELL = 'seriesNumberCell',
  CORNER_CELL = 'cornerCell',
  MERGED_CELL = 'mergedCell',
}
```
