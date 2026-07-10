/**
 * Synonym query expander — pure function.
 */

import { isCJK } from './isCJK';

export interface QueryExpansionOptions {
  synonyms?: Record<string, string[]>;
}

const WORD_BOUNDARY_RE =
  /[\s,，。.!！?？;；:：\(\)\[\]{}""''\"\'\-_\/\\|@#$%^&*+=<>~`]/;

export function containsCJK(text: string): boolean {
  for (const ch of text) {
    if (isCJK(ch)) return true;
  }
  return false;
}

function containsTerm(text: string, term: string): boolean {
  if (!text.includes(term)) return false;

  // CJK terms use substring match
  if (containsCJK(term)) return true;

  // Latin terms use word boundary match
  let searchFrom = 0;
  while (searchFrom <= text.length - term.length) {
    const idx = text.indexOf(term, searchFrom);
    if (idx === -1) return false;

    const prevOk = idx === 0 || WORD_BOUNDARY_RE.test(text[idx - 1]);
    const afterIdx = idx + term.length;
    const afterOk =
      afterIdx >= text.length || WORD_BOUNDARY_RE.test(text[afterIdx]);

    if (prevOk && afterOk) return true;
    searchFrom = idx + 1;
  }
  return false;
}

export function expand(
  query: string,
  queryExpansion?: QueryExpansionOptions | false
): string {
  if (queryExpansion === false) return query;
  const synonyms = queryExpansion?.synonyms;
  if (!synonyms || Object.keys(synonyms).length === 0) return query;

  const queryLower = query.toLowerCase().trim();
  const additions = new Set<string>();

  for (const [term, syns] of Object.entries(
    synonyms as Record<string, string[]>
  )) {
    const termLower = term.toLowerCase();

    if (containsTerm(queryLower, termLower)) {
      for (const syn of syns) {
        if (!containsTerm(queryLower, syn.toLowerCase())) {
          additions.add(syn);
        }
      }
    }
  }

  if (additions.size === 0) return query;
  return `${query} ${[...additions].join(' ')}`;
}
