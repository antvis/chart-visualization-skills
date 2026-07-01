/**
 * Index loader — loads skill index JSON files from disk with caching.
 *
 * Extracted from retriever.ts for independent testing and reuse.
 * Key improvement: index files and skill maps are cached after first load
 * instead of being re-read from disk on every retrieval call.
 */

import fs from 'fs';
import path from 'path';
import type { Skill, SkillIndex } from './types';

// Index files are always expected in a sibling index directory.
const DEFAULT_INDEX_DIR = path.resolve(__dirname, '../index');

const DEFAULT_LIBRARY = 'g2';

// ---------------------------------------------------------------------------
// Lazy-loading cache — avoids repeated JSON.parse + fs.readFileSync on
// every retrieve() call.  This is especially important for HTTP Server and
// Playground multi-turn scenarios where retrieve() is called per message.
// ---------------------------------------------------------------------------

const indexCache = new Map<string, SkillIndex>();
const skillMapCache = new Map<string, Map<string, Skill>>();
let cachedLibraries: string[] | null = null;

/**
 * Invalidate all caches.  Useful when the harness IndexAgent rebuilds indexes
 * at runtime, or when tests need a clean slate.
 */
export function invalidateCache(): void {
  indexCache.clear();
  skillMapCache.clear();
  cachedLibraries = null;
}

/**
 * Return the list of libraries that have a built index on disk.
 */
export function availableLibraries(): string[] {
  if (cachedLibraries) return cachedLibraries;

  if (!fs.existsSync(DEFAULT_INDEX_DIR)) {
    cachedLibraries = [];
    return cachedLibraries;
  }

  cachedLibraries = fs
    .readdirSync(DEFAULT_INDEX_DIR)
    .filter((f) => f.endsWith('.index.json'))
    .map((f) => f.replace('.index.json', ''))
    .sort();

  return cachedLibraries;
}

/**
 * Load the index JSON file for a library (with caching).
 *
 * @param library The library name.
 * @returns The skill index for the specified library.
 */
export function loadIndex(library: string): SkillIndex {
  if (indexCache.has(library)) return indexCache.get(library)!;

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

  const index: SkillIndex = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
  indexCache.set(library, index);
  return index;
}

/**
 * Build a skill map (id → Skill) from index files for ID→Skill resolution.
 *
 * The map is cached per set of libraries; when called with the same
 * library list it returns the cached version.
 *
 * @param libs Libraries to include in the map.
 */
export function buildSkillMap(libs: string[]): Map<string, Skill> {
  // Cache key: sorted, comma-separated library list
  const cacheKey = libs.sort().join(',');
  if (skillMapCache.has(cacheKey)) return skillMapCache.get(cacheKey)!;

  const map = new Map<string, Skill>();
  for (const lib of libs) {
    for (const skill of loadIndex(lib).skills) {
      map.set(skill.id, skill);
    }
  }
  skillMapCache.set(cacheKey, map);
  return map;
}

/**
 * Get skill info embedded in the library index.
 *
 * @param library The library name (default: 'g2').
 * @returns The skill info, or undefined if not available.
 */
export function getSkillInfo(library = DEFAULT_LIBRARY): SkillIndex['info'] {
  return loadIndex(library).info;
}

/**
 * Get a single skill by its exact ID, searching across all available libraries
 * unless a specific library is provided.
 *
 * @param id      The skill ID.
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
 * List all the skills, optionally filtered by library, category or tags.
 *
 * @param options Filter options.
 * @returns An array of skills matching the filters.
 */
export function listSkills(options: { library?: string; category?: string | null; tags?: string[] } = {}): Skill[] {
  const { library, category = null, tags = [] } = options;

  const libs = library ? [library] : availableLibraries();
  const allSkills = libs.flatMap((lib) => loadIndex(lib).skills);

  return allSkills.filter((skill) => {
    if (category && skill.category !== category) return false;
    if (tags.length > 0 && !tags.some((t) => skill.tags.includes(t)))
      return false;
    return true;
  });
}
