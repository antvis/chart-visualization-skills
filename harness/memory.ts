/**
 * Harness Memory
 *
 * Persists cross-iteration learning so the optimize-agent can see the history
 * of a skill's errors and previous optimization attempts, avoiding repeated
 * mistakes and detecting patterns that persist across runs.
 *
 * Backed by a single JSON file at harness/memory.json (git-ignored is fine;
 * it is local state, not source).
 *
 * Inspired by hermes/agent/memory_manager.py
 */

'use strict';

const fs = require('fs');
const path = require('path');

const MEMORY_PATH = path.join(__dirname, 'memory.json');
// Project root used to normalise skill paths to relative keys.
const PROJECT_ROOT = path.resolve(__dirname, '..');

/** @typedef {{ caseId: string, errorType: string, query: string, iteration: number, ts: number }} ErrorRecord */
/** @typedef {{ iteration: number, numErrors: number, errorTypes: string[], ts: number }} OptimizationRecord */
/** @typedef {{ errors: ErrorRecord[], optimizations: OptimizationRecord[] }} SkillHistory */
/** @typedef {{ [skillPath: string]: SkillHistory }} MemoryData */

class HarnessMemory {
  constructor(memoryPath = MEMORY_PATH) {
    this._path = memoryPath;
    /** @type {MemoryData} */
    this._data = this._load();
  }

  // ── Persistence ─────────────────────────────────────────────────────────────

  _load() {
    // Try the canonical file first; fall back to the tmp file left by a
    // crashed previous run; if both are missing/corrupt, start fresh.
    for (const p of [this._path, `${this._path}.tmp`]) {
      try {
        if (fs.existsSync(p)) {
          return JSON.parse(fs.readFileSync(p, 'utf-8'));
        }
      } catch {
        // Corrupt — try the next candidate
      }
    }
    return {};
  }

  _save() {
    const tmp = `${this._path}.tmp`;
    fs.mkdirSync(path.dirname(this._path), { recursive: true });
    // Write to a temp file first, then atomically replace the canonical file.
    // fs.renameSync is atomic on POSIX (same filesystem), so a crash between
    // the two calls leaves the old file intact and recoverable via the .tmp.
    fs.writeFileSync(tmp, JSON.stringify(this._data, null, 2));
    fs.renameSync(tmp, this._path);
  }

  _skill(skillPath) {
    const key = this._normalizeKey(skillPath);
    if (!this._data[key]) {
      this._data[key] = { errors: [], optimizations: [] };
    }
    return this._data[key];
  }

  /**
   * Normalise an absolute or relative skill path to a project-root-relative key.
   * This makes memory.json portable across machines and worktrees.
   *
   * @param {string} skillPath
   * @returns {string} relative path, e.g. "skills/antv-g2-chart/references/xxx.md"
   */
  _normalizeKey(skillPath) {
    if (path.isAbsolute(skillPath)) {
      // Strip worktree or any machine-specific prefix up to the first "skills/" segment.
      const rel = path.relative(PROJECT_ROOT, skillPath);
      // If the path escapes project root (worktree on different drive etc.), fall back
      // to extracting from the first "skills/" occurrence in the string.
      if (!rel.startsWith('..')) return rel;
      const idx = skillPath.indexOf(`${path.sep}skills${path.sep}`);
      return idx >= 0 ? skillPath.slice(idx + 1) : skillPath;
    }
    return skillPath;
  }

  // ── Write API ────────────────────────────────────────────────────────────────

  /**
   * Extract a diagnostic error type string from a single error case.
   * Uses the concrete render error message when available — it carries far
   * more signal than the generic "error" / "blank" status.
   *
   * @param {object} errorCase
   * @returns {string}
   */
  _errorType(errorCase) {
    return errorCase.renderStatus === 'error' && errorCase.renderError
      ? errorCase.renderError.slice(0, 150)
      : (errorCase.renderStatus || 'unknown');
  }

  /**
   * Record error cases attributed to a specific skill after a render pass.
   *
   * @param {string}   skillPath
   * @param {object[]} errorCases  - harness error case objects
   * @param {number}   iteration
   */
  recordErrors(skillPath, errorCases, iteration) {
    const history = this._skill(skillPath);
    for (const c of errorCases) {
      history.errors.push({
        caseId:    c.id,
        errorType: this._errorType(c),
        query:     (c.query || '').slice(0, 120),
        iteration,
        ts:        Date.now(),
      });
    }
    this._save();
  }

  /**
   * Record that a skill was submitted for optimization.
   *
   * @param {string}   skillPath
   * @param {object[]} errorCases
   * @param {number}   iteration
   */
  recordOptimization(skillPath, errorCases, iteration) {
    const history = this._skill(skillPath);
    const errorTypes = [...new Set(errorCases.map((c) => this._errorType(c)))];
    history.optimizations.push({
      iteration,
      numErrors:  errorCases.length,
      errorTypes,
      ts:         Date.now(),
    });
    this._save();
  }

  // ── Read API ─────────────────────────────────────────────────────────────────

  /**
   * Build a concise history string to inject into the optimize-agent prompt.
   * Returns null if no history exists yet.
   *
   * @param {string} skillPath
   * @returns {string|null}
   */
  getOptimizationContext(skillPath) {
    const history = this._data[this._normalizeKey(skillPath)];
    if (!history || history.optimizations.length === 0) return null;

    const key = this._normalizeKey(skillPath);
    const lines = [
      `【历史优化记录 — ${path.basename(key)}】`,
      `共优化 ${history.optimizations.length} 次，累计错误 ${history.errors.length} 条。`,
      '',
    ];

    // Last 5 optimization rounds
    const recent = history.optimizations.slice(-5);
    for (const opt of recent) {
      lines.push(`- 第 ${opt.iteration} 轮：${opt.numErrors} 个错误，类型：${opt.errorTypes.join(', ')}`);
    }

    // Persistent error types (appeared in ≥2 different iterations)
    const typeByIteration = {};
    for (const e of history.errors) {
      if (!typeByIteration[e.errorType]) typeByIteration[e.errorType] = new Set();
      typeByIteration[e.errorType].add(e.iteration);
    }
    const persistent = Object.entries(typeByIteration)
      .filter(([, iters]) => iters.size >= 2)
      .map(([t]) => t);

    if (persistent.length > 0) {
      lines.push('');
      lines.push(`⚠️ 持续出现的错误类型（跨多轮未解决）：${persistent.join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Return skills that have been optimized the most times (top N).
   *
   * @param {number} [n=5]
   * @returns {{ skillPath: string, count: number }[]}
   */
  getFrequentlyFailingSkills(n = 5) {
    return Object.entries(this._data)
      .map(([skillPath, h]) => ({ skillPath, count: h.optimizations.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  }

  /**
   * Clear all memory (useful for a fresh run with --no-memory).
   */
  clear() {
    this._data = {};
    this._save();
  }
}

// Export a default singleton; callers that need isolation can `new HarnessMemory(path)`
module.exports = new HarnessMemory();
module.exports.HarnessMemory = HarnessMemory;
