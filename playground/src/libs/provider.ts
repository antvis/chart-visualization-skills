/**
 * DeepSeek Provider
 */
import { createOpenAI } from '@ai-sdk/openai';

export function createLanguageModel() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('Missing DEEPSEEK_API_KEY');

  const endpoint = process.env.DEEPSEEK_API_ENDPOINT || 'https://api.deepseek.com';
  const path = process.env.DEEPSEEK_API_PATH || '/v1/chat/completions';
  const modelId = process.env.DEEPSEEK_MODEL || 'DeepSeek-V3.2';

  const client = createOpenAI({
    apiKey,
    baseURL: new URL(path.replace('/chat/completions', '') || '/v1', endpoint).toString(),
  });

  return { model: client.chat(modelId), provider: 'deepseek', modelId };
}
