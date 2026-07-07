/**
 * Retriever — thin coordination layer that delegates to @antv/context.
 *
 * When context is unavailable (model not downloaded), returns empty results
 * with a clear install hint — no independent retrieval logic here.
 */

import fs from 'fs';
import path from 'path';
import { Context } from '@antv/context';
import type { ContextOptions } from '@antv/context';
import type { Doc, RetrieveOptions } from './types';
import { synonymRecord } from './synonyms';
import { applyTokenBudget } from './token-budget';
import {
  availableLibraries,
  buildDocMap,
  getDocInfo as _getDocInfo,
  getDocById as _getDocById,
  listDocs as _listDocs,
} from './index-loader';

// ---------------------------------------------------------------------------
// Exports for backward compatibility — redirect to index-loader
// ---------------------------------------------------------------------------

export { availableLibraries, loadIndex, getDocInfo, getDocById, listDocs } from './index-loader';
export { synonymRecord } from './synonyms';
export { applyTokenBudget, estimateTokens } from './token-budget';

// ---------------------------------------------------------------------------
// Context instance management (lazy init)
// ---------------------------------------------------------------------------

const DEFAULT_INDEX_DIR = path.resolve(__dirname, '../index');

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
        ftsFieldWeights: { content: 1 },
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
    try { await _contextInstance.close(); } catch { /* best-effort */ }
    _contextInstance = null;
    _contextAvailable = false;
    _contextInitPromise = null;
  }
  const mod = require('./index-loader') as typeof import('./index-loader');
  mod.invalidateCache();
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
    includeConstraints = content,
    strategy = 'hybrid',
    maxTokens,
    progressiveLevel = 1
  } = options;

  const libs = library ? [library] : availableLibraries();
  await tryInitContext();

  let docs: Doc[];

  if (_contextAvailable && _contextInstance) {
    const mode = strategy === 'vector' ? 'vector' : 'hybrid';
    const docMap = buildDocMap(libs);
    const allResults: Doc[] = [];

    for (const lib of libs) {
      const zvecPath = path.join(DEFAULT_INDEX_DIR, `${lib}.zvec`);
      if (!fs.existsSync(zvecPath)) {
        console.error(`[retrieve] zvec index not found for "${lib}". Run "build:index:zvec" first.`);
        continue;
      }

      const results = await _contextInstance.query(query, {
        library: lib,
        topK,
        mode,
        rerank: false,
      });

      for (const result of results) {
        const doc = docMap.get(result.id);
        if (doc) allResults.push(doc);
      }
    }

    docs = allResults.slice(0, topK);
  } else {
    // Context unavailable — no independent retrieval logic.
    // User must install model for semantic search.
    docs = [];
  }

  if (!content) {
    docs = docs.map(({ content, ...doc }) => doc);
  }

  if (includeConstraints) {
    const constraintLibs = library ? [library] : [...new Set(docs.map((d) => d.library))];
    const infoDocs: Doc[] = constraintLibs.flatMap((lib) => {
      const docInfo = _getDocInfo(lib);
      if (!docInfo) return [];
      return [
        {
          id: `__info__${lib}`,
          title: docInfo.name,
          description: docInfo.description,
          library: lib,
          version: '',
          category: '__info__',
          subcategory: '',
          tags: [],
          use_cases: [],
          anti_patterns: [],
          related: [],
          content: docInfo.constraintsContent
        }
      ];
    });
    docs = [...infoDocs, ...docs];
  }

  if (maxTokens && content) {
    docs = applyTokenBudget(docs, maxTokens, progressiveLevel);
  }

  return docs;
}
