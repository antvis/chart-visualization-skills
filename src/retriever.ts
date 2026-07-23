import path from 'path';
import fs from 'fs';
import type { QueryResult } from '@antv/context';
import type { RetrieveOptions } from './types';
import { getContext } from './context';

const ZVEC_DIR = path.resolve(__dirname, '../zvec');
const CONTENT_DIR = path.resolve(__dirname, '../content');

/**
 * Return the list of libraries that have a built zvec index on disk.
 */
export function availableLibraries(): string[] {
  if (!fs.existsSync(ZVEC_DIR)) return [];

  return fs
    .readdirSync(ZVEC_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith('.zvec'))
    .map((entry) => entry.name.replace('.zvec', ''));
}

/**
 * Return the list of libraries that have content directories on disk.
 * Used by build to discover which libraries to build.
 */
export function contentLibraries(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/**
 * Retrieve docs based on a query.
 */
export async function retrieve(
  query: string,
  options: RetrieveOptions = {}
): Promise<QueryResult[]> {
  const {
    library = 'g2',
    topK = 7,
    strategy = 'hybrid',
    // maxTokens,
    // content = true,
    progressiveLevel = 1
  } = options;

  const ctx = await getContext();

  return await ctx.query(query, {
    library,
    topK,
    mode: strategy === 'vector' ? 'vector' : 'hybrid',
    rerank: false
  });
}
