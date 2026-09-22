// Activate a skill and return its entry content.
import { tool } from 'ai';
import { z } from 'zod';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from '../const.mjs';

const SKILLS = [
  {
    name: 'antv-g2-chart',
    description:
      'AntV G2 v5 统计图表库。当用户需要创建、绘制 G2 图表（折线图、柱状图、饼图、面积图、散点图、热力图、雷达图、桑基图、仪表盘等）时使用。提供 G2 v5 出码规范、图表选型、encode/scale/coordinate/transform 配置与 v4→v5 防幻觉对照。',
    entry: 'skills/antv-g2-chart/SKILL.md',
  },
  {
    name: 'antv-g6-graph',
    description:
      'AntV G6 v5 图/网络可视化库。当用户需要创建关系图、拓扑图、树形图、流程图、思维导图、力导向图等 node-edge 可视化时使用。提供 G6 v5 出码规范、布局、节点/边样式、behavior 与插件配置。',
    entry: 'skills/antv-g6-graph/SKILL.md',
  },
  {
    name: 'antv-x6-editor',
    description:
      'AntV X6 v3 图编辑引擎。当用户需要创建流程图、DAG、ER 图、血缘图、组织架构图、UML 图等可编辑 diagram（拖拽、连线、port、stencil、插件）时使用。提供 X6 v3 出码规范、节点/边自定义、插件与交互配置。',
    entry: 'skills/antv-x6-editor/SKILL.md',
  },
];

const skillList = SKILLS.map((s) => `- ${s.name}: ${s.description}`).join('\n');
const skillNames = SKILLS.map((s) => s.name).join(', ');

export const activeSkill = tool({
  description: `Activate a skill and return its content. Available skills:\n${skillList}`,
  inputSchema: z.object({
    name: z.string().describe(`Skill name, available: ${skillNames}`),
  }),
  execute: async ({ name }) => {
    const skill = SKILLS.find((s) => s.name === name);
    if (!skill) {
      return `Skill "${name}" not found. Available skills: ${skillNames}`;
    }
    try {
      const content = await fs.readFile(path.join(ROOT_DIR, skill.entry), 'utf-8');
      return `[Skill: ${skill.name}]\n${content}`;
    } catch {
      return `Error: skill entry file not found: ${skill.entry}`;
    }
  },
});
