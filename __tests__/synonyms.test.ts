import { describe, it, expect } from 'vitest';
import { expandQuery, getSynonymsForToken, getSynonymMap } from '../src/core/synonyms';

describe('synonyms', () => {
  describe('getSynonymMap', () => {
    it('should return a bidirectional map with both Chinese and English entries', () => {
      const map = getSynonymMap();

      // Chinese → English
      expect(map.get('桑基图')).toContainEqual('sankey');
      expect(map.get('树图')).toContainEqual('treemap');

      // English → Chinese (auto-generated reverse direction)
      expect(map.get('sankey')).toContainEqual('桑基图');
      expect(map.get('treemap')).toContainEqual('矩形树图');
      expect(map.get('treemap')).toContainEqual('树图');
    });

    it('should handle multi-valued synonyms (marimekko → 马赛克图)', () => {
      const map = getSynonymMap();
      expect(map.get('马赛克图')).toContainEqual('mosaic');
      expect(map.get('马赛克图')).toContainEqual('marimekko');
      // Reverse: both mosaic and marimekko → 马赛克图
      expect(map.get('mosaic')).toContainEqual('马赛克图');
      expect(map.get('marimekko')).toContainEqual('马赛克图');
    });

    it('should not have duplicate entries in reverse direction', () => {
      const map = getSynonymMap();
      // 'treemap' reverse should have exactly '矩形树图' and '树图'
      const treemapSynonyms = map.get('treemap');
      expect(treemapSynonyms).toBeDefined();
      const unique = new Set(treemapSynonyms);
      expect(unique.size).toBe(treemapSynonyms!.length);
    });
  });

  describe('expandQuery', () => {
    it('should expand Chinese chart types to English equivalents', () => {
      const result = expandQuery('桑基图');
      expect(result).toContain('sankey');
      expect(result).toContain('桑基图');
    });

    it('should expand English chart types to Chinese equivalents', () => {
      const result = expandQuery('treemap');
      expect(result).toContain('矩形树图');
      expect(result).toContain('树图');
    });

    it('should expand mixed Chinese/English queries', () => {
      const result = expandQuery('热力图 heatmap');
      // Should add English synonyms for 热力图 (already has heatmap)
      expect(result).toContain('热力图');
      // Should add Chinese for heatmap
      expect(result).toContain('heatmap');
    });

    it('should not duplicate terms already present in the query', () => {
      const result = expandQuery('sankey');
      // sankey is already in the query, so its synonym 桑基图 should be added
      expect(result).toContain('sankey');
      expect(result).toContain('桑基图');
      // But sankey itself should not be added again (no duplication)
      const parts = result.split(/\s+/);
      const sankeyCount = parts.filter(p => p === 'sankey').length;
      expect(sankeyCount).toBe(1);
    });

    it('should not expand unknown terms', () => {
      const result = expandQuery('未知图表类型');
      expect(result).toBe('未知图表类型');
    });

    it('should expand multiple terms in one query', () => {
      const result = expandQuery('桑基图和热力图');
      expect(result).toContain('sankey');
      expect(result).toContain('heatmap');
    });

    it('should handle G6-specific terms', () => {
      const result = expandQuery('思维导图');
      expect(result).toContain('mindmap');
    });
  });

  describe('getSynonymsForToken', () => {
    it('should return synonyms for known tokens', () => {
      const syns = getSynonymsForToken('桑基图');
      expect(syns).toContainEqual('sankey');
    });

    it('should return English → Chinese synonyms', () => {
      const syns = getSynonymsForToken('sankey');
      expect(syns).toContainEqual('桑基图');
    });

    it('should return empty array for unknown tokens', () => {
      const syns = getSynonymsForToken('unknown');
      expect(syns).toEqual([]);
    });
  });
});
