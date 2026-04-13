#!/usr/bin/env node

/**
 * Build script: generates JSON index files from skill markdown files.
 * Run independently before publishing: `node dist/scripts/build.js`
 */

import fs from 'fs';
import path from 'path';
import type { Skill, SkillIndex, FrontMatter } from '../core/types';

// Allow overriding the project root via --root=<dir> (used by harness when running inside a worktree)
const rootArg = process.argv.find((a) => a.startsWith('--root='));
const PKG_ROOT = rootArg ? path.resolve(rootArg.slice('--root='.length)) : path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(PKG_ROOT, 'skills');
const INDEX_DIR = path.join(PKG_ROOT, 'dist', 'index');

const LIBRARY_PATHS: Record<string, string> = {
  g2: 'antv-g2-chart/references',
  g6: 'antv-g6-graph/references',
};

function parseFrontMatter(content: string): FrontMatter {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { meta: {}, body: content };

  const yamlStr = match[1];
  const body = content.slice(match[0].length).trim();
  const meta: Record<string, any> = {};

  let currentKey: string | null = null;
  let currentArray: string[] | null = null;

  for (const line of yamlStr.split('\n')) {
    if (line.trim().startsWith('#')) continue;

    if (line.match(/^\s+-\s+/)) {
      const value = line.replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, '').trim();
      if (currentArray) currentArray.push(value);
      continue;
    }

    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kvMatch) {
      const [, key, value] = kvMatch;
      currentKey = key;
      currentArray = null;

      if (value.trim() === '' || value.trim() === '|') {
        meta[key] = [];
        currentArray = meta[key];
      } else {
        meta[key] = value.replace(/^["']|["']$/g, '').trim();
        currentArray = null;
      }
    } else if (currentKey && line.startsWith('  ') && currentArray) {
      if (Array.isArray(meta[currentKey])) {
        meta[currentKey] = meta[currentKey].join(' ') + ' ' + line.trim();
      }
    }
  }

  return { meta, body };
}

function extractSections(markdown: string, sectionTitles: string[]): string {
  const sections: string[] = [];
  const lines = markdown.split('\n');
  let inSection = false;
  let currentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      const title = headingMatch[1];
      if (sectionTitles.some(t => title.includes(t))) {
        inSection = true;
        currentLines = [line];
      } else if (inSection && line.startsWith('#')) {
        sections.push(currentLines.join('\n'));
        inSection = false;
        currentLines = [];
      }
    } else if (inSection) {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0 && inSection) {
    sections.push(currentLines.join('\n'));
  }

  return sections.join('\n\n');
}

function buildEmbeddingText(meta: Record<string, any>, body: string): string {
  const parts = [
    `Title: ${meta.title || ''}`,
    `Description: ${meta.description || ''}`,
    `Tags: ${Array.isArray(meta.tags) ? meta.tags.join(', ') : meta.tags || ''}`,
    `Use Cases: ${Array.isArray(meta.use_cases) ? meta.use_cases.join('; ') : meta.use_cases || ''}`,
    `Anti-patterns: ${Array.isArray(meta.anti_patterns) ? meta.anti_patterns.join('; ') : ''}`,
  ];

  const coreContent = extractSections(body, [
    'Core Concepts', 'Minimal Runnable Example', 'API Quick Reference', 'Common Errors',
    '核心概念', '最小可运行示例', 'API 速查', '常见错误',
  ]);

  if (coreContent) parts.push(coreContent.slice(0, 1000));

  return parts.filter(Boolean).join('\n');
}

function walkDir(dir: string, library: string): Skill[] {
  const skills: Skill[] = [];
  if (!fs.existsSync(dir)) return skills;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      skills.push(...walkDir(fullPath, library));
    } else if (entry.isFile() && entry.name.endsWith('.md') && !['README.md', 'CONTRIBUTING.md'].includes(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const { meta, body } = parseFrontMatter(content);

      if (library && meta.library && meta.library !== library) continue;
      if (!meta.id) {
        console.warn(`Skipping (missing id): ${fullPath}`);
        continue;
      }

      const relativePath = path.relative(PKG_ROOT, fullPath);

      skills.push({
        id: meta.id,
        title: meta.title || '',
        description: (meta.description || '').replace(/\n\s*/g, ' ').trim(),
        library: meta.library || '',
        version: meta.version || '',
        category: meta.category || '',
        subcategory: meta.subcategory || '',
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        difficulty: meta.difficulty || 'beginner',
        path: relativePath.replace(/\\/g, '/'),
        use_cases: Array.isArray(meta.use_cases) ? meta.use_cases : [],
        anti_patterns: Array.isArray(meta.anti_patterns) ? meta.anti_patterns : [],
        related: Array.isArray(meta.related) ? meta.related : [],
        embedding_text: buildEmbeddingText(meta, body),
      });
    }
  }

  return skills;
}

function build(): void {
  console.log('Building AntV Skills indexes...\n');

  if (!fs.existsSync(INDEX_DIR)) {
    fs.mkdirSync(INDEX_DIR, { recursive: true });
  }

  for (const [lib, libPath] of Object.entries(LIBRARY_PATHS)) {
    const libDir = path.join(SKILLS_DIR, libPath);
    const skills = walkDir(libDir, lib);

    console.log(`${lib.toUpperCase()}: Found ${skills.length} skills`);

    const indexData: SkillIndex = {
      library: lib,
      version: '5.x',
      generated: new Date().toISOString().split('T')[0],
      total: skills.length,
      skills,
    };

    const indexPath = path.join(INDEX_DIR, `${lib}.index.json`);
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
    console.log(`  Written ${lib}.index.json`);
  }
}

build();
