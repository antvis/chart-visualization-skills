import { tool } from 'ai';
import { retrieve } from '@antv/chart-visualization-skills';
import { z } from 'zod';

const MAX_RETRIEVE_DOCUMENTS = 8;

interface RetrieveToolResult {
  id: string;
  title: string;
  description: string;
  path: string;
  content: string;
}

export function createRetrieveTool(defaultLibrary: string) {
  return tool({
    description: '通过 retrieve 召回最相关参考文档。',
    inputSchema: z.object({
      query: z.string().describe('用户需求或检索关键词'),
      library: z
        .enum(['g2', 'g6'])
        .optional()
        .describe('图表库名称，例如 g2、g6。').optional(),
      topk: z
        .number()
        .int()
        .min(1)
        .max(MAX_RETRIEVE_DOCUMENTS)
        .optional()
        .describe('召回文档数量，默认 5')
    }),
    execute: async ({ query, library, topk }) => {
      const retrievedSkills = retrieve(query, library ?? defaultLibrary, topk ?? 5, true);
      console.log(`Retrieved ${retrievedSkills.length} skills for query: "${query}"`);

      const results: RetrieveToolResult[] = [];
      for (const skill of retrievedSkills) {
        results.push({
          id: skill.id,
          title: skill.title,
          description: skill.description || '',
          path: skill.path,
          content: skill.content || '',
        });
      }
      return results;
    }
  });
}
