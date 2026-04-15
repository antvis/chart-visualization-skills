---
name: icon-retrieval
description: Search icons through HTTP API and retrieve SVG strings with curl.
---

# Icon Search

Use the icon HTTP API directly with `curl`.

## API

### Search Endpoint

- **Method**: `GET`
- **URL**: `https://lab.weavefox.cn/api/v1/infographic/icon`
- **Query params**:
  - `text` (required): search keyword, e.g. `"data analysis"`
  - `topK` (optional): number of icons to fetch (1-20), default `5`

Example:

```bash
curl -sS -L --max-time 20 "https://lab.weavefox.cn/api/v1/infographic/icon?text=document&topK=5"
```

Typical response:

```json
{
  "success": true,
  "data": [
    "https://example.com/icon1.svg",
    "https://example.com/icon2.svg"
  ]
}
```

### Retrieve SVG Content

```bash
curl -sS -L --max-time 20 "https://example.com/icon1.svg"
```

## Workflow

1. Determine the icon concept keyword (for example: `security`, `document`, `data`).
2. Search icon URLs using the API endpoint.
3. Use `curl` to fetch the SVG content of selected URLs.
4. Use SVG directly in pages, diagrams, or infographic materials.

## Notes

- Use URL encoding for special characters in `text`.
- `topK` range is 1–20; if omitted, the service returns up to 5 results.
- For network issues, retry with a smaller `topK` or verify endpoint accessibility.
