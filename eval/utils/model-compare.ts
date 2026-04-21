/**
 * Model Comparison Module — compare evaluation results across different models/providers.
 */

import fs from 'fs';
import path from 'path';

interface EvalSummary {
  totalTests?: number;
  successCount?: number;
  avgSimilarity?: number;
  avgDuration?: number;
  issuesCount?: number;
  highSimilarityCount?: number;
}

interface CaseResult {
  id: string;
  evaluation?: { similarity?: number; hasIssues?: boolean };
  duration?: number;
}

interface EvalData {
  model?: string;
  provider?: string;
  timestamp?: string;
  summary?: EvalSummary;
  results?: CaseResult[];
}

interface ComparedValue {
  result1: number;
  result2: number;
  delta: number;
  percentChange: number;
}

interface PerCaseComparison {
  id: string;
  similarity: { result1: number; result2: number; delta: number };
  duration: { result1: number | undefined; result2: number | undefined };
  hasIssues: { result1: boolean | undefined; result2: boolean | undefined };
  winner: 'result1' | 'result2' | 'tie';
}

export function compareResults(file1: string, file2: string) {
  const result1: EvalData = JSON.parse(fs.readFileSync(file1, 'utf-8'));
  const result2: EvalData = JSON.parse(fs.readFileSync(file2, 'utf-8'));
  return compareResultObjects(result1, result2, { file1: path.basename(file1), file2: path.basename(file2) });
}

export function compareResultObjects(result1: EvalData, result2: EvalData, meta: { file1?: string; file2?: string } = {}) {
  const map1 = new Map((result1.results ?? []).map((r) => [r.id, r]));
  const map2 = new Map((result2.results ?? []).map((r) => [r.id, r]));
  const commonIds = [...map1.keys()].filter((id) => map2.has(id));

  let wins1 = 0, wins2 = 0, ties = 0;
  const deltas: number[] = [];
  const perCase: PerCaseComparison[] = [];

  for (const id of commonIds) {
    const r1 = map1.get(id)!;
    const r2 = map2.get(id)!;
    const sim1 = r1.evaluation?.similarity ?? 0;
    const sim2 = r2.evaluation?.similarity ?? 0;
    const delta = sim1 - sim2;
    deltas.push(delta);

    const winner: 'result1' | 'result2' | 'tie' = delta > 0.05 ? 'result1' : delta < -0.05 ? 'result2' : 'tie';
    if (winner === 'result1') wins1++;
    else if (winner === 'result2') wins2++;
    else ties++;

    perCase.push({ id, similarity: { result1: sim1, result2: sim2, delta }, duration: { result1: r1.duration, result2: r2.duration }, hasIssues: { result1: r1.evaluation?.hasIssues, result2: r2.evaluation?.hasIssues }, winner });
  }

  const avgDelta = deltas.reduce((a, b) => a + b, 0) / (deltas.length || 1);

  return {
    meta: {
      result1: { model: result1.model, provider: result1.provider, timestamp: result1.timestamp, file: meta.file1 },
      result2: { model: result2.model, provider: result2.provider, timestamp: result2.timestamp, file: meta.file2 }
    },
    summary: compareSummary(result1.summary, result2.summary),
    perCase,
    statistics: {
      commonCases: commonIds.length,
      uniqueToResult1: map1.size - commonIds.length,
      uniqueToResult2: map2.size - commonIds.length,
      wins: { result1: wins1, result2: wins2, ties },
      avgDelta,
      significantCases: perCase.filter((c) => Math.abs(c.similarity.delta) > 0.1)
    }
  };
}

function compareSummary(s1: EvalSummary = {}, s2: EvalSummary = {}) {
  const cv = (v1?: number, v2?: number): ComparedValue => {
    const val1 = v1 ?? 0, val2 = v2 ?? 0;
    return { result1: val1, result2: val2, delta: val1 - val2, percentChange: val2 !== 0 ? ((val1 - val2) / val2) * 100 : 0 };
  };
  return {
    totalTests: cv(s1.totalTests, s2.totalTests),
    successCount: cv(s1.successCount, s2.successCount),
    avgSimilarity: cv(s1.avgSimilarity, s2.avgSimilarity),
    avgDuration: cv(s1.avgDuration, s2.avgDuration),
    issuesCount: cv(s1.issuesCount, s2.issuesCount),
    highSimilarityCount: cv(s1.highSimilarityCount, s2.highSimilarityCount)
  };
}

export function compareMultiple(files: string[]) {
  if (files.length < 2) return { error: 'Need at least 2 files to compare' };

  const results = files.map((f) => ({ file: path.basename(f), data: JSON.parse(fs.readFileSync(f, 'utf-8')) as EvalData }));

  const pairwise = [];
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      pairwise.push({
        files: [results[i].file, results[j].file],
        comparison: compareResultObjects(results[i].data, results[j].data, { file1: results[i].file, file2: results[j].file })
      });
    }
  }

  const stats = results.map((r) => ({
    file: r.file,
    model: r.data.model,
    provider: r.data.provider,
    avgSimilarity: r.data.summary?.avgSimilarity ?? 0,
    successRate: (r.data.summary?.successCount ?? 0) / (r.data.summary?.totalTests || 1),
    issuesRate: (r.data.summary?.issuesCount ?? 0) / (r.data.summary?.totalTests || 1)
  }));

  return {
    files: files.map((f) => path.basename(f)),
    stats,
    ranking: [...stats].sort((a, b) => b.avgSimilarity - a.avgSimilarity),
    pairwise
  };
}

export function generateReport(comparison: ReturnType<typeof compareResultObjects>): string {
  const { meta, summary, statistics } = comparison;
  let report = `# 模型对比报告\n\n`;

  report += `## 对比模型\n\n| | 模型 | 提供商 |\n|---|---|---|\n`;
  report += `| 1 | ${meta.result1.model} | ${meta.result1.provider} |\n`;
  report += `| 2 | ${meta.result2.model} | ${meta.result2.provider} |\n\n`;

  report += `## 汇总对比\n\n| 指标 | ${meta.result1.model} | ${meta.result2.model} | 差值 |\n|---|---|---|---|\n`;
  report += `| 平均相似度 | ${((summary.avgSimilarity.result1) * 100).toFixed(1)}% | ${((summary.avgSimilarity.result2) * 100).toFixed(1)}% | ${((summary.avgSimilarity.delta) * 100).toFixed(1)}% |\n`;
  report += `| 成功数 | ${summary.successCount.result1}/${summary.totalTests.result1} | ${summary.successCount.result2}/${summary.totalTests.result2} | - |\n`;
  report += `| 问题数 | ${summary.issuesCount.result1} | ${summary.issuesCount.result2} | ${summary.issuesCount.delta} |\n`;
  report += `| 平均耗时 | ${summary.avgDuration.result1}ms | ${summary.avgDuration.result2}ms | ${summary.avgDuration.delta}ms |\n\n`;

  const n = statistics.commonCases || 1;
  report += `## 胜负统计\n\n| 结果 | 数量 | 占比 |\n|---|---|---|\n`;
  report += `| ${meta.result1.model} 胜 | ${statistics.wins.result1} | ${((statistics.wins.result1 / n) * 100).toFixed(1)}% |\n`;
  report += `| ${meta.result2.model} 胜 | ${statistics.wins.result2} | ${((statistics.wins.result2 / n) * 100).toFixed(1)}% |\n`;
  report += `| 平局 | ${statistics.wins.ties} | ${((statistics.wins.ties / n) * 100).toFixed(1)}% |\n\n`;

  if (statistics.significantCases.length > 0) {
    report += `## 显著差异用例（|差值| > 10%）\n\n| 用例 ID | ${meta.result1.model} | ${meta.result2.model} | 差值 |\n|---|---|---|---|\n`;
    for (const c of statistics.significantCases.slice(0, 20)) {
      report += `| ${c.id} | ${(c.similarity.result1 * 100).toFixed(1)}% | ${(c.similarity.result2 * 100).toFixed(1)}% | ${(c.similarity.delta * 100).toFixed(1)}% |\n`;
    }
  }

  return report;
}
