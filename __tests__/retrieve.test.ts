import { describe, it, expect } from 'vitest';
import { retrieve } from '../src/api';

describe('retrieve API', () => {
  it('should retrieve skills with default parameters', () => {
    const results = retrieve('折线图');
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(7);
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('title');
    expect(results[0].content).toBeUndefined();
  });

  it('should respect topk parameter', () => {
    const results = retrieve('bar chart', 'g2', 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('should support g6 library parameter', () => {
    const results = retrieve('graph layout', 'g6');
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle mixed Chinese/English query', () => {
    const results = retrieve('饼图 tooltip', 'g2', 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('should load markdown content on demand', () => {
    const results = retrieve('折线图', 'g2', 1, true);
    expect(results.length).toBeGreaterThan(0);
    expect(typeof results[0].content).toBe('string');
    expect((results[0].content || '').length).toBeGreaterThan(0);
    // content should be body only, without frontmatter
    expect(results[0].content).not.toMatch(/^---\n/);
  });
});
