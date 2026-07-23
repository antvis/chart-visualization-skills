import { describe, it, expect } from 'vitest';
import { countTokens, truncateSmart, applyTokenBudget } from '../src/token';
import type { Doc } from '../src/types';

describe('countTokens', () => {
  it('counts Chinese characters as 1 token each', () => {
    expect(countTokens('你好世界')).toBe(4);
  });

  it('counts English as 4 chars per token', () => {
    expect(countTokens('hello')).toBe(2); // 5/4 ≈ 2
    expect(countTokens('hello world')).toBe(3); // 11/4 ≈ 3
  });

  it('counts mixed content', () => {
    // "你"=1, "好"=1, "world"=5字符=2 tokens → 总共 4
    expect(countTokens('你好world')).toBe(4);
  });

  it('handles empty string', () => {
    expect(countTokens('')).toBe(0);
  });
});

describe('truncateSmart', () => {
  it('returns original content if under budget', () => {
    const content = 'hello world'; // 3 tokens
    expect(truncateSmart(content, 10)).toBe(content);
  });

  it('preserves frontmatter when truncating', () => {
    const content = `---
title: Test
---

Some description here.

\`\`\`js
console.log('test');
\`\`\`
`;
    const result = truncateSmart(content, 30);
    expect(result.startsWith('---')).toBe(true);
    expect(result).toContain('title: Test');
  });

  it('preserves code blocks when truncating', () => {
    const content = `---
title: Test
---

Description text that is very long and will be truncated.

\`\`\`js
const x = 1;
\`\`\`
`;
    const result = truncateSmart(content, 50);
    expect(result).toContain('```js');
    expect(result).toContain('const x = 1;');
  });

  it('truncates main body but keeps frontmatter and code', () => {
    const content = `---
title: Test
---

This is a very long description that should be shortened when we have a tight budget.

\`\`\`js
const x = 1;
\`\`\`

And more content here that will also be trimmed.
`;
    const result = truncateSmart(content, 40);

    // frontmatter 保留了
    expect(result).toContain('---');
    expect(result).toContain('title: Test');

    // 代码块保留了
    expect(result).toContain('```js');
    expect(result).toContain('const x = 1;');

    // 但总长度变短了
    expect(result.length).toBeLessThan(content.length);
  });

  it('handles content without frontmatter', () => {
    const content = `Just some plain text without frontmatter.

\`\`\`js
code here
\`\`\`
`;
    const result = truncateSmart(content, 20);
    expect(result).toContain('```js');
  });

  it('handles content without code blocks', () => {
    const content = `---
title: Test
---

Just plain description without any code blocks.`;
    const result = truncateSmart(content, 10);
    expect(result).toContain('title: Test');
  });
});

describe('applyTokenBudget', () => {
  it('distributes budget across docs', () => {
    const docs: Doc[] = [
      { id: '1', title: 'Doc 1', content: 'A'.repeat(100), description: '', library: 'g2', version: '', category: '', subcategory: '', tags: [], use_cases: [], anti_patterns: [], related: [] },
      { id: '2', title: 'Doc 2', content: 'B'.repeat(100), description: '', library: 'g2', version: '', category: '', subcategory: '', tags: [], use_cases: [], anti_patterns: [], related: [] },
    ];

    const result = applyTokenBudget(docs, 10);

    expect(result[0].content!.length).toBeLessThan(100);
    expect(result[1].content!.length).toBeLessThan(100);
  });

  it('returns original docs when budget is sufficient', () => {
    const docs: Doc[] = [
      { id: '1', title: 'Doc 1', content: 'short', description: '', library: 'g2', version: '', category: '', subcategory: '', tags: [], use_cases: [], anti_patterns: [], related: [] },
    ];

    const result = applyTokenBudget(docs, 100);

    expect(result[0].content).toBe('short');
  });

  it('handles empty docs array', () => {
    const result = applyTokenBudget([], 100);
    expect(result).toEqual([]);
  });

  it('preserves doc metadata', () => {
    const docs: Doc[] = [
      { id: '1', title: 'Test', description: 'desc', library: 'g2', version: '5', category: 'cat', subcategory: 'sub', tags: ['tag1'], use_cases: [], anti_patterns: [], related: [], content: 'A'.repeat(100) },
    ];

    const result = applyTokenBudget(docs, 10);

    expect(result[0].id).toBe('1');
    expect(result[0].title).toBe('Test');
    expect(result[0].description).toBe('desc');
    expect(result[0].library).toBe('g2');
  });
});