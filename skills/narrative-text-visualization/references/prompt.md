# Narrative Text Visualization - Prompt Reference

## Overview

This document provides detailed guidance for creating narrative text visualizations. It serves as a reference for understanding input requirements, layout options, and best practices.

## Purpose

Narrative Text Visualization transforms unstructured text content into visually engaging story-driven layouts. It's designed to:
- Present textual narratives in a visually compelling way
- Enhance comprehension through visual structure
- Create memorable experiences through storytelling elements
- Support multiple narrative formats (timelines, chapters, stories, etc.)

## Input Requirements

### Required Fields

1. **title** (string): The main title of the narrative
   - Should be clear and engaging
   - Typically 3-10 words
   - Example: "The Evolution of Web Development"

2. **layout** (string): The visual structure type
   - Options: `timeline`, `chapters`, `scroll`, `cards`, `story-arc`
   - Choose based on narrative type and content flow

3. **sections** (array): The content sections of the narrative
   - Minimum 1 section required
   - Each section must have `title` and `content`
   - Section types: `intro`, `content`, `highlight`, `quote`, `conclusion`

### Optional Fields

1. **subtitle** (string): Secondary title or tagline
   - Provides context or summary
   - Example: "From static pages to modern web apps"

2. **theme** (object): Visual styling configuration
   - **palette** (array): Color scheme (3-5 colors)
   - **font** (string): Font family choice
   - **style** (string): Overall design style

3. **footer** (object): Footer information
   - **text** (string): Footer text
   - **credits** (string): Attribution or credits

## Layout Types Detailed

### 1. Timeline Layout
**Use When:**
- Content is chronological
- Showing historical progression
- Event sequences matter
- Dates/times are important

**Features:**
- Vertical or horizontal timeline
- Time markers and labels
- Sequential navigation
- Date annotations

**Best For:**
- Historical narratives
- Company milestones
- Product evolution
- Event sequences

**Example:**
```json
{
  "layout": "timeline",
  "title": "Technology Milestones",
  "sections": [
    {
      "type": "intro",
      "title": "The Beginning",
      "content": "...",
      "timestamp": "1991"
    }
  ]
}
```

### 2. Chapter-Based Layout
**Use When:**
- Content naturally divides into chapters
- Long-form narrative
- Multiple distinct topics
- Need clear section breaks

**Features:**
- Chapter navigation
- Progress indicators
- Section dividers
- Table of contents

**Best For:**
- Long-form stories
- Educational content
- Multi-part narratives
- Book-like structures

### 3. Scroll-Driven Layout
**Use When:**
- Want immersive experience
- Single continuous flow
- Cinematic storytelling
- Modern web experience

**Features:**
- Smooth scrolling
- Parallax effects
- Fade-in animations
- Scroll-triggered content

**Best For:**
- Interactive narratives
- Modern storytelling
- Immersive experiences
- Marketing content

### 4. Card Layout
**Use When:**
- Content is modular
- Snippets or highlights
- Non-linear reading
- Grid display preferred

**Features:**
- Card grid layout
- Hover interactions
- Expandable cards
- Responsive design

**Best For:**
- Collection of stories
- Testimonials
- Feature highlights
- Portfolio content

### 5. Story Arc Layout
**Use When:**
- Following dramatic structure
- Showing emotional journey
- Plot-driven narrative
- Tension and resolution

**Features:**
- Visual arc representation
- Tension indicators
- Climax highlights
- Resolution markers

**Best For:**
- Dramatic narratives
- Case studies
- Success stories
- Transformation journeys

## Section Types

### Intro
- First impression section
- Larger, bolder text
- Eye-catching design
- Sets the tone

### Content
- Standard narrative section
- Body text styling
- Regular flow
- Main story content

### Highlight
- Emphasized content
- Special styling
- Key points
- Important information

### Quote
- Pull quotes
- Testimonials
- Citations
- Notable statements

### Conclusion
- Summary section
- Wrap-up styling
- Key takeaways
- Call-to-action

## Theme Configuration

### Palette Selection

Choose colors based on narrative mood:

**Professional/Corporate:**
```json
"palette": ["#2c3e50", "#3498db", "#95a5a6"]
```

**Creative/Artistic:**
```json
"palette": ["#667eea", "#764ba2", "#f093fb"]
```

**Nature/Environmental:**
```json
"palette": ["#27ae60", "#16a085", "#f39c12"]
```

**Tech/Modern:**
```json
"palette": ["#0066ff", "#00ff88", "#ff0066"]
```

### Font Selection

- **serif**: Traditional, formal, literary
  - Georgia, Garamond, Times New Roman
- **sans-serif**: Modern, clean, professional
  - Arial, Helvetica, Open Sans
- **monospace**: Technical, code-focused
  - Courier, Consolas, Monaco

### Style Options

- **modern**: Bold typography, contemporary design
- **classic**: Traditional layouts, elegant styling
- **minimal**: Clean, spacious, simple
- **bold**: High contrast, large text
- **elegant**: Refined, subtle details

## Best Practices

### Content Writing

1. **Keep sections focused**: One main idea per section
2. **Use clear hierarchy**: Title > Subtitle > Content
3. **Vary section types**: Mix intro, content, highlights
4. **Add metadata**: Timestamps, authors, dates
5. **Include visuals**: Icons, images where appropriate

### Visual Design

1. **Color harmony**: Use palette consistently
2. **Typography**: Max 2-3 font families
3. **Whitespace**: Don't overcrowd
4. **Contrast**: Ensure readability
5. **Consistency**: Maintain visual rhythm

### Structure

1. **Start strong**: Engaging intro section
2. **Logical flow**: Clear progression
3. **Highlight key points**: Use highlight sections
4. **End well**: Strong conclusion
5. **Navigation**: Easy to follow

## Common Patterns

### Historical Timeline
```json
{
  "layout": "timeline",
  "theme": {
    "style": "classic",
    "font": "serif"
  },
  "sections": [
    {
      "type": "intro",
      "timestamp": "year",
      "title": "Event Title",
      "content": "Description"
    }
  ]
}
```

### Case Study
```json
{
  "layout": "chapters",
  "theme": {
    "style": "modern",
    "font": "sans-serif"
  },
  "sections": [
    {
      "type": "intro",
      "title": "The Challenge"
    },
    {
      "type": "content",
      "title": "The Solution"
    },
    {
      "type": "highlight",
      "title": "Results"
    }
  ]
}
```

### Success Story
```json
{
  "layout": "story-arc",
  "theme": {
    "style": "bold",
    "palette": ["#667eea", "#764ba2", "#f093fb"]
  },
  "sections": [
    {
      "type": "intro",
      "title": "The Beginning"
    },
    {
      "type": "content",
      "title": "Challenges"
    },
    {
      "type": "highlight",
      "title": "Breakthrough"
    },
    {
      "type": "conclusion",
      "title": "Impact"
    }
  ]
}
```

## Validation Checklist

Before finalizing:

- [ ] Title is clear and engaging
- [ ] Layout matches content type
- [ ] All required fields present
- [ ] Sections have appropriate types
- [ ] Theme colors are harmonious
- [ ] Font choice matches tone
- [ ] Content flows logically
- [ ] Metadata is complete
- [ ] Visual elements enhance story
- [ ] Responsive design considered

## Examples by Use Case

### Educational Content
- Layout: chapters or scroll
- Style: modern or classic
- Focus: Clear progression, learning path

### Marketing/Brand Story
- Layout: scroll or story-arc
- Style: bold or elegant
- Focus: Emotional journey, impact

### Technical Documentation
- Layout: chapters or cards
- Style: minimal or modern
- Focus: Clarity, structure, references

### Historical Record
- Layout: timeline
- Style: classic or elegant
- Focus: Chronology, accuracy, context

### Personal Story
- Layout: story-arc or scroll
- Style: any based on preference
- Focus: Emotion, authenticity, journey
