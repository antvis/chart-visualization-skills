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
const { AgentLoop } = require('../utils/ai-sdk');
const { getLibraryConfig } = require('./config');

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

// ── Filesystem tools for agent loop ──────────────────────────────────────────

/**
 * Build tool definitions and handlers scoped to the library's ref paths.
 * The model can call list_directory / read_file freely within srcDir and docsDir.
 *
 * @param {{ srcDir?: string, docsDir?: string }} refs
 * @returns {{ tools: object[], toolHandlers: object }}
 */
function buildRefTools(refs) {
  const allowedRoots = [refs.srcDir, refs.docsDir].filter(Boolean);

  function assertAllowed(filePath) {
    const resolved = path.resolve(filePath);
    if (!allowedRoots.some((r) => resolved.startsWith(path.resolve(r)))) {
      throw new Error(`Access denied: ${filePath} is outside allowed ref paths.`);
    }
  }

  const tools = [
    {
      function: {
        name: 'list_directory',
        description:
          '列出指定目录下的文件和子目录，用于浏览文档或源码结构以确定要读取的文件。',
        parameters: {
          type: 'object',
          properties: {
            dir_path: {
              type: 'string',
              description: '要列出的目录绝对路径'
            }
          },
          required: ['dir_path']
        }
      }
    },
    {
      function: {
        name: 'read_file',
        description:
          '读取指定文件的内容，用于查阅官方文档或源码以获取权威 API 信息。',
        parameters: {
          type: 'object',
          properties: {
            file_path: {
              type: 'string',
              description: '要读取的文件绝对路径'
            }
          },
          required: ['file_path']
        }
      }
    }
  ];

  const toolHandlers = {
    list_directory({ dir_path }) {
      try {
        assertAllowed(dir_path);
        if (!fs.existsSync(dir_path)) return { error: `Path not found: ${dir_path}` };
        const entries = fs.readdirSync(dir_path, { withFileTypes: true }).map((e) => ({
          name: e.name,
          type: e.isDirectory() ? 'directory' : 'file'
        }));
        return { dir_path, entries };
      } catch (e) {
        return { error: e.message };
      }
    },
    read_file({ file_path }) {
      try {
        assertAllowed(file_path);
        if (!fs.existsSync(file_path)) return { error: `File not found: ${file_path}` };
        const content = fs.readFileSync(file_path, 'utf-8');
        // Cap single file reads to 12 KB to avoid context explosion
        return { file_path, content: content.slice(0, 12000) };
      } catch (e) {
        return { error: e.message };
      }
    }
  };

  return { tools, toolHandlers };
}

/**
 * Resolve library refs config. Returns null when not configured.
 *
 * @param {string} [libraryId]
 * @returns {{ srcDir?: string, docsDir?: string } | null}
 */
function getLibraryRefs(libraryId) {
  if (!libraryId) return null;
  try {
    const config = getLibraryConfig(libraryId);
    return config.refs || null;
  } catch {
    return null;
  }
}

// ── Single skill optimizer ────────────────────────────────────────────────────

/**
 * Ask the LLM to rewrite a skill file based on observed error cases.
 * When library refs are configured, the model uses tool calls to read
 * relevant docs/source on demand rather than having content pre-injected.
 *
 * @param {string} skillPath    - absolute path to the skill markdown file
 * @param {object[]} errorCases - error cases associated with this skill
 * @param {string} provider     - AI provider id
 * @param {string} model        - model id
 * @param {string} [libraryId]  - library id for reference lookup
 */
async function optimizeSkill(skillPath, errorCases, provider, model, libraryId) {
  const skillContent = fs.readFileSync(skillPath, 'utf-8');
  const skillName = path.basename(skillPath, '.md');

  console.log(
    `\n  Optimizing: ${skillName} (${errorCases.length} error case(s))`
  );

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

  const refs = getLibraryRefs(libraryId);

  // Build ref path hints so the model knows where to look
  const refHint = refs
    ? [
        refs.docsDir ? `- 官方文档目录：${refs.docsDir}` : '',
        refs.srcDir ? `- 源码目录：${refs.srcDir}` : ''
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const systemPrompt = `你是 AntV 技术专家，负责维护 LLM 代码生成的技能文档（skill）。
${refHint ? `\n你可以通过工具查阅以下本地参考资料，按需读取，无需全量阅读：\n${refHint}\n` : ''}
分析错误后，直接输出完整的优化后 skill 文档（以 --- 开头），不要输出任何解释文字。`;

  const userMessage = `以下是当前 skill 文件：

<skill>
${skillContent}
</skill>

以下是使用该 skill 后出现的错误案例：

${errorContext}

请分析错误原因，按需查阅参考文档，然后优化该 skill 文档。要求：
1. 保持 YAML Front Matter 不变（id、title、description、library、version、category、tags 等字段）
2. 重点修正或补充导致上述错误的文档描述
3. 确保最小可运行示例代码正确无误且可直接运行
4. 在「常见错误与修正」章节补充上述问题的示例和修正说明
5. 直接输出完整的优化后 skill 文档（以 --- 开头），不要输出任何解释文字`;

  const { tools, toolHandlers } = refs
    ? buildRefTools(refs)
    : { tools: [], toolHandlers: {} };

  const loop = new AgentLoop({
    provider,
    model,
    maxRounds: 6,
    tools,
    toolHandlers
  });

  const result = await loop.run(systemPrompt, userMessage);

  if (result.toolCallsLog.length > 0) {
    console.log(
      `    Ref lookups: ${result.toolCallsLog.map((t) => `${t.tool}(${JSON.stringify(t.args).slice(0, 60)})`).join(', ')}`
    );
  }

  if (!result?.content) {
    console.warn(`    LLM returned empty response, skipping.`);
    return;
  }

  let newContent = result.content.trim();
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
 * @param {string} [opts.libraryId]  - library id for reference doc injection (e.g. 'g2')
 */
async function run(
  skillToErrors,
  {
    provider,
    model,
    rootDir,
    dryRun = false,
    logFile,
    iteration = 0,
    allErrorCases = [],
    libraryId
  }
) {
  if (dryRun) {
    writeErrorLog(logFile, iteration, allErrorCases, skillToErrors, rootDir);
    console.log('\n[dry-run] Skipping skill optimization and index rebuild.');
    return;
  }

  console.log(`\nOptimizing ${skillToErrors.size} skill(s)...`);
  for (const [skillPath, cases] of skillToErrors) {
    await optimizeSkill(skillPath, cases, provider, model, libraryId);
  }
}

module.exports = { run, writeErrorLog };
