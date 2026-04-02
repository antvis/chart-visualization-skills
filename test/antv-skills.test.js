'use strict';

/**
 * Main test runner - executes all test modules sequentially.
 * Exit code 1 if any module fails.
 */

const { execSync } = require('child_process');
const path = require('path');

const modules = [
  'bm25.test.js',
  'validator.test.js',
  'builder.test.js',
  'retriever.test.js'
];

let allPassed = true;

for (const mod of modules) {
  const modPath = path.join(__dirname, mod);
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Running: ${mod}`);
  console.log('─'.repeat(60));

  try {
    execSync(`node "${modPath}"`, { stdio: 'inherit' });
  } catch {
    allPassed = false;
  }
}

console.log(`\n${'═'.repeat(60)}`);
if (allPassed) {
  console.log('✅ All test suites passed');
} else {
  console.error('❌ Some test suites failed');
  process.exit(1);
}
