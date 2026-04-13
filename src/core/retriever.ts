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

/**
 * Read the full markdown content of a skill file.
 * `skill.path` is relative to the package root (e.g. "skills/antv-g2-chart/references/...").
 *
 * Path traversal is prevented: the resolved path must remain inside `<root>/skills/`.
 * Symlinks are resolved before the check so they cannot escape the allowed directory.
 *
 * @param skill   - A Skill object returned by retrieve() or listSkills()
 * @param pkgRoot - Override the package root (useful in monorepo / dev setups).
 *                  Defaults to two directories above dist/core/ at runtime.
 * @returns The raw markdown string, or null if the file does not exist.
 * @throws {Error} If the resolved path escapes the skills directory.
 */
export function loadSkillContent(skill: Skill, pkgRoot?: string): string | null {
  const root = pkgRoot || PKG_ROOT;
  const allowedDir = path.join(root, 'skills');
  const filePath = path.resolve(root, skill.path);

  // Resolve symlinks on the parent directory to prevent symlink escape.
  // The file itself may not exist yet, so we resolve as far as possible.
  let realFilePath: string;
  try {
    realFilePath = fs.realpathSync(filePath);
  } catch {
    // File does not exist — use the normalised path for the prefix check.
    realFilePath = filePath;
  }

  const realAllowedDir = (() => {
    try { return fs.realpathSync(allowedDir); } catch { return allowedDir; }
  })();

  if (!realFilePath.startsWith(realAllowedDir + path.sep) && realFilePath !== realAllowedDir) {
    throw new Error(`Access denied: skill path "${skill.path}" escapes the skills directory.`);
  }

  if (!fs.existsSync(realFilePath)) return null;
  return fs.readFileSync(realFilePath, 'utf-8');
}
