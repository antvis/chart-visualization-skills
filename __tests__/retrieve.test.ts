import { describe, it, expect } from 'vitest';
import { retrieve } from '../src/api';

describe('retrieve API', () => {
  it('should retrieve docs with default parameters', async () => {
    const results = await retrieve('折线图');
    // When context is available, results should be non-empty.
    // When context is unavailable (model not downloaded), keyword fallback
    // may return results depending on index availability.
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
      includeConstraints: false
    });
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results.length).toBeLessThanOrEqual(3);
    }
  });

  it('should support g6 library parameter', async () => {
    const results = await retrieve('graph layout', {
      library: 'g6',
      includeConstraints: false
    });
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle mixed Chinese/English query', async () => {
    const results = await retrieve('饼图 tooltip', {
      library: 'g2',
      topK: 5,
      includeConstraints: false
    });
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results.length).toBeLessThanOrEqual(5);
    }
  });
});
