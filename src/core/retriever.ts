/**
 * Retriever — thin coordination layer that delegates to:
 *   - index-loader.ts  (index loading + caching)
 *   - synonyms.ts      (query expansion)
 *   - token-budget.ts  (progressive disclosure + token trimming)
 *   - zvec-store.ts    (vector / hybrid search)
 *   - embedder.ts      (text → vector)
 */

import fs from 'fs';
import path from 'path';
import type { Skill, SkillIndex, RetrieveOptions, ListOptions } from './types';
import { expandQuery } from './synonyms';
import { applyTokenBudget } from './token-budget';
import {
  loadIndex,
  availableLibraries,
  buildSkillMap,
  getSkillInfo as _getSkillInfo,
  getSkillById as _getSkillById,
  listSkills as _listSkills,
} from './index-loader';
import { getEmbedder, SimpleEmbedder } from './retrieval/embedder';
import { openZvecStoreSync } from './retrieval/zvec-store';
import type { IZvecStore, ZvecQueryResult } from './retrieval/zvec-store';

// ---------------------------------------------------------------------------
// Exports for backward compatibility — redirect to index-loader
// ---------------------------------------------------------------------------

export { availableLibraries, loadIndex, getSkillInfo, getSkillById, listSkills } from './index-loader';
export { expandQuery } from './synonyms';
export { applyTokenBudget, estimateTokens } from './token-budget';

// ---------------------------------------------------------------------------
// zvec path resolution & store management
// ---------------------------------------------------------------------------

const DEFAULT_INDEX_DIR = path.resolve(__dirname, '../index');

const ZVEC_INDEX_DIRS = [
  DEFAULT_INDEX_DIR,
  ...(DEFAULT_INDEX_DIR.endsWith(`${path.sep}dist${path.sep}index`)
    ? [
        DEFAULT_INDEX_DIR.replace(
          `${path.sep}dist${path.sep}index`,
          `${path.sep}src${path.sep}index`
        )
      ]
    : [])
];

const zvecCache = new Map<string, IZvecStore>();

function resolveZvecPath(library: string, fallback = false): string | undefined {
  const bases = fallback
    ? [`${library}.zvec.simple`, `${library}.zvec`]
    : [`${library}.zvec`];
  for (const dir of ZVEC_INDEX_DIRS) {
    for (const base of bases) {
      const p = path.join(dir, base);
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}

function getZvecStoreSync(library: string, fallback = false): IZvecStore | undefined {
  const cacheKey = fallback ? `${library}__fallback` : library;
  if (zvecCache.has(cacheKey)) return zvecCache.get(cacheKey)!;

  const zvecPath = resolveZvecPath(library, fallback);
  if (!zvecPath) return undefined;

  try {
    const store = openZvecStoreSync(zvecPath);
    zvecCache.set(cacheKey, store);
    return store;
  } catch {
    return undefined;
  }
}

/**
 * Invalidate all caches (index cache + zvec store cache).
 * Useful when indexes are rebuilt at runtime (harness IndexAgent).
 */
export function invalidateCaches(): void {
  zvecCache.clear();
  const mod = require('./index-loader') as typeof import('./index-loader');
  mod.invalidateCache();
}

// ---------------------------------------------------------------------------
// Strategy helpers
// ---------------------------------------------------------------------------

interface StrategyParams {
  library?: string;
  topK: number;
}

function buildLibraryFilter(library: string): string {
  return `library = '${library}'`;
}

function hasZvecCollections(libs: string[], fallback = false): boolean {
  return libs.some((lib) => resolveZvecPath(lib, fallback) !== undefined);
}

async function retrieveVector(query: string, params: StrategyParams): Promise<Skill[]> {
  const { library, topK } = params;
  const libs = library ? [library] : availableLibraries();

  const skillMap = buildSkillMap(libs);
  const expandedQuery = expandQuery(query);
  const embedder = await getEmbedder();
  const useFallback = embedder instanceof SimpleEmbedder;

  if (!hasZvecCollections(libs, useFallback)) {
    console.error(
      '[retrieve] zvec index not found. Run "build:index:zvec" to generate vector indexes.'
    );
    return [];
  }
  const queryVec = await embedder.embed(expandedQuery);

  const allResults: ZvecQueryResult[] = [];
  for (const lib of libs) {
    const store = getZvecStoreSync(lib, useFallback);
    if (!store) continue;
    const results = store.searchSync({
      vector: queryVec,
      topK,
      filter: buildLibraryFilter(lib)
    });
    allResults.push(...results);
  }

  allResults.sort((a, b) => b.score - a.score);
  return allResults
    .slice(0, topK)
    .map((r) => skillMap.get(r.id))
    .filter((s): s is Skill => s !== undefined);
}

async function retrieveHybrid(query: string, params: StrategyParams): Promise<Skill[]> {
  const { library, topK } = params;
  const libs = library ? [library] : availableLibraries();

  const skillMap = buildSkillMap(libs);
  const expandedQuery = expandQuery(query);
  const embedder = await getEmbedder();
  const useFallback = embedder instanceof SimpleEmbedder;

  if (!hasZvecCollections(libs, useFallback)) {
    console.error(
      '[retrieve] zvec index not found. Run "build:index:zvec" to enable hybrid search.'
    );
    return [];
  }
  const queryVec = await embedder.embed(expandedQuery);

  const allResults: ZvecQueryResult[] = [];
  for (const lib of libs) {
    const store = getZvecStoreSync(lib, useFallback);
    if (!store) continue;
    const results = store.searchHybridSync({
      queryText: expandedQuery,
      queryVector: queryVec,
      topK,
      filter: buildLibraryFilter(lib)
    });
    allResults.push(...results);
  }

  allResults.sort((a, b) => b.score - a.score);
  return allResults
    .slice(0, topK)
    .map((r) => skillMap.get(r.id))
    .filter((s): s is Skill => s !== undefined);
}

// ---------------------------------------------------------------------------
// Main retrieve function
// ---------------------------------------------------------------------------

export async function retrieve(
  query: string,
  options: RetrieveOptions = {}
): Promise<Skill[]> {
  const {
    library,
    topK = 7,
    content = false,
    includeInfo = content,
    strategy = 'hybrid',
    maxTokens,
    progressiveLevel = 1
  } = options;

  let skills: Skill[] =
    strategy === 'vector'
      ? await retrieveVector(query, { library, topK })
      : await retrieveHybrid(query, { library, topK });

  if (!content) {
    skills = skills.map(({ content, ...skill }) => skill);
  }

  if (includeInfo) {
    const libs = library
      ? [library]
      : [...new Set(skills.map((s) => s.library))];
    const infoSkills: Skill[] = libs.flatMap((lib) => {
      const skillInfo = _getSkillInfo(lib);
      if (!skillInfo) return [];
      return [
        {
          id: `__info__${lib}`,
          title: skillInfo.name,
          title_en: skillInfo.name,
          description: skillInfo.description,
          library: lib,
          version: '',
          category: '__info__',
          subcategory: '',
          tags: [],
          use_cases: [],
          anti_patterns: [],
          related: [],
          content: skillInfo.constraintsContent
        }
      ];
    });
    skills = [...infoSkills, ...skills];
  }

  if (maxTokens && content) {
    skills = applyTokenBudget(skills, maxTokens, progressiveLevel);
  }

  return skills;
}