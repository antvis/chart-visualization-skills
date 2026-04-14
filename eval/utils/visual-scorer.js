/**
 * Visual Scorer
 *
 * Uses Qwen-VL to score a rendered chart screenshot.
 * Returns a composite visualScore (0–1) and per-dimension scores.
 *
 * Dimensions:
 *   - dataCompleteness  (0–1): data points are shown, no truncation
 *   - chartTypeMatch    (0–1): chart type matches the query intent
 *   - visualClarity     (0–1): labels/axes/legend readable, no overlap
 *   - aesthetics        (0–1): color, layout, proportions look reasonable
 *
 * Usage:
 *   const { scoreScreenshot } = require('./visual-scorer');
 *   const result = await scoreScreenshot(screenshotBuffer, query);
 *   // result: { visualScore, dimensions, reasoning }
 */

'use strict';

const OpenAI = require('openai');
const { getRuntimeConfig } = require('./provider-registry');
const logger = require('./logger');

const VL_MODEL = process.env.VL_MODEL || 'Qwen3-VL-235B-A22B-Instruct';
const SCORE_TIMEOUT_MS = 30000;

// Weight of each dimension in the composite score
const WEIGHTS = {
  dataCompleteness: 0.35,
  chartTypeMatch: 0.3,
  visualClarity: 0.25,
  aesthetics: 0.1
};

/**
 * Build the Qwen-VL OpenAI-compat client.
 * Reuses QWEN_API_KEY / QWEN_API_ENDPOINT from provider-registry.
 */
function buildVLClient() {
  const config = getRuntimeConfig('qwen');
  if (!config?.apiKey) {
    throw new Error('Qwen VL scorer requires QWEN_API_KEY to be set.');
  }
  // Derive baseURL from config.path to avoid double-appending the path segment.
  // config.path is like "/compatible-mode/v1/chat/completions"; strip the trailing operation.
  const basePath = (
    config.path || '/compatible-mode/v1/chat/completions'
  ).replace(/\/chat\/completions$/, '');
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: `${config.endpoint}${basePath}`
  });
}

/**
 * Score a rendered chart screenshot using Qwen-VL.
 *
 * @param {Buffer} screenshotBuffer  - PNG screenshot bytes
 * @param {string} query             - original user query (chart intent)
 * @returns {Promise<{
 *   visualScore: number,
 *   dimensions: { dataCompleteness: number, chartTypeMatch: number, visualClarity: number, aesthetics: number },
 *   reasoning: string,
 *   skipped: boolean
 * }>}
 */
async function scoreScreenshot(screenshotBuffer, query) {
  const skippedResult = {
    visualScore: null,
    dimensions: null,
    reasoning: null,
    skipped: true
  };

  if (!screenshotBuffer || screenshotBuffer.length === 0) return skippedResult;

  let client;
  try {
    client = buildVLClient();
  } catch {
    // If no API key, skip scoring gracefully
    return skippedResult;
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

  const userContent = [
    { type: 'text', text: `查询意图：${query}\n\n请评分上面的图表：` },
    { type: 'image_url', image_url: { url: dataUrl } }
  ];

  try {
    const response = await client.chat.completions.create(
      {
        model: VL_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0,
        max_tokens: 200
      },
      { timeout: SCORE_TIMEOUT_MS }
    );

    const text = response.choices?.[0]?.message?.content?.trim() || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        ...skippedResult,
        skipped: false,
        reasoning: `parse error: ${text.slice(0, 100)}`
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const dims = {
      dataCompleteness: clamp(parsed.dataCompleteness ?? 0) / 10,
      chartTypeMatch: clamp(parsed.chartTypeMatch ?? 0) / 10,
      visualClarity: clamp(parsed.visualClarity ?? 0) / 10,
      aesthetics: clamp(parsed.aesthetics ?? 0) / 10
    };

    const visualScore = Object.entries(WEIGHTS).reduce(
      (sum, [k, w]) => sum + dims[k] * w,
      0
    );

    return {
      visualScore: Math.round(visualScore * 100) / 100,
      dimensions: dims,
      reasoning: parsed.reasoning || '',
      skipped: false
    };
  } catch (err) {
    // Score failure should never crash the render pipeline
    logger.warn({ err: err.message }, 'Visual scorer error');
    return { ...skippedResult, reasoning: `scorer error: ${err.message}` };
  }
}

function clamp(v) {
  return Math.max(0, Math.min(10, Number(v) || 0));
}

module.exports = { scoreScreenshot, WEIGHTS };
