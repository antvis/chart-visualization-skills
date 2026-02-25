# Server-Side Rendering (SSR)

## Overview

`@antv/s2-ssr` enables rendering S2 tables in Node.js environments and exporting them as PNG, JPEG, SVG, or PDF. Common use cases:

- 📧 **Email reports** — Embed table images in emails
- 🤖 **Chat bots** — Push table screenshots to DingTalk, WeCom, Lark, etc.
- 📊 **Scheduled reports** — Auto-generate data reports as images
- 🖨️ **Print services** — Generate high-resolution table images for printing

## Installation

```bash
npm install @antv/s2-ssr
```

### System Dependencies

`@antv/s2-ssr` depends on [node-canvas](https://github.com/Automattic/node-canvas), which requires Cairo and Pango:

**macOS:**
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

## Environment Setup

Before importing `@antv/s2-ssr`, set CSS module loaders (Node.js cannot natively handle CSS imports):

```javascript
require.extensions['.css'] = () => {};
require.extensions['.less'] = () => {};
require.extensions['.svg'] = () => {};
```

## Basic Usage

### Pivot Table

```javascript
require.extensions['.css'] = () => {};
require.extensions['.less'] = () => {};
require.extensions['.svg'] = () => {};

const { createSpreadsheet } = require('@antv/s2-ssr');

async function main() {
  const spreadsheet = await createSpreadsheet({
    sheetType: 'pivot',
    width: 600,
    height: 400,
    dataCfg: {
      fields: {
        rows: ['province', 'city'],
        columns: ['type'],
        values: ['price'],
      },
      data: [
        { province: 'Zhejiang', city: 'Hangzhou', type: 'Pen', price: 10 },
        { province: 'Zhejiang', city: 'Hangzhou', type: 'Paper', price: 20 },
      ],
    },
  });

  spreadsheet.exportToFile('./pivot-table.png');
  spreadsheet.destroy();
}

main();
```

### Table Sheet

```javascript
const { createSpreadsheet } = require('@antv/s2-ssr');

async function main() {
  const spreadsheet = await createSpreadsheet({
    sheetType: 'table',
    width: 500,
    height: 300,
    dataCfg: {
      fields: {
        columns: ['province', 'city', 'type', 'price'],
      },
      data: [
        { province: 'Zhejiang', city: 'Hangzhou', type: 'Pen', price: 10 },
      ],
    },
  });

  spreadsheet.exportToFile('./table-sheet.png');
  spreadsheet.destroy();
}

main();
```

## Export Formats

### PNG / JPEG

```javascript
const spreadsheet = await createSpreadsheet({
  ...options,
  imageType: 'png',  // or 'jpeg'
});
spreadsheet.exportToFile('./output.png');
```

### SVG

```javascript
const spreadsheet = await createSpreadsheet({
  ...options,
  outputType: 'svg',
});
spreadsheet.exportToFile('./output.svg');
```

### PDF

```javascript
const spreadsheet = await createSpreadsheet({
  ...options,
  outputType: 'pdf',
});
spreadsheet.exportToFile('./output.pdf');
```

## Other Export Methods

```javascript
const spreadsheet = await createSpreadsheet(options);

// Get Buffer (for uploading to OSS, sending emails, etc.)
const buffer = spreadsheet.toBuffer();

// Get Base64 DataURL (for embedding in HTML)
const dataURL = spreadsheet.toDataURL();

spreadsheet.destroy();
```

## Theme Support

SSR fully supports S2's theme system:

```javascript
// Built-in themes: 'default' | 'dark' | 'colorful' | 'gray'
const spreadsheet = await createSpreadsheet({
  ...options,
  themeCfg: {
    name: 'dark',
  },
});

// Custom theme
const spreadsheet = await createSpreadsheet({
  ...options,
  themeCfg: {
    theme: {
      cornerCell: { cell: { backgroundColor: '#1a1a2e' } },
      colCell: { cell: { backgroundColor: '#16213e' } },
    },
  },
});
```

## Configuration Reference

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| sheetType | `'pivot' \| 'table'` | `'pivot'` | Table type |
| width | `number` | - | Canvas width (pixels) |
| height | `number` | - | Canvas height (pixels) |
| autoFit | `boolean` | `true` | Auto-crop canvas to actual table size |
| dataCfg | `S2DataConfig` | - | Data configuration (same as browser) |
| options | `S2Options` | `{}` | Table options (same as browser) |
| themeCfg | `ThemeCfg` | - | Theme configuration |
| devicePixelRatio | `number` | `2` | Device pixel ratio (affects image clarity) |
| outputType | `'image' \| 'svg' \| 'pdf'` | `'image'` | Output type |
| imageType | `'png' \| 'jpeg'` | `'png'` | Image format |
| waitForRender | `number` | `100` | Wait time for render completion (ms) |

## CLI Tool

```bash
npx s2-ssr export -i data.json -o output.png
```

Where `data.json` contains the configuration:

```json
{
  "sheetType": "pivot",
  "width": 600,
  "height": 400,
  "dataCfg": {
    "fields": {
      "rows": ["province", "city"],
      "columns": ["type"],
      "values": ["price"]
    },
    "data": [
      { "province": "Zhejiang", "city": "Hangzhou", "type": "Pen", "price": 10 }
    ]
  }
}
```

## Troubleshooting

- **Blank image**: Ensure data is not empty, fields are correctly configured, and try increasing `waitForRender`.
- **Font issues**: SSR uses system fonts by default. For custom fonts, use [node-canvas registerFont](https://github.com/Automattic/node-canvas#registerFont).
- **Image clarity**: Increase `devicePixelRatio` (e.g., `3` instead of default `2`).
