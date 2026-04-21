/**
 * AI SDK 统一适配层
 *
 * 基于 @ai-sdk/openai，与 playground/src/libs/provider.ts 设计对齐。
 * 支持多种 AI 提供商：Qwen、OpenAI、DeepSeek、Kimi、GLM
 */

import { createOpenAI } from '@ai-sdk/openai';
import {
  generateText,
  tool,
  stepCountIs,
  type LanguageModel,
  type ModelMessage,
  type ToolSet
} from 'ai';
import { z } from 'zod';
import { getRuntimeConfig, PROVIDERS } from './provider-registry.js';

// ── Provider 检测 ──────────────────────────────────────────────────────────────

export function detectProviderFromModel(model: string | undefined): string {
  if (!model) return 'qwen';
  const m = model.toLowerCase();
  if (m.startsWith('gpt')) return 'openai';
  if (m.startsWith('deepseek')) return 'deepseek';
  if (m.startsWith('qwen')) return 'qwen';
  if (m.startsWith('glm')) return 'glm';
  if (m.startsWith('claude')) return 'claude';
  if (m.startsWith('kimi') || m.startsWith('moonshot')) return 'kimi';
  if (model in PROVIDERS) return model;
  return 'qwen';
}

// ── 模型工厂 ───────────────────────────────────────────────────────────────────

export function createModel(
  providerId: string,
  modelId?: string
): LanguageModel {
  const config = getRuntimeConfig(providerId);
  if (!config) throw new Error(`Unknown provider: ${providerId}`);
  if (!config.apiKey) {
    throw new Error(
      `Missing API key for ${providerId}. Please set ${providerId.toUpperCase()}_API_KEY environment variable.`
    );
  }

  const resolvedModel = modelId || config.defaultModel;
  // Strip /chat/completions suffix — @ai-sdk/openai appends it automatically
  const basePath = config.path.replace(/\/chat\/completions$/, '') || '/v1';
  const baseURL = new URL(basePath, config.endpoint).toString();

  const extraHeaders = config.extraHeaders
    ? (Object.fromEntries(
        Object.entries(config.extraHeaders).filter(([, v]) => v != null)
      ) as Record<string, string>)
    : undefined;

  const client = createOpenAI({
    apiKey: config.apiKey,
    baseURL,
    headers: extraHeaders
  });

  return client.chat(resolvedModel);
}

// ── callAI（单轮）──────────────────────────────────────────────────────────────

export interface CallAIOptions {
  provider?: string;
  model?: string;
  messages: ModelMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface CallAIResult {
  content: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
}

export async function callAI(options: CallAIOptions): Promise<CallAIResult> {
  const {
    provider = 'qwen',
    model,
    messages,
    temperature = 0.3,
    maxTokens = 10000
  } = options;

  const llm = createModel(provider, model);
  const { text, usage } = await generateText({
    model: llm,
    messages,
    temperature,
    maxOutputTokens: maxTokens,
    maxRetries: 3
  });

  return { content: text, usage };
}

// ── AgentLoop（多轮工具调用）──────────────────────────────────────────────────

export interface ToolCallLog {
  round: number;
  tool: string;
  input: Record<string, unknown>;
  resultSummary: string;
}

export interface AgentLoopOptions {
  provider?: string;
  model?: string;
  maxRounds?: number;
  tools?: ToolSet;
  toolHandlers?: Record<
    string,
    (args: Record<string, unknown>) => Promise<unknown>
  >;
}

export interface AgentLoopResult {
  content: string;
  toolCallsLog: ToolCallLog[];
}

export class AgentLoop {
  private provider: string;
  private model: string | undefined;
  private maxRounds: number;
  private tools: ToolSet;

  constructor(options: AgentLoopOptions = {}) {
    this.provider = options.provider ?? 'qwen';
    this.model = options.model;
    this.maxRounds = options.maxRounds ?? 3;
    this.tools = this._buildTools(options.tools, options.toolHandlers);
  }

  private _buildTools(
    toolDefs?: ToolSet,
    handlers?: Record<
      string,
      (args: Record<string, unknown>) => Promise<unknown>
    >
  ): ToolSet {
    // If caller already provides ai-sdk tool objects, use them directly
    if (toolDefs && Object.keys(toolDefs).length > 0) return toolDefs;

    // Otherwise build from handlers (eval legacy path: read_skills)
    if (!handlers) return {};
    return Object.fromEntries(
      Object.entries(handlers).map(([name, handler]) => [
        name,
        tool({
          description: `Tool: ${name}`,
          inputSchema: z.object({ paths: z.array(z.string()) }).passthrough(),
          execute: async (args) => handler(args as Record<string, unknown>)
        })
      ])
    );
  }

  async run(
    systemPrompt: string,
    userMessage: string
  ): Promise<AgentLoopResult> {
    const llm = createModel(this.provider, this.model);
    const toolCallsLog: ToolCallLog[] = [];

    const { text, steps } = await generateText({
      model: llm,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      tools: this.tools,
      stopWhen: stepCountIs(this.maxRounds),
      temperature: 0.3,
      maxOutputTokens: 10000,
      maxRetries: 3
    });

    // Collect tool call logs from steps
    let round = 0;
    for (const step of steps) {
      for (const tc of step.toolCalls ?? []) {
        const result = step.toolResults?.find(
          (r) => r.toolCallId === tc.toolCallId
        );
        toolCallsLog.push({
          round: ++round,
          tool: tc.toolName,
          input: (tc as { input?: Record<string, unknown> }).input ?? {},
          resultSummary: Array.isArray(
            (result as { output?: unknown } | undefined)?.output
          )
            ? `返回 ${(result as { output: unknown[] }).output.length} 条结果`
            : '执行完成'
        });
      }
    }

    return { content: text, toolCallsLog };
  }
}
