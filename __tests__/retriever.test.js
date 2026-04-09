import { describe, it } from 'vitest';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SkillRetriever } from '../cli/utils/retriever.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockIndex() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'antv-retriever-'));
  const skillsDir = path.join(tmpDir, 'skills');
  const promptsDir = path.join(tmpDir, 'prompts');
  fs.mkdirSync(skillsDir);
  fs.mkdirSync(promptsDir);

  const skills = [
    {
      id: 'g2-mark-line',
      title: 'Line Chart',
      description: 'Draw line charts with G2',
      library: 'g2',
      category: 'marks',
      subcategory: 'line',
      tags: ['line', 'trend'],
      use_cases: ['time series'],
      filePath: 'skills/g2/g2-mark-line.md'
    },
    {
      id: 'g2-mark-interval',
      title: 'Bar Chart',
      description: 'Draw bar charts with G2',
      library: 'g2',
      category: 'marks',
      subcategory: 'interval',
      tags: ['bar', 'interval', 'column'],
      use_cases: ['comparison'],
      filePath: 'skills/g2/g2-mark-interval.md'
    },
    {
      id: 'g6-layout-force',
      title: 'Force Layout',
      description: 'Force-directed graph layout',
      library: 'g6',
      category: 'layouts',
      subcategory: 'force',
      tags: ['force', 'layout', 'graph'],
      use_cases: ['network graph'],
      filePath: 'skills/g6/g6-layout-force.md'
    }
  ];

  const g2Skills = skills.filter((s) => s.library === 'g2');
  const g6Skills = skills.filter((s) => s.library === 'g6');

  const indexDir = path.join(tmpDir, 'index');
  fs.mkdirSync(indexDir);

  fs.writeFileSync(
    path.join(indexDir, 'full.index.json'),
    JSON.stringify({ skills, version: '1.0' })
  );
  fs.writeFileSync(
    path.join(indexDir, 'g2.index.json'),
    JSON.stringify({ skills: g2Skills, version: '1.0' })
  );
  fs.writeFileSync(
    path.join(indexDir, 'g6.index.json'),
    JSON.stringify({ skills: g6Skills, version: '1.0' })
  );

  // Create stub skill files (retriever reads body content)
  const g2dir = path.join(skillsDir, 'g2');
  const g6dir = path.join(skillsDir, 'g6');
  fs.mkdirSync(g2dir);
  fs.mkdirSync(g6dir);
  fs.writeFileSync(
    path.join(g2dir, 'g2-mark-line.md'),
    '---\nid: g2-mark-line\n---\n\n## Example\n\nsome content'
  );
  fs.writeFileSync(
    path.join(g2dir, 'g2-mark-interval.md'),
    '---\nid: g2-mark-interval\n---\n\n## Example\n\nsome content'
  );
  fs.writeFileSync(
    path.join(g6dir, 'g6-layout-force.md'),
    '---\nid: g6-layout-force\n---\n\n## Example\n\nsome content'
  );

  return { indexDir, skillsDir, promptsDir };
}

// ─── loadIndex ────────────────────────────────────────────────────────────────

describe('SkillRetriever.loadIndex', () => {
  it('loads full index', () => {
    const { indexDir, skillsDir, promptsDir } = createMockIndex();
    const r = new SkillRetriever({ indexDir, skillsDir, promptsDir });
    const index = r.loadIndex();
    assert.ok(Array.isArray(index.skills));
    assert.ok(index.skills.length === 3);
  });

  it('loads library-specific index', () => {
    const { indexDir, skillsDir, promptsDir } = createMockIndex();
    const r = new SkillRetriever({ indexDir, skillsDir, promptsDir });
    const index = r.loadIndex('g2');
    assert.ok(index.skills.every((s) => s.library === 'g2'));
  });

  it('throws when index file missing', () => {
    const r = new SkillRetriever({ indexDir: '/nonexistent/path' });
    assert.throws(() => r.loadIndex(), /Index file not found/);
  });
});

// ─── retrieve ─────────────────────────────────────────────────────────────────

describe('SkillRetriever.retrieve', () => {
  it('returns results for valid query', () => {
    const { indexDir, skillsDir, promptsDir } = createMockIndex();
    const r = new SkillRetriever({ indexDir, skillsDir, promptsDir });
    const results = r.retrieve('line chart');
    assert.ok(Array.isArray(results));
    assert.ok(results.length > 0);
  });

  it('returns line chart skill for line query', () => {
    const { indexDir, skillsDir, promptsDir } = createMockIndex();
    const r = new SkillRetriever({ indexDir, skillsDir, promptsDir });
    const results = r.retrieve('line chart');
    // retrieve returns flat skill objects
    const ids = results.map((s) => s.id || (s.skill && s.skill.id));
    assert.ok(ids.includes('g2-mark-line'), `got: ${ids.join(',')}`);
  });

  it('filters by library', () => {
    const { indexDir, skillsDir, promptsDir } = createMockIndex();
    const r = new SkillRetriever({ indexDir, skillsDir, promptsDir });
    const results = r.retrieve('chart', { library: 'g6' });
    // all results should belong to g6
    assert.ok(
      results.every(
        (s) => (s.library || (s.skill && s.skill.library)) === 'g6'
      ),
      'all results should be g6'
    );
  });

  it('respects topK option', () => {
    const { indexDir, skillsDir, promptsDir } = createMockIndex();
    const r = new SkillRetriever({ indexDir, skillsDir, promptsDir });
    const results = r.retrieve('chart', { topK: 1 });
    assert.ok(results.length <= 1);
  });

  it('returns empty array for nonsense query', () => {
    const { indexDir, skillsDir, promptsDir } = createMockIndex();
    const r = new SkillRetriever({ indexDir, skillsDir, promptsDir });
    const results = r.retrieve('xyzzy123nonsense');
    assert.ok(Array.isArray(results));
    assert.strictEqual(results.length, 0);
  });
});

// ─── Real skills smoke test ───────────────────────────────────────────────────

describe('SkillRetriever real index', () => {
  it('retrieves from real index without error', () => {
    const r = new SkillRetriever();
    const results = r.retrieve('折线图');
    assert.ok(Array.isArray(results));
    assert.ok(results.length > 0, 'should find results for 折线图');
  });

  it('retrieves g2 bar chart', () => {
    const r = new SkillRetriever();
    const results = r.retrieve('柱状图', { library: 'g2' });
    assert.ok(results.length > 0);
    const lib =
      results[0].library || (results[0].skill && results[0].skill.library);
    assert.strictEqual(lib, 'g2');
  });
});
