import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd().includes('playground')
  ? path.resolve(process.cwd(), '..')
  : path.resolve(process.cwd());

export const SKILLS_DIR = path.join(ROOT_DIR, 'skills');
export const SAFE_CATEGORY_RE = /^[a-z0-9_-]+$/i;
const SAFE_LIBRARY_RE = /^[a-z0-9_-]+$/i;

const LIBRARY_DIR: Record<string, string> = {
  g2: 'antv-g2-chart'
};

const LIBRARY_DISPLAY_NAME: Record<string, string> = {
  g2: 'G2',
  g6: 'G6',
  'antv-g2-chart': 'G2',
  'antv-g6-graph': 'G6'
};

export function resolveLibraryDir(library: string): string {
  if (LIBRARY_DIR[library]) return LIBRARY_DIR[library];
  if (!SAFE_LIBRARY_RE.test(library)) return '';
  return library;
}

export function getLibraryDisplayName(library: string): string {
  return LIBRARY_DISPLAY_NAME[library] ?? library;
}

export function isWithinDir(parentDir: string, targetPath: string): boolean {
  const normalizedParent = path.resolve(parentDir);
  const normalizedTarget = path.resolve(targetPath);
  return (
    normalizedTarget === normalizedParent ||
    normalizedTarget.startsWith(`${normalizedParent}${path.sep}`)
  );
}

export function loadSkillFile(
  skillPath: string,
  verbose = false
): string | null {
  const candidatePath = skillPath.startsWith('/')
    ? skillPath
    : path.join(ROOT_DIR, skillPath);
  const fullPath = path.resolve(candidatePath);

  if (!fullPath.endsWith('.md')) {
    if (verbose) console.log(`   ⚠️  Invalid skill path: ${skillPath}`);
    return null;
  }

  if (!isWithinDir(SKILLS_DIR, fullPath)) {
    if (verbose) console.log(`   ⚠️  Invalid skill path: ${skillPath}`);
    return null;
  }
  if (!fs.existsSync(fullPath)) {
    if (verbose) console.log(`   ⚠️  File not found: ${fullPath}`);
    return null;
  }
  return fs.readFileSync(fullPath, 'utf-8').replace(/^---[\s\S]*?---\n/, '');
}

export function loadMainSkill(library: string): string {
  const dir = resolveLibraryDir(library);
  if (!dir) return '';
  return loadSkillFile(path.join(SKILLS_DIR, dir, 'SKILL.md')) || '';
}

const TARGET_SECTIONS = [
  '最小可运行示例',
  '基本用法',
  '核心概念',
  'API 速查',
  '完整配置',
  '常见错误',
  '变体用法',
  '完整 Spec',
  '常见变体'
];

export function extractKeySections(content: string, maxChars = 5000): string {
  const lines = content.split('\n');
  const sections: string[] = [];
  let inSection = false;
  let sectionLevel = 0;
  let currentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2];
      if (TARGET_SECTIONS.some((t) => title.includes(t))) {
        if (currentLines.length > 0 && inSection)
          sections.push(currentLines.join('\n'));
        inSection = true;
        sectionLevel = level;
        currentLines = [line];
      } else if (inSection && level <= sectionLevel) {
        sections.push(currentLines.join('\n'));
        inSection = false;
        sectionLevel = 0;
        currentLines = [];
      } else if (inSection) {
        currentLines.push(line);
      }
    } else if (inSection) {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0 && inSection) sections.push(currentLines.join('\n'));

  const B = '```';
  const withCode = sections.filter((s) => s.includes(B));
  const withoutCode = sections.filter((s) => !s.includes(B));
  return [...withCode, ...withoutCode]
    .slice(0, 4)
    .join('\n\n')
    .slice(0, maxChars);
}
