import { createLoadSkillTool } from './tools/load-skill-tool';
import { createReadFileTool } from './tools/read-file-tool';
import { getLibraryDisplayName } from './util';

export function buildSkillSystemPrompt(library: string): string {
  const libraryName = getLibraryDisplayName(library);
  return `你是 AntV ${libraryName} v5 代码生成专家。有以下工具可以帮忙你完成任务：
  - 调用 \`load_skill\`，获取用户 Query 意图可能需要的 Skill 文档内容；
  - 调用 \`read_file\`，读取 Reference 文档内容，可以批量获取；

## 工作流程

每轮都先调用 load_skill 召回相关文档，按需调用 read_file 读取详细内容，再基于召回内容生成可运行的完整图表代码。

**重要**：每次用户提出新需求或修改请求时，你都必须重新调用 \`load_skill\` 召回与当前需求最相关的 Skill 文档，不要依赖之前轮次的召回结果。不同的需求需要不同的参考文档。

## Output Format

1. 只输出一个完整的 JavaScript 代码块，不需要任何解释文字
2. 使用 \`import { ${libraryName === 'G6' ? 'Graph' : 'Chart'} } from '@antv/${libraryName.toLowerCase()}'\`
3. \`container\` 必须为 'container'
4. 代码末尾必须有 \`chart.render();\`
5. 禁止返回 HTML 代码
6. 关键配置处可加简短注释，但不要过度注释;`;
}

export function createSkillModeTools(library: string) {
  return {
    load_skill: createLoadSkillTool(library),
    read_file: createReadFileTool()
  };
}
