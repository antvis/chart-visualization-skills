/**
 * Index loader — loads doc index JSON files from disk with caching.
 *
 * Extracted from retriever.ts for independent testing and reuse.
 * Key improvement: index files and doc maps are cached after first load
 * instead of being re-read from disk on every retrieval call.
 */

import fs from 'fs';
import path from 'path';
import type { Doc, DocIndex } from './types';

// Index files are always expected in a sibling index directory.
const DEFAULT_INDEX_DIR = path.resolve(__dirname, '../index');

const DEFAULT_LIBRARY = 'g2';

// ---------------------------------------------------------------------------
// Lazy-loading cache — avoids repeated JSON.parse + fs.readFileSync on
// every retrieve() call.  This is especially important for HTTP Server and
// Playground multi-turn scenarios where retrieve() is called per message.
// ---------------------------------------------------------------------------

const indexCache = new Map<string, DocIndex>();
const docMapCache = new Map<string, Map<string, Doc>>();
let cachedLibraries: string[] | null = null;

/**
 * Invalidate all caches.  Useful when the harness IndexAgent rebuilds indexes
 * at runtime, or when tests need a clean slate.
 */
export function invalidateCache(): void {
  indexCache.clear();
  docMapCache.clear();
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
 * @returns The doc index for the specified library.
 */
export function loadIndex(library: string): DocIndex {
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

  const index: DocIndex = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
  indexCache.set(library, index);
  return index;
}

/**
 * Build a doc map (id → Doc) from index files for ID→Doc resolution.
 *
 * The map is cached per set of libraries; when called with the same
 * library list it returns the cached version.
 *
 * @param libs Libraries to include in the map.
 */
export function buildDocMap(libs: string[]): Map<string, Doc> {
  // Cache key: sorted, comma-separated library list
  const cacheKey = libs.sort().join(',');
  if (docMapCache.has(cacheKey)) return docMapCache.get(cacheKey)!;

  const map = new Map<string, Doc>();
  for (const lib of libs) {
    for (const doc of loadIndex(lib).docs) {
      map.set(doc.id, doc);
    }
  }
  docMapCache.set(cacheKey, map);
  return map;
}

/**
 * Get doc info embedded in the library index.
 *
 * @param library The library name (default: 'g2').
 * @returns The doc info, or undefined if not available.
 */
export function getDocInfo(library = DEFAULT_LIBRARY): DocIndex['info'] {
  return loadIndex(library).info;
}

/**
 * Get a single doc by its exact ID, searching across all available libraries
 * unless a specific library is provided.
 *
 * @param id      The doc ID.
 * @param library Optional library to restrict the search.
 * @returns The doc (with content), or undefined if not found.
 */
export function getDocById(id: string, library?: string): Doc | undefined {
  const libs = library ? [library] : availableLibraries();
  for (const lib of libs) {
    const { docs } = loadIndex(lib);
    const found = docs.find((s) => s.id === id);
    if (found) return found;
  }
  return undefined;
}

/**
 * List all the docs, optionally filtered by library, category or tags.
 *
 * @param options Filter options.
 * @returns An array of docs matching the filters.
 */
export function listDocs(options: { library?: string; category?: string | null; tags?: string[] } = {}): Doc[] {
  const { library, category = null, tags = [] } = options;

  const libs = library ? [library] : availableLibraries();
  const allDocs = libs.flatMap((lib) => loadIndex(lib).docs);

  return allDocs.filter((doc) => {
    if (category && doc.category !== category) return false;
    if (tags.length > 0 && !tags.some((t) => doc.tags.includes(t)))
      return false;
    return true;
  });
}
