#!/usr/bin/env node
/**
 * AntV Skills 召回率评估
 *
 * 测试检索系统对测试用例的召回效果
 * 基于测试用例的 ID 推断期望的 skill 类别
 *
 * 使用方法：
 *   node eval/eval-recall.js
 */

// Load environment variables from .env file
require('dotenv').config({ override: true });

const fs = require('fs');
const path = require('path');
const { inferCategory } = require('./utils/category-inference');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_DIR = path.join(ROOT_DIR, 'src', 'index');

// ── 检索函数 ───────────────────────────────────────────────────────────────────

function tokenize(text) {
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

function scoreSkill(skill, queryTokens) {
  const searchText = [
    skill.title,
    skill.description,
    ...(skill.use_cases || []),
    skill.category,
    skill.subcategory || ''
  ]
    .join(' ')
    .toLowerCase();

  const searchTokens = searchText
    .split(/[\s，,。.；;：:！!？?、\-_/\\]+/)
    .filter((t) => t.length > 0);

  let score = 0;
  for (const token of queryTokens) {
    const directMatch = searchText.includes(token);
    const reverseMatch = searchTokens.some(
      (st) => st.length >= 2 && token.includes(st)
    );

    if (directMatch || reverseMatch) {
      const titleLower = skill.title?.toLowerCase() || '';
      score +=
        titleLower.includes(token) ||
        searchTokens.some(
          (st) =>
            st.length >= 2 && token.includes(st) && titleLower.includes(st)
        )
          ? 3
          : 1;
      if (
        (skill.tags || []).some((t) => {
          const tl = t.toLowerCase();
          return tl.includes(token) || token.includes(tl);
        })
      )
        score += 2;
    }
  }
  return score;
}

function loadIndex(library = null) {
  const indexFile = library
    ? path.join(INDEX_DIR, `${library}.index.json`)
    : path.join(INDEX_DIR, 'full.index.json');

  return JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
}

function retrieveSkills(query, { library = null, topK = 5 } = {}) {
  const { skills } = loadIndex(library);
  const queryTokens = tokenize(query);

  const scored = skills
    .map((skill) => ({ skill, score: scoreSkill(skill, queryTokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map(({ skill, score }) => ({ ...skill, score }));
}

// ── 评估函数 ───────────────────────────────────────────────────────────────────

function evaluateRecall() {
  // 加载测试数据集
  const datasetPath = path.join(__dirname, 'data', 'g2-dataset-174.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

  console.log('\n' + '='.repeat(60));
  console.log('📊 AntV Skills 召回率评估');
  console.log('='.repeat(60));
  console.log(`📋 测试用例数: ${dataset.length}`);

  // 按类别统计
  const categoryStats = {};
  let totalHit = 0;
  let totalWithResults = 0;

  for (const testCase of dataset) {
    const { id, description } = testCase;

    // 检测库类型
    const library =
      description.includes('G6') || description.includes('图分析')
        ? 'g6'
        : 'g2';

    // 检索
    const results = retrieveSkills(description, { library, topK: 5 });

    if (results.length === 0) continue;

    // 推断期望类别
    const expectedCategory = inferCategory(description);

    // 检查检索结果是否包含期望类别
    const hit = results.some((s) => s.category === expectedCategory);

    // 按类别统计
    if (!categoryStats[expectedCategory]) {
      categoryStats[expectedCategory] = { total: 0, hit: 0 };
    }
    categoryStats[expectedCategory].total++;
    if (hit) {
      categoryStats[expectedCategory].hit++;
      totalHit++;
    }
    totalWithResults++;
  }

  // 输出结果
  console.log('\n📈 总体结果');
  console.log('─'.repeat(40));
  console.log(`有检索结果的用例: ${totalWithResults}/${dataset.length}`);
  console.log(
    `类别命中率: ${totalHit}/${totalWithResults} (${((totalHit / totalWithResults) * 100).toFixed(1)}%)`
  );

  console.log('\n📊 分类别统计');
  console.log('─'.repeat(40));

  const sortedCategories = Object.entries(categoryStats).sort(
    (a, b) => b[1].hit - a[1].hit
  );

  for (const [category, stats] of sortedCategories) {
    const hitRate = (stats.hit / stats.total) * 100;
    console.log(
      `${category.padEnd(20)} 命中率: ${hitRate.toFixed(1).padStart(5)}%  (${stats.hit}/${stats.total})`
    );
  }

  // 输出一些具体检索示例
  console.log('\n📝 检索示例');
  console.log('─'.repeat(40));

  const sampleCases = dataset.slice(0, 5);
  for (const testCase of sampleCases) {
    const { id, description } = testCase;
    const library =
      description.includes('G6') || description.includes('图分析')
        ? 'g6'
        : 'g2';
    const results = retrieveSkills(description, { library, topK: 3 });

    console.log(`\n[${id}] ${description.substring(0, 50)}...`);
    console.log(`  检索结果: ${results.map((s) => s.id).join(', ')}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

evaluateRecall();
