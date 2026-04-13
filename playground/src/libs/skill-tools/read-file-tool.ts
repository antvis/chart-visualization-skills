import path from 'path';
import { tool } from 'ai';
import { z } from 'zod';
import { extractKeySections, loadSkillFile } from './shared';

interface SkillReadResult {
  id: string;
  path: string;
  content?: string;
  error?: string;
}

export function toolReadFile(
  args: { paths: string[] },
  verbose = false
): SkillReadResult[] {
  return args.paths.slice(0, 4).map((skillPath) => {
    const content = loadSkillFile(skillPath, verbose);
    const fileName = path.basename(skillPath, '.md');
    if (!content) return { path: skillPath, error: 'File not found', id: fileName };
    const extracted = extractKeySections(content).slice(0, 10000);
    if (verbose) console.log(`   📖 加载: ${fileName} (${extracted.length} 字符)`);
    return { id: fileName, path: skillPath, content: extracted };
  });
}

export function createReadFileTool() {
  return tool({
    description: '根据 references 索引路径读取文档内容。一次最多读取 4 个文件。',
    inputSchema: z.object({
      paths: z
        .array(z.string())
        .max(4)
        .describe(
          'Skill 文件路径列表，如 ["skills/antv-g2-chart/references/marks/g2-mark-interval-basic.md"]'
        )
    }),
    execute: async ({ paths }) => {
      return toolReadFile({ paths });
    }
  });
}
