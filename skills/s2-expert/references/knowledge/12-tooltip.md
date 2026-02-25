# Tooltip

## Overview

Tooltips display table information and analysis features through interactive overlays on cells.

**Important**: The base `@antv/s2` package only provides tooltip show/hide logic and data — it does **not** render content. The `@antv/s2-react` and `@antv/s2-vue` packages render tooltip content (sort menus, cell selection summaries, column hide buttons, etc.) via custom tooltip classes.

Remember to import styles:

```ts
import '@antv/s2/dist/s2.min.css';
// For React:
import '@antv/s2-react/dist/s2-react.min.css';
// For Vue:
import '@antv/s2-vue/dist/s2-vue.min.css';
```

## Configuration

### Tooltip Type

| Property | Description | Type | Default |
|----------|-------------|------|---------|
| enable | Whether to show tooltip | `boolean` | `true` |
| operation | Tooltip operation options | `TooltipOperation` | - |
| rowCell | Row header cell config | `BaseTooltipConfig` | - |
| colCell | Column header cell config | `BaseTooltipConfig` | - |
| dataCell | Data cell config | `BaseTooltipConfig` | - |
| cornerCell | Corner cell config | `BaseTooltipConfig` | - |
| render | Custom tooltip class factory | `(spreadsheet) => BaseTooltip` | - |
| content | Custom tooltip content | `ReactNode \| Element \| string` or `(cell, defaultTooltipShowOptions) => ReactNode \| Element \| string` | - |
| autoAdjustBoundary | Auto-adjust position when overflowing | `'container' \| 'body' \| null` | `'body'` |
| adjustPosition | Custom position function | `(positionInfo) => {x, y}` | - |
| getContainer | Custom mount container | `() => HTMLElement` | `document.body` |
| className | Extra container class name | `string` | - |
| style | Extra container styles | `CSSProperties` | - |

### BaseTooltipConfig

| Property | Description | Type | Default |
|----------|-------------|------|---------|
| enable | Whether to show tooltip | `boolean` | `true` |
| operation | Operation options | `TooltipOperation` | - |
| content | Custom content | `ReactNode \| Element \| string` or callback | - |

## Basic Usage

```ts
const s2Options = {
  tooltip: {
    enable: true,
  },
};
```

### Per-Cell Configuration

```ts
const s2Options = {
  tooltip: {
    enable: true,
    rowCell: {
      enable: false, // Disable tooltip for row headers
    },
    dataCell: {
      content: 'Custom data cell tooltip',
    },
  },
};
```

## Show/Hide

Default behavior:
- Row/column headers: tooltip shows on **click**; shows on hover only when text is truncated
- Data cells: tooltip shows after **800ms** hover

### Programmatic Control

```ts
// Show tooltip
s2.showTooltip({
  position: { x: 100, y: 200 },
  content: 'Hello',
});

// Or via tooltip instance
s2.tooltip.show({
  position: { x: 100, y: 200 },
  content: 'Hello',
});

// Hide tooltip
s2.tooltip.hide();
```

## Custom Content

### In @antv/s2 (Vanilla JS)

Content can be any DOM node or HTML string:

```ts
const content = document.createElement('div');
content.innerHTML = 'Custom content';

const s2Options = {
  tooltip: {
    content,
    // or: content: '<div>Custom string content</div>'
  },
};
```

### In @antv/s2-react

Content can be any JSX element:

```tsx
const s2Options = {
  tooltip: {
    content: <div>Custom React content</div>,
  },
};
```

Content also supports a callback for dynamic rendering:

```tsx
const s2Options = {
  tooltip: {
    content: (cell, defaultTooltipShowOptions) => {
      console.log('Current cell:', cell);
      return <CustomTooltipContent cell={cell} />;
    },
  },
};
```

Return `null` from the callback to use the default tooltip.

### Content Priority

`Method call` > `Cell-specific config` > `Base config`

```tsx
const s2Options = {
  tooltip: {
    content: DefaultContent,           // lowest priority
    rowCell: {
      content: RowCellContent,         // medium priority
    },
  },
};

// Highest priority:
s2.showTooltip({ content: <MethodContent /> });
```

## Tooltip Operations

### TooltipOperation

| Property | Description | Type | Default |
|----------|-------------|------|---------|
| hiddenColumns | Enable hide column (leaf nodes only) | `boolean` | `true` |
| sort | Enable group sort | `boolean` | `false` |
| tableSort | Enable table column header sort | `boolean` | `false` |
| menu | Custom operation menu config | `TooltipOperatorMenuOptions` | - |

### Custom Menu Items (React/Vue)

```tsx
import { Menu } from 'antd';

const s2Options = {
  tooltip: {
    operation: {
      menu: {
        render: (props) => <Menu {...props} />,
        onClick: (info, cell) => {
          console.log('Menu item clicked:', info, cell);
        },
        items: [
          {
            key: 'custom-a',
            label: 'Action 1',
            icon: 'Trend',
            onClick: (info, cell) => {
              console.log('Action 1 clicked:', info, cell);
            },
            children: [
              {
                key: 'custom-a-a',
                label: 'Action 1-1',
              },
            ],
          },
          {
            key: 'custom-b',
            label: 'Action 2',
            icon: 'EyeOutlined',
            visible: (cell) => {
              // Dynamically show/hide based on cell info
              return cell.getMeta().isLeaf;
            },
          },
        ],
      },
    },
  },
};
```

## Position Configuration

### Auto-adjust Boundary

```ts
const s2Options = {
  tooltip: {
    autoAdjustBoundary: 'container', // Stay within table container
    // 'body' (default) — stay within browser viewport
    // null — disable auto-adjustment
  },
};
```

### Custom Mount Container

```ts
const s2Options = {
  tooltip: {
    getContainer: () => document.querySelector('.my-container'),
  },
};
```

### Custom Styles

```ts
const s2Options = {
  tooltip: {
    style: { fontSize: '20px' },
    className: 'my-tooltip',
  },
};
```

## Custom Tooltip Class

Extend `BaseTooltip` to integrate with any framework (React, Vue, Angular):

```ts
import { BaseTooltip, SpreadSheet } from '@antv/s2';

class CustomTooltip extends BaseTooltip {
  constructor(spreadsheet: SpreadSheet) {
    super(spreadsheet);
  }

  renderContent() {
    // Render your custom component into this.container
  }

  show(showOptions) {
    // Custom show logic
    console.log(this.spreadsheet);
  }

  hide() {}
  destroy() {}
  clearContent() {}
}

const s2Options = {
  tooltip: {
    enable: true,
    render: (spreadsheet) => new CustomTooltip(spreadsheet),
  },
};
```

## Custom Show Timing

Use custom interactions to change when tooltips appear:

```ts
import { BaseEvent, S2Event } from '@antv/s2';

class RowHoverInteraction extends BaseEvent {
  bindEvents() {
    this.spreadsheet.on(S2Event.ROW_CELL_HOVER, (event) => {
      this.spreadsheet.tooltip.show({
        position: { x: event.clientX, y: event.clientY },
        content: 'Custom hover tooltip',
      });
    });
  }
}

const s2Options = {
  tooltip: { enable: true },
  interaction: {
    customInteractions: [
      {
        key: 'RowHoverInteraction',
        interaction: RowHoverInteraction,
      },
    ],
  },
};
```
