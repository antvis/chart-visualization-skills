/**
 * Generate agent — a fixed ToolLoopAgent that activates a skill, reads
 * referenced files, optionally queries the context service, then writes code.
 *
 * The agent is library-agnostic: it picks the right skill (g2/g6/x6) from the
 * user's description, and follows that skill's guidance.
 */

import { ToolLoopAgent, stepCountIs } from 'ai';
import { activeSkill } from './tools/active-skill.mjs';
import { readFile } from './tools/read-file.mjs';
import { curl } from './tools/curl.mjs';

const INSTRUCTIONS = `You are an AI Coding Agent that generates runnable AntV code from user requirements.

## Workflow

1. Call activeSkill to activate the matching skill (antv-g2-chart for G2 charts, antv-g6-graph for G6 graphs, antv-x6-editor for X6 diagrams) based on the user's description.
2. Use the guidance in the skill to pick the right chart/graph type, then readFile the referenced files under skills/<skill-name>/references/ as needed.
3. If local docs cannot cover an API, use curl to call the AntV context retrieval service (GET https://sive.antv.antgroup.com/api/v1/context/retrieve?query=...&library=g2|g6|x6).
4. Generate the final code.

## Hard requirements

- **Output only pure JavaScript code** — no HTML, Markdown docs, or explanatory text.
- Code must start with \`import\` statements, importing from the \`@antv/*\` package for the active library.
- No \`<script>\`, \`<!DOCTYPE>\`, \`<html>\` tags. No CDN URLs (unpkg, jsdelivr).
- Use the \`container\` variable directly (do not redeclare it, no string 'container').
- Follow the active skill's output conventions (import style, render call, X6 vs G2/G6 specifics).
- Wrap the code in a single \`\`\`javascript block if needed.`;

export function createGenerateAgent({ model, temperature }) {
  return new ToolLoopAgent({
    model,
    instructions: INSTRUCTIONS,
    temperature,
    tools: { activeSkill, readFile, curl },
    stopWhen: stepCountIs(30),
  });
}
