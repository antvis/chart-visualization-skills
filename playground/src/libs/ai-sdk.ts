/**
 * AI SDK Unified Adapter Layer
 * Supports multiple AI providers: Qwen, Anthropic, OpenAI, DeepSeek, Kimi, GLM
 *
 * OpenAI compatible format (qwen/deepseek/openai/kimi/glm) uses openai package
 * Anthropic format uses @anthropic-ai/sdk
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getRuntimeConfig } from './provider-registry';

// Retry status codes
const RETRY_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

interface CallAIOptions {
  provider?: string;
  model?: string;
  messages: Array<{ role: string; content: string }>;
  tools?: unknown[];
  toolChoice?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  debug?: boolean;
}

interface AIResponse {
  content: string;
  toolCalls: Array<{
    id: string;
    type: string;
    function: { name: string; arguments: string };
  }>;
  usage?: unknown;
  raw?: unknown;
}

function createOpenAIClient(config: {
  apiKey: string;
  endpoint: string;
  path?: string;
  extraHeaders?: Record<string, string | undefined>;
}) {
  const extraHeaders = config.extraHeaders
    ? Object.fromEntries(
        Object.entries(config.extraHeaders).filter(([, v]) => v != null)
      )
    : {};

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: new URL(
      config.path ? config.path.replace('/chat/completions', '') : '/v1',
      config.endpoint
    ).toString(),
    defaultHeaders: Object.keys(extraHeaders).length ? extraHeaders : undefined
  });
}

function createAnthropicClient(config: { apiKey: string; endpoint: string }) {
  return new Anthropic({
    apiKey: config.apiKey,
    baseURL:
      config.endpoint !== 'https://api.anthropic.com'
        ? config.endpoint
        : undefined
  });
}

async function callOpenAICompat({
  config,
  model,
  messages,
  tools,
  toolChoice,
  temperature,
  maxTokens,
  timeout,
  debug
}: {
  config: ReturnType<typeof getRuntimeConfig>;
  model: string;
  messages: Array<{ role: string; content: string }>;
  tools?: unknown[];
  toolChoice?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  debug?: boolean;
}): Promise<AIResponse> {
  const client = createOpenAIClient({
    apiKey: config!.apiKey!,
    endpoint: config!.endpoint,
    path: config!.path,
    extraHeaders: config!.extraHeaders
  });

  const params: OpenAI.Chat.ChatCompletionCreateParams = {
    model,
    messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
    temperature: temperature ?? 0.3,
    max_tokens: maxTokens ?? 10000
  };

  if (tools && tools.length > 0) {
    params.tools = tools as OpenAI.Chat.ChatCompletionTool[];
    if (toolChoice)
      params.tool_choice =
        toolChoice as OpenAI.Chat.ChatCompletionToolChoiceOption;
  }

  if (debug) {
    console.log(
      '   📤 Request:',
      JSON.stringify(params, null, 2).slice(0, 500)
    );
  }

  const response = await client.chat.completions.create(params, { timeout });

  if (debug) {
    console.log(
      '   📥 Response:',
      JSON.stringify(response, null, 2).slice(0, 500)
    );
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

async function callAnthropic({
  config,
  model,
  messages,
  tools,
  temperature,
  maxTokens,
  timeout,
  debug
}: {
  config: ReturnType<typeof getRuntimeConfig>;
  model: string;
  messages: Array<{ role: string; content: string }>;
  tools?: unknown[];
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  debug?: boolean;
}): Promise<AIResponse> {
  const client = createAnthropicClient({
    apiKey: config!.apiKey!,
    endpoint: config!.endpoint
  });

  const systemMessage = messages.find((m) => m.role === 'system');
  const userMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content
    }));

  const params: Anthropic.MessageCreateParams = {
    model,
    messages: userMessages,
    temperature: temperature ?? 0.3,
    max_tokens: maxTokens ?? 2000
  };

  if (systemMessage) params.system = systemMessage.content;

  if (tools && tools.length > 0) {
    params.tools = tools.map((t: unknown) => {
      const tool = t as {
        function: { name: string; description: string; parameters: unknown };
      };
      return {
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters as Anthropic.Tool.InputSchema
      };
    });
  }

  if (debug) {
    console.log(
      '   📤 Request:',
      JSON.stringify(params, null, 2).slice(0, 500)
    );
  }

  const response = await client.messages.create(params, { timeout });

  if (debug) {
    console.log(
      '   📥 Response:',
      JSON.stringify(response, null, 2).slice(0, 500)
    );
  }

  const textContent = response.content?.find(
    (c): c is Anthropic.TextBlock => c.type === 'text'
  );
  const toolUseContent =
    response.content?.filter(
      (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use'
    ) || [];

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
      total_tokens:
        (response.usage?.input_tokens || 0) +
        (response.usage?.output_tokens || 0)
    },
    raw: response
  };
}

export async function callAI(
  options: CallAIOptions,
  _retryCount = 0
): Promise<AIResponse> {
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

  const config = getRuntimeConfig(provider);
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
  const baseDelay = 2000;

  try {
    if (provider === 'anthropic') {
      return await callAnthropic({
        config,
        model: resolvedModel,
        messages,
        tools,
        temperature,
        maxTokens,
        timeout,
        debug
      });
    } else {
      return await callOpenAICompat({
        config,
        model: resolvedModel,
        messages,
        tools,
        toolChoice,
        temperature,
        maxTokens,
        timeout,
        debug
      });
    }
  } catch (error) {
    const err = error as {
      status?: number;
      statusCode?: number;
      response?: { status?: number };
      code?: string;
      message?: string;
    };
    const statusCode = err.status || err.statusCode || err.response?.status;
    const isRetryable =
      RETRY_STATUS_CODES.has(statusCode || 0) ||
      err.code === 'ETIMEDOUT' ||
      err.code === 'ECONNRESET';

    if (isRetryable && _retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, _retryCount);
      if (debug) {
        console.log(
          `   ⏳ Retry ${_retryCount + 1}/${maxRetries} after ${delay}ms (${err.message})`
        );
      }
      await new Promise((r) => setTimeout(r, delay));
      return callAI(options, _retryCount + 1);
    }

    throw error;
  }
}

interface AgentLoopOptions {
  provider?: string;
  model?: string;
  maxRounds?: number;
  tools?: unknown[];
  toolHandlers?: Record<string, (args: unknown) => unknown | Promise<unknown>>;
  debug?: boolean;
}

interface AgentLoopResult {
  content: string;
  toolCallsLog: Array<{
    round: number;
    tool: string;
    args: unknown;
    resultSummary: string;
  }>;
}

export class AgentLoop {
  private provider: string;
  private model?: string;
  private maxRounds: number;
  private tools: unknown[];
  private toolHandlers: Record<
    string,
    (args: unknown) => unknown | Promise<unknown>
  >;
  private debug: boolean;
  private messages: Array<
    | { role: string; content: string; tool_calls?: unknown[] }
    | { role: 'tool'; tool_call_id: string; content: string }
  > = [];
  public toolCallsLog: Array<{
    round: number;
    tool: string;
    args: unknown;
    resultSummary: string;
  }> = [];

  constructor(options: AgentLoopOptions = {}) {
    this.provider = options.provider || 'qwen';
    this.model = options.model;
    this.maxRounds = options.maxRounds || 3;
    this.tools = options.tools || [];
    this.toolHandlers = options.toolHandlers || {};
    this.debug = options.debug || false;
  }

  async run(
    systemPrompt: string,
    userMessage: string
  ): Promise<AgentLoopResult> {
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
          let toolArgs: unknown;

          try {
            toolArgs = JSON.parse(toolCall.function.arguments);
          } catch {
            toolArgs = {};
          }

          if (this.debug) {
            console.log(
              `   📞 Tool call: ${toolName}(${JSON.stringify(toolArgs)})`
            );
          }

          let toolResult: unknown;
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
            content:
              '请根据以上参考文档，直接生成最终代码，只输出代码块，不要再调用工具。'
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
