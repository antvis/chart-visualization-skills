---
name: icon-retrieval
description: Search and retrieve icon SVG strings from icon library. Returns up to 5 matching icons by default, customizable via topK parameter.
dependency:
  python: python>=3.6
---

# Icon Search

This skill provides icon search and SVG string retrieval capabilities. It helps users find appropriate icons for various use cases including infographics, web development, design, and more.

## Purpose

This skill helps discover available icons by:
- Searching the icon library by keywords
- Retrieving SVG strings directly for use in your projects
- Providing icon metadata including names and URLs

## How to Use

### Search for Icons

To search for icons, use the search script with a keyword or phrase:

```bash
python ./scripts/search.py '<search_query>' [topK]
```

**Parameters:**
- `search_query` (required): The keyword or phrase to search for
- `topK` (optional): Maximum number of results to return (default: 5)

**Examples:**
```bash
# Search for document icons (default 5 results)
python ./scripts/search.py 'document'

# Search for security icons with top 10 results
python ./scripts/search.py 'security' 10

# Search for technology icons with top 20 results
python ./scripts/search.py 'tech' 20
```

### Understanding Results

The script returns a JSON object containing:
- `query`: The search query used
- `topK`: Maximum number of results requested
- `count`: Actual number of results returned (may be less than topK)
- `results`: Array of icon objects, each containing:
  - `url`: The source URL of the icon
  - `svg`: The complete SVG string content

## Workflow

1. **Identify the Icon Need**: Determine what concept you want to represent with an icon (e.g., "security", "speed", "data")

2. **Search for Icons**: Run the search script with relevant keywords
   ```bash
   # Default search (returns up to 5 results)
   python ./scripts/search.py 'security'
   
   # Or specify a custom topK value
   python ./scripts/search.py 'security' 10
   ```

3. **Review Results**: The script returns the requested number of matching icons with:
   - Icon source URLs
   - SVG content for preview or direct use

4. **Use the Icon**: Use the SVG content directly in your project (web pages, designs, infographics, etc.)

## Important Notes

- **Default Result Count**: By default, the search returns up to 5 icons. You can customize this by providing the `topK` parameter
- **Customizable Results**: Use the optional `topK` parameter to get more or fewer results (e.g., `python ./scripts/search.py 'icon' 20`)
- **SVG Strings**: The script returns complete SVG strings fetched from the icon service
- **Multiple Use Cases**: Icons can be used in infographics, web development, design projects, and more

## Output Format

```json
{
  "query": "document",
  "topK": 5,
  "count": 2,
  "results": [
    {
      "url": "https://example.com/icon1.svg",
      "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\">...</svg>"
    },
    {
      "url": "https://example.com/icon2.svg",
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
- **Invalid Response**: If the API returns invalid data, returns an error message
- **SSL Certificate Errors**: If you encounter SSL certificate verification errors, you can disable verification by setting an environment variable:
  ```bash
  # Option 1: Using PYTHONHTTPSVERIFY
  PYTHONHTTPSVERIFY=0 python ./scripts/search.py 'document'
  
  # Option 2: Using SSL_VERIFY
  SSL_VERIFY=false python ./scripts/search.py 'document'
  ```
  **Note**: Disabling SSL verification should only be used in development environments or when certificate issues are unavoidable. It reduces security by allowing potential man-in-the-middle attacks.

## Tips

- Use descriptive, single-word queries for best results
- Try variations of keywords (e.g., "security", "secure", "shield")
- Review the results to find the most appropriate icon for your needs
- Icons can be used across various scenarios: infographics, web development, design, and more
