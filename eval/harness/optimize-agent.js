/**
 * Optimize Agent
 *
 * Responsibility: Use an LLM to rewrite skill docs based on observed error cases.
 * In dry-run mode, writes a log file instead of modifying skill files.
 *
 * Usage:
 *   const optimizeAgent = require('./harness/optimize-agent');
 *   await optimizeAgent.run(skillToErrors, {
 *     provider, model, rootDir, dryRun, logFile, iteration
 *   });
 */

const fs = require('fs');
const path = require('path');
const { callAI } = require('../lib/ai-sdk');

// ── Dry-run log writer ────────────────────────────────────────────────────────

/**
 * Append error details to the dry-run log file.
 *
 * @param {string} logFile        - path to the log file
 * @param {number} iteration      - current loop iteration number
 * @param {object[]} errorCases   - all failed cases this iteration
 * @param {Map<string,object[]>} skillToErrors - grouped skill errors
 * @param {string} rootDir        - project root (for relative path display)
 */
function writeErrorLog(logFile, iteration, errorCases, skillToErrors, rootDir) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });

  const lines = [
    `${'='.repeat(60)}`,
    `Iteration ${iteration}  |  ${new Date().toISOString()}`,
    `Failed cases: ${errorCases.length}`,
    `${'='.repeat(60)}`,
    ''
  ];

  for (const c of errorCases) {
    const renderInfo =
      c.renderStatus === 'blank'
        ? '白屏'
        : `渲染报错: ${c.renderError || '未知'}`;
    lines.push(`[${c.renderStatus.toUpperCase()}] ${c.id}  (${renderInfo})`);
    lines.push(`  Query: ${c.query}`);
    if (c.generatedCode) {
      lines.push(`  Generated Code:`);
      c.generatedCode.split('\n').forEach((l) => lines.push(`    ${l}`));
    }
    lines.push('');
  }

  if (skillToErrors.size > 0) {
    lines.push('Skills involved:');
    for (const [skillPath, cases] of skillToErrors) {
      lines.push(
        `  ${path.relative(rootDir, skillPath)}  (${cases.length} case(s))`
      );
    }
    lines.push('');
  }

  fs.appendFileSync(logFile, lines.join('\n') + '\n');
  console.log(`  Log written: ${logFile}`);
}

// ── Single skill optimizer ────────────────────────────────────────────────────

/**
 * Ask the LLM to rewrite a skill file based on observed error cases.
 *
 * @param {string} skillPath    - absolute path to the skill markdown file
 * @param {object[]} errorCases - error cases associated with this skill
 * @param {string} provider     - AI provider id
 * @param {string} model        - model id
 */
async function optimizeSkill(skillPath, errorCases, provider, model) {
  const skillContent = fs.readFileSync(skillPath, 'utf-8');
  const skillName = path.basename(skillPath, '.md');

  console.log(`\n  Optimizing: ${skillName} (${errorCases.length} error case(s))`);

  const errorContext = errorCases
    .map((c, i) => {
      const renderInfo =
        c.renderStatus === 'blank'
          ? '渲染白屏（图表容器为空或画布无内容）'
          : c.renderStatus === 'error'
          ? `渲染报错：${c.renderError || '未知错误'}`
          : c.error || 'unknown';

      return [
        `#### Case ${i + 1}: ${c.id}`,
        `Query: ${c.query}`,
        `Render Result: ${renderInfo}`,
        `Generated Code:\n\`\`\`javascript\n${c.generatedCode || '(none)'}\n\`\`\``,
        `Expected Code:\n\`\`\`javascript\n${c.expectedCode || '(none)'}\n\`\`\``
      ].join('\n');
    })
    .join('\n\n');

  const prompt = `你是 AntV 技术专家，负责维护 LLM 代码生成的技能文档（skill）。

以下是当前 skill 文件，用于指导 LLM 生成 AntV 代码：

<skill>
${skillContent}
</skill>

以下是使用该 skill 后 LLM 生成代码时出现的错误案例：

${errorContext}

请分析错误原因，优化该 skill 文档，使 LLM 在阅读后能避免上述错误。要求：
1. 保持 YAML Front Matter 不变（id、title、description、library、version、category、tags 等字段）
2. 重点修正或补充导致上述错误的文档描述
3. 确保最小可运行示例代码正确无误且可直接运行
4. 在「常见错误与修正」章节补充上述问题的示例和修正说明
5. 直接输出完整的优化后 skill 文档（以 --- 开头），不要输出任何解释文字`;

  const response = await callAI({
    provider,
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    maxTokens: 4000
  });

  if (!response?.content) {
    console.warn(`    LLM returned empty response, skipping.`);
    return;
  }

  let newContent = response.content.trim();
  const fmIdx = newContent.indexOf('---');
  if (fmIdx > 0) newContent = newContent.slice(fmIdx);

  if (!newContent.startsWith('---')) {
    console.warn(`    Response didn't start with YAML front matter, skipping.`);
    return;
  }

  fs.writeFileSync(skillPath, newContent);
  console.log(`    Saved: ${skillPath}`);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run the optimize agent over all skills that had errors.
 *
 * @param {Map<string,object[]>} skillToErrors - map from skill path to error cases
 * @param {object} opts
 * @param {string} opts.provider     - AI provider id
 * @param {string} opts.model        - model id
 * @param {string} opts.rootDir      - project root (for log path display)
 * @param {boolean} [opts.dryRun]    - if true, write log only, do not modify files
 * @param {string} [opts.logFile]    - path to dry-run log file
 * @param {number} [opts.iteration]  - current iteration number (for log header)
 * @param {object[]} [opts.allErrorCases] - all error cases (for dry-run log)
 */
async function run(
  skillToErrors,
  { provider, model, rootDir, dryRun = false, logFile, iteration = 0, allErrorCases = [] }
) {
  if (dryRun) {
    writeErrorLog(logFile, iteration, allErrorCases, skillToErrors, rootDir);
    console.log('\n[dry-run] Skipping skill optimization and index rebuild.');
    return;
  }

  console.log(`\nOptimizing ${skillToErrors.size} skill(s)...`);
  for (const [skillPath, cases] of skillToErrors) {
    await optimizeSkill(skillPath, cases, provider, model);
  }
}

module.exports = { run, writeErrorLog };
