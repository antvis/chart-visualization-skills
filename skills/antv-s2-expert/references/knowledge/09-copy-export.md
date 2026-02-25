# Copy & Export

## Overview

S2 provides built-in copy and export functionality. Copy writes both `text/html` and `text/plain` to the clipboard. Export supports CSV format by default. For XLSX export, use external libraries like `exceljs` or `sheetjs`.

## Copy Configuration

Configure copy behavior in `s2Options.interaction.copy`:

```ts
const s2Options = {
  interaction: {
    copy: {
      enable: true,       // enable copy (default: true)
      withFormat: true,    // use Meta formatter when copying (default: true)
      withHeader: false,   // include row/col headers in copied data (default: false)
      customTransformer: undefined, // custom data transformer
    },
  },
};
```

| Property | Description | Type | Default |
|---|---|---|---|
| `enable` | Enable copy | `boolean` | `true` |
| `withFormat` | Apply `S2DataConfig.meta` formatter when copying | `boolean` | `true` |
| `withHeader` | Include header rows/columns in copied data | `boolean` | `false` |
| `customTransformer` | Custom data format transformer | `(transformer: Transformer) => Partial<Transformer>` | - |

## Partial Copy (Keyboard Shortcut)

With copy enabled, use `Cmd/Ctrl + C` to copy selected cells. Supports single-select, multi-select, brush selection, and range selection.

```ts
const s2Options = {
  interaction: {
    copy: {
      enable: true,
      withHeader: true,
      withFormat: true,
    },
    brushSelection: { dataCell: true, rowCell: true, colCell: true },
    multiSelection: true,
  },
};
```

## Full Copy (Programmatic)

Three async API methods for getting all table data:

### asyncGetAllData

Returns both `text/plain` and `text/html` data (for clipboard):

```ts
import { asyncGetAllData, copyToClipboard } from '@antv/s2';

const data = await asyncGetAllData({
  sheetInstance: s2,
  split: '\t',
  formatOptions: true,
  // Or: formatOptions: { formatHeader: true, formatData: true }
});

// Write to clipboard
copyToClipboard(data)
  .then(() => console.log('Copy succeeded'))
  .catch(() => console.log('Copy failed'));
```

### asyncGetAllPlainData

Returns `text/plain` data only (for export):

```ts
import { asyncGetAllPlainData } from '@antv/s2';

const data = await asyncGetAllPlainData({
  sheetInstance: s2,
  split: '\t',
  formatOptions: true,
});
```

### asyncGetAllHtmlData

Returns `text/html` data only.

## API Parameters

All three methods accept `CopyAllDataParams`:

| Property | Description | Type | Default | Required |
|---|---|---|---|---|
| `sheetInstance` | S2 table instance | `SpreadSheet` | - | ✓ |
| `split` | Column separator | `string` | - | ✓ |
| `formatOptions` | Apply Meta formatting. Boolean applies to both headers and data. Object allows separate control. | `boolean \| { formatHeader?: boolean, formatData?: boolean }` | `true` | |
| `customTransformer` | Custom data format transformer | `(transformer: Transformer) => Partial<Transformer>` | - | |
| `async` | Async mode (falls back to sync if `requestIdleCallback` unsupported) | `boolean` | `true` | |

## Custom Data Transformer

Override the default `text/plain` and `text/html` output format:

```ts
import { asyncGetAllData } from '@antv/s2';

const data = await asyncGetAllData({
  sheetInstance: s2,
  split: '\t',
  formatOptions: true,
  customTransformer: () => ({
    'text/plain': (data) => ({
      type: 'text/plain',
      content: 'custom plain text',
    }),
    'text/html': (data) => ({
      type: 'text/html',
      content: '<table><tr><td>custom</td></tr></table>',
    }),
  }),
});
```

## Export to CSV

```ts
import { asyncGetAllPlainData, download } from '@antv/s2';

// Get data with comma separator for CSV
const data = await asyncGetAllPlainData({
  sheetInstance: s2,
  split: ',',
  formatOptions: true,
});

// Download as CSV file
download(data, 'filename'); // downloads filename.csv
```

## Clipboard API

### copyToClipboard

| Parameter | Description | Type | Default |
|---|---|---|---|
| `data` | Data to copy | `string` | (required) |
| `async` | Async copy | `boolean` | `true` |

### download

| Parameter | Description | Type |
|---|---|---|
| `data` | Data content | `string` (required) |
| `filename` | File name (without extension) | `string` (required) |

## Key Types

```ts
enum CopyMIMEType {
  PLAIN = 'text/plain',
  HTML = 'text/html',
}

type FormatOptions = boolean | {
  formatHeader?: boolean;
  formatData?: boolean;
};

interface Transformer {
  [CopyMIMEType.PLAIN]: (data: DataItem[][], separator?: string) => CopyablePlain;
  [CopyMIMEType.HTML]: (data: DataItem[][]) => CopyableHTML;
}
```

## Special Character Handling

Per CSV spec and Excel rules:
1. **Field wrapping**: Fields containing `,`, `"`, `\r`, `\n`, or `\t` are wrapped in double quotes.
2. **Quote escaping**: Double quotes `"` inside fields become `""`.
3. **Newlines**: Standalone `\n` is replaced with `\r\n` for Excel compatibility.
