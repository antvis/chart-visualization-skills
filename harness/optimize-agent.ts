/**
 * Optimize Agent
 *
 * Responsibility: Use an LLM to rewrite skill docs based on observed error cases.
 * In dry-run mode, writes a log file instead of modifying skill files.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { AgentLoop } from '../eval/utils/ai-sdk.js';
import { getLibraryConfig, type LibraryRefs } from './config.js';
import { withRetry } from './retry-utils.js';
import { classify } from './error-classifier.js';
import type { ErrorCase } from './memory.js';

// ── Dry-run log writer ────────────────────────────────────────────────────────

export function writeErrorLog(
  logFile: string,
  iteration: number,
  errorCases: ErrorCase[],
  skillToErrors: Map<string, ErrorCase[]>,
  rootDir: string
): void {
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
    lines.push(`[${(c.renderStatus ?? '').toUpperCase()}] ${c.id}  (${renderInfo})`);
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

function buildRefTools(refs: LibraryRefs): ToolSet {
  const allowedRoots = [refs.srcDir, refs.docsDir].filter((r): r is string => r !== null);

  function assertAllowed(filePath: string): void {
    let realPath: string;
    try {
      realPath = fs.realpathSync(path.resolve(filePath));
    } catch {
      realPath = path.resolve(filePath);
    }
    const realRoots = allowedRoots.map((r) => {
      try { return fs.realpathSync(path.resolve(r)); } catch { return path.resolve(r); }
    });
    if (!realRoots.some((r) => realPath === r || realPath.startsWith(r + path.sep))) {
      throw new Error(`Access denied: ${filePath} is outside allowed ref paths.`);
    }
  }

  return {
    list_directory: tool({
      description: '列出指定目录下的文件和子目录，用于浏览文档或源码结构以确定要读取的文件。',
      parameters: z.object({
        dir_path: z.string().describe('要列出的目录绝对路径')
      }),
      execute: async (args) => {
        const dir_path = args.dir_path;
        try {
          assertAllowed(dir_path);
          if (!fs.existsSync(dir_path)) return { error: `Path not found: ${dir_path}` };
          const entries = fs
            .readdirSync(dir_path, { withFileTypes: true })
            .map((e) => ({ name: e.name, type: e.isDirectory() ? 'directory' : 'file' }));
          return { dir_path, entries };
        } catch (e) {
          return { error: (e as Error).message };
        }
      }
    }),
    read_file: tool({
      description: '读取指定文件的内容，用于查阅官方文档或源码以获取权威 API 信息。',
      parameters: z.object({
        file_path: z.string().describe('要读取的文件绝对路径')
      }),
      execute: async (args) => {
        const file_path = args.file_path;
        try {
          assertAllowed(file_path);
          if (!fs.existsSync(file_path)) return { error: `File not found: ${file_path}` };
          const content = fs.readFileSync(file_path, 'utf-8');
          return { file_path, content: content.slice(0, 12000) };
        } catch (e) {
          return { error: (e as Error).message };
        }
      }
    }),
    grep_files: tool({
      description: '在文档或源码目录中递归搜索包含指定关键词的文件及匹配行。',
      parameters: z.object({
        pattern: z.string().describe('要搜索的关键词或正则表达式（传给 grep -E）'),
        search_dir: z.string().describe('搜索的根目录绝对路径，必须在允许的 refs 目录内'),
        file_glob: z.string().optional().describe('文件名 glob 过滤，例如 "*.md" 或 "*.ts"，默认不过滤')
      }),
      execute: async (args) => {
        const { pattern, search_dir, file_glob } = args;
        try {
          assertAllowed(search_dir);
          if (!fs.existsSync(search_dir)) return { error: `Path not found: ${search_dir}` };

          const grepArgs = ['-rn', '-E', '--include', file_glob || '*', pattern, search_dir];
          let raw = '';
          try {
            raw = execFileSync('grep', grepArgs, { encoding: 'utf-8', maxBuffer: 1024 * 1024 });
          } catch (e) {
            const err = e as { status?: number; message?: string };
            if (err.status === 1) return { pattern, search_dir, matches: [] };
            return { error: err.message };
          }

          const lines = raw.split('\n').filter(Boolean);
          const capped = lines.slice(0, 100);
          return { pattern, search_dir, total: lines.length, shown: capped.length, matches: capped };
        } catch (e) {
          return { error: (e as Error).message };
        }
      }
    })
  };
}

function getLibraryRefs(libraryId?: string): LibraryRefs | null {
  if (!libraryId) return null;
  try {
    const config = getLibraryConfig(libraryId);
    return config.refs || null;
  } catch {
    return null;
  }
}

// ── Single skill optimizer ────────────────────────────────────────────────────

async function optimizeSkill(
  skillPath: string,
  errorCases: ErrorCase[],
  provider: string,
  model: string,
  libraryId?: string,
  historyContext: string | null = null
): Promise<void> {
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

  const refs = getLibraryRefs(libraryId);

  const refHint = refs
    ? [
        refs.docsDir ? `- 官方文档目录：${refs.docsDir}` : '',
        refs.srcDir ? `- 源码目录：${refs.srcDir}` : ''
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const historySection = historyContext ? `\n${historyContext}\n` : '';

  const systemPrompt = `你是 AntV 技术专家，负责维护 LLM 代码生成的技能文档（skill）。
${refHint ? `\n你可以通过工具查阅以下本地参考资料，按需读取，无需全量阅读：\n${refHint}\n` : '\n注意：当前没有可用的外部查阅工具，请直接基于 skill 内容和错误案例进行分析，不要尝试调用任何工具。\n'}${historySection}
注意：本 skill 已经过归因分析，是这批错误案例中最相关的候选文件。请判断 skill 内容是否有改善空间（如缺失关键 API 说明、用法示例有误、缺少常见错误提示等），若有则输出优化后的完整 skill 文档；若 skill 内容已充分、错误由模型能力或其他因素导致，则原样输出当前 skill 文档。
不要输出任何解释文字，只输出完整的 skill 文档内容。`;

  const userMessage = `以下是当前 skill 文件：

<skill>
${skillContent}
</skill>

以下是使用该 skill 后出现的错误案例：

${errorContext}

请分析错误原因，${refs ? '按需查阅参考文档，' : ''}然后优化该 skill 文档。要求：
1. 保持 YAML Front Matter 不变（id、title、description、library、version、category、tags 等字段）
2. 重点修正或补充导致上述错误的文档描述
3. 确保最小可运行示例代码正确无误且可直接运行
4. 在「常见错误与修正」章节补充上述问题的示例和修正说明
5. 直接输出完整的优化后 skill 文档（以 --- 开头），不要输出任何解释文字`;

  const tools = refs ? buildRefTools(refs) : undefined;

  const result = await withRetry(
    () => {
      const loop = new AgentLoop({ provider, model, maxRounds: 6, tools });
      return loop.run(systemPrompt, userMessage);
    },
    {
      maxAttempts: 4,
      baseMs:      10_000,
      shouldRetry(err) {
        const { action } = classify(err);
        return action.shouldRetry && !action.abort;
      },
      onRetry(err, attempt, delayMs) {
        console.warn(
          `    [retry] ${skillName}: ${(err as Error).message} — attempt ${attempt} in ${(delayMs / 1000).toFixed(1)}s...`
        );
      },
    }
  );

  if (result.toolCallsLog.length > 0) {
    console.log(
      `    Ref lookups: ${result.toolCallsLog.map((t) => `${t.tool}(${JSON.stringify(t.input).slice(0, 60)})`).join(', ')}`
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

  const originalContent = fs.readFileSync(skillPath, 'utf-8');
  if (newContent.length < originalContent.length * 0.5) {
    console.warn(
      `    LLM response is suspiciously short (${newContent.length} vs ${originalContent.length} chars), skipping to prevent regression.`
    );
    return;
  }

  if (newContent === originalContent.trim()) {
    console.log(`    Unchanged (not root cause): ${skillName}`);
    return;
  }

  const backupPath = skillPath + '.bak';
  fs.copyFileSync(skillPath, backupPath);

  try {
    fs.writeFileSync(skillPath, newContent);
    fs.unlinkSync(backupPath);
    console.log(`    Saved: ${skillPath}`);
  } catch (writeErr) {
    try { fs.copyFileSync(backupPath, skillPath); } catch { /* best-effort */ }
    try { fs.unlinkSync(backupPath); } catch { /* best-effort */ }
    throw writeErr;
  }
}

// ── New skill creator ─────────────────────────────────────────────────────────

export async function createNewSkills(
  orphanCases: ErrorCase[],
  provider: string,
  model: string,
  skillsBaseDir: string,
  libraryId?: string
): Promise<string[]> {
  if (orphanCases.length === 0) return [];

  console.log(`\n  Creating new skill(s) for ${orphanCases.length} orphan case(s)...`);

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
${refHint ? `\n你可以通过工具查阅以下本地参考资料，按需读取，无需全量阅读：\n${refHint}\n` : '\n注意：当前没有可用的外部查阅工具，请直接基于错误案例进行分析，不要尝试调用任何工具。\n'}
你的任务是为没有现有 skill 覆盖的错误案例创建新的 skill 文档。

输出格式：每个新 skill 文档用以下分隔符包裹：
<<<SKILL_START:文件名（不含扩展名，如 g2-mark-text）>>>
（完整的 skill 文档内容，以 --- 开头）
<<<SKILL_END>>>

如果多个 case 属于同一主题，合并为一个 skill。不要输出任何解释文字，只输出上述格式的内容。`;

  const userMessage = `以下是没有现有 skill 文档覆盖的错误案例：

${errorContext}

请分析这些错误的共同主题，${refs ? '按需查阅参考文档，' : ''}然后创建必要的新 skill 文档。要求：
1. YAML Front Matter 必须包含：id、title、description、library、version、category、tags
2. 文档语言与现有 skill 保持一致（中文说明 + 代码示例）
3. 必须包含「最小可运行示例」章节，代码可直接运行
4. 必须包含「常见错误与修正」章节，收录上述 case 的错误模式`;

  const tools = refs ? buildRefTools(refs) : undefined;

  const loop = new AgentLoop({ provider, model, maxRounds: 8, tools });
  const result = await loop.run(systemPrompt, userMessage);

  if (!result?.content) {
    console.warn(`    LLM returned empty response for new skill creation, skipping.`);
    return [];
  }

  const created: string[] = [];
  const blockRe = /<<<SKILL_START:([^>]+)>>>([\s\S]*?)<<<SKILL_END>>>/g;
  let match: RegExpExecArray | null;
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

    const existingBackup = filePath + '.bak';
    if (fs.existsSync(filePath)) fs.copyFileSync(filePath, existingBackup);
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

export interface OptimizeAgentOptions {
  provider: string;
  model: string;
  rootDir: string;
  dryRun?: boolean;
  logFile?: string;
  iteration?: number;
  allErrorCases?: ErrorCase[];
  orphanCases?: ErrorCase[];
  libraryId?: string;
  skillsRefDir?: string;
  historyContext?: Record<string, string | null>;
}

export async function run(
  skillToErrors: Map<string, ErrorCase[]>,
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
    historyContext = {},
  }: OptimizeAgentOptions
): Promise<string[]> {
  if (dryRun) {
    writeErrorLog(logFile!, iteration, allErrorCases, skillToErrors, rootDir);
    console.log('\n[dry-run] Skipping skill optimization and index rebuild.');
    return [];
  }

  const created: string[] = [];

  if (skillToErrors.size > 0) {
    console.log(`\nOptimizing ${skillToErrors.size} skill(s) in parallel...`);
    const results = await Promise.allSettled(
      [...skillToErrors.entries()].map(([skillPath, cases]) =>
        optimizeSkill(skillPath, cases, provider, model, libraryId, historyContext[skillPath] ?? null)
      )
    );
    for (const r of results) {
      if (r.status === 'rejected') {
        console.error(`  Skill optimization failed: ${(r.reason as Error)?.message ?? r.reason}`);
      }
    }
  }

  if (orphanCases.length > 0 && skillsRefDir) {
    const newFiles = await createNewSkills(orphanCases, provider, model, skillsRefDir, libraryId);
    created.push(...newFiles);
  } else if (orphanCases.length > 0) {
    console.warn(`  ${orphanCases.length} orphan case(s) skipped: skillsRefDir not provided.`);
  }

  return created;
}
