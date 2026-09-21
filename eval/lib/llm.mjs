/**
 * LLM client — three models evaluated in parallel, each with its own
 * base URL + key. Select one at runtime via createModel(shortName).
 *
 * Env per model: <NAME>_BASE_URL / <NAME>_API_KEY (e.g. KIMI_BASE_URL).
 * BASE_URL is the full OpenAI-compatible base (including /v1).
 * AI_TEMPERATURE is optional (default 0.3).
 */

import { createOpenAI } from '@ai-sdk/openai';

export const MODELS = {
  kimi: { modelId: 'Kimi-K2.5', baseURL: process.env.KIMI_BASE_URL, apiKey: process.env.KIMI_API_KEY },
  glm: { modelId: 'GLM-5.1', baseURL: process.env.GLM_BASE_URL, apiKey: process.env.GLM_API_KEY },
  deepseek: { modelId: 'DeepSeek-Flash', baseURL: process.env.DEEPSEEK_BASE_URL, apiKey: process.env.DEEPSEEK_API_KEY },
};

export const MODEL_NAMES = Object.keys(MODELS);

export function createModel(shortName) {
  const def = MODELS[shortName];
  if (!def) {
    throw new Error(`Unknown model "${shortName}". Available: ${MODEL_NAMES.join(', ')}`);
  }
  if (!def.baseURL) throw new Error(`Missing base URL for model "${shortName}".`);
  if (!def.apiKey) throw new Error(`Missing API key for model "${shortName}".`);

  const provider = createOpenAI({ baseURL: def.baseURL, apiKey: def.apiKey });
  return {
    // Use Chat Completions API (not the default Responses API) — internal
    // OpenAI-compatible endpoints only implement /v1/chat/completions.
    model: provider.chat(def.modelId),
    temperature: Number(process.env.AI_TEMPERATURE ?? 0.3),
  };
}
