import { NextRequest } from 'next/server';
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from 'ai';
import { buildCliSystemPrompt, createCliModeTools } from '@/libs/cli-mode';
import {
  buildSkillSystemPrompt,
  createSkillModeTools
} from '@/libs/skill-mode';
import { createLanguageModel } from '@/libs/provider';

const MAX_STEPS = 8;

export async function POST(request: NextRequest) {
  const {
    messages = [],
    library = 'g2',
    mode = 'skill',
    currentCode = null,
  }: {
    messages?: UIMessage[];
    library?: string;
    mode?: 'skill' | 'cli';
    currentCode?: string | null;
  } = await request.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('messages are required', { status: 400 });
  }

  const llm = createLanguageModel();

  const system = [
    mode === 'skill' ? buildSkillSystemPrompt(library) : buildCliSystemPrompt(library),
    currentCode
      ? `当前代码如下，请在后续回答中基于它进行修改并返回完整 javascript 代码块：\n\`\`\`javascript\n${currentCode}\n\`\`\``
      : ''
  ]
    .filter(Boolean)
    .join('\n\n');

  const tools = mode === 'skill' ? createSkillModeTools(library) : createCliModeTools(library);
  console.log('[generate] mode:', mode, 'tools:', Object.keys(tools));

  const result = streamText({
    model: llm.model,
    system,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(MAX_STEPS),
    temperature: 0.3,
    maxOutputTokens: 4000,
    maxRetries: 5,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    messageMetadata: ({ part }) => {
      if (part.type === 'finish') {
        return {
          provider: llm.provider,
          model: llm.modelId,
          mode,
          usage: part.totalUsage
        };
      }
      return undefined;
    }
  });
}
