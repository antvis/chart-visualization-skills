import { tool } from 'ai';
import { z } from 'zod';
import { loadSkillFile } from '../util';

/**
 * 加载 Skill 文档的工具。根据用户输入的库名称或者可视化意图，返回对应的 Skill 内容。
 */
export function createLoadSkillTool(library: string) {
  return tool({
    description: `按照用户的意图，加载对应的 Skill 文档。例如，用户选择 "g2" 图表库时，将加载 g2 的 Skill 文档。当前已有的 Skill 包括：
 - \`antv-g2-chart\`: Generate G2 v5 chart code. Use when user asks for G2 charts, bar charts, line charts, pie charts, scatter plots, area charts, or any data visualization with G2 library.
 - \`antv-g6-graph\`: Generate G6 v5 graph code. Use when user asks for G6 charts, graph charts, network diagrams, or any data visualization with G6 library.

请根据用户输入的库名称或者可视化意图，返回对应的 Skill 名称。`,
    inputSchema: z.object({
      library: z.enum(['antv-g2-chart', 'antv-g6-graph']).describe('当前图表库，例如 "g2" 或 "g6"').default('antv-g2-chart')
    }),
    execute: async ({ library }) => {
      const skillFilePath = `skills/${library}/SKILL.md`;
      console.log(`Loading skill for library: ${library} from path: ${skillFilePath}`);

      return {
        library,
        skill: skillFilePath,
        content: loadSkillFile(skillFilePath) || ''
      };
    }
  });
}
