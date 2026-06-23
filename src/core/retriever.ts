import fs from 'fs';
import path from 'path';
import type { Skill, SkillIndex, RetrieveOptions, ListOptions } from './types';
import { getSyncEmbedder } from './retrieval/embedder';
import { openZvecStoreSync } from './retrieval/zvec-store';
import type { IZvecStore, ZvecQueryResult } from './retrieval/zvec-store';

// Index files are always expected in a sibling index directory.
const DEFAULT_INDEX_DIR = path.resolve(__dirname, '../index');

// zvec collections may live in src/index/ (dev) or dist/index/ (production).
// Try both so that playground / tsx can find indexes built into src/index/.
const ZVEC_INDEX_DIRS = [
  DEFAULT_INDEX_DIR,
  // Fallback: when running from dist/, also try src/index/ (useful in dev)
  ...(DEFAULT_INDEX_DIR.endsWith(`${path.sep}dist${path.sep}index`)
    ? [DEFAULT_INDEX_DIR.replace(`${path.sep}dist${path.sep}index`, `${path.sep}src${path.sep}index`)]
    : []),
];

const DEFAULT_LIBRARY = 'g2';

const zvecCache = new Map<string, IZvecStore>();

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

// ---------------------------------------------------------------------------
// Zvec
// ---------------------------------------------------------------------------

/**
 * Find the first existing zvec collection directory across all index dirs.
 */
function resolveZvecPath(library: string): string | undefined {
  for (const dir of ZVEC_INDEX_DIRS) {
    const p = path.join(dir, `${library}.zvec`);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

/**
 * Get (or open) the zvec store for a library (fully synchronous).
 * Returns undefined when @zvec/zvec is not installed or the collection
 * directory doesn't exist.
 */
function getZvecStoreSync(library: string): IZvecStore | undefined {
  if (zvecCache.has(library)) return zvecCache.get(library)!;

  const zvecPath = resolveZvecPath(library);
  if (!zvecPath) return undefined;

  try {
    const store = openZvecStoreSync(zvecPath);
    zvecCache.set(library, store);
    return store;
  } catch {
    return undefined;
  }
}

interface StrategyParams {
  library?: string;
  topK: number;
}

/** Build a zvec filter expression for the given library filter. */
function buildLibraryFilter(library: string): string {
  return `library = '${library}'`;
}

/** Build skill map from index files for ID→Skill resolution. */
function buildSkillMap(libs: string[]): Map<string, Skill> {
  const map = new Map<string, Skill>();
  for (const lib of libs) {
    for (const skill of loadIndex(lib).skills) {
      map.set(skill.id, skill);
    }
  }
  return map;
}

/** Check whether any zvec collection exists for the given libraries. */
function hasZvecCollections(libs: string[]): boolean {
  return libs.some((lib) => resolveZvecPath(lib) !== undefined);
}

/** Pure vector retrieval via zvec. Requires zvec index to be built. */
function retrieveVector(query: string, params: StrategyParams): Skill[] {
  const { library, topK } = params;
  const libs = library ? [library] : availableLibraries();

  if (!hasZvecCollections(libs)) {
    console.error(
      '[retrieve] zvec index not found. Run "build:index:zvec" to generate vector indexes.'
    );
    return [];
  }

  const skillMap = buildSkillMap(libs);
  const embedder = getSyncEmbedder();
  const queryVec = embedder.embedSync(query);

  const allResults: ZvecQueryResult[] = [];
  for (const lib of libs) {
    const store = getZvecStoreSync(lib);
    if (!store) continue;
    const results = store.searchSync({
      vector: queryVec,
      topK,
      filter: buildLibraryFilter(lib),
    });
    allResults.push(...results);
  }

  allResults.sort((a, b) => b.score - a.score);
  return allResults
    .slice(0, topK)
    .map((r) => skillMap.get(r.id))
    .filter((s): s is Skill => s !== undefined);
}

/**
 * Hybrid FTS + Vector retrieval using zvec's native multiQuerySync with RRF.
 *
 * Uses zvec's native hybrid: FTS (jieba tokenizer on raw text) + Vector (ANN)
 * + RRF fusion, all in a single engine-level call.
 *
 * Requires zvec index to be built. Returns empty when zvec is unavailable.
 */
function retrieveHybrid(query: string, params: StrategyParams): Skill[] {
  const { library, topK } = params;
  const libs = library ? [library] : availableLibraries();

  if (!hasZvecCollections(libs)) {
    console.error(
      '[retrieve] zvec index not found. Run "build:index:zvec" to enable hybrid search.'
    );
    return [];
  }

  const skillMap = buildSkillMap(libs);
  const embedder = getSyncEmbedder();
  const queryVec = embedder.embedSync(query);

  const allResults: ZvecQueryResult[] = [];
  for (const lib of libs) {
    const store = getZvecStoreSync(lib);
    if (!store) continue;
    const results = store.searchHybridSync({
      queryText: query,
      queryVector: queryVec,
      topK,
      filter: buildLibraryFilter(lib),
    });
    allResults.push(...results);
  }

  allResults.sort((a, b) => b.score - a.score);
  return allResults
    .slice(0, topK)
    .map((r) => skillMap.get(r.id))
    .filter((s): s is Skill => s !== undefined);
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
  const {
    library,
    topK = 7,
    content = false,
    includeInfo = content,
    strategy = 'hybrid',
  } = options;

  let skills: Skill[] =
    strategy === 'vector'
      ? retrieveVector(query, { library, topK })
      : retrieveHybrid(query, { library, topK });

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
