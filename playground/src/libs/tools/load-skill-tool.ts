import { tool } from "ai";
import { z } from "zod";
import { loadSkillFile } from "../util";

// 将短名（g2 / g6 / x6）规整到 skill 目录名
const SHORT_TO_SKILL_DIR: Record<string, string> = {
  g2: "antv-g2-chart",
  g6: "antv-g6-graph",
  x6: "antv-x6-editor",
};

const VALID_SKILL_DIRS = new Set(Object.values(SHORT_TO_SKILL_DIR));

function resolveSkillDir(input: string | undefined, fallback: string): string {
  const candidate = input || fallback;
  if (VALID_SKILL_DIRS.has(candidate)) return candidate;
  if (SHORT_TO_SKILL_DIR[candidate]) return SHORT_TO_SKILL_DIR[candidate];
  // 兜底：避免拼出不存在的路径
  return SHORT_TO_SKILL_DIR.g2;
}

/**
 * 加载 Skill 文档的工具。根据用户输入的库名称或者可视化意图，返回对应的 Skill 内容。
 */
export function createLoadSkillTool(defaultLibrary: string) {
  return tool({
    description: `按照用户的意图，加载对应的 Skill 文档。例如，用户选择 "g2" 图表库时，将加载 g2 的 Skill 文档。当前已有的 Skill 包括：
 - \`antv-g2-chart\`: Generate G2 v5 chart code. Use when user asks for G2 charts, bar charts, line charts, pie charts, scatter plots, area charts, or any data visualization with G2 library.
 - \`antv-g6-graph\`: Generate G6 v5 graph code. Use when user asks for G6 charts, graph charts, network diagrams, or any data visualization with G6 library.
 - \`antv-x6-editor\`: Generate X6 v3 graph editor code. Use when user asks for X6 flowchart, DAG, ER diagram, lineage, org chart, UML, or any node-edge editor with the X6 library.

请根据用户输入的库名称或者可视化意图，返回对应的 Skill 名称。`,
    inputSchema: z.object({
      library: z
        .enum(["antv-g2-chart", "antv-g6-graph", "antv-x6-editor"])
        .describe(
          '当前图表库，例如 "antv-g2-chart"、"antv-g6-graph" 或 "antv-x6-editor"',
        )
        .default("antv-g2-chart")
        .optional(),
    }),
    execute: async ({ library }) => {
      const skillDir = resolveSkillDir(library, defaultLibrary);
      const skillFilePath = `skills/${skillDir}/SKILL.md`;
      console.log(
        `Loading skill for library: ${skillDir} from path: ${skillFilePath}`,
      );

      return {
        library: skillDir,
        skill: skillFilePath,
        content: loadSkillFile(skillFilePath) || "",
      };
    },
  });
}
