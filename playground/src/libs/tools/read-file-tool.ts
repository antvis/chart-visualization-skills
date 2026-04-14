import { tool } from 'ai';
import { z } from 'zod';
import { loadSkillFile } from '../util';

export function createReadFileTool() {
  return tool({
    description: '根据 skill references 索引路径批量读取文档内容，支持一次最多读取 10 个文件。',
    inputSchema: z.object({
      paths: z
        .array(z.string())
        .min(1)
        .max(10)
        .describe(
          '需要读取的文件路径数组，例如：["skills/antv-g2-chart/references/marks/g2-mark-interval-basic.md"]'
        )
    }),
    execute: async ({ paths }) => {
      console.log(`Reading files for paths: ${paths.join(', ')}`);

      return paths.map((p) => {
        const content = loadSkillFile(p, false) || '';
        console.log(`Read file: ${p}, content length: ${content.length}`);
        return { id: p, path: p, content };
      });
    }
  });
}
