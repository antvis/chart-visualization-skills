# Pagination

## Overview

S2 has built-in frontend pagination rendering. It handles data slicing internally but does **not** provide a pagination UI component — you need to implement or integrate one yourself (e.g., Ant Design's `Pagination` component).

## Configuration

Set the `pagination` property in `s2Options`:

```ts
const s2Options = {
  width: 600,
  height: 480,
  pagination: {
    pageSize: 4,   // rows per page
    current: 1,    // current page (1-based)
  },
};
```

## Pagination Type

| Property | Description | Type | Default | Required |
|---|---|---|---|---|
| `pageSize` | Number of rows per page | `number` | - | ✓ |
| `current` | Current page number (starts from 1) | `number` | `1` | ✓ |
| `total` | Total number of data items (read-only, set by S2 internally) | `number` | - | |

## React Integration Example

Combine S2's pagination config with a UI pagination component:

```tsx
import React, { useState } from 'react';
import { SheetComponent } from '@antv/s2-react';
import { Pagination } from 'antd';

function PaginatedTable({ dataCfg }) {
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const s2Options = {
    width: 600,
    height: 480,
    pagination: {
      pageSize,
      current,
    },
  };

  return (
    <div>
      <SheetComponent
        dataCfg={dataCfg}
        options={s2Options}
        onMounted={(instance) => {
          setTotal(instance.facet.viewCellHeights.getTotalLength());
        }}
      />
      <Pagination
        current={current}
        pageSize={pageSize}
        total={total}
        onChange={(page, size) => {
          setCurrent(page);
          setPageSize(size);
        }}
      />
    </div>
  );
}
```

## Vanilla JS Example

```ts
import { PivotSheet } from '@antv/s2';

const s2Options = {
  width: 600,
  height: 480,
  pagination: {
    pageSize: 5,
    current: 1,
  },
};

const s2 = new PivotSheet(container, s2DataConfig, s2Options);
await s2.render();

// Change page
function goToPage(page) {
  s2.updatePagination({
    current: page,
    pageSize: 5,
  });
  s2.render(false); // re-render without reinitializing
}
```

## Notes

- Pagination is **frontend-only** — all data is loaded upfront; S2 just renders the current page slice.
- For server-side pagination, manage `data` externally and update `s2DataConfig.data` when the page changes.
- The `total` field in pagination is typically read from the rendered result rather than set manually.
