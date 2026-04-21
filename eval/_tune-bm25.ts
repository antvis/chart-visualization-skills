#!/usr/bin/env tsx
/**
 * BM25 Field Weight Tuner (fast version)
 *
 * Grid-searches BM25 field weights to maximize Recall@5 + MRR
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { inferCategory } from './utils/category-inference.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { BM25Index } = await import('../src/core/bm25.js') as {
  BM25Index: new (opts: { k1: number; b: number; fieldWeights: Record<string, number> }) => {
    build: (skills: unknown[]) => void;
    search: (query: string, topK: number) => Array<{ skill: { category?: string } }>;
  };
};

interface DatasetCase {
  id?: string;
  description: string;
}

interface SkillEntry {
  category?: string;
  [key: string]: unknown;
}

interface IndexData {
  skills: SkillEntry[];
}

const dataset: DatasetCase[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data/g2-dataset-174.json'), 'utf-8')
);

function loadIndex(library: string): SkillEntry[] {
  const f = path.join(__dirname, '..', 'src', 'index', `${library}.index.json`);
  return (JSON.parse(fs.readFileSync(f, 'utf-8')) as IndexData).skills;
}

const g2Skills = loadIndex('g2');
const g6Skills = loadIndex('g6');

function detectLibrary(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes('g6') || d.includes('图分析') || d.includes('知识图谱') || (d.includes('节点') && d.includes('边')) || d.includes('力导向')) return 'g6';
  return 'g2';
}

const testCases = dataset.map((tc) => ({ ...tc, cat: inferCategory(tc.description), lib: detectLibrary(tc.description) })).filter((tc) => tc.cat !== 'unknown');
console.log(`Labeled ${testCases.length}/${dataset.length} cases\n`);

type FieldWeights = Record<string, number>;

function evaluate(fieldWeights: FieldWeights, k1 = 1.5, b = 0.75) {
  const g2Idx = new BM25Index({ k1, b, fieldWeights });
  g2Idx.build(g2Skills);
  const g6Idx = new BM25Index({ k1, b, fieldWeights });
  g6Idx.build(g6Skills);

  let hit1 = 0, hit3 = 0, hit5 = 0, hit7 = 0, mrrSum = 0;
  const catStats: Record<string, { total: number; hit5: number }> = {};

  for (const tc of testCases) {
    const idx = tc.lib === 'g6' ? g6Idx : g2Idx;
    const results = idx.search(tc.description, 7);

    if (!catStats[tc.cat]) catStats[tc.cat] = { total: 0, hit5: 0 };
    catStats[tc.cat].total++;

    let rank = -1;
    for (let i = 0; i < results.length; i++) {
      if (results[i].skill.category === tc.cat) { rank = i + 1; break; }
    }

    if (rank > 0) {
      if (rank <= 1) hit1++;
      if (rank <= 3) hit3++;
      if (rank <= 5) { hit5++; catStats[tc.cat].hit5++; }
      if (rank <= 7) hit7++;
      mrrSum += 1 / rank;
    }
  }

  const n = testCases.length;
  return { hit1, hit3, hit5, hit7, mrr: mrrSum / n, n, catStats, r1: hit1 / n, r3: hit3 / n, r5: hit5 / n, r7: hit7 / n };
}

const BL_W: FieldWeights = { title: 5, tags: 3, use_cases: 2, category: 2, subcategory: 1.5, description: 1 };
const bl = evaluate(BL_W);

console.log('='.repeat(64));
console.log('  BASELINE  title=5 tags=3 uc=2 cat=2 sub=1.5 desc=1');
console.log(`  R@1=${(bl.r1 * 100).toFixed(1)}  R@3=${(bl.r3 * 100).toFixed(1)}  R@5=${(bl.r5 * 100).toFixed(1)}  R@7=${(bl.r7 * 100).toFixed(1)}  MRR=${bl.mrr.toFixed(4)}`);
for (const [c, s] of Object.entries(bl.catStats).sort((a, b) => b[1].total - a[1].total)) {
  console.log(`    ${c.padEnd(16)} ${s.hit5}/${s.total} (${((s.hit5 / s.total) * 100).toFixed(0)}%)`);
}
console.log('='.repeat(64));

const dims: Array<{ name: string; range: number[] }> = [
  { name: 'title', range: [3, 4, 5, 6, 8, 10] },
  { name: 'tags', range: [2, 3, 4, 5, 6] },
  { name: 'use_cases', range: [1, 2, 3, 4, 5] },
  { name: 'category', range: [1, 2, 3, 4, 5] },
  { name: 'subcategory', range: [0.5, 1, 1.5, 2, 3] },
  { name: 'description', range: [0.3, 0.5, 1, 1.5, 2] }
];

console.log('\n  Sweep each dimension independently:');
const bestPerDim: FieldWeights = { ...BL_W };

for (const dim of dims) {
  let bestVal = BL_W[dim.name], bestScore = -1;
  const rows: Array<{ val: number; r5: number; mrr: number; score: number }> = [];
  for (const val of dim.range) {
    const w = { ...BL_W, [dim.name]: val };
    const r = evaluate(w);
    const score = r.r5 + 0.5 * r.mrr;
    rows.push({ val, r5: r.r5, mrr: r.mrr, score });
    if (score > bestScore) { bestScore = score; bestVal = val; }
  }
  bestPerDim[dim.name] = bestVal;
  console.log(`\n  ${dim.name}:`);
  for (const row of rows) {
    const marker = row.val === bestVal ? ' *' : '';
    console.log(`    ${String(row.val).padStart(4)} → R@5=${(row.r5 * 100).toFixed(1)}%  MRR=${row.mrr.toFixed(4)}  score=${row.score.toFixed(4)}${marker}`);
  }
}

console.log('\n' + '─'.repeat(64));
console.log('  Combined best per-dimension values:');
console.log('  ', JSON.stringify(bestPerDim));
const combined = evaluate(bestPerDim);
console.log(`  R@1=${(combined.r1 * 100).toFixed(1)}  R@3=${(combined.r3 * 100).toFixed(1)}  R@5=${(combined.r5 * 100).toFixed(1)}  R@7=${(combined.r7 * 100).toFixed(1)}  MRR=${combined.mrr.toFixed(4)}`);

console.log('\n' + '─'.repeat(64));
console.log('  Fine-tuning k1/b:');
let globalBest = { score: 0, k1: 1.5, b: 0.75, weights: bestPerDim, result: combined };
for (const k1 of [1.0, 1.2, 1.5, 1.8, 2.0]) {
  for (const b of [0.5, 0.65, 0.75, 0.85]) {
    const r = evaluate(bestPerDim, k1, b);
    const score = r.r5 + 0.5 * r.mrr;
    if (score > globalBest.score) globalBest = { score, k1, b, weights: bestPerDim, result: r };
  }
}

console.log(`  Best k1=${globalBest.k1}  b=${globalBest.b}`);
const gr = globalBest.result;
console.log(`  R@1=${(gr.r1 * 100).toFixed(1)}  R@3=${(gr.r3 * 100).toFixed(1)}  R@5=${(gr.r5 * 100).toFixed(1)}  R@7=${(gr.r7 * 100).toFixed(1)}  MRR=${gr.mrr.toFixed(4)}`);

console.log('\n' + '='.repeat(64));
console.log('  FINAL: Tuned BM25 vs Baseline BM25');
console.log('='.repeat(64));
console.log(`\n  ${'Metric'.padEnd(12)} ${'BM25 base'.padStart(10)} ${'BM25 tuned'.padStart(10)}`);
console.log(`  ${'Recall@5'.padEnd(12)} ${(bl.r5 * 100).toFixed(1).padStart(9)}% ${(gr.r5 * 100).toFixed(1).padStart(9)}%`);
console.log(`  ${'MRR'.padEnd(12)} ${bl.mrr.toFixed(4).padStart(10)} ${gr.mrr.toFixed(4).padStart(10)}`);

console.log('\n  Per-category @5:');
for (const [c, s] of Object.entries(gr.catStats).sort((a, b) => b[1].total - a[1].total)) {
  const bl5 = bl.catStats[c] ? ((bl.catStats[c].hit5 / bl.catStats[c].total) * 100).toFixed(0) : '?';
  const t5 = ((s.hit5 / s.total) * 100).toFixed(0);
  console.log(`    ${c.padEnd(16)} BL:${bl5.padStart(4)}%  Tuned:${t5.padStart(4)}%  (${s.hit5}/${s.total})`);
}

console.log('\n  Recommended config for src/core/bm25.ts:');
console.log(`    k1: ${globalBest.k1}`);
console.log(`    b:  ${globalBest.b}`);
console.log(`    fieldWeights: ${JSON.stringify(globalBest.weights)}`);
console.log('\n' + '='.repeat(64) + '\n');
