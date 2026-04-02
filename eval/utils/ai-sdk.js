#!/usr/bin/env node
/**
 * AI SDK 统一适配层
 * 支持多种 AI 提供商：Qwen、Anthropic、OpenAI
 */

const https = require('https');
const http = require('http');

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
    path: '/v1/messages',
    defaultModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6-20250514'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    endpoint: process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com',
    path: '/v1/chat/completions',
    defaultModel: 'gpt-4'
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
  return 'qwen'; // Default
}

// ── 统一消息格式转换 ───────────────────────────────────────────────────────────

function convertToProviderFormat(provider, messages, tools, options) {
  switch (provider) {
    case 'anthropic':
      return convertToAnthropicFormat(messages, tools, options);
    case 'openai':
    case 'qwen':
    case 'deepseek':
    default:
      return convertToOpenAIFormat(messages, tools, options);
  }
}

function convertToOpenAIFormat(messages, tools, options) {
  const body = {
    model: options.model,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 10000
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    if (options.toolChoice) {
      body.tool_choice = options.toolChoice;
    }
  }

  return body;
}

function convertToAnthropicFormat(messages, tools, options) {
  // 分离 system 消息
  const systemMessage = messages.find((m) => m.role === 'system');
  const userMessages = messages.filter((m) => m.role !== 'system');

  // 转换消息格式
  const anthropicMessages = userMessages.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));

  const body = {
    model: options.model,
    messages: anthropicMessages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 2000
  };

  if (systemMessage) {
    body.system = systemMessage.content;
  }

  if (tools && tools.length > 0) {
    body.tools = tools.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters
    }));
  }

  return body;
}

// ── 响应格式转换 ────────────────────────────────────────────────────────────────

function convertFromProviderFormat(provider, response) {
  switch (provider) {
    case 'anthropic':
      return convertFromAnthropicFormat(response);
    case 'openai':
    case 'qwen':
    case 'deepseek':
    default:
      return convertFromOpenAIFormat(response);
  }
}

function convertFromOpenAIFormat(response) {
  const choice = response.choices?.[0];
  if (!choice) {
    throw new Error('Invalid response format: no choices');
  }

  return {
    content: choice.message?.content || '',
    toolCalls:
      choice.message?.tool_calls?.map((tc) => ({
        id: tc.id,
        type: tc.type,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments
        }
      })) || [],
    usage: response.usage,
    raw: response
  };
}

function convertFromAnthropicFormat(response) {
  const content = response.content || [];
  const textContent = content.find((c) => c.type === 'text');
  const toolUseContent = content.filter((c) => c.type === 'tool_use');

  return {
    content: textContent?.text || '',
    toolCalls: toolUseContent.map((tc) => ({
      id: tc.id,
      type: 'function',
      function: {
        name: tc.name,
        arguments: JSON.stringify(tc.input)
      }
    })),
    usage: {
      prompt_tokens: response.usage?.input_tokens,
      completion_tokens: response.usage?.output_tokens,
      total_tokens:
        (response.usage?.input_tokens || 0) +
        (response.usage?.output_tokens || 0)
    },
    raw: response
  };
}

// ── 核心 API 调用 ───────────────────────────────────────────────────────────────

async function callAI(options) {
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

  const apiKey = config.apiKey;
  if (!apiKey) {
    throw new Error(
      `Missing API key for ${provider}. Please set ${provider.toUpperCase()}_API_KEY environment variable.`
    );
  }

  const requestBody = convertToProviderFormat(provider, messages, tools, {
    model: model || config.defaultModel,
    temperature,
    maxTokens,
    toolChoice
  });

  if (debug) {
    console.log(
      '   📤 Request:',
      JSON.stringify(requestBody, null, 2).slice(0, 500)
    );
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(requestBody);
    const endpointUrl = new URL(config.endpoint);
    const isHttps = endpointUrl.protocol === 'https:';

    const requestOptions = {
      hostname: endpointUrl.hostname,
      port: endpointUrl.port ? parseInt(endpointUrl.port) : isHttps ? 443 : 80,
      path: config.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data),
        ...(config.extraHeaders || {})
      }
    };

    // Anthropic uses x-api-key
    if (provider === 'anthropic') {
      requestOptions.headers['x-api-key'] = apiKey;
      requestOptions.headers['anthropic-version'] = '2023-06-01';
      delete requestOptions.headers['Authorization'];
    }

    const client = isHttps ? https : http;

    const req = client.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          if (debug) {
            console.log('   📥 Response:', body.slice(0, 500));
          }

          const response = JSON.parse(body);

          if (response.error) {
            reject(
              new Error(
                response.error.message || JSON.stringify(response.error)
              )
            );
          } else {
            resolve(convertFromProviderFormat(provider, response));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout (${timeout}ms)`));
    });

    req.on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });

    req.write(data);
    req.end();
  });
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

      try {
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
              console.log(
                `   📞 Tool call: ${toolName}(${JSON.stringify(toolArgs)})`
              );
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
      } catch (error) {
        if (this.debug) {
          console.log(`   ⚠️ Agent loop error: ${error.message}`);
        }
        break;
      }
    }

    // If maxRounds exhausted and still no final content, force a final generation call
    if (!finalContent && this.toolCallsLog.length > 0) {
      try {
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
              content:
                '请根据以上参考文档，直接生成最终代码，只输出代码块，不要再调用工具。'
            }
          ],
          // No tools - force text output
          debug: this.debug
        });
        finalContent = finalResponse.content || '';
      } catch (e) {
        // ignore, fall through to lastAssistantContent
      }
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
