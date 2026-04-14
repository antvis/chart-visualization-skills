/**
 * Agent Registry
 *
 * Central registry for all harness agents.  Instead of hard-requiring each
 * agent module directly in controller.js, agents self-describe their inputs,
 * availability checks, and handlers here.  The controller dispatches through
 * the registry, making it easy to add, disable, or replace agents without
 * touching the orchestration logic.
 *
 * Inspired by hermes/tools/registry.py
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── Agent entry schema ────────────────────────────────────────────────────────
//
// {
//   name:        string           — unique identifier
//   description: string           — one-liner shown in logs
//   checkFn:     () => boolean    — returns false to skip this agent (optional)
//   handler:     (opts) => any    — the actual run function
// }

class AgentRegistry {
  constructor() {
    /** @type {Map<string, object>} */
    this._agents = new Map();
  }

  /**
   * Register an agent.
   *
   * @param {string}   name
   * @param {string}   description
   * @param {Function} handler      - the agent's run/execute function
   * @param {Function} [checkFn]    - optional availability guard; must return true to run
   */
  register(name, description, handler, checkFn = null) {
    if (this._agents.has(name)) {
      throw new Error(`Agent "${name}" is already registered.`);
    }
    this._agents.set(name, { name, description, handler, checkFn });
  }

  /**
   * Dispatch a registered agent by name.
   *
   * @param {string} name
   * @param {object} opts  - forwarded to the agent's handler
   * @returns {any}        - whatever the handler returns (may be a Promise)
   */
  dispatch(name, opts) {
    const entry = this._agents.get(name);
    if (!entry) throw new Error(`Unknown agent: "${name}"`);
    if (entry.checkFn && !entry.checkFn()) {
      throw new Error(`Agent "${name}" is not available (checkFn returned false).`);
    }
    return entry.handler(opts);
  }

  /**
   * Return names of agents whose checkFn() returns true (or have no checkFn).
   *
   * @returns {string[]}
   */
  available() {
    return [...this._agents.values()]
      .filter((e) => !e.checkFn || e.checkFn())
      .map((e) => e.name);
  }

  /**
   * Return true if the named agent is registered and available.
   *
   * @param {string} name
   */
  isAvailable(name) {
    const entry = this._agents.get(name);
    if (!entry) return false;
    return !entry.checkFn || entry.checkFn();
  }

  /** List all registered agents (available or not). */
  list() {
    return [...this._agents.values()].map(({ name, description, checkFn }) => ({
      name,
      description,
      available: !checkFn || checkFn(),
    }));
  }
}

// ── Build and export the default registry ────────────────────────────────────

const ROOT_DIR = path.resolve(__dirname, '..');

const evalAgent     = require('./eval-agent');
const renderAgent   = require('./render-agent');
const analyzeAgent  = require('./analyze-agent');
const optimizeAgent = require('./optimize-agent');
const indexAgent    = require('./index-agent');

const registry = new AgentRegistry();

registry.register(
  'eval',
  'Run LLM evaluation on the dataset and produce a result JSON file',
  (opts) => evalAgent.run(opts),
  () => fs.existsSync(path.join(ROOT_DIR, 'eval', 'eval-cli', 'index.js'))
);

registry.register(
  'render',
  'Headless-browser render test each generated code snippet',
  (opts) => renderAgent.run(opts.resultPath, opts)
);

registry.register(
  'analyze',
  'Attribute render errors to skill files',
  (opts) => analyzeAgent.run(opts.errorCases, opts)
);

registry.register(
  'optimize',
  'Use LLM to rewrite skill docs based on observed errors',
  (opts) => optimizeAgent.run(opts.skillToErrors, opts)
);

registry.register(
  'index',
  'Rebuild the BM25 skill search index',
  (opts) => indexAgent.run(opts)
);

module.exports = registry;
module.exports.AgentRegistry = AgentRegistry;
