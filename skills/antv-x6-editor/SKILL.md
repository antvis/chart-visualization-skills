---
name: antv-x6-editor
description: "Use this skill whenever the user wants to create, customize, or troubleshoot X6 v3 graph editor diagrams. Triggers include: any mention of 'X6', 'antv x6', '@antv/x6', 'X6 editor', 'X6 图编辑', '流程图', 'DAG', 'ER图', '实体关系图', '血缘图', '组织架构图', 'UML类图', 'flowchart', 'DAG diagram', 'ER diagram', 'lineage graph', 'org chart', 'network topology', 'stencil', 'drag-and-drop editor', 'port connection', 'node port edge', 'graph editor', 'diagram editor', or requests about X6 node/edge styling, plugins (Selection, History, Clipboard, Keyboard, MiniMap, Scroller, Snapline, Stencil, Dnd, Transform, Export), interactions (panning, mousewheel, connecting, embedding), HTML shape nodes, custom shapes, serialization, or layout. Also use when debugging X6 rendering errors, v2→v3 migration, or editor interaction issues. Do NOT use for G2 statistical charts, G6 network graphs, or S2 pivot tables."
---

# X6 v3 Graph Editor

## Overview

X6 v3 is AntV's diagram editing engine for flowcharts, DAGs, ER diagrams, org charts, and other interactive node-edge editors. Unlike G2/G6, X6 uses an **imperative API** — you create a `Graph` instance, then call `graph.addNode()`, `graph.addEdge()`, and register plugins via `graph.use()`.

```javascript
import { Graph } from '@antv/x6';

const graph = new Graph({
  container: 'container',
  background: { color: '#F2F7FA' },
});

const source = graph.addNode({
  shape: 'rect',
  x: 40, y: 40, width: 100, height: 40,
  label: 'Source',
  attrs: { body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 } },
});

const target = graph.addNode({
  shape: 'rect',
  x: 300, y: 200, width: 100, height: 40,
  label: 'Target',
  attrs: { body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 } },
});

graph.addEdge({ source, target, attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1 } } });
graph.centerContent();
```

## Quick Reference

| User Intent | Retrieve Query |
|---|---|
| Graph init, container, background | `POST /api/v1/context {"query":"graph init container background","library":"x6","topK":3,"content":true}` |
| Flowchart / approval flow | `POST /api/v1/context {"query":"flowchart approval","library":"x6","topK":5,"content":true}` |
| DAG / data pipeline | `POST /api/v1/context {"query":"DAG pipeline port","library":"x6","topK":5,"content":true}` |
| ER diagram / entity relationship | `POST /api/v1/context {"query":"ER diagram entity relationship","library":"x6","topK":5,"content":true}` |
| Lineage / data lineage graph | `POST /api/v1/context {"query":"lineage data lineage","library":"x6","topK":5,"content":true}` |
| Org chart / hierarchy | `POST /api/v1/context {"query":"org chart hierarchy","library":"x6","topK":5,"content":true}` |
| UML class diagram | `POST /api/v1/context {"query":"UML class diagram","library":"x6","topK":5,"content":true}` |
| Node config / custom node | `POST /api/v1/context {"query":"node custom shape rect circle","library":"x6","topK":5,"content":true}` |
| Edge config / router / connector | `POST /api/v1/context {"query":"edge router connector orth smooth","library":"x6","topK":5,"content":true}` |
| Ports / connection桩 | `POST /api/v1/context {"query":"ports connection layout","library":"x6","topK":5,"content":true}` |
| HTML shape node | `POST /api/v1/context {"query":"html shape register","library":"x6","topK":3,"content":true}` |
| Stencil / drag-and-drop panel | `POST /api/v1/context {"query":"stencil drag drop panel","library":"x6","topK":3,"content":true}` |
| Plugin: Selection, History, Clipboard | `POST /api/v1/context {"query":"Selection History Clipboard plugin","library":"x6","topK":3,"content":true}` |
| Plugin: MiniMap, Scroller, Snapline | `POST /api/v1/context {"query":"MiniMap Scroller Snapline plugin","library":"x6","topK":3,"content":true}` |
| Plugin: Keyboard, Export, Transform | `POST /api/v1/context {"query":"Keyboard Export Transform plugin","library":"x6","topK":3,"content":true}` |
| Panning / mousewheel / embedding | `POST /api/v1/context {"query":"panning mousewheel embedding","library":"x6","topK":3,"content":true}` |
| Tools (button-remove, etc.) | `POST /api/v1/context {"query":"tools button-remove hover","library":"x6","topK":3,"content":true}` |
| Events (click,mouseenter,moved) | `POST /api/v1/context {"query":"events node click mouse","library":"x6","topK":3,"content":true}` |
| Serialization (toJSON, fromJSON) | `POST /api/v1/context {"query":"serialization toJSON fromJSON","library":"x6","topK":3,"content":true}` |
| Animation / gradient | `POST /api/v1/context {"query":"animation gradient defs marker","library":"x6","topK":3,"content":true}` |
| Group / nesting / embedding | `POST /api/v1/context {"query":"group nesting embedding parent child","library":"x6","topK":3,"content":true}` |
| Library constraints (MUST read first) | `POST /api/v1/info {"library":"x6"}` |

## Critical Rules

### MUST: `graph.render()` does NOT exist in X6 v3

```javascript
// ❌ WRONG — graph.render() is G6 API, not X6
const graph = new Graph({ container: 'container' });
graph.render();

// ✅ CORRECT — X6 auto-renders on addNode/addEdge/fromJSON
const graph = new Graph({ container: 'container', background: { color: '#F2F7FA' } });
graph.addNode({ shape: 'rect', x: 40, y: 40, width: 100, height: 40 });
```

### MUST: Use string literal `container: 'container'` — no variable declaration

```javascript
// ❌ WRONG — declaring container variable is forbidden
const container = document.getElementById('container');
const graph = new Graph({ container });

// ✅ CORRECT — string literal, runtime auto-resolves
const graph = new Graph({ container: 'container', background: { color: '#F2F7FA' } });
```

### MUST: Register plugins before using their methods

```javascript
// ❌ WRONG — calling plugin method without registration
graph.toPNG();       // Error: method not found
graph.select();      // Error: method not found

// ✅ CORRECT — register first, then call
import { Graph, Export, Selection } from '@antv/x6';
const graph = new Graph({ container: 'container', background: { color: '#F2F7FA' } });
graph.use(new Export());
graph.use(new Selection({ enabled: true, rubberband: true }));
// Now graph.toPNG() and graph.select() are available
```

### MUST: Only 11 plugin classes exist — NOT constructor options

| ✅ Plugin class (import + `graph.use`) | ❌ NOT a plugin (constructor option) |
|---|---|
| `Clipboard`, `Dnd`, `Export`, `History`, `Keyboard`, `MiniMap`, `Scroller`, `Selection`, `Snapline`, `Stencil`, `Transform` | `mousewheel`, `embedding`, `panning`, `connecting`, `translating`, `interacting`, `background`, `grid` |

```javascript
// ❌ WRONG — importing constructor option as "plugin"
import { Graph, Embedding } from '@antv/x6';  // Embedding doesn't exist!
graph.use(new Embedding());                   // Error: not a constructor

// ✅ CORRECT — embedding is a Graph constructor option
import { Graph, Selection } from '@antv/x6';
const graph = new Graph({
  container: 'container',
  embedding: { enabled: true, findParent: 'bbox' },
  mousewheel: { enabled: true, zoomAtMousePosition: true, modifiers: ['ctrl'] },
});
graph.use(new Selection({ enabled: true, rubberband: true }));
```

### MUST: All used classes MUST appear in import statement

```javascript
// ❌ WRONG — Selection used but not imported
import { Graph } from '@antv/x6';
graph.use(new Selection({...}));  // falls back to window.Selection → Illegal constructor

// ✅ CORRECT — every used class imported
import { Graph, Selection, Keyboard, History } from '@antv/x6';
graph.use(new Selection({ enabled: true, rubberband: true }));
graph.use(new Keyboard({ enabled: true }));
graph.use(new History({ enabled: true }));
```

### MUST: Always call `graph.centerContent()` after adding nodes/edges

```javascript
// ❌ WRONG — no centerContent, content drifts to top-left
graph.addNode({ ... });
graph.addEdge({ ... });

// ✅ CORRECT — content centered after all additions
graph.addNode({ ... });
graph.addEdge({ ... });
graph.centerContent();
// OR: graph.zoomToFit({ padding: 20, maxScale: 1 }) — but NOT both
```

### MUST: Always set background color, default node/edge style

```javascript
// ❌ WRONG — no background, no default styles
const graph = new Graph({ container: 'container' });

// ✅ CORRECT — mandatory background + default styles
const graph = new Graph({ container: 'container', background: { color: '#F2F7FA' } });
graph.addNode({
  shape: 'rect', x: 40, y: 40, width: 100, height: 40,
  label: 'Node',
  attrs: { body: { stroke: '#8f8f8f', strokeWidth: 1, fill: '#fff', rx: 6, ry: 6 } },
});
graph.addEdge({
  source: 'node-1', target: 'node-2',
  attrs: { line: { stroke: '#8f8f8f', strokeWidth: 1 } },
});
```

### MUST: `mousewheel`, `panning`, `Selection.rubberband` — use modifiers to avoid conflicts

```javascript
// ❌ WRONG — panning and mousewheel both grab scroll events
const graph = new Graph({
  panning: { enabled: true },
  mousewheel: { enabled: true },
});
graph.use(new Selection({ enabled: true, rubberband: true }));

// ✅ CORRECT — modifiers separate the interactions
const graph = new Graph({
  panning: { enabled: true, eventTypes: ['leftMouseDown'], modifiers: 'shift' },
  mousewheel: { enabled: true, zoomAtMousePosition: true, modifiers: ['ctrl'] },
});
graph.use(new Selection({ enabled: true, rubberband: true }));
```

### MUST: Output pure JavaScript — NO TypeScript syntax

```javascript
// ❌ WRONG — TypeScript syntax
private width: number = 100;
const node: Node = graph.addNode({...}) as Node;

// ✅ CORRECT — pure JavaScript only
const node = graph.addNode({ shape: 'rect', x: 40, y: 40 });
```

### MUST: `Shape.HTML.register` for HTML nodes — NOT `class extends Node`

```javascript
// ❌ WRONG — class-based HTML node (2.x pattern)
class MyNode extends Node { ... }

// ✅ CORRECT — Shape.HTML.register (3.x pattern)
import { Graph, Shape } from '@antv/x6';
Shape.HTML.register({
  shape: 'my-html',
  effect: ['data'],
  html(node) {
    const div = document.createElement('div');
    div.innerHTML = node.getData().content || '';
    return div;
  },
});
```

## Content Retrieval

Skill content is retrieved via a local HTTP API server. Start the server first:

```bash
cd http-server && npm run dev    # starts on http://localhost:3100
```

Then use POST requests to retrieve relevant reference docs:

```bash
# Retrieve skills by query (hybrid search = FTS + vector + RRF)
curl -X POST https://antv.antgroup.com/api/v1/context \
  -H 'Content-Type: application/json' \
  -d '{"query":"flowchart stencil port","library":"x6","topK":5,"content":true,"includeInfo":true}'

# Get core constraints (always read first before generating code)
curl -X POST https://antv.antgroup.com/api/v1/info \
  -H 'Content-Type: application/json' \
  -d '{"library":"x6"}'

# Get a specific skill by exact ID
curl -X POST https://antv.antgroup.com/api/v1/get \
  -H 'Content-Type: application/json' \
  -d '{"id":"x6-core-graph-init"}'

# List all available skills
curl -X POST https://antv.antgroup.com/api/v1/list \
  -H 'Content-Type: application/json' \
  -d '{"library":"x6"}'
```

**Important**: Always call `/api/v1/info` first to load the core constraints, then `/api/v1/context` for specific topic docs. The `includeInfo: true` option in `/api/v1/context` automatically prepends constraints as the first result.

## How to Use

When a user asks about X6 diagram editor development:

1. Call `POST /api/v1/info {"library":"x6"}` to load the core constraints
2. Identify the user's intent from the Quick Reference table above
3. Call `POST /api/v1/context` with the matching query, `content: true`, `includeInfo: true`
4. Generate code following the Critical Rules and retrieved reference docs
5. Always provide complete, runnable code examples

## Dependencies

- `@antv/x6` — X6 v3 diagram editing engine (exports `Graph` + 11 plugin classes)