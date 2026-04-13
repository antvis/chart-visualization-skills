import { tool } from 'ai';
import { z } from 'zod';
import { loadMainSkill, resolveLibraryDir } from './shared';

interface LoadSkillResult {
  library: string;
  skillPath: string;
  content: string;
}

export function toolLoadSkill(args: { library: string }): LoadSkillResult {
  const { library } = args;
  const dir = resolveLibraryDir(library);
  if (!dir) {
    return {
      library,
      skillPath: '',
      content: ''
    };
  }
  return {
    library,
    skillPath: `skills/${dir}/SKILL.md`,
    content: loadMainSkill(library).slice(0, 12000)
  };
}

export function createLoadSkillTool(chartLibrary: string) {
  return tool({
    description: '加载当前图表库的主 Skill 文档内容（SKILL.md）。',
    inputSchema: z.object({}),
    execute: async () => {
      return toolLoadSkill({ library: chartLibrary });
    }
  });
}
