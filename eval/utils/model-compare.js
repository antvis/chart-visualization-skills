/**
 * Model Comparison Module
 *
 * Compare evaluation results across different models/providers.
 */

const fs = require('fs');
const path = require('path');

/**
 * Compare two result files
 * @param {string} file1 - Path to first result file
 * @param {string} file2 - Path to second result file
 * @returns {Object} Comparison results
 */
function compareResults(file1, file2) {
  const result1 = JSON.parse(fs.readFileSync(file1, 'utf-8'));
  const result2 = JSON.parse(fs.readFileSync(file2, 'utf-8'));

  return compareResultObjects(result1, result2, {
    file1: path.basename(file1),
    file2: path.basename(file2)
  });
}

/**
 * Compare two result objects
 * @param {Object} result1 - First result object
 * @param {Object} result2 - Second result object
 * @param {Object} meta - Metadata (file names, etc.)
 * @returns {Object} Comparison results
 */
function compareResultObjects(result1, result2, meta = {}) {
  const comparison = {
    meta: {
      result1: {
        model: result1.model,
        provider: result1.provider,
        timestamp: result1.timestamp,
        file: meta.file1
      },
      result2: {
        model: result2.model,
        provider: result2.provider,
        timestamp: result2.timestamp,
        file: meta.file2
      }
    },
    summary: compareSummary(result1.summary, result2.summary),
    perCase: [],
    statistics: {}
  };

  // Build ID -> result maps
  const map1 = new Map((result1.results || []).map((r) => [r.id, r]));
  const map2 = new Map((result2.results || []).map((r) => [r.id, r]));

  // Find common IDs
  const commonIds = [...map1.keys()].filter((id) => map2.has(id));

  // Compare per-case
  let wins1 = 0,
    wins2 = 0,
    ties = 0;
  const deltas = [];

  for (const id of commonIds) {
    const r1 = map1.get(id);
    const r2 = map2.get(id);

    const sim1 = r1.evaluation?.similarity || 0;
    const sim2 = r2.evaluation?.similarity || 0;
    const delta = sim1 - sim2;

    deltas.push(delta);

    const winner = delta > 0.05 ? 'result1' : delta < -0.05 ? 'result2' : 'tie';
    if (winner === 'result1') wins1++;
    else if (winner === 'result2') wins2++;
    else ties++;

    comparison.perCase.push({
      id,
      similarity: {
        result1: sim1,
        result2: sim2,
        delta
      },
      duration: {
        result1: r1.duration,
        result2: r2.duration
      },
      hasIssues: {
        result1: r1.evaluation?.hasIssues,
        result2: r2.evaluation?.hasIssues
      },
      winner
    });
  }

  // Compute statistics
  comparison.statistics = {
    commonCases: commonIds.length,
    uniqueToResult1: map1.size - commonIds.length,
    uniqueToResult2: map2.size - commonIds.length,
    wins: { result1: wins1, result2: wins2, ties },
    avgDelta: deltas.reduce((a, b) => a + b, 0) / (deltas.length || 1),
    significantCases: comparison.perCase.filter(
      (c) => Math.abs(c.similarity.delta) > 0.1
    )
  };

  return comparison;
}

/**
 * Compare summary statistics
 */
function compareSummary(summary1, summary2) {
  return {
    totalTests: compareValue(summary1?.totalTests, summary2?.totalTests),
    successCount: compareValue(summary1?.successCount, summary2?.successCount),
    avgSimilarity: compareValue(
      summary1?.avgSimilarity,
      summary2?.avgSimilarity
    ),
    avgDuration: compareValue(summary1?.avgDuration, summary2?.avgDuration),
    issuesCount: compareValue(summary1?.issuesCount, summary2?.issuesCount),
    highSimilarityCount: compareValue(
      summary1?.highSimilarityCount,
      summary2?.highSimilarityCount
    )
  };
}

/**
 * Compare two values
 */
function compareValue(v1, v2) {
  const val1 = v1 || 0;
  const val2 = v2 || 0;
  return {
    result1: val1,
    result2: val2,
    delta: val1 - val2,
    percentChange: val2 !== 0 ? ((val1 - val2) / val2) * 100 : 0
  };
}

/**
 * Compare multiple result files
 * @param {Array<string>} files - Array of file paths
 * @returns {Object} Multi-comparison results
 */
function compareMultiple(files) {
  if (files.length < 2) {
    return { error: 'Need at least 2 files to compare' };
  }

  const results = files.map((f) => ({
    file: path.basename(f),
    data: JSON.parse(fs.readFileSync(f, 'utf-8'))
  }));

  // Pairwise comparisons
  const pairwise = [];
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      pairwise.push({
        files: [results[i].file, results[j].file],
        comparison: compareResultObjects(results[i].data, results[j].data, {
          file1: results[i].file,
          file2: results[j].file
        })
      });
    }
  }

  // Aggregate stats
  const stats = results.map((r) => ({
    file: r.file,
    model: r.data.model,
    provider: r.data.provider,
    avgSimilarity: r.data.summary?.avgSimilarity || 0,
    successRate:
      (r.data.summary?.successCount || 0) / (r.data.summary?.totalTests || 1),
    issuesRate:
      (r.data.summary?.issuesCount || 0) / (r.data.summary?.totalTests || 1)
  }));

  // Rank by average similarity
  const ranking = [...stats].sort((a, b) => b.avgSimilarity - a.avgSimilarity);

  return {
    files: files.map((f) => path.basename(f)),
    stats,
    ranking,
    pairwise
  };
}

/**
 * Generate comparison report (markdown)
 * @param {Object} comparison - Comparison results
 * @returns {string} Markdown report
 */
function generateReport(comparison) {
  const { meta, summary, statistics } = comparison;

  let report = `# Model Comparison Report\n\n`;

  // Models compared
  report += `## Models Compared\n\n`;
  report += `| | Model | Provider |\n`;
  report += `|---|---|---|\n`;
  report += `| 1 | ${meta.result1.model} | ${meta.result1.provider} |\n`;
  report += `| 2 | ${meta.result2.model} | ${meta.result2.provider} |\n\n`;

  // Summary comparison
  report += `## Summary Comparison\n\n`;
  report += `| Metric | ${meta.result1.model} | ${meta.result2.model} | Delta |\n`;
  report += `|---|---|---|---|\n`;
  report += `| Avg Similarity | ${(summary.avgSimilarity.result1 * 100).toFixed(1)}% | ${(summary.avgSimilarity.result2 * 100).toFixed(1)}% | ${(summary.avgSimilarity.delta * 100).toFixed(1)}% |\n`;
  report += `| Success Rate | ${summary.successCount.result1}/${summary.totalTests.result1} | ${summary.successCount.result2}/${summary.totalTests.result2} | - |\n`;
  report += `| Issues Count | ${summary.issuesCount.result1} | ${summary.issuesCount.result2} | ${summary.issuesCount.delta} |\n`;
  report += `| Avg Duration | ${summary.avgDuration.result1}ms | ${summary.avgDuration.result2}ms | ${summary.avgDuration.delta}ms |\n\n`;

  // Win/Loss/Tie
  report += `## Head-to-Head Results\n\n`;
  report += `| Outcome | Count | Percentage |\n`;
  report += `|---|---|---|\n`;
  report += `| ${meta.result1.model} wins | ${statistics.wins.result1} | ${((statistics.wins.result1 / statistics.commonCases) * 100).toFixed(1)}% |\n`;
  report += `| ${meta.result2.model} wins | ${statistics.wins.result2} | ${((statistics.wins.result2 / statistics.commonCases) * 100).toFixed(1)}% |\n`;
  report += `| Tie | ${statistics.wins.ties} | ${((statistics.wins.ties / statistics.commonCases) * 100).toFixed(1)}% |\n\n`;

  // Significant cases
  if (statistics.significantCases.length > 0) {
    report += `## Significant Differences (|delta| > 10%)\n\n`;
    report += `| Case ID | ${meta.result1.model} | ${meta.result2.model} | Delta |\n`;
    report += `|---|---|---|---|\n`;
    for (const c of statistics.significantCases.slice(0, 20)) {
      report += `| ${c.id} | ${(c.similarity.result1 * 100).toFixed(1)}% | ${(c.similarity.result2 * 100).toFixed(1)}% | ${(c.similarity.delta * 100).toFixed(1)}% |\n`;
    }
  }

  return report;
}

module.exports = {
  compareResults,
  compareResultObjects,
  compareMultiple,
  generateReport
};
