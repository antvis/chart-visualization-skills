/**
 * Evaluation Manager
 *
 * Manages evaluation lifecycle, parallel execution, and result persistence.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { AgentLoop, callAI } = require('./ai-sdk');
const { buildQuery, evaluateCode } = require('./eval-utils');
const {
  TOOLS,
  toolListReferences,
  toolReadSkills,
  buildSystemPrompt
} = require('../../cli/utils/skill-tools');
const ParallelExecutor = require('./parallel-executor');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const MAX_TOOL_ROUNDS = 6;

// ── Context7 ─────────────────────────────────────────────────────────────────

const CONTEXT7_API_BASE = 'https://context7.com/api/v2';
const CONTEXT7_LIBRARY_ID_MAP = { g2: '/antvis/g2', g6: '/antvis/g6' };

function fetchContext7Docs(query, libraryId, tokens = 12000) {
  const apiKey = process.env.CONTEXT7_API_KEY;
  if (!apiKey) throw new Error('Missing CONTEXT7_API_KEY environment variable');

  const url = new URL(`${CONTEXT7_API_BASE}/context`);
  url.searchParams.set('query', query);
  url.searchParams.set('libraryId', libraryId);
  url.searchParams.set('type', 'json');
  url.searchParams.set('tokens', String(tokens));

  return new Promise((resolve, reject) => {
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    const options = {
      hostname: url.hostname,
      port: url.port ? parseInt(url.port) : isHttps ? 443 : 80,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          if (res.statusCode !== 200)
            return reject(
              new Error(
                `Context7 API error: ${res.statusCode} ${body.slice(0, 200)}`
              )
            );
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Failed to parse Context7 response: ${e.message}`));
        }
      });
    });
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Context7 API timeout (30s)'));
    });
    req.on('error', (err) =>
      reject(new Error(`Context7 request failed: ${err.message}`))
    );
    req.end();
  });
}

function formatContext7Docs(data, maxResults = 6) {
  const codeSnippets = Array.isArray(data?.codeSnippets)
    ? data.codeSnippets
    : [];
  const infoSnippets = Array.isArray(data?.infoSnippets)
    ? data.infoSnippets
    : [];
  const sections = [];
  for (const s of codeSnippets.slice(0, Math.ceil(maxResults * 0.7))) {
    const title = s.pageTitle?.trim() || s.codeTitle?.trim() || 'Code Snippet';
    const desc = s.codeDescription?.trim() || '';
    const blocks = Array.isArray(s.codeList)
      ? s.codeList
          .filter(
            (b) => typeof b?.code === 'string' && b.code.trim().length > 0
          )
          .map(
            (b) =>
              `\`\`\`${(b.language || s.codeLanguage || 'javascript').trim()}\n${b.code}\n\`\`\``
          )
      : [];
    if (blocks.length === 0) continue;
    sections.push(
      `### ${title}\n${desc ? desc + '\n\n' : ''}${blocks.join('\n\n')}`
    );
  }
  for (const s of infoSnippets.slice(0, Math.floor(maxResults * 0.3))) {
    const title = (s.breadcrumb || s.pageId || 'Documentation').trim();
    const content = (s.content || '').trim();
    if (!content) continue;
    sections.push(`### ${title}\n${content}`);
  }
  return sections.join('\n\n---\n\n');
}

// ── BM25 ──────────────────────────────────────────────────────────────────────

function loadRetriever() {
  const { SkillRetriever } = require('../../cli/utils/retriever');
  return new SkillRetriever();
}

// ── Shared prompt builder for non-tool-call strategies ───────────────────────

function buildRagSystemPrompt(library, skillContext) {
  const promptFile = path.join(
    ROOT_DIR,
    'prompts',
    `${library}-system-prompt.md`
  );
  let systemPrompt = fs.existsSync(promptFile)
    ? fs.readFileSync(promptFile, 'utf-8')
    : `你是 AntV ${library.toUpperCase()} v5 专家。`;
  return systemPrompt.replace(
    '{RETRIEVED_SKILLS_CONTENT}',
    skillContext || '（暂无相关内容）'
  );
}

function buildRagUserMessage(library, query) {
  return `请根据以下描述生成 AntV ${library.toUpperCase()} 代码：\n\n${query}\n\n要求：\n1. 只输出可运行的代码，不需要解释\n2. 使用 @antv/${library} 包\n3. 确保 container 为 'container'\n4. 提供的数据不满足需求时，自动补充需要的数据\n5. 包含完整的 render() 调用`;
}

class EvaluationManager {
  constructor() {
    this.runningEvals = new Map(); // evalId -> { status, abortController, results }
    this.progressCallbacks = new Map(); // evalId -> callback
  }

  /**
   * Start a new evaluation run
   * @param {Object} options - Evaluation options
   * @param {Object} wsHandler - WebSocket handler for real-time updates
   * @returns {Promise<string>} Evaluation ID
   */
  async startEvaluation(options, wsHandler = null) {
    const {
      id: evalId,
      provider,
      model,
      dataset,
      sample,
      full,
      concurrency = 1,
      similarityAlgorithm = 'hybrid',
      retrieval = 'tool-call'
    } = options;

    // Load dataset
    const datasetPath = path.join(__dirname, '..', 'data', dataset);
    if (!fs.existsSync(datasetPath)) {
      throw new Error(`Dataset not found: ${dataset}`);
    }

    const datasetContent = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
    let testData = Array.isArray(datasetContent)
      ? datasetContent
      : datasetContent.results || [];

    // Sample or full
    if (sample && !full) {
      testData = testData.sort(() => Math.random() - 0.5).slice(0, sample);
    }

    // Create evaluation run record
    const evalRun = {
      id: evalId,
      provider,
      model,
      dataset,
      retrieval,
      status: 'running',
      startTime: new Date().toISOString(),
      progress: { current: 0, total: testData.length },
      results: [],
      abortController: new AbortController(),
      totalSimilarity: 0,
      totalToolCalls: 0
    };

    this.runningEvals.set(evalId, evalRun);

    // Create result directory
    const resultDir = path.join(__dirname, '..', 'result');
    if (!fs.existsSync(resultDir)) {
      fs.mkdirSync(resultDir, { recursive: true });
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const outputPath = path.join(
      resultDir,
      `eval-${retrieval}-${dataset.replace('.json', '')}-${model}-${dateStr}.json`
    );

    // Notify start
    if (wsHandler) {
      wsHandler.onEvalStart(evalId, options);
    }

    // Run evaluation
    const evalPromise = this._runEvaluation(evalRun, testData, {
      outputPath,
      similarityAlgorithm,
      concurrency,
      wsHandler
    }).catch((error) => {
      console.error(`[EvalManager] Error in evaluation ${evalId}:`, error);
      evalRun.status = 'error';
      evalRun.error = error.message;
      if (wsHandler) {
        wsHandler.onEvalError(evalId, error);
      }
    });

    evalRun._promise = evalPromise;
    return evalId;
  }

  /**
   * Internal: Run evaluation loop
   */
  async _runEvaluation(evalRun, testData, options) {
    const { outputPath, similarityAlgorithm, concurrency, wsHandler } = options;
    const { signal } = evalRun.abortController;

    // Process test cases (with optional parallelism)
    const processCase = async (testCase, index) => {
      if (signal.aborted) {
        throw new Error('Evaluation cancelled');
      }

      return this._processSingleCase(evalRun, testCase, index, {
        similarityAlgorithm,
        wsHandler,
        signal
      });
    };

    if (concurrency > 1) {
      // Parallel execution
      const executor = new ParallelExecutor(testData, processCase, {
        concurrency
      });
      executor.onProgress((current, total, result) => {
        evalRun.results.push(result);
        evalRun.progress = { current, total };
        this._saveProgress(evalRun, outputPath);
        if (wsHandler) {
          wsHandler.onEvalProgress(evalRun.id, current, total, result);
        }
      });
      await executor.run();
    } else {
      // Sequential execution
      for (let i = 0; i < testData.length; i++) {
        if (signal.aborted) {
          throw new Error('Evaluation cancelled');
        }

        const result = await processCase(testData[i], i);
        evalRun.results.push(result);
        evalRun.progress = { current: i + 1, total: testData.length };

        // Save progress
        this._saveProgress(evalRun, outputPath);

        // Notify progress
        if (wsHandler) {
          wsHandler.onEvalProgress(evalRun.id, i + 1, testData.length, result);
        }
      }
    }

    // Complete evaluation
    evalRun.status = 'completed';
    evalRun.endTime = new Date().toISOString();

    const summary = this._computeSummary(evalRun);
    evalRun.summary = summary;

    // Save final results
    this._saveFinalResults(evalRun, outputPath);

    // Notify complete
    if (wsHandler) {
      wsHandler.onEvalComplete(evalRun.id, summary, outputPath);
    }
  }

  /**
   * Process a single test case
   */
  async _processSingleCase(evalRun, testCase, index, options) {
    const { similarityAlgorithm, signal } = options;
    const { provider, model, retrieval } = evalRun;

    const startTime = Date.now();
    const { query, library } = buildQuery(testCase);
    const expectedCode = testCase.codeString || '';

    try {
      let generatedCode, retrievalInfo;

      if (retrieval === 'bm25') {
        ({ generatedCode, retrievalInfo } = await this._processBm25({
          provider,
          model,
          query,
          library,
          similarityAlgorithm
        }));
      } else if (retrieval === 'context7') {
        ({ generatedCode, retrievalInfo } = await this._processContext7({
          provider,
          model,
          query,
          library,
          similarityAlgorithm
        }));
      } else {
        // tool-call (default)
        ({ generatedCode, retrievalInfo } = await this._processToolCall({
          provider,
          model,
          query,
          library
        }));
        evalRun.totalToolCalls += retrievalInfo.toolCallsCount;
      }

      const evaluation = evaluateCode(generatedCode, expectedCode, {
        similarityAlgorithm
      });
      evalRun.totalSimilarity += evaluation.similarity;

      return {
        id: testCase.id || `test-${index}`,
        query,
        library,
        algorithm: retrieval,
        expectedCode,
        generatedCode,
        duration: Date.now() - startTime,
        ...retrievalInfo,
        evaluation
      };
    } catch (error) {
      return {
        id: testCase.id || `test-${index}`,
        query,
        library,
        algorithm: retrieval,
        expectedCode,
        error: error.message,
        duration: Date.now() - startTime,
        evaluation: { similarity: 0, hasIssues: true, issues: [error.message] }
      };
    }
  }

  async _processToolCall({ provider, model, query, library }) {
    const systemPrompt = buildSystemPrompt(library);
    const agent = new AgentLoop({
      provider,
      model,
      maxRounds: MAX_TOOL_ROUNDS,
      tools: TOOLS,
      toolHandlers: {
        list_references: toolListReferences,
        read_skills: toolReadSkills
      },
      debug: false
    });
    const { content, toolCallsLog } = await agent.run(systemPrompt, query);
    return {
      generatedCode: this._extractCode(content),
      retrievalInfo: {
        toolCallsCount: toolCallsLog.length,
        toolCallsLog,
        loadedSkillPaths: this._extractSkillPaths(toolCallsLog)
      }
    };
  }

  async _processBm25({ provider, model, query, library, similarityAlgorithm }) {
    const retriever = loadRetriever();
    const retrievedSkills = retriever.retrieve(query, { library, topK: 5 });

    let skillContext = '';
    const retrievedSkillIds = [];
    for (const skill of retrievedSkills) {
      const content = retriever.loadSkillContent(skill.path);
      if (content) {
        skillContext += `\n\n### Skill: ${skill.title} (${skill.id})\n${retriever.extractKeyContent(content)}`;
        retrievedSkillIds.push(skill.id);
      }
    }

    const systemPrompt = buildRagSystemPrompt(library, skillContext);
    const userMessage = buildRagUserMessage(library, query);
    const response = await callAI({
      provider,
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      maxTokens: 2000
    });
    return {
      generatedCode: this._extractCode(response.content),
      retrievalInfo: { retrievedSkillIds }
    };
  }

  async _processContext7({ provider, model, query, library }) {
    const libraryId = CONTEXT7_LIBRARY_ID_MAP[library] || `/antvis/${library}`;
    let skillContext = '';
    let context7Error;

    try {
      const data = await fetchContext7Docs(query, libraryId);
      skillContext = formatContext7Docs(data);
    } catch (err) {
      context7Error = err.message;
    }

    const systemPrompt = buildRagSystemPrompt(library, skillContext);
    const userMessage = buildRagUserMessage(library, query);
    const response = await callAI({
      provider,
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      maxTokens: 2000
    });
    return {
      generatedCode: this._extractCode(response.content),
      retrievalInfo: { libraryId, ...(context7Error ? { context7Error } : {}) }
    };
  }

  /**
   * Extract code from LLM response
   */
  _extractCode(response) {
    if (!response) return '';

    // Try markdown code block
    const codeBlockMatch = response.match(
      /```(?:javascript|js|typescript|ts)?\s*([\s\S]*?)```/
    );
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Try import statement onwards
    const importMatch = response.match(/import[\s\S]*/);
    if (importMatch) {
      return importMatch[0].trim();
    }

    return response.trim();
  }

  /**
   * Extract skill paths from tool calls
   */
  _extractSkillPaths(toolCallsLog) {
    const paths = [];
    for (const call of toolCallsLog) {
      if (call.tool === 'read_skills' && call.args?.paths) {
        paths.push(...call.args.paths);
      }
    }
    return paths;
  }

  /**
   * Compute summary statistics
   */
  _computeSummary(evalRun) {
    const results = evalRun.results;
    const successCount = results.filter((r) => !r.error).length;
    const avgSimilarity =
      successCount > 0 ? evalRun.totalSimilarity / successCount : 0;
    const avgToolCalls =
      successCount > 0 ? evalRun.totalToolCalls / successCount : 0;
    const highSimilarityCount = results.filter(
      (r) => r.evaluation?.similarity >= 0.5
    ).length;
    const issuesCount = results.filter((r) => r.evaluation?.hasIssues).length;
    const skillHitResults = results.filter(
      (r) => r.loadedSkillPaths?.length > 0
    );

    return {
      totalTests: results.length,
      successCount,
      avgDuration:
        results.reduce((sum, r) => sum + (r.duration || 0), 0) /
        (results.length || 1),
      avgSimilarity,
      highSimilarityCount,
      issuesCount,
      avgToolCalls,
      skillHitRate: skillHitResults.length / (results.length || 1)
    };
  }

  /**
   * Save progress to file
   */
  _saveProgress(evalRun, outputPath) {
    const summary = this._computeSummary(evalRun);
    const data = {
      id: evalRun.id,
      provider: evalRun.provider,
      model: evalRun.model,
      dataset: evalRun.dataset,
      algorithm: evalRun.retrieval,
      timestamp: evalRun.startTime,
      status: evalRun.status,
      progress: evalRun.progress,
      summary,
      results: evalRun.results
    };

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  }

  /**
   * Save final results
   */
  _saveFinalResults(evalRun, outputPath) {
    const data = {
      id: evalRun.id,
      provider: evalRun.provider,
      model: evalRun.model,
      dataset: evalRun.dataset,
      algorithm: evalRun.retrieval,
      timestamp: evalRun.startTime,
      endTime: evalRun.endTime,
      status: evalRun.status,
      summary: evalRun.summary,
      results: evalRun.results
    };

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  }

  /**
   * Get evaluation status
   * @param {string} evalId - Evaluation ID
   * @returns {Object|null} Status object
   */
  getStatus(evalId) {
    const evalRun = this.runningEvals.get(evalId);
    if (!evalRun) return null;

    return {
      id: evalRun.id,
      status: evalRun.status,
      progress: evalRun.progress,
      startTime: evalRun.startTime,
      endTime: evalRun.endTime,
      summary: evalRun.summary,
      error: evalRun.error
    };
  }

  /**
   * Cancel a running evaluation
   * @param {string} evalId - Evaluation ID
   * @returns {boolean} Whether cancellation was successful
   */
  cancelEvaluation(evalId) {
    const evalRun = this.runningEvals.get(evalId);
    if (!evalRun || evalRun.status !== 'running') {
      return false;
    }

    evalRun.abortController.abort();
    evalRun.status = 'cancelled';
    evalRun.endTime = new Date().toISOString();

    return true;
  }

  /**
   * Stop all running evaluations
   */
  stopAll() {
    for (const [evalId, evalRun] of this.runningEvals) {
      if (evalRun.status === 'running') {
        this.cancelEvaluation(evalId);
      }
    }
  }

  /**
   * Get all running evaluations
   * @returns {Array} Array of evaluation status objects
   */
  getRunningEvaluations() {
    const running = [];
    for (const [evalId, evalRun] of this.runningEvals) {
      if (evalRun.status === 'running') {
        running.push(this.getStatus(evalId));
      }
    }
    return running;
  }
}

module.exports = EvaluationManager;
