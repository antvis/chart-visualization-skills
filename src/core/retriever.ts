import fs from 'fs';
import path from 'path';
import { BM25Index } from './bm25';
import type { Skill, SkillIndex, RetrieveOptions, ListOptions } from './types';

// Index files are always expected in a sibling index directory.
const DEFAULT_INDEX_DIR = path.resolve(__dirname, '../index');

const DEFAULT_LIBRARY = 'g2';

const bm25Cache = new Map<string, BM25Index>();

/**
 * Return the list of libraries that have a built index on disk.
 */
export function availableLibraries(): string[] {
  if (!fs.existsSync(DEFAULT_INDEX_DIR)) return [];
  return fs
    .readdirSync(DEFAULT_INDEX_DIR)
    .filter((f) => f.endsWith('.index.json'))
    .map((f) => f.replace('.index.json', ''))
    .sort();
}

/**
 * Load the index JSON file.
 * @param library The library name.
 * @returns The skill index for the specified library.
 */
export function loadIndex(library: string): SkillIndex {
  const indexFile = path.join(DEFAULT_INDEX_DIR, `${library}.index.json`);

  if (!fs.existsSync(indexFile)) {
    // Only scan the directory on the error path to build a helpful message.
    const libs = availableLibraries();
    throw new Error(
      libs.length > 0
        ? `Unknown library: "${library}". Available: ${libs.join(', ')}`
        : `Index file not found for "${library}". Run build first.`
    );
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
export function retrieve(
  query: string,
  options: RetrieveOptions = {}
): Skill[] {
  const { library, topK = 7, content = false, includeInfo = content } = options;

  let skills: Skill[];
  if (library) {
    skills = getBM25Index(library)
      .search(query, topK)
      .map((r) => r.skill);
  } else {
    skills = availableLibraries()
      .flatMap((lib) => getBM25Index(lib).search(query, topK))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((r) => r.skill);
  }

  if (!content) {
    skills = skills.map(({ content, ...skill }) => skill);
  }

  if (includeInfo) {
    const libs = library ? [library] : [...new Set(skills.map((s) => s.library))];
    const infoSkills: Skill[] = libs.flatMap((lib) => {
      const skillInfo = getSkillInfo(lib);
      if (!skillInfo) return [];
      return [{
        id: `__info__${lib}`,
        title: skillInfo.name,
        description: skillInfo.description,
        library: lib,
        version: '',
        category: '__info__',
        subcategory: '',
        tags: [],
        difficulty: '',
        use_cases: [],
        anti_patterns: [],
        related: [],
        content: skillInfo.constraintsContent,
      }];
    });
    skills = [...infoSkills, ...skills];
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
 * Get a single skill by its exact ID, searching across all available libraries
 * unless a specific library is provided.
 * @param id The skill ID.
 * @param library Optional library to restrict the search.
 * @returns The skill (with content), or undefined if not found.
 */
export function getSkillById(id: string, library?: string): Skill | undefined {
  const libs = library ? [library] : availableLibraries();
  for (const lib of libs) {
    const { skills } = loadIndex(lib);
    const found = skills.find((s) => s.id === id);
    if (found) return found;
  }
  return undefined;
}

/**
 * List all the skills, optionally filtered by library, category, tags, or difficulty.
 * @param options Options to filter the skills.
 * @returns An array of skills matching the filters.
 */
export function listSkills(options: ListOptions = {}): Skill[] {
  const { library, category = null, tags = [], difficulty = null } = options;

  const libs = library ? [library] : availableLibraries();
  const allSkills = libs.flatMap((lib) => loadIndex(lib).skills);

  return allSkills.filter((skill) => {
    if (category && skill.category !== category) return false;
    if (difficulty && skill.difficulty !== difficulty) return false;
    if (tags.length > 0 && !tags.some((t) => skill.tags.includes(t)))
      return false;
    return true;
  });
}
