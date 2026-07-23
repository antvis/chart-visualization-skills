import type { QueryResult } from '@antv/context';
import type { RetrieveOptions, Doc } from './types';
import { getContext } from './context';
import { applyTokenBudget } from './token';

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
    content = true,
    strategy = 'hybrid',
    maxTokens
  } = options;

  const ctx = await getContext();

  const results =  await ctx.query(query, {
    library,
    topK,
    mode: strategy === 'vector' ? 'vector' : 'hybrid',
    rerank: false
  });

  let docs = results.map(resultToDoc);

  if (maxTokens && content) {
    docs = applyTokenBudget(docs, maxTokens);
  }

  if (!content) {
    docs = docs.map(({ content, ...doc }) => doc);
  }

  return docs;
}
