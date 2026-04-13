import fs from 'fs';
import path from 'path';
import { tool } from 'ai';
import { retrieve } from '@antv/chart-visualization-skills';
import { z } from 'zod';

const ROOT_DIR = process.cwd().endsWith('playground')
  ? path.resolve(process.cwd(), '..')
  : process.cwd();
const MAX_RETRIEVE_DOCUMENTS = 8;

function loadSkillContent(relativePath: string): string | null {
  const fullPath = path.resolve(ROOT_DIR, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf-8');
}

function extractKeyContent(content: string): string {
  return content.replace(/^---[\s\S]*?---\n?/, '').trim();
}

interface RetrieveToolResult {
  id: string;
  title: string;
  description: string;
  path: string;
  content: string;
}

export function createRetrieveTool(library: string) {
  return tool({
    description: '通过 retrieve 召回最相关参考文档。',
    inputSchema: z.object({
      query: z.string().describe('用户需求或检索关键词'),
      topK: z
        .number()
        .int()
        .min(1)
        .max(MAX_RETRIEVE_DOCUMENTS)
        .optional()
        .describe('召回文档数量，默认 5')
    }),
    execute: async ({ query, topK }) => {
      const retrievedSkills = retrieve(query, library, topK ?? 5, true);
      const results: RetrieveToolResult[] = [];
      for (const skill of retrievedSkills) {
        const content = skill.content || loadSkillContent(skill.path);
        results.push({
          id: skill.id,
          title: skill.title,
          description: skill.description || '',
          path: skill.path,
          content: content ? extractKeyContent(content).slice(0, 10000) : ''
        });
      }
      return results;
    }
  });
}
