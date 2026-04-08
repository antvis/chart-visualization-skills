#!/usr/bin/env node
/**
 * AI SDK 统一适配层
 * 支持多种 AI 提供商：Qwen、Anthropic、OpenAI、DeepSeek、Kimi
 *
 * OpenAI 兼容格式（qwen/deepseek/openai/kimi）使用 openai 包
 * Anthropic 格式使用 @anthropic-ai/sdk
 */

const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

// ── 配置 ───────────────────────────────────────────────────────────────────────

const PROVIDER_CONFIG = {
  qwen: {
    apiKey: process.env.QWEN_API_KEY,
    endpoint: process.env.QWEN_API_ENDPOINT || 'https://dashscope.aliyuncs.com',
    path: process.env.QWEN_API_PATH || '/v1/chat/completions',
    defaultModel: process.env.QWEN_MODEL || 'qwen3-coder-480b-a35b-instruct'
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    endpoint: process.env.DEEPSEEK_API_ENDPOINT || 'https://api.deepseek.com',
    path: process.env.DEEPSEEK_API_PATH || '/v1/chat/completions',
    defaultModel: process.env.DEEPSEEK_MODEL || 'DeepSeek-V3.2',
    extraHeaders: {
      'SOFA-TraceId': process.env.SOFA_TRACE_ID,
      'SOFA-RpcId': process.env.SOFA_RPC_ID
    }
  },
  anthropic: {
    apiKey: process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY,
    endpoint:
      process.env.ANTHROPIC_API_ENDPOINT ||
      process.env.ANTHROPIC_BASE_URL ||
      'https://api.anthropic.com',
    defaultModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6-20250514'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    endpoint: process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com',
    defaultModel: 'gpt-4'
  },
  kimi: {
    apiKey: process.env.KIMI_API_KEY,
    endpoint: process.env.KIMI_API_ENDPOINT || 'https://api.moonshot.cn',
    path: '/v1/chat/completions',
    defaultModel: process.env.KIMI_MODEL || 'kimi-k2-thinking'
  }
};

// ── Provider 检测 ──────────────────────────────────────────────────────────────

/**
 * Detect provider from model name
 * @param {string} model - Model ID
 * @returns {string} Provider ID (qwen, anthropic, openai, deepseek)
 */
function detectProviderFromModel(model) {
  if (!model) return 'qwen';
  const modelLower = model.toLowerCase();
  if (modelLower.startsWith('claude')) return 'anthropic';
  if (modelLower.startsWith('gpt')) return 'openai';
  if (modelLower.startsWith('deepseek')) return 'deepseek';
  if (modelLower.startsWith('qwen')) return 'qwen';
  if (modelLower.startsWith('kimi') || modelLower.startsWith('moonshot')) return 'kimi';
  return 'qwen';
}

// ── 客户端工厂 ─────────────────────────────────────────────────────────────────

function createOpenAIClient(provider, config) {
  const extraHeaders = config.extraHeaders
    ? Object.fromEntries(Object.entries(config.extraHeaders).filter(([, v]) => v != null))
    : {};

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: `${config.endpoint}${config.path ? config.path.replace('/chat/completions', '') : '/v1'}`,
    defaultHeaders: Object.keys(extraHeaders).length ? extraHeaders : undefined
  });
}

function createAnthropicClient(config) {
  return new Anthropic({
    apiKey: config.apiKey,
    baseURL: config.endpoint !== 'https://api.anthropic.com' ? config.endpoint : undefined
  });
}

// ── 核心 API 调用 ───────────────────────────────────────────────────────────────

const RETRY_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

async function callAI(options, _retryCount = 0) {
  const {
    provider = 'qwen',
    model,
    messages,
    tools,
    toolChoice,
    temperature,
    maxTokens,
    timeout = 120000,
    debug = false
  } = options;

  const config = PROVIDER_CONFIG[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  if (!config.apiKey) {
    throw new Error(
      `Missing API key for ${provider}. Please set ${provider.toUpperCase()}_API_KEY environment variable.`
    );
  }

  const resolvedModel = model || config.defaultModel;

  const maxRetries = 3;
  const baseDelay = 2000; // 2s

  try {
    if (provider === 'anthropic') {
      return await callAnthropic({ config, model: resolvedModel, messages, tools, temperature, maxTokens, timeout, debug });
    } else {
      return await callOpenAICompat({ provider, config, model: resolvedModel, messages, tools, toolChoice, temperature, maxTokens, timeout, debug });
    }
  } catch (error) {
    const statusCode = error.status || error.statusCode || error.response?.status;
    const isRetryable = RETRY_STATUS_CODES.has(statusCode) || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET';

    if (isRetryable && _retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, _retryCount);
      if (debug) {
        console.log(`   ⏳ Retry ${_retryCount + 1}/${maxRetries} after ${delay}ms (${error.message})`);
      }
      await new Promise((r) => setTimeout(r, delay));
      return callAI(options, _retryCount + 1);
    }

    throw error;
  }
}

async function callOpenAICompat({ provider, config, model, messages, tools, toolChoice, temperature, maxTokens, timeout, debug }) {
  const client = createOpenAIClient(provider, config);

  const params = {
    model,
    messages,
    temperature: temperature ?? 0.3,
    max_tokens: maxTokens ?? 10000
  };

  if (tools && tools.length > 0) {
    params.tools = tools;
    if (toolChoice) params.tool_choice = toolChoice;
  }

  if (debug) {
    console.log('   📤 Request:', JSON.stringify(params, null, 2).slice(0, 500));
  }

  const response = await client.chat.completions.create(params, { timeout });

  if (debug) {
    console.log('   📥 Response:', JSON.stringify(response, null, 2).slice(0, 500));
  }

  const choice = response.choices?.[0];
  if (!choice) throw new Error('Invalid response format: no choices');

  return {
    content: choice.message?.content || '',
    toolCalls:
      choice.message?.tool_calls?.map((tc) => ({
        id: tc.id,
        type: tc.type,
        function: { name: tc.function.name, arguments: tc.function.arguments }
      })) || [],
    usage: response.usage,
    raw: response
  };
}

async function callAnthropic({ config, model, messages, tools, temperature, maxTokens, timeout, debug }) {
  const client = createAnthropicClient(config);

  const systemMessage = messages.find((m) => m.role === 'system');
  const userMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

  const params = {
    model,
    messages: userMessages,
    temperature: temperature ?? 0.3,
    max_tokens: maxTokens ?? 2000
  };

  if (systemMessage) params.system = systemMessage.content;

  if (tools && tools.length > 0) {
    params.tools = tools.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters
    }));
  }

  if (debug) {
    console.log('   📤 Request:', JSON.stringify(params, null, 2).slice(0, 500));
  }

  const response = await client.messages.create(params, { timeout });

  if (debug) {
    console.log('   📥 Response:', JSON.stringify(response, null, 2).slice(0, 500));
  }

  const textContent = response.content?.find((c) => c.type === 'text');
  const toolUseContent = response.content?.filter((c) => c.type === 'tool_use') || [];

  return {
    content: textContent?.text || '',
    toolCalls: toolUseContent.map((tc) => ({
      id: tc.id,
      type: 'function',
      function: { name: tc.name, arguments: JSON.stringify(tc.input) }
    })),
    usage: {
      prompt_tokens: response.usage?.input_tokens,
      completion_tokens: response.usage?.output_tokens,
      total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
    },
    raw: response
  };
}

// ── 流式调用（可选）─────────────────────────────────────────────────────────────

async function* streamAI(options) {
  // TODO: 实现流式响应支持
  throw new Error('Streaming not implemented yet');
}

// ── 工具执行辅助 ────────────────────────────────────────────────────────────────

class AgentLoop {
  constructor(options = {}) {
    this.provider = options.provider || 'qwen';
    this.model = options.model;
    this.maxRounds = options.maxRounds || 3;
    this.tools = options.tools || [];
    this.toolHandlers = options.toolHandlers || {};
    this.debug = options.debug || false;
    this.messages = [];
    this.toolCallsLog = [];
  }

  async run(systemPrompt, userMessage) {
    this.messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    this.toolCallsLog = [];
    let finalContent = '';
    let lastAssistantContent = '';

    for (let round = 0; round < this.maxRounds; round++) {
      if (this.debug) {
        console.log(`   🔄 Agent round ${round + 1}/${this.maxRounds}...`);
      }

      const response = await callAI({
        provider: this.provider,
        model: this.model,
        messages: this.messages,
        tools: this.tools,
        toolChoice: 'auto',
        debug: this.debug && round === 0
      });

      if (response.content) {
        lastAssistantContent = response.content;
      }

      if (response.toolCalls && response.toolCalls.length > 0) {
        this.messages.push({
          role: 'assistant',
          content: response.content || '',
          tool_calls: response.toolCalls
        });

        for (const toolCall of response.toolCalls) {
          const toolName = toolCall.function.name;
          let toolArgs;

          try {
            toolArgs = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            toolArgs = {};
          }

          if (this.debug) {
            console.log(`   📞 Tool call: ${toolName}(${JSON.stringify(toolArgs)})`);
          }

          let toolResult;
          if (this.toolHandlers[toolName]) {
            toolResult = await this.toolHandlers[toolName](toolArgs);
          } else {
            toolResult = { error: `Unknown tool: ${toolName}` };
          }

          this.toolCallsLog.push({
            round: round + 1,
            tool: toolName,
            args: toolArgs,
            resultSummary: Array.isArray(toolResult)
              ? `返回 ${toolResult.length} 条结果`
              : '执行完成'
          });

          this.messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
          });
        }
      } else {
        finalContent = response.content || '';
        break;
      }
    }

    // If maxRounds exhausted and still no final content, force a final generation call
    if (!finalContent && this.toolCallsLog.length > 0) {
      if (this.debug) {
        console.log('   🔄 Force final generation (no tools)...');
      }
      const finalResponse = await callAI({
        provider: this.provider,
        model: this.model,
        messages: [
          ...this.messages,
          {
            role: 'user',
            content: '请根据以上参考文档，直接生成最终代码，只输出代码块，不要再调用工具。'
          }
        ],
        debug: this.debug
      });
      finalContent = finalResponse.content || '';
    }

    return {
      content: finalContent || lastAssistantContent,
      toolCallsLog: this.toolCallsLog
    };
  }
}

// ── 导出 ───────────────────────────────────────────────────────────────────────

module.exports = {
  callAI,
  streamAI,
  AgentLoop,
  PROVIDER_CONFIG,
  detectProviderFromModel
};
