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
const { AgentLoop } = require('../eval/utils/ai-sdk');
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
    let realPath;
    try {
      realPath = fs.realpathSync(path.resolve(filePath));
    } catch {
      // Path doesn't exist yet — resolve without realpathSync
      realPath = path.resolve(filePath);
    }
    const realRoots = allowedRoots.map((r) => {
      try { return fs.realpathSync(path.resolve(r)); } catch { return path.resolve(r); }
    });
    if (!realRoots.some((r) => realPath === r || realPath.startsWith(r + path.sep))) {
      throw new Error(`Access denied: ${filePath} is outside allowed ref paths.`);
    }
  }

  const tools = [
    {
      type: 'function',
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
      type: 'function',
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
    },
    {
      type: 'function',
      function: {
        name: 'grep_files',
        description:
          '在文档或源码目录中递归搜索包含指定关键词的文件及匹配行，用于快速定位相关 API 或配置说明，避免逐层浏览目录。',
        parameters: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: '要搜索的关键词或正则表达式（传给 grep -E）'
            },
            search_dir: {
              type: 'string',
              description: '搜索的根目录绝对路径，必须在允许的 refs 目录内'
            },
            file_glob: {
              type: 'string',
              description: '文件名 glob 过滤，例如 "*.md" 或 "*.ts"，默认不过滤'
            }
          },
          required: ['pattern', 'search_dir']
        }
      }
    }
  ];

  const toolHandlers = {
    list_directory({ dir_path }) {
      try {
        assertAllowed(dir_path);
        if (!fs.existsSync(dir_path))
          return { error: `Path not found: ${dir_path}` };
        const entries = fs
          .readdirSync(dir_path, { withFileTypes: true })
          .map((e) => ({
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
        if (!fs.existsSync(file_path))
          return { error: `File not found: ${file_path}` };
        const content = fs.readFileSync(file_path, 'utf-8');
        // Cap single file reads to 12 KB to avoid context explosion
        return { file_path, content: content.slice(0, 12000) };
      } catch (e) {
        return { error: e.message };
      }
    },
    grep_files({ pattern, search_dir, file_glob }) {
      try {
        assertAllowed(search_dir);
        if (!fs.existsSync(search_dir))
          return { error: `Path not found: ${search_dir}` };

        const { execFileSync } = require('child_process');
        const args = [
          '-rn',
          '-E',
          '--include',
          file_glob || '*',
          pattern,
          search_dir
        ];
        let raw = '';
        try {
          raw = execFileSync('grep', args, {
            encoding: 'utf-8',
            maxBuffer: 1024 * 1024
          });
        } catch (e) {
          // grep exits with code 1 when no matches are found; that's not an error
          if (e.status === 1) return { pattern, search_dir, matches: [] };
          return { error: e.message };
        }

        const lines = raw.split('\n').filter(Boolean);
        // Cap at 100 lines to avoid flooding context
        const capped = lines.slice(0, 100);
        return {
          pattern,
          search_dir,
          total: lines.length,
          shown: capped.length,
          matches: capped
        };
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
async function optimizeSkill(
  skillPath,
  errorCases,
  provider,
  model,
  libraryId,
  historyContext = null   // optional cross-iteration history string from memory.js
) {
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

  const historySection = historyContext
    ? `\n${historyContext}\n`
    : '';

  const systemPrompt = `你是 AntV 技术专家，负责维护 LLM 代码生成的技能文档（skill）。
${refHint ? `\n你可以通过工具查阅以下本地参考资料，按需读取，无需全量阅读：\n${refHint}\n` : ''}${historySection}
注意：当前 skill 是候选归因之一，不一定是错误的根本原因。请先判断错误是否确实由本 skill 的内容缺失或错误描述引起。
- 如果是：输出修正后的完整 skill 文档（以 --- 开头）。
- 如果不是（错误由其他 skill 或模型行为导致）：原样输出当前 skill 文档，不做任何修改。
不要输出任何解释文字，只输出完整的 skill 文档内容。`;

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

  // Validate that the new content is meaningfully different and not a regression:
  // it must be non-empty and at least half the length of the original.
  const originalContent = fs.readFileSync(skillPath, 'utf-8');
  if (newContent.length < originalContent.length * 0.5) {
    console.warn(
      `    LLM response is suspiciously short (${newContent.length} vs ${originalContent.length} chars), skipping to prevent regression.`
    );
    return;
  }

  // If LLM decided this skill is not the root cause and returned the original
  // content unchanged, skip the write entirely.
  if (newContent === originalContent.trim()) {
    console.log(`    Unchanged (not root cause): ${skillName}`);
    return;
  }

  // Back up original before overwriting so we can recover if needed.
  const backupPath = skillPath + '.bak';
  fs.copyFileSync(skillPath, backupPath);

  try {
    fs.writeFileSync(skillPath, newContent);
    fs.unlinkSync(backupPath); // clean up backup on success
    console.log(`    Saved: ${skillPath}`);
  } catch (writeErr) {
    // Restore from backup if the write fails mid-way.
    try { fs.copyFileSync(backupPath, skillPath); } catch { /* best-effort */ }
    try { fs.unlinkSync(backupPath); } catch { /* best-effort */ }
    throw writeErr;
  }
}

// ── New skill creator ─────────────────────────────────────────────────────────

/**
 * Ask the LLM to create one or more new skill files for orphan error cases
 * (cases that had no matching skill to blame). The LLM may decide to create
 * one skill per distinct topic or merge related cases into fewer files.
 *
 * @param {object[]} orphanCases  - error cases with no resolvable skill
 * @param {string} provider       - AI provider id
 * @param {string} model          - model id
 * @param {string} skillsBaseDir  - absolute path to the skills/<library>/references dir
 * @param {string} [libraryId]    - library id for reference lookup
 * @returns {string[]} paths of newly created skill files
 */
async function createNewSkills(
  orphanCases,
  provider,
  model,
  skillsBaseDir,
  libraryId
) {
  if (orphanCases.length === 0) return [];

  console.log(
    `\n  Creating new skill(s) for ${orphanCases.length} orphan case(s)...`
  );

  const errorContext = orphanCases
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
你的任务是为没有现有 skill 覆盖的错误案例创建新的 skill 文档。

输出格式：每个新 skill 文档用以下分隔符包裹：
<<<SKILL_START:文件名（不含扩展名，如 g2-mark-text）>>>
（完整的 skill 文档内容，以 --- 开头）
<<<SKILL_END>>>

如果多个 case 属于同一主题，合并为一个 skill。不要输出任何解释文字，只输出上述格式的内容。`;

  const userMessage = `以下是没有现有 skill 文档覆盖的错误案例：

${errorContext}

请分析这些错误的共同主题，按需查阅参考文档，然后创建必要的新 skill 文档。要求：
1. YAML Front Matter 必须包含：id、title、description、library、version、category、tags
2. 文档语言与现有 skill 保持一致（中文说明 + 代码示例）
3. 必须包含「最小可运行示例」章节，代码可直接运行
4. 必须包含「常见错误与修正」章节，收录上述 case 的错误模式`;

  const { tools, toolHandlers } = refs
    ? buildRefTools(refs)
    : { tools: [], toolHandlers: {} };

  const loop = new AgentLoop({
    provider,
    model,
    maxRounds: 8,
    tools,
    toolHandlers
  });

  const result = await loop.run(systemPrompt, userMessage);

  if (!result?.content) {
    console.warn(
      `    LLM returned empty response for new skill creation, skipping.`
    );
    return [];
  }

  // Parse skill blocks from response
  const created = [];
  const blockRe = /<<<SKILL_START:([^>]+)>>>([\s\S]*?)<<<SKILL_END>>>/g;
  let match;
  while ((match = blockRe.exec(result.content)) !== null) {
    const filename = match[1].trim();
    let content = match[2].trim();

    const fmIdx = content.indexOf('---');
    if (fmIdx > 0) content = content.slice(fmIdx);
    if (!content.startsWith('---')) {
      console.warn(`    Skipping "${filename}": no YAML front matter found.`);
      continue;
    }

    const filePath = path.join(skillsBaseDir, `${filename}.md`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // Back up pre-existing file before overwriting (idempotent re-runs).
    const existingBackup = filePath + '.bak';
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, existingBackup);
    }
    try {
      fs.writeFileSync(filePath, content);
      if (fs.existsSync(existingBackup)) fs.unlinkSync(existingBackup);
    } catch (writeErr) {
      if (fs.existsSync(existingBackup)) {
        try { fs.copyFileSync(existingBackup, filePath); } catch { /* best-effort */ }
        try { fs.unlinkSync(existingBackup); } catch { /* best-effort */ }
      }
      throw writeErr;
    }
    console.log(`    Created: ${filePath}`);
    created.push(filePath);
  }

  if (created.length === 0) {
    console.warn(`    No valid skill blocks parsed from LLM response.`);
  }

  return created;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run the optimize agent over all skills that had errors,
 * and optionally create new skills for orphan cases.
 *
 * @param {Map<string,object[]>} skillToErrors - map from skill path to error cases
 * @param {object} opts
 * @param {string} opts.provider       - AI provider id
 * @param {string} opts.model          - model id
 * @param {string} opts.rootDir        - project root (for log path display)
 * @param {boolean} [opts.dryRun]      - if true, write log only, do not modify files
 * @param {string} [opts.logFile]      - path to dry-run log file
 * @param {number} [opts.iteration]    - current iteration number (for log header)
 * @param {object[]} [opts.allErrorCases] - all error cases (for dry-run log)
 * @param {object[]} [opts.orphanCases]   - error cases with no skill refs (for new skill creation)
 * @param {string} [opts.libraryId]    - library id for reference doc injection (e.g. 'g2')
 * @param {string} [opts.skillsRefDir] - absolute path to skills/<library>/references dir
 * @returns {string[]} paths of newly created skill files (empty in dry-run)
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
    orphanCases = [],
    libraryId,
    skillsRefDir,
    historyContext = {}   // { [skillPath]: string | null } — from memory.js
  }
) {
  if (dryRun) {
    writeErrorLog(logFile, iteration, allErrorCases, skillToErrors, rootDir);
    console.log('\n[dry-run] Skipping skill optimization and index rebuild.');
    return [];
  }

  const created = [];

  if (skillToErrors.size > 0) {
    console.log(`\nOptimizing ${skillToErrors.size} skill(s) in parallel...`);
    await Promise.all(
      [...skillToErrors.entries()].map(([skillPath, cases]) =>
        optimizeSkill(skillPath, cases, provider, model, libraryId, historyContext[skillPath])
      )
    );
  }

  if (orphanCases.length > 0 && skillsRefDir) {
    const newFiles = await createNewSkills(
      orphanCases,
      provider,
      model,
      skillsRefDir,
      libraryId
    );
    created.push(...newFiles);
  } else if (orphanCases.length > 0) {
    console.warn(
      `  ${orphanCases.length} orphan case(s) skipped: skillsRefDir not provided.`
    );
  }

  return created;
}

module.exports = { run, writeErrorLog, createNewSkills };
