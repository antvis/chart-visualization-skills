/**
 * Provider Registry
 *
 * Central registry for AI providers and their configurations.
 * Supports Qwen, Anthropic Claude, and OpenAI.
 */

const PROVIDERS = {
  qwen: {
    id: 'qwen',
    name: 'Qwen',
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
    endpoint: 'https://dashscope.aliyuncs.com',
    path: '/compatible-mode/v1/chat/completions',
    type: 'openai-compatible'
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
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
    endpoint: 'https://api.anthropic.com',
    path: '/v1/messages',
    type: 'anthropic'
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4', name: 'GPT-4', isDefault: true },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ],
    apiKeyEnv: 'OPENAI_API_KEY',
    endpoint: 'https://api.openai.com',
    path: '/v1/chat/completions',
    type: 'openai-compatible'
  }
};

/**
 * List all available providers and their models
 * @returns {Array} Array of provider configs
 */
function listProviders() {
  return Object.values(PROVIDERS).map((provider) => ({
    id: provider.id,
    name: provider.name,
    models: provider.models,
    apiKeyEnv: provider.apiKeyEnv,
    hasApiKey: hasApiKey(provider.id)
  }));
}

/**
 * Get provider by ID
 * @param {string} providerId - Provider ID (qwen, anthropic, openai)
 * @returns {Object|null} Provider config or null
 */
function getProvider(providerId) {
  return PROVIDERS[providerId] || null;
}

/**
 * Check if provider exists
 * @param {string} providerId - Provider ID
 * @returns {boolean}
 */
function hasProvider(providerId) {
  return providerId in PROVIDERS;
}

/**
 * Get the environment variable name for provider's API key
 * @param {string} providerId - Provider ID
 * @returns {string} Environment variable name
 */
function getApiKeyEnv(providerId) {
  const provider = PROVIDERS[providerId];
  return provider ? provider.apiKeyEnv : null;
}

/**
 * Check if API key is set for provider
 * @param {string} providerId - Provider ID
 * @returns {boolean}
 */
function hasApiKey(providerId) {
  const envVar = getApiKeyEnv(providerId);
  if (!envVar) return false;
  // Also check for generic AI_API_KEY
  return !!(process.env[envVar] || process.env.AI_API_KEY);
}

/**
 * Get API key for provider
 * @param {string} providerId - Provider ID
 * @returns {string|null} API key or null
 */
function getApiKey(providerId) {
  const envVar = getApiKeyEnv(providerId);
  if (!envVar) return null;
  return process.env[envVar] || process.env.AI_API_KEY || null;
}

/**
 * Get default model for provider
 * @param {string} providerId - Provider ID
 * @returns {string} Default model ID
 */
function getDefaultModel(providerId) {
  const provider = PROVIDERS[providerId];
  if (!provider) return null;
  const defaultModel = provider.models.find((m) => m.isDefault);
  return defaultModel ? defaultModel.id : provider.models[0]?.id;
}

/**
 * Get provider endpoint info
 * @param {string} providerId - Provider ID
 * @returns {Object} { endpoint, path, type }
 */
function getEndpoint(providerId) {
  const provider = PROVIDERS[providerId];
  if (!provider) return null;
  return {
    endpoint: provider.endpoint,
    path: provider.path,
    type: provider.type
  };
}

/**
 * Validate provider configuration
 * @param {string} providerId - Provider ID
 * @returns {Object} { valid, errors }
 */
function validateProvider(providerId) {
  const errors = [];

  if (!hasProvider(providerId)) {
    errors.push(`Unknown provider: ${providerId}`);
  } else if (!hasApiKey(providerId)) {
    errors.push(
      `Missing API key. Set ${getApiKeyEnv(providerId)} environment variable.`
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  PROVIDERS,
  listProviders,
  getProvider,
  hasProvider,
  getApiKeyEnv,
  hasApiKey,
  getApiKey,
  getDefaultModel,
  getEndpoint,
  validateProvider
};
