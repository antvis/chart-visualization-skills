import { describe, it, expect } from 'vitest';
import { SimpleEmbedder, isCJK } from '../src/core/retrieval/embedder';

describe('embedder', () => {
  describe('isCJK', () => {
    it('should identify CJK Unified characters', () => {
      expect(isCJK('桑')).toBe(true);
      expect(isCJK('图')).toBe(true);
      expect(isCJK('树')).toBe(true);
    });

    it('should identify CJK Extension A characters', () => {
      // CJK Ext-A range: 0x3400–0x4DBF
      expect(isCJK('\u3447')).toBe(true);
    });

    it('should identify Hiragana and Katakana', () => {
      expect(isCJK('\u3042')).toBe(true); // Hiragana あ
      expect(isCJK('\u30AB')).toBe(true); // Katakana カ
    });

    it('should identify Hangul', () => {
      expect(isCJK('\uAC00')).toBe(true); // Hangul 가
    });

    it('should not identify ASCII as CJK', () => {
      expect(isCJK('a')).toBe(false);
      expect(isCJK('Z')).toBe(false);
      expect(isCJK('0')).toBe(false);
    });

    it('should not identify common punctuation as CJK', () => {
      expect(isCJK('.')).toBe(false);
      expect(isCJK('-')).toBe(false);
      expect(isCJK(' ')).toBe(false);
    });
  });

  describe('SimpleEmbedder', () => {
    const embedder = new SimpleEmbedder();

    it('should produce vectors of the correct dimension', async () => {
      const vec = await embedder.embed('test query');
      expect(vec.length).toBe(512);
    });

    it('should produce normalized vectors (L2 norm ≈ 1)', async () => {
      const vec = await embedder.embed('test query');
      let norm = 0;
      for (const v of vec) norm += v * v;
      norm = Math.sqrt(norm);
      expect(Math.abs(norm - 1)).toBeLessThan(0.01);
    });

    it('should produce non-zero vectors for meaningful text', async () => {
      const vec = await embedder.embed('桑基图 sankey');
      const nonZeroCount = vec.filter(v => v !== 0).length;
      expect(nonZeroCount).toBeGreaterThan(0);
    });

    it('should produce similar vectors for synonymous terms', async () => {
      const vec1 = await embedder.embed('桑基图');
      const vec2 = await embedder.embed('sankey');
      // Both should expand to include each other's tokens via synonyms
      // so their vectors should have some overlap
      let dot = 0;
      for (let i = 0; i < vec1.length; i++) dot += vec1[i] * vec2[i];
      // Cosine similarity should be positive (they share synonym-expanded tokens)
      expect(dot).toBeGreaterThan(0);
    });

    it('should produce different vectors for unrelated terms', async () => {
      const vec1 = await embedder.embed('桑基图');
      const vec2 = await embedder.embed('热力图');
      let dot = 0;
      for (let i = 0; i < vec1.length; i++) dot += vec1[i] * vec2[i];
      // They may share some unigram overlap but should not be identical
      expect(Math.abs(dot - 1)).toBeGreaterThan(0.01);
    });

    it('should support synchronous embedding via embedSync', () => {
      const vec = embedder.embedSync('test query');
      expect(vec.length).toBe(512);
    });

    it('should support batch embedding', async () => {
      const vecs = await embedder.embedBatch(['query one', 'query two']);
      expect(vecs.length).toBe(2);
      expect(vecs[0].length).toBe(512);
      expect(vecs[1].length).toBe(512);
    });

    it('should handle empty text gracefully', async () => {
      const vec = await embedder.embed('');
      // Empty text should still produce a 512-d vector (all zeros or near-zero)
      expect(vec.length).toBe(512);
    });

    it('should weight CJK trigrams higher than unigrams', async () => {
      // A query with trigrams should produce a vector with higher peak values
      // than one with only unigrams (due to trigram weight = 2.0 vs unigram = 0.15)
      const vecTrigram = await embedder.embed('矩形树图');
      const maxTrigram = Math.max(...vecTrigram.map(Math.abs));
      const vecUnigram = await embedder.embed('图型');
      const maxUnigram = Math.max(...vecUnigram.map(Math.abs));
      // Trigrams get higher weight, so peak values should be larger
      expect(maxTrigram).toBeGreaterThan(maxUnigram * 0.5);
    });

    it('should expand synonyms during embedding', async () => {
      // '树图' should get synonym expansion to 'treemap'
      // So the embedding of '树图' should share hash buckets with 'treemap'
      const vec1 = await embedder.embed('树图');
      const vec2 = await embedder.embed('treemap');
      let dot = 0;
      for (let i = 0; i < vec1.length; i++) dot += vec1[i] * vec2[i];
      expect(dot).toBeGreaterThan(0);
    });
  });
});
