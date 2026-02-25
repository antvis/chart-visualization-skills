# Events & Interaction

## Overview

S2 provides a rich interaction system built on mouse and keyboard events. Common interactions (click, hover, brush selection, multi-select, resize) are built-in. All interactions emit events via `S2Event`, and you can create custom interactions by extending `BaseEvent`.

## Listening to Events

Events are namespaced by category:
- `global:xx` — Global chart events
- `layout:xx` — Layout change events
- `cell:xx` — Cell-level events (data cell, row cell, col cell, corner cell, etc.)

```ts
import { PivotSheet, S2Event, DataCell, RowCell, ColCell } from '@antv/s2';

const s2 = new PivotSheet(container, s2DataConfig, s2Options);

// Data cell click
s2.on(S2Event.DATA_CELL_CLICK, (event) => {
  console.log('data cell clicked', event);
});

// Column header hover
s2.on(S2Event.COL_CELL_HOVER, (event) => { /* ... */ });

// Brush selection on data cells
s2.on(S2Event.DATA_CELL_BRUSH_SELECTION, (cells: DataCell[]) => {
  console.log('brush selected cells:', cells);
});

// Global keyboard events
s2.on(S2Event.GLOBAL_KEYBOARD_DOWN, (event) => { /* ... */ });

// Global selected (fires on single-select, multi-select, brush, range selection)
s2.on(S2Event.GLOBAL_SELECTED, (cells) => { /* ... */ });

// Reset interaction (click outside, press Esc, re-click selected cell)
s2.on(S2Event.GLOBAL_RESET, () => { /* ... */ });
```

### React / Vue Usage

```tsx
// React — using SheetComponent ref
import { S2Event, SpreadSheet } from '@antv/s2';
import { SheetComponent } from '@antv/s2-react';

function App() {
  const s2Ref = React.useRef<SpreadSheet>();
  const onSheetMounted = () => {
    s2Ref.current?.on(S2Event.DATA_CELL_CLICK, (event) => {
      console.log('data cell click:', event);
    });
  };
  return <SheetComponent ref={s2Ref} onMounted={onSheetMounted} />;
}

// React — using event props (recommended)
<SheetComponent onDataCellClick={handler} />

// Vue
<SheetComponent @dataCellClick="handler" />
```

## Built-in Interactions

| Interaction | Event | Description |
|---|---|---|
| Single Select | `GLOBAL_SELECTED` | Click a cell to select it, show tooltip. Click again to deselect. |
| Multi Select | `GLOBAL_SELECTED` | Hold `Cmd/Ctrl` and click additional cells. |
| Row/Col Header Quick Select | `GLOBAL_SELECTED` | Click row/col header to select all cells in that row/col (including off-screen). |
| Brush Selection | `DATA_CELL_BRUSH_SELECTION`, `GLOBAL_SELECTED` | Drag to batch-select data cells. Shows overlay during selection. |
| Row Header Brush | `ROW_CELL_BRUSH_SELECTION`, `GLOBAL_SELECTED` | Drag to batch-select row header cells (pivot table only). |
| Col Header Brush | `COL_CELL_BRUSH_SELECTION`, `GLOBAL_SELECTED` | Drag to batch-select column header cells. |
| Range Selection | `GLOBAL_SELECTED` | Click start cell, then `Shift+click` end cell to select range. |
| Hover | `GLOBAL_HOVER` | Highlight current cell on hover. Cross-highlight (row+col) for data cells by default. |
| Resize | `LAYOUT_RESIZE` | Drag row/col header edges to adjust dimensions. |
| Copy | `GLOBAL_COPIED` | Copy selected cell data. |
| Hide Columns | `COL_CELL_HIDDEN`, `COL_CELL_EXPANDED` | Hide/expand column headers. |
| Link Jump | `GLOBAL_LINK_FIELD_JUMP` | Click link-style fields for navigation. |
| Reset | `GLOBAL_RESET` | Click outside, press `Esc`, or re-click to reset selection. |
| Move Highlight | `GLOBAL_SELECTED` | After selecting a data cell, use arrow keys to move highlight. |

## Interaction Configuration

All interaction settings are under `s2Options.interaction`:

```ts
const s2Options = {
  interaction: {
    // Spotlight effect: dim unselected cells when a cell is selected
    selectedCellsSpotlight: false,

    // Cross-highlight on hover (row+col headers and cells)
    hoverHighlight: true,
    // Can also be an object: { rowHeader: true, colHeader: true, currentRow: true, currentCol: true }

    // Hover focus: show tooltip after hovering 800ms (configurable)
    hoverFocus: true, // or { duration: 800 } or false

    // Highlight row/col headers when a data cell is selected
    selectedCellHighlight: false,
    // Or: { rowHeader: true, colHeader: true, currentRow: true, currentCol: true }

    // Brush selection (drag to select)
    brushSelection: true,
    // Or: { dataCell: true, rowCell: false, colCell: false }

    // Cmd/Ctrl+click multi-select
    multiSelection: true,

    // Shift+click range selection
    rangeSelection: true,

    // Arrow key cell movement after selection
    selectedCellMove: true,

    // Mark fields as link style for navigation
    linkFields: [], // string[] or (meta) => boolean

    // Default hidden columns (use column unique IDs for pivot tables)
    hiddenColumnFields: [],

    // Copy settings
    copy: {
      enable: true,
      withFormat: true,
      withHeader: false,
    },

    // Custom interactions
    customInteractions: [],

    // Scroll speed ratio
    scrollSpeedRatio: { horizontal: 1, vertical: 1 },

    // Reset interaction when clicking outside or pressing Esc
    autoResetSheetStyle: true,
    // Or a function: (event, spreadsheet) => boolean

    // Resize configuration
    resize: true,
    // Or: { rowCellVertical: true, cornerCellHorizontal: true, colCellHorizontal: true, colCellVertical: true, rowResizeType: 'current', colResizeType: 'current', minCellWidth: 40, minCellHeight: 20 }

    // Scrollbar position: 'content' | 'canvas'
    scrollbarPosition: 'content',

    // Overscroll behavior: 'auto' | 'contain' | 'none' | null
    overscrollBehavior: 'auto',
  },
};
```

## Interaction Intercepts

Block specific interaction events using intercepts:

```ts
import { InterceptType } from '@antv/s2';

// Add intercepts (prevent hover and click)
s2.interaction.addIntercepts([InterceptType.HOVER, InterceptType.CLICK]);

// Remove intercepts
s2.interaction.removeIntercepts([InterceptType.HOVER, InterceptType.CLICK]);
```

Available `InterceptType` values: `HOVER`, `CLICK`, `DATA_CELL_BRUSH_SELECTION`, `ROW_CELL_BRUSH_SELECTION`, `COL_CELL_BRUSH_SELECTION`, `MULTI_SELECTION`, `RESIZE`.

## Interaction API

The `s2.interaction` namespace provides methods for programmatic interaction:

```ts
s2.interaction.selectAll();
s2.interaction.selectCell(cell);
s2.interaction.highlightCell(cell);
s2.interaction.changeCell(cell);
```

## Custom Interactions

Create custom interactions by extending `BaseEvent`:

```ts
import { BaseEvent, S2Event } from '@antv/s2';

class MyInteraction extends BaseEvent {
  bindEvents() {
    this.spreadsheet.on(S2Event.COL_CELL_DOUBLE_CLICK, (event) => {
      const cell = this.spreadsheet.getCell(event.target);
      const meta = cell.getMeta();
      // Custom logic: e.g., hide the column on double-click
      this.spreadsheet.interaction.hideColumns([meta.field]);
    });
  }
}
```

Register custom interactions:

```ts
const s2Options = {
  interaction: {
    customInteractions: [
      {
        key: 'MyInteraction', // unique identifier
        interaction: MyInteraction,
      },
    ],
  },
};
```

## Key Enums

### InteractionName

```ts
enum InteractionName {
  CORNER_CELL_CLICK = 'cornerCellClick',
  DATA_CELL_CLICK = 'dataCellClick',
  ROW_CELL_CLICK = 'rowCellClick',
  COL_CELL_CLICK = 'colCellClick',
  MERGED_CELLS_CLICK = 'mergedCellsClick',
  HOVER = 'hover',
  DATA_CELL_BRUSH_SELECTION = 'dataCellBrushSelection',
  ROW_CELL_BRUSH_SELECTION = 'rowCellBrushSelection',
  COL_CELL_BRUSH_SELECTION = 'colCellBrushSelection',
  COL_ROW_RESIZE = 'rowColResize',
  DATA_CELL_MULTI_SELECTION = 'dataCellMultiSelection',
  RANGE_SELECTION = 'rangeSelection',
  SELECTED_CELL_MOVE = 'selectedCellMove',
  GLOBAL_RESET = 'globalReset',
}
```

### InteractionStateName

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
