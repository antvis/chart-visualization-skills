'use strict';

const assert = require('assert');
const {
  BM25Index,
  tokenize,
  cleanQuery,
  termFrequency,
  STOP_WORDS,
  SYNONYMS,
  PRIMARY_CHART_TOKENS,
  detectPrimaryChartTokens
} = require('../utils/bm25');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ─── cleanQuery ───────────────────────────────────────────────────────────────

console.log('\ncleanQuery');

test('strips code blocks', () => {
  const result = cleanQuery('绘制折线图 ```js\nconst x=1;\n``` 的效果');
  assert.ok(!result.includes('```'), 'should strip code fences');
  assert.ok(!result.includes('const x=1'), 'should strip code content');
});

test('strips 参考数据 section', () => {
  const result = cleanQuery('绘制折线图。参考数据：{"x":1,"y":2}');
  assert.ok(!result.includes('参考数据'), 'should remove 参考数据 prefix');
  assert.ok(!result.includes('"x":1'), 'should remove JSON payload');
});

test('strips boilerplate prefix', () => {
  const result = cleanQuery('根据描述绘制图表，请用 G2 绘制折线图');
  assert.ok(
    !result.startsWith('根据描述绘制图表'),
    'should strip boilerplate prefix'
  );
});

test('returns trimmed string', () => {
  assert.strictEqual(cleanQuery('  折线图  '), '折线图');
});

test('returns empty string for empty input', () => {
  assert.strictEqual(cleanQuery(''), '');
});

// ─── tokenize ─────────────────────────────────────────────────────────────────

console.log('\ntokenize');

test('tokenizes English text', () => {
  const tokens = tokenize('bar chart');
  assert.ok(
    tokens.includes('bar') || tokens.includes('柱状'),
    'should include bar or its synonym'
  );
});

test('tokenizes Chinese text', () => {
  const tokens = tokenize('折线图');
  assert.ok(
    tokens.includes('折线图') || tokens.includes('line'),
    'should include 折线图 or its synonym'
  );
});

test('returns empty array for empty input', () => {
  assert.deepStrictEqual(tokenize(''), []);
});

test('returns empty array for null/undefined', () => {
  assert.deepStrictEqual(tokenize(null), []);
  assert.deepStrictEqual(tokenize(undefined), []);
});

test('filters stop words', () => {
  const tokens = tokenize('the chart');
  assert.ok(!tokens.includes('the'), 'should filter English stop words');
});

test('does cross-language synonym expansion', () => {
  const tokens = tokenize('饼图');
  // 饼图 should expand to include pie or theta
  assert.ok(
    tokens.includes('pie') ||
      tokens.includes('theta') ||
      tokens.includes('interval'),
    `expected pie/theta/interval in tokens: ${tokens.join(',')}`
  );
});

// ─── termFrequency ────────────────────────────────────────────────────────────

console.log('\ntermFrequency');

test('counts single occurrence', () => {
  const tf = termFrequency(['bar', 'chart', 'bar']);
  assert.strictEqual(tf.get('bar'), 2);
  assert.strictEqual(tf.get('chart'), 1);
});

test('returns empty Map for empty array', () => {
  const tf = termFrequency([]);
  assert.strictEqual(tf.size, 0);
});

// ─── detectPrimaryChartTokens ─────────────────────────────────────────────────

console.log('\ndetectPrimaryChartTokens');

test('detects primary chart token', () => {
  const found = detectPrimaryChartTokens(['sankey', 'chart']);
  assert.ok(found.has('sankey'));
});

test('returns empty set when no primary tokens', () => {
  const found = detectPrimaryChartTokens(['bar', 'axis']);
  assert.strictEqual(found.size, 0);
});

// ─── BM25Index ────────────────────────────────────────────────────────────────

console.log('\nBM25Index');

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

test('builds index without error', () => {
  const idx = new BM25Index();
  idx.build(mockSkills);
  assert.strictEqual(idx.docCount, 3);
  assert.ok(idx.avgDocLength > 0);
});

test('search returns results', () => {
  const idx = new BM25Index();
  idx.build(mockSkills);
  const results = idx.search('line chart');
  assert.ok(results.length > 0, 'should return at least one result');
  assert.ok('skill' in results[0], 'result should have skill property');
  assert.ok('score' in results[0], 'result should have score property');
});

test('search ranks relevant result first', () => {
  const idx = new BM25Index();
  idx.build(mockSkills);
  const results = idx.search('line chart');
  assert.strictEqual(
    results[0].skill.id,
    'g2-mark-line',
    'line chart query should return line chart first'
  );
});

test('search returns bar chart for bar query', () => {
  const idx = new BM25Index();
  idx.build(mockSkills);
  const results = idx.search('bar chart');
  assert.strictEqual(
    results[0].skill.id,
    'g2-mark-interval',
    'bar query should return interval first'
  );
});

test('search respects topK parameter', () => {
  const idx = new BM25Index();
  idx.build(mockSkills);
  const results = idx.search('chart', 2);
  assert.ok(results.length <= 2, 'should return at most topK results');
});

test('search returns empty array for nonsense query', () => {
  const idx = new BM25Index();
  idx.build(mockSkills);
  const results = idx.search('xyzzy123nonsense');
  assert.strictEqual(results.length, 0);
});

test('search handles empty query gracefully', () => {
  const idx = new BM25Index();
  idx.build(mockSkills);
  const results = idx.search('');
  assert.ok(Array.isArray(results));
});

test('build with empty array does not throw', () => {
  const idx = new BM25Index();
  assert.doesNotThrow(() => idx.build([]));
  assert.strictEqual(idx.docCount, 0);
});

test('uses custom k1 and b parameters', () => {
  const idx = new BM25Index({ k1: 2.0, b: 0.3 });
  assert.strictEqual(idx.k1, 2.0);
  assert.strictEqual(idx.b, 0.3);
});

test('scores are positive numbers', () => {
  const idx = new BM25Index();
  idx.build(mockSkills);
  const results = idx.search('scatter');
  for (const r of results) {
    assert.ok(r.score > 0, 'score should be positive');
  }
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
