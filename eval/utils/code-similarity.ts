#!/usr/bin/env node
/**
 * 代码相似度计算与相似代码抽取
 * 支持多种算法：Token-based、AST-based、Fingerprint-based
 */

// ── Token 基础相似度 ───────────────────────────────────────────────────────────

function tokenize(code) {
  return code
    .toLowerCase()
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/[^\w]+/)
    .filter((t) => t.length > 1);
}

function calculateJaccardSimilarity(tokens1, tokens2) {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

function calculateDiceSimilarity(tokens1, tokens2) {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter(x => set2.has(x)));

  return (2 * intersection.size) / (set1.size + set2.size);
}

function calculateCosineSimilarity(tokens1, tokens2) {
  const freq1 = {};
  const freq2 = {};

  tokens1.forEach(t => freq1[t] = (freq1[t] || 0) + 1);
  tokens2.forEach(t => freq2[t] = (freq2[t] || 0) + 1);

  const allTokens = new Set([...tokens1, ...tokens2]);

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  allTokens.forEach(t => {
    const f1 = freq1[t] || 0;
    const f2 = freq2[t] || 0;
    dotProduct += f1 * f2;
    norm1 += f1 * f1;
    norm2 += f2 * f2;
  });

  if (norm1 === 0 || norm2 === 0) return 0;

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// ── 代码指纹相似度（SimHash 简化版）──────────────────────────────────────────────

function generateCodeFingerprint(code) {
  // 规范化代码
  const normalized = code
    .toLowerCase()
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/['"][^'"]*['"]/g, '""') // 字符串替换为占位符
    .replace(/\d+/g, '0') // 数字替换为占位符
    .trim();

  // 提取 N-gram
  const ngrams = [];
  const n = 4;
  for (let i = 0; i <= normalized.length - n; i++) {
    ngrams.push(normalized.slice(i, i + n));
  }

  // 简单的哈希
  const hashes = ngrams.map(gram => {
    let hash = 0;
    for (let i = 0; i < gram.length; i++) {
      hash = ((hash << 5) - hash) + gram.charCodeAt(i);
      hash = hash & hash;
    }
    return hash;
  });

  return {
    normalized,
    ngrams,
    hashSignature: hashes.slice(0, 20) // 取前20个特征
  };
}

function calculateFingerprintSimilarity(fp1, fp2) {
  const set2 = new Set(fp2.hashSignature);
  const intersection = new Set(fp1.hashSignature.filter(h => set2.has(h)));
  const union = new Set([...fp1.hashSignature, ...fp2.hashSignature]);

  if (union.size === 0) return 0;

  return intersection.size / union.size;
}

// ── 结构相似度（基于代码结构特征）──────────────────────────────────────────────────

function extractStructuralFeatures(code) {
  const features = {
    imports: [],
    functionCalls: [],
    objectKeys: [],
    stringLiterals: [],
    apiPatterns: []
  };

  // 提取 import
  const importRegex = /import\s+\{?([^}]+)\}?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    features.imports.push({
      names: match[1].split(',').map(s => s.trim()),
      source: match[2]
    });
  }

  // 提取函数调用
  const callRegex = /(\w+)\s*\(/g;
  while ((match = callRegex.exec(code)) !== null) {
    features.functionCalls.push(match[1]);
  }

  // 提取对象键（Spec 模式配置）
  const keyRegex = /(\w+)\s*:/g;
  while ((match = keyRegex.exec(code)) !== null) {
    features.objectKeys.push(match[1]);
  }

  // 提取字符串字面量（字段名等）
  const stringRegex = /['"](\w+)['"]:/g;
  while ((match = stringRegex.exec(code)) !== null) {
    features.stringLiterals.push(match[1]);
  }

  // 提取 AntV API 模式
  const apiPatterns = [
    { name: 'chart.options', pattern: /chart\.options\s*\(/ },
    { name: 'new Chart', pattern: /new\s+Chart\s*\(/ },
    { name: 'new Graph', pattern: /new\s+Graph\s*\(/ },
    { name: 'chart.render', pattern: /chart\.render\s*\(/ },
    { name: 'encode', pattern: /encode\s*:/ },
    { name: 'transform', pattern: /transform\s*:/ },
    { name: 'coordinate', pattern: /coordinate\s*:/ },
    { name: 'scale', pattern: /scale\s*:/ },
    { name: 'view.children', pattern: /children\s*:/ },
    { name: 'type.view', pattern: /type\s*:\s*['"]view['"]/ },
    { name: 'type.interval', pattern: /type\s*:\s*['"]interval['"]/ },
    { name: 'type.line', pattern: /type\s*:\s*['"]line['"]/ },
    { name: 'type.point', pattern: /type\s*:\s*['"]point['"]/ },
    { name: 'interaction', pattern: /interaction\s*:/ },
    { name: 'animate', pattern: /animate\s*:/ }
  ];

  apiPatterns.forEach(({ name, pattern }) => {
    if (pattern.test(code)) {
      features.apiPatterns.push(name);
    }
  });

  return features;
}

function calculateStructuralSimilarity(features1, features2) {
  const scores = [];

  // API 模式匹配
  const commonPatterns = features1.apiPatterns.filter(p =>
    features2.apiPatterns.includes(p)
  );
  const allPatterns = new Set([...features1.apiPatterns, ...features2.apiPatterns]);
  if (allPatterns.size > 0) {
    scores.push(commonPatterns.length / allPatterns.size);
  }

  // 对象键匹配
  const commonKeys = features1.objectKeys.filter(k =>
    features2.objectKeys.includes(k)
  );
  const allKeys = new Set([...features1.objectKeys, ...features2.objectKeys]);
  if (allKeys.size > 0) {
    scores.push(commonKeys.length / allKeys.size);
  }

  // 函数调用匹配
  const commonCalls = features1.functionCalls.filter(c =>
    features2.functionCalls.includes(c)
  );
  const allCalls = new Set([...features1.functionCalls, ...features2.functionCalls]);
  if (allCalls.size > 0) {
    scores.push(commonCalls.length / allCalls.size);
  }

  // 导入源匹配
  const sources1 = features1.imports.map(i => i.source);
  const sources2 = features2.imports.map(i => i.source);
  const commonSources = sources1.filter(s => sources2.includes(s));
  const allSources = new Set([...sources1, ...sources2]);
  if (allSources.size > 0) {
    scores.push(commonSources.length / allSources.size);
  }

  return scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;
}

// ── 综合相似度计算 ──────────────────────────────────────────────────────────────

function calculateSimilarity(code1, code2, options = {}) {
  const {
    algorithm = 'hybrid', // 'token', 'structural', 'fingerprint', 'hybrid'
    weights = {
      token: 0.3,
      structural: 0.4,
      fingerprint: 0.3
    }
  } = options;

  if (!code1 || !code2) return 0;

  // 预处理
  const normalized1 = code1.trim();
  const normalized2 = code2.trim();

  if (algorithm === 'token') {
    const tokens1 = tokenize(normalized1);
    const tokens2 = tokenize(normalized2);
    return calculateDiceSimilarity(tokens1, tokens2);
  }

  if (algorithm === 'structural') {
    const features1 = extractStructuralFeatures(normalized1);
    const features2 = extractStructuralFeatures(normalized2);
    return calculateStructuralSimilarity(features1, features2);
  }

  if (algorithm === 'fingerprint') {
    const fp1 = generateCodeFingerprint(normalized1);
    const fp2 = generateCodeFingerprint(normalized2);
    return calculateFingerprintSimilarity(fp1, fp2);
  }

  // Hybrid: 综合多种算法
  const tokens1 = tokenize(normalized1);
  const tokens2 = tokenize(normalized2);
  const tokenSim = calculateDiceSimilarity(tokens1, tokens2);

  const features1 = extractStructuralFeatures(normalized1);
  const features2 = extractStructuralFeatures(normalized2);
  const structuralSim = calculateStructuralSimilarity(features1, features2);

  const fp1 = generateCodeFingerprint(normalized1);
  const fp2 = generateCodeFingerprint(normalized2);
  const fingerprintSim = calculateFingerprintSimilarity(fp1, fp2);

  return (
    tokenSim * weights.token +
    structuralSim * weights.structural +
    fingerprintSim * weights.fingerprint
  );
}

// ── 相似代码抽取 ────────────────────────────────────────────────────────────────

function extractSimilarCodeSnippets(targetCode, candidateCodes, options = {}) {
  const {
    threshold = 0.5,
    maxResults = 5,
    algorithm = 'hybrid'
  } = options;

  const similarities = candidateCodes.map((candidate, index) => ({
    index,
    code: candidate,
    similarity: calculateSimilarity(targetCode, candidate, { algorithm })
  }));

  return similarities
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);
}

// ── 代码聚类（发现相似代码组）────────────────────────────────────────────────────

function clusterSimilarCodes(codes, options = {}) {
  const {
    threshold = 0.7,
    algorithm = 'hybrid'
  } = options;

  const clusters = [];
  const assigned = new Set();

  for (let i = 0; i < codes.length; i++) {
    if (assigned.has(i)) continue;

    const cluster = {
      representative: i,
      members: [i],
      similarities: []
    };

    for (let j = i + 1; j < codes.length; j++) {
      if (assigned.has(j)) continue;

      const sim = calculateSimilarity(codes[i], codes[j], { algorithm });
      if (sim >= threshold) {
        cluster.members.push(j);
        cluster.similarities.push({ index: j, similarity: sim });
        assigned.add(j);
      }
    }

    if (cluster.members.length > 1) {
      clusters.push(cluster);
    }
  }

  return clusters.sort((a, b) => b.members.length - a.members.length);
}

// ── 代码差异分析 ────────────────────────────────────────────────────────────────

function analyzeCodeDifferences(code1, code2) {
  const tokens1 = tokenize(code1);
  const tokens2 = tokenize(code2);

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  const onlyIn1 = [...set1].filter(t => !set2.has(t));
  const onlyIn2 = [...set2].filter(t => !set1.has(t));
  const common = [...set1].filter(t => set2.has(t));

  // 结构差异
  const features1 = extractStructuralFeatures(code1);
  const features2 = extractStructuralFeatures(code2);

  const apiOnlyIn1 = features1.apiPatterns.filter(p => !features2.apiPatterns.includes(p));
  const apiOnlyIn2 = features2.apiPatterns.filter(p => !features1.apiPatterns.includes(p));

  return {
    tokenDiff: {
      onlyInSource: onlyIn1.slice(0, 20),
      onlyInTarget: onlyIn2.slice(0, 20),
      common: common.length
    },
    structuralDiff: {
      apiOnlyInSource: apiOnlyIn1,
      apiOnlyInTarget: apiOnlyIn2
    },
    similarity: calculateSimilarity(code1, code2)
  };
}

// ── 导出 ───────────────────────────────────────────────────────────────────────

module.exports = {
  // 相似度计算
  calculateSimilarity,
  calculateJaccardSimilarity,
  calculateDiceSimilarity,
  calculateCosineSimilarity,

  // 特征提取
  tokenize,
  extractStructuralFeatures,
  generateCodeFingerprint,

  // 高级功能
  extractSimilarCodeSnippets,
  clusterSimilarCodes,
  analyzeCodeDifferences
};
