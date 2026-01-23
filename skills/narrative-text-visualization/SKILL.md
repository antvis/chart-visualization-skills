---
name: narrative-text-visualization
description: Create engaging narrative text visualizations that transform unstructured text data into visually appealing story-driven layouts. Use when users want to visualize narratives, timelines, story arcs, or text-based content with visual storytelling elements.
---

Narrative Text Visualization transforms unstructured text data into visually compelling story-driven layouts. It combines typography, layout design, and visual elements to help audiences understand and remember textual narratives through visual storytelling.

`Narrative Text Visualization = Text Content + Visual Structure + Storytelling Elements`

This skill creates HTML-based narrative visualizations using modern web technologies.

Before starting the task, you need to understand the narrative text visualization specifications, including layout types, data structure, themes, and styling options.

## Specifications

### Narrative Text Visualization Structure

A narrative text visualization consists of several key components:

1. **Layout Type**: The visual structure for presenting the narrative (timeline, chapter-based, scroll-driven, etc.)
2. **Content Data**: The actual text content including titles, sections, paragraphs, quotes, and highlights
3. **Visual Elements**: Icons, images, dividers, and decorative elements that enhance the narrative
4. **Theme**: Color schemes, typography, and styling that set the mood and tone

### Data Structure

The narrative visualization uses a JSON-based data structure:

```json
{
  "layout": "timeline|chapters|scroll|cards|story-arc",
  "title": "Main Title",
  "subtitle": "Optional Subtitle",
  "theme": {
    "palette": ["#primary", "#secondary", "#accent"],
    "font": "serif|sans-serif|monospace|custom-font-name",
    "style": "modern|classic|minimal|bold|elegant"
  },
  "sections": [
    {
      "type": "intro|content|highlight|quote|conclusion",
      "title": "Section Title",
      "content": "Section text content...",
      "timestamp": "Optional timestamp for timeline layouts",
      "image": "Optional image URL",
      "icon": "Optional icon name",
      "metadata": {
        "author": "Optional author",
        "date": "Optional date"
      }
    }
  ],
  "footer": {
    "text": "Optional footer text",
    "credits": "Optional credits"
  }
}
```

### Layout Types

1. **Timeline Layout** (`timeline`): Presents narrative in chronological order with visual timeline
   - Best for: Historical narratives, event sequences, chronological stories
   - Features: Time markers, sequential flow, date annotations

2. **Chapter-Based Layout** (`chapters`): Organizes content into distinct chapters or sections
   - Best for: Long-form content, books, multi-part stories
   - Features: Chapter navigation, section dividers, progress indicators

3. **Scroll-Driven Layout** (`scroll`): Single-page scrolling experience with parallax effects
   - Best for: Immersive storytelling, interactive narratives
   - Features: Smooth scrolling, fade-in animations, scroll-triggered effects

4. **Card Layout** (`cards`): Presents narrative as a collection of cards
   - Best for: Modular content, snippets, highlights
   - Features: Card grid, hover effects, expandable cards

5. **Story Arc Layout** (`story-arc`): Visualizes narrative following a story arc structure
   - Best for: Dramatic narratives, plot structures, emotional journeys
   - Features: Arc visualization, tension indicators, climax highlights

### Section Types

- **intro**: Introduction section with larger text, eye-catching design
- **content**: Standard content section with body text
- **highlight**: Emphasized content with special styling
- **quote**: Pull quotes or testimonials with quote styling
- **conclusion**: Conclusion section with summary styling

### Theme Options

- **Palette**: Array of 3-5 colors for the visualization
  - Primary: Main brand/theme color
  - Secondary: Supporting color
  - Accent: Highlight color
  - Background: Optional background color
  - Text: Optional text color

- **Font Families**:
  - `serif`: Classic, traditional feel (Georgia, Times New Roman)
  - `sans-serif`: Modern, clean feel (Arial, Helvetica)
  - `monospace`: Technical, code-like feel (Courier, Consolas)
  - Custom: Any web-safe or Google Font name

- **Styles**:
  - `modern`: Contemporary design with bold typography
  - `classic`: Traditional layout with elegant styling
  - `minimal`: Clean, spacious design with minimal decoration
  - `bold`: High contrast, large typography
  - `elegant`: Refined styling with subtle details

### Example Data Structure

**Timeline Narrative Example:**

```json
{
  "layout": "timeline",
  "title": "The Evolution of Web Development",
  "subtitle": "From static pages to modern web apps",
  "theme": {
    "palette": ["#2c3e50", "#3498db", "#e74c3c"],
    "font": "sans-serif",
    "style": "modern"
  },
  "sections": [
    {
      "type": "intro",
      "title": "The Beginning",
      "content": "In the early 1990s, the World Wide Web was born...",
      "timestamp": "1991",
      "icon": "web"
    },
    {
      "type": "content",
      "title": "The Rise of Dynamic Content",
      "content": "JavaScript emerged, enabling interactive experiences...",
      "timestamp": "1995",
      "icon": "code"
    },
    {
      "type": "highlight",
      "title": "The Modern Era",
      "content": "React, Vue, and Angular revolutionized development...",
      "timestamp": "2013",
      "icon": "rocket"
    }
  ]
}
```

**Story Arc Example:**

```json
{
  "layout": "story-arc",
  "title": "Product Launch Journey",
  "theme": {
    "palette": ["#667eea", "#764ba2", "#f093fb"],
    "font": "serif",
    "style": "elegant"
  },
  "sections": [
    {
      "type": "intro",
      "title": "The Idea",
      "content": "It started with a simple observation..."
    },
    {
      "type": "content",
      "title": "Development Challenges",
      "content": "The team faced numerous obstacles..."
    },
    {
      "type": "highlight",
      "title": "The Launch",
      "content": "After months of hard work, the moment arrived..."
    },
    {
      "type": "conclusion",
      "title": "Impact",
      "content": "The product exceeded expectations..."
    }
  ]
}
```

## Generation Process

### Step 1: Understand User Requirements

Before creating a narrative text visualization, first understand:
- The type of narrative (timeline, story, journey, etc.)
- The key content and structure
- The desired mood and tone
- The target audience

Extract and structure:
- Main title and subtitle
- Section breakdown with types
- Timeline markers or chapter divisions
- Any special highlights or quotes
- Desired theme and styling

### Step 2: Structure the Data

Organize the narrative content into the appropriate data structure:
1. Choose the most suitable layout type
2. Break content into logical sections
3. Assign appropriate section types
4. Add metadata (timestamps, authors, etc.)
5. Select theme and styling

### Step 3: Generate the HTML Visualization

Create a complete HTML file with the following structure:

1. **HTML Structure:**
   - DOCTYPE and HTML meta (charset: utf-8)
   - Title: `{title} - Narrative Visualization`
   - Include necessary CSS and JavaScript
   - Responsive design (mobile-friendly)
   - Semantic HTML5 elements

2. **CSS Styling:**
   - Theme colors and typography
   - Layout-specific styles
   - Responsive breakpoints
   - Animation and transition effects
   - Print-friendly styles

3. **JavaScript Functionality:**
   - Scroll animations and effects
   - Interactive elements
   - Navigation (for chapter-based layouts)
   - Responsive behavior

Reference HTML template structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - Narrative Visualization</title>
    <style>
        /* CSS styles here based on theme and layout */
        :root {
            --primary-color: {theme.palette[0]};
            --secondary-color: {theme.palette[1]};
            --accent-color: {theme.palette[2]};
            --font-family: {theme.font};
        }
        
        body {
            font-family: var(--font-family);
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        /* Layout-specific styles */
        /* Animation styles */
        /* Responsive styles */
    </style>
</head>
<body>
    <main class="narrative-container {layout}">
        <header>
            <h1>{title}</h1>
            <p class="subtitle">{subtitle}</p>
        </header>
        
        <div class="content">
            <!-- Sections rendered here based on layout type -->
        </div>
        
        <footer>
            <!-- Footer content -->
        </footer>
    </main>
    
    <script>
        // JavaScript for animations and interactions
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize scroll animations
            // Setup interactive elements
        });
    </script>
</body>
</html>
```

### Step 4: Output and Delivery

1. Generate the HTML file using file creation tools, named as `{title}-narrative.html`
2. Show to user:
   - File path with instructions: "Open with a browser to view the narrative visualization"
   - Data structure used
   - Prompt: "Let me know if you'd like to adjust the layout, colors, or content"

### Best Practices

1. **Content Organization:**
   - Keep sections focused and concise
   - Use appropriate section types for content
   - Maintain logical flow and narrative structure

2. **Visual Design:**
   - Choose colors that match the narrative tone
   - Ensure sufficient contrast for readability
   - Use whitespace effectively
   - Select appropriate typography

3. **Responsiveness:**
   - Ensure the visualization works on all screen sizes
   - Test on mobile, tablet, and desktop views
   - Use flexible layouts and relative units

4. **Accessibility:**
   - Use semantic HTML elements
   - Provide alt text for images
   - Ensure keyboard navigation works
   - Maintain good color contrast ratios

5. **Performance:**
   - Optimize images and assets
   - Use CSS animations over JavaScript when possible
   - Minimize DOM manipulation
   - Consider lazy loading for long narratives

## Common Use Cases

1. **Timeline Stories**: Historical events, company milestones, product evolution
2. **Case Studies**: Project journeys, success stories, transformation narratives
3. **Educational Content**: Learning paths, concept explanations, tutorials
4. **Storytelling**: Creative narratives, user stories, testimonials
5. **Reports**: Annual reports, progress updates, impact stories

## Example Usage

**User Request**: "Create a narrative visualization of our company's 5-year journey from startup to success"

**Response**:
1. Extract key milestones and events
2. Structure as timeline layout
3. Create sections for each major phase
4. Apply appropriate theme (e.g., bold, modern)
5. Generate HTML file with timeline visualization
6. Output file path and preview

The generated HTML will be a self-contained, interactive narrative visualization that can be opened in any modern web browser.
