#!/usr/bin/env node
/**
 * AntV Skills Retriever Module
 *
 * Provides RAG (Retrieval Augmented Generation) functionality for skill lookup.
 * Uses BM25 ranking with field-level boosting and IDF weighting.
 */

const fs = require('fs');
const path = require('path');
const { BM25Index } = require('./bm25');

class SkillRetriever {
  constructor(options = {}) {
    const packageRoot = path.resolve(__dirname, '../..');
    this.indexDir = options.indexDir || path.join(__dirname, '../index');
    this.skillsDir = options.skillsDir || path.join(packageRoot, 'skills');

    // BM25 parameters (tuned via eval/_tune-bm25.js grid search)
    // k1=1.8, b=0.5 yields R@5=92.9%, MRR=0.7779 on dataset-200
    this.bm25Options = {
      k1: options.k1 ?? 1.8,
      b: options.b ?? 0.5,
      fieldWeights: options.fieldWeights || undefined
    };

    // Cache BM25 indexes per library to avoid re-building
    this._bm25Cache = new Map();
  }

  /**
   * Load index file
   */
  loadIndex(library = null) {
    const indexFile = library
      ? path.join(this.indexDir, `${library}.index.json`)
      : path.join(this.indexDir, 'full.index.json');

    if (!fs.existsSync(indexFile)) {
      throw new Error(
        `Index file not found: ${indexFile}. Please run 'skills-antv build' first.`
      );
    }

    return JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
  }

  /**
   * Get or build a BM25 index for the given library.
   * Results are cached so repeated queries don't rebuild.
   */
  _getBM25Index(library) {
    const key = library || '__full__';
    if (!this._bm25Cache.has(key)) {
      const { skills } = this.loadIndex(library);
      const index = new BM25Index(this.bm25Options);
      index.build(skills);
      this._bm25Cache.set(key, index);
    }
    return this._bm25Cache.get(key);
  }

  /**
   * Retrieve skills matching the query
   *
   * @param {string} query - Search query
   * @param {Object} [options]
   * @param {string} [options.library] - Filter by library (g2/g6)
   * @param {number} [options.topK=7] - Number of results
   * @returns {Array<Object>} Matched skills
   */
  retrieve(query, options = {}) {
    const { library = null, topK = 7 } = options;
    const results = this._retrieveBM25(query, library, topK);
    if (results.length === 0) {
      return this._retrieveGrep(query, library, topK);
    }
    return results;
  }

  /**
   * BM25-based retrieval
   * @private
   */
  _retrieveBM25(query, library, topK) {
    const index = this._getBM25Index(library);
    const results = index.search(query, topK);
    return results.map(({ skill }) => skill);
  }

  /**
   * Grep full-text fallback retrieval.
   * Searches skill markdown files for query terms when BM25 returns nothing.
   * Files are scored by the number of distinct query terms they contain.
   *
   * @private
   */
  _retrieveGrep(query, library, topK) {
    const { execFileSync } = require('child_process');
    const packageRoot = path.resolve(__dirname, '../..');

    // Load index to map relative paths back to skill metadata
    const { skills } = this.loadIndex(library);
    const pathToSkill = new Map(skills.map((s) => [s.path, s]));

    // Split query into terms, skip very short tokens
    const terms = query
      .toLowerCase()
      .split(/[\s\-_/]+/)
      .filter((t) => t.length >= 2);
    if (terms.length === 0) return [];

    // Score files by number of distinct terms matched
    const fileScores = new Map();
    for (const term of terms) {
      let raw = '';
      try {
        raw = execFileSync(
          'grep',
          ['-ril', '--include=*.md', '-E', term, this.skillsDir],
          { encoding: 'utf-8', maxBuffer: 2 * 1024 * 1024 }
        );
      } catch (e) {
        if (e.status !== 1) continue; // status 1 = no matches, anything else is unexpected
      }
      for (const filePath of raw.split('\n').filter(Boolean)) {
        fileScores.set(filePath, (fileScores.get(filePath) || 0) + 1);
      }
    }

    // Sort by score descending, map to skill metadata
    return [...fileScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([filePath]) => {
        const rel = path.relative(packageRoot, filePath);
        return pathToSkill.get(rel);
      })
      .filter(Boolean);
  }

  /**
   * Retrieve skills with scores (useful for debugging and evaluation)
   *
   * @param {string} query
   * @param {Object} [options]
   * @returns {Array<{skill: Object, score: number}>}
   */
  retrieveWithScores(query, options = {}) {
    const { library = null, topK = 7 } = options;
    const index = this._getBM25Index(library);
    return index.search(query, topK);
  }

  /**
   * Expand results with related skills
   */
  expandRelated(primarySkills, options = {}) {
    const { maxExtra = 3 } = options;
    const primaryIds = new Set(primarySkills.map((s) => s.id));
    const relatedIds = new Set();

    for (const skill of primarySkills) {
      for (const relId of skill.related || []) {
        if (!primaryIds.has(relId)) {
          relatedIds.add(relId);
        }
      }
    }

    const fullIndex = this.loadIndex('full');
    const idToSkill = Object.fromEntries(
      fullIndex.skills.map((s) => [s.id, s])
    );

    return [...relatedIds]
      .slice(0, maxExtra)
      .map((id) => idToSkill[id])
      .filter(Boolean);
  }

  /**
   * Load skill content from file
   */
  loadSkillContent(skillPath) {
    const fullPath = path.join(path.resolve(__dirname, '../..'), skillPath);
    if (!fs.existsSync(fullPath)) return '';
    return fs.readFileSync(fullPath, 'utf-8');
  }

  /**
   * Extract key content sections from skill markdown
   */
  extractKeyContent(content) {
    const body = content.replace(/^---[\s\S]*?---\n/, '');

    const sections = [];
    const lines = body.split('\n');
    let inSection = false;
    let currentLines = [];
    const targetSections = [
      'Minimal Runnable Example',
      'Basic Usage',
      'Common Errors',
      'API Quick Reference',
      'Full Configuration',
      '最小可运行示例',
      '基本用法',
      '常见错误',
      'API 速查',
      '完整配置'
    ];

    for (const line of lines) {
      const headingMatch = line.match(/^#{1,3}\s+(.+)/);
      if (headingMatch) {
        const title = headingMatch[1];
        if (targetSections.some((t) => title.includes(t))) {
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

    return sections.slice(0, 2).join('\n\n').slice(0, 2000);
  }

  /**
   * Detect library from query
   */
  detectLibrary(query) {
    const q = query.toLowerCase();
    if (
      q.includes('g6') ||
      ((q.includes('graph') || q.includes('图')) &&
        (q.includes('node') ||
          q.includes('nodes') ||
          q.includes('边') ||
          q.includes('edge') ||
          q.includes('layout') ||
          q.includes('布局') ||
          q.includes('network')))
    ) {
      return 'g6';
    }
    return 'g2';
  }

  /**
   * Build system prompt for LLM
   */
  buildPrompt(query, options = {}) {
    const library = options.library || this.detectLibrary(query);
    const topK = options.topK || 5;
    const maxExtra = options.maxExtra || 2;

    // Retrieve primary skills
    const primarySkills = this.retrieve(query, { library, topK });

    // Expand with related skills
    const extraSkills = this.expandRelated(primarySkills, { maxExtra });
    const allSkills = [...primarySkills, ...extraSkills];

    // Load skill content
    let skillContext = '';
    for (const skill of allSkills) {
      const content = this.loadSkillContent(skill.path);
      if (content) {
        const keyContent = this.extractKeyContent(content);
        skillContext += `\n\n### Skill: ${skill.title} (${skill.id})\n${keyContent}`;
      }
    }

    const systemPrompt = `You are an AntV ${library.toUpperCase()} v5 expert.`;

    // Replace placeholder
    const finalPrompt = systemPrompt.replace(
      '{RETRIEVED_SKILLS_CONTENT}',
      skillContext || '(No relevant skill content)'
    );

    return {
      systemPrompt: finalPrompt,
      retrievedSkills: allSkills.map((s) => s.id),
      library,
      primarySkills,
      extraSkills
    };
  }

  /**
   * List all skills with optional filtering
   */
  list(options = {}) {
    const {
      library = null,
      category = null,
      tags = [],
      difficulty = null
    } = options;

    const { skills } = this.loadIndex(library);

    return skills.filter((skill) => {
      if (category && skill.category !== category) return false;
      if (difficulty && skill.difficulty !== difficulty) return false;
      if (tags.length > 0 && !tags.some((t) => skill.tags.includes(t)))
        return false;
      return true;
    });
  }

  /**
   * Clear BM25 index cache (call after index rebuild)
   */
  clearCache() {
    this._bm25Cache.clear();
  }
}

module.exports = { SkillRetriever };
