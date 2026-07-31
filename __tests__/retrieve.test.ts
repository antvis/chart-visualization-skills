import { describe, it, expect } from 'vitest';
import { retrieve } from '../src/api';

describe('retrieve API', () => {
  it('should retrieve docs with default parameters', async () => {
    const results = await retrieve('折线图');
    // When context is available, results should be non-empty.
    // When context is unavailable (model not downloaded), returns empty.
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('title');
  });

  it('should respect topk parameter', async () => {
    const results = await retrieve('bar chart', {
      library: 'g2',
      topK: 3,
      content: false,
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('should support g6 library parameter', async () => {
    const results = await retrieve('graph layout', {
      library: 'g6',
    });
    expect(results.length).toBeGreaterThan(0);
  });

  it('should handle mixed Chinese/English query', async () => {
    const results = await retrieve('饼图 tooltip', {
      library: 'g2',
      topK: 5,
      content: false,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('should include constraints docs as regular search results', async () => {
    const results = await retrieve('核心约束 MUST', {
      library: 'g2',
      topK: 5,
    });
    expect(results.length).toBeGreaterThan(0);
    const constraintDocs = results.filter((d) => d.category === '__constraints__');
    expect(constraintDocs.every((d) => d.id.includes('constraints'))).toBe(true);
  });

  it('should rank exact chart types first', async () => {
    const results = await retrieve('桑基图', {
      library: 'g2',
      topK: 3,
      content: false,
    });
    expect(results[0].id).toBe('g2-mark-sankey');
  });

  it('should search across libraries by default', async () => {
    const results = await retrieve('force network graph', {
      topK: 5,
      content: false,
    });
    expect(results.some((doc) => doc.library === 'g6')).toBe(true);
  });
});
