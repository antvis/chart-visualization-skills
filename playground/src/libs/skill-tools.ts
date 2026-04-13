import { createListReferencesTool } from './skill-tools/list-references-tool';
import { createReadSkillsTool } from './skill-tools/read-skills-tool';
import { loadMainSkill } from './skill-tools/shared';

export function buildSystemPrompt(library: string): string {
  const skillContent = loadMainSkill(library);

  return `你是 AntV G2 v5 代码生成专家。根据用户描述生成准确、可运行的代码。

--- 知识库概览 ---

${skillContent}`;
}

export function createSkillTools(library: string) {
  return {
    list_references: createListReferencesTool(library),
    read_skills: createReadSkillsTool()
  };
}
