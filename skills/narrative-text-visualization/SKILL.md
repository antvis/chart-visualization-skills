---
name: narrative-text-visualization
description: Generate structured narrative text visualizations from data using T8 (Text) schema. Use when users want to create data interpretation reports, summaries, or structured articles with entity labeling and semantic markup.
---

# Narrative Text Visualization Skill

This skill provides a workflow for transforming data into structured narrative text visualizations using the AntV T8 (Text) schema. T8 is designed for unstructured data visualization where `T` stands for Text, and `8` represents a byte of 8 bits, symbolizing deep insights hidden beneath the text.

## Overview

`T8` is a declarative JSON Schema syntax used to describe data interpretation reports with semantic entity labeling. It's designed to be:
- **LLM-friendly**: Easy to generate with AI prompts
- **Technology stack agnostic**: Works with React, Vue, and other frameworks
- **Extensible**: Supports custom entity phrases
- **Lightweight**: Less than 20KB before gzip

## Workflow

To generate narrative text visualizations, follow these steps:

### 1. Understand the Requirements

Analyze the user's request to determine:
- The topic or data to be analyzed
- The type of narrative needed (report, summary, article)
- The key insights to highlight
- Any specific data sources or metrics

### 2. Review the JSON Schema

Consult the `references/schema.json` file to understand the T8 structure:
- **Top Structure**: Contains `headline` and `sections` array
- **Sections**: Main chapters containing `paragraphs`
- **Paragraphs**: Text blocks containing `phrases`, can be:
  - `normal`: Regular text paragraphs
  - `heading1-6`: Heading levels
  - `bullets`: Bulleted/ordered lists
- **Phrases**: Text elements that can be:
  - `text`: Plain text
  - `entity`: Semantically labeled data with metadata

### 3. Entity Labeling

Use entity types to mark key information (see `references/prompt.md` for details):

| Entity Type          | Description             | Example                              |
| -------------------- | ----------------------- | ------------------------------------ |
| `metric_name`        | Indicator name          | "Shipment", "Growth Rate"            |
| `metric_value`       | Main indicator value    | "146 million units", "120 factories" |
| `other_metric_value` | Other metric values     | "$19.2 billion"                      |
| `delta_value`        | Difference              | "+120"                               |
| `ratio_value`        | Rate                    | "+8.4%", "9%"                        |
| `contribute_ratio`   | Contribution            | "40%"                                |
| `trend_desc`         | Trend Description       | "Continuously Rising", "Stable"      |
| `dim_value`          | Dimensional identifier  | "India", "Jiangsu", "Overseas"       |
| `time_desc`          | Time stamp              | "Q3 2024", "all year"                |
| `proportion`         | Proportion description  | "30%"                                |

### 4. Data Requirements

**Critical**: All data must be from publicly authentic sources:
- Official announcements/financial reports
- Authoritative media (Reuters, Bloomberg, TechCrunch, etc.)
- Industry research institutions (IDC, Canalys, Counterpoint Research, etc.)
- **Never use fictional, AI-guessed, or simulated data**
- Use specific numbers (e.g., "146 million units", "7058 units"), not vague approximations

### 5. Generate JSON Schema

Create a JSON object following the T8 schema structure:

```json
{
  "headline": {
    "type": "headline",
    "phrases": [
      {
        "type": "text",
        "value": "Article Title"
      }
    ]
  },
  "sections": [
    {
      "paragraphs": [
        {
          "type": "normal",
          "phrases": [
            {
              "type": "text",
              "value": "In Q3 2024, "
            },
            {
              "type": "entity",
              "value": "smartphone shipments",
              "metadata": {
                "entityType": "metric_name"
              }
            },
            {
              "type": "text",
              "value": " reached "
            },
            {
              "type": "entity",
              "value": "146 million units",
              "metadata": {
                "entityType": "metric_value",
                "origin": 146000000,
                "assessment": "positive"
              }
            },
            {
              "type": "text",
              "value": ", showing a year-over-year increase of "
            },
            {
              "type": "entity",
              "value": "+8.4%",
              "metadata": {
                "entityType": "ratio_value",
                "origin": 0.084,
                "assessment": "positive"
              }
            },
            {
              "type": "text",
              "value": "."
            }
          ]
        }
      ]
    }
  ]
}
```

### 6. Render the Visualization

Once you have the JSON schema, create an HTML file that uses the T8 library to render the narrative text:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Narrative Text Visualization</title>
    <script src="https://unpkg.com/@antv/t8/dist/t8.min.js"></script>
    <style>
        #container {
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        }
    </style>
</head>
<body>
    <div id="container"></div>
    <script>
        // The T8 schema generated above
        const schema = {
            // ... your schema here
        };

        // Instantiate T8
        const text = new T8.Text({
            container: 'container',
        });

        // Specify schema and theme
        text.schema(schema).theme('light');

        // Render visualization
        text.render();
    </script>
</body>
</html>
```

### 7. Output Guidelines

- The article should be at least 800 Chinese characters or equivalent in other languages
- Structure should be clear with natural paragraph transitions
- Provide meaningful data interpretation, not just numbers
- Use professional, objective language
- Output only the JSON schema in plain text (no markdown code blocks)
- Omit the `definitions` section in final output

## Best Practices

1. **Entity Metadata**: Always add these optional fields when possible:
   - `origin`: The exact numerical value (e.g., for "146 million units", origin is `146000000`)
   - `assessment`: Growth trend (`'positive'` | `'negative'` | `'equal'`)
   - `detail`: Supplementary data array for trends (e.g., `[2,3,4,1,7]`)

2. **Entity Usage**: Maximize entity labeling for:
   - Metrics and values
   - Time references
   - Dimensional identifiers
   - Trends and changes
   - Proportions and ratios

3. **Structure**:
   - Use headings to organize content
   - Group related information in sections
   - Use bullets for lists and key points
   - Maintain logical flow between paragraphs

4. **Data Quality**:
   - Always cite authentic sources
   - Use specific, verifiable numbers
   - Provide context for metrics
   - Include time references
   - Note data sources where appropriate

## Example Output

A complete example of T8 schema can be found in the T8 repository. The rendered output provides:
- Rich semantic markup for data entities
- Interactive entity highlighting
- Clear visual hierarchy
- Professional report-style formatting
- Responsive design for all devices

## Reference Material

Detailed specifications are located in the `references/` directory:
- `prompt.md`: Complete prompt template for LLM generation
- `schema.json`: Full JSON Schema definition with all types

These references are based on the official AntV T8 repository and should be consulted for accurate implementation details.
