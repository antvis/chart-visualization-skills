#!/usr/bin/env tsx
/**
 * AntV Skills 召回率评估
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { inferCategory } from './utils/category-inference.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_DIR = path.join(ROOT_DIR, 'src', 'index');

// ── 检索函数 ───────────────────────────────────────────────────────────────────

interface SkillEntry {
  id: string;
  title?: string;
  description?: string;
  use_cases?: string[];
  category?: string;
  subcategory?: string;
  tags?: string[];
}

function tokenize(text: string): string[] {
  const parts = text
    .toLowerCase()
    .split(/[\s，,。.；;：:！!？?、\-_/\\]+/)
    .filter((t) => t.length > 0);

  const substrings = new Set(parts);
  for (const part of parts) {
    if (/[\u4e00-\u9fff]/.test(part)) {
      for (let len = 2; len <= Math.min(6, part.length); len++) {
        for (let i = 0; i <= part.length - len; i++) {
          substrings.add(part.slice(i, i + len));
        }
      }
    }
  }
  return [...substrings];
}

function scoreSkill(skill: SkillEntry, queryTokens: string[]): number {
  const searchText = [skill.title, skill.description, ...(skill.use_cases ?? []), skill.category, skill.subcategory ?? '']
    .join(' ')
    .toLowerCase();

  const searchTokens = searchText.split(/[\s，,。.；;：:！!？?、\-_/\\]+/).filter((t) => t.length > 0);
  let score = 0;
  for (const token of queryTokens) {
    const directMatch = searchText.includes(token);
    const reverseMatch = searchTokens.some((st) => st.length >= 2 && token.includes(st));
    if (directMatch || reverseMatch) {
      const titleLower = skill.title?.toLowerCase() ?? '';
      score +=
        titleLower.includes(token) || searchTokens.some((st) => st.length >= 2 && token.includes(st) && titleLower.includes(st))
          ? 3
          : 1;
      if ((skill.tags ?? []).some((t) => { const tl = t.toLowerCase(); return tl.includes(token) || token.includes(tl); })) {
        score += 2;
      }
    }
  }
  return score;
}

function loadIndex(library: string | null = null): { skills: SkillEntry[] } {
  const indexFile = library
    ? path.join(INDEX_DIR, `${library}.index.json`)
    : path.join(INDEX_DIR, 'full.index.json');
  return JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
}

function retrieveSkills(query: string, { library = null, topK = 5 }: { library?: string | null; topK?: number } = {}) {
  const { skills } = loadIndex(library);
  const queryTokens = tokenize(query);
  return skills
    .map((skill) => ({ skill, score: scoreSkill(skill, queryTokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ skill, score }) => ({ ...skill, score }));
}

// ── 评估函数 ───────────────────────────────────────────────────────────────────

function evaluateRecall() {
  const datasetPath = path.join(__dirname, 'data', 'g2-dataset-174.json');
  const dataset: Array<{ id: string; description: string }> = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

  console.log('\n' + '='.repeat(60));
  console.log('📊 AntV Skills 召回率评估');
  console.log('='.repeat(60));
  console.log(`📋 测试用例数: ${dataset.length}`);

  const categoryStats: Record<string, { total: number; hit: number }> = {};
  let totalHit = 0;
  let totalWithResults = 0;

  for (const { description } of dataset) {
    const library = description.includes('G6') || description.includes('图分析') ? 'g6' : 'g2';
    const results = retrieveSkills(description, { library, topK: 5 });
    if (results.length === 0) continue;

    const expectedCategory = inferCategory(description);
    const hit = results.some((s) => s.category === expectedCategory);

    if (!categoryStats[expectedCategory]) categoryStats[expectedCategory] = { total: 0, hit: 0 };
    categoryStats[expectedCategory].total++;
    if (hit) { categoryStats[expectedCategory].hit++; totalHit++; }
    totalWithResults++;
  }

  console.log('\n📈 总体结果');
  console.log('─'.repeat(40));
  console.log(`有检索结果的用例: ${totalWithResults}/${dataset.length}`);
  console.log(`类别命中率: ${totalHit}/${totalWithResults} (${((totalHit / totalWithResults) * 100).toFixed(1)}%)`);

  console.log('\n📊 分类别统计');
  console.log('─'.repeat(40));

  for (const [category, stats] of Object.entries(categoryStats).sort((a, b) => b[1].hit - a[1].hit)) {
    const hitRate = (stats.hit / stats.total) * 100;
    console.log(`${category.padEnd(20)} 命中率: ${hitRate.toFixed(1).padStart(5)}%  (${stats.hit}/${stats.total})`);
  }

  console.log('\n📝 检索示例');
  console.log('─'.repeat(40));
  for (const { id, description } of dataset.slice(0, 5)) {
    const library = description.includes('G6') || description.includes('图分析') ? 'g6' : 'g2';
    const results = retrieveSkills(description, { library, topK: 3 });
    console.log(`\n[${id}] ${description.substring(0, 50)}...`);
    console.log(`  检索结果: ${results.map((s) => s.id).join(', ')}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

evaluateRecall();
