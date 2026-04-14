import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd().includes('playground')
  ? path.resolve(process.cwd(), '..')
  : path.resolve(process.cwd());

export function loadSkillFile(
  skillPath: string,
  verbose = false
): string | null {
  const normalizedPath = skillPath.replace(/\\/g, '/').replace(/^\/+/, '');

  const fullPath = path.resolve(path.join(ROOT_DIR, normalizedPath));

  if (!fullPath.endsWith('.md')) {
    if (verbose) console.log(`   ⚠️  Invalid skill path: ${skillPath}`);
    return null;
  }

  if (!fs.existsSync(fullPath)) {
    if (verbose) console.log(`   ⚠️  File not found: ${fullPath}`);
    return null;
  }
  return fs.readFileSync(fullPath, 'utf-8').replace(/^---[\s\S]*?---\n/, '');
}


const LIBRARY_DISPLAY_NAME: Record<string, string> = {
  g2: 'G2',
  g6: 'G6',
  'antv-g2-chart': 'G2',
  'antv-g6-graph': 'G6'
};

export function getLibraryDisplayName(library: string): string {
  return LIBRARY_DISPLAY_NAME[library] ?? library;
}
