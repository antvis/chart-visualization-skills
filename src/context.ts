/**
 * Context Service - 提供全局 Context 实例
 *
 * 加载策略：
 * 1. 优先从 zvec 索引目录加载
 * 2. 如果没有 zvec，从 content 目录动态构建
 * 3. zvec 索引目录已存在时跳过 load 阶段，直接读取已有索引
 */

import path from 'path';
import fs from 'fs';
import { Context } from '@antv/context';
import matter from 'gray-matter';
import { synonyms } from './synonyms';

const ZVEC_DIR = path.resolve(__dirname, './.zvec');
const CONTENT_DIR = path.resolve(__dirname, './content');
const INDEX_CONTENT_DIR = path.join(ZVEC_DIR, '.content');
export const LIBRARIES = ['g2', 'g6', 'x6'] as const;

function walkMarkdownFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory()
      ? walkMarkdownFiles(fullPath)
      : entry.isFile() && entry.name.endsWith('.md')
        ? [fullPath]
        : [];
  });
}

/** Build focused documents for embedding/FTS while preserving source metadata. */
function prepareIndexContent(library: string): string {
  const sourceDir = path.join(CONTENT_DIR, library);
  const targetDir = path.join(INDEX_CONTENT_DIR, library);
  fs.rmSync(targetDir, { recursive: true, force: true });

  for (const sourcePath of walkMarkdownFiles(sourceDir)) {
    const relativePath = path.relative(CONTENT_DIR, sourcePath);
    const targetPath = path.join(INDEX_CONTENT_DIR, relativePath);
    const parsed = matter(fs.readFileSync(sourcePath, 'utf8'));
    const meta = parsed.data as Record<string, unknown>;
    const title = typeof meta.title === 'string' ? meta.title : '';
    const description = typeof meta.description === 'string' ? meta.description : '';
    const list = (key: string) => Array.isArray(meta[key]) ? (meta[key] as string[]).join(' ') : '';
    const focusedBody = parsed.content
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/^\|.*\|$/gm, ' ')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
    const retrievalContent = [
      title, title, title, title, title,
      description,
      list('tags'),
      list('use_cases'),
      list('anti_patterns'),
      focusedBody,
    ].filter(Boolean).join('\n');

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(
      targetPath,
      matter.stringify(retrievalContent, { ...meta, source_path: relativePath }),
    );
  }

  return path.join(targetDir, '**/*.md');
}

export function readContentFile(relativePath: string): string | undefined {
  const fullPath = path.resolve(CONTENT_DIR, relativePath);
  if (!fullPath.startsWith(`${CONTENT_DIR}${path.sep}`) || !fs.existsSync(fullPath)) return undefined;
  return matter(fs.readFileSync(fullPath, 'utf8')).content.trim();
}

function isZvecExists(library: string): boolean {
  return fs.existsSync(path.join(ZVEC_DIR, `${library}.zvec`));
}

// Context 单例
let _context: Context | null = null;
let _contextPromise: Promise<Context> | null = null;

/**
 * 获取全局 Context 实例
 */
export async function getContext(): Promise<Context> {
  if (_context) {
    return _context;
  }

  if (!_contextPromise) {
    _contextPromise = createContext().catch((error) => {
      _contextPromise = null;
      throw error;
    });
  }

  return _contextPromise;
}

async function createContext(): Promise<Context> {
  const context = await Context.create({
    vectorsDir: ZVEC_DIR,
    basePath: path.resolve(__dirname, '..'),
    queryExpansion: { synonyms },
    ftsFields: ['content'],
    ftsFieldWeights: { content: 1 },
  });

  try {
    for (const lib of LIBRARIES) {
      if (isZvecExists(lib)) continue;
      const pattern = prepareIndexContent(lib);
      try {
        await context.load(lib, pattern);
      } finally {
        fs.rmSync(path.join(INDEX_CONTENT_DIR, lib), { recursive: true, force: true });
      }
    }
  } catch (error) {
    await context.close();
    throw error;
  }

  _context = context;
  return context;
}

/**
 * 销毁 Context 实例
 */
export async function disposeContext(): Promise<void> {
  if (_context) {
    await _context.close();
    _context = null;
  }
  _contextPromise = null;
}
