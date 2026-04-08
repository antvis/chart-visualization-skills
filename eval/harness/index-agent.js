/**
 * Index Agent
 *
 * Responsibility: Rebuild the skill search index after skill files are modified.
 * The build command is resolved from the library registry config.
 *
 * Usage:
 *   const indexAgent = require('./harness/index-agent');
 *   await indexAgent.run({ libraryId: 'g2', rootDir: '/path/to/project' });
 */

const { execSync } = require('child_process');
const { getLibraryConfig } = require('./config');

/**
 * Rebuild the skill index.
 *
 * @param {object} opts
 * @param {string} opts.libraryId  - library id (e.g. 'g2')
 * @param {string} opts.rootDir    - project root directory
 */
function run({ libraryId, rootDir }) {
  const { buildCmd } = getLibraryConfig(libraryId);
  console.log('\nRebuilding index...');
  console.log(`$ ${buildCmd}`);
  execSync(buildCmd, { cwd: rootDir, stdio: 'inherit' });
}

module.exports = { run };
