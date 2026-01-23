---
name: infographic-icon
description: Search and retrieve icon SVG strings from AntV Infographic icon library. Returns top 5 matching icons with their SVG content.
---

# Infographic Icon Search

This skill provides icon search and SVG string retrieval capabilities based on the AntV Infographic icon service. It helps users find appropriate icons when creating infographics with the AntV Infographic tool.

## Purpose

When creating infographics, users need to specify icons using keywords (e.g., `icon document text`, `icon star fill`). This skill helps discover available icons and their correct keywords by:
- Searching the AntV Infographic icon library by keywords
- Retrieving SVG strings directly for use in infographic configurations
- Providing icon metadata including names and associated keywords

## How to Use

### Search for Icons

To search for icons, use the search script with a keyword or phrase:

```bash
node ./scripts/search.js '<search_query>'
```

**Examples:**
```bash
# Search for document icons
node ./scripts/search.js 'document'

# Search for security icons
node ./scripts/search.js 'security'

# Search for technology icons
node ./scripts/search.js 'tech'
```

### Understanding Results

The script returns a JSON object containing:
- `query`: The search query used
- `count`: Number of results returned (maximum 5)
- `results`: Array of icon objects, each containing:
  - `name`: The icon name/identifier
  - `keywords`: Array of keywords associated with the icon
  - `svg`: The complete SVG string content

### Using Icons in Infographics

Once you find an icon, you can use its keywords in your infographic syntax:

```plain
infographic list-row-horizontal-icon-arrow
data
  lists
    - label Security Feature
      icon shield secure
    - label Fast Performance
      icon flash fast
```

## Workflow

1. **Identify the Icon Need**: Determine what concept you want to represent with an icon (e.g., "security", "speed", "data")

2. **Search for Icons**: Run the search script with relevant keywords
   ```bash
   node ./scripts/search.js 'security'
   ```

3. **Review Results**: The script returns the top 5 matching icons with:
   - Icon names for reference
   - Keywords that can be used in infographic syntax
   - SVG content for preview or direct use

4. **Use in Infographic**: Copy the appropriate keywords to your infographic data:
   ```plain
   icon shield secure
   ```

## Important Notes

- **Top 5 Results Only**: The search returns a maximum of 5 icons to keep results focused and relevant
- **SVG Strings**: The script returns complete SVG strings, not remote URLs
- **Keyword Matching**: Icons are matched based on their associated keywords and names
- **Direct Usage**: Use the icon keywords directly in your AntV Infographic syntax

## Output Format

```json
{
  "query": "document",
  "count": 3,
  "results": [
    {
      "name": "document-text",
      "keywords": ["document", "file", "text", "paper"],
      "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\">...</svg>"
    },
    {
      "name": "document-outline",
      "keywords": ["document", "file", "outline"],
      "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\">...</svg>"
    }
  ]
}
```

## Error Handling

The script handles various error scenarios:

- **Missing Query**: If no search query is provided, returns usage instructions
- **Network Errors**: If the icon service is unavailable, returns an error message
- **Empty Results**: If no icons match the query, returns an empty results array with a warning
- **Invalid Response**: If the API returns invalid data, falls back to common icon suggestions

## Common Icon Keywords

Some commonly used icon keywords in AntV Infographic:
- `document`, `text`, `file`
- `star`, `fill`
- `flash`, `fast`
- `shield`, `secure`, `check`
- `sun`, `moon`
- `web`, `internet`
- `account`, `multiple`
- `cellphone`, `mobile`
- `cloud`
- `application`, `brackets`
- `brain`, `ai`

## Integration with Infographic Creator

This skill works seamlessly with the `infographic-creator` skill. After finding icons:

1. Use this skill to search for appropriate icons
2. Copy the icon keywords from the results
3. Use them in your infographic data structure when working with `infographic-creator`

Example workflow:
```bash
# Step 1: Search for an icon
node ./scripts/search.js 'analytics'

# Step 2: Use the keywords in your infographic
infographic list-grid-badge-card
data
  title Data Analytics Features
  lists
    - label Data Analysis
      icon chart analytics
    - label Performance Metrics
      icon graph data
```

## Tips

- Use descriptive, single-word queries for best results
- Try variations of keywords (e.g., "security", "secure", "shield")
- Combine multiple keywords when using icons in infographics (e.g., `icon shield check`)
- Review all 5 results to find the most appropriate icon for your needs
