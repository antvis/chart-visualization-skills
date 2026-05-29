import { createLoadSkillTool } from "./tools/load-skill-tool";
import { createReadFileTool } from "./tools/read-file-tool";
import { getLibraryDisplayName } from "./util";

interface LibraryProfile {
  pkg: string; // npm 包名
  entry: string; // 主入口类
  versionTag: string; // 在 prompt 中展示的版本（例如 v5 / v3）
  renderHint: string; // 关于 render 的硬性约束（X6 不存在 render）
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

export function buildSkillSystemPrompt(library: string): string {
  const libraryName = getLibraryDisplayName(library);
  const profile = getLibraryProfile(library);
  return `你是 AntV ${libraryName} ${profile.versionTag} 代码生成专家。有以下工具可以帮忙你完成任务：
  - 调用 \`load_skill\`，获取用户 Query 意图可能需要的 Skill 文档内容；
  - 调用 \`read_file\`，读取 Reference 文档内容，可以批量获取；

## 工作流程

每轮都先调用 load_skill 召回相关文档，按需调用 read_file 读取详细内容，再基于召回内容生成可运行的完整图表代码。

**重要**：每次用户提出新需求或修改请求时，你都必须重新调用 \`load_skill\` 召回与当前需求最相关的 Skill 文档，不要依赖之前轮次的召回结果。不同的需求需要不同的参考文档。

## Output Format

1. 只输出一个完整的 JavaScript 代码块，不需要任何解释文字
2. 使用 \`import { ${profile.entry} } from '${profile.pkg}'\`
3. \`container\` 必须为 'container'
4. ${profile.renderHint}
5. 禁止返回 HTML 代码
6. 关键配置处可加简短注释，但不要过度注释`;
}

export function createSkillModeTools(library: string) {
  return {
    load_skill: createLoadSkillTool(library),
    read_file: createReadFileTool(),
  };
}
