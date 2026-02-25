# Field Marking (Conditions)

Field marking (conditions) allows users to visually emphasize key information in data cells through four types of markers:

- **Text** (`text`) — Change text color, font size, opacity, alignment
- **Background** (`background`) — Change cell background color
- **Interval** (`interval`) — Display bar charts within cells
- **Icon** (`icon`) — Display icons next to cell text

Data cells support all 4 condition types. Header cells (corner, row, column headers) only support text, background, and icon conditions (interval is not applicable to headers).

## Configuration

Conditions are configured via `s2Options.conditions`:

```ts
const s2Options = {
  conditions: {
    text: [],       // TextCondition[]
    background: [], // BackgroundCondition[]
    interval: [],   // IntervalCondition[]
    icon: [],       // IconCondition[]
  },
};
```

## Conditions Type

```ts
interface Conditions {
  text?: TextCondition[];
  background?: BackgroundCondition[];
  interval?: IntervalCondition[];
  icon?: IconCondition[];
}
```

### Condition (Base)

All condition types inherit from `Condition`:

| Property | Description | Type | Required |
|----------|-------------|------|----------|
| field | Field ID or regex to match field IDs | `string \| RegExp` | ✓ |
| mapping | Callback function for condition rendering | `ConditionMapping` | ✓ |

### field

- **Pivot table**: `field` matches against `rows`, `columns`, and `values` — applies to row headers, column headers, corner headers, and data cells.
- **Table (detail) sheet**: `field` matches against `columns` — applies to data cells.

A field ID matching multiple rules of the same condition type uses the **last matched rule**.

### mapping

```ts
type ConditionMapping<T = unknown> = (
  fieldValue: number | string,
  data: RawData,
  cell?: S2CellType,
) => ConditionMappingResult<T>;
```

Parameters:
- `fieldValue`: Current cell value
- `data`: For data cells, the cell's raw data; for header cells, the cell's `Node` information
- `cell`: The cell instance (for accessing any additional data)

If `mapping` returns `null`/`undefined`, no condition marking is rendered for that cell.

## Condition Types

### TextCondition

The mapping result follows `TextTheme` — controls text color, opacity, alignment, font, etc.

```ts
type TextConditionMappingResult = TextTheme;
```

```ts
const s2Options = {
  conditions: {
    text: [
      {
        field: 'price',
        mapping(fieldValue, data) {
          return {
            fill: '#5B8FF9',
            fontSize: 16,
            opacity: 0.8,
            textAlign: 'right',
          };
        },
      },
    ],
  },
};
```

### BackgroundCondition

```ts
type BackgroundConditionMappingResult = {
  fill: string;                        // Background color (required)
  intelligentReverseTextColor?: boolean; // Auto-reverse text color for readability
};
```

When `intelligentReverseTextColor` is `true`, text automatically turns white on dark backgrounds to meet WCAG 2.0 AA contrast standards. Priority: `background condition`'s `intelligentReverseTextColor` < `text condition`'s `fill`.

```ts
const s2Options = {
  conditions: {
    background: [
      {
        field: 'number',
        mapping() {
          return {
            fill: '#000',
            intelligentReverseTextColor: true,
          };
        },
      },
    ],
  },
};
```

### IntervalCondition

Renders bar charts inside cells.

```ts
type IntervalConditionMappingResult = {
  fill?: string;       // Bar color (supports gradients)
  isCompare?: boolean; // Enable custom range
  minValue?: number;   // Custom minimum value
  maxValue?: number;   // Custom maximum value
  fieldValue?: number; // Override the cell value used for bar rendering
};
```

By default, the bar range is determined by the min/max values of all data for that field. Set `isCompare: true` to define a custom range. Use `cell.getValueRange()` to get the default range.

```ts
const s2Options = {
  conditions: {
    interval: [
      {
        field: 'number',
        mapping(value, data, cell) {
          return {
            fill: '#80BFFF',
            isCompare: true,
            maxValue: 8000,
            minValue: 300,
          };
        },
      },
    ],
  },
};
```

**Bidirectional bar chart** — use different colors for positive/negative values:

```ts
mapping(value) {
  return {
    fill: value >= 0 ? '#80BFFF' : '#F4664A',
  };
}
```

**Gradient bar chart** — use AntV/G gradient syntax in `fill`:

```ts
mapping(fieldValue) {
  return {
    fill: `l(0) 0:#95F0FF 1:${computedColor}`,
    isCompare: true,
    maxValue: 7789,
  };
}
```

### IconCondition

Has an additional `position` property compared to other conditions:

| Property | Description | Type | Default |
|----------|-------------|------|---------|
| position | Icon position relative to text | `'left' \| 'right'` | `'right'` |

```ts
type IconConditionMappingResult = {
  fill: string;  // Icon color
  icon: string;  // Icon name (registered or built-in)
};
```

```ts
const s2Options = {
  conditions: {
    icon: [
      {
        field: 'number',
        position: 'left',
        mapping() {
          return {
            icon: 'CellUp',
            fill: '#2498D1',
          };
        },
      },
    ],
  },
};
```

When both condition icons and header action icons exist, the layout is:
- `[header action icons] [condition icon] [text]` (position: left)
- `[text] [condition icon] [header action icons]` (position: right)

## Distinguishing Header Cells

In pivot tables, when a condition's `field` matches a row/column dimension, the corresponding corner header cell is also marked. Use the `mapping` parameters to distinguish between cell types:

```ts
mapping(fieldValue, data, cell) {
  if (cell?.cellType === 'cornerCell') {
    return { fill: 'red' };
  }
  return { fill: 'blue' };
}
```

## Complete Example

```ts
const s2Options = {
  conditions: {
    text: [
      {
        field: 'province',
        mapping: (fieldValue, data, cell) => ({
          fill: 'green',
          fontSize: 16,
        }),
      },
    ],
    background: [
      {
        field: 'count',
        mapping: (fieldValue, data, cell) => ({
          fill: 'green',
          intelligentReverseTextColor: true,
        }),
      },
    ],
    interval: [
      {
        field: 'sub_type',
        mapping: (fieldValue, data, cell) => ({
          fill: 'green',
          isCompare: true,
          maxValue: 8000,
          minValue: 300,
        }),
      },
    ],
    icon: [
      {
        field: 'number',
        position: 'left',
        mapping: (fieldValue, data, cell) => ({
          icon: 'InfoCircle',
          fill: 'green',
        }),
      },
    ],
  },
};
```
