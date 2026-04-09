/**
 * AI SDK Unified Adapter Layer
 * Supports multiple AI providers: Qwen, OpenAI, DeepSeek, Kimi, GLM
 *
 * All providers use OpenAI-compatible format via the openai package.
 */

import OpenAI from 'openai';
import { PROVIDERS, type Provider } from './provider-registry';

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

async function callOpenAICompat({
  config,
  model,
  messages,
  tools,
  toolChoice,
  temperature,
  maxTokens,
  timeout
}: {
  config: Provider;
  model: string;
  messages: Array<{ role: string; content: string }>;
  tools?: unknown[];
  toolChoice?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}): Promise<AIResponse> {
  const client = createOpenAIClient({
    apiKey: config.apiKey!,
    endpoint: config.endpoint,
    path: config.path,
    extraHeaders: config.extraHeaders
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
    timeout = 120000
  } = options;

  const config = PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  if (!config.apiKey) {
    throw new Error(
      `Missing API key for ${provider}. Please set ${provider.toUpperCase()}_API_KEY environment variable.`
    );
  }

  const resolvedModel = model || config.model;

  const maxRetries = 3;
  const baseDelay = 2000;

  try {
    return await callOpenAICompat({
      config,
      model: resolvedModel,
      messages,
      tools,
      toolChoice,
      temperature,
      maxTokens,
      timeout
    });
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
          let toolArgs: unknown;

          try {
            toolArgs = JSON.parse(toolCall.function.arguments);
          } catch {
            toolArgs = {};
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
