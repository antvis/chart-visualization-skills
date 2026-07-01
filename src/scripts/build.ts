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
const PKG_ROOT = rootArg
  ? path.resolve(rootArg.slice('--root='.length))
  : path.resolve(__dirname, '../..');
const CONTENT_DIR = path.join(PKG_ROOT, 'src', 'content');
const INDEX_DIR = path.join(PKG_ROOT, 'src', 'index');

// Default major version per library (used for index header if no version is specified)
const LIBRARY_VERSIONS: Record<string, string> = {
  g2: '5.x',
  g6: '5.x',
  x6: '3.x'
};

// Default info metadata per library (used when constraints.md has no frontmatter)
const LIBRARY_INFO_DEFAULTS: Record<
  string,
  { name: string; description: string }
> = {
  g2: {
    name: 'antv-g2-chart',
    description:
      'Generate G2 v5 chart code. Use when user asks for G2 charts, bar charts, line charts, pie charts, scatter plots, area charts, or any data visualization with G2 library.'
  },
  g6: {
    name: 'antv-g6-graph',
    description:
      'Generate G6 v5 graph/network visualization code. Use when user asks for G6 graphs, network diagrams, tree graphs, flow charts, or any graph visualization with G6 library.'
  },
  x6: {
    name: 'antv-x6-editor',
    description:
      'Generate X6 v3 diagram/editor code. Use when user asks for X6 diagrams, flowcharts, DAGs, ER diagrams, org charts, or any node-edge editor with X6 library.'
  }
};

function walkDir(
  dir: string,
  library: string,
  skipNames?: Set<string>
): Skill[] {
  const skills: Skill[] = [];
  if (!fs.existsSync(dir)) return skills;

  // Keep deterministic output across environments to avoid index diff noise.
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      skills.push(...walkDir(fullPath, library, skipNames));
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.md') &&
      !['README.md', 'CONTRIBUTING.md'].includes(entry.name) &&
      !skipNames?.has(entry.name)
    ) {
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
        title_en: meta.title_en || '',
        description: (meta.description || '').replace(/\n\s*/g, ' ').trim(),
        library: meta.library || '',
        version: meta.version || '',
        category: meta.category || '',
        subcategory: meta.subcategory || '',
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        use_cases: Array.isArray(meta.use_cases) ? meta.use_cases : [],
        anti_patterns: Array.isArray(meta.anti_patterns)
          ? meta.anti_patterns
          : [],
        related: Array.isArray(meta.related) ? meta.related : [],
        path: relativePath,
        content: parsed.content
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

  // Discover libraries from content directory subdirectories
  const libEntries = fs.existsSync(CONTENT_DIR)
    ? fs
        .readdirSync(CONTENT_DIR, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  if (libEntries.length === 0) {
    console.warn(`No library directories found in ${CONTENT_DIR}`);
    return;
  }

  const libraries = libEntries.map((e) => e.name);

  for (const lib of libraries) {
    const libDir = path.join(CONTENT_DIR, lib);

    // Exclude special files (constraints, mistakes) from the skills array —
    // they have no frontmatter and serve as the info source instead.
    const skipNames = new Set(['constraints.md', 'mistakes.md']);

    const skills = walkDir(libDir, lib, skipNames);

    console.log(`${lib.toUpperCase()}: Found ${skills.length} documents.`);

    // Build info section from {lib}-constraints.md
    const defaults = LIBRARY_INFO_DEFAULTS[lib];
    let info: SkillIndex['info'];
    let version = LIBRARY_VERSIONS[lib] || '';
    const constraintsPath = path.join(libDir, 'constraints.md');

    if (fs.existsSync(constraintsPath)) {
      const constraintsContent = fs.readFileSync(constraintsPath, 'utf-8');

      // Extract the section between CONSTRAINTS markers if present
      let coreConstraints: string;
      const startMarker = '<!-- CONSTRAINTS:START -->';
      const endMarker = '<!-- CONSTRAINTS:END -->';
      const startIdx = constraintsContent.indexOf(startMarker);
      const endIdx = constraintsContent.indexOf(endMarker);

      if (startIdx !== -1 && endIdx !== -1) {
        coreConstraints = constraintsContent.slice(
          startIdx,
          endIdx + endMarker.length
        );
      } else {
        coreConstraints = constraintsContent;
      }

      info = {
        name: defaults?.name || `antv-${lib}`,
        description: defaults?.description || '',
        content: constraintsContent,
        constraintsContent: coreConstraints
      };
    } else if (defaults) {
      info = {
        name: defaults.name,
        description: defaults.description,
        content: '',
        constraintsContent: ''
      };
    }

    const indexData: SkillIndex = {
      library: lib,
      version,
      generated: new Date().toISOString().split('T')[0],
      total: skills.length,
      skills,
      info: info!
    };

    const indexPath = path.join(INDEX_DIR, `${lib}.index.json`);
    fs.writeFileSync(indexPath, JSON.stringify(indexData), 'utf-8');
    console.log(`  Written ${lib}.index.json\n`);
  }
}

build();
