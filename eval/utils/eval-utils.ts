#!/usr/bin/env node
/**
 * 评测公共工具函数
 * 被 eval-manager.js 共享
 */

const {
  calculateSimilarity,
  clusterSimilarCodes,
  extractStructuralFeatures
} = require('./code-similarity');

// ── 库检测 ──────────────────────────────────────────────────────────────────────

function detectLibrary(codeString) {
  if (codeString.includes('@antv/g6')) return 'g6';
  return 'g2';
}

// ── 数据提取 ───────────────────────────────────────────────────────────────────

function extractDataFromCode(codeString) {
  const arrayMatch = codeString.match(
    /(?:const|let|var)\s+\w*[Dd]ata\w*\s*=\s*(\[[\s\S]*?\]);/
  );
  if (arrayMatch) {
    return [arrayMatch[1].slice(0, 500)];
  }
  return [];
}

// ── 查询构建 ───────────────────────────────────────────────────────────────────

function buildQuery(testCase, options = {}) {
  const { description, codeString } = testCase;
  const library = detectLibrary(codeString);
  const { includeData = true } = options;

  let query = description;
  if (includeData) {
    const refData = extractDataFromCode(codeString);
    if (refData.length > 0 && !description.includes('参考数据')) {
      query += `\n\n参考数据：\n${refData[0]}`;
    }
  }

  return { query, library };
}

// ── 代码提取 ───────────────────────────────────────────────────────────────────

function extractCodeFromResponse(response) {
  const codeBlockMatch = response.match(
    /```(?:javascript|js|typescript|ts)?\s*([\s\S]*?)```/
  );
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  const importMatch = response.match(/import[\s\S]*/);
  if (importMatch) {
    return importMatch[0].trim();
  }
  return response;
}

// ── 代码评估 ───────────────────────────────────────────────────────────────────

function evaluateCode(generatedCode, expectedCode, options = {}) {
  const issues = [];
  const warnings = [];
  const extractedCode = extractCodeFromResponse(generatedCode);

  // 基础结构检查
  if (!extractedCode.includes('import') && !extractedCode.includes('require')) {
    issues.push('缺少 import/require 语句');
  }
  if (
    !extractedCode.includes('new Chart') &&
    !extractedCode.includes('new Graph')
  ) {
    issues.push('缺少 Chart/Graph 实例化');
  }
  if (!extractedCode.includes('.render')) {
    issues.push('缺少 render() 调用');
  }

  // V4 废弃 API 检测
  if (/chart\.(interval|line|point|area|cell)\s*\(/.test(extractedCode)) {
    issues.push('使用了 V4 链式 API（chart.interval() 等）');
  }
  if (extractedCode.includes('createView')) {
    issues.push('使用了 V4 createView');
  }
  if (/\.position\s*\(/.test(extractedCode)) {
    issues.push('使用了 V4 .position() 语法');
  }

  // coordinate 语法检查
  if (
    /coordinate\s*:\s*\{\s*type\s*:\s*['"]transpose['"]/.test(extractedCode)
  ) {
    warnings.push('coordinate transpose 应使用 transform 数组而非 type');
  }
  // transform 格式检查
  if (/transform\s*:\s*\{\s*type\s*:/.test(extractedCode)) {
    warnings.push('transform 应为数组 [...] 而非对象 {...}');
  }
  // label 单数检查
  if (
    /(?<![a-zA-Z])label\s*:\s*\{/.test(extractedCode) &&
    !extractedCode.includes('labels:')
  ) {
    warnings.push('应使用 labels（复数）而非 label（单数）');
  }

  const similarityAlgorithm = options.similarityAlgorithm || 'hybrid';
  const similarity = calculateSimilarity(extractedCode, expectedCode, {
    algorithm: similarityAlgorithm
  });
  const structuralFeatures = extractStructuralFeatures(extractedCode);

  return {
    hasIssues: issues.length > 0,
    issues,
    warnings,
    codeLength: extractedCode.length,
    expectedLength: expectedCode.length,
    similarity,
    extractedCode,
    structuralFeatures
  };
}

// ── 相似代码分析 ───────────────────────────────────────────────────────────────

function analyzeSimilarCodes(results, options = {}) {
  const { threshold = 0.6, algorithm = 'hybrid' } = options;

  const successfulCodes = results
    .filter((r) => !r.error && r.evaluation?.extractedCode)
    .map((r) => ({
      id: r.id,
      code: r.evaluation.extractedCode,
      similarity: r.evaluation.similarity
    }));

  if (successfulCodes.length < 2) return { clusters: [], similarPairs: [] };

  const codes = successfulCodes.map((c) => c.code);
  const clusters = clusterSimilarCodes(codes, { threshold, algorithm });

  const mappedClusters = clusters.map((cluster) => ({
    size: cluster.members.length,
    members: cluster.members.map((idx) => successfulCodes[idx].id),
    similarities: cluster.similarities
  }));

  const similarPairs = [];
  for (let i = 0; i < successfulCodes.length; i++) {
    for (let j = i + 1; j < successfulCodes.length; j++) {
      const sim = calculateSimilarity(
        successfulCodes[i].code,
        successfulCodes[j].code,
        { algorithm }
      );
      if (sim >= threshold) {
        similarPairs.push({
          id1: successfulCodes[i].id,
          id2: successfulCodes[j].id,
          similarity: sim
        });
      }
    }
  }

  return {
    clusters: mappedClusters,
    similarPairs: similarPairs.sort((a, b) => b.similarity - a.similarity)
  };
}

// ── CLI 参数解析 ───────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  return {
    sample: args.find((a) => a.startsWith('--sample='))?.split('=')[1],
    dataset: args.find((a) => a.startsWith('--dataset='))?.split('=')[1],
    output: args.find((a) => a.startsWith('--output='))?.split('=')[1],
    model: args.find((a) => a.startsWith('--model='))?.split('=')[1],
    simAlg: args.find((a) => a.startsWith('--sim-alg='))?.split('=')[1],
    verbose: args.includes('--verbose'),
    full: args.includes('--full'),
    analyzeSimilarity: args.includes('--analyze-similarity')
  };
}

// ── 统计打印 ───────────────────────────────────────────────────────────────────

function printSummary(label, results, totalSimilarity) {
  const successCount = results.filter((r) => !r.error).length;
  const avgDuration =
    results.filter((r) => r.duration).reduce((sum, r) => sum + r.duration, 0) /
    (successCount || 1);
  const avgSimilarity = totalSimilarity / (successCount || 1);
  const issuesCount = results.filter((r) => r.evaluation?.hasIssues).length;
  const highSimilarityCount = results.filter(
    (r) => r.evaluation?.similarity >= 0.5
  ).length;

  console.log(`\n${'='.repeat(60)}`);
  if (label) console.log(`📈 评估结果 [${label}]`);
  else console.log('📈 评估结果');
  console.log('='.repeat(60));
  console.log(`✅ 成功用例: ${successCount}/${results.length}`);
  console.log(`⏱️  平均响应时间: ${avgDuration.toFixed(0)}ms`);
  console.log(`📊 平均代码相似度: ${(avgSimilarity * 100).toFixed(1)}%`);
  console.log(`🎯 高相似度用例 (≥50%): ${highSimilarityCount}/${successCount}`);
  console.log(`⚠️  存在问题的用例: ${issuesCount}`);
}

module.exports = {
  detectLibrary,
  extractDataFromCode,
  buildQuery,
  extractCodeFromResponse,
  evaluateCode,
  analyzeSimilarCodes,
  parseArgs,
  printSummary
};
