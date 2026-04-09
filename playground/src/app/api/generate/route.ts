import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { SkillRetriever } from '@/libs/retriever';
import { callAI, AgentLoop } from '@/libs/ai-sdk';
import {
  TOOLS,
  toolListReferences,
  toolReadSkills,
  buildSystemPrompt
} from '@/libs/skill-tools';
import {
  detectIntent,
  buildMessages,
  extractCodeFromMarkdown
} from '@/libs/intent';
import ProviderRegistry, { PROVIDERS } from '@/libs/provider-registry';

// Initialize retriever
const retriever = new SkillRetriever();

// Load skills index on first request
let skillsLoaded = false;
function ensureSkillsLoaded() {
  if (!skillsLoaded) {
    try {
      const { skills } = retriever.loadIndex();
      console.log(`✅ Loaded ${skills.length} skills from index`);
      skillsLoaded = true;
    } catch (e) {
      console.error(
        '❌ Skills index not found. Run: node cli/skills-antv.js build'
      );
    }
  }
}

// Resolve provider and model from request
function resolveProviderModel(
  reqProvider?: string,
  reqModel?: string
): { provider: string; model: string } {
  const provider = reqProvider || process.env.AI_PROVIDER || 'qwen';
  const model =
    reqModel ||
    process.env.AI_MODEL ||
    PROVIDERS[provider]?.defaultModel ||
    'qwen3-coder-480b-a35b-instruct';
  return { provider, model };
}

// BM25 mode generation
async function generateWithBM25(
  query: string,
  library: string,
  currentCode: string | null,
  provider: string,
  model: string
) {
  const selectedLibrary =
    library === 'auto' ? retriever.detectLibrary(query) : library;

  const { systemPrompt, primarySkills, extraSkills } = retriever.buildPrompt(
    query,
    { library: selectedLibrary, topK: 5, maxExtra: 2 }
  );
  const retrievedSkills = [...primarySkills, ...extraSkills];
  const intent = detectIntent(query, currentCode);
  const messages = buildMessages(query, systemPrompt, intent, currentCode);

  const response = await callAI({
    provider,
    model,
    messages,
    temperature: 0.3,
    maxTokens: 4000
  });

  return {
    code: extractCodeFromMarkdown(response.content),
    selectedLibrary,
    retrievedSkills,
    intent
  };
}

// Tool-call mode generation
async function generateWithToolCall(
  query: string,
  library: string,
  currentCode: string | null,
  provider: string,
  model: string
) {
  const selectedLibrary =
    library === 'auto' ? retriever.detectLibrary(query) : library;

  const systemPrompt = buildSystemPrompt(selectedLibrary);
  const intent = detectIntent(query, currentCode);

  let userMessage = `请根据以下描述生成 AntV ${selectedLibrary.toUpperCase()} 代码，只输出一个完整的 javascript 代码块：\n\n${query}`;
  if (intent === 'tune') {
    userMessage =
      `当前图表代码：\n\`\`\`javascript\n${currentCode}\n\`\`\`\n\n` +
      `请基于上面的代码，${query}。只输出修改后的完整 javascript 代码块。`;
  }

  const agent = new AgentLoop({
    provider,
    model,
    tools: TOOLS,
    maxRounds: 6,
    debug: false,
    toolHandlers: {
      list_references: toolListReferences,
      read_skills: toolReadSkills
    }
  });

  const result = await agent.run(systemPrompt, userMessage);
  const code = extractCodeFromMarkdown(result.content);
  const loadedSkillPaths = result.toolCallsLog
    .filter((l) => l.tool === 'read_skills')
    .flatMap((l) => l.args.paths || []);

  console.log(
    `   Tool calls: ${result.toolCallsLog.length}, loaded: ${loadedSkillPaths.map((p) => path.basename(p, '.md')).join(', ')}`
  );

  return {
    code,
    selectedLibrary,
    toolCallsLog: result.toolCallsLog,
    loadedSkillPaths
  };
}

export async function POST(request: NextRequest) {
  ensureSkillsLoaded();

  const body = await request.json();
  const {
    query,
    library = 'auto',
    currentCode = null,
    mode = 'bm25',
    provider: reqProvider,
    model: reqModel
  } = body;

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  const { provider, model } = resolveProviderModel(reqProvider, reqModel);

  if (!ProviderRegistry.hasProvider(provider)) {
    return NextResponse.json(
      { error: `Unknown provider: ${provider}` },
      { status: 400 }
    );
  }
  if (!ProviderRegistry.hasApiKey(provider)) {
    return NextResponse.json(
      { error: `Missing API key for provider: ${provider}` },
      { status: 400 }
    );
  }

  console.log(
    `\n[${mode}] "${query.substring(0, 60)}" (${library}) | ${provider}/${model}`
  );

  try {
    if (mode === 'tool-call') {
      const { code, selectedLibrary, toolCallsLog, loadedSkillPaths } =
        await generateWithToolCall(
          query,
          library,
          currentCode,
          provider,
          model
        );

      return NextResponse.json({
        code,
        library: selectedLibrary,
        mode: 'tool-call',
        provider,
        model,
        skills: loadedSkillPaths.map((p) => ({
          id: path.basename(p, '.md'),
          title: path.basename(p, '.md')
        })),
        toolCallsCount: toolCallsLog.length
      });
    }

    const { code, selectedLibrary, retrievedSkills, intent } =
      await generateWithBM25(query, library, currentCode, provider, model);

    console.log(
      `[bm25] ${selectedLibrary.toUpperCase()} [${intent}], skills: ${retrievedSkills.length}`
    );

    return NextResponse.json({
      code,
      library: selectedLibrary,
      mode: 'bm25',
      provider,
      model,
      skills: retrievedSkills.map((s) => ({ id: s.id, title: s.title })),
      intent
    });
  } catch (error) {
    console.error('Generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
