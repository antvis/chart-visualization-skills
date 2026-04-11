import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('icon-retrieval skill documentation', () => {
  const skillDoc = readFileSync(
    resolve(__dirname, '../skills/icon-retrieval/SKILL.md'),
    'utf8',
  );

  it('documents the icon search HTTP endpoint and curl example', () => {
    expect(skillDoc).toContain('https://www.weavefox.cn/api/open/v1/icon');
    expect(skillDoc).toContain('curl -sS -L --max-time 20');
    expect(skillDoc).toContain('?text=document&topK=5');
  });

  it('does not reference deleted node search script usage', () => {
    expect(skillDoc).not.toContain('node ./scripts/search.js');
  });
});
