// Read a file in the repository.
import { tool } from 'ai';
import { z } from 'zod';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from '../const.mjs';

export const readFile = tool({
  description:
    'Read a file in the repository, e.g. skills/antv-g2-chart/references/xxx.md. ' +
    'Use paths referenced by the skill entry file.',
  inputSchema: z.object({
    path: z.string().describe('File path relative to the repo root'),
  }),
  execute: async ({ path: relPath }) => {
    try {
      return await fs.readFile(path.join(ROOT_DIR, relPath), 'utf-8');
    } catch {
      return `Error: file not found: ${relPath}`;
    }
  },
});
