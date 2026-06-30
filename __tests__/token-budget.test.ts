import { describe, it, expect } from 'vitest';
import {
  estimateTokens,
  extractCodeBlocks,
  truncateContent,
  formatForBudget,
  applyTokenBudget
} from '../src/core/token-budget';
import type { Skill } from '../src/core/types';

describe('token-budget', () => {
  describe('estimateTokens', () => {
    it('should estimate tokens for pure English text', () => {
      // 8 chars × 0.25 = 2 tokens
      expect(estimateTokens('abcdefgh')).toBe(2);
    });

    it('should estimate tokens for pure CJK text', () => {
      // 3 CJK chars × 0.67 = 2.01 → ceil = 3 (but Math.ceil on the accumulated sum)
      const result = estimateTokens('桑基图');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(5);
    });

    it('should estimate tokens for mixed text', () => {
      const result = estimateTokens('sankey桑基图');
      expect(result).toBeGreaterThan(0);
    });

    it('should handle empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });
  });

  describe('extractCodeBlocks', () => {
    it('should extract fenced code blocks from markdown', () => {
      const content = 'Some text\n```js\nconst x = 1;\n```\nMore text\n```ts\nconst y = 2;\n```';
      const blocks = extractCodeBlocks(content);
      expect(blocks).toHaveLength(2);
      expect(blocks[0]).toContain('const x = 1');
      expect(blocks[1]).toContain('const y = 2');
    });

    it('should return empty array when no code blocks exist', () => {
      expect(extractCodeBlocks('plain text only')).toEqual([]);
    });

    it('should handle code blocks with language specifier', () => {
      const content = '```typescript\ninterface Foo {}\n```';
      const blocks = extractCodeBlocks(content);
      expect(blocks).toHaveLength(1);
      expect(blocks[0]).toContain('typescript');
    });
  });

  describe('truncateContent', () => {
    it('should truncate content that exceeds maxTokens', () => {
      const longText = 'a'.repeat(100); // 100 × 0.25 = 25 tokens
      const result = truncateContent(longText, 10); // ~40 chars budget
      expect(result).toContain('<!-- truncated -->');
      expect(result.length).toBeLessThan(longText.length);
    });

    it('should not truncate content within budget', () => {
      const shortText = 'abc'; // 3 × 0.25 = 0.75 tokens
      const result = truncateContent(shortText, 100);
      expect(result).toBe('abc');
      expect(result).not.toContain('<!-- truncated -->');
    });
  });

  describe('formatForBudget', () => {
    const baseSkill: Skill = {
      id: 'test-skill',
      title: 'Test Skill',
      title_en: 'Test Skill',
      description: 'A test description',
      library: 'g2',
      version: '5.x',
      category: 'chart',
      subcategory: '',
      tags: ['test'],
      use_cases: [],
      anti_patterns: [],
      related: [],
      content: '## Intro\nSome text\n```js\nconst x = 1;\n```\nMore details here.'
    };

    it('level 0: should return full content', () => {
      const result = formatForBudget(baseSkill, 0, 500);
      expect(result).toContain('Test Skill');
      expect(result).toContain('Some text');
      expect(result).toContain('const x = 1');
      expect(result).toContain('More details');
    });

    it('level 1: should return summary + code blocks only', () => {
      const result = formatForBudget(baseSkill, 1, 500);
      expect(result).toContain('Test Skill');
      expect(result).toContain('A test description');
      expect(result).toContain('const x = 1');
      // Should NOT contain the prose "More details" (it's not in a code block)
      expect(result).not.toContain('More details');
    });

    it('level 2: should return summary only', () => {
      const result = formatForBudget(baseSkill, 2, 500);
      expect(result).toContain('Test Skill');
      expect(result).toContain('A test description');
      // Should NOT contain any body content
      expect(result).not.toContain('Some text');
      expect(result).not.toContain('const x = 1');
    });

    it('should truncate when budget is too small for code blocks', () => {
      const result = formatForBudget(baseSkill, 1, 5);
      // Very small budget — should fallback to truncateContent
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('applyTokenBudget', () => {
    const makeSkill = (id: string, content: string): Skill => ({
      id,
      title: `Skill ${id}`,
      title_en: `Skill ${id}`,
      description: '',
      library: 'g2',
      version: '',
      category: '',
      subcategory: '',
      tags: [],
      use_cases: [],
      anti_patterns: [],
      related: [],
      content
    });

    it('should give full budget to __info__ and trim remaining skills', () => {
      const skills: Skill[] = [
        {
          ...makeSkill('__info__g2', 'Core constraints text that is important'),
          category: '__info__'
        },
        makeSkill('skill-1', 'Content for skill one'),
        makeSkill('skill-2', 'Content for skill two'),
      ];

      const result = applyTokenBudget(skills, 20, 1);
      // __info__ should keep its content
      expect(result[0].content).toBeDefined();
    });

    it('should set content to undefined when budget exhausted', () => {
      const skills: Skill[] = [
        {
          ...makeSkill('__info__g2', 'Very long constraints content eating all budget'),
          category: '__info__'
        },
        makeSkill('skill-1', 'Short content'),
        makeSkill('skill-2', 'Another content'),
      ];

      // Very small budget — info consumes it all
      const result = applyTokenBudget(skills, 5, 1);
      // Skills after info should have no content
      expect(result[1].content).toBeUndefined();
      expect(result[2].content).toBeUndefined();
    });

    it('should handle no __info__ skill gracefully', () => {
      const skills: Skill[] = [
        makeSkill('skill-1', 'Content for skill one'),
      ];

      const result = applyTokenBudget(skills, 50, 0);
      expect(result[0].content).toBeDefined();
    });
  });
});
