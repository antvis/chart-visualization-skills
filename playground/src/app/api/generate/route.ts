import { NextRequest } from 'next/server';
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from 'ai';
import { buildBm25SystemPrompt, createRetrieveTool } from '@/libs/retriever';
import { buildSystemPrompt, createSkillTools } from '@/libs/skill-tools';
import {
  createLanguageModel,
  resolveProviderModel
} from '@/libs/provider-registry';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const {
    messages = [],
    library = 'g2',
    mode = 'tool-call',
    currentCode = null,
    provider: reqProvider,
    model: reqModel
  }: {
    messages?: UIMessage[];
    library?: string;
    mode?: 'tool-call' | 'bm25';
    currentCode?: string | null;
    provider?: string;
    model?: string;
  } = await request.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('messages are required', { status: 400 });
  }

  const { provider, model } = resolveProviderModel(reqProvider, reqModel);
  const languageModel = createLanguageModel(provider, model);

  const system = [
    mode === 'tool-call' ? buildSystemPrompt(library) : buildBm25SystemPrompt(library),
    currentCode
      ? `当前代码如下，请在后续回答中基于它进行修改并返回完整 javascript 代码块：\n\`\`\`javascript\n${currentCode}\n\`\`\``
      : ''
  ]
    .filter(Boolean)
    .join('\n\n');

  const result = streamText({
    model: languageModel,
    system,
    messages: await convertToModelMessages(messages),
    tools:
      mode === 'tool-call'
        ? createSkillTools(library)
        : { retrieve: createRetrieveTool(library) },
    // skill 模式通常要经过 load_skill → list_references → read_file 多轮调用，BM25 只需 retrieve 一轮
    stopWhen: stepCountIs(mode === 'tool-call' ? 8 : 6),
    temperature: 0.3,
    maxOutputTokens: 4000
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    messageMetadata: ({ part }) => {
      if (part.type === 'finish') {
        return {
          provider,
          model,
          mode,
          usage: part.totalUsage
        };
      }
      return undefined;
    }
  });
}
