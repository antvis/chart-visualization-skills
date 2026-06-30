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

## Quick Reference

| User Intent | Retrieve Query |
|---|---|
| Graph initialization, container, render | `POST /api/v1/context {"query":"graph init render","library":"g6","topK":3,"content":true}` |
| Network / force graph | `POST /api/v1/context {"query":"network force layout","library":"g6","topK":5,"content":true}` |
| Tree / mindmap / fishbone | `POST /api/v1/context {"query":"tree mindmap fishbone layout","library":"g6","topK":5,"content":true}` |
| Dagre / hierarchy / flow chart | `POST /api/v1/context {"query":"dagre hierarchy flow chart","library":"g6","topK":5,"content":true}` |
| Circular / radial / grid layout | `POST /api/v1/context {"query":"circular radial grid layout","library":"g6","topK":5,"content":true}` |
| Node styles (rect, circle, diamond, html) | `POST /api/v1/context {"query":"node style rect circle diamond html","library":"g6","topK":5,"content":true}` |
| Edge types (line, cubic, polyline, loop) | `POST /api/v1/context {"query":"edge line cubic polyline loop","library":"g6","topK":5,"content":true}` |
| Combo / group nodes | `POST /api/v1/context {"query":"combo group node","library":"g6","topK":3,"content":true}` |
| Custom node / edge | `POST /api/v1/context {"query":"custom node edge element","library":"g6","topK":3,"content":true}` |
| Behaviors (drag, zoom, click-select, hover) | `POST /api/v1/context {"query":"behavior drag zoom click-select hover","library":"g6","topK":5,"content":true}` |
| Plugins (minimap, tooltip, toolbar, legend) | `POST /api/v1/context {"query":"plugin minimap tooltip toolbar legend","library":"g6","topK":5,"content":true}` |
| Events system | `POST /api/v1/context {"query":"events system click mouse","library":"g6","topK":3,"content":true}` |
| State / style animation | `POST /api/v1/context {"query":"state animation transform","library":"g6","topK":3,"content":true}` |
| Data structure / transforms | `POST /api/v1/context {"query":"data structure transforms","library":"g6","topK":3,"content":true}` |
| Theme / background | `POST /api/v1/context {"query":"theme background style","library":"g6","topK":3,"content":true}` |
| Lasso select / collapse-expand | `POST /api/v1/context {"query":"lasso collapse expand select","library":"g6","topK":3,"content":true}` |
| Library constraints (MUST read first) | `POST /info {"library":"g6"}` |

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

## Content Retrieval

Skill content is retrieved via a local HTTP API server.

Then use POST requests to retrieve relevant reference docs:

```bash
# Retrieve skills by query (hybrid search = FTS + vector + RRF)
curl -X POST https://antv.antgroup.com/api/v1/context \
  -H 'Content-Type: application/json' \
  -d '{"query":"force layout node style","library":"g6","topK":5,"content":true,"includeInfo":true}'

# Get core constraints (always read first before generating code)
curl -X POST https://antv.antgroup.com/api/v1/info \
  -H 'Content-Type: application/json' \
  -d '{"library":"g6"}'

# Get a specific skill by exact ID
curl -X POST https://antv.antgroup.com/api/v1/get \
  -H 'Content-Type: application/json' \
  -d '{"id":"g6-core-graph-init"}'

# List all available skills
curl -X POST https://antv.antgroup.com/api/v1/list \
  -H 'Content-Type: application/json' \
  -d '{"library":"g6"}'
```

**Important**: Always call `/api/v1/info` first to load the core constraints, then `/api/v1/context` for specific topic docs. The `includeInfo: true` option in `/api/v1/context` automatically prepends constraints as the first result.

## How to Use

When a user asks about G6 graph development:

1. Call `POST /api/v1/info {"library":"g6"}` to load the core constraints
2. Identify the user's intent from the Quick Reference table above
3. Call `POST /api/v1/context` with the matching query, `content: true`, `includeInfo: true`
4. Generate code following the Critical Rules and retrieved reference docs
5. Always provide complete, runnable code examples

## Dependencies

- `@antv/g6` — G6 v5 graph visualization engine