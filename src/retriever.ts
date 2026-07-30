import type { QueryResult } from '@antv/context';
import type { RetrieveOptions, Doc } from './types';
import { getContext, LIBRARIES } from './context';
import { applyTokenBudget } from './token';
import { expandQuery } from './synonyms';

function resultToDoc(result: QueryResult): Doc {
  const { id, path, content } = result;
  const {
    id: metaId,
    title,
    description,
    library,
    version,
    category,
    subcategory,
    tags,
    use_cases,
    anti_patterns,
    related
  } = (result.meta ?? {}) as any;
  return {
    id: typeof metaId === 'string' ? metaId : id,
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
    related: Array.isArray(related) ? related : []
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
    library,
    topK = 7,
    content = true,
    strategy = 'hybrid',
    maxTokens,
  } = options;

  const ctx = await getContext();
  const expandedQuery = expandQuery(query);

  const libraries = library ? [library] : [...LIBRARIES];
  const resultGroups = await Promise.all(libraries.map((lib) => ctx.query(expandedQuery, {
    library: lib,
    topK,
    mode: strategy === 'vector' ? 'vector' : 'hybrid',
  })));

  let docs = resultGroups
    .flat()
    .sort((a, b) => b.score - a.score)
    .map(resultToDoc)
    .filter((doc, index, all) => all.findIndex((item) => item.id === doc.id) === index)
    .slice(0, topK);

  if (maxTokens && content) {
    docs = applyTokenBudget(docs, maxTokens);
  }

  if (!content) {
    docs = docs.map(({ content, ...doc }) => doc);
  }

  return docs;
}
