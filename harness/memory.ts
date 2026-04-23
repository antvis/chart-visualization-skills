/**
 * Harness Memory
 *
 * Persists cross-iteration learning so the optimize-agent can see the history
 * of a skill's errors and previous optimization attempts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_PATH = path.join(__dirname, 'memory.json');
const PROJECT_ROOT = path.resolve(__dirname, '..');

interface ErrorRecord {
  caseId: string;
  errorType: string;
  query: string;
  iteration: number;
  ts: number;
}

interface OptimizationRecord {
  iteration: number;
  numErrors: number;
  errorTypes: string[];
  ts: number;
}

interface SkillHistory {
  errors: ErrorRecord[];
  optimizations: OptimizationRecord[];
}

type MemoryData = Record<string, SkillHistory>;

export interface ErrorCase {
  id: string;
  query?: string;
  renderStatus?: string;
  renderError?: string;
  generatedCode?: string;
  expectedCode?: string;
  error?: string;
  loadedSkillPaths?: string[];
  retrievedSkillIds?: string[];
  candidateSkillPaths?: string[];
  visualScore?: number;
}

export class HarnessMemory {
  private _path: string;
  private _data: MemoryData;

  constructor(memoryPath = MEMORY_PATH) {
    this._path = memoryPath;
    this._data = this._load();
  }

  private _load(): MemoryData {
    for (const p of [this._path, `${this._path}.tmp`]) {
      try {
        if (fs.existsSync(p)) {
          return JSON.parse(fs.readFileSync(p, 'utf-8')) as MemoryData;
        }
      } catch {
        // Corrupt — try the next candidate
      }
    }
    return {};
  }

  private _save(): void {
    const tmp = `${this._path}.tmp`;
    fs.mkdirSync(path.dirname(this._path), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(this._data, null, 2));
    fs.renameSync(tmp, this._path);
  }

  private _skill(skillPath: string): SkillHistory {
    const key = this._normalizeKey(skillPath);
    if (!this._data[key]) {
      this._data[key] = { errors: [], optimizations: [] };
    }
    return this._data[key];
  }

  private _normalizeKey(skillPath: string): string {
    if (path.isAbsolute(skillPath)) {
      const rel = path.relative(PROJECT_ROOT, skillPath);
      if (!rel.startsWith('..')) return rel;
      const idx = skillPath.indexOf(`${path.sep}skills${path.sep}`);
      return idx >= 0 ? skillPath.slice(idx + 1) : skillPath;
    }
    return skillPath;
  }

  private _errorType(errorCase: ErrorCase): string {
    return errorCase.renderStatus === 'error' && errorCase.renderError
      ? errorCase.renderError.slice(0, 150)
      : (errorCase.renderStatus || 'unknown');
  }

  recordErrors(skillPath: string, errorCases: ErrorCase[], iteration: number): void {
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

  recordOptimization(skillPath: string, errorCases: ErrorCase[], iteration: number): void {
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

  getOptimizationContext(skillPath: string): string | null {
    const history = this._data[this._normalizeKey(skillPath)];
    if (!history || history.optimizations.length === 0) return null;

    const key = this._normalizeKey(skillPath);
    const lines = [
      `【历史优化记录 — ${path.basename(key)}】`,
      `共优化 ${history.optimizations.length} 次，累计错误 ${history.errors.length} 条。`,
      '',
    ];

    const recent = history.optimizations.slice(-5);
    for (const opt of recent) {
      lines.push(`- 第 ${opt.iteration} 轮：${opt.numErrors} 个错误，类型：${opt.errorTypes.join(', ')}`);
    }

    const typeByIteration: Record<string, Set<number>> = {};
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

  getFrequentlyFailingSkills(n = 5): { skillPath: string; count: number }[] {
    return Object.entries(this._data)
      .map(([skillPath, h]) => ({ skillPath, count: h.optimizations.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  }

  clear(): void {
    this._data = {};
    this._save();
  }
}

const defaultMemory = new HarnessMemory();
export default defaultMemory;
