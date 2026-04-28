import { tool } from 'ai';
import { info } from '@antv/chart-visualization-skills';
import { z } from 'zod';

export function createInfoTool(defaultLibrary: string) {
  return tool({
    description: '获取图表库的核心约束文档（使用规则、禁止写法、常见错误）。首轮必须调用。',
    inputSchema: z.object({
      library: z
        .enum(['g2', 'g6'])
        .optional()
        .describe('图表库名称，例如 g2、g6。')
    }),
    execute: async ({ library = defaultLibrary }) => {
      console.log(`Loaded info for library: ${library}`);
      const skillInfo = info(library);
      return {
        library,
        content: skillInfo?.constraintsContent ?? skillInfo?.content ?? '',
      };
    }
  });
}
