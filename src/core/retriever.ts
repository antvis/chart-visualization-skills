import fs from 'fs';
import path from 'path';
import { BM25Index } from './bm25';
import type { Skill, SkillIndex, RetrieveOptions, ListOptions } from './types';

// __dirname is dist/core/ when compiled, src/core/ when run directly by vitest/ts-node.
// Probe both locations so the module works in dev (src/index/) and production (dist/index/).
const _srcIndex  = path.resolve(__dirname, '../index');
const _distIndex = path.resolve(__dirname, '../../dist/index');
const DEFAULT_INDEX_DIR = fs.existsSync(_srcIndex) ? _srcIndex : _distIndex;

const DEFAULT_LIBRARY = 'g2';

const bm25Cache = new Map<string, BM25Index>();

export function loadIndex(library: string): SkillIndex {
  const indexFile = path.join(DEFAULT_INDEX_DIR, `${library}.index.json`);

  if (!fs.existsSync(indexFile)) {
    throw new Error(`Index file not found: ${indexFile}. Run build first.`);
  }

  return JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
}

function getBM25Index(library: string): BM25Index {
  const cacheKey = library;
  if (!bm25Cache.has(cacheKey)) {
    const { skills } = loadIndex(library);
    const index = new BM25Index({ k1: 1.8, b: 0.5 });
    index.build(skills);
    bm25Cache.set(cacheKey, index);
  }
  return bm25Cache.get(cacheKey)!;
}

export function retrieve(query: string, options: RetrieveOptions = {}): Skill[] {
  const { library = DEFAULT_LIBRARY, topK = 7, includeContent = false } = options;
  const index = getBM25Index(library);
  const skills = index.search(query, topK).map(({ skill }) => skill);

  if (!includeContent) {
    return skills.map(({ content, ...skill }) => skill);
  }

  return skills;
}

export function listSkills(options: ListOptions = {}): Skill[] {
  const { library = DEFAULT_LIBRARY, category = null, tags = [], difficulty = null } = options;
  const { skills } = loadIndex(library);

  return skills.filter(skill => {
    if (category && skill.category !== category) return false;
    if (difficulty && skill.difficulty !== difficulty) return false;
    if (tags.length > 0 && !tags.some(t => skill.tags.includes(t))) return false;
    return true;
  });
}
