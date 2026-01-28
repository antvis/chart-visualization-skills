const assert = require('assert');
const { CHART_TYPE_MAP } = require('./generate');

function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ✗ ${name}`);
      console.log(`    ${err.message}`);
      failed++;
    }
  }

  console.log('\nChart Generation Script Tests');

  // Test CHART_TYPE_MAP
  test('CHART_TYPE_MAP should contain line chart', () => {
    assert.strictEqual(CHART_TYPE_MAP.generate_line_chart, 'line');
  });

  test('CHART_TYPE_MAP should contain bar chart', () => {
    assert.strictEqual(CHART_TYPE_MAP.generate_bar_chart, 'bar');
  });

  test('CHART_TYPE_MAP should contain pie chart', () => {
    assert.strictEqual(CHART_TYPE_MAP.generate_pie_chart, 'pie');
  });

  test('CHART_TYPE_MAP should contain all 25 chart types', () => {
    assert.strictEqual(Object.keys(CHART_TYPE_MAP).length, 25);
  });

  test('CHART_TYPE_MAP should map generate_district_map to district-map', () => {
    assert.strictEqual(CHART_TYPE_MAP.generate_district_map, 'district-map');
  });

  test('CHART_TYPE_MAP should map generate_word_cloud_chart to word-cloud', () => {
    assert.strictEqual(CHART_TYPE_MAP.generate_word_cloud_chart, 'word-cloud');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}

if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };
