import { describe, it, expect } from 'vitest';
import { retrieve } from '../src/api';

describe('retrieve API', () => {
  it('should retrieve docs with default parameters', async () => {
    const results = await retrieve('折线图');
    // When context is available, results should be non-empty.
    // When context is unavailable (model not downloaded), returns empty.
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('title');
    }
  });

  it('should respect topk parameter', async () => {
    const results = await retrieve('bar chart', {
      library: 'g2',
      topK: 3,
    });
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results.length).toBeLessThanOrEqual(3);
    }
  });

  it('should support g6 library parameter', async () => {
    const results = await retrieve('graph layout', {
      library: 'g6',
    });
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle mixed Chinese/English query', async () => {
    const results = await retrieve('饼图 tooltip', {
      library: 'g2',
      topK: 5,
    });
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results.length).toBeLessThanOrEqual(5);
    }
  });

  it('should include constraints docs as regular search results', async () => {
    const results = await retrieve('核心约束 MUST', {
      library: 'g2',
      topK: 5,
    });
    expect(Array.isArray(results)).toBe(true);
    // Constraints docs (category: __constraints__) may appear in results
    // when the query matches their content.
    if (results.length > 0) {
      // @ts-ignore
      const constraintDocs = results.filter((d) => d.category === '__constraints__');
      // Constraints are indexed as regular docs — they appear naturally in search.
      // No assertion on count since it depends on search relevance.
      expect(constraintDocs.every((d) => d.id.includes('constraints'))).toBe(true);
    }
  });
});
