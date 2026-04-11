# Unit Tests

This directory contains tests for the icon-retrieval skill documentation.

## Test Files

- `search.test.js` - Documentation checks for icon-retrieval API and curl usage

## Running Tests

```bash
npm test
```

## Test Approach

These tests validate that `skills/icon-retrieval/SKILL.md` documents:
- The icon HTTP API endpoint
- Curl usage examples
- No stale references to the removed Node.js helper script

## Test Data

Test data examples are based on:
- `skills/icon-retrieval/SKILL.md` - Icon search examples

## Test Coverage

- **Skill doc checks**:
  - API endpoint exists
  - curl command example exists
  - removed script command is not referenced
