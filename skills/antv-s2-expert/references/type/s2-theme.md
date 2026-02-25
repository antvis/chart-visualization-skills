# S2Theme

Theme configuration.

```ts
// Set theme schema, palette, and name together
s2.setThemeCfg({
  theme: {},
  palette: {},
  name: "default"
});

// Set theme schema individually, configure cell background, font size, font color
s2.setTheme({
  rowCell: {
    cell: {
      backgroundColor: "#fff"
    }
  }
});
```

## ThemeCfg

Table theme configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| theme | [S2Theme](#s2theme) | | - | Theme schema |
| palette | [Palette](#palette) | | - | Color palette |
| name | [ThemeName](#themename) | | `default` | Theme name |

### ThemeName

Table theme name.

| Value | Description |
| --- | --- |
| `default` | Default |
| `colorful` | Colorful Blue |
| `gray` | Simple Gray |
| `dark` | Dark |

### Palette

Theme color palette.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| brandColor | `string` | ✓ | - | Palette brand/primary color |
| basicColors | `string[]` | ✓ | - | Basic colors |
| basicColorRelations | `Array<{ basicColorIndex: number; standardColorIndex: number }>` | ✓ | - | Mapping relationship between basicColors and standard palette array indices |
| semanticColors | `Record<string, string>` | ✓ | - | Colors representing actual business semantics, e.g., built-in "red down green up" |
| others | `Record<string, string>` | | - | Additional business semantic colors |

## S2Theme

Table theme schema.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| cornerCell | [DefaultCellTheme](#defaultcelltheme) | | | Corner header cell theme |
| rowCell | [DefaultCellTheme](#defaultcelltheme) | | | Row header cell theme |
| colCell | [DefaultCellTheme](#defaultcelltheme) | | | Column header cell theme |
| dataCell | [DefaultCellTheme](#defaultcelltheme) | | | Data cell theme |
| resizeArea | [ResizeArea](#resizearea) | | | Column width / row height resize hot area |
| scrollBar | [ScrollBarTheme](#scrollbartheme) | | | Scrollbar style |
| splitLine | [SplitLine](#splitline) | | | Cell split line style |
| prepareSelectMask | [InteractionStateTheme](#interactionstatetheme) | | | Brush selection mask style |
| background | [Background](#background) | | | Background style |
| preview | [PreviewTheme](#previewtheme) | | | Image/video preview style |
| empty | [Empty](#empty) | | | Empty data placeholder style (detail table only) |
| [key: string] | `unknown` | | | Extra property fields for custom theme parameters |

### DefaultCellTheme

Default cell theme.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| bolderText | [TextTheme](#texttheme) | | - | Bold text style (e.g., grand total, subtotal, non-leaf row/column header text) |
| text | [TextTheme](#texttheme) | | - | Text style (e.g., data values, leaf row/column header text) |
| seriesText | [TextTheme](#texttheme) | | - | Series number text style |
| measureText | [TextTheme](#texttheme) | | - | Measure value text style (e.g., virtual value cell text for row/column/corner headers when values are on row/column) |
| cell | [CellTheme](#celltheme) | | - | Cell style |
| icon | [IconTheme](#icontheme) | | - | Icon style |
| seriesNumberWidth | `number` | | `80` | Series number column width |
| miniChart | [MiniChartTheme](#minicharttheme) | | | Mini chart style |

### ResizeArea

Column width / row height drag resize hot area style.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| size | `number` | | `3` | Hot area size |
| background | `string` | | - | Hot area background color |
| backgroundOpacity | `number` | | - | Hot area background opacity |
| guideLineColor | `string` | | - | Guide line color |
| guideLineDash | `number[]` | | `[3, 3]` | Hot area guide line dash pattern |
| interactionState | [InteractionStateTheme](#interactionstatetheme) | | - | Hot area interaction state style |

### ScrollBarTheme

Scrollbar style.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| trackColor | `string` | | `rgba(0,0,0,0)` | Scrollbar track color |
| thumbHoverColor | `string` | | `rgba(0,0,0,0.4)` | Scrollbar thumb hover color |
| thumbColor | `string` | | `rgba(0,0,0,0.15)` | Scrollbar thumb color |
| thumbHorizontalMinSize | `number` | | `32` | Scrollbar horizontal minimum size (useful for large datasets) |
| thumbVerticalMinSize | `number` | | `32` | Scrollbar vertical minimum size (useful for large datasets) |
| size | `number` | | Mobile: `3`, PC: `6` | Scrollbar size |
| hoverSize | `number` | | `16` | Scrollbar size on hover |
| lineCap | `"butt" \| "round" \| "square"` | | `round` | Specifies how line segment ends are drawn |

### SplitLine

Split line style.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| horizontalBorderColor | `string` | | `basicColors[12]` | Horizontal split line color |
| horizontalBorderColorOpacity | `number` | | `0.2` | Horizontal split line color opacity |
| horizontalBorderWidth | `number` | | `2` | Horizontal split line width |
| verticalBorderColor | `string` | | `basicColors[11]` | Vertical split line color |
| verticalBorderColorOpacity | `number` | | `0.25` | Vertical split line color opacity |
| verticalBorderWidth | `number` | | `2` | Vertical split line width |
| showShadow | `boolean` | | `true` | Whether to show outer shadow on split line (for frozen row/column scenarios) |
| shadowWidth | `number` | | `8` | Shadow width |
| shadowColors | `{ left: string, right: string }` | | `{ left: 'rgba(0,0,0,0.1)', right: 'rgba(0,0,0,0)' }` | Linear gradient shadow colors |
| borderDash | `number \| string \| (string \| number)[]` | | `[]` | Split line dash pattern |

### TextTheme

Text theme.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| textAlign | `"left" \| "center" \| "right"` | | - | Text content alignment |
| textBaseline | `"top" \| "middle" \| "bottom"` | | - | Text drawing baseline |
| fontFamily | `string` | | `Roboto, PingFangSC, Microsoft YaHei, Arial, sans-serif` | Font family. **Use monospace fonts if each character needs equal width.** Avoid `-apple-system` or `BlinkMacSystemFont` on Mac/iOS (may cause browser freeze) |
| fontSize | `number` | | - | Font size |
| fontWeight | `number \| string` | | Bold: Mobile `520` / PC `bold`; Normal: `normal` | Font weight. String options: `normal`, `bold`, `bolder`, `lighter` |
| fontStyle | `"normal" \| "italic" \| "oblique"` | | `normal` | Font style |
| fontVariant | `"normal" \| "small-caps" \| string` | | `normal` | Font variant |
| fill | `string` | | - | Font color |
| linkTextFill | `string` | | - | Link text color |
| opacity | `number` | | `1` | Font opacity |

### CellTheme

Cell common theme.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| crossBackgroundColor | `string` | | - | Odd-row cell background color |
| backgroundColor | `string` | | - | Cell background color (default zebra stripe effect; set `crossBackgroundColor` and `backgroundColor` to the same color to disable) |
| backgroundColorOpacity | `number` | | `1` | Cell background color opacity |
| horizontalBorderColor | `string` | | - | Cell horizontal border color |
| horizontalBorderColorOpacity | `number` | | `1` | Cell horizontal border color opacity |
| horizontalBorderWidth | `number` | | - | Cell horizontal border width |
| verticalBorderColor | `string` | | - | Cell vertical border color |
| verticalBorderColorOpacity | `number` | | `1` | Cell vertical border color opacity |
| verticalBorderWidth | `number` | | - | Cell vertical border width |
| padding | [Padding](#margin--padding) | | - | Cell padding |
| interactionState | `Record<InteractionStateName, InteractionStateTheme>` | | - | Cell interaction states |
| borderDash | `number \| string \| (string \| number)[]` | | `[]` | Cell border dash pattern |

### IconTheme

Icon common theme.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| fill | `string` | | - | Icon fill color |
| size | `number` | | - | Icon size |
| margin | [Margin](#margin--padding) | | - | Icon margin |

### InteractionStateName

Interaction state names for theme configuration.

```ts
s2.setTheme({
  dataCell: {
    cell: {
      interactionState: {
        hoverFocus: {},
        selected: {},
        prepareSelect: {}
      }
    }
  }
})
```

| State | Description |
| --- | --- |
| hover | Hover |
| hoverFocus | Hover focus |
| selected | Selected |
| unselected | Unselected |
| searchResult | Search result |
| highlight | Highlight |
| prepareSelect | Prepare select |

### InteractionStateTheme

Interaction state theme styling applied to each state above.

### Margin | Padding

Icon margin, cell padding.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| top | `number` | | | Top |
| right | `number` | | | Right |
| bottom | `number` | | | Bottom |
| left | `number` | | | Left |

### Background

Background configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| color | `string` | | - | Color |
| opacity | `number` | | `1` | Opacity |

### Empty

Empty data placeholder style configuration (detail table only).

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| icon | `Omit<IconTheme, 'size'> & { width: number, height: number }` | | `{ fill: '', width: 64, height: 41, margin: { top: 0, right: 0, bottom: 24, left: 0 } }` | Icon style |
| text | [TextTheme](#texttheme) | | `{ fontSize: 12, fontWeight: 'normal', opacity: 1 }` | Text style |

### MiniChartTheme

Mini chart configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| line | [LineTheme](#linetheme) | | | Line chart style |
| bar | [BarTheme](#bartheme) | | | Bar chart style |
| bullet | [BulletTheme](#bullettheme) | | | Bullet chart style |
| interval | [IntervalTheme](#intervaltheme) | | | Interval chart style |

#### LineTheme

Mini line chart style.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| point | `{ size: number; fill?: number; opacity?: number }` | | | Line chart point configuration |
| linkLine | `{ size: number; fill: number; opacity: number }` | | | Line chart line configuration |

#### BarTheme

Mini bar chart style.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| intervalPadding | `number` | | | Spacing between bars |
| fill | `string` | | | Fill color |
| opacity | `number` | | | Opacity |

#### BulletTheme

Mini bullet chart style.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| progressBar | [ProgressBar](#progressbar) | | | Progress bar style |
| comparativeMeasure | [ComparativeMeasure](#comparativemeasure) | | | Comparative measure marker line |
| rangeColors | [RangeColors](#rangecolors) | | | Bullet chart state colors |
| backgroundColor | `string` | | | Bullet chart background color |

##### ProgressBar

Mini bullet chart progress bar style.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| widthPercent | `number` | | | Bullet chart width as a decimal percentage relative to cell content |
| height | `number` | | | Height |
| innerHeight | `number` | | | Inner height |

##### ComparativeMeasure

Mini bullet chart comparative measure marker line style.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| width | `number` | | | Width |
| height | `number` | | | Height |
| fill | `string` | | | Fill color |
| opacity | `number` | | | Opacity |

##### RangeColors

Mini bullet chart state color configuration.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| good | `string` | | | Good / Satisfactory |
| satisfactory | `string` | | | Moderate / Acceptable |
| bad | `string` | | | Bad / Below expectations |

#### IntervalTheme

Mini interval bar style (for conditional formatting).

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| height | `number` | | | Bar height |
| fill | `string` | | | Fill color |

### PreviewTheme

Image/video preview style.

| Property | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| overlay | `CSSProperties` | | | Preview overlay mask style |
| mediaContainer | `CSSProperties` | | | Preview image/video container style |
