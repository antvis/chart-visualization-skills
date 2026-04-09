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
const { testAllResults } = require('../eval/utils/render-tester');

/**
 * Run render tests on all results in a result file.
 *
 * @param {string} resultPath       - path to result JSON file
 * @param {object} [opts]
 * @param {number}  [opts.concurrency=5]      - max parallel render tests
 * @param {boolean} [opts.skipScore=false]    - skip visual quality scoring
 * @param {number}  [opts.scoreThreshold=0.6] - visualScore below this is treated as a quality failure
 * @returns {object[]} array of failed/low-quality result objects
 */
async function run(
  resultPath,
  { concurrency = 5, skipScore = false, scoreThreshold = 0.6 } = {}
) {
  const data = JSON.parse(fs.readFileSync(resultPath, 'utf-8'));
  const allResults = data.results || [];
  const total = allResults.length;

  console.log(
    `\nRender testing ${total} result(s) (concurrency=${concurrency}${skipScore ? '' : ', visual-score=on'})...`
  );

  const testedResults = await testAllResults(allResults, {
    concurrency,
    skipScore,
    onProgress({ done, total: t, result }) {
      if (result.renderStatus !== 'success') {
        const tag = result.renderStatus.toUpperCase();
        const detail = result.renderError ? ` — ${result.renderError}` : '';
        console.log(`  [${done}/${t}] [${tag}] ${result.id}${detail}`);
      } else if (
        result.visualScore != null &&
        result.visualScore < scoreThreshold
      ) {
        console.log(
          `  [${done}/${t}] [LOW-SCORE] ${result.id}  visualScore=${result.visualScore.toFixed(2)}`
        );
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

  const scored = testedResults.filter((r) => r.visualScore != null);
  const avgScore = scored.length
    ? scored.reduce((s, r) => s + r.visualScore, 0) / scored.length
    : null;
  const lowQuality = testedResults.filter(
    (r) =>
      r.renderStatus === 'success' &&
      r.visualScore != null &&
      r.visualScore < scoreThreshold
  );

  console.log(
    `  Render: success=${statusCounts.success || 0}  blank=${statusCounts.blank || 0}  error=${statusCounts.error || 0}`
  );
  if (avgScore != null) {
    console.log(
      `  Visual: avgScore=${avgScore.toFixed(2)}  lowQuality=${lowQuality.length}/${statusCounts.success || 0}  threshold=${scoreThreshold}`
    );
  }

  // Return render failures + visually low-quality cases
  return testedResults.filter(
    (r) =>
      r.renderStatus === 'error' ||
      r.renderStatus === 'blank' ||
      (r.renderStatus === 'success' &&
        r.visualScore != null &&
        r.visualScore < scoreThreshold)
  );
}

module.exports = { run };
