import { getLibraryDisplayName } from './tools/shared';
import { createRetrieveTool } from './tools/retrieve-tool';

export function buildCliSystemPrompt(library: string): string {
  const libraryName = getLibraryDisplayName(library);
  return `你是 AntV ${libraryName} v5 专家。
你可以使用 retrieve 工具检索与用户需求最相关的参考文档。
请先调用 retrieve，再基于召回内容生成可运行的完整图表代码。`;
}

export function createCliModeTools(library: string) {
  return {
    retrieve: createRetrieveTool(library)
  };
}
