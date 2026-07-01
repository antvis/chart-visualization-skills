---
name: antv-g6-graph
description: "Use this skill whenever the user wants to create, customize, or troubleshoot G6 v5 graph/network visualizations. Triggers include: any mention of 'G6', 'antv g6', '@antv/g6', 'G6 graph', 'G6 图', '网络图', '关系图', '拓扑图', '树形图', '流程图', '思维导图', '鱼骨图', '力导向图', 'force graph', 'network visualization', 'node-edge diagram', 'graph layout', 'tree layout', 'dagre layout', 'mindmap', 'social network', or requests about G6 node styles, edge types, behaviors, plugins, layouts, combos, or data structures. Also use when debugging G6 rendering errors, v4→v5 migration, or graph interaction issues. Do NOT use for G2 statistical charts, X6 editor diagrams, or S2 pivot tables."
---

# G6 v5 Graph Visualization

## Overview

G6 v5 is AntV's graph visualization engine for network diagrams, tree graphs, and relationship visualizations. It uses a **declarative configuration** style where `new Graph({...})` defines all nodes, edges, layouts, behaviors, and plugins in one constructor call.

```javascript
import { Graph } from '@antv/g6';

const graph = new Graph({
  container: 'container',
  data: {
    nodes: [{ id: 'node-1', style: { labelText: 'Node 1' } }],
    edges: [{ source: 'node-1', target: 'node-2' }],
  },
  layout: { type: 'force' },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
});

await graph.render();
```

### CDN Usage

```html
<script src="https://unpkg.com/@antv/g6@5/dist/g6.min.js"></script>
<script>
  const graph = new G6.Graph({
    container: 'container',
    data: {
      nodes: [{ id: 'node-1', style: { labelText: 'Node 1' } }],
      edges: [{ source: 'node-1', target: 'node-2' }],
    },
    layout: { type: 'force' },
    behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
  });
  graph.render();
</script>
```

## Content Retrieval

Skill content is retrieved via an antv HTTP API server using GET requests.

### `GET /api/v1/context/retrieve`

Retrieve skills by query (hybrid search = FTS + vector + RRF fusion). Setting `includeConstraints=true` will auto-prepend the library core constraints as the first result.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | ✅ | Search keywords, e.g. `force layout node` |
| `library` | string | ✅ | Library name: `g2`, `g6`, `x6` |
| `topK` | number | | Number of results to return (default: 5) |
| `content` | boolean | | Return full reference doc markdown (default: true) |
| `includeConstraints` | boolean | | Prepend core constraints as the first result (default: true) |
| `maxTokens` | number | | Max tokens per result (default: unlimited) |
| `progressiveLevel` | string | | Progressive loading level: `brief`, `normal`, `detailed` |

```bash
curl "https://antv.antgroup.com/api/v1/context/retrieve?query=force+layout+node+style&library=g6&includeConstraints=true"
```

## Critical Rules

### MUST: Use `new Graph({...})` — NOT v4 `new G6.Graph()`

```javascript
// ❌ WRONG — v4 constructor
new G6.Graph({ container: 'container', ... });

// ✅ CORRECT — v5 constructor
import { Graph } from '@antv/g6';
new Graph({ container: 'container', ... });
```

### MUST: All config in one constructor call, `await graph.render()`

```javascript
// ❌ WRONG — v4 separate data method
graph.data(data);
graph.render();

// ✅ CORRECT — v5 declarative config + async render
const graph = new Graph({
  container: 'container',
  data: { nodes: [...], edges: [...] },
  layout: { type: 'force' },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});
await graph.render();
```

### MUST: Data format with `id`, `source`, `target`

```javascript
// ❌ WRONG — missing node id, missing edge endpoints
const data = { nodes: [{ label: 'A' }], edges: [{ from: 'A', to: 'B' }] };

// ✅ CORRECT — each node has unique id, each edge has source/target
const data = {
  nodes: [{ id: 'node-1', style: { labelText: 'A' } }],
  edges: [{ source: 'node-1', target: 'node-2' }],
};
```

### MUST: Use `style.labelText` for labels — NOT `label` or `labelCfg`

```javascript
// ❌ WRONG — v4 label config
node: { labelCfg: { text: 'Node 1' } }

// ✅ CORRECT — v5 style.labelText
node: { style: { labelText: 'Node 1' } }
```

### MUST: `nodeStrength` must be ≥ 0 in force layout

```javascript
// ❌ WRONG — negative nodeStrength causes unpredictable behavior
layout: { type: 'force', nodeStrength: -300 }

// ✅ CORRECT — non-negative value
layout: { type: 'force', nodeStrength: 300 }
```

### MUST: `force` layout does NOT support `preventOverlap` / `nodeSize`

```javascript
// ❌ WRONG — v4 params silently ignored in v5
layout: { type: 'force', preventOverlap: true, nodeSize: 30 }

// ✅ CORRECT — use d3-force collide for overlap prevention
layout: { type: 'd3-force', collide: { radius: 30 } }
```

### MUST: No Mode concept — behaviors are flat array

```javascript
// ❌ WRONG — v4 mode-based behavior config
modes: { default: ['drag-canvas', 'zoom-canvas'] }

// ✅ CORRECT — v5 flat behavior array
behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element']
```

### MUST: `container` is mandatory, default `'container'`

```javascript
// ❌ WRONG — no container specified
const graph = new Graph({ data });

// ✅ CORRECT
const graph = new Graph({ container: 'container', data, ... });
```

## Quick Reference

| User Intent | Retrieve Query |
|---|---|
| Graph initialization, container, render | `GET /api/v1/context/retrieve?query=graph+init+render&library=g6` |
| Network / force graph | `GET /api/v1/context/retrieve?query=network+force+layout&library=g6` |
| Tree / mindmap / fishbone | `GET /api/v1/context/retrieve?query=tree+mindmap+fishbone+layout&library=g6` |
| Dagre / hierarchy / flow chart | `GET /api/v1/context/retrieve?query=dagre+hierarchy+flow+chart&library=g6` |
| Circular / radial / grid layout | `GET /api/v1/context/retrieve?query=circular+radial+grid+layout&library=g6` |
| Node styles (rect, circle, diamond, html) | `GET /api/v1/context/retrieve?query=node+style+rect+circle+diamond+html&library=g6` |
| Edge types (line, cubic, polyline, loop) | `GET /api/v1/context/retrieve?query=edge+line+cubic+polyline+loop&library=g6` |
| Combo / group nodes | `GET /api/v1/context/retrieve?query=combo+group+node&library=g6` |
| Custom node / edge | `GET /api/v1/context/retrieve?query=custom+node+edge+element&library=g6` |
| Behaviors (drag, zoom, click-select, hover) | `GET /api/v1/context/retrieve?query=behavior+drag+zoom+click-select+hover&library=g6` |
| Plugins (minimap, tooltip, toolbar, legend) | `GET /api/v1/context/retrieve?query=plugin+minimap+tooltip+toolbar+legend&library=g6` |
| Events system | `GET /api/v1/context/retrieve?query=events+system+click+mouse&library=g6` |
| State / style animation | `GET /api/v1/context/retrieve?query=state+animation+transform&library=g6` |
| Data structure / transforms | `GET /api/v1/context/retrieve?query=data+structure+transforms&library=g6` |
| Theme / background | `GET /api/v1/context/retrieve?query=theme+background+style&library=g6` |
| Lasso select / collapse-expand | `GET /api/v1/context/retrieve?query=lasso+collapse+expand+select&library=g6` |

## Dependencies

- `@antv/g6` — G6 v5 graph visualization engine