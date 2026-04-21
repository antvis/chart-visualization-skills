/**
 * 评测公共工具函数
 */

import { calculateSimilarity, extractStructuralFeatures, StructuralFeatures } from './code-similarity.js';

// ── 库检测 ──────────────────────────────────────────────────────────────────────

function detectLibrary(codeString: string): string {
  if (codeString.includes('@antv/g6')) return 'g6';
  return 'g2';
}

// ── 数据提取 ───────────────────────────────────────────────────────────────────

function extractDataFromCode(codeString: string): string[] {
  const arrayMatch = codeString.match(/(?:const|let|var)\s+\w*[Dd]ata\w*\s*=\s*(\[[\s\S]*?\]);/);
  if (arrayMatch) return [arrayMatch[1].slice(0, 500)];
  return [];
}

// ── 查询构建 ───────────────────────────────────────────────────────────────────

export interface TestCase {
  id?: string;
  description: string;
  codeString: string;
}

export interface QueryResult {
  query: string;
  library: string;
}

export function buildQuery(testCase: TestCase, options: { includeData?: boolean } = {}): QueryResult {
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

export function extractCodeFromResponse(response: string): string {
  const codeBlockMatch = response.match(/```(?:javascript|js|typescript|ts)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const importMatch = response.match(/import[\s\S]*/);
  if (importMatch) return importMatch[0].trim();
  return response;
}

// ── 代码评估 ───────────────────────────────────────────────────────────────────

export interface EvaluationResult {
  hasIssues: boolean;
  issues: string[];
  warnings: string[];
  codeLength: number;
  expectedLength: number;
  similarity: number;
  extractedCode: string;
  structuralFeatures: StructuralFeatures;
}

export function evaluateCode(
  generatedCode: string,
  expectedCode: string,
  options: { similarityAlgorithm?: string } = {}
): EvaluationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  const extractedCode = extractCodeFromResponse(generatedCode);

  if (!extractedCode.includes('import') && !extractedCode.includes('require')) {
    issues.push('缺少 import/require 语句');
  }
  if (!extractedCode.includes('new Chart') && !extractedCode.includes('new Graph')) {
    issues.push('缺少 Chart/Graph 实例化');
  }
  if (!extractedCode.includes('.render')) {
    issues.push('缺少 render() 调用');
  }
  if (/chart\.(interval|line|point|area|cell)\s*\(/.test(extractedCode)) {
    issues.push('使用了 V4 链式 API（chart.interval() 等）');
  }
  if (extractedCode.includes('createView')) issues.push('使用了 V4 createView');
  if (/\.position\s*\(/.test(extractedCode)) issues.push('使用了 V4 .position() 语法');
  if (/coordinate\s*:\s*\{\s*type\s*:\s*['"]transpose['"]/.test(extractedCode)) {
    warnings.push('coordinate transpose 应使用 transform 数组而非 type');
  }
  if (/transform\s*:\s*\{\s*type\s*:/.test(extractedCode)) {
    warnings.push('transform 应为数组 [...] 而非对象 {...}');
  }
  if (/(?<![a-zA-Z])label\s*:\s*\{/.test(extractedCode) && !extractedCode.includes('labels:')) {
    warnings.push('应使用 labels（复数）而非 label（单数）');
  }

  const similarity = calculateSimilarity(extractedCode, expectedCode, {
    algorithm: (options.similarityAlgorithm as 'hybrid') ?? 'hybrid'
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
