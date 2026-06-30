/**
 * Shared skill tools for eval module.
 *
 * Exports:
 *   createSearchSkillsTool  - ai-sdk tool definition for search_skills (uses retrieve API)
 *   buildSystemPrompt       - Build tool-call system prompt with constraints from index
 *
 * Changed from v1: replaced read_skills (file-path based) with search_skills (retrieve based).
 * Constraints now come from the built index (info.constraintsContent) instead of SKILL.md files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { tool } from 'ai';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = process.env.HARNESS_ROOT_DIR ?? path.resolve(__dirname, '../..');
const INDEX_DIR = path.join(ROOT_DIR, 'src', 'index');

// ── Info defaults (fallback when constraints file / index is unavailable) ────────

const LIBRARY_INFO_DEFAULTS: Record<
  string,
  { name: string; description: string }
> = {
  g2: {
    name: 'antv-g2-chart',
    description: 'Generate G2 v5 chart code.',
  },
  g6: {
    name: 'antv-g6-graph',
    description: 'Generate G6 v5 graph/network visualization code.',
  },
  x6: {
    name: 'antv-x6-editor',
    description: 'Generate X6 v3 diagram/editor code.',
  },
};

// ── Load skill info from the built index ─────────────────────────────────────────

function loadSkillInfo(library: string): {
  name: string;
  description: string;
  constraintsContent: string;
} {
  const defaults = LIBRARY_INFO_DEFAULTS[library];
  const indexPath = path.join(INDEX_DIR, `${library}.index.json`);

  if (!fs.existsSync(indexPath)) {
    return {
      name: defaults?.name ?? `antv-${library}`,
      description: defaults?.description ?? '',
      constraintsContent: '',
    };
  }

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const info = index.info;

  return {
    name: info?.name || defaults?.name || `antv-${library}`,
    description: info?.description || defaults?.description || '',
    constraintsContent: info?.constraintsContent || '',
  };
}

// ── Tool definition ──────────────────────────────────────────────────────────────

export function createSearchSkillsTool(
  library: string,
  onResult?: (query: string, ids: string[]) => void,
) {
  return tool({
    description:
      '搜索相关技能/图表文档。用自然语言描述你需要查找的图表类型、配置项或功能，系统自动返回最相关的技术文档和代码示例。',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          '搜索查询，描述你需要查找的图表类型（如"柱状图"、"折线图"）、配置项（如"tooltip 配置"、"坐标轴样式"）或功能（如"堆叠"、"分组"、"brush 交互"）',
        ),
    }),
    execute: async ({ query }) => {
      try {
        const mod = (await import('../../src/core/retriever.js')) as {
          retrieve: (
            q: string,
            opts: {
              library?: string;
              topK?: number;
              content?: boolean;
              includeConstraints?: boolean;
            },
          ) => Promise<Array<{
            id: string;
            title: string;
            description: string;
            content?: string;
            path?: string;
          }>>;
        };
        const skills = await mod.retrieve(query, {
          library,
          topK: 5,
          includeConstraints: false,
        });
        const ids = skills.map((s) => s.id);
        onResult?.(query, ids);
        return {
          skills: skills.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            content: s.content || '',
          })),
        };
      } catch (err) {
        return { error: `检索失败: ${(err as Error).message}` };
      }
    },
  });
}

// ── System prompt builders ───────────────────────────────────────────────────────

export function buildSystemPrompt(library: string): string {
  const info = loadSkillInfo(library);
  const constraints = info.constraintsContent;

  if (library === 'x6') {
    return buildX6Prompt(constraints);
  }
  return buildG2G6Prompt(library, constraints);
}

function buildG2G6Prompt(library: string, constraints: string): string {
  return `你是 AntV ${library.toUpperCase()} v5 代码生成专家。根据用户描述生成准确、可运行的代码。

## 输出格式（严格遵守）

- **只输出纯 JavaScript 代码**，不要输出 HTML、Markdown 文档或任何解释文字
- 代码必须以 \`import\` 语句开头，从 \`@antv/${library}\` 引入所需模块
- 禁止使用 \`<script>\`、\`<!DOCTYPE>\`、\`<html>\` 等任何 HTML 标签
- 禁止使用 CDN URL 引入（如 unpkg、jsdelivr）
- container 变量直接使用，不要用字符串 'container'
- 如需代码块，只用 \`\`\`javascript 包裹，不用其他格式

## 工具使用（必须遵循）

你有一个工具可以搜索参考文档：

1. **search_skills(query)** - 搜索相关技能文档，根据自然语言查询自动返回最相关的文档

**工作流程**：
1. 分析用户需求，确定涉及的图表类型、transform、coordinate、交互等
2. **必须先调用 search_skills 搜索相关文档**，获取完整代码示例和配置细节后再生成代码
3. 搜索时使用具体的技术关键词组合（如 "柱状图 堆叠"、"tooltip 配置"、"brush 交互"）
4. 生成代码时严格参考文档中的示例写法

--- 核心约束 ---

${constraints}`;
}

function buildX6Prompt(constraints: string): string {
  return `你是 AntV X6 3.x 图编辑引擎代码生成专家。根据用户描述生成准确、可运行的代码。

## 输出格式（严格遵守）

- **只输出纯 JavaScript 代码**，不要输出 HTML、Markdown 文档或任何解释文字
- 代码使用 \`import { Graph, ... } from '@antv/x6'\` 风格的导入语句
- 所有使用到的类（Graph、Shape、Selection 等）都**必须出现在 import 语句中**
- 禁止使用 \`<script>\`、\`<!DOCTYPE>\`、\`<html>\` 等任何 HTML 标签
- container 变量已预先定义，**直接使用 container 变量**，禁止重新声明（禁止 \`const container = ...\`、\`let container = ...\`、\`document.getElementById\`）
- 如需代码块，只用 \`\`\`javascript 包裹，不用其他格式
- **禁止使用 TypeScript 语法**（interface、type、as、泛型等）

## 工具使用（必须遵循）

你有一个工具可以搜索参考文档：

1. **search_skills(query)** - 搜索相关技能文档，根据自然语言查询自动返回最相关的文档

**工作流程**：
1. 分析用户需求，确定涉及的图表/图编辑功能
2. **必须先调用 search_skills 搜索相关文档**，获取完整代码示例和配置细节后再生成代码
3. 搜索时使用具体的技术关键词（如 "node 自定义"、"edge 路由"、"selection 插件"）

${constraints ? '--- 核心约束 ---\n\n' + constraints : ''}`;
}
