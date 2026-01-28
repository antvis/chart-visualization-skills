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

## CI/CD Behavior

⚠️ **Real API tests are automatically skipped in CI environments** (when `CI=true`):
- CHART_TYPE_MAP validation tests run in CI (no network required)
- Real API integration tests are skipped in CI to avoid network dependency failures
- All tests including real API calls run in local development

To run tests locally with real API calls:
```bash
npm test
```

To simulate CI behavior locally:
```bash
CI=true npm test
```

## Network Requirements (Local Development Only)

Real API tests require network access to external APIs:
- Chart API: `https://antv-studio.alipay.com/api/gpt-vis`
- Icon API: `https://www.weavefox.cn/api/open/v1/icon`

## Test Coverage

- **CHART_TYPE_MAP validation** (runs in CI - no network required)
- **Real chart generation** (skipped in CI):
  - Line charts
  - Pie charts
  - Bar charts
  - Area charts
  - District maps
  - Pin maps
- **Real icon searches** (skipped in CI):
  - Document icons
  - Security icons
  - Technology icons
  - File icons
  - User icons
  - Special character handling
