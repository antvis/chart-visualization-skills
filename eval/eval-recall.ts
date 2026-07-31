#!/usr/bin/env tsx
/**
 * AntV Skills 召回率评估
 *
 * 使用核心 retrieve() API（zvec hybrid search）评估召回率。
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { inferCategory } from './utils/category-inference.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Retrieve via core (zvec hybrid) ─────────────────────────────────────────────

interface SkillEntry {
  id: string;
  title?: string;
  category?: string;
}

async function retrieveSkillsViaCore(
  query: string,
  library: string,
  topK = 5
): Promise<SkillEntry[]> {
  try {
    const mod = (await import('../src/api.js')) as {
      retrieve: (
        q: string,
        opts: {
          library?: string;
          topK?: number;
          content?: boolean;
        }
      ) => Promise<Array<{ id: string; title: string; category: string }>>;
    };
    return await mod.retrieve(query, { library, topK, content: false });
  } catch (err) {
    console.warn(`检索失败 (${library}): ${(err as Error).message}`);
    return [];
  }
}

// ── 评估函数 ───────────────────────────────────────────────────────────────────

async function evaluateRecall() {
  const datasetPath = path.join(__dirname, 'data', 'g2-dataset-174.json');
  const dataset: Array<{ id: string; description: string }> = JSON.parse(
    fs.readFileSync(datasetPath, 'utf-8')
  );

  console.log('\n' + '='.repeat(60));
  console.log('📊 AntV Skills 召回率评估 (zvec hybrid)');
  console.log('='.repeat(60));
  console.log(`📋 测试用例数: ${dataset.length}`);

  const categoryStats: Record<string, { total: number; hit: number }> = {};
  let totalHit = 0;
  let totalWithResults = 0;

  for (const { description } of dataset) {
    const library =
      description.includes('X6') || description.includes('@antv/x6')
        ? 'x6'
        : description.includes('G6') || description.includes('图分析')
          ? 'g6'
          : 'g2';

    const results = await retrieveSkillsViaCore(description, library, 5);
    if (results.length === 0) continue;

    const expectedCategory = inferCategory(description);
    const hit = results.some((s) => s.category === expectedCategory);

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

  console.log('\n📈 总体结果');
  console.log('─'.repeat(40));
  console.log(`有检索结果的用例: ${totalWithResults}/${dataset.length}`);
  console.log(
    `类别命中率: ${totalHit}/${totalWithResults} (${((totalHit / totalWithResults) * 100).toFixed(1)}%)`
  );

  console.log('\n📊 分类别统计');
  console.log('─'.repeat(40));

  for (const [category, stats] of Object.entries(categoryStats).sort(
    (a, b) => b[1].hit - a[1].hit
  )) {
    const hitRate = (stats.hit / stats.total) * 100;
    console.log(
      `${category.padEnd(20)} 命中率: ${hitRate.toFixed(1).padStart(5)}%  (${stats.hit}/${stats.total})`
    );
  }

  console.log('\n📝 检索示例');
  console.log('─'.repeat(40));
  for (const { id, description } of dataset.slice(0, 5)) {
    const library =
      description.includes('X6') || description.includes('@antv/x6')
        ? 'x6'
        : description.includes('G6') || description.includes('图分析')
          ? 'g6'
          : 'g2';
    const results = await retrieveSkillsViaCore(description, library, 3);
    console.log(`\n[${id}] ${description.substring(0, 50)}...`);
    console.log(`  检索结果: ${results.map((s) => s.id).join(', ')}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

evaluateRecall();
