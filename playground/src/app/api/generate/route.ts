import { NextRequest } from 'next/server';
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from 'ai';
import { buildCliSystemPrompt, createCliModeTools } from '@/libs/cli-mode';
import {
  buildSkillSystemPrompt,
  createSkillModeTools
} from '@/libs/skill-mode';
import {
  createLanguageModel,
  resolveProviderModel
} from '@/libs/provider-registry';

export const maxDuration = 120;
const SKILL_MODE_MAX_STEPS = 8;
const CLI_MODE_MAX_STEPS = 6;

export async function POST(request: NextRequest) {
  const {
    messages = [],
    library = 'g2',
    mode = 'skill',
    currentCode = null,
    provider: reqProvider,
    model: reqModel
  }: {
    messages?: UIMessage[];
    library?: string;
    mode?: 'skill' | 'cli';
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
    mode === 'skill' ? buildSkillSystemPrompt(library) : buildCliSystemPrompt(library),
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
    tools: mode === 'skill' ? createSkillModeTools(library) : createCliModeTools(library),
    // Skill 模式通常要经过 load_skill → list_references → read_file 多轮调用，CLI 只需 retrieve 一轮
    stopWhen: stepCountIs(
      mode === 'skill' ? SKILL_MODE_MAX_STEPS : CLI_MODE_MAX_STEPS
    ),
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
