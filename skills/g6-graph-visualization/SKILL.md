---
name: g6-graph-visualization
description: Create interactive graph and network visualizations using G6. Use when users need to visualize relationships, networks, hierarchies, or any node-link diagram such as social networks, knowledge graphs, organizational charts, or dependency graphs.
---

# G6 Graph Visualization Skill

This skill provides graph and network visualization capabilities using AntV G6. G6 is a powerful graph visualization engine designed for relational data analysis with support for various layouts, interactions, and animations.

## Overview

G6 (Graph Visualization) is designed for:
- **Network Analysis**: Social networks, citation networks, communication networks
- **Knowledge Graphs**: Entity relationships, semantic networks
- **Organizational Charts**: Company structures, team hierarchies
- **Dependency Graphs**: Software dependencies, workflow diagrams
- **Tree Structures**: File systems, taxonomies, decision trees

## Workflow

To create graph visualizations, follow these steps:

### 1. Understand the Requirements

Analyze the user's request to determine:
- The type of graph structure (tree, network, DAG, etc.)
- Node and edge data
- Layout algorithm needed
- Interaction requirements
- Visual styling preferences

### 2. Choose Graph Type and Layout

**Graph Types**:
- **Tree Graph**: Hierarchical structures with parent-child relationships
- **General Graph**: Any network with nodes and edges
- **Flow Graph**: Directed acyclic graphs (DAG)

**Layout Algorithms**:
- **Force**: Physics-based layout for general networks
- **Dagre**: Hierarchical layout for directed graphs
- **Circular**: Nodes arranged in a circle
- **Radial**: Radial tree layout
- **Concentric**: Concentric circles based on node importance
- **Grid**: Grid-based arrangement
- **MDS**: Multi-dimensional scaling
- **Fruchterman**: Force-directed layout variant
- **Combo**: Support for node grouping

### 3. Prepare Data Structure

```javascript
const data = {
  nodes: [
    { id: 'node1', label: 'Node 1', type: 'circle' },
    { id: 'node2', label: 'Node 2', type: 'rect' },
    { id: 'node3', label: 'Node 3', type: 'ellipse' }
  ],
  edges: [
    { source: 'node1', target: 'node2', label: 'Edge 1' },
    { source: 'node2', target: 'node3', label: 'Edge 2' }
  ]
};
```

### 4. Generate HTML Visualization

Create a complete HTML file with G6 integration:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>G6 Graph Visualization</title>
    <script src="https://unpkg.com/@antv/g6@latest/dist/g6.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #f5f5f5;
        }
        #container {
            width: 100%;
            height: 600px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #333;
        }
        .controls {
            margin-bottom: 15px;
        }
        .controls button {
            padding: 8px 16px;
            margin-right: 10px;
            border: 1px solid #d9d9d9;
            background: white;
            border-radius: 4px;
            cursor: pointer;
        }
        .controls button:hover {
            border-color: #1890ff;
            color: #1890ff;
        }
    </style>
</head>
<body>
    <div class="title">Graph Visualization</div>
    <div class="controls">
        <button onclick="graph.fitView()">Fit View</button>
        <button onclick="graph.zoomTo(1)">Reset Zoom</button>
        <button onclick="graph.downloadFullImage('graph', 'image/png')">Download</button>
    </div>
    <div id="container"></div>
    <script>
        const data = {
            nodes: [
                // Your nodes here
            ],
            edges: [
                // Your edges here
            ]
        };

        const graph = new G6.Graph({
            container: 'container',
            width: document.getElementById('container').offsetWidth,
            height: 600,
            layout: {
                type: 'force',
                preventOverlap: true,
                nodeSpacing: 50,
                linkDistance: 150
            },
            defaultNode: {
                size: 40,
                style: {
                    fill: '#5B8FF9',
                    stroke: '#5B8FF9',
                    lineWidth: 2
                },
                labelCfg: {
                    style: {
                        fill: '#000',
                        fontSize: 12
                    }
                }
            },
            defaultEdge: {
                style: {
                    stroke: '#e2e2e2',
                    lineWidth: 2,
                    endArrow: {
                        path: G6.Arrow.triangle(10, 12, 0),
                        fill: '#e2e2e2'
                    }
                },
                labelCfg: {
                    autoRotate: true,
                    style: {
                        fill: '#666',
                        fontSize: 10
                    }
                }
            },
            modes: {
                default: [
                    'drag-canvas',
                    'zoom-canvas',
                    'drag-node',
                    'click-select'
                ]
            },
            nodeStateStyles: {
                hover: {
                    fill: '#1890ff',
                    stroke: '#1890ff'
                },
                selected: {
                    fill: '#f5222d',
                    stroke: '#f5222d'
                }
            },
            edgeStateStyles: {
                hover: {
                    stroke: '#1890ff',
                    lineWidth: 3
                }
            }
        });

        graph.data(data);
        graph.render();

        // Add hover interactions
        graph.on('node:mouseenter', (e) => {
            graph.setItemState(e.item, 'hover', true);
        });

        graph.on('node:mouseleave', (e) => {
            graph.setItemState(e.item, 'hover', false);
        });

        // Fit view on load
        graph.fitView();

        // Handle window resize
        window.addEventListener('resize', () => {
            graph.changeSize(
                document.getElementById('container').offsetWidth,
                600
            );
            graph.fitView();
        });
    </script>
</body>
</html>
```

### 5. Layout Configuration

**Force Layout** (Physics-based):
```javascript
layout: {
    type: 'force',
    preventOverlap: true,
    nodeSpacing: 50,
    linkDistance: 150,
    nodeStrength: -30,
    edgeStrength: 0.1
}
```

**Dagre Layout** (Hierarchical):
```javascript
layout: {
    type: 'dagre',
    rankdir: 'TB', // TB, BT, LR, RL
    align: 'UL',
    nodesep: 50,
    ranksep: 50
}
```

**Circular Layout**:
```javascript
layout: {
    type: 'circular',
    radius: 200,
    startRadius: 10,
    endRadius: 300,
    clockwise: true,
    divisions: 5
}
```

### 6. Node and Edge Styling

**Custom Node Shapes**:
- `circle`: Circular nodes
- `rect`: Rectangular nodes
- `ellipse`: Elliptical nodes
- `diamond`: Diamond-shaped nodes
- `triangle`: Triangular nodes
- `star`: Star-shaped nodes
- `image`: Image nodes
- `modelRect`: Card-style nodes with icon and description

**Edge Types**:
- `line`: Straight line
- `polyline`: Polyline with multiple segments
- `arc`: Curved arc
- `quadratic`: Quadratic bezier curve
- `cubic`: Cubic bezier curve
- `loop`: Self-loop edge

### 7. Interaction Modes

Enable various interactions:
- `drag-canvas`: Drag to pan the canvas
- `zoom-canvas`: Scroll to zoom
- `drag-node`: Drag nodes to reposition
- `click-select`: Click to select nodes/edges
- `brush-select`: Drag to select multiple items
- `collapse-expand`: Collapse/expand tree nodes
- `tooltip`: Show tooltips on hover
- `edge-tooltip`: Show edge tooltips

## Best Practices

1. **Data Preparation**: Ensure all node IDs are unique
2. **Layout Selection**: Choose appropriate layout for your graph structure
3. **Performance**: For large graphs (>1000 nodes), consider:
   - Using simpler node shapes
   - Reducing edge styles
   - Implementing data filtering
   - Using virtual rendering
4. **Visual Hierarchy**: Use size, color, and shape to convey importance
5. **Interactivity**: Provide zoom, pan, and selection capabilities
6. **Labels**: Keep labels concise, use tooltips for detailed info
7. **Color Coding**: Use consistent color schemes for node types

## Example Use Cases

- **Social Networks**: Visualize connections between people
- **Knowledge Graphs**: Show relationships between entities
- **Organizational Charts**: Display company hierarchy
- **Dependency Analysis**: Software package dependencies
- **Process Flow**: Business process workflows
- **Citation Networks**: Academic paper citations
- **Network Topology**: IT infrastructure visualization
- **Mind Maps**: Concept relationships and brainstorming

## Advanced Features

**Combo (Node Grouping)**:
```javascript
const data = {
    nodes: [...],
    edges: [...],
    combos: [
        { id: 'combo1', label: 'Group 1' },
        { id: 'combo2', label: 'Group 2' }
    ]
};
// Assign nodes to combos
nodes: [
    { id: 'node1', comboId: 'combo1' },
    { id: 'node2', comboId: 'combo1' }
]
```

**Custom Behaviors**:
- Fisheye distortion for focus+context
- Minimap for navigation
- Toolbar for common operations
- Search and highlight
- Path finding and highlighting

## Output Format

When creating a G6 visualization:
1. Generate a complete HTML file named `<title>-graph.html`
2. Include interactive controls (zoom, fit view, download)
3. Enable appropriate interaction modes
4. Provide clear node and edge styling
5. Add instructions for interaction

## Reference

- Official G6 Documentation: <https://g6.antv.antgroup.com/>
- API Reference: <https://g6.antv.antgroup.com/api>
- Examples: <https://g6.antv.antgroup.com/examples>
