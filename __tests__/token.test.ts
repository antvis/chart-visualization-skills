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
  it('never clips a quoted fence opener at the end of a document', () => {
    const opener = '> ```javascript';
    const content = 'Preface '.repeat(10) + '\n' + opener;
    for (let budget = 1; budget <= countTokens(content); budget++) {
      const result = truncateSmart(content, budget);
      expect(countTokens(result)).toBeLessThanOrEqual(budget);
      if (result.includes('>')) expect(result).toContain(opener);
    }
  });

  it.each([
    '> ```javascript\n> const value = 1;\n>```',
    '> > ~~~javascript\r\n> > const value = 1;\r\n>> ~~~',
    '> ````markdown\n> ```js\n> const value = 1;\n> ```\n> ````',
  ])('retains a complete quoted code block: %s', (code) => {
    const budget = countTokens(code);
    const result = truncateSmart('说明'.repeat(100) + '\n' + code, budget);

    expect(result).toContain(code);
    expect(countTokens(result)).toBeLessThanOrEqual(budget);
  });

  it('retains a first code block that exactly fits without a joining newline', () => {
    const code = '```js\nx = 1;\n```'; // 16 character units, exactly 4 tokens
    const result = truncateSmart('说明'.repeat(100) + '\n' + code, 4);

    expect(result).toBe(code);
    expect(countTokens(result)).toBe(4);
  });

  it('counts rounding once across frontmatter, code and actual joining newlines', () => {
    const frontmatter = '---\nt: x\n---\n';
    const code = '```js\nx = 1;\n```';
    const expected = frontmatter + '\n' + code;
    const budget = countTokens(expected);
    const result = truncateSmart(frontmatter + '中'.repeat(100) + '\n' + code, budget);

    expect(result).toBe(expected);
    expect(countTokens(result)).toBe(budget);
  });

  it('fills the remaining budget with prose after accounting for its separator', () => {
    const code = '```js\nx = 1;\n```';
    const result = truncateSmart('abcdef\n' + code, 5);

    expect(result).toBe('abc\n' + code);
    expect(countTokens(result)).toBe(5);
  });

  it.each([1, 2, 3])('uses all %i tokens for plain text without reserving a newline', (budget) => {
    const content = 'abcdefghijklmnopqrst';

    expect(truncateSmart(content, budget)).toBe(content.slice(0, budget * 4));
  });

  it('does not restore an oversized code block beyond the budget', () => {
    const content = '```js\n' + 'const x = 1;\n'.repeat(1000) + '```';
    const result = truncateSmart(content, 100);

    expect(countTokens(result)).toBeLessThanOrEqual(100);
    expect(result).toBe('');
  });

  it('never introduces code placeholders when trimming prose before a block', () => {
    const content = '说明'.repeat(150) + '\n\n```js\nconst x = 1;\n```\n';
    for (let budget = 1; budget <= 100; budget++) {
      const result = truncateSmart(content, budget);
      expect(countTokens(result)).toBeLessThanOrEqual(budget);
      expect(result).not.toContain('<<CODE');
      expect((result.match(/^```/gm) ?? []).length % 2).toBe(0);
    }
  });

  it('keeps small complete code blocks when a preceding block cannot fit', () => {
    const oversized = '```js\n' + 'const x = 1;\n'.repeat(1000) + '```\n';
    const small = '```js\nconst y = 2;\n```';
    const result = truncateSmart(oversized + '\n' + small, 30);

    expect(result).toContain(small);
    expect(result).not.toContain('const x');
    expect(countTokens(result)).toBeLessThanOrEqual(30);
  });

  it('omits oversized frontmatter without leaving a broken delimiter', () => {
    const content = '---\ntitle: ' + '中'.repeat(100) + '\n---\nUseful prose';
    const result = truncateSmart(content, 10);

    expect(result).toContain('Useful prose');
    expect(result).not.toContain('---');
    expect(countTokens(result)).toBeLessThanOrEqual(10);
  });

  it('handles CRLF frontmatter and tilde fences as complete segments', () => {
    const frontmatter = '---\r\ntitle: Test\r\n---\r\n';
    const code = '~~~js\r\nconst x = 1;\r\n~~~';
    const content = frontmatter + '描述'.repeat(100) + '\r\n' + code;
    const result = truncateSmart(content, 30);

    expect(result).toContain(frontmatter);
    expect(result).toContain(code);
    expect(countTokens(result)).toBeLessThanOrEqual(30);
  });

  it('keeps longer fences intact when their code contains shorter fences', () => {
    const code = '````markdown\n```js\nconst x = 1;\n```\n````';
    const result = truncateSmart('Long explanation. '.repeat(100) + '\n' + code, 30);

    expect(result).toContain(code);
    expect(countTokens(result)).toBeLessThanOrEqual(30);
  });

  it.each([0, 1, 2, 10, 20])('enforces a %i-token budget for mixed text', (budget) => {
    const content = '中😀文abc'.repeat(50);
    const result = truncateSmart(content, budget);

    expect(countTokens(result)).toBeLessThanOrEqual(budget);
    expect(content.startsWith(result)).toBe(true);
    expect(result).not.toMatch(/[\uD800-\uDBFF]$/);
  });

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
  it('enforces the total budget across documents with large code blocks', () => {
    const content = '```js\n' + 'const x = 1;\n'.repeat(1000) + '```';
    const docs = [{ id: '1', content }, { id: '2', content }] as Doc[];
    const result = applyTokenBudget(docs, 200);

    expect(result.reduce((sum, doc) => sum + countTokens(doc.content!), 0))
      .toBeLessThanOrEqual(200);
  });

  it('returns empty content when the budget is smaller than the document count', () => {
    const docs = [{ id: '1', content: '中文' }, { id: '2', content: '中文' }] as Doc[];
    const result = applyTokenBudget(docs, 1);

    expect(result.map(doc => doc.content)).toEqual(['', '']);
  });

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
