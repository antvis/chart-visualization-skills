import fs from 'fs';
import path from 'path';
import { tool } from 'ai';
import { z } from 'zod';
import {
  SAFE_CATEGORY_RE,
  SKILLS_DIR,
  isWithinDir,
  resolveLibraryDir
} from './shared';

interface ReferenceResult {
  id: string;
  title: string;
  description: string;
  category: string;
  path: string;
}

export function toolListReferences(
  args: { library: string; category?: string },
  verbose = false
): ReferenceResult[] {
  const { library, category } = args;
  const dir = resolveLibraryDir(library);
  const referencesDir = path.join(SKILLS_DIR, dir, 'references');
  if (!fs.existsSync(referencesDir)) return [];

  const results: ReferenceResult[] = [];
  if (category && !SAFE_CATEGORY_RE.test(category)) return [];
  const categories = category ? [category] : fs.readdirSync(referencesDir);

  for (const cat of categories) {
    if (!SAFE_CATEGORY_RE.test(cat)) continue;
    const catDir = path.join(referencesDir, cat);
    if (!isWithinDir(referencesDir, catDir)) continue;
    if (!fs.existsSync(catDir) || !fs.statSync(catDir).isDirectory()) continue;

    for (const file of fs.readdirSync(catDir).filter((f) => f.endsWith('.md'))) {
      const raw = fs.readFileSync(path.join(catDir, file), 'utf-8');
      const yamlMatch = raw.match(/^---\n([\s\S]*?)\n---/);
      let meta: { id?: string; title?: string; description?: string } = {};
      if (yamlMatch) {
        const yaml = yamlMatch[1];
        const idMatch = yaml.match(/^id:\s*["']?([^'"\n]+)["']?/m);
        const titleMatch = yaml.match(/^title:\s*["']?([^'"\n]+)["']?/m);
        const descMatch = yaml.match(
          /^description:\s*\|?\s*([\s\S]*?)(?=^[a-z]|\s*$)/m
        );
        meta = {
          id: idMatch ? idMatch[1].trim() : file.replace('.md', ''),
          title: titleMatch ? titleMatch[1].trim() : file,
          description: descMatch ? descMatch[1].trim().slice(0, 100) : ''
        };
      }
      results.push({
        ...meta,
        id: meta.id || file.replace('.md', ''),
        title: meta.title || file,
        description: meta.description || '',
        category: cat,
        path: `skills/${dir}/references/${cat}/${file}`
      });
    }
  }

  if (verbose) console.log(`   📋 列出 ${results.length} 个参考文档`);
  return results;
}

export function createListReferencesTool(chartLibrary: string) {
  return tool({
    description:
      '列出 references 目录下可用的参考文档文件。返回文件路径、标题、描述等信息。',
    inputSchema: z.object({
      category: z
        .string()
        .optional()
        .describe(
          '可选，过滤分类：marks、transforms、components、scales、coordinates、interactions、data、layouts、elements、behaviors、plugins、events、themes、patterns、recipes'
        )
    }),
    execute: async ({ category }) => {
      return toolListReferences({ library: chartLibrary, category });
    }
  });
}
