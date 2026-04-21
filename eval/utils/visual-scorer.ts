/**
 * Visual Scorer
 *
 * Uses Qwen-VL to score a rendered chart screenshot.
 * Returns a composite visualScore (0–1) and per-dimension scores.
 */

'use strict';

import { createModel } from './ai-sdk.js';
import { generateText } from 'ai';
import logger from './logger.js';

const VL_MODEL = process.env.VL_MODEL ?? 'Qwen3-VL-235B-A22B-Instruct';
const SCORE_TIMEOUT_MS = 30000;

const WEIGHTS = { dataCompleteness: 0.35, chartTypeMatch: 0.3, visualClarity: 0.25, aesthetics: 0.1 };

export interface VisualScoreResult {
  visualScore: number | null;
  dimensions: Record<string, number> | null;
  reasoning: string | null;
  skipped: boolean;
}

export async function scoreScreenshot(screenshotBuffer: Buffer, query: string): Promise<VisualScoreResult> {
  const skipped: VisualScoreResult = { visualScore: null, dimensions: null, reasoning: null, skipped: true };
  if (!screenshotBuffer || screenshotBuffer.length === 0) return skipped;

  let model;
  try {
    model = createModel('qwen', VL_MODEL);
  } catch {
    return skipped;
  }

  const base64 = screenshotBuffer.toString('base64');
  const dataUrl = `data:image/png;base64,${base64}`;

  const systemPrompt = `你是图表质量评审专家。用户给你一张图表截图和对应的查询意图，请从以下4个维度打分，每个维度0到10的整数分：

1. dataCompleteness（数据完整性）：图表是否展示了完整数据，没有截断或遗漏
2. chartTypeMatch（图表类型匹配）：图表类型是否符合查询意图
3. visualClarity（视觉清晰度）：轴标签、图例、数据标签是否可读，无重叠
4. aesthetics（视觉美观）：颜色、布局、比例是否合理美观

严格按照以下 JSON 格式输出，不要输出其他内容：
{"dataCompleteness":8,"chartTypeMatch":9,"visualClarity":7,"aesthetics":8,"reasoning":"简短说明"}`;

  try {
    const { text } = await generateText({
      model,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `查询意图：${query}\n\n请评分上面的图表：` },
            { type: 'image', image: dataUrl }
          ]
        }
      ],
      temperature: 0,
      maxOutputTokens: 200,
      abortSignal: AbortSignal.timeout(SCORE_TIMEOUT_MS)
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ...skipped, skipped: false, reasoning: `parse error: ${text.slice(0, 100)}` };

    const parsed = JSON.parse(jsonMatch[0]);
    const dims = {
      dataCompleteness: clamp(parsed.dataCompleteness ?? 0) / 10,
      chartTypeMatch: clamp(parsed.chartTypeMatch ?? 0) / 10,
      visualClarity: clamp(parsed.visualClarity ?? 0) / 10,
      aesthetics: clamp(parsed.aesthetics ?? 0) / 10
    };
    const visualScore = Math.round(Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + (dims as Record<string, number>)[k] * w, 0) * 100) / 100;

    return { visualScore, dimensions: dims, reasoning: parsed.reasoning ?? '', skipped: false };
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'Visual scorer error');
    return { ...skipped, reasoning: `scorer error: ${(err as Error).message}` };
  }
}

function clamp(v: unknown): number {
  return Math.max(0, Math.min(10, Number(v) || 0));
}

export { WEIGHTS };
