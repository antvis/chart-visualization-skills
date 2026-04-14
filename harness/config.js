/**
 * Harness Library Registry
 *
 * Central configuration for all supported libraries.
 * To add a new library, add an entry to LIBRARY_REGISTRY and provide:
 *   - a dataset file in eval/data/
 *   - a system prompt file in prompts/
 *   - skill docs in skills/{id}/references/
 */

const LIBRARY_REGISTRY = {
  g2: {
    id: 'g2',
    friendlyName: 'AntV G2',
    npmPackage: '@antv/g2',
    cdnUrl: 'https://unpkg.com/@antv/g2@5.4.8/dist/g2.min.js',
    windowGlobal: 'G2',
    entry: 'Chart',
    skillsPath: 'antv-g2-chart/references', // relative to skills/
    buildCmd: 'node dist/scripts/build.js',
    detectPattern: '@antv/g2', // pattern to detect library in generated code
    defaultDataset: 'g2-dataset-174.json',
    // Local reference paths for optimize-agent context injection.
    // These are optional: when set, the optimizer can read library source/docs
    // to look up authoritative API details during skill rewriting.
    //
    // Configure via environment variables (never hardcode paths here):
    //   G2_SRC_DIR   — absolute path to the G2 source tree, e.g. /path/to/G2/src
    //   G2_DOCS_DIR  — absolute path to the G2 docs tree,   e.g. /path/to/G2/site/docs
    //
    // If neither variable is set, refs is null and the optimizer falls back to
    // skill-only context (no ref lookups), which is the safe default for CI.
    refs: (() => {
      const srcDir  = process.env.G2_SRC_DIR  || null;
      const docsDir = process.env.G2_DOCS_DIR || null;
      return (srcDir || docsDir) ? { srcDir, docsDir } : null;
    })()
  },
  g6: {
    id: 'g6',
    friendlyName: 'AntV G6',
    npmPackage: '@antv/g6',
    cdnUrl: 'https://unpkg.com/@antv/g6@5.0.42/dist/g6.min.js',
    windowGlobal: 'G6',
    entry: 'Graph',
    skillsPath: 'antv-g6-graph/references',
    buildCmd: 'node dist/scripts/build.js',
    detectPattern: '@antv/g6',
    defaultDataset: 'g6-dataset.json' // TODO: provide a g6-specific dataset in eval/data/
  }
};

/**
 * Get config for a specific library.
 * @param {string} id - library id (e.g. 'g2', 'g6')
 * @returns {object} library config
 * @throws {Error} if library is not registered
 */
function getLibraryConfig(id) {
  const config = LIBRARY_REGISTRY[id];
  if (!config) {
    const available = Object.keys(LIBRARY_REGISTRY).join(', ');
    throw new Error(`Unknown library: "${id}". Available: ${available}`);
  }
  return config;
}

/**
 * List all registered libraries.
 * @returns {object[]} array of library configs
 */
function listLibraries() {
  return Object.values(LIBRARY_REGISTRY);
}

module.exports = { LIBRARY_REGISTRY, getLibraryConfig, listLibraries };
