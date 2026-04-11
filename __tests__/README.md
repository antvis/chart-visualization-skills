# Unit Tests

This directory contains unit tests for the icon-retrieval skill.

## Test Files

- `search.test.js` - Tests for the icon-retrieval script

## Running Tests

```bash
npm test
```

## Test Approach

These tests use **real API calls** without mocks to validate the actual functionality:

- Icon search tests call the actual icon retrieval API with real queries
- Test data is constructed based on the specifications in the corresponding SKILL.md

## Test Data

Test data examples are based on:
- `skills/icon-retrieval/SKILL.md` - Icon search examples

## Error Handling

Tests are designed to handle network failures gracefully:
- If the API is accessible, tests verify the returned data structure and content
- If network issues occur (ENOTFOUND, ECONNREFUSED, fetch failed, HTTP errors), tests catch and validate the error message format
- This ensures tests pass in both scenarios: when APIs are accessible and when network is restricted

## Network Requirements

Real API tests attempt to connect to external APIs:
- Icon API: `https://www.weavefox.cn/api/open/v1/icon`

## Test Coverage

- **Real icon searches** with various queries:
  - Document icons
  - Security icons
  - Technology icons
  - File icons
  - User icons
  - Special character handling
