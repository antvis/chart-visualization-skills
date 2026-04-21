/**
 * Shared skill tools for eval module.
 *
 * Exports:
 *   createReadSkillsTool - ai-sdk tool definition for read_skills
 *   loadSkillFile        - Load a skill markdown file (strips front matter)
 *   loadMainSkill        - Load SKILL.md for a library
 *   extractKeySections   - Extract key sections from skill markdown
 *   toolReadSkills       - Tool handler: read skill doc content
 *   buildSystemPrompt    - Build tool-call system prompt with SKILL.md overview
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { tool } from 'ai';
import { z } from 'zod';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT_DIR = process.env.HARNESS_ROOT_DIR ?? path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(ROOT_DIR, 'skills');

const LIBRARY_DIR: Record<string, string> = {
  g2: 'antv-g2-chart',
  g6: 'antv-g6-graph'
};

function resolveLibraryDir(library: string): string {
  return LIBRARY_DIR[library] ?? library;
}

// ── File helpers ──────────────────────────────────────────────────────────────

const _fileCache = new Map<string, string>();

export function loadSkillFile(skillPath: string, verbose = false): string | null {
  const fullPath = skillPath.startsWith('/') ? skillPath : path.join(ROOT_DIR, skillPath);
  if (_fileCache.has(fullPath)) return _fileCache.get(fullPath)!;
  if (!fs.existsSync(fullPath)) {
    if (verbose) logger.warn({ path: fullPath }, 'Skill file not found');
    return null;
  }
  const content = fs.readFileSync(fullPath, 'utf-8').replace(/^---[\s\S]*?---\n/, '');
  _fileCache.set(fullPath, content);
  return content;
}

export function loadMainSkill(library: string): string {
  const dir = resolveLibraryDir(library);
  return loadSkillFile(path.join(SKILLS_DIR, dir, 'SKILL.md')) ?? '';
}

// ── Section extraction ────────────────────────────────────────────────────────

const TARGET_SECTIONS = [
  '最小可运行示例', '基本用法', '核心概念', 'API 速查',
  '完整配置', '常见错误', '变体用法', '完整 Spec', '常见变体'
];

export function extractKeySections(content: string, maxChars = 5000): string {
  const lines = content.split('\n');
  const sections: string[] = [];
  let inSection = false;
  let sectionLevel = 0;
  let currentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2];
      if (TARGET_SECTIONS.some((t) => title.includes(t))) {
        if (currentLines.length > 0 && inSection) sections.push(currentLines.join('\n'));
        inSection = true;
        sectionLevel = level;
        currentLines = [line];
      } else if (inSection && level <= sectionLevel) {
        sections.push(currentLines.join('\n'));
        inSection = false;
        sectionLevel = 0;
        currentLines = [];
      } else if (inSection) {
        currentLines.push(line);
      }
    } else if (inSection) {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0 && inSection) sections.push(currentLines.join('\n'));

  const withCode = sections.filter((s) => s.includes('```'));
  const withoutCode = sections.filter((s) => !s.includes('```'));
  return [...withCode, ...withoutCode].slice(0, 4).join('\n\n').slice(0, maxChars);
}

// ── Tool handler ──────────────────────────────────────────────────────────────

export interface SkillToolResult {
  id?: string;
  path: string;
  content?: string;
  error?: string;
}

export function toolReadSkills(args: { paths: string[] }, verbose = false): SkillToolResult[] {
  return args.paths.slice(0, 4).map((skillPath) => {
    const content = loadSkillFile(skillPath, verbose);
    const fileName = path.basename(skillPath, '.md');
    if (!content) return { path: skillPath, error: 'File not found' };
    const extracted = extractKeySections(content).slice(0, 10000);
    if (verbose) logger.debug({ file: fileName, chars: extracted.length }, '加载 Skill');
    return { id: fileName, path: skillPath, content: extracted };
  });
}

// ── ai-sdk tool definition ────────────────────────────────────────────────────

export function createReadSkillsTool() {
  return tool({
    description: '读取指定 Skill 参考文档的完整内容。一次最多读取 4 个文件。',
    inputSchema: z.object({
      paths: z
        .array(z.string())
        .max(4)
        .describe('Skill 文件路径列表，如 ["skills/antv-g2-chart/references/marks/g2-mark-interval-basic.md"]')
    }),
    execute: async ({ paths }) => toolReadSkills({ paths })
  });
}

// ── System prompt ─────────────────────────────────────────────────────────────

export function buildSystemPrompt(library: string): string {
  const dir = resolveLibraryDir(library);
  const skillContent = loadMainSkill(library);
  return `你是 AntV ${library.toUpperCase()} v5 代码生成专家。根据用户描述生成准确、可运行的代码。

## 输出格式（严格遵守）

- **只输出纯 JavaScript 代码**，不要输出 HTML、Markdown 文档或任何解释文字
- 代码必须以 \`import\` 语句开头，从 \`@antv/${library}\` 引入所需模块
- 禁止使用 \`<script>\`、\`<!DOCTYPE>\`、\`<html>\` 等任何 HTML 标签
- 禁止使用 CDN URL 引入（如 unpkg、jsdelivr）
- container 变量直接使用，不要用字符串 'container'
- 如需代码块，只用 \`\`\`javascript 包裹，不用其他格式

## 工具使用（必须遵循）

你有一个工具可以查阅详细参考文档：

1. **read_skills(paths)** - 读取参考文档完整内容（最多 4 个文件）

**工作流程**：
1. 分析用户需求，确定涉及的图表类型、transform、coordinate、交互等
2. 下方知识库概览只包含 API 速查表和链接，**不包含完整代码示例**
3. **必须先调用 read_skills 读取相关的详细参考文档**，获取完整代码示例和配置细节后再生成代码
4. 参考文档路径格式：\`skills/${dir}/references/{category}/{filename}.md\`，路径已在知识库概览中列出
5. 生成代码时严格参考文档中的示例写法

--- 知识库概览 ---

${skillContent}`;
}
