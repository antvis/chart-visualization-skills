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

## Network Requirements

⚠️ **Important**: These tests require network access to external APIs:
- Chart API: `https://antv-studio.alipay.com/api/gpt-vis`
- Icon API: `https://www.weavefox.cn/api/open/v1/icon`

In CI/CD environments with restricted network access, tests may fail with `ENOTFOUND` errors. This is expected behavior and indicates that the tests are correctly making real API calls.

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
