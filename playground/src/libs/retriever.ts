/**
 * Skill retriever for playground
 */

import fs from 'fs';
import path from 'path';
import { retrieve } from '@antv/chart-visualization-skills';
import type { Skill } from '@antv/chart-visualization-skills';

const ROOT_DIR = path.resolve(__dirname, '../../..');

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
  const retrievedSkills = retrieve(query, library, topK);

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
