# Custom Icons

## Built-in Icons

S2 provides built-in icons. Icon colors default to match text color and follow the theme configuration.

| Icon Name | Description | Icon Name | Description |
|-----------|-------------|-----------|-------------|
| CellDown | Decrease indicator | ExpandColIcon | Expand column header |
| CellUp | Increase indicator | Plus | Tree table expand |
| GlobalAsc | Global ascending | Minus | Tree table collapse |
| GlobalDesc | Global descending | SortDown | Sort descending |
| GroupAsc | Group ascending | SortDownSelected | Sort descending (selected) |
| GroupDesc | Group descending | SortUp | Sort ascending |
| Trend | Trend chart | SortUpSelected | Sort ascending (selected) |
| ArrowUp | Value increase | ArrowDown | Value decrease |
| DrillDownIcon | Drill down | | |

## Registering Custom Icons (CustomSVGIcon)

Register custom SVG icons via `s2Options.customSVGIcons`:

| Property | Description | Type | Required |
|----------|-------------|------|----------|
| name | Icon name (built-in or custom) | `string` | ✓ |
| src | SVG string in one of 3 formats: base64, local SVG file, or online image URL (online URLs don't support color replacement) | `string` | ✓ |

```ts
const s2Options = {
  customSVGIcons: [
    {
      name: 'MyCustomIcon',
      src: 'data:image/svg+xml;base64,...', // or SVG string or URL
    },
  ],
};
```

## Header Action Icons (HeaderActionIcon)

Register custom action icons for row, column, and corner header cells via `s2Options.headerActionIcons`:

| Property | Description | Type | Default | Required |
|----------|-------------|------|---------|----------|
| icons | Registered icon names. String form defaults position to `'right'`. Object form allows specifying position. | `string[]` \| `{name: string, position: 'right' \| 'left'}[]` | | ✓ |
| belongsCell | Cell types to attach icons to | `string[]` | | ✓ |
| defaultHide | Show icon only on hover | `boolean \| (meta: Node, iconName: string) => boolean` | `false` | |
| displayCondition | Filter which cells show the icon. Return `true` to show. | `(meta: Node, iconName: string) => boolean` | | |
| onClick | Click handler | `(headerIconClickParams: HeaderIconClickParams) => void` | | |
| onHover | Hover start/end handler | `(headerIconHoverParams: HeaderIconHoverParams) => void` | | |

### belongsCell Values

- `'cornerCell'` — Corner header
- `'colCell'` — Column header
- `'rowCell'` — Row header

### HeaderIconClickParams

| Property | Description | Type |
|----------|-------------|------|
| iconName | Current icon name | `string` |
| meta | Cell meta (Node) | `Node` |
| event | Click event | `Event` |

## Usage Examples

### Basic Header Action Icon

```ts
const s2Options = {
  headerActionIcons: [
    {
      icons: ['SortDown'],
      belongsCell: ['colCell'],
      defaultHide: true,
      onClick: ({ iconName, meta, event }) => {
        console.log('Clicked icon:', iconName, 'on cell:', meta);
      },
    },
  ],
};
```

### Icons with Position Control

```ts
const s2Options = {
  headerActionIcons: [
    {
      icons: [
        { name: 'SortUp', position: 'left' },
        { name: 'SortDown', position: 'right' },
      ],
      belongsCell: ['colCell'],
    },
  ],
};
```

### Conditional Icon Display

```ts
const s2Options = {
  headerActionIcons: [
    {
      icons: ['Trend'],
      belongsCell: ['rowCell'],
      displayCondition: (meta, iconName) => {
        // Only show on leaf nodes
        return meta.isLeaf;
      },
      defaultHide: (meta, iconName) => {
        // Show on hover only for non-leaf nodes
        return !meta.isLeaf;
      },
    },
  ],
};
```

### Custom Icon Registration + Header Action

```ts
const s2Options = {
  customSVGIcons: [
    {
      name: 'Filter',
      src: '<svg>...</svg>',
    },
  ],
  headerActionIcons: [
    {
      icons: ['Filter'],
      belongsCell: ['colCell'],
      onClick: ({ meta }) => {
        console.log('Filter clicked for:', meta.field);
      },
    },
  ],
};
```

## Icon in Conditions

Icons can also be displayed via field marking conditions (see conditions documentation):

```ts
const s2Options = {
  conditions: {
    icon: [
      {
        field: 'price',
        position: 'left',
        mapping(fieldValue) {
          return {
            icon: 'CellUp',
            fill: '#30BF78',
          };
        },
      },
    ],
  },
};
```

When both condition icons and header action icons exist, the layout order is:
- `[header action icons] [condition icon] [text]` (condition icon position: left)
- `[text] [condition icon] [header action icons]` (condition icon position: right)
