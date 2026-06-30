/**
 * Token budget helpers — trim skill content to fit within a max-token budget
 * for LLM context windows, respecting progressive disclosure levels.
 *
 * Extracted from retriever.ts for independent testing and reuse.
 */

import type { Skill } from './types';
import { isCJK } from './retrieval/embedder';

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
  return content.slice(0, i) + (i < content.length ? '\n<!-- truncated -->' : '');
}

// ---------------------------------------------------------------------------
// Progressive disclosure formatting
// ---------------------------------------------------------------------------

/**
 * Format a single skill's content for a given progressive level and token
 * budget.
 *
 * Levels:
 * - 0 = full content
 * - 1 = summary + code blocks only (default)
 * - 2 = summary only
 *
 * @param skill  The skill to format.
 * @param level  Progressive disclosure level (0, 1, or 2).
 * @param budget Maximum token budget for this skill's content.
 */
export function formatForBudget(skill: Skill, level: number, budget: number): string {
  const parts: string[] = [];
  parts.push(`## ${skill.title}\n`);
  if (skill.description) parts.push(`${skill.description}\n`);
  const body = skill.content || '';

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
// Token budget application across a skill array
// ---------------------------------------------------------------------------

/**
 * Trim skill content to fit within maxTokens budget, respecting progressiveLevel.
 *
 * The `__info__` skill (library constraints) is given full budget first,
 * then remaining budget is distributed across reference skills.
 *
 * @param skills          Array of skills (may include __info__ prefix).
 * @param maxTokens       Total token budget.
 * @param progressiveLevel Progressive disclosure level (0, 1, or 2).
 */
export function applyTokenBudget(
  skills: Skill[],
  maxTokens: number,
  level: 0 | 1 | 2
): Skill[] {
  const infoIdx = skills.findIndex((s) => s.id.startsWith('__info__'));
  const constraints = infoIdx >= 0 ? skills[infoIdx].content || '' : '';
  let budget = maxTokens - estimateTokens(constraints);

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    if (skill.id.startsWith('__info__')) continue;
    if (budget <= 0) {
      skill.content = undefined;
      continue;
    }

    const formatted = formatForBudget(skill, level, budget);
    skill.content = formatted;
    budget -= Math.min(estimateTokens(formatted), budget);
  }

  return skills;
}
