# Interaction Examples

## Example 1: Cell Click Selection and Events

Configure cell selection behavior and listen to various interaction events using `S2Event`.

```typescript
import { PivotSheet, S2Event, S2Options } from '@antv/s2';

const container = document.getElementById('container');

const s2Options: S2Options = {
  width: 600,
  height: 480,
  interaction: {
    hoverHighlight: true,
    // Highlight selected cells
    selectedCellsSpotlight: true,
    // Multi-select (hold Ctrl/Command), enabled by default
    multiSelection: true,
  },
};

const s2 = new PivotSheet(container, dataCfg, s2Options);

// Listen to data cell click
s2.on(S2Event.DATA_CELL_CLICK, (event) => {
  console.log('data cell click:', event);
});

// Listen to data cell selected (fires after selection is confirmed)
s2.on(S2Event.DATA_CELL_SELECTED, (cells, detail) => {
  console.log('data cell selected:', cells, detail);
});

// Listen to global selection changes (any cell type)
s2.on(S2Event.GLOBAL_SELECTED, (cells, detail) => {
  console.log('selected', cells, detail);
});

// Additional useful events:
// S2Event.ROW_CELL_CLICK
// S2Event.COL_CELL_CLICK
// S2Event.CORNER_CELL_CLICK
// S2Event.GLOBAL_SCROLL
// S2Event.LAYOUT_RESIZE
// S2Event.DATA_CELL_BRUSH_SELECTION

await s2.render();
```

## Example 2: Brush Selection and Interaction API

Enable brush (drag) selection and use the interaction API to programmatically select, highlight, and reset cells.

```typescript
import {
  InteractionStateName,
  PivotSheet,
  S2Event,
  S2Options,
  SpreadSheet,
} from '@antv/s2';

const s2Options: S2Options = {
  width: 600,
  height: 480,
  style: {
    rowCell: { width: 80 },
    dataCell: { width: 100, height: 100 },
  },
  interaction: {
    copy: { enable: true },
    hoverHighlight: true,
    brushSelection: true,
    multiSelection: true,
    selectedCellHighlight: false,
    selectedCellsSpotlight: true,
    selectedCellMove: true,
    overscrollBehavior: 'none',
    // Custom auto-reset logic
    autoResetSheetStyle: (event, spreadsheet) => {
      // Don't auto-reset when clicking specific buttons
      if (event?.target instanceof HTMLElement) {
        return !event.target.classList.contains('ant-btn');
      }
      return true; // Reset normally (e.g., clicking blank area, pressing ESC)
    },
  },
};

const s2 = new PivotSheet(container, dataCfg, s2Options);

// Listen to multiple events
[
  S2Event.GLOBAL_SCROLL,
  S2Event.ROW_CELL_CLICK,
  S2Event.COL_CELL_CLICK,
  S2Event.DATA_CELL_CLICK,
  S2Event.DATA_CELL_SELECTED,
  S2Event.GLOBAL_SELECTED,
  S2Event.DATA_CELL_BRUSH_SELECTION,
  S2Event.LAYOUT_RESIZE,
].forEach((eventName) => {
  s2.on(eventName, (...args) => {
    console.log(eventName, ...args);
  });
});

await s2.render();

// --- Interaction API examples ---

// Select all cells
s2.interaction.selectAll();

// Select a specific data cell (with scroll animation)
const dataCell = s2.facet.getDataCells()[0];
s2.interaction.selectCell(dataCell, {
  animate: true,
  skipScrollEvent: false,
});

// Highlight a specific cell
const cell = s2.facet.getCells()[0];
s2.interaction.highlightCell(cell, {
  animate: true,
  skipScrollEvent: false,
});

// Highlight a data cell and its corresponding row/column headers
const dataCellViewMeta = s2.facet.getCellMeta(1, 1);
s2.interaction.updateDataCellRelevantHeaderCells(
  InteractionStateName.HOVER,
  dataCellViewMeta,
);

// Hide specific columns by node ID
s2.interaction.hideColumns([
  'root[&]Furniture[&]Table[&]number',
  'root[&]Stationery[&]Pen[&]number',
]);

// Reset all interaction states
s2.interaction.reset();
s2.interaction.hideColumns([]);
```

## Example 3: Custom Interaction - Row/Column Hover Tooltip

Create a custom interaction by extending `BaseEvent` and registering it via `customInteractions`.

```typescript
import { BaseEvent, PivotSheet, S2Event, S2Options } from '@antv/s2';

class RowColumnHoverTooltipInteraction extends BaseEvent {
  bindEvents() {
    // Row header hover
    this.spreadsheet.on(S2Event.ROW_CELL_HOVER, (event) => {
      this.showTooltip(event);
    });
    // Column header hover
    this.spreadsheet.on(S2Event.COL_CELL_HOVER, (event) => {
      this.showTooltip(event);
    });
  }

  showTooltip(event: any) {
    const cell = this.spreadsheet.getCell(event.target);
    const meta = cell?.getMeta();
    const content = meta?.value || 'custom';

    this.spreadsheet.showTooltip({
      position: {
        x: event.clientX,
        y: event.clientY,
      },
      content,
    });
  }
}

const s2Options: S2Options = {
  width: 600,
  height: 480,
  tooltip: {
    enable: true,
  },
  interaction: {
    customInteractions: [
      {
        key: 'RowColumnHoverTooltipInteraction',
        interaction: RowColumnHoverTooltipInteraction,
      },
    ],
  },
};

const s2 = new PivotSheet(container, dataCfg, s2Options);

await s2.render();
```
