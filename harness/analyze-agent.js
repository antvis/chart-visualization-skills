/**
 * Analyze Agent
 *
 * Responsibility: Map error cases to the skill files that caused them.
 * Groups cases by skill path so the optimizer can fix one skill at a time.
 *
 * Usage:
 *   const analyzeAgent = require('./harness/analyze-agent');
 *   const skillToErrors = await analyzeAgent.run(errorCases, { skillsDir });
 *   // skillToErrors: Map<skillPath, errorCase[]>
 */

const path = require('path');
const fs = require('fs');

/**
 * Recursively search for a skill file by basename under skillsDir.
 *
 * @param {string} skillsDir  - absolute path to skills root directory
 * @param {string} basename   - filename without extension
 * @returns {string|null} absolute path to the skill file, or null if not found
 */
function findSkillByBasename(skillsDir, basename) {
  function search(dir) {
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

/**
 * Resolve a skill reference to an absolute file path.
 * Accepts absolute paths, ROOT_DIR-relative paths, or skill id / basename.
 *
 * @param {string} ref        - skill reference (path or id)
 * @param {string} rootDir    - project root directory
 * @param {string} skillsDir  - skills directory
 * @returns {string|null} absolute path, or null if not found
 */
function resolveSkillPath(ref, rootDir, skillsDir) {
  if (path.isAbsolute(ref) && fs.existsSync(ref)) return ref;
  const fromRoot = path.join(rootDir, ref);
  if (fs.existsSync(fromRoot)) return fromRoot;
  return findSkillByBasename(skillsDir, path.basename(ref, '.md'));
}

/**
 * Collect all candidate skill refs from an error case.
 *
 * @param {object} errorCase
 * @returns {string[]} ordered list of skill refs (may be empty)
 */
function pickAllRefs(errorCase) {
  const loaded = errorCase.loadedSkillPaths || [];
  if (loaded.length > 0) return loaded;
  return errorCase.retrievedSkillIds || [];
}

/**
 * Score how relevant a skill file is to a specific error case.
 *
 * Uses two signals:
 *   1. CamelCase identifier overlap — class/method names from the generated code
 *      found in the skill content indicate the skill covers those APIs.
 *   2. Query keyword match in the skill header — words from the natural-language
 *      query that appear in the skill's YAML front matter / title area suggest
 *      the skill is topically aligned with what the user asked for.
 *
 * @param {string} skillContent - full skill file content (already lowercased)
 * @param {object} errorCase
 * @returns {number}
 */
function scoreSkillForCase(skillContent, errorCase) {
  let score = 0;

  // Signal 1: CamelCase identifiers from generated code found in skill content
  const identifiers = new Set(
    (errorCase.generatedCode || '').match(/\b[A-Z][a-zA-Z]{2,}\b/g) || []
  );
  for (const id of identifiers) {
    if (skillContent.includes(id.toLowerCase())) score += 2;
  }

  // Signal 2: query keywords matched against the skill header (first 600 chars)
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

/**
 * Pick the single most relevant skill path for an error case.
 *
 * Reads each candidate skill file and scores it; returns the highest scorer.
 * Falls back to the first candidate (highest BM25 rank from retrieval) when
 * scores are tied or files cannot be read.
 *
 * @param {object} errorCase
 * @param {string[]} candidatePaths - resolved, deduplicated skill paths
 * @returns {string}
 */
function pickMostRelevantSkill(errorCase, candidatePaths) {
  if (candidatePaths.length === 1) return candidatePaths[0];

  let bestPath  = candidatePaths[0]; // fallback: highest BM25 relevance
  let bestScore = -1;

  for (const skillPath of candidatePaths) {
    let content;
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

/**
 * Analyze error cases and attribute each one to the single most relevant skill.
 *
 * For each failed case all loaded skill paths are collected as candidates, then
 * pickMostRelevantSkill() selects the one most likely to need a fix.  The full
 * candidate list is preserved on the annotated case so the optimizer retains
 * context about which other skills were involved.
 *
 * @param {object[]} errorCases  - failed render results from render-agent
 * @param {object} opts
 * @param {string} opts.rootDir   - project root directory
 * @param {string} opts.skillsDir - absolute path to skills directory
 * @returns {{ skillToErrors: Map<string, object[]>, orphanCases: object[] }}
 */
function run(errorCases, { rootDir, skillsDir }) {
  const skillToErrors = new Map();
  const orphanCases   = [];

  for (const errorCase of errorCases) {
    const allRefs = pickAllRefs(errorCase);

    const resolvedPaths = allRefs
      .map((ref) => resolveSkillPath(ref, rootDir, skillsDir))
      .filter(Boolean);

    const uniquePaths = [...new Set(resolvedPaths)];

    if (uniquePaths.length === 0) {
      console.log(`  No skill refs for: ${errorCase.id} — queued for new skill creation`);
      orphanCases.push(errorCase);
      continue;
    }

    // Pick the single most relevant skill; keep full candidate list for context.
    const attributed = pickMostRelevantSkill(errorCase, uniquePaths);
    const annotated  = { ...errorCase, candidateSkillPaths: uniquePaths };

    if (uniquePaths.length > 1) {
      console.log(
        `  Attributed: ${errorCase.id} → ${path.basename(attributed, '.md')}` +
        ` (${uniquePaths.length} candidates)`
      );
    }

    if (!skillToErrors.has(attributed)) skillToErrors.set(attributed, []);
    skillToErrors.get(attributed).push(annotated);
  }

  return { skillToErrors, orphanCases };
}

module.exports = { run, resolveSkillPath, findSkillByBasename };
