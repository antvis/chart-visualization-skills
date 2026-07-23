/**
 * Context Service - 提供全局 Context 实例
 *
 * 加载策略：
 * 1. 优先从 zvec 索引目录加载
 * 2. 如果没有 zvec，从 content 目录动态构建
 */

import path from 'path';
import { Context } from '@antv/context';
import { synonyms } from './synonyms';

const ZVEC_DIR = path.resolve(__dirname, '../zvec');
const CONTENT_DIR = path.resolve(__dirname, '../content');

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

  await _context.load('g2', path.join(CONTENT_DIR, 'g2/**/*.md'));
  await _context.load('g6', path.join(CONTENT_DIR, 'g6/**/*.md'));
  await _context.load('x6', path.join(CONTENT_DIR, 'x6/**/*.md'));

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