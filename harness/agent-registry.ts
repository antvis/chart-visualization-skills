/**
 * Agent Registry
 *
 * Central registry for all harness agents.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as evalAgent from './eval-agent.js';
import * as renderAgent from './render-agent.js';
import * as analyzeAgent from './analyze-agent.js';
import * as optimizeAgent from './optimize-agent.js';
import * as indexAgent from './index-agent.js';
import type { ErrorCase } from './memory.js';
import type { AnalyzeResult } from './analyze-agent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentResult = any;

interface AgentEntry {
  name: string;
  description: string;
  handler: (opts: Record<string, unknown>) => AgentResult;
  checkFn: (() => boolean) | null;
}

export class AgentRegistry {
  private _agents = new Map<string, AgentEntry>();

  register(
    name: string,
    description: string,
    handler: (opts: Record<string, unknown>) => AgentResult,
    checkFn: (() => boolean) | null = null
  ): void {
    if (this._agents.has(name)) {
      throw new Error(`Agent "${name}" is already registered.`);
    }
    this._agents.set(name, { name, description, handler, checkFn });
  }

  dispatch(name: string, opts: Record<string, unknown>): AgentResult {
    const entry = this._agents.get(name);
    if (!entry) throw new Error(`Unknown agent: "${name}"`);
    if (entry.checkFn && !entry.checkFn()) {
      throw new Error(`Agent "${name}" is not available (checkFn returned false).`);
    }
    return entry.handler(opts);
  }

  available(): string[] {
    return [...this._agents.values()]
      .filter((e) => !e.checkFn || e.checkFn())
      .map((e) => e.name);
  }

  isAvailable(name: string): boolean {
    const entry = this._agents.get(name);
    if (!entry) return false;
    return !entry.checkFn || entry.checkFn();
  }

  list(): { name: string; description: string; available: boolean }[] {
    return [...this._agents.values()].map(({ name, description, checkFn }) => ({
      name,
      description,
      available: !checkFn || checkFn(),
    }));
  }
}

const ROOT_DIR = path.resolve(__dirname, '..');

const registry = new AgentRegistry();

registry.register(
  'eval',
  'Run LLM evaluation on the dataset and produce a result JSON file',
  (opts) => evalAgent.run(opts as unknown as Parameters<typeof evalAgent.run>[0]),
  () => fs.existsSync(path.join(ROOT_DIR, 'eval', 'eval-cli', 'index.js'))
);

registry.register(
  'render',
  'Headless-browser render test each generated code snippet',
  (opts) => renderAgent.run(opts['resultPath'] as string, opts as Parameters<typeof renderAgent.run>[1])
);

registry.register(
  'analyze',
  'Attribute render errors to skill files',
  (opts) => {
    const result: AnalyzeResult = analyzeAgent.run(
      opts['errorCases'] as ErrorCase[],
      { rootDir: opts['rootDir'] as string, skillsDir: opts['skillsDir'] as string }
    );
    return result;
  }
);

registry.register(
  'optimize',
  'Use LLM to rewrite skill docs based on observed errors',
  (opts) => optimizeAgent.run(
    opts['skillToErrors'] as Map<string, ErrorCase[]>,
    opts as unknown as Parameters<typeof optimizeAgent.run>[1]
  )
);

registry.register(
  'index',
  'Rebuild the BM25 skill search index',
  (opts) => indexAgent.run({ libraryId: opts['libraryId'] as string, rootDir: opts['rootDir'] as string })
);

export default registry;
