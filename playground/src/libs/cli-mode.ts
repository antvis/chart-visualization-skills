import { getLibraryDisplayName } from "./util";
import { createRetrieveTool } from "./tools/retrieve-tool";

interface LibraryProfile {
  pkg: string;
  entry: string;
  versionTag: string;
  renderHint: string;
}

const LIBRARY_PROFILES: Record<string, LibraryProfile> = {
  G2: {
    pkg: "@antv/g2",
    entry: "Chart",
    versionTag: "v5",
    renderHint: "代码末尾必须有 `chart.render();`",
  },
  G6: {
    pkg: "@antv/g6",
    entry: "Graph",
    versionTag: "v5",
    renderHint: "代码末尾必须有 `graph.render();`",
  },
  X6: {
    pkg: "@antv/x6",
    entry: "Graph",
    versionTag: "v3",
    renderHint:
      "禁止调用 `graph.render()`（X6 3.x 中 new Graph / addNode / addEdge / fromJSON 均自动渲染）",
  },
};

function getLibraryProfile(library: string): LibraryProfile {
  const displayName = getLibraryDisplayName(library);
  return LIBRARY_PROFILES[displayName] ?? LIBRARY_PROFILES.G2;
}

export function buildCliSystemPrompt(library: string): string {
  const libraryName = getLibraryDisplayName(library);
  const profile = getLibraryProfile(library);
  return `你是 AntV ${libraryName} ${profile.versionTag} 专家。你可以使用以下工具获取技术文档内容，帮你完成任务：
  - 调用 \`retrieve\`，通过用户需求或检索关键词，召回最相关的参考文档；结果首位自动包含核心约束（使用规则、禁止写法、常见错误），无需单独获取；

## 工作流程

每轮调用 \`retrieve\` 召回与当前需求最相关的参考文档，再基于召回内容生成可运行的完整图表代码，遵从文档中的注意事项。

**重要**：每次用户提出新需求或修改请求时，必须重新调用 \`retrieve\`，不要依赖之前轮次的召回结果。

## Output Format

1. 只输出一个完整的 JavaScript 代码块，不需要任何解释文字
2. 使用 \`import { ${profile.entry} } from '${profile.pkg}'\`
3. \`container\` 必须为 'container'
4. ${profile.renderHint}
5. 禁止返回 HTML 代码
6. 关键配置处可加简短注释，但不要过度注释`;
}

export function createCliModeTools(library: string) {
  return {
    retrieve: createRetrieveTool(library),
  };
}
