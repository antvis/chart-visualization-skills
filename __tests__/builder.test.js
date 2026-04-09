import { describe, it } from 'vitest';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SkillBuilder } from '../cli/utils/builder.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_SKILL_G2 = `---
id: g2-mark-line
title: Line Chart
description: Draw line charts with G2
library: g2
version: "5.0"
category: marks
subcategory: line
tags:
  - line
  - trend
use_cases:
  - time series
difficulty: beginner
completeness: complete
---

## 最小可运行示例

\`\`\`js
const chart = new Chart({ container: 'id' });
chart.render();
\`\`\`
`;

function createTempSkillsDir() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'antv-builder-'));
  const indexDir = path.join(root, 'index');
  fs.mkdirSync(indexDir);
  const skillsDir = path.join(root, 'skills');
  fs.mkdirSync(skillsDir);

  // Builder scans g2/references, g6/references, common-concepts/references
  const g2dir = path.join(skillsDir, 'g2', 'references');
  fs.mkdirSync(g2dir, { recursive: true });
  fs.writeFileSync(path.join(g2dir, 'g2-mark-line.md'), VALID_SKILL_G2);

  return { root, skillsDir, indexDir };
}

// ─── parseFrontMatter ─────────────────────────────────────────────────────────

describe('SkillBuilder.parseFrontMatter', () => {
  const b = new SkillBuilder();

  it('parses scalar fields', () => {
    const { meta } = b.parseFrontMatter(VALID_SKILL_G2);
    assert.strictEqual(meta.id, 'g2-mark-line');
    assert.strictEqual(meta.title, 'Line Chart');
    assert.strictEqual(meta.library, 'g2');
    assert.strictEqual(meta.category, 'marks');
  });

  it('parses array fields (tags)', () => {
    const { meta } = b.parseFrontMatter(VALID_SKILL_G2);
    assert.ok(Array.isArray(meta.tags), 'tags should be an array');
    assert.ok(meta.tags.includes('line'));
    assert.ok(meta.tags.includes('trend'));
  });

  it('parses array fields (use_cases)', () => {
    const { meta } = b.parseFrontMatter(VALID_SKILL_G2);
    assert.ok(Array.isArray(meta.use_cases));
    assert.ok(meta.use_cases.includes('time series'));
  });

  it('returns body content', () => {
    const { body } = b.parseFrontMatter(VALID_SKILL_G2);
    assert.ok(body.includes('最小可运行示例'));
  });

  it('handles missing front matter gracefully', () => {
    const { meta, body } = b.parseFrontMatter('# No front matter');
    assert.deepStrictEqual(meta, {});
    assert.ok(body.includes('# No front matter'));
  });
});

// ─── build ────────────────────────────────────────────────────────────────────

describe('SkillBuilder.build', () => {
  it('builds index files for each library', () => {
    const { root, skillsDir, indexDir } = createTempSkillsDir();
    const builder = new SkillBuilder({ skillsDir, indexDir });
    builder.build({ silent: true });

    // g2 index should be created
    assert.ok(
      fs.existsSync(path.join(indexDir, 'g2.index.json')),
      'g2.index.json should exist'
    );
    // full index should be created
    assert.ok(
      fs.existsSync(path.join(indexDir, 'full.index.json')),
      'full.index.json should exist'
    );
  });

  it('built index contains expected skill fields', () => {
    const { root, skillsDir, indexDir } = createTempSkillsDir();
    const builder = new SkillBuilder({ skillsDir, indexDir });
    builder.build({ silent: true });

    const index = JSON.parse(
      fs.readFileSync(path.join(indexDir, 'g2.index.json'), 'utf-8')
    );
    assert.ok(Array.isArray(index.skills), 'index.skills should be an array');
    assert.ok(index.skills.length > 0, 'should have at least one skill');

    const skill = index.skills[0];
    assert.ok('id' in skill, 'skill should have id');
    assert.ok('title' in skill, 'skill should have title');
    assert.ok('library' in skill, 'skill should have library');
  });

  it('full index combines all libraries', () => {
    const { root, skillsDir, indexDir } = createTempSkillsDir();
    const builder = new SkillBuilder({ skillsDir, indexDir });
    builder.build({ silent: true });

    const full = JSON.parse(
      fs.readFileSync(path.join(indexDir, 'full.index.json'), 'utf-8')
    );
    const g2 = JSON.parse(
      fs.readFileSync(path.join(indexDir, 'g2.index.json'), 'utf-8')
    );
    assert.ok(
      full.skills.length >= g2.skills.length,
      'full index should be at least as large as g2 index'
    );
  });
});

// ─── Real build smoke test ────────────────────────────────────────────────────

describe('SkillBuilder real index', () => {
  it('real skills directory builds without error', () => {
    const tmpIndex = fs.mkdtempSync(path.join(os.tmpdir(), 'antv-real-index-'));
    const realBuilder = new SkillBuilder({ indexDir: tmpIndex });
    assert.doesNotThrow(() => realBuilder.build({ silent: true }));
    assert.ok(fs.existsSync(path.join(tmpIndex, 'full.index.json')));
  });
});
