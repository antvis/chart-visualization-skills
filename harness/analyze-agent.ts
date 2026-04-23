/**
 * Analyze Agent
 *
 * Responsibility: Map error cases to the skill files that caused them.
 * Groups cases by skill path so the optimizer can fix one skill at a time.
 */

import path from 'path';
import fs from 'fs';
import type { ErrorCase } from './memory.js';

export function findSkillByBasename(skillsDir: string, basename: string): string | null {
  function search(dir: string): string | null {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = search(full);
        if (found) return found;
      } else if (
        entry.name === basename + '.md' ||
        path.basename(entry.name, '.md') === basename
      ) {
        return full;
      }
    }
    return null;
  }
  return search(skillsDir);
}

export function resolveSkillPath(ref: string, rootDir: string, skillsDir: string): string | null {
  if (path.isAbsolute(ref) && fs.existsSync(ref)) return ref;
  const fromRoot = path.join(rootDir, ref);
  if (fs.existsSync(fromRoot)) return fromRoot;
  return findSkillByBasename(skillsDir, path.basename(ref, '.md'));
}

function pickAllRefs(errorCase: ErrorCase): string[] {
  const loaded = errorCase.loadedSkillPaths || [];
  if (loaded.length > 0) return loaded;
  return errorCase.retrievedSkillIds || [];
}

function scoreSkillForCase(skillContent: string, errorCase: ErrorCase): number {
  let score = 0;

  const identifiers = new Set(
    (errorCase.generatedCode || '').match(/\b[A-Z][a-zA-Z]{2,}\b/g) || []
  );
  for (const id of identifiers) {
    if (skillContent.includes(id.toLowerCase())) score += 2;
  }

  const header = skillContent.slice(0, 600);
  const queryTokens = (errorCase.query || '')
    .toLowerCase()
    .split(/[\s,，。？!、\n]+/)
    .filter((t) => t.length > 1);
  for (const token of queryTokens) {
    if (header.includes(token)) score += 3;
    else if (skillContent.includes(token)) score += 1;
  }

  return score;
}

function pickMostRelevantSkill(errorCase: ErrorCase, candidatePaths: string[]): string {
  if (candidatePaths.length === 1) return candidatePaths[0];

  let bestPath  = candidatePaths[0];
  let bestScore = -1;

  for (const skillPath of candidatePaths) {
    let content: string;
    try {
      content = fs.readFileSync(skillPath, 'utf-8').toLowerCase();
    } catch {
      continue;
    }
    const score = scoreSkillForCase(content, errorCase);
    if (score > bestScore) {
      bestScore = score;
      bestPath  = skillPath;
    }
  }

  return bestPath;
}

export interface AnalyzeResult {
  skillToErrors: Map<string, ErrorCase[]>;
  orphanCases: ErrorCase[];
}

export interface AnalyzeAgentOptions {
  rootDir: string;
  skillsDir: string;
}

export function run(errorCases: ErrorCase[], { rootDir, skillsDir }: AnalyzeAgentOptions): AnalyzeResult {
  const skillToErrors = new Map<string, ErrorCase[]>();
  const orphanCases: ErrorCase[] = [];

  for (const errorCase of errorCases) {
    const allRefs = pickAllRefs(errorCase);

    const resolvedPaths = allRefs
      .map((ref) => resolveSkillPath(ref, rootDir, skillsDir))
      .filter((p): p is string => p !== null);

    const uniquePaths = [...new Set(resolvedPaths)];

    if (uniquePaths.length === 0) {
      console.log(`  No skill refs for: ${errorCase.id} — queued for new skill creation`);
      orphanCases.push(errorCase);
      continue;
    }

    const attributed = pickMostRelevantSkill(errorCase, uniquePaths);
    const annotated: ErrorCase = { ...errorCase, candidateSkillPaths: uniquePaths };

    if (uniquePaths.length > 1) {
      console.log(
        `  Attributed: ${errorCase.id} → ${path.basename(attributed, '.md')}` +
        ` (${uniquePaths.length} candidates)`
      );
    }

    if (!skillToErrors.has(attributed)) skillToErrors.set(attributed, []);
    skillToErrors.get(attributed)!.push(annotated);
  }

  return { skillToErrors, orphanCases };
}
