import { describe, it } from 'vitest';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SkillValidator } from '../utils/validator.js';

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

describe('parseFrontMatter', () => {
  const v = new SkillValidator();

  it('parses valid front matter', () => {
    const meta = v.parseFrontMatter(VALID_SKILL);
    assert.strictEqual(meta.id, 'g2-mark-line');
    assert.strictEqual(meta.title, 'Line Chart');
    assert.strictEqual(meta.library, 'g2');
    assert.strictEqual(meta.version, '5.0');
    assert.strictEqual(meta.category, 'marks');
    assert.ok(meta.hasTags);
    assert.ok(meta.hasDescription);
  });

  it('returns null for missing front matter delimiter', () => {
    const result = v.parseFrontMatter('no front matter here');
    assert.strictEqual(result, null);
  });
});

// ─── validateFile ─────────────────────────────────────────────────────────────

describe('validateFile', () => {
  it('valid skill file passes', () => {
    const { filePath } = writeTempSkill('g2-mark-line.md', VALID_SKILL);
    const v = new SkillValidator();
    const result = v.validateFile(filePath);
    assert.ok(result.valid, `errors: ${result.errors.join(', ')}`);
    assert.strictEqual(result.errors.length, 0);
  });

  it('missing front matter returns invalid', () => {
    const { filePath } = writeTempSkill(
      'g2-mark-test.md',
      '# No front matter\n\nsome content'
    );
    const v = new SkillValidator();
    const result = v.validateFile(filePath);
    assert.ok(!result.valid);
    assert.ok(result.errors.some((e) => e.includes('Front Matter')));
  });

  it('missing required field id returns error', () => {
    const content = VALID_SKILL.replace('id: g2-mark-line\n', '');
    const { filePath } = writeTempSkill('g2-mark-noid.md', content);
    const v = new SkillValidator();
    const result = v.validateFile(filePath);
    assert.ok(!result.valid);
    assert.ok(result.errors.some((e) => e.includes('id')));
  });

  it('invalid ID format returns error', () => {
    const content = VALID_SKILL.replace('id: g2-mark-line', 'id: InvalidID');
    const { filePath } = writeTempSkill('InvalidID.md', content);
    const v = new SkillValidator();
    const result = v.validateFile(filePath);
    assert.ok(!result.valid);
    assert.ok(result.errors.some((e) => e.includes('ID format')));
  });

  it('ID mismatch with filename returns warning', () => {
    const { filePath } = writeTempSkill('g2-mark-other.md', VALID_SKILL);
    const v = new SkillValidator();
    const result = v.validateFile(filePath);
    assert.ok(
      result.warnings.some((w) => w.includes('does not match filename'))
    );
  });

  it('missing tags returns error', () => {
    const content = VALID_SKILL.replace('tags:\n  - line\n  - trend\n', '');
    const { filePath } = writeTempSkill('g2-mark-line.md', content);
    const v = new SkillValidator();
    const result = v.validateFile(filePath);
    assert.ok(!result.valid);
    assert.ok(result.errors.some((e) => e.includes('tags')));
  });

  it('missing description returns warning', () => {
    const content = VALID_SKILL.replace('description: Draw line charts\n', '');
    const { filePath } = writeTempSkill('g2-mark-line.md', content);
    const v = new SkillValidator();
    const result = v.validateFile(filePath);
    assert.ok(result.warnings.some((w) => w.includes('description')));
  });

  it('missing example section returns warning', () => {
    const content = VALID_SKILL.replace(
      '## 最小可运行示例',
      '## Some Other Section'
    );
    const { filePath } = writeTempSkill('g2-mark-line.md', content);
    const v = new SkillValidator();
    const result = v.validateFile(filePath);
    assert.ok(
      result.warnings.some(
        (w) => w.includes('example section') || w.includes('Body missing')
      )
    );
  });
});

// ─── validate (full run) ──────────────────────────────────────────────────────

describe('validate', () => {
  it('validates real skills directory without errors (excluding SKILL.md templates)', () => {
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

  it('returns summary object with expected keys', () => {
    const realValidator = new SkillValidator();
    const result = realValidator.validate({ silent: true });
    assert.ok('valid' in result);
    assert.ok('totalFiles' in result);
    assert.ok('errorCount' in result);
    assert.ok('warnCount' in result);
    assert.ok('results' in result);
    assert.ok(Array.isArray(result.results));
  });
});
