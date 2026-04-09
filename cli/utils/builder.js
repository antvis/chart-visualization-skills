#!/usr/bin/env node
/**
 * AntV Skills Index Builder Module
 *
 * Provides functionality to build indexes from skill markdown files.
 * Can be used programmatically or via CLI.
 */

const fs = require('fs');
const path = require('path');

class SkillBuilder {
  constructor(options = {}) {
    // Resolve paths relative to package root
    const packageRoot = path.resolve(__dirname, '../..');
    this.skillsDir = options.skillsDir || path.join(packageRoot, 'skills');
    this.indexDir =
      options.indexDir || path.join(path.resolve(__dirname), '..', 'index');
    // New structure: g2/references, g6/references, common-concepts/references
    this.libraryPaths = options.libraryPaths || {
      g2: 'g2/references',
      g6: 'g6/references'
    };
  }

  /**
   * Simple YAML Front Matter parser
   */
  parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return { meta: {}, body: content };

    const yamlStr = match[1];
    const body = content.slice(match[0].length).trim();
    const meta = {};

    let currentKey = null;
    let currentArray = null;

    yamlStr.split('\n').forEach((line) => {
      if (line.trim().startsWith('#')) return;

      if (line.match(/^\s+-\s+/)) {
        const value = line
          .replace(/^\s+-\s+/, '')
          .replace(/^["']|["']$/g, '')
          .trim();
        if (currentArray) currentArray.push(value);
        return;
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
    });

    return { meta, body };
  }

  /**
   * Extract sections from markdown body
   */
  extractSections(markdown, sectionTitles) {
    const sections = [];
    const lines = markdown.split('\n');
    let inSection = false;
    let currentLines = [];

    for (const line of lines) {
      const headingMatch = line.match(/^#{1,3}\s+(.+)/);
      if (headingMatch) {
        const title = headingMatch[1];
        if (sectionTitles.some((t) => title.includes(t))) {
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

  /**
   * Build embedding text for vector search
   */
  buildEmbeddingText(meta, body) {
    const parts = [
      `Title: ${meta.title || ''}`,
      `Description: ${meta.description || ''}`,
      `Tags: ${Array.isArray(meta.tags) ? meta.tags.join(', ') : meta.tags || ''}`,
      `Use Cases: ${Array.isArray(meta.use_cases) ? meta.use_cases.join('; ') : meta.use_cases || ''}`,
      `Anti-patterns: ${Array.isArray(meta.anti_patterns) ? meta.anti_patterns.join('; ') : ''}`
    ];

    const coreContent = this.extractSections(body, [
      'Core Concepts',
      'Minimal Runnable Example',
      'API Quick Reference',
      'Common Errors',
      '核心概念',
      '最小可运行示例',
      'API 速查',
      '常见错误'
    ]);

    if (coreContent) {
      parts.push(coreContent.slice(0, 1000));
    }

    return parts.filter(Boolean).join('\n');
  }

  /**
   * Walk directory and collect all skill files
   */
  walkDir(dir, library) {
    const skills = [];

    if (!fs.existsSync(dir)) return skills;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        skills.push(...this.walkDir(fullPath, library));
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.md') &&
        !['README.md', 'CONTRIBUTING.md'].includes(entry.name)
      ) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const { meta, body } = this.parseFrontMatter(content);

        if (library && meta.library && meta.library !== library) continue;

        if (!meta.id) {
          console.warn(`⚠️  Skipping (missing id): ${fullPath}`);
          continue;
        }

        const relativePath = path.relative(
          path.resolve(__dirname, '../..'),
          fullPath
        );

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
          anti_patterns: Array.isArray(meta.anti_patterns)
            ? meta.anti_patterns
            : [],
          related: Array.isArray(meta.related) ? meta.related : [],
          embedding_text: this.buildEmbeddingText(meta, body)
        });
      }
    }

    return skills;
  }

  /**
   * Build indexes for all libraries
   */
  build(options = {}) {
    const silent = options.silent || false;

    if (!silent) console.log('🔨 Building AntV Skills indexes...\n');

    // Ensure index directory exists
    if (!fs.existsSync(this.indexDir)) {
      fs.mkdirSync(this.indexDir, { recursive: true });
    }

    const allSkills = [];

    for (const [lib, libPath] of Object.entries(this.libraryPaths)) {
      const libDir = path.join(this.skillsDir, libPath);
      const skills = this.walkDir(libDir, lib);

      if (!silent)
        console.log(`📚 ${lib.toUpperCase()}: Found ${skills.length} skills`);

      const indexData = {
        library: lib,
        version: '5.x',
        generated: new Date().toISOString().split('T')[0],
        total: skills.length,
        skills
      };

      const indexPath = path.join(this.indexDir, `${lib}.index.json`);
      fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');

      if (!silent) console.log(`   ✅ Written index/${lib}.index.json`);

      allSkills.push(...skills);
    }

    const fullIndex = {
      library: 'all',
      version: '5.x',
      generated: new Date().toISOString().split('T')[0],
      total: allSkills.length,
      skills: allSkills
    };

    const fullIndexPath = path.join(this.indexDir, 'full.index.json');
    fs.writeFileSync(
      fullIndexPath,
      JSON.stringify(fullIndex, null, 2),
      'utf-8'
    );

    if (!silent) {
      console.log(
        `\n🎉 Full index written: index/full.index.json (${allSkills.length} skills total)`
      );
    }

    return {
      total: allSkills.length,
      byLibrary: Object.keys(this.libraryPaths).reduce((acc, lib) => {
        acc[lib] = allSkills.filter((s) => s.library === lib).length;
        return acc;
      }, {})
    };
  }
}

// Export for both CommonJS and ES Module compatibility
module.exports = { SkillBuilder };
