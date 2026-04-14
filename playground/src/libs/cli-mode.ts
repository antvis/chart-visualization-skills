import { getLibraryDisplayName } from './util';
import { createInfoTool } from './tools/info-tool';
import { createRetrieveTool } from './tools/retrieve-tool';

export function buildCliSystemPrompt(library: string): string {
  const libraryName = getLibraryDisplayName(library);
  return `你是 AntV ${libraryName} v5 专家。你可以使用以下工具获取技术文档内容，帮你完成任务：
  - 调用 \`info\`，获取当前图表库相关信息与要求文档；
  - 调用 \`retrieve\`，通过用户需求或检索关键词，召回最相关的参考文档，支持设置召回文档数量；

可以先调用 info，再调用 retrieve， 然后基于召回内容生成可运行的完整图表代码，遵从召回文档中的注意事项。
`;
}

export function createCliModeTools(library: string) {
  return {
    info: createInfoTool(library),
    retrieve: createRetrieveTool(library)
  };
}
