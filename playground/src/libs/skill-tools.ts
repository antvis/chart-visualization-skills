import { createLoadSkillTool } from './skill-tools/load-skill-tool';
import { createListReferencesTool } from './skill-tools/list-references-tool';
import { createReadFileTool } from './skill-tools/read-file-tool';

export function buildSystemPrompt(library: string): string {
  return `你是 AntV ${library.toUpperCase()} v5 代码生成专家。请按以下顺序使用工具：
1) 先调用 load_skill 获取主 Skill 概览；
2) 再调用 list_references 查找相关 references；
3) 最后用 read_file 读取关键文档内容；
然后基于召回内容输出可运行的完整代码。`;
}

export function createSkillTools(library: string) {
  return {
    load_skill: createLoadSkillTool(library),
    list_references: createListReferencesTool(library),
    read_file: createReadFileTool()
  };
}
