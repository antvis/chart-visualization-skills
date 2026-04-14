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

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const ROOT_DIR =
  process.env.HARNESS_ROOT_DIR || path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(ROOT_DIR, 'skills');

// Mapping from short library key → actual skills directory name
const LIBRARY_DIR = {
  g2: 'antv-g2-chart',
  g6: 'antv-g6-graph'
};

function resolveLibraryDir(library) {
  return LIBRARY_DIR[library] ?? library;
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  // {
  //   type: 'function',
  //   function: {
  //     name: 'list_references',
  //     description:
  //       '列出 references 目录下可用的参考文档文件。返回文件路径、标题、描述等信息。',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         library: {
  //           type: 'string',
  //           description: '库：g2、g6',
  //           enum: ['g2', 'g6']
  //         },
  //         category: {
  //           type: 'string',
  //           description:
  //             '可选，过滤分类：marks、transforms、components、scales、coordinates、interactions、data、layouts、elements、behaviors、plugins、events、themes、patterns、recipes'
  //         }
  //       },
  //       required: ['library']
  //     }
  //   }
  // },
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

/** In-process cache to avoid redundant disk reads within a single eval run. */
const _fileCache = new Map();

/**
 * Load a skill markdown file and strip YAML front matter.
 * Results are cached in memory for the lifetime of the process.
 *
 * @param {string} skillPath - absolute or relative-to-ROOT_DIR path
 * @param {boolean} verbose
 * @returns {string|null}
 */
function loadSkillFile(skillPath, verbose = false) {
  const fullPath = skillPath.startsWith('/')
    ? skillPath
    : path.join(ROOT_DIR, skillPath);

  if (_fileCache.has(fullPath)) return _fileCache.get(fullPath);

  if (!fs.existsSync(fullPath)) {
    if (verbose) logger.warn({ path: fullPath }, 'Skill file not found');
    return null;
  }
  const content = fs
    .readFileSync(fullPath, 'utf-8')
    .replace(/^---[\s\S]*?---\n/, '');
  _fileCache.set(fullPath, content);
  return content;
}

/**
 * Load the main SKILL.md for a library (strips front matter).
 * @param {string} library - 'g2' | 'g6'
 * @returns {string}
 */
function loadMainSkill(library) {
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
 * @param {string} content - raw markdown (front matter already stripped)
 * @param {number} [maxChars=5000]
 * @returns {string}
 */
function extractKeySections(content, maxChars = 5000) {
  const lines = content.split('\n');
  const sections = [];
  let inSection = false;
  let sectionLevel = 0;
  let currentLines = [];

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

/**
 * list_references tool handler.
 * @param {{ library: string, category?: string }} args
 * @param {boolean} verbose
 */
function toolListReferences(args, verbose = false) {
  const { library, category } = args;
  const dir = resolveLibraryDir(library);
  const referencesDir = path.join(SKILLS_DIR, dir, 'references');
  if (!fs.existsSync(referencesDir)) return [];

  const results = [];
  const categories = category ? [category] : fs.readdirSync(referencesDir);

  for (const cat of categories) {
    const catDir = path.join(referencesDir, cat);
    if (!fs.existsSync(catDir) || !fs.statSync(catDir).isDirectory()) continue;

    for (const file of fs
      .readdirSync(catDir)
      .filter((f) => f.endsWith('.md'))) {
      const raw = fs.readFileSync(path.join(catDir, file), 'utf-8');
      const yamlMatch = raw.match(/^---\n([\s\S]*?)\n---/);
      let meta = {};
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
        category: cat,
        path: `skills/${dir}/references/${cat}/${file}`
      });
    }
  }

  if (verbose) logger.debug({ count: results.length }, '列出参考文档');
  return results;
}

/**
 * read_skills tool handler.
 * @param {{ paths: string[] }} args
 * @param {boolean} verbose
 */
function toolReadSkills(args, verbose = false) {
  return args.paths.slice(0, 4).map((skillPath) => {
    const content = loadSkillFile(skillPath, verbose);
    const fileName = path.basename(skillPath, '.md');
    if (!content) return { path: skillPath, error: 'File not found' };
    const extracted = extractKeySections(content).slice(0, 10000);
    if (verbose)
      logger.debug({ file: fileName, chars: extracted.length }, '加载 Skill');
    return { id: fileName, path: skillPath, content: extracted };
  });
}

// ── System prompt ─────────────────────────────────────────────────────────────

/**
 * Build the tool-call system prompt for a given library.
 * Injects the library's SKILL.md as an overview.
 * @param {string} library - 'g2' | 'g6'
 * @returns {string}
 */
function buildSystemPrompt(library) {
  const dir = resolveLibraryDir(library);
  const skillContent = loadMainSkill(library);
  return `你是 AntV ${library.toUpperCase()} v5 代码生成专家。根据用户描述生成准确、可运行的代码。

## 工具使用（必须遵循）

你有两个工具可以查阅详细参考文档：

1. **list_references(library, category?)** - 列出参考文档目录，返回文件路径和标题
2. **read_skills(paths)** - 读取参考文档完整内容（最多 4 个文件）

**工作流程**：
1. 分析用户需求，确定涉及的图表类型、transform、coordinate、交互等
2. 下方知识库概览只包含 API 速查表和链接，**不包含完整代码示例**
3. **必须先调用 read_skills 读取相关的详细参考文档**，获取完整代码示例和配置细节后再生成代码
4. 参考文档路径格式：\`skills/${dir}/references/{category}/{filename}.md\`，路径已在知识库概览中列出
5. 生成代码时严格参考文档中的示例写法

--- 知识库概览 ---

${skillContent}`;
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  TOOLS,
  loadSkillFile,
  loadMainSkill,
  extractKeySections,
  toolListReferences,
  toolReadSkills,
  buildSystemPrompt
};
