/**
 * Metrics Module
 *
 * Enhanced evaluation metrics for code generation assessment.
 */

const {
  calculateSimilarity,
  extractStructuralFeatures
} = require('./code-similarity');

/**
 * Compute comprehensive metrics for a generated code vs expected code
 * @param {string} generatedCode - The generated code
 * @param {string} expectedCode - The expected/reference code
 * @param {Object} options - Options
 * @returns {Object} Metrics object
 */
function computeMetrics(generatedCode, expectedCode, options = {}) {
  const { algorithm = 'hybrid' } = options;

  // Code similarity
  const similarity = calculateSimilarity(generatedCode, expectedCode, {
    algorithm
  });

  // Structural features
  const generatedFeatures = extractStructuralFeatures(generatedCode);
  const expectedFeatures = extractStructuralFeatures(expectedCode);

  // Feature match rate
  const featureMatch = computeFeatureMatch(generatedFeatures, expectedFeatures);

  // API usage patterns
  const apiUsage = analyzeApiUsage(generatedCode);

  // Structural correctness
  const structuralCorrectness = computeStructuralCorrectness(generatedCode);

  // Performance estimate
  const performanceEstimate = estimatePerformance(generatedCode);

  return {
    similarity,
    featureMatch,
    apiUsage,
    structuralCorrectness,
    performanceEstimate,
    features: generatedFeatures
  };
}

/**
 * Compute feature match rate between generated and expected features
 */
function computeFeatureMatch(generated, expected) {
  const allKeys = new Set([
    ...Object.keys(generated),
    ...Object.keys(expected)
  ]);
  const matches = {};
  let totalMatches = 0;

  for (const key of allKeys) {
    const genVal = generated[key];
    const expVal = expected[key];

    if (Array.isArray(genVal) && Array.isArray(expVal)) {
      const intersection = genVal.filter((v) => expVal.includes(v));
      const union = [...new Set([...genVal, ...expVal])];
      matches[key] = intersection.length / (union.length || 1);
    } else if (typeof genVal === 'number' && typeof expVal === 'number') {
      matches[key] =
        1 - Math.abs(genVal - expVal) / Math.max(genVal, expVal, 1);
    } else {
      matches[key] = genVal === expVal ? 1 : 0;
    }

    totalMatches += matches[key];
  }

  return {
    scores: matches,
    average: totalMatches / (allKeys.size || 1)
  };
}

/**
 * Analyze API usage patterns in generated code
 */
function analyzeApiUsage(code) {
  const patterns = {
    // G2 mark types
    marks: [],
    // Transform types
    transforms: [],
    // Coordinate types
    coordinates: [],
    // Scale types
    scales: [],
    // Component types
    components: [],
    // Deprecated patterns
    deprecated: []
  };

  // G2 Mark types (V5 spec)
  const markPattern =
    /\b(line|interval|area|point|cell|vector|link|polygon|image|text|box|shape|density|heatmap|contour|treemap|sunburst|pack|sankey|venn|chord|gauge|k\w*|pie|radar|funnel|waterfall)\s*\(/g;
  let match;
  while ((match = markPattern.exec(code)) !== null) {
    patterns.marks.push(match[1]);
  }

  // Transform types
  const transformPattern =
    /type\s*:\s*['"](stackY|dodgeX|jitterX|jitterY|symmetryY|diffY|normalizeY|stackX|dodgeY|sortX|sortY|binX|binY|bin|group|groupX|groupY|groupColor|aggregate|flexX|flexY|filter|map|pick|rename|sortBy|flat|kde|custom)['"]/g;
  while ((match = transformPattern.exec(code)) !== null) {
    patterns.transforms.push(match[1]);
  }

  // Coordinate types
  const coordPattern =
    /type\s*:\s*['"](cartesian|polar|helix|transpose|fisheye|parallel|radial|theta)['"]/g;
  while ((match = coordPattern.exec(code)) !== null) {
    patterns.coordinates.push(match[1]);
  }

  // Scale types
  const scalePattern =
    /type\s*:\s*['"](linear|log|pow|sqrt|time|band|point|identity|quantize|quantile|threshold|ordinal|category|constant)['"]/g;
  while ((match = scalePattern.exec(code)) !== null) {
    patterns.scales.push(match[1]);
  }

  // Components
  const componentPattern =
    /\b(axis|legend|tooltip|title|annotation|slider|scrollbar)\s*:/g;
  while ((match = componentPattern.exec(code)) !== null) {
    patterns.components.push(match[1]);
  }

  // Deprecated patterns (V4 API)
  const deprecatedPatterns = [
    {
      pattern: /chart\.(interval|line|point|area|cell)\s*\(/g,
      name: 'chart.mark()'
    },
    { pattern: /\.position\s*\(/g, name: '.position()' },
    { pattern: /createView\s*\(/g, name: 'createView()' },
    { pattern: /chart\.bindBindell\s*\(/g, name: 'chart.bindBindell()' }
  ];

  for (const { pattern, name } of deprecatedPatterns) {
    while ((match = pattern.exec(code)) !== null) {
      patterns.deprecated.push(name);
    }
  }

  return patterns;
}

/**
 * Compute structural correctness score
 */
function computeStructuralCorrectness(code) {
  const checks = {
    hasImport: false,
    hasChartInstance: false,
    hasRender: false,
    hasData: false,
    hasMark: false,
    issues: []
  };

  // Check for imports
  checks.hasImport =
    /import\s+.*from\s+['"]@antv\/(g2|g6)['"]/.test(code) ||
    /require\s*\(['"]@antv\/(g2|g6)['"]\)/.test(code);

  // Check for Chart/Graph instantiation
  checks.hasChartInstance = /new\s+(Chart|Graph)\s*\(/.test(code);

  // Check for render call
  checks.hasRender = /\.render\s*\(\s*\)/.test(code);

  // Check for data
  checks.hasData = /data\s*:/.test(code) || /\.data\s*\(/.test(code);

  // Check for mark (G2) or element (G6)
  checks.hasMark =
    /\.mark\w+\s*\(/.test(code) ||
    /\.interval|\.line|\.area|\.point|\.cell/.test(code) ||
    /node|edge/.test(code);

  // Collect issues
  if (!checks.hasImport) checks.issues.push('Missing import statement');
  if (!checks.hasChartInstance)
    checks.issues.push('Missing Chart/Graph instantiation');
  if (!checks.hasRender) checks.issues.push('Missing .render() call');

  // Compute score
  const scoreWeights = {
    hasImport: 0.2,
    hasChartInstance: 0.3,
    hasRender: 0.3,
    hasData: 0.1,
    hasMark: 0.1
  };

  let score = 0;
  for (const [key, weight] of Object.entries(scoreWeights)) {
    if (checks[key]) score += weight;
  }

  return {
    score,
    checks,
    isValid: checks.issues.length === 0
  };
}

/**
 * Estimate performance characteristics
 */
function estimatePerformance(code) {
  return {
    codeLength: code.length,
    lineCount: code.split('\n').length,
    estimatedTokens: Math.ceil(code.length / 4), // Rough token estimate
    complexity: estimateComplexity(code)
  };
}

/**
 * Estimate code complexity
 */
function estimateComplexity(code) {
  let complexity = 1;

  // Count control structures
  const controlPatterns = [
    /\bif\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bswitch\b/g,
    /\bcatch\b/g
  ];
  for (const pattern of controlPatterns) {
    const matches = code.match(pattern);
    if (matches) complexity += matches.length;
  }

  // Count function definitions
  const funcMatches = code.match(/function\s+\w+|=>\s*{|=>\s*\(/g);
  if (funcMatches) complexity += funcMatches.length;

  // Classify
  let level = 'simple';
  if (complexity > 15) level = 'complex';
  else if (complexity > 8) level = 'moderate';

  return { score: complexity, level };
}

/**
 * Aggregate metrics across multiple results
 * @param {Array} results - Array of evaluation results
 * @returns {Object} Aggregated metrics
 */
function aggregateMetrics(results) {
  const validResults = results.filter((r) => !r.error && r.evaluation);

  if (validResults.length === 0) {
    return { error: 'No valid results to aggregate' };
  }

  const similarities = validResults.map((r) => r.evaluation.similarity);
  const durations = validResults.map((r) => r.duration);

  return {
    count: validResults.length,
    similarity: {
      avg: similarities.reduce((a, b) => a + b, 0) / similarities.length,
      min: Math.min(...similarities),
      max: Math.max(...similarities),
      median: median(similarities)
    },
    duration: {
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations)
    },
    issuesCount: results.filter((r) => r.evaluation?.hasIssues).length,
    errorCount: results.filter((r) => r.error).length
  };
}

/**
 * Compute median of an array
 */
function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

module.exports = {
  computeMetrics,
  computeFeatureMatch,
  analyzeApiUsage,
  computeStructuralCorrectness,
  estimatePerformance,
  aggregateMetrics
};
