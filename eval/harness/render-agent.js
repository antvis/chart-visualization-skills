/**
 * Render Agent
 *
 * Responsibility: Execute generated code via headless browser and return failed cases.
 *
 * Usage:
 *   const renderAgent = require('./harness/render-agent');
 *   const errorCases = await renderAgent.run(resultPath, { concurrency: 5 });
 */

const fs = require('fs');
const { testAllResults } = require('../utils/render-tester');

/**
 * Run render tests on all results in a result file.
 *
 * @param {string} resultPath       - path to result JSON file
 * @param {object} [opts]
 * @param {number} [opts.concurrency=5]  - max parallel render tests
 * @returns {object[]} array of failed result objects (renderStatus === 'error' | 'blank')
 */
async function run(resultPath, { concurrency = 5 } = {}) {
  const data = JSON.parse(fs.readFileSync(resultPath, 'utf-8'));
  const allResults = data.results || [];
  const total = allResults.length;

  console.log(
    `\nRender testing ${total} result(s) (concurrency=${concurrency})...`
  );

  const testedResults = await testAllResults(allResults, {
    concurrency,
    onProgress({ done, total: t, result }) {
      if (result.renderStatus !== 'success') {
        const tag = result.renderStatus.toUpperCase();
        const detail = result.renderError ? ` — ${result.renderError}` : '';
        console.log(`  [${done}/${t}] [${tag}] ${result.id}${detail}`);
      } else {
        process.stdout.write(`\r  Progress: ${done}/${t}`);
      }
    }
  });
  process.stdout.write('\n');

  const statusCounts = testedResults.reduce((acc, r) => {
    acc[r.renderStatus] = (acc[r.renderStatus] || 0) + 1;
    return acc;
  }, {});
  console.log(
    `  Result: success=${statusCounts.success || 0}  blank=${statusCounts.blank || 0}  error=${statusCounts.error || 0}`
  );

  return testedResults.filter(
    (r) => r.renderStatus === 'error' || r.renderStatus === 'blank'
  );
}

module.exports = { run };
