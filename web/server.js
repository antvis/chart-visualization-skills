#!/usr/bin/env node
/**
 * AntV AI Code Generator Server
 *
 * Supports two code generation modes:
 *   - bm25: BM25 retrieval + single LLM call
 *   - tool-call: AgentLoop where LLM actively reads skill docs via tools
 *
 * Usage: node web/server.js
 */

// Load environment variables from .env file
require('dotenv').config({ override: true });

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_DIR = __dirname;

const app = express();
const server = http.createServer(app);

// ── Middleware ─────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Skill retriever ───────────────────────────────────────────────────────────

const { SkillRetriever } = require('../cli/utils/retriever');

const retriever = new SkillRetriever();

function loadSkillsIndex() {
  try {
    const { skills } = retriever.loadIndex();
    console.log(`✅ Loaded ${skills.length} skills from index`);
  } catch (e) {
    console.error(
      '❌ Skills index not found. Run: node bin/skills-antv.js build'
    );
  }
}

// ── BM25 mode: system prompt builder ─────────────────────────────────────────

function buildBM25SystemPrompt(query, library) {
  const selectedLibrary =
    library === 'auto' ? retriever.detectLibrary(query) : library;

  const { systemPrompt, primarySkills, extraSkills } = retriever.buildPrompt(
    query,
    { library: selectedLibrary, topK: 5, maxExtra: 2 }
  );
  const retrievedSkills = [...primarySkills, ...extraSkills];

  return { systemPrompt, retrievedSkills, selectedLibrary };
}

// ── Intent detection ──────────────────────────────────────────────────────────

// Chart type keywords — presence suggests user wants a new chart
const CHART_TYPE_SIGNALS = [
  '柱状图',
  '条形图',
  '折线图',
  '面积图',
  '饼图',
  '散点图',
  '气泡图',
  '雷达图',
  '热力图',
  '箱线图',
  '漏斗图',
  '甘特图',
  '瀑布图',
  '桑基图',
  '玫瑰图',
  '直方图',
  '词云',
  '树图',
  '矩形树图',
  'bar',
  'line',
  'pie',
  'area',
  'scatter',
  'radar',
  'heatmap',
  'boxplot',
  'funnel',
  'gantt',
  'waterfall',
  'sankey',
  'rose',
  'histogram',
  'wordcloud',
  'treemap'
];

// Data-bearing patterns — presence suggests user is providing new data
const DATA_SIGNALS = [
  /\d+(\.\d+)?[,，]\s*\d+/, // numeric series like "10, 20, 30"
  /['"][^'"]{1,30}['"][：:]\s*\d+/, // "label": value
  /data\s*[:=]/i,
  /数据[是为：:]?/,
  /\[.*?\d.*?\]/ // array literals
];

/**
 * Detect whether the user intends to create a brand new chart ("new")
 * or tune/configure the existing one ("tune").
 *
 * Rule: if currentCode exists AND the query contains neither chart-type
 * keywords nor data patterns AND no explicit "create-new" signal, treat
 * it as a configuration adjustment and include currentCode in context.
 */
function detectIntent(query, currentCode) {
  if (!currentCode) return 'new';
  const q = query.toLowerCase();

  const newSignals = [
    '新建',
    '重新生成',
    '重新画',
    '换一个',
    '换个',
    '帮我画',
    '画一个',
    '画个',
    '创建',
    '生成一个'
  ];
  if (newSignals.some((s) => q.includes(s))) return 'new';

  // Explicit chart-type mention → likely a new chart request
  if (CHART_TYPE_SIGNALS.some((s) => q.includes(s.toLowerCase()))) return 'new';

  // Data patterns detected → likely a new chart with new data
  if (DATA_SIGNALS.some((re) => re.test(query))) return 'new';

  // No data, no chart type → user is adjusting configuration
  return 'tune';
}

function buildMessages(query, systemPrompt, intent, currentCode) {
  const messages = [{ role: 'system', content: systemPrompt }];
  if (intent === 'tune' && currentCode) {
    messages.push({
      role: 'assistant',
      content: '```javascript\n' + currentCode + '\n```'
    });
    messages.push({
      role: 'user',
      content: `请基于上面的图表代码，${query}。只返回修改后的完整代码。`
    });
    console.log('🔧 Intent: tune');
  } else {
    messages.push({ role: 'user', content: query });
    console.log('🆕 Intent: new');
  }
  return messages;
}

// ── AI SDK (unified) ──────────────────────────────────────────────────────────

const {
  callAI,
  AgentLoop,
  PROVIDER_CONFIG: SDK_PROVIDER_CONFIG
} = require('../eval/utils/ai-sdk');
const ProviderRegistry = require('../eval/utils/provider-registry');
const {
  TOOLS,
  toolListReferences,
  toolReadSkills,
  buildSystemPrompt: buildToolCallSystemPrompt
} = require('../eval/utils/skill-tools');

function extractCodeFromMarkdown(text) {
  const m = text.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
  return m ? m[1].trim() : text.trim();
}

function resolveProviderModel(reqProvider, reqModel) {
  const provider = reqProvider || process.env.AI_PROVIDER || 'qwen';
  const model =
    reqModel ||
    process.env.AI_MODEL ||
    SDK_PROVIDER_CONFIG[provider]?.defaultModel ||
    'qwen3-coder-480b-a35b-instruct';
  return { provider, model };
}

// ── BM25 mode ─────────────────────────────────────────────────────────────────

async function generateWithBM25(query, library, currentCode, provider, model) {
  const { systemPrompt, retrievedSkills, selectedLibrary } =
    buildBM25SystemPrompt(query, library);
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

// ── Tool-call mode ────────────────────────────────────────────────────────────

async function generateWithToolCall(
  query,
  library,
  currentCode,
  provider,
  model
) {
  const selectedLibrary =
    library === 'auto' ? retriever.detectLibrary(query) : library;

  const systemPrompt = buildToolCallSystemPrompt(selectedLibrary);
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

// ── Static files ──────────────────────────────────────────────────────────────

app.use(express.static(WEB_DIR));
app.use('/cli/index', express.static(path.join(ROOT_DIR, 'cli', 'index')));
app.use('/skills', express.static(path.join(ROOT_DIR, 'skills')));
app.use('/g2', express.static(path.join(ROOT_DIR, 'skills', 'g2')));
app.use('/g6', express.static(path.join(ROOT_DIR, 'skills', 'g6')));

// ── API Routes ────────────────────────────────────────────────────────────────

// GET /api/providers
app.get('/api/providers', (req, res) => {
  const providers = ProviderRegistry.listProviders().map((p) => ({
    id: p.id,
    name: p.name,
    models: p.models,
    hasApiKey: p.hasApiKey
  }));
  res.json({ providers });
});

// POST /api/generate
app.post('/api/generate', async (req, res) => {
  const {
    query,
    library = 'auto',
    currentCode = null,
    mode = 'bm25',
    provider: reqProvider,
    model: reqModel
  } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const { provider, model } = resolveProviderModel(reqProvider, reqModel);

  if (!ProviderRegistry.hasProvider(provider)) {
    return res.status(400).json({ error: `Unknown provider: ${provider}` });
  }
  if (!ProviderRegistry.hasApiKey(provider)) {
    return res
      .status(400)
      .json({ error: `Missing API key for provider: ${provider}` });
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

      return res.json({
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
    return res.json({
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
    return res.status(500).json({ error: error.message });
  }
});

// Root — serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(WEB_DIR, 'index.html'));
});

// ── Error handling ────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('[ERR]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────

loadSkillsIndex();

server.listen(PORT, () => {
  const { provider, model } = resolveProviderModel();
  const providers =
    ProviderRegistry.listProviders()
      .filter((p) => p.hasApiKey)
      .map((p) => p.id)
      .join(', ') || '(none configured)';

  console.log(`
╔════════════════════════════════════════════════════════════╗
║           AntV AI Code Generator Server                    ║
╠════════════════════════════════════════════════════════════╣
║  Web UI:   http://localhost:${PORT}                          ║
║  Provider: ${provider.padEnd(49)}║
║  Model:    ${model.padEnd(49)}║
║  Modes:    bm25 | tool-call                                ║
╚════════════════════════════════════════════════════════════╝

Available providers (API key set): ${providers}
Switch model via request body: { "provider": "anthropic", "model": "claude-sonnet-4-6-20250514" }
GET /api/providers  — list all providers and models
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  server.close();
  process.exit(0);
});
