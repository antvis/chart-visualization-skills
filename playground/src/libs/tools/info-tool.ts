import { tool } from 'ai';
import { info } from '@antv/chart-visualization-skills';
import { z } from 'zod';

export function createInfoTool(defaultLibrary: string) {
  return tool({
    description: '调用 info API，基于 library 获取该图表库相关信息与要求文档。',
    inputSchema: z.object({
      library: z
        .enum(['g2', 'g6'])
        .optional()
        .describe('图表库名称，例如 g2、g6。')
    }),
    execute: async ({ library = defaultLibrary }) => {
      console.log(`Loaded info for library: ${library}`);
      return {
        library,
        content: info(library)
      };
    }
  });
}