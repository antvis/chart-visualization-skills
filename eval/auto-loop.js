#!/usr/bin/env node
/**
 * AntV Skills Auto-Loop
 *
 * Runs evaluation repeatedly, optimizes skill docs on failures,
 * and stops after MAX_PASSES consecutive clean evaluations.
 *
 * Usage:
 *   node eval/auto-loop.js
 *   node eval/auto-loop.js --sample=10 --retrieval=bm25
 *   node eval/auto-loop.js --passes=3 --max-iterations=20
 *   node eval/auto-loop.js --dry-run              # 只输出错误日志，不执行 skill 优化
 *   node eval/auto-loop.js --dry-run --log=my.log # 指定日志文件路径
 */

require('dotenv').config();

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { callAI, detectProviderFromModel } = require('./utils/ai-sdk');
const { parseArgs } = require('./utils/eval-utils');
const { testAllResults, closeBrowser } = require('./utils/render-tester');

const ROOT_DIR = path.resolve(__dirname, '..');
const RESULT_DIR = path.join(__dirname, 'result');
const SKILLS_DIR = path.join(ROOT_DIR, 'skills');

// ── Config ────────────────────────────────────────────────────────────────────

const argv = parseArgs(process.argv);
const SAMPLE = parseInt(argv.sample || process.env.LOOP_SAMPLE || '10');
const RETRIEVAL =
  process.argv.find((a) => a.startsWith('--retrieval='))?.split('=')[1] ||
  process.env.LOOP_RETRIEVAL ||
  'tool-call';
const MAX_PASSES = parseInt(
  process.argv.find((a) => a.startsWith('--passes='))?.split('=')[1] || '3'
);
const MAX_ITERATIONS = parseInt(
  process.argv.find((a) => a.startsWith('--max-iterations='))?.split('=')[1] ||
    '20'
);
const MODEL = process.env.AI_MODEL || 'qwen3-coder-480b-a35b-instruct';
const PROVIDER = detectProviderFromModel(MODEL);

// --dry-run: 发现错误时只写日志，不执行 skill 优化
const DRY_RUN = process.argv.includes('--dry-run');
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = (() => {
  const custom = process.argv
    .find((a) => a.startsWith('--log='))
    ?.split('=')[1];
  if (custom)
    return path.isAbsolute(custom) ? custom : path.join(process.cwd(), custom);
  const dateStr = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `auto-loop-${dateStr}.log`);
})();

// ── Eval runner ───────────────────────────────────────────────────────────────

function runEval() {
  const before = new Set(
    fs.existsSync(RESULT_DIR)
      ? fs.readdirSync(RESULT_DIR).filter((f) => f.endsWith('.json'))
      : []
  );

  const cmd = `node eval/cli.js eval --sample=${SAMPLE} --retrieval=${RETRIEVAL}`;
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: ROOT_DIR, stdio: 'inherit' });

  // Find newly created result file
  const after = fs.readdirSync(RESULT_DIR).filter((f) => f.endsWith('.json'));
  const newFiles = after.filter((f) => !before.has(f));
  if (newFiles.length > 0) {
    return path.join(RESULT_DIR, newFiles[0]);
  }

  // Fallback: most recently modified
  const sorted = after
    .map((f) => ({
      name: f,
      mtime: fs.statSync(path.join(RESULT_DIR, f)).mtimeMs
    }))
    .sort((a, b) => b.mtime - a.mtime);
  return path.join(RESULT_DIR, sorted[0].name);
}

// ── Skill resolution ──────────────────────────────────────────────────────────

function findSkillByBasename(basename) {
  function search(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = search(full);
        if (found) return found;
      } else if (
        entry.name === basename + '.md' ||
        path.basename(entry.name, '.md') === basename
      ) {
        return full;
      }
    }
    return null;
  }
  return search(SKILLS_DIR);
}

function resolveSkillPath(ref) {
  // Full absolute path
  if (path.isAbsolute(ref) && fs.existsSync(ref)) return ref;
  // Relative to ROOT_DIR
  const fromRoot = path.join(ROOT_DIR, ref);
  if (fs.existsSync(fromRoot)) return fromRoot;
  // Skill id / basename (no extension)
  return findSkillByBasename(path.basename(ref, '.md'));
}

// ── Error logger (dry-run mode) ───────────────────────────────────────────────

function writeErrorLog(iteration, errorCases, skillToErrors) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

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
    lines.push(`Skills involved:`);
    for (const [skillPath, cases] of skillToErrors) {
      lines.push(
        `  ${path.relative(ROOT_DIR, skillPath)}  (${cases.length} case(s))`
      );
    }
    lines.push('');
  }

  fs.appendFileSync(LOG_FILE, lines.join('\n') + '\n');
  console.log(`  Log written: ${LOG_FILE}`);
}

// ── Skill optimizer ───────────────────────────────────────────────────────────

async function optimizeSkill(skillPath, errorCases) {
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
    provider: PROVIDER,
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    maxTokens: 4000
  });

  if (!response?.content) {
    console.warn(`    LLM returned empty response, skipping.`);
    return;
  }

  let newContent = response.content.trim();
  // Strip any preamble before the YAML front matter
  const fmIdx = newContent.indexOf('---');
  if (fmIdx > 0) newContent = newContent.slice(fmIdx);

  if (!newContent.startsWith('---')) {
    console.warn(`    Response didn't start with YAML front matter, skipping.`);
    return;
  }

  fs.writeFileSync(skillPath, newContent);
  console.log(`    Saved: ${skillPath}`);
}

// ── Main loop ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('  AntV Skills Auto-Loop');
  console.log('='.repeat(60));
  console.log(`  Sample:         ${SAMPLE}`);
  console.log(`  Retrieval:      ${RETRIEVAL}`);
  console.log(`  Provider/Model: ${PROVIDER} / ${MODEL}`);
  console.log(`  Target passes:  ${MAX_PASSES}`);
  console.log(`  Max iterations: ${MAX_ITERATIONS}`);
  console.log('='.repeat(60));

  if (!fs.existsSync(RESULT_DIR)) fs.mkdirSync(RESULT_DIR, { recursive: true });

  let consecutivePasses = 0;
  let iteration = 0;

  while (consecutivePasses < MAX_PASSES) {
    if (iteration >= MAX_ITERATIONS) {
      console.log(`\nReached max iterations (${MAX_ITERATIONS}). Stopping.`);
      process.exit(1);
    }

    iteration++;
    console.log(`\n${'─'.repeat(60)}`);
    console.log(
      `Iteration ${iteration}  |  Consecutive passes: ${consecutivePasses}/${MAX_PASSES}`
    );
    console.log('─'.repeat(60));

    // ── Step 1: Run eval ───────────────────────────────────────────────────────
    let resultPath;
    try {
      resultPath = runEval();
    } catch (err) {
      console.error(`Eval failed: ${err.message}`);
      process.exit(1);
    }

    // ── Step 2: Render test every generated code ──────────────────────────────
    const data = JSON.parse(fs.readFileSync(resultPath, 'utf-8'));
    const allResults = data.results || [];

    const total = allResults.length;
    console.log(`\nRender testing ${total} result(s) (concurrency=5)...`);

    const testedResults = await testAllResults(allResults, {
      concurrency: 5,
      onProgress({ done, total: t, result }) {
        if (result.renderStatus !== 'success') {
          const tag = result.renderStatus.toUpperCase();
          const detail = result.renderError ? ` — ${result.renderError}` : '';
          console.log(`  [${done}/${t}] [${tag}] ${result.id}${detail}`);
        } else {
          process.stdout.write(`\r  Progress: ${done}/${t}`);
        }
      }
    });
    process.stdout.write('\n');

    const errorCases = testedResults.filter(
      (r) => r.renderStatus === 'error' || r.renderStatus === 'blank'
    );

    const statusCounts = testedResults.reduce((acc, r) => {
      acc[r.renderStatus] = (acc[r.renderStatus] || 0) + 1;
      return acc;
    }, {});
    console.log(
      `  Result: success=${statusCounts.success || 0}  blank=${statusCounts.blank || 0}  error=${statusCounts.error || 0}`
    );

    if (errorCases.length === 0) {
      consecutivePasses++;
      console.log(`Clean pass (${consecutivePasses}/${MAX_PASSES})`);
      continue;
    }

    consecutivePasses = 0;

    // ── Step 3: Group error cases by skill ────────────────────────────────────
    const skillToErrors = new Map();

    for (const errorCase of errorCases) {
      const refs = [
        ...(errorCase.loadedSkillPaths || []),
        ...(errorCase.retrievedSkillIds || [])
      ];

      if (refs.length === 0) {
        console.log(
          `  No skill refs for: ${errorCase.id} — skipping optimization`
        );
        continue;
      }

      for (const ref of refs) {
        const skillPath = resolveSkillPath(ref);
        if (!skillPath) {
          console.warn(`  Could not resolve skill: ${ref}`);
          continue;
        }
        if (!skillToErrors.has(skillPath)) skillToErrors.set(skillPath, []);
        skillToErrors.get(skillPath).push(errorCase);
      }
    }

    if (skillToErrors.size === 0) {
      console.log(
        '\nNo skills to optimize. Counting as pass to avoid infinite loop.'
      );
      consecutivePasses++;
      continue;
    }

    if (DRY_RUN) {
      // ── Step 4 (dry-run): Write error log only, skip optimization ─────────
      writeErrorLog(iteration, errorCases, skillToErrors);
      console.log('\n[dry-run] Skipping skill optimization and index rebuild.');
      console.log('[dry-run] Stopping after first failure.');
      break;
    }

    // ── Step 4: Optimize each involved skill ──────────────────────────────────
    console.log(`\nOptimizing ${skillToErrors.size} skill(s)...`);
    for (const [skillPath, cases] of skillToErrors) {
      await optimizeSkill(skillPath, cases);
    }

    // ── Step 5: Rebuild index ─────────────────────────────────────────────────
    console.log('\nRebuilding index...');
    execSync('node bin/skills-antv.js build', {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log(`  Done: ${MAX_PASSES} consecutive clean evaluations.`);
  console.log('='.repeat(60));
}

main()
  .catch((err) => {
    console.error('Fatal:', err.message);
    process.exit(1);
  })
  .finally(() => closeBrowser());
