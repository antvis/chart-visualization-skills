import fs from 'fs';
import path from 'path';
import { BM25Index } from './bm25';
import type { Skill, SkillIndex, RetrieveOptions, ListOptions } from './types';

// __dirname is dist/core/ when compiled, src/core/ when run directly by vitest/ts-node.
// Probe both locations so the module works in dev (src/index/) and production (dist/index/).
const _srcIndex  = path.resolve(__dirname, '../index');
const _distIndex = path.resolve(__dirname, '../../dist/index');
const DEFAULT_INDEX_DIR = fs.existsSync(_srcIndex) ? _srcIndex : _distIndex;

// Package root: two levels up from wherever __dirname resolves to at runtime.
const PKG_ROOT = path.resolve(__dirname, '../..');

const DEFAULT_LIBRARY = 'g2';

const bm25Cache = new Map<string, BM25Index>();
const contentCache = new Map<string, string>();

export function loadIndex(library: string, indexDir?: string): SkillIndex {
  const dir = indexDir || DEFAULT_INDEX_DIR;
  const indexFile = path.join(dir, `${library}.index.json`);

  if (!fs.existsSync(indexFile)) {
    throw new Error(`Index file not found: ${indexFile}. Run build first.`);
  }

  return JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
}

function getBM25Index(library: string, indexDir?: string): BM25Index {
  const cacheKey = `${library}:${indexDir ?? ''}`;
  if (!bm25Cache.has(cacheKey)) {
    const { skills } = loadIndex(library, indexDir);
    const index = new BM25Index({ k1: 1.8, b: 0.5 });
    index.build(skills);
    bm25Cache.set(cacheKey, index);
  }
  return bm25Cache.get(cacheKey)!;
}

function loadSkillContent(skillPath?: string): string | undefined {
  if (!skillPath) return undefined;

  const cacheKey = skillPath.replace(/\\/g, '/');
  if (contentCache.has(cacheKey)) {
    return contentCache.get(cacheKey);
  }

  const absolutePath = path.resolve(PKG_ROOT, cacheKey);
  const safeRoot = PKG_ROOT.endsWith(path.sep) ? PKG_ROOT : `${PKG_ROOT}${path.sep}`;
  if (!absolutePath.startsWith(safeRoot)) {
    return undefined;
  }

  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    return undefined;
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');
  contentCache.set(cacheKey, content);
  return content;
}

export function retrieve(query: string, options: RetrieveOptions = {}): Skill[] {
  const { library = DEFAULT_LIBRARY, topK = 7, indexDir, includeContent = false } = options;
  const index = getBM25Index(library, indexDir);
  const skills = index.search(query, topK).map(({ skill }) => skill);

  if (!includeContent) {
    return skills;
  }

  return skills.map((skill) => (skill.content !== undefined
    ? skill
    : { ...skill, content: loadSkillContent(skill.path) }));
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
