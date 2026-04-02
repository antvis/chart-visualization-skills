import { describe, it } from 'vitest';
import assert from 'assert';
import {
  BM25Index,
  tokenize,
  cleanQuery,
  termFrequency,
  detectPrimaryChartTokens
} from '../utils/bm25.js';

// ─── cleanQuery ───────────────────────────────────────────────────────────────

describe('cleanQuery', () => {
  it('strips code blocks', () => {
    const result = cleanQuery('绘制折线图 ```js\nconst x=1;\n``` 的效果');
    assert.ok(!result.includes('```'), 'should strip code fences');
    assert.ok(!result.includes('const x=1'), 'should strip code content');
  });

  it('strips 参考数据 section', () => {
    const result = cleanQuery('绘制折线图。参考数据：{"x":1,"y":2}');
    assert.ok(!result.includes('参考数据'), 'should remove 参考数据 prefix');
    assert.ok(!result.includes('"x":1'), 'should remove JSON payload');
  });

  it('strips boilerplate prefix', () => {
    const result = cleanQuery('根据描述绘制图表，请用 G2 绘制折线图');
    assert.ok(
      !result.startsWith('根据描述绘制图表'),
      'should strip boilerplate prefix'
    );
  });

  it('returns trimmed string', () => {
    assert.strictEqual(cleanQuery('  折线图  '), '折线图');
  });

  it('returns empty string for empty input', () => {
    assert.strictEqual(cleanQuery(''), '');
  });
});

// ─── tokenize ─────────────────────────────────────────────────────────────────

describe('tokenize', () => {
  it('tokenizes English text', () => {
    const tokens = tokenize('bar chart');
    assert.ok(
      tokens.includes('bar') || tokens.includes('柱状'),
      'should include bar or its synonym'
    );
  });

  it('tokenizes Chinese text', () => {
    const tokens = tokenize('折线图');
    assert.ok(
      tokens.includes('折线图') || tokens.includes('line'),
      'should include 折线图 or its synonym'
    );
  });

  it('returns empty array for empty input', () => {
    assert.deepStrictEqual(tokenize(''), []);
  });

  it('returns empty array for null/undefined', () => {
    assert.deepStrictEqual(tokenize(null), []);
    assert.deepStrictEqual(tokenize(undefined), []);
  });

  it('filters stop words', () => {
    const tokens = tokenize('the chart');
    assert.ok(!tokens.includes('the'), 'should filter English stop words');
  });

  it('does cross-language synonym expansion', () => {
    const tokens = tokenize('饼图');
    // 饼图 should expand to include pie or theta
    assert.ok(
      tokens.includes('pie') ||
        tokens.includes('theta') ||
        tokens.includes('interval'),
      `expected pie/theta/interval in tokens: ${tokens.join(',')}`
    );
  });
});

// ─── termFrequency ────────────────────────────────────────────────────────────

describe('termFrequency', () => {
  it('counts single occurrence', () => {
    const tf = termFrequency(['bar', 'chart', 'bar']);
    assert.strictEqual(tf.get('bar'), 2);
    assert.strictEqual(tf.get('chart'), 1);
  });

  it('returns empty Map for empty array', () => {
    const tf = termFrequency([]);
    assert.strictEqual(tf.size, 0);
  });
});

// ─── detectPrimaryChartTokens ─────────────────────────────────────────────────

describe('detectPrimaryChartTokens', () => {
  it('detects primary chart token', () => {
    const found = detectPrimaryChartTokens(['sankey', 'chart']);
    assert.ok(found.has('sankey'));
  });

  it('returns empty set when no primary tokens', () => {
    const found = detectPrimaryChartTokens(['bar', 'axis']);
    assert.strictEqual(found.size, 0);
  });
});

// ─── BM25Index ────────────────────────────────────────────────────────────────

describe('BM25Index', () => {
  const mockSkills = [
    {
      id: 'g2-mark-line',
      title: 'Line Chart',
      description: 'Draw line charts with G2',
      tags: ['line', 'trend'],
      category: 'marks',
      subcategory: 'line',
      use_cases: ['time series', 'trend analysis']
    },
    {
      id: 'g2-mark-interval',
      title: 'Bar Chart',
      description: 'Draw bar charts with G2',
      tags: ['bar', 'interval', 'column'],
      category: 'marks',
      subcategory: 'interval',
      use_cases: ['comparison', 'distribution']
    },
    {
      id: 'g2-mark-point',
      title: 'Scatter Plot',
      description: 'Draw scatter plots with G2',
      tags: ['point', 'scatter'],
      category: 'marks',
      subcategory: 'point',
      use_cases: ['correlation', 'distribution']
    }
  ];

  it('builds index without error', () => {
    const idx = new BM25Index();
    idx.build(mockSkills);
    assert.strictEqual(idx.docCount, 3);
    assert.ok(idx.avgDocLength > 0);
  });

  it('search returns results', () => {
    const idx = new BM25Index();
    idx.build(mockSkills);
    const results = idx.search('line chart');
    assert.ok(results.length > 0, 'should return at least one result');
    assert.ok('skill' in results[0], 'result should have skill property');
    assert.ok('score' in results[0], 'result should have score property');
  });

  it('search ranks relevant result first', () => {
    const idx = new BM25Index();
    idx.build(mockSkills);
    const results = idx.search('line chart');
    assert.strictEqual(
      results[0].skill.id,
      'g2-mark-line',
      'line chart query should return line chart first'
    );
  });

  it('search returns bar chart for bar query', () => {
    const idx = new BM25Index();
    idx.build(mockSkills);
    const results = idx.search('bar chart');
    assert.strictEqual(
      results[0].skill.id,
      'g2-mark-interval',
      'bar query should return interval first'
    );
  });

  it('search respects topK parameter', () => {
    const idx = new BM25Index();
    idx.build(mockSkills);
    const results = idx.search('chart', 2);
    assert.ok(results.length <= 2, 'should return at most topK results');
  });

  it('search returns empty array for nonsense query', () => {
    const idx = new BM25Index();
    idx.build(mockSkills);
    const results = idx.search('xyzzy123nonsense');
    assert.strictEqual(results.length, 0);
  });

  it('search handles empty query gracefully', () => {
    const idx = new BM25Index();
    idx.build(mockSkills);
    const results = idx.search('');
    assert.ok(Array.isArray(results));
  });

  it('build with empty array does not throw', () => {
    const idx = new BM25Index();
    assert.doesNotThrow(() => idx.build([]));
    assert.strictEqual(idx.docCount, 0);
  });

  it('uses custom k1 and b parameters', () => {
    const idx = new BM25Index({ k1: 2.0, b: 0.3 });
    assert.strictEqual(idx.k1, 2.0);
    assert.strictEqual(idx.b, 0.3);
  });

  it('scores are positive numbers', () => {
    const idx = new BM25Index();
    idx.build(mockSkills);
    const results = idx.search('scatter');
    for (const r of results) {
      assert.ok(r.score > 0, 'score should be positive');
    }
  });
});
