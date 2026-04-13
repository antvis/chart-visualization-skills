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
 * Pick the single most-relevant skill ref from an error case.
 *
 * Attribution priority:
 *  1. loadedSkillPaths (tool-call): the *last* entry — LLM read it closest to
 *     code generation, making it the highest-confidence blame target.
 *  2. retrievedSkillIds (bm25): the *first* entry — highest BM25 rank.
 *
 * Attributing a failed case to all loaded skills pollutes healthy skills with
 * spurious errors and inflates LLM optimization costs.
 *
 * @param {object} errorCase
 * @returns {string|null} the single primary skill ref, or null
 */
function pickPrimaryRef(errorCase) {
  const loaded = errorCase.loadedSkillPaths || [];
  if (loaded.length > 0) return loaded[loaded.length - 1]; // last read = most relevant

  const retrieved = errorCase.retrievedSkillIds || [];
  if (retrieved.length > 0) return retrieved[0]; // top BM25 rank

  return null;
}

/**
 * Analyze error cases and group them by the skill file they exercised.
 *
 * Each failed case is attributed to exactly one skill (the primary ref) to
 * avoid cascading spurious optimizations across unrelated skill files.
 *
 * @param {object[]} errorCases  - failed render results from render-agent
 * @param {object} opts
 * @param {string} opts.rootDir  - project root directory
 * @param {string} opts.skillsDir - absolute path to skills directory
 * @returns {{ skillToErrors: Map<string, object[]>, orphanCases: object[] }}
 *   skillToErrors: map from skill file path to error cases
 *   orphanCases: error cases with no resolvable skill refs (candidates for new skill creation)
 */
function run(errorCases, { rootDir, skillsDir }) {
  const skillToErrors = new Map();
  const orphanCases = [];

  for (const errorCase of errorCases) {
    const primaryRef = pickPrimaryRef(errorCase);

    if (!primaryRef) {
      console.log(`  No skill refs for: ${errorCase.id} — queued for new skill creation`);
      orphanCases.push(errorCase);
      continue;
    }

    const skillPath = resolveSkillPath(primaryRef, rootDir, skillsDir);
    if (!skillPath) {
      console.warn(`  Could not resolve primary skill ref "${primaryRef}" for: ${errorCase.id} — queued for new skill creation`);
      orphanCases.push(errorCase);
      continue;
    }

    if (!skillToErrors.has(skillPath)) skillToErrors.set(skillPath, []);
    skillToErrors.get(skillPath).push(errorCase);
  }

  return { skillToErrors, orphanCases };
}

module.exports = { run, resolveSkillPath, findSkillByBasename };
