import { NextRequest } from 'next/server';
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from 'ai';
import { buildPrompt } from '@/libs/retriever';
import { buildSystemPrompt, createSkillTools } from '@/libs/skill-tools';
import {
  createLanguageModel,
  resolveProviderModel
} from '@/libs/provider-registry';

export const maxDuration = 120;

function getLastUserText(messages: UIMessage[]): string {
  const last = [...messages].reverse().find((message) => message.role === 'user');
  if (!last) return '';

  return last.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

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
  const latestUserText = getLastUserText(messages);

  const bm25Prompt =
    mode === 'bm25'
      ? buildPrompt(latestUserText, { library, topK: 5 }).systemPrompt
      : '';

  const system = [
    mode === 'tool-call' ? buildSystemPrompt(library) : bm25Prompt,
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
    tools: mode === 'tool-call' ? createSkillTools(library) : undefined,
    stopWhen: mode === 'tool-call' ? stepCountIs(8) : undefined,
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
