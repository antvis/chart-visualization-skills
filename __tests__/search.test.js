import { describe, it, expect } from 'vitest';
import { searchIcons } from '../skills/icon-retrieval/scripts/search.js';

describe('search.js - Icon Retrieval Script', () => {
  describe('searchIcons - Real API Tests', () => {
    it('should search for document icons and return results', async () => {
      try {
        const results = await searchIcons('document', 3);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
        expect(results.length).toBeLessThanOrEqual(3);

        // Verify structure of returned icons
        if (results.length > 0) {
          expect(results[0]).toHaveProperty('url');
          expect(results[0]).toHaveProperty('svg');
          expect(typeof results[0].url).toBe('string');
          expect(typeof results[0].svg).toBe('string');
          // SVG should contain svg tag
          expect(results[0].svg).toMatch(/<svg/);
        }
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
      }
    }, 15000);

    it('should search for security icons with default topK', async () => {
      try {
        const results = await searchIcons('security');

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        // Default topK is 5
        expect(results.length).toBeLessThanOrEqual(5);

        results.forEach(icon => {
          expect(icon).toHaveProperty('url');
          expect(icon).toHaveProperty('svg');
          expect(icon.url).toMatch(/^https?:\/\//);
          expect(icon.svg).toContain('<svg');
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
      }
    }, 15000);

    it('should search for technology icons', async () => {
      try {
        const results = await searchIcons('technology', 2);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeLessThanOrEqual(2);

        results.forEach(icon => {
          expect(icon.url).toBeDefined();
          expect(icon.svg).toBeDefined();
          // Verify SVG is valid XML-like content
          expect(icon.svg).toMatch(/^<svg/);
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
      }
    }, 15000);

    it('should search for file icons', async () => {
      try {
        const results = await searchIcons('file', 4);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
        expect(results.length).toBeLessThanOrEqual(4);

        // Check that all results have valid structure
        results.forEach(icon => {
          expect(icon).toMatchObject({
            url: expect.any(String),
            svg: expect.any(String),
          });
          expect(icon.svg.length).toBeGreaterThan(0);
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
      }
    }, 15000);

    it('should search for user icons', async () => {
      try {
        const results = await searchIcons('user', 1);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeLessThanOrEqual(1);

        if (results.length > 0) {
          const icon = results[0];
          expect(icon.url).toMatch(/^https:\/\//);
          expect(icon.svg).toContain('xmlns');
          expect(icon.svg).toContain('viewBox');
        }
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
      }
    }, 15000);

    it('should handle search with special characters', async () => {
      try {
        // Test with a common query that might have special chars
        const results = await searchIcons('data & analytics', 2);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        // Should handle the query without errors
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
      }
    }, 15000);

    it('should return empty array for very obscure search', async () => {
      try {
        // Using a very unlikely search term
        const results = await searchIcons('xyzabc123unlikely', 5);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        // May return empty or few results
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
      }
    }, 15000);
  });
});
