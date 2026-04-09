/**
 * Shared skill tools for both eval and web modules.
 *
 * Exports:
 *   TOOLS               - LLM tool definitions (list_references, read_skills)
 *   loadSkillFile       - Load a skill markdown file (strips front matter)
 *   loadMainSkill       - Load SKILL.md for a library
 *   extractKeySections  - Extract key sections from skill markdown
 *   toolListReferences  - Tool handler: list reference docs
 *   toolReadSkills      - Tool handler: read skill doc content
 *   buildSystemPrompt   - Build tool-call system prompt with SKILL.md overview
 */

import fs from 'fs';
import path from 'path';

// Calculate ROOT_DIR - in Next.js, use process.cwd() to get project root
// Assumes playground is running from the workspace root or playground directory
const ROOT_DIR = process.cwd().includes('playground')
  ? path.resolve(process.cwd(), '..')
  : path.resolve(process.cwd());
const SKILLS_DIR = path.join(ROOT_DIR, 'skills');

// Mapping from library index key → actual skills directory name
const LIBRARY_DIR: Record<string, string> = {
  g2: 'antv-g2-chart'
};

function resolveLibraryDir(library: string): string {
  return LIBRARY_DIR[library] ?? library;
}

// ── Tool definitions ──────────────────────────────────────────────────────────

export const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_references',
      description:
        '列出 references 目录下可用的参考文档文件。返回文件路径、标题、描述等信息。',
      parameters: {
        type: 'object',
        properties: {
          library: {
            type: 'string',
            description: '库名，如 antv-g2-chart',
            enum: ['antv-g2-chart']
          },
          category: {
            type: 'string',
            description:
              '可选，过滤分类：marks、transforms、components、scales、coordinates、interactions、data、layouts、elements、behaviors、plugins、events、themes、patterns、recipes'
          }
        },
        required: ['library']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_skills',
      description: '读取指定 Skill 参考文档的完整内容。一次最多读取 4 个文件。',
      parameters: {
        type: 'object',
        properties: {
          paths: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Skill 文件路径列表，如 ["skills/antv-g2-chart/references/marks/g2-mark-interval-basic.md"]',
            maxItems: 4
          }
        },
        required: ['paths']
      }
    }
  }
];

// ── File helpers ──────────────────────────────────────────────────────────────

/**
 * Load a skill markdown file and strip YAML front matter.
 * @param skillPath - absolute or relative-to-ROOT_DIR path
 * @param verbose
 * @returns file content or null
 */
export function loadSkillFile(
  skillPath: string,
  verbose = false
): string | null {
  const fullPath = skillPath.startsWith('/')
    ? skillPath
    : path.join(ROOT_DIR, skillPath);
  if (!fs.existsSync(fullPath)) {
    if (verbose) console.log(`   ⚠️  File not found: ${fullPath}`);
    return null;
  }
  return fs.readFileSync(fullPath, 'utf-8').replace(/^---[\s\S]*?---\n/, '');
}

/**
 * Load the main SKILL.md for a library (strips front matter).
 * @param library - index key, e.g. 'g2'
 * @returns file content
 */
export function loadMainSkill(library: string): string {
  const dir = resolveLibraryDir(library);
  return loadSkillFile(path.join(SKILLS_DIR, dir, 'SKILL.md')) || '';
}

// ── Section extraction ────────────────────────────────────────────────────────

const TARGET_SECTIONS = [
  '最小可运行示例',
  '基本用法',
  '核心概念',
  'API 速查',
  '完整配置',
  '常见错误',
  '变体用法',
  '完整 Spec',
  '常见变体'
];

/**
 * Extract key sections from skill markdown content.
 * Sub-headings (###) are collected into their parent section rather than
 * terminating it — only a same-level or higher heading ends the section.
 *
 * @param content - raw markdown (front matter already stripped)
 * @param maxChars - maximum characters to return
 * @returns extracted content
 */
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
        if (currentLines.length > 0 && inSection)
          sections.push(currentLines.join('\n'));
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
  if (currentLines.length > 0 && inSection)
    sections.push(currentLines.join('\n'));

  const B = '```';
  const withCode = sections.filter((s) => s.includes(B));
  const withoutCode = sections.filter((s) => !s.includes(B));
  return [...withCode, ...withoutCode]
    .slice(0, 4)
    .join('\n\n')
    .slice(0, maxChars);
}

// ── Tool handlers ─────────────────────────────────────────────────────────────

interface ReferenceResult {
  id: string;
  title: string;
  description: string;
  category: string;
  path: string;
}

/**
 * list_references tool handler.
 * @param args - { library: string, category?: string }
 * @param verbose
 * @returns list of reference documents
 */
export function toolListReferences(
  args: { library: string; category?: string },
  verbose = false
): ReferenceResult[] {
  const { library, category } = args;
  const dir = resolveLibraryDir(library);
  const referencesDir = path.join(SKILLS_DIR, dir, 'references');
  if (!fs.existsSync(referencesDir)) return [];

  const results: ReferenceResult[] = [];
  const categories = category ? [category] : fs.readdirSync(referencesDir);

  for (const cat of categories) {
    const catDir = path.join(referencesDir, cat);
    if (!fs.existsSync(catDir) || !fs.statSync(catDir).isDirectory()) continue;

    for (const file of fs
      .readdirSync(catDir)
      .filter((f) => f.endsWith('.md'))) {
      const raw = fs.readFileSync(path.join(catDir, file), 'utf-8');
      const yamlMatch = raw.match(/^---\n([\s\S]*?)\n---/);
      let meta: { id?: string; title?: string; description?: string } = {};
      if (yamlMatch) {
        const yaml = yamlMatch[1];
        const idMatch = yaml.match(/^id:\s*["']?([^'"\n]+)["']?/m);
        const titleMatch = yaml.match(/^title:\s*["']?([^'"\n]+)["']?/m);
        const descMatch = yaml.match(
          /^description:\s*\|?\s*([\s\S]*?)(?=^[a-z]|\s*$)/m
        );
        meta = {
          id: idMatch ? idMatch[1].trim() : file.replace('.md', ''),
          title: titleMatch ? titleMatch[1].trim() : file,
          description: descMatch ? descMatch[1].trim().slice(0, 100) : ''
        };
      }
      results.push({
        ...meta,
        id: meta.id || file.replace('.md', ''),
        title: meta.title || file,
        description: meta.description || '',
        category: cat,
        path: `skills/${dir}/references/${cat}/${file}`
      });
    }
  }

  if (verbose) console.log(`   📋 列出 ${results.length} 个参考文档`);
  return results;
}

interface SkillReadResult {
  id: string;
  path: string;
  content?: string;
  error?: string;
}

/**
 * read_skills tool handler.
 * @param args - { paths: string[] }
 * @param verbose
 * @returns list of skill contents
 */
export function toolReadSkills(
  args: { paths: string[] },
  verbose = false
): SkillReadResult[] {
  return args.paths.slice(0, 4).map((skillPath) => {
    const content = loadSkillFile(skillPath, verbose);
    const fileName = path.basename(skillPath, '.md');
    if (!content)
      return { path: skillPath, error: 'File not found', id: fileName };
    const extracted = extractKeySections(content).slice(0, 10000);
    if (verbose)
      console.log(`   📖 加载: ${fileName} (${extracted.length} 字符)`);
    return { id: fileName, path: skillPath, content: extracted };
  });
}

// ── System prompt ─────────────────────────────────────────────────────────────

/**
 * Build the tool-call system prompt for a given library.
 * Injects the library's SKILL.md as an overview.
 * @param library - index key, e.g. 'g2'
 * @returns system prompt string
 */
export function buildSystemPrompt(library: string): string {
  const dir = resolveLibraryDir(library);
  const skillContent = loadMainSkill(library);

  return `你是 AntV G2 v5 代码生成专家。根据用户描述生成准确、可运行的代码。

--- 知识库概览 ---

${skillContent}`;
}
