/**
 * Provider Registry
 *
 * Single source of truth for all provider metadata and env var names.
 */

export const PROVIDERS: Record<
  string,
  {
    id: string;
    name: string;
    type: string;
    models: Array<{ id: string; name: string; isDefault?: boolean }>;
    apiKeyEnv: string;
    fallbackApiKeyEnv?: string;
    endpointEnv: string;
    fallbackEndpointEnv?: string;
    pathEnv?: string;
    modelEnv?: string;
    defaultEndpoint: string;
    defaultPath: string;
    extraHeaderEnvs?: Record<string, string>;
  }
> = {
  qwen: {
    id: 'qwen',
    name: 'Qwen',
    type: 'openai-compatible',
    models: [
      {
        id: 'qwen3-coder-480b-a35b-instruct',
        name: 'Qwen Coder Plus',
        isDefault: true
      },
      { id: 'qwen-turbo', name: 'Qwen Turbo' },
      { id: 'qwen-plus', name: 'Qwen Plus' },
      { id: 'qwen-max', name: 'Qwen Max' }
    ],
    apiKeyEnv: 'QWEN_API_KEY',
    endpointEnv: 'QWEN_API_ENDPOINT',
    pathEnv: 'QWEN_API_PATH',
    modelEnv: 'QWEN_MODEL',
    defaultEndpoint: 'https://dashscope.aliyuncs.com',
    defaultPath: '/compatible-mode/v1/chat/completions'
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    type: 'openai-compatible',
    models: [{ id: 'DeepSeek-V3.2', name: 'DeepSeek V3.2', isDefault: true }],
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    endpointEnv: 'DEEPSEEK_API_ENDPOINT',
    pathEnv: 'DEEPSEEK_API_PATH',
    modelEnv: 'DEEPSEEK_MODEL',
    defaultEndpoint: 'https://api.deepseek.com',
    defaultPath: '/v1/chat/completions',
    extraHeaderEnvs: {
      'SOFA-TraceId': 'SOFA_TRACE_ID',
      'SOFA-RpcId': 'SOFA_RPC_ID'
    }
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi',
    type: 'openai-compatible',
    models: [{ id: 'Kimi-K2.5', name: 'Kimi-K2.5', isDefault: true }],
    apiKeyEnv: 'KIMI_API_KEY',
    endpointEnv: 'KIMI_API_ENDPOINT',
    pathEnv: 'KIMI_API_PATH',
    modelEnv: 'KIMI_MODEL',
    defaultPath: '/v1/chat/completions',
    defaultEndpoint: '',
    extraHeaderEnvs: {
      'SOFA-TraceId': 'SOFA_TRACE_ID',
      'SOFA-RpcId': 'SOFA_RPC_ID'
    }
  },
  glm: {
    id: 'glm',
    name: 'GLM',
    type: 'openai-compatible',
    models: [{ id: 'GLM-5.1', name: 'GLM-5.1', isDefault: true }],
    apiKeyEnv: 'GLM_API_KEY',
    endpointEnv: 'GLM_API_ENDPOINT',
    pathEnv: 'GLM_API_PATH',
    modelEnv: 'GLM_MODEL',
    defaultPath: '/v1/chat/completions',
    defaultEndpoint: '',
    extraHeaderEnvs: {
      'SOFA-TraceId': 'SOFA_TRACE_ID',
      'SOFA-RpcId': 'SOFA_RPC_ID'
    }
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    type: 'anthropic',
    models: [
      {
        id: 'claude-sonnet-4-6-20250514',
        name: 'Claude Sonnet 4.6',
        isDefault: true
      },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
    ],
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    fallbackApiKeyEnv: 'AI_API_KEY',
    endpointEnv: 'ANTHROPIC_API_ENDPOINT',
    fallbackEndpointEnv: 'ANTHROPIC_BASE_URL',
    modelEnv: 'ANTHROPIC_MODEL',
    defaultEndpoint: 'https://api.anthropic.com',
    defaultPath: '/v1/messages'
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai-compatible',
    models: [
      { id: 'gpt-4', name: 'GPT-4', isDefault: true },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ],
    apiKeyEnv: 'OPENAI_API_KEY',
    endpointEnv: 'OPENAI_API_ENDPOINT',
    modelEnv: 'OPENAI_MODEL',
    defaultEndpoint: 'https://api.openai.com',
    defaultPath: '/v1/chat/completions'
  }
};

export interface RuntimeConfig {
  apiKey: string | null;
  endpoint: string;
  path: string;
  defaultModel: string;
  extraHeaders?: Record<string, string | undefined>;
}

export function getRuntimeConfig(providerId: string): RuntimeConfig | null {
  const p = PROVIDERS[providerId];
  if (!p) return null;

  const apiKey =
    (p.apiKeyEnv && process.env[p.apiKeyEnv]) ||
    (p.fallbackApiKeyEnv && process.env[p.fallbackApiKeyEnv]) ||
    process.env.AI_API_KEY ||
    null;

  const endpoint =
    (p.endpointEnv && process.env[p.endpointEnv]) ||
    (p.fallbackEndpointEnv && process.env[p.fallbackEndpointEnv]) ||
    p.defaultEndpoint;

  const path = (p.pathEnv && process.env[p.pathEnv]) || p.defaultPath;

  const defaultModelId =
    p.models.find((m) => m.isDefault)?.id || p.models[0]?.id;
  const defaultModel =
    (p.modelEnv && process.env[p.modelEnv]) || defaultModelId;

  const config: RuntimeConfig = { apiKey, endpoint, path, defaultModel };

  if (p.extraHeaderEnvs) {
    config.extraHeaders = Object.fromEntries(
      Object.entries(p.extraHeaderEnvs).map(([header, envVar]) => [
        header,
        process.env[envVar]
      ])
    );
  }

  return config;
}

export function hasProvider(providerId: string): boolean {
  return providerId in PROVIDERS;
}

export function hasApiKey(providerId: string): boolean {
  const p = PROVIDERS[providerId];
  if (!p) return false;
  return !!(
    process.env[p.apiKeyEnv] ||
    (p.fallbackApiKeyEnv && process.env[p.fallbackApiKeyEnv]) ||
    process.env.AI_API_KEY
  );
}

export default {
  PROVIDERS,
  getRuntimeConfig,
  hasProvider,
  hasApiKey
};
