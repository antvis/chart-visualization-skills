/**
 * SkillRetriever — Optimized retriever for playground
 */

import fs from 'fs';
import path from 'path';
import { retrieve as coreRetrieve } from 'chart-visualization-skills';
import type { Skill } from 'chart-visualization-skills';

export type { Skill };

export interface SkillIndex {
  library: string;
  version: string;
  generated: string;
  total: number;
  skills: Skill[];
}

const ROOT_DIR = path.resolve(__dirname, '../../..');
const DEFAULT_INDEX_DIR = path.join(ROOT_DIR, 'dist', 'index');

interface RetrieverOptions {
  indexDir?: string;
  skillsDir?: string;
  promptsDir?: string | null;
}

interface BuildPromptResult {
  systemPrompt: string;
  primarySkills: Skill[];
  extraSkills: Skill[];
}

export function loadIndex(library: string, indexDir?: string): SkillIndex {
  const dir = indexDir || DEFAULT_INDEX_DIR;
  const indexFile = path.join(dir, `${library}.index.json`);
  if (!fs.existsSync(indexFile)) {
    throw new Error(`Index file not found: ${indexFile}`);
  }
  return JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
}

export function retrieve(
  query: string,
  opts: { library?: string; topK?: number; indexDir?: string } = {}
): Skill[] {
  const { library = 'g2', topK = 7, indexDir } = opts;
  return coreRetrieve(query, library, topK);
}

export class SkillRetriever {
  private indexDir: string;
  private skillsDir: string;
  private promptsDir: string | null;

  constructor(opts: RetrieverOptions = {}) {
    this.indexDir = opts.indexDir || DEFAULT_INDEX_DIR;
    this.skillsDir = opts.skillsDir || path.join(ROOT_DIR, 'skills');
    this.promptsDir = opts.promptsDir || null;
  }

  loadIndex(library: string = 'g2'): SkillIndex {
    return loadIndex(library, this.indexDir);
  }

  retrieve(
    query: string,
    opts: { library?: string; topK?: number } = {}
  ): Skill[] {
    return retrieve(query, { ...opts, indexDir: this.indexDir });
  }

  loadSkillContent(relativePath: string): string | null {
    const fullPath = path.resolve(ROOT_DIR, relativePath);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, 'utf-8');
  }

  extractKeyContent(content: string): string {
    return content.replace(/^---[\s\S]*?---\n?/, '').trim();
  }

  detectLibrary(query: string): 'g6' | 'g2' {
    const g6Keywords = [
      '图谱',
      '关系图',
      '流程图',
      '拓扑',
      '网络图',
      '有向图',
      '无向图',
      'graph',
      'network',
      'flow',
      'topology',
      'node',
      'edge',
      'force layout'
    ];
    const lower = query.toLowerCase();
    return g6Keywords.some((k) => lower.includes(k)) ? 'g6' : 'g2';
  }

  buildPrompt(
    query: string,
    opts: { library?: string; topK?: number; maxExtra?: number } = {}
  ): BuildPromptResult {
    const { library = 'g2', topK = 5, maxExtra = 2 } = opts;

    const allSkills = this.retrieve(query, { library, topK: topK + maxExtra });
    const primarySkills = allSkills.slice(0, topK);
    const extraSkills = allSkills.slice(topK, topK + maxExtra);

    let skillContext = '';
    for (const skill of primarySkills) {
      const content = this.loadSkillContent(skill.path);
      if (content) {
        skillContext += `\n\n### Skill: ${skill.title} (${skill.id})\n${this.extractKeyContent(content)}`;
      } else {
        skillContext += `\n\n### Skill: ${skill.title} (${skill.id})\n${skill.description || ''}`;
      }
    }

    const promptFile = this.promptsDir
      ? path.join(this.promptsDir, `${library}-system-prompt.md`)
      : path.join(ROOT_DIR, 'prompts', `${library}-system-prompt.md`);

    let systemPrompt = fs.existsSync(promptFile)
      ? fs.readFileSync(promptFile, 'utf-8')
      : `你是 AntV ${library.toUpperCase()} v5 专家，请根据以下参考技能生成可运行的图表代码。`;

    systemPrompt = systemPrompt.replace(
      '{RETRIEVED_SKILLS_CONTENT}',
      skillContext || '（暂无相关内容）'
    );

    return { systemPrompt, primarySkills, extraSkills };
  }
}

export default SkillRetriever;
