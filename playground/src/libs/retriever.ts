/**
 * Skill retriever for playground
 */

import fs from 'fs';
import path from 'path';
import { retrieve } from '@antv/chart-visualization-skills';
import type { Skill } from '@antv/chart-visualization-skills';

// process.cwd() is reliable in Next.js server context; __dirname is not (webpack rewrites it)
const ROOT_DIR = process.cwd().endsWith('playground')
  ? path.resolve(process.cwd(), '..')
  : process.cwd();

// Index files live in dist/index/ relative to the repo root
const INDEX_DIR = path.resolve(ROOT_DIR, 'dist/index');

function loadSkillContent(relativePath: string): string | null {
  const fullPath = path.resolve(ROOT_DIR, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf-8');
}

function extractKeyContent(content: string): string {
  return content.replace(/^---[\s\S]*?---\n?/, '').trim();
}

export interface BuildPromptResult {
  systemPrompt: string;
  retrievedSkills: Skill[];
}

export function buildPrompt(
  query: string,
  opts: { library?: string; topK?: number } = {}
): BuildPromptResult {
  const { library = 'g2', topK = 5 } = opts;
  const retrievedSkills = retrieve(query, library, topK, INDEX_DIR);

  let skillContext = '';
  for (const skill of retrievedSkills) {
    const content = loadSkillContent(skill.path);
    skillContext += `\n\n### Skill: ${skill.title} (${skill.id})\n${
      content ? extractKeyContent(content) : skill.description || ''
    }`;
  }

  const systemPrompt =
    `你是 AntV ${library.toUpperCase()} v5 专家，请根据以下参考技能生成可运行的图表代码。` +
    (skillContext || '\n\n（暂无相关内容）');

  return { systemPrompt, retrievedSkills };
}
