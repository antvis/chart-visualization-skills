import fs from 'fs';
import path from 'path';
import { BM25Index } from './bm25';
import type { Skill, SkillIndex, RetrieveOptions, ListOptions } from './types';

// __dirname at runtime is dist/core/, so ../index points to dist/index/
const DEFAULT_INDEX_DIR = path.resolve(__dirname, '../index');

const DEFAULT_LIBRARY = 'g2';

const bm25Cache = new Map<string, BM25Index>();

export function loadIndex(library: string, indexDir?: string): SkillIndex {
  const dir = indexDir || DEFAULT_INDEX_DIR;
  const indexFile = path.join(dir, `${library}.index.json`);

  if (!fs.existsSync(indexFile)) {
    throw new Error(`Index file not found: ${indexFile}. Run build first.`);
  }

  return JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
}

function getBM25Index(library: string, indexDir?: string): BM25Index {
  if (!bm25Cache.has(library)) {
    const { skills } = loadIndex(library, indexDir);
    const index = new BM25Index({ k1: 1.8, b: 0.5 });
    index.build(skills);
    bm25Cache.set(library, index);
  }
  return bm25Cache.get(library)!;
}

export function retrieve(query: string, options: RetrieveOptions = {}): Skill[] {
  const { library = DEFAULT_LIBRARY, topK = 7, indexDir } = options;
  const index = getBM25Index(library, indexDir);
  return index.search(query, topK).map(({ skill }) => skill);
}

export function listSkills(options: ListOptions = {}): Skill[] {
  const { library = DEFAULT_LIBRARY, category = null, tags = [], difficulty = null, indexDir } = options;
  const { skills } = loadIndex(library, indexDir);

  return skills.filter(skill => {
    if (category && skill.category !== category) return false;
    if (difficulty && skill.difficulty !== difficulty) return false;
    if (tags.length > 0 && !tags.some(t => skill.tags.includes(t))) return false;
    return true;
  });
}
