import fs from 'fs';
import path from 'path';
import { BM25Index } from './bm25';
import type { Skill, SkillIndex, RetrieveOptions, ListOptions } from './types';

// Index files are always expected in a sibling index directory.
const DEFAULT_INDEX_DIR = path.resolve(__dirname, '../index');

const DEFAULT_LIBRARY = 'g2';

const bm25Cache = new Map<string, BM25Index>();

/**
 * Load the index JSON file.
 * @param library The library name.
 * @returns The skill index for the specified library.
 */
export function loadIndex(library: string): SkillIndex {
  const indexFile = path.join(DEFAULT_INDEX_DIR, `${library}.index.json`);

  if (!fs.existsSync(indexFile)) {
    throw new Error(`Index file not found: ${indexFile}. Run build first.`);
  }

  return JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
}

/**
 * Get the bm25 index for a library, building it if not cached.
 * @param library The library name.
 * @returns The BM25 index for the specified library.
 */
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

/**
 * Retrieve relevant skills based on a query and options.
 * @param query The search query.
 * @param options Options to customize the retrieval.
 * @returns An array of skills matching the query.
 */
export function retrieve(query: string, options: RetrieveOptions = {}): Skill[] {
  const { library = DEFAULT_LIBRARY, topK = 7, content = false } = options;
  const index = getBM25Index(library);
  const skills = index.search(query, topK).map(({ skill }) => skill);

  if (!content) {
    return skills.map(({ content, ...skill }) => skill);
  }

  return skills;
}

/**
 * Get skill info embedded in the library index.
 * @param library The library name (default: 'g2').
 * @returns The skill info, or undefined if not available.
 */
export function getSkillInfo(library = DEFAULT_LIBRARY): SkillIndex['info'] {
  return loadIndex(library).info;
}

/**
 * List all the skills, optionally filtered by library, category, tags, or difficulty.
 * @param options Options to filter the skills.
 * @returns An array of skills matching the filters.
 */
export function listSkills(options: ListOptions = {}): Skill[] {
  const {
    library = DEFAULT_LIBRARY,
    category = null,
    tags = [],
    difficulty = null
  } = options;
  const { skills } = loadIndex(library);

  return skills.filter((skill) => {
    if (category && skill.category !== category) return false;
    if (difficulty && skill.difficulty !== difficulty) return false;
    if (tags.length > 0 && !tags.some((t) => skill.tags.includes(t)))
      return false;
    return true;
  });
}
