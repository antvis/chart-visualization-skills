import type { QueryResult } from '@antv/context';
import type { RetrieveOptions, Doc } from './types';
import { getContext } from './context';

function resultToDoc(result: QueryResult): Doc {
  const { id, path, content } = result;
  const { title, description, library, version, category, subcategory, tags, use_cases, anti_patterns, related } = (result.meta ?? {}) as any;
  return {
    id,
    path,
    content,
    title,
    description,
    library,
    version,
    category,
    subcategory,
    tags: Array.isArray(tags) ? tags : [],
    use_cases: Array.isArray(use_cases) ? use_cases : [],
    anti_patterns: Array.isArray(anti_patterns) ? anti_patterns : [],
    related: Array.isArray(related) ? related : [],
  };
}

/**
 * Retrieve docs based on a query.
 */
export async function retrieve(
  query: string,
  options: RetrieveOptions = {}
): Promise<Doc[]> {
  const {
    library = 'g2',
    topK = 7,
    strategy = 'hybrid',
    // maxTokens,
    // content = true,
    progressiveLevel = 1
  } = options;

  const ctx = await getContext();

  const results =  await ctx.query(query, {
    library,
    topK,
    mode: strategy === 'vector' ? 'vector' : 'hybrid',
    rerank: false
  });

  return results.map(resultToDoc);
}
