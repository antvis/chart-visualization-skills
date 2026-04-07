/**
 * Index Agent
 *
 * Responsibility: Rebuild the skill search index after skill files are modified.
 * The build command is taken from the library config, so different libraries
 * can use different build tools.
 *
 * Usage:
 *   const indexAgent = require('./harness/index-agent');
 *   await indexAgent.run({ buildCmd: 'node bin/skills-antv.js build', cwd });
 */

const { execSync } = require('child_process');

/**
 * Rebuild the skill index.
 *
 * @param {object} opts
 * @param {string} opts.buildCmd  - shell command to rebuild the index
 * @param {string} opts.cwd       - working directory for the command (project root)
 */
function run({ buildCmd, cwd }) {
  console.log('\nRebuilding index...');
  console.log(`$ ${buildCmd}`);
  execSync(buildCmd, { cwd, stdio: 'inherit' });
}

module.exports = { run };
