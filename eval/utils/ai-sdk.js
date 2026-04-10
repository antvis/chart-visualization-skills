#!/usr/bin/env node
/**
 * AI SDK 统一适配层
 * 支持多种 AI 提供商：Qwen、OpenAI、DeepSeek、Kimi、GLM
 *
 * OpenAI 兼容格式（qwen/deepseek/openai/kimi/glm）使用 openai 包
 *
 * Provider/model 元数据统一在 provider-registry.js 维护，
 * 本文件通过 getRuntimeConfig() 读取，不再重复定义。
 */

const OpenAI = require('openai');
const pRetry = require('p-retry');
const { getRuntimeConfig, PROVIDERS } = require('./provider-registry');

// ── Provider 检测 ──────────────────────────────────────────────────────────────

/**
 * Detect provider from model name
 * @param {string} model - Model ID
 * @returns {string} Provider ID
 */
function detectProviderFromModel(model) {
  if (!model) return 'qwen';
  const modelLower = model.toLowerCase();
  if (modelLower.startsWith('gpt')) return 'openai';
  if (modelLower.startsWith('deepseek')) return 'deepseek';
  if (modelLower.startsWith('qwen')) return 'qwen';
  if (modelLower.startsWith('glm')) return 'glm';
  if (modelLower.startsWith('kimi') || modelLower.startsWith('moonshot'))
    return 'kimi';
  if (model in PROVIDERS) return model;
  return 'qwen';
}

// ── 客户端工厂 ─────────────────────────────────────────────────────────────────

function createOpenAIClient(config) {
  const extraHeaders = config.extraHeaders
    ? Object.fromEntries(
        Object.entries(config.extraHeaders).filter(([, v]) => v != null)
      )
    : {};

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: `${config.endpoint}${config.path ? config.path.replace('/chat/completions', '') : '/v1'}`,
    defaultHeaders: Object.keys(extraHeaders).length ? extraHeaders : undefined
  });
}

// ── 核心 API 调用 ───────────────────────────────────────────────────────────────

const RETRY_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const RETRY_ERROR_CODES = new Set(['ETIMEDOUT', 'ECONNRESET']);

async function callAI(options) {
  const {
    provider = 'qwen',
    model,
    messages,
    tools,
    toolChoice,
    temperature,
    maxTokens,
    timeout = 120000
  } = options;

  const config = getRuntimeConfig(provider);
  if (!config) throw new Error(`Unknown provider: ${provider}`);

  if (!config.apiKey) {
    throw new Error(
      `Missing API key for ${provider}. Please set ${provider.toUpperCase()}_API_KEY environment variable.`
    );
  }

  const resolvedModel = model || config.defaultModel;

  return pRetry(
    () =>
      callOpenAICompat({
        config,
        model: resolvedModel,
        messages,
        tools,
        toolChoice,
        temperature,
        maxTokens,
        timeout
      }),
    {
      retries: 3,
      factor: 2,
      minTimeout: 2000,
      maxTimeout: 16000,
      randomize: true,
      onFailedAttempt(err) {
        const statusCode = err.status || err.statusCode || err.response?.status;
        const isRetryable =
          RETRY_STATUS_CODES.has(statusCode) ||
          RETRY_ERROR_CODES.has(err.code);
        if (!isRetryable) {
          throw new pRetry.AbortError(err);
        }
      }
    }
  );
}

async function callOpenAICompat({
  config,
  model,
  messages,
  tools,
  toolChoice,
  temperature,
  maxTokens,
  timeout
}) {
  const client = createOpenAIClient(config);

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

  const response = await client.chat.completions.create(params, { timeout });

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

// ── 流式调用（可选）─────────────────────────────────────────────────────────────

async function* streamAI(_options) {
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
      const response = await callAI({
        provider: this.provider,
        model: this.model,
        messages: this.messages,
        tools: this.tools,
        toolChoice: 'auto'
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
          } catch {
            toolArgs = {};
          }

          const toolResult = this.toolHandlers[toolName]
            ? await this.toolHandlers[toolName](toolArgs)
            : { error: `Unknown tool: ${toolName}` };

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

    if (!finalContent && this.toolCallsLog.length > 0) {
      const finalResponse = await callAI({
        provider: this.provider,
        model: this.model,
        messages: [
          ...this.messages,
          {
            role: 'user',
            content:
              '请根据以上参考文档，直接生成最终代码，只输出代码块，不要再调用工具。'
          }
        ]
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
  detectProviderFromModel
};
