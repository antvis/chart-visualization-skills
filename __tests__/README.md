# Unit Tests

This directory contains unit tests for the chart-visualization and icon-retrieval skills.

## Test Files

- `generate.test.js` - Tests for the chart-visualization script
- `search.test.js` - Tests for the icon-retrieval script

## Running Tests

```bash
npm test
```

## Test Approach

These tests use **real API calls** without mocks to validate the actual functionality:

- Chart generation tests call the actual visualization API with real data samples
- Icon search tests call the actual icon retrieval API with real queries
- Test data is constructed based on the specifications in the corresponding SKILL.md and references documentation

## Test Data

Test data examples are based on:
- `skills/chart-visualization/references/` - Chart type specifications
- `skills/icon-retrieval/SKILL.md` - Icon search examples

## Error Handling

Tests are designed to handle network failures gracefully:
- If the API is accessible, tests verify the returned data structure and content
- If network issues occur (ENOTFOUND, ECONNREFUSED, fetch failed, HTTP errors), tests catch and validate the error message format
- This ensures tests pass in both scenarios: when APIs are accessible and when network is restricted

## Network Requirements

Real API tests attempt to connect to external APIs:
- Chart API: `https://antv-studio.alipay.com/api/gpt-vis`
- Icon API: `https://www.weavefox.cn/api/open/v1/icon`

## Test Coverage

- **CHART_TYPE_MAP validation** (no network required)
- **Real chart generation** with various chart types:
  - Line charts
  - Pie charts
  - Bar charts
  - Area charts
  - District maps
  - Pin maps
- **Real icon searches** with various queries:
  - Document icons
  - Security icons
  - Technology icons
  - File icons
  - User icons
  - Special character handling
