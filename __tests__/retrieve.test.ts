import { describe, it, expect, beforeAll } from 'vitest';
import { retrieve } from '../src/api';
import { isZvecAvailable } from '../src/core/retrieval/zvec-store';

const zvecReady = isZvecAvailable();

describe('retrieve API', () => {
  // When zvec is not available, vector/hybrid retrieval returns empty results.
  // These tests work in both environments.
  const expectResults = (results: unknown[], minExpected = 0) => {
    if (zvecReady) {
      expect(results.length).toBeGreaterThan(minExpected);
    } else {
      // Without zvec, vector/hybrid returns empty – that's expected
      expect(results.length).toBe(0);
    }
  };

  it('should retrieve skills with default parameters', () => {
    const results = retrieve('折线图');
    // Default strategy is now 'hybrid'
    if (zvecReady) {
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(7);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('title');
      expect(results[0].content).toBeUndefined();
    } else {
      expect(results.length).toBe(0);
    }
  });

  it('should respect topk parameter', () => {
    const results = retrieve('bar chart', { library: 'g2', topK: 3 });
    if (zvecReady) {
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(3);
    }
  });

  it('should support g6 library parameter', () => {
    const results = retrieve('graph layout', { library: 'g6' });
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle mixed Chinese/English query', () => {
    const results = retrieve('饼图 tooltip', { library: 'g2', topK: 5 });
    if (zvecReady) {
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);
    }
  });

  it('should load markdown content on demand', () => {
    // Use legacy positional overload for backward compat test
    const results = retrieve('折线图', 'g2', 1, true);
    if (zvecReady) {
      expect(results.length).toBeGreaterThan(0);
      expect(typeof results[0].content).toBe('string');
      expect((results[0].content || '').length).toBeGreaterThan(0);
      expect(results[0].content).not.toMatch(/^---\n/);
    }
  });
});
