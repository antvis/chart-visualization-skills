---
name: infographic-icon
description: Search and retrieve icon SVG strings from icon library. Returns up to 20 matching icons with their SVG content.
---

# Icon Search

This skill provides icon search and SVG string retrieval capabilities. It helps users find appropriate icons for various use cases including infographics, web development, design, and more.

## Purpose

This skill helps discover available icons and their correct keywords by:
- Searching the icon library by keywords
- Retrieving SVG strings directly for use in your projects
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
- `count`: Number of results returned (maximum 20)
- `results`: Array of icon objects, each containing:
  - `name`: The icon name/identifier
  - `keywords`: Array of keywords associated with the icon
  - `svg`: The complete SVG string content

## Workflow

1. **Identify the Icon Need**: Determine what concept you want to represent with an icon (e.g., "security", "speed", "data")

2. **Search for Icons**: Run the search script with relevant keywords
   ```bash
   node ./scripts/search.js 'security'
   ```

3. **Review Results**: The script returns up to 20 matching icons with:
   - Icon names for reference
   - Keywords associated with the icon
   - SVG content for preview or direct use

4. **Use the Icon**: Use the SVG content directly in your project (web pages, designs, infographics, etc.)

## Important Notes

- **Up to 20 Results**: The search returns a maximum of 20 icons to provide comprehensive results
- **SVG Strings**: The script returns complete SVG strings, not remote URLs
- **Keyword Matching**: Icons are matched based on their associated keywords and names
- **Multiple Use Cases**: Icons can be used in infographics, web development, design projects, and more

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

## Tips

- Use descriptive, single-word queries for best results
- Try variations of keywords (e.g., "security", "secure", "shield")
- Review the results to find the most appropriate icon for your needs
- Icons can be used across various scenarios: infographics, web development, design, and more
