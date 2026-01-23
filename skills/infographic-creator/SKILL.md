---
name: infographic-creator
description: Create beautiful infographics based on given text content. Use when users request to create infographics.
---

Infographics convert data, information, and knowledge into perceptible visual language. They combine visual design with data visualization, compressing complex information with intuitive symbols to help audiences quickly understand and remember key points.

`Infographic = Information Structure + Visual Expression`

This task uses [AntV Infographic](https://infographic.antv.vision/) to create visual infographics.

Before starting the task, you need to understand the AntV Infographic syntax specifications, including template list, data structure, themes, etc.

## Specifications

### AntV Infographic Syntax

AntV Infographic syntax is a custom DSL used to describe infographic rendering configurations. It uses indentation to describe information, has strong robustness, and is convenient for AI streaming output and infographic rendering. It mainly contains the following information:

1. template: Use templates to express the text information structure.
2. data: Infographic data, including title, desc, data items, etc. Data items typically contain fields such as label, desc, icon, etc.
3. theme: Theme contains style configurations such as palette, font, etc.

For example:

```plain
infographic list-row-horizontal-icon-arrow
data
  title Title
  desc Description
  lists
    - label Label
      value 12.5
      desc Explanation
      icon document text
theme
  palette #3b82f6 #8b5cf6 #f97316
```

### Syntax Specifications

- The first line must be `infographic <template-name>`, template selected from the list below (see "Available Templates" section).
- Use `data` / `theme` blocks, with two-space indentation within blocks.
- Key-value pairs use "key space value"; arrays use `-` as entry prefix.
- icon uses icon keywords (e.g., `star fill`).
- `data` should contain title/desc + template-specific main data field (not necessarily `items`).
- Main data field selection (use only one, avoid mixing):
  - `list-*` → `lists`
  - `sequence-*` → `sequences` (optional `order asc|desc`)
  - `compare-*` → `compares` (supports `children` for grouped comparisons), can contain multiple comparison items
  - `hierarchy-structure` → `items` (each item corresponds to an independent hierarchy, each level can contain sub-items, can be nested up to 3 levels)
  - `hierarchy-*` → single `root` (tree structure, nested through `children`);
  - `relation-*` → `nodes` + `relations`; simple relation diagrams can omit `nodes`, using arrow syntax in relations
  - `chart-*` → `values` (numeric statistics, optional `category`)
  - Use `items` as fallback when uncertain
- `compare-binary-*` / `compare-hierarchy-left-right-*` binary templates: must have two root nodes, all comparison items hang under these two root nodes' children
- `hierarchy-*`: use single `root`, nested through `children` (do not repeat `root`)
- `theme` is used to customize themes (palette, font, etc.)
  For example: dark theme + custom color scheme
  ```plain
  infographic list-row-horizontal-icon-arrow
  theme dark
    palette
      - #61DDAA
      - #F6BD16
      - #F08BB4
  ```
- Use `theme.base.text.font-family` to specify font, such as handwriting style `851tegakizatsu`
- Use `theme.stylize` to select built-in styles and pass parameters
  Common styles:
  - `rough`: hand-drawn effect
  - `pattern`: pattern fill
  - `linear-gradient` / `radial-gradient`: linear/radial gradient

  For example: hand-drawn style (rough)

  ```plain
  infographic list-row-horizontal-icon-arrow
  theme
    stylize rough
    base
      text
        font-family 851tegakizatsu
  ```

- Do not output JSON, Markdown, or explanatory text

### Data Syntax Examples

Data syntax examples by template category (use corresponding fields, avoid adding `items` simultaneously):

- `list-*` templates

```plain
infographic list-grid-badge-card
data
  title Feature List
  lists
    - label Fast
      icon flash fast
    - label Secure
      icon secure shield check
```

- `sequence-*` templates

```plain
infographic sequence-steps-simple
data
  sequences
    - label Step 1
    - label Step 2
    - label Step 3
  order asc
```

- `hierarchy-*` templates

```plain
infographic hierarchy-structure
data
  root
    label Company
    children
      - label Dept A
      - label Dept B
```

- `compare-*` templates

```plain
infographic compare-swot
data
  compares
    - label Strengths
      children
        - label Strong brand
        - label Loyal users
    - label Weaknesses
      children
        - label High cost
        - label Slow release
```

Quadrant diagram

```plain
infographic compare-quadrant-quarter-simple-card
data
  compares
    - label High Impact & Low Effort
    - label High Impact & High Effort
    - label Low Impact & Low Effort
    - label Low Impact & High Effort
```

- `chart-*` templates

```plain
infographic chart-column-simple
data
  values
    - label Visits
      value 1280
    - label Conversion
      value 12.4
```

- `relation-*` templates

> Edge label syntax: A -label-> B or A -->|label| B

```plain
infographic relation-dagre-flow-tb-simple-circle-node
data
  nodes
    - id A
      label Node A
    - id B
      label Node B
  relations
    A - approves -> B
    A -->|blocks| B
```

- Fallback `items` example

```plain
infographic list-row-horizontal-icon-arrow
data
  items
    - label Item A
      desc Description
      icon sun
    - label Item B
      desc Description
      icon moon
```

### Available Templates

- chart-bar-plain-text
- chart-column-simple
- chart-line-plain-text
- chart-pie-compact-card
- chart-pie-donut-pill-badge
- chart-pie-donut-plain-text
- chart-pie-plain-text
- chart-wordcloud
- compare-binary-horizontal-badge-card-arrow
- compare-binary-horizontal-simple-fold
- compare-binary-horizontal-underline-text-vs
- compare-hierarchy-left-right-circle-node-pill-badge
- compare-quadrant-quarter-circular
- compare-quadrant-quarter-simple-card
- compare-swot
- hierarchy-mindmap-branch-gradient-capsule-item
- hierarchy-mindmap-level-gradient-compact-card
- hierarchy-structure
- hierarchy-tree-curved-line-rounded-rect-node
- hierarchy-tree-tech-style-badge-card
- hierarchy-tree-tech-style-capsule-item
- list-column-done-list
- list-column-simple-vertical-arrow
- list-column-vertical-icon-arrow
- list-grid-badge-card
- list-grid-candy-card-lite
- list-grid-ribbon-card
- list-row-horizontal-icon-arrow
- list-sector-plain-text
- list-zigzag-down-compact-card
- list-zigzag-down-simple
- list-zigzag-up-compact-card
- list-zigzag-up-simple
- relation-dagre-flow-tb-animated-badge-card
- relation-dagre-flow-tb-animated-simple-circle-node
- relation-dagre-flow-tb-badge-card
- relation-dagre-flow-tb-simple-circle-node
- sequence-ascending-stairs-3d-underline-text
- sequence-ascending-steps
- sequence-circular-simple
- sequence-color-snake-steps-horizontal-icon-line
- sequence-cylinders-3d-simple
- sequence-filter-mesh-simple
- sequence-funnel-simple
- sequence-horizontal-zigzag-underline-text
- sequence-mountain-underline-text
- sequence-pyramid-simple
- sequence-roadmap-vertical-plain-text
- sequence-roadmap-vertical-simple
- sequence-snake-steps-compact-card
- sequence-snake-steps-simple
- sequence-snake-steps-underline-text
- sequence-stairs-front-compact-card
- sequence-stairs-front-pill-badge
- sequence-timeline-rounded-rect-node
- sequence-timeline-simple
- sequence-zigzag-pucks-3d-simple
- sequence-zigzag-steps-underline-text

**Template Selection Recommendations:**

- Strict sequence (process/steps/development trend) → `sequence-*`
  - Timeline → `sequence-timeline-*`
  - Staircase diagram → `sequence-stairs-*`
  - Roadmap → `sequence-roadmap-vertical-*`
  - Zigzag path → `sequence-zigzag-*`
  - Circular progress → `sequence-circular-simple`
  - Colorful snake steps → `sequence-color-snake-steps-*`
  - Pyramid → `sequence-pyramid-simple`
- Opinion listing → `list-row-*` or `list-column-*`
- Binary comparison (pros/cons) → `compare-binary-*`
- SWOT → `compare-swot`
- Hierarchical structure (tree diagram) → `hierarchy-tree-*`
- Data charts → `chart-*`
- Quadrant analysis → `compare-quadrant-*`
- Grid list (key points) → `list-grid-*`
- Relationship display → `relation-*`
- Word cloud → `chart-wordcloud`
- Mind map → `hierarchy-mindmap-*`

### Example

Creating an Internet technology evolution infographic

```plain
infographic list-row-horizontal-icon-arrow
data
  title Internet Technology Evolution
  desc From Web 1.0 to AI era, key milestones
  lists
    - time 1991
      label Web 1.0
      desc Tim Berners-Lee published the first website, opening the Internet era
      icon web
    - time 2004
      label Web 2.0
      desc Social media and user-generated content become mainstream
      icon account multiple
    - time 2007
      label Mobile
      desc iPhone released, smartphone changes the world
      icon cellphone
    - time 2015
      label Cloud Native
      desc Containerization and microservices architecture are widely used
      icon cloud
    - time 2020
      label Low Code
      desc Visual development lowers the technology threshold
      icon application brackets
    - time 2023
      label AI Large Model
      desc ChatGPT ignites the generative AI revolution
      icon brain
```

## Generation Process

### Step 1: Understand User Requirements

Before creating an infographic, first understand the user's needs and the information they want to express, in order to determine the template and data structure.

If the user provides a clear content description, it should be broken down into a clear and concise structure.

Otherwise, clarification from the user is needed (e.g., "Please provide a clear and concise content description.", "Which template do you want to use?")

- Extract key information structure (title, desc, items, etc.).
- Clarify required data fields (title, desc, items, label, value, icon, etc.).
- Select appropriate template.
- Describe infographic content using AntV Infographic syntax `{syntax}`.

**Key Note**: Must respect the language of user input. For example, if the user inputs in Chinese, the text in the syntax must also be in Chinese.

### Step 2: Render the Infographic

When you have the final AntV Infographic syntax, you can generate a complete HTML file following these steps:

1. Create a complete HTML file with the following structure:
   - DOCTYPE and HTML meta (charset: utf-8)
   - Title: `{title} - Infographic`
   - Include AntV Infographic script: `https://unpkg.com/@antv/infographic@latest/dist/infographic.min.js`
   - Create container div with id `container`
   - Initialize Infographic (`width: '100%'`, `height: '100%'`)
   - Replace `{title}` with actual title
   - Replace `{syntax}` with actual AntV Infographic syntax
   - Add SVG export functionality: `const svgDataUrl = await infographic.toDataURL({ type: 'svg' });`

Reference HTML template:

```html
<div id="container"></div>
<script src="https://unpkg.com/@antv/infographic@latest/dist/infographic.min.js"></script>
<script>
 const infographic = new AntVInfographic.Infographic({
    container: '#container',
    width: '100%',
    height: '100%',
  });
  document.fonts?.ready.then(() => {
    infographic.render(`{syntax}`);
  }).catch((error) => {
    console.error('Error waiting for fonts to load:', error);
    infographic.render(`{syntax}`);
  });
</script>
```

2. Use the Write tool to generate HTML file, named as `<title>-infographic.html`

3. Show to user:
   - Generate file path and prompt: "Open directly with a browser to view and save as SVG"
   - Output syntax and prompt: "Tell me if you need to adjust template/colors/content"

**Note:** The HTML file must include:

- SVG export via export button
- Container is responsive, both width and height are 100%
