#!/usr/bin/env node

/**
 * Build script: generates JSON index files from skill markdown files.
 * Run independently before publishing: `node dist/scripts/build.js`
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { Skill, SkillIndex } from '../core/types';

// Allow overriding the project root via --root=<dir> (used by harness when running inside a worktree)
const rootArg = process.argv.find((a) => a.startsWith('--root='));
const PKG_ROOT = rootArg ? path.resolve(rootArg.slice('--root='.length)) : path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(PKG_ROOT, 'skills');
const INDEX_DIR = path.join(PKG_ROOT, 'src', 'index');

const LIBRARY_PATHS: Record<string, string> = {
  g2: 'antv-g2-chart',
  g6: 'antv-g6-graph',
};

function walkDir(dir: string, library: string): Skill[] {
  const skills: Skill[] = [];
  if (!fs.existsSync(dir)) return skills;

  // Keep deterministic output across environments to avoid index diff noise.
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      skills.push(...walkDir(fullPath, library));
    } else if (entry.isFile() && entry.name.endsWith('.md') && !['README.md', 'CONTRIBUTING.md'].includes(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const parsed = matter(content);
      const meta = parsed.data as Record<string, any>;

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
        use_cases: Array.isArray(meta.use_cases) ? meta.use_cases : [],
        anti_patterns: Array.isArray(meta.anti_patterns) ? meta.anti_patterns : [],
        related: Array.isArray(meta.related) ? meta.related : [],
        content: parsed.content,
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
    const libReferenceDir = path.join(SKILLS_DIR, libPath, 'references');
    const skills = walkDir(libReferenceDir, lib);

    console.log(`${lib.toUpperCase()}: Found ${skills.length} documents.`);

    const skillMd = path.join(SKILLS_DIR, libPath, 'SKILL.md');
    let info: SkillIndex['info'];
    if (fs.existsSync(skillMd)) {
      const parsed = matter(fs.readFileSync(skillMd, 'utf-8'));
      const meta = parsed.data as Record<string, any>;
      info = {
        name: meta.name || libPath,
        description: (meta.description || '').replace(/\n\s*/g, ' ').trim(),
        content: parsed.content,
      };
    }

    const indexData: SkillIndex = {
      library: lib,
      version: '5.x',
      generated: new Date().toISOString().split('T')[0],
      total: skills.length,
      skills,
      info,
    };

    const indexPath = path.join(INDEX_DIR, `${lib}.index.json`);
    fs.writeFileSync(indexPath, JSON.stringify(indexData), 'utf-8');
    console.log(`  Written ${lib}.index.json\n`);
  }
}

build();
