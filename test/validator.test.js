'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { SkillValidator } = require('../utils/validator');

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_SKILL = `---
id: g2-mark-line
title: Line Chart
description: Draw line charts
library: g2
version: "5.0"
category: marks
tags:
  - line
  - trend
use_cases:
  - time series
---

## 最小可运行示例

\`\`\`js
const chart = new Chart({ container: 'id' });
chart.line().encode('x', 'date').encode('y', 'value');
chart.render();
\`\`\`
`;

function writeTempSkill(filename, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'antv-skill-'));
  const g2dir = path.join(dir, 'g2');
  fs.mkdirSync(g2dir);
  const filePath = path.join(g2dir, filename);
  fs.writeFileSync(filePath, content);
  return { dir, filePath };
}

// ─── parseFrontMatter ─────────────────────────────────────────────────────────

console.log('\nparseFrontMatter');

const v = new SkillValidator();

test('parses valid front matter', () => {
  const meta = v.parseFrontMatter(VALID_SKILL);
  assert.strictEqual(meta.id, 'g2-mark-line');
  assert.strictEqual(meta.title, 'Line Chart');
  assert.strictEqual(meta.library, 'g2');
  assert.strictEqual(meta.version, '5.0');
  assert.strictEqual(meta.category, 'marks');
  assert.ok(meta.hasTags);
  assert.ok(meta.hasDescription);
});

test('returns null for missing front matter delimiter', () => {
  const result = v.parseFrontMatter('no front matter here');
  assert.strictEqual(result, null);
});

// ─── validateFile ─────────────────────────────────────────────────────────────

console.log('\nvalidateFile');

test('valid skill file passes', () => {
  const { filePath } = writeTempSkill('g2-mark-line.md', VALID_SKILL);
  const result = v.validateFile(filePath);
  assert.ok(result.valid, `errors: ${result.errors.join(', ')}`);
  assert.strictEqual(result.errors.length, 0);
});

test('missing front matter returns invalid', () => {
  const { filePath } = writeTempSkill(
    'g2-mark-test.md',
    '# No front matter\n\nsome content'
  );
  const result = v.validateFile(filePath);
  assert.ok(!result.valid);
  assert.ok(result.errors.some((e) => e.includes('Front Matter')));
});

test('missing required field id returns error', () => {
  const content = VALID_SKILL.replace('id: g2-mark-line\n', '');
  const { filePath } = writeTempSkill('g2-mark-noid.md', content);
  const result = v.validateFile(filePath);
  assert.ok(!result.valid);
  assert.ok(result.errors.some((e) => e.includes('id')));
});

test('invalid ID format returns error', () => {
  const content = VALID_SKILL.replace('id: g2-mark-line', 'id: InvalidID');
  const { filePath } = writeTempSkill('InvalidID.md', content);
  const result = v.validateFile(filePath);
  assert.ok(!result.valid);
  assert.ok(result.errors.some((e) => e.includes('ID format')));
});

test('ID mismatch with filename returns warning', () => {
  const { filePath } = writeTempSkill('g2-mark-other.md', VALID_SKILL);
  const result = v.validateFile(filePath);
  assert.ok(result.warnings.some((w) => w.includes('does not match filename')));
});

test('missing tags returns error', () => {
  const content = VALID_SKILL.replace('tags:\n  - line\n  - trend\n', '');
  const { filePath } = writeTempSkill('g2-mark-line.md', content);
  const result = v.validateFile(filePath);
  assert.ok(!result.valid);
  assert.ok(result.errors.some((e) => e.includes('tags')));
});

test('missing description returns warning', () => {
  const content = VALID_SKILL.replace('description: Draw line charts\n', '');
  const { filePath } = writeTempSkill('g2-mark-line.md', content);
  const result = v.validateFile(filePath);
  assert.ok(result.warnings.some((w) => w.includes('description')));
});

test('missing example section returns warning', () => {
  const content = VALID_SKILL.replace(
    '## 最小可运行示例',
    '## Some Other Section'
  );
  const { filePath } = writeTempSkill('g2-mark-line.md', content);
  const result = v.validateFile(filePath);
  assert.ok(
    result.warnings.some(
      (w) => w.includes('example section') || w.includes('Body missing')
    )
  );
});

// ─── validate (full run) ──────────────────────────────────────────────────────

console.log('\nvalidate');

test('validates real skills directory without errors (excluding SKILL.md templates)', () => {
  const realValidator = new SkillValidator();
  const result = realValidator.validate({ silent: true });
  assert.ok(result.totalFiles > 0, 'should find skill files');
  // SKILL.md files are template/example files (no front matter), filter them out
  const realErrors = result.results.filter(
    (r) => r.errors.length > 0 && !r.relativePath.endsWith('SKILL.md')
  );
  assert.strictEqual(
    realErrors.length,
    0,
    `non-template skill files have errors:\n${realErrors.map((r) => `  ${r.relativePath}: ${r.errors.join(', ')}`).join('\n')}`
  );
});

test('returns summary object with expected keys', () => {
  const realValidator = new SkillValidator();
  const result = realValidator.validate({ silent: true });
  assert.ok('valid' in result);
  assert.ok('totalFiles' in result);
  assert.ok('errorCount' in result);
  assert.ok('warnCount' in result);
  assert.ok('results' in result);
  assert.ok(Array.isArray(result.results));
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
