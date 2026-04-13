---
name: icon-retrieval
description: Search icons through HTTP API and retrieve SVG strings with curl.
---

# Icon Search

Use the icon HTTP API directly with `curl`.

## API

### Search Endpoint

- **Method**: `GET`
- **URL**: `https://www.weavefox.cn/api/open/v1/icon`
- **Query params**:
  - `text` (required): search keyword
  - `topK` (optional): max result count, default `5`

Example:

```bash
curl -sS -L --max-time 20 "https://www.weavefox.cn/api/open/v1/icon?text=document&topK=5"
```

Typical response:

```json
{
  "status": true,
  "data": {
    "success": true,
    "data": [
      "https://example.com/icon1.svg",
      "https://example.com/icon2.svg"
    ]
  }
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
- If `topK` is omitted, the service returns up to 5 results.
- For network issues, retry with a smaller `topK` or verify endpoint accessibility.
