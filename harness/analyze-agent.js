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
 * Returns every skill the model actually read (tool-call) or retrieved (bm25).
 * The optimizer receives the full candidate set and decides which skill(s) to
 * change — avoiding the "last-read = guilty" single-point-of-failure assumption.
 *
 * @param {object} errorCase
 * @returns {string[]} ordered list of skill refs (may be empty)
 */
function pickAllRefs(errorCase) {
  const loaded = errorCase.loadedSkillPaths || [];
  if (loaded.length > 0) return loaded;

  const retrieved = errorCase.retrievedSkillIds || [];
  return retrieved;
}

/**
 * Analyze error cases and group them by every candidate skill file.
 *
 * Each failed case is attributed to all skills the model loaded, not just the
 * last one. The errorCase is annotated with `candidateSkillPaths` so the
 * optimizer knows the full context and can self-select the true root cause.
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
    const allRefs = pickAllRefs(errorCase);

    const resolvedPaths = allRefs
      .map((ref) => resolveSkillPath(ref, rootDir, skillsDir))
      .filter(Boolean);

    // Deduplicate (same file may appear under different ref forms)
    const uniquePaths = [...new Set(resolvedPaths)];

    if (uniquePaths.length === 0) {
      console.log(`  No skill refs for: ${errorCase.id} — queued for new skill creation`);
      orphanCases.push(errorCase);
      continue;
    }

    // Annotate the case so the optimizer knows which skills are candidates
    const annotated = { ...errorCase, candidateSkillPaths: uniquePaths };

    for (const skillPath of uniquePaths) {
      if (!skillToErrors.has(skillPath)) skillToErrors.set(skillPath, []);
      skillToErrors.get(skillPath).push(annotated);
    }
  }

  return { skillToErrors, orphanCases };
}

module.exports = { run, resolveSkillPath, findSkillByBasename };
