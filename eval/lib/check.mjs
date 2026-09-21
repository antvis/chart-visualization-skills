/**
 * Rule checks — pure functions.
 *
 * Hard rules produce `issues` (counted as failures); soft style nits produce
 * `warnings`. X6 is exempt from the render()/position() checks.
 */

export function checkCode(code, options = {}) {
  const issues = [];
  const warnings = [];
  const isX6 = options.library === 'x6' || code.includes('@antv/x6');

  if (!code.includes('import') && !code.includes('require')) {
    issues.push('缺少 import/require 语句');
  }
  if (!code.includes('new Chart') && !code.includes('new Graph')) {
    issues.push('缺少 Chart/Graph 实例化');
  }
  // X6 renders on Graph instantiation (fromJSON/addNode), no explicit render()
  if (!isX6 && !code.includes('.render')) {
    issues.push('缺少 render() 调用');
  }
  if (/chart\.(interval|line|point|area|cell)\s*\(/.test(code)) {
    issues.push('使用了 V4 链式 API（chart.interval() 等）');
  }
  if (code.includes('createView')) {
    issues.push('使用了 V4 createView');
  }
  // .position() is a legitimate node method in X6 — only check for G2
  if (!isX6 && /\.position\s*\(/.test(code)) {
    issues.push('使用了 V4 .position() 语法');
  }

  if (/coordinate\s*:\s*\{\s*type\s*:\s*['"]transpose['"]/.test(code)) {
    warnings.push('coordinate transpose 应使用 transform 数组而非 type');
  }
  if (/transform\s*:\s*\{\s*type\s*:/.test(code)) {
    warnings.push('transform 应为数组 [...] 而非对象 {...}');
  }
  if (/(?<![a-zA-Z])label\s*:\s*\{/.test(code) && !code.includes('labels:')) {
    warnings.push('应使用 labels（复数）而非 label（单数）');
  }

  return { hasIssues: issues.length > 0, issues, warnings };
}
