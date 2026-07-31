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

### CDN Usage

```html
<script src="https://unpkg.com/@antv/x6@3/dist/x6.js"></script>
<script>
  const graph = new X6.Graph({
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
</script>
```

## Content Retrieval

Skill content is retrieved via an antv HTTP API server using GET requests.

### `GET /api/v1/context/retrieve`

Retrieve skills by query (hybrid search = FTS + vector + RRF fusion). Constraints docs are indexed as regular skill documents and will appear in search results naturally.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | ✅ | Search keywords, e.g. `flowchart stencil port` |
| `library` | string | ✅ | Library name: `g2`, `g6`, `x6` |
| `topK` | number | | Number of results to return (default: 5) |
| `content` | boolean | | Return full reference doc markdown (default: true) |
| `maxTokens` | number | | Max tokens per result (default: unlimited) |
| `progressiveLevel` | number | | Progressive disclosure level: `0`=full, `1`=summary+code, `2`=summary-only |

```bash
curl "https://sive.antv.antgroup.com/api/v1/context/retrieve?query=flowchart+stencil+port&library=x6"
```

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

## Quick Reference

| User Intent | Retrieve Query |
|---|---|
| Graph init, container, background | `GET /api/v1/context/retrieve?query=graph+init+container+background&library=x6` |
| Flowchart / approval flow | `GET /api/v1/context/retrieve?query=flowchart+approval&library=x6` |
| DAG / data pipeline | `GET /api/v1/context/retrieve?query=DAG+pipeline+port&library=x6` |
| ER diagram / entity relationship | `GET /api/v1/context/retrieve?query=ER+diagram+entity+relationship&library=x6` |
| Lineage / data lineage graph | `GET /api/v1/context/retrieve?query=lineage+data+lineage&library=x6` |
| Org chart / hierarchy | `GET /api/v1/context/retrieve?query=org+chart+hierarchy&library=x6` |
| UML class diagram | `GET /api/v1/context/retrieve?query=UML+class+diagram&library=x6` |
| Node config / custom node | `GET /api/v1/context/retrieve?query=node+custom+shape+rect+circle&library=x6` |
| Edge config / router / connector | `GET /api/v1/context/retrieve?query=edge+router+connector+orth+smooth&library=x6` |
| Ports / connection桩 | `GET /api/v1/context/retrieve?query=ports+connection+layout&library=x6` |
| HTML shape node | `GET /api/v1/context/retrieve?query=html+shape+register&library=x6` |
| Stencil / drag-and-drop panel | `GET /api/v1/context/retrieve?query=stencil+drag+drop+panel&library=x6` |
| Plugin: Selection, History, Clipboard | `GET /api/v1/context/retrieve?query=Selection+History+Clipboard+plugin&library=x6` |
| Plugin: MiniMap, Scroller, Snapline | `GET /api/v1/context/retrieve?query=MiniMap+Scroller+Snapline+plugin&library=x6` |
| Plugin: Keyboard, Export, Transform | `GET /api/v1/context/retrieve?query=Keyboard+Export+Transform+plugin&library=x6` |
| Panning / mousewheel / embedding | `GET /api/v1/context/retrieve?query=panning+mousewheel+embedding&library=x6` |
| Tools (button-remove, etc.) | `GET /api/v1/context/retrieve?query=tools+button-remove+hover&library=x6` |
| Events (click,mouseenter,moved) | `GET /api/v1/context/retrieve?query=events+node+click+mouse&library=x6` |
| Serialization (toJSON, fromJSON) | `GET /api/v1/context/retrieve?query=serialization+toJSON+fromJSON&library=x6` |
| Animation / gradient | `GET /api/v1/context/retrieve?query=animation+gradient+defs+marker&library=x6` |
| Group / nesting / embedding | `GET /api/v1/context/retrieve?query=group+nesting+embedding+parent+child&library=x6` |

## Dependencies

- `@antv/x6` — X6 v3 diagram editing engine (exports `Graph` + 11 plugin classes)