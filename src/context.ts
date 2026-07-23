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
import { synonyms } from './synonyms';

const ZVEC_DIR = path.resolve(__dirname, './.zvec');
const CONTENT_DIR = path.resolve(__dirname, './content');

function isZvecExists(library: string): boolean {
  return fs.existsSync(path.join(ZVEC_DIR, `${library}.zvec`));
}

// Context 单例
let _context: Context | null = null;

/**
 * 获取全局 Context 实例
 */
export async function getContext(): Promise<Context> {
  if (_context) {
    return _context;
  }

  _context = await Context.create({
    vectorsDir: ZVEC_DIR,
    basePath: path.resolve(__dirname, '..'),
    queryExpansion: { synonyms },
    ftsFields: ['content'],
    ftsFieldWeights: { content: 1 },
  });

  // zvec 索引目录已存在时跳过 load（避免重复嵌入/构建），直接读取已有索引即可
  const libs = ['g2', 'g6', 'x6'];
  for (const lib of libs) {
    if (isZvecExists(lib)) {
      continue;
    }
    await _context.load(lib, path.join(CONTENT_DIR, lib, '**/*.md'));
  }

  return _context;
}

/**
 * 销毁 Context 实例
 */
export async function disposeContext(): Promise<void> {
  if (_context) {
    await _context.close();
    _context = null;
  }
}