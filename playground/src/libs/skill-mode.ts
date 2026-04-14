import { createLoadSkillTool } from './tools/load-skill-tool';
import { createReadFileTool } from './tools/read-file-tool';
import { getLibraryDisplayName } from './util';

export function buildSkillSystemPrompt(library: string): string {
  const libraryName = getLibraryDisplayName(library);
  return `你是 AntV ${libraryName} v5 代码生成专家。有以下工具可以帮忙你完成任务：
  - 调用 \`load_skill\`，获取用户 Query 意图可能需要的 Skill 文档内容；
  - 调用 \`read_file\`，读取 Reference 文档内容，可以批量获取；

然后基于召回内容输出可运行的完整代码。`;
}

export function createSkillModeTools(library: string) {
  return {
    load_skill: createLoadSkillTool(library),
    read_file: createReadFileTool()
  };
}
