/**
 * Retriever — thin coordination layer that delegates to @antv/context.
 *
 * When context is unavailable (model not downloaded), returns empty results
 * with a clear install hint — no independent retrieval logic here.
 *
 * Doc metadata (title, tags, category, etc.) is read directly from
 * QueryResult.meta (populated from markdown frontmatter by context),
 * so no index.json intermediate layer is needed.
 */

import fs from 'fs';
import path from 'path';
import { Context } from '@antv/context';
import type { ContextOptions, QueryResult } from '@antv/context';
import type { Doc, RetrieveOptions } from './types';
import { synonymRecord } from './synonyms';
import { applyTokenBudget } from './token-budget';

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { synonymRecord } from './synonyms';
export { applyTokenBudget, estimateTokens } from './token-budget';

// ---------------------------------------------------------------------------
// Available libraries — scan content directories on disk
// ---------------------------------------------------------------------------

const DEFAULT_INDEX_DIR = path.resolve(__dirname, '../index');
const DEFAULT_CONTENT_DIR = path.resolve(__dirname, '../content');

/**
 * Return the list of libraries that have a built zvec index on disk.
 */
export function availableLibraries(): string[] {
  if (!fs.existsSync(DEFAULT_INDEX_DIR)) return [];

  return fs
    .readdirSync(DEFAULT_INDEX_DIR)
    .filter((f) => f.endsWith('.zvec') && fs.statSync(path.join(DEFAULT_INDEX_DIR, f)).isDirectory())
    .map((f) => f.replace('.zvec', ''))
    .sort();
}

/**
 * Return the list of libraries that have content directories on disk.
 * Used by build-zvec to discover which libraries to build.
 */
export function contentLibraries(): string[] {
  if (!fs.existsSync(DEFAULT_CONTENT_DIR)) return [];

  return fs
    .readdirSync(DEFAULT_CONTENT_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

// ---------------------------------------------------------------------------
// QueryResult → Doc mapping
// ---------------------------------------------------------------------------

/**
 * Convert a context QueryResult into a Doc object.
 * All metadata comes from the frontmatter stored in QueryResult.meta.
 */
function resultToDoc(result: QueryResult): Doc {
  const meta = (result.meta ?? {}) as Record<string, unknown>;
  return {
    id: result.id,
    title: typeof meta.title === 'string' ? meta.title : '',
    description: typeof meta.description === 'string' ? meta.description : '',
    library: typeof meta.library === 'string' ? meta.library : '',
    version: typeof meta.version === 'string' ? meta.version : '',
    category: typeof meta.category === 'string' ? meta.category : '',
    subcategory: typeof meta.subcategory === 'string' ? meta.subcategory : '',
    tags: Array.isArray(meta.tags) ? meta.tags as string[] : [],
    use_cases: Array.isArray(meta.use_cases) ? meta.use_cases as string[] : [],
    anti_patterns: Array.isArray(meta.anti_patterns) ? meta.anti_patterns as string[] : [],
    related: Array.isArray(meta.related) ? meta.related as string[] : [],
    path: result.path,
    content: result.content,
  };
}

// ---------------------------------------------------------------------------
// Context instance management (lazy init)
// ---------------------------------------------------------------------------

let _contextInstance: Context | null = null;
let _contextAvailable: boolean = false;
let _contextInitPromise: Promise<void> | null = null;

async function tryInitContext(): Promise<void> {
  if (_contextInitPromise) return _contextInitPromise;

  _contextInitPromise = (async () => {
    try {
      const options: ContextOptions = {
        vectorsDir: DEFAULT_INDEX_DIR,
        basePath: path.resolve(__dirname, '..'),
        queryExpansion: { synonyms: synonymRecord },
        ftsFields: ['content'],
        ftsFieldWeights: { content: 1 }
      };

      _contextInstance = await Context.create(options);
      _contextAvailable = true;
    } catch (err) {
      _contextAvailable = false;
      _contextInstance = null;
      console.warn(
        `[retrieve] @antv/context unavailable — semantic search disabled.\n` +
          `  Error: ${(err as Error).message?.split('\n')[0]}\n` +
          `  Install model: export HF_ENDPOINT=https://hf-mirror.com && node scripts/download-model.mjs`
      );
    }
  })();

  return _contextInitPromise;
}

export async function invalidateCaches(): Promise<void> {
  if (_contextInstance) {
    try {
      await _contextInstance.close();
    } catch {
      /* best-effort */
    }
  }
  _contextInstance = null;
  _contextAvailable = false;
  _contextInitPromise = null;
}

// ---------------------------------------------------------------------------
// Main retrieve function
// ---------------------------------------------------------------------------

export async function retrieve(
  query: string,
  options: RetrieveOptions = {}
): Promise<Doc[]> {
  const {
    library,
    topK = 7,
    content = true,
    strategy = 'hybrid',
    maxTokens,
    progressiveLevel = 1
  } = options;

  const libs = library ? [library] : availableLibraries();
  await tryInitContext();

  let docs: Doc[];

  if (_contextAvailable && _contextInstance) {
    const mode = strategy === 'vector' ? 'vector' : 'hybrid';
    const allResults: { doc: Doc; score: number }[] = [];

    for (const lib of libs) {
      const zvecPath = path.join(DEFAULT_INDEX_DIR, `${lib}.zvec`);
      if (!fs.existsSync(zvecPath)) {
        console.error(
          `[retrieve] zvec index not found for "${lib}". Run "build:index:zvec" first.`
        );
        continue;
      }

      const results = await _contextInstance.query(query, {
        library: lib,
        topK,
        mode,
        rerank: false
      });

      for (const result of results) {
        allResults.push({ doc: resultToDoc(result), score: result.score ?? 0 });
      }
    }

    allResults.sort((a, b) => b.score - a.score);
    docs = allResults.slice(0, topK).map((item) => item.doc);
  } else {
    // Context unavailable — no independent retrieval logic.
    // User must install model for semantic search.
    docs = [];
  }

  if (!content) {
    docs = docs.map(({ content, ...doc }) => doc);
  }

  if (maxTokens && content) {
    docs = applyTokenBudget(docs, maxTokens, progressiveLevel);
  }

  return docs;
}
