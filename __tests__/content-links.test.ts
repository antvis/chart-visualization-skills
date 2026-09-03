import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';

/**
 * 防回归：校验 src/content 下所有 .md 文档 frontmatter 的 `related:` 引用
 * 必须指向一个真实存在的文档 `id`。死链会被 agent 在 retrieve 时拉取到不存在的
 * 知识，污染上下文，因此用此测试在 CI 中拦截。
 */

const CONTENT_DIR = path.resolve(__dirname, '..', 'src', 'content');

/** 递归收集 src/content 下的 .md 文件（不引入额外依赖）。 */
function listMarkdownFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listMarkdownFiles(full));
    else if (e.isFile() && e.name.endsWith('.md')) out.push(full);
  }
  return out;
}

const files = listMarkdownFiles(CONTENT_DIR);

interface Frontmatter {
  id?: string;
  related: string[];
}

/** 使用与内容加载一致的 YAML 语义解析单文件 frontmatter。 */
function parseFrontmatter(filePath: string): Frontmatter | null {
  const text = fs.readFileSync(filePath, 'utf-8');
  if (!text.startsWith('---')) return null;
  const data = matter(text).data as { id?: unknown; related?: unknown };
  const id = typeof data.id === 'string' ? data.id.trim() : undefined;
  const related = Array.isArray(data.related)
    ? data.related.filter((target): target is string => typeof target === 'string')
    : [];
  return { id, related };
}

describe('content related-link integrity', () => {
  const documents = files.map((file) => ({
    relativePath: path.relative(CONTENT_DIR, file),
    frontmatter: parseFrontmatter(file),
  }));
  const allIds = new Set<string>();
  for (const document of documents) {
    if (document.frontmatter?.id) {
      allIds.add(document.frontmatter.id);
    }
  }

  it('every related: target resolves to an existing doc id', () => {
    const broken: { from: string; target: string; fromId?: string }[] = [];
    for (const document of documents) {
      const fm = document.frontmatter;
      if (!fm) continue;
      for (const target of fm.related) {
        if (!allIds.has(target)) {
          broken.push({ from: document.relativePath, target, fromId: fm.id });
        }
      }
    }
    if (broken.length) {
      const msg = broken.map(b => `  ${b.from} (id=${b.fromId}) -> "${b.target}"`).join('\n');
      throw new Error(`Broken related: links (${broken.length}):\n${msg}`);
    }
    expect(broken).toHaveLength(0);
  });

  it('every doc declares a unique id', () => {
    const seen = new Map<string, string>();
    const invalid: string[] = [];
    for (const document of documents) {
      const id = document.frontmatter?.id;
      if (!id) {
        invalid.push(`${document.relativePath}: missing id`);
      } else if (seen.has(id)) {
        invalid.push(`${id} (in ${document.relativePath} and ${seen.get(id)})`);
      } else {
        seen.set(id, document.relativePath);
      }
    }
    expect(invalid).toHaveLength(0);
  });
});
