/**
 * Provider Registry
 */

import { createOpenAI } from '@ai-sdk/openai';

export interface Provider {
  id: string;
  name: string;
  apiKey: string | undefined;
  endpoint: string;
  path: string;
  model: string;
  models: Array<{ id: string; name: string }>;
  extraHeaders?: Record<string, string>;
}

export const PROVIDERS: Record<string, Provider> = {
  qwen: {
    id: 'qwen',
    name: 'Qwen',
    apiKey: process.env.QWEN_API_KEY,
    endpoint: process.env.QWEN_API_ENDPOINT || 'https://dashscope.aliyuncs.com',
    path: process.env.QWEN_API_PATH || '/compatible-mode/v1/chat/completions',
    model: process.env.QWEN_MODEL || 'qwen3-coder-480b-a35b-instruct',
    models: [
      { id: 'qwen3-coder-480b-a35b-instruct', name: 'Qwen Coder Plus' },
      { id: 'qwen-turbo', name: 'Qwen Turbo' },
      { id: 'qwen-plus', name: 'Qwen Plus' },
      { id: 'qwen-max', name: 'Qwen Max' }
    ]
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    apiKey: process.env.DEEPSEEK_API_KEY,
    endpoint: process.env.DEEPSEEK_API_ENDPOINT || 'https://api.deepseek.com',
    path: process.env.DEEPSEEK_API_PATH || '/v1/chat/completions',
    model: process.env.DEEPSEEK_MODEL || 'DeepSeek-V3.2',
    models: [{ id: 'DeepSeek-V3.2', name: 'DeepSeek V3.2' }],
    extraHeaders: Object.fromEntries(
      Object.entries({
        'SOFA-TraceId': process.env.SOFA_TRACE_ID,
        'SOFA-RpcId': process.env.SOFA_RPC_ID
      }).filter((e): e is [string, string] => e[1] != null)
    )
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi',
    apiKey: process.env.KIMI_API_KEY,
    endpoint: process.env.KIMI_API_ENDPOINT || '',
    path: process.env.KIMI_API_PATH || '/v1/chat/completions',
    model: process.env.KIMI_MODEL || 'Kimi-K2.5',
    models: [{ id: 'Kimi-K2.5', name: 'Kimi-K2.5' }],
    extraHeaders: Object.fromEntries(
      Object.entries({
        'SOFA-TraceId': process.env.SOFA_TRACE_ID,
        'SOFA-RpcId': process.env.SOFA_RPC_ID
      }).filter((e): e is [string, string] => e[1] != null)
    )
  },
  glm: {
    id: 'glm',
    name: 'GLM',
    apiKey: process.env.GLM_API_KEY,
    endpoint: process.env.GLM_API_ENDPOINT || '',
    path: process.env.GLM_API_PATH || '/v1/chat/completions',
    model: process.env.GLM_MODEL || 'GLM-5.1',
    models: [{ id: 'GLM-5.1', name: 'GLM-5.1' }],
    extraHeaders: Object.fromEntries(
      Object.entries({
        'SOFA-TraceId': process.env.SOFA_TRACE_ID,
        'SOFA-RpcId': process.env.SOFA_RPC_ID
      }).filter((e): e is [string, string] => e[1] != null)
    )
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    apiKey: process.env.OPENAI_API_KEY,
    endpoint: process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com',
    path: '/v1/chat/completions',
    model: process.env.OPENAI_MODEL || 'gpt-5',
    models: [
      { id: 'gpt-5', name: 'GPT-5' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' }
    ]
  }
};

/** Returns providers that have an API key configured, with their model list. */
export function getAvailableModels(): Array<{
  provider: string;
  name: string;
  models: Array<{ id: string; name: string }>;
}> {
  return Object.values(PROVIDERS)
    .filter((p) => p.apiKey)
    .map((p) => ({ provider: p.id, name: p.name, models: p.models }));
}

export function resolveProviderModel(
  reqProvider?: string,
  reqModel?: string
): { provider: string; model: string } {
  const provider = reqProvider || process.env.AI_PROVIDER || 'qwen';
  const model =
    reqModel ||
    process.env.AI_MODEL ||
    PROVIDERS[provider]?.model ||
    'qwen3-coder-480b-a35b-instruct';
  return { provider, model };
}

export function createLanguageModel(provider: string, model: string) {
  const config = PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  if (!config.apiKey) {
    throw new Error(`Missing API key for provider: ${provider}`);
  }

  const client = createOpenAI({
    apiKey: config.apiKey,
    baseURL: new URL(
      config.path ? config.path.replace('/chat/completions', '') : '/v1',
      config.endpoint
    ).toString(),
    headers: config.extraHeaders
  });

  return client(model);
}
