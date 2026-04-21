/**
 * Provider Registry
 *
 * Single source of truth for all provider metadata and env var names.
 * ai-sdk.ts derives runtime config from here via getRuntimeConfig().
 */

export interface ModelDef {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface ProviderDef {
  id: string;
  name: string;
  type: 'openai-compatible';
  models: ModelDef[];
  apiKeyEnv: string;
  fallbackApiKeyEnv?: string;
  endpointEnv?: string;
  fallbackEndpointEnv?: string;
  pathEnv?: string;
  modelEnv?: string;
  defaultEndpoint?: string;
  defaultPath: string;
  extraHeaderEnvs?: Record<string, string>;
}

export interface RuntimeConfig {
  apiKey: string | null;
  endpoint: string | undefined;
  path: string;
  defaultModel: string;
  extraHeaders?: Record<string, string | undefined>;
}

export const PROVIDERS: Record<string, ProviderDef> = {
  qwen: {
    id: 'qwen',
    name: 'Qwen',
    type: 'openai-compatible',
    models: [
      { id: 'qwen3-coder-480b-a35b-instruct', name: 'Qwen Coder Plus', isDefault: true },
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
    extraHeaderEnvs: { 'SOFA-TraceId': 'SOFA_TRACE_ID', 'SOFA-RpcId': 'SOFA_RPC_ID' }
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
    extraHeaderEnvs: { 'SOFA-TraceId': 'SOFA_TRACE_ID', 'SOFA-RpcId': 'SOFA_RPC_ID' }
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
    extraHeaderEnvs: { 'SOFA-TraceId': 'SOFA_TRACE_ID', 'SOFA-RpcId': 'SOFA_RPC_ID' }
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
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    type: 'openai-compatible',
    models: [{ id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4-6', isDefault: true }],
    apiKeyEnv: 'CLAUDE_API_KEY',
    endpointEnv: 'CLAUDE_API_ENDPOINT',
    pathEnv: 'CLAUDE_API_PATH',
    modelEnv: 'CLAUDE_MODEL',
    defaultEndpoint: 'https://api.claude.ai',
    defaultPath: '/v1/chat/completions'
  }
};

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

  const defaultModelId = p.models.find((m) => m.isDefault)?.id ?? p.models[0]?.id;
  const defaultModel = (p.modelEnv && process.env[p.modelEnv]) || defaultModelId;

  const config: RuntimeConfig = { apiKey, endpoint, path, defaultModel };

  if (p.extraHeaderEnvs) {
    config.extraHeaders = Object.fromEntries(
      Object.entries(p.extraHeaderEnvs).map(([header, envVar]) => [header, process.env[envVar]])
    );
  }

  return config;
}

export function listProviders() {
  return Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    name: p.name,
    models: p.models,
    apiKeyEnv: p.apiKeyEnv,
    hasApiKey: hasApiKey(p.id)
  }));
}

export function getProvider(providerId: string): ProviderDef | null {
  return PROVIDERS[providerId] ?? null;
}

export function hasProvider(providerId: string): boolean {
  return providerId in PROVIDERS;
}

export function getApiKeyEnv(providerId: string): string | null {
  return PROVIDERS[providerId]?.apiKeyEnv ?? null;
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

export function getApiKey(providerId: string): string | null {
  const p = PROVIDERS[providerId];
  if (!p) return null;
  return (
    process.env[p.apiKeyEnv] ||
    (p.fallbackApiKeyEnv && process.env[p.fallbackApiKeyEnv]) ||
    process.env.AI_API_KEY ||
    null
  );
}

export function getDefaultModel(providerId: string): string | null {
  const p = PROVIDERS[providerId];
  if (!p) return null;
  return p.models.find((m) => m.isDefault)?.id ?? p.models[0]?.id ?? null;
}

export function validateProvider(providerId: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!hasProvider(providerId)) {
    errors.push(`Unknown provider: ${providerId}`);
  } else if (!hasApiKey(providerId)) {
    errors.push(`Missing API key. Set ${getApiKeyEnv(providerId)} environment variable.`);
  }
  return { valid: errors.length === 0, errors };
}
