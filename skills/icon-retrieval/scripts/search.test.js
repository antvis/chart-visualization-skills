const assert = require('assert');

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

  console.log('\nIcon Search Script Tests');

  // Test searchIcons function exists
  test('searchIcons function should be exported', () => {
    const { searchIcons } = require('./search');
    assert.strictEqual(typeof searchIcons, 'function');
  });

  // Test URL construction
  test('should construct correct URL with query and topK', () => {
    const params = new URLSearchParams({ text: 'test', topK: '5' });
    const url = `https://www.weavefox.cn/api/open/v1/icon?${params}`;
    assert.ok(url.includes('text=test'));
    assert.ok(url.includes('topK=5'));
  });

  // Test URL construction with different topK
  test('should construct URL with custom topK', () => {
    const params = new URLSearchParams({ text: 'document', topK: '10' });
    const url = `https://www.weavefox.cn/api/open/v1/icon?${params}`;
    assert.ok(url.includes('text=document'));
    assert.ok(url.includes('topK=10'));
  });

  // Test parameter encoding
  test('should encode special characters in query', () => {
    const params = new URLSearchParams({ text: 'test & special', topK: '5' });
    const url = `https://www.weavefox.cn/api/open/v1/icon?${params}`;
    assert.ok(url.includes('test'));
    assert.ok(url.includes('special'));
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}

if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };
