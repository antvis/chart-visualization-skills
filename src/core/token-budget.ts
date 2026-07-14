/**
 * Token budget helpers — trim doc content to fit within a max-token budget
 * for LLM context windows, respecting progressive disclosure levels.
 *
 * Extracted from retriever.ts for independent testing and reuse.
 */

import type { Doc } from './types';
import { isCJK } from '../utils/isCJK';

// ---------------------------------------------------------------------------
// Token estimation
// ---------------------------------------------------------------------------

/**
 * Estimate the number of tokens in a text string.
 *
 * CJK characters count ~0.67 tokens (subword tokenizers typically split
 * CJK into 1-2 tokens per character), while Latin characters count ~0.25
 * (subword tokenizers merge common English words into single tokens).
 */
export function estimateTokens(text: string): number {
  let n = 0;
  for (const ch of text) n += isCJK(ch) ? 0.67 : 0.25;
  return Math.ceil(n);
}

// ---------------------------------------------------------------------------
// Code block extraction
// ---------------------------------------------------------------------------

/**
 * Extract all fenced code blocks (```...```) from markdown content.
 */
export function extractCodeBlocks(content: string): string[] {
  const blocks: string[] = [];
  for (const m of content.matchAll(/```[\s\S]*?```/g)) blocks.push(m[0]);
  return blocks;
}

// ---------------------------------------------------------------------------
// Content truncation
// ---------------------------------------------------------------------------

/**
 * Truncate content to approximately maxTokens, appending a truncation marker
 * if the content was cut short.
 */
export function truncateContent(content: string, maxTokens: number): string {
  let tokens = 0;
  let i = 0;
  for (; i < content.length; i++) {
    tokens += isCJK(content[i]) ? 0.67 : 0.25;
    if (tokens >= maxTokens) break;
  }
  return (
    content.slice(0, i) + (i < content.length ? '\n<!-- truncated -->' : '')
  );
}

// ---------------------------------------------------------------------------
// Progressive disclosure formatting
// ---------------------------------------------------------------------------

/**
 * Format a single doc's content for a given progressive level and token
 * budget.
 *
 * Levels:
 * - 0 = full content
 * - 1 = summary + code blocks only (default)
 * - 2 = summary only
 *
 * @param doc  The doc to format.
 * @param level  Progressive disclosure level (0, 1, or 2).
 * @param budget Maximum token budget for this doc's content.
 */
export function formatForBudget(
  doc: Doc,
  level: number,
  budget: number
): string {
  const parts: string[] = [];
  parts.push(`## ${doc.title}\n`);
  if (doc.description) parts.push(`${doc.description}\n`);
  const body = doc.content || '';

  if (level === 2) return parts.join('\n'); // summary only
  if (level === 0) return parts.join('\n') + '\n' + body; // full

  // level 1: summary + code blocks
  const codeBlocks = extractCodeBlocks(body);
  const codeStr = codeBlocks.join('\n\n');
  const header = parts.join('\n');
  if (estimateTokens(header + codeStr) > budget) {
    return truncateContent(body, budget);
  }
  return header + '\n' + codeStr;
}

// ---------------------------------------------------------------------------
// Token budget application across a doc array
// ---------------------------------------------------------------------------

/**
 * Trim doc content to fit within maxTokens budget, respecting progressiveLevel.
 *
 * Budget is distributed evenly across all docs — no special treatment
 * for any doc type (constraints docs are now regular search results).
 *
 * @param docs            Array of docs.
 * @param maxTokens       Total token budget.
 * @param progressiveLevel Progressive disclosure level (0, 1, or 2).
 */
export function applyTokenBudget(
  docs: Doc[],
  maxTokens: number,
  level: 0 | 1 | 2
): Doc[] {
  // Shallow-copy each doc to avoid mutating cached objects.
  const result: Doc[] = docs.map((d) => ({ ...d }));

  let budget = maxTokens;

  for (let i = 0; i < result.length; i++) {
    const doc = result[i];
    if (budget <= 0) {
      doc.content = undefined;
      continue;
    }

    const formatted = formatForBudget(doc, level, budget);
    doc.content = formatted;
    budget -= Math.min(estimateTokens(formatted), budget);
  }

  return result;
}
