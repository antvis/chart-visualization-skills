import { describe, it, expect } from 'vitest';
import { synonyms } from '../src/synonyms';

describe('synonyms', () => {
  describe('bidirectional map', () => {
    it('should have Chinese → English entries', () => {
      // Chinese → English
      expect(synonyms['桑基图']).toContain('sankey');
      expect(synonyms['树图']).toContain('treemap');
    });

    it('should have English → Chinese entries (auto-generated reverse)', () => {
      // English → Chinese
      expect(synonyms['sankey']).toContain('桑基图');
      expect(synonyms['treemap']).toContain('矩形树图');
      expect(synonyms['treemap']).toContain('树图');
    });

    it('should handle multi-valued synonyms', () => {
      expect(synonyms['马赛克图']).toContain('mosaic');
      expect(synonyms['马赛克图']).toContain('marimekko');
      // Reverse: both mosaic and marimekko → 马赛克图
      expect(synonyms['mosaic']).toContain('马赛克图');
      expect(synonyms['marimekko']).toContain('马赛克图');
    });

    it('should not have duplicate entries', () => {
      const treemapSynonyms = synonyms['treemap'];
      expect(treemapSynonyms).toBeDefined();
      const unique = new Set(treemapSynonyms);
      expect(unique.size).toBe(treemapSynonyms.length);
    });
  });
});