import { beforeEach, describe, expect, it, vi } from 'vitest';
import { retrieve } from '../src/retriever';
import { countTokens } from '../src/token';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('../src/context', () => ({
  LIBRARIES: ['g2', 'g6', 'x6'],
  getContext: async () => ({ query }),
}));

const content = '说明'.repeat(100) + '\n```js\n' + 'const x = 1;\n'.repeat(1000) + '```';

beforeEach(() => {
  query.mockReset();
  query.mockResolvedValue([
    { id: 'first', score: 1, content, meta: { title: 'First', library: 'g2' } },
    { id: 'second', score: 0.5, content, meta: { title: 'Second', library: 'g2' } },
  ]);
});

describe('retrieve content budgets', () => {
  it('honors an explicit zero budget while preserving result metadata', async () => {
    const docs = await retrieve('bar chart', { library: 'g2', maxTokens: 0 });

    expect(docs.map(doc => doc.content)).toEqual(['', '']);
    expect(docs.map(doc => doc.title)).toEqual(['First', 'Second']);
  });

  it('enforces the aggregate content budget through the public retrieval API', async () => {
    const docs = await retrieve('bar chart', { library: 'g2', maxTokens: 100 });

    expect(docs.reduce((sum, doc) => sum + countTokens(doc.content!), 0))
      .toBeLessThanOrEqual(100);
    expect(docs.every(doc => !doc.content!.includes('<<CODE'))).toBe(true);
  });

  it('preserves full content when no budget is supplied', async () => {
    const docs = await retrieve('bar chart', { library: 'g2' });

    expect(docs.map(doc => doc.content)).toEqual([content, content]);
  });

  it('keeps metadata-only responses free of content even with a budget', async () => {
    const docs = await retrieve('bar chart', { library: 'g2', content: false, maxTokens: 0 });

    expect(docs.every(doc => !('content' in doc))).toBe(true);
  });
});
