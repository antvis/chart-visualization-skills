/**
 * Evaluation Manager
 *
 * Manages evaluation lifecycle, parallel execution, and result persistence.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { callAI } from './ai-sdk.js';
import {
  buildQuery,
  evaluateCode,
  type TestCase,
  type EvaluationResult
} from './eval-utils.js';
import { buildSystemPrompt } from './skill-tools.js';
import { parallelMap } from './parallel-executor.js';
import * as context7 from './context7.js';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EvalOptions {
  id: string;
  provider: string;
  model: string;
  library: string;
  dataset: string;
  sample?: number;
  full?: boolean;
  ids?: string[];
  concurrency?: number;
  similarityAlgorithm?: string;
  retrieval?: 'zvec' | 'context7';
  /** Only for zvec retrieval: top-K to pre-retrieve (default 5). */
  zvecTopK?: number;
  /** Only for zvec retrieval: search strategy (default 'hybrid'). */
  zvecStrategy?: 'vector' | 'hybrid';
  verbose?: boolean;
}

interface EvalResult {
  id: string;
  query: string;
  library: string;
  algorithm: string;
  expectedCode: string;
  generatedCode?: string;
  error?: string;
  duration: number;
  retrievedSkillIds?: string[];
  evaluation: EvaluationResult;
}

interface EvalSummary {
  totalTests: number;
  successCount: number;
  avgDuration: number;
  avgSimilarity: number;
  highSimilarityCount: number;
  issuesCount: number;
  skillHitRate: number;
}

interface EvalRun {
  id: string;
  provider: string;
  model: string;
  dataset: string;
  retrieval: string;
  status: 'running' | 'completed' | 'error' | 'cancelled';
  startTime: string;
  endTime?: string;
  progress: { current: number; total: number };
  results: EvalResult[];
  summary?: EvalSummary;
  error?: string;
  abortController: AbortController;
  zvecTopK: number;
  zvecStrategy: 'vector' | 'hybrid';
}

export interface WsHandler {
  onEvalStart(evalId: string, options: unknown): void;
  onEvalProgress(
    evalId: string,
    current: number,
    total: number,
    result: EvalResult
  ): void;
  onEvalComplete(
    evalId: string,
    summary: EvalSummary,
    outputPath: string
  ): void;
  onEvalError(evalId: string, error: Error): void;
}

export interface EvalStartResult {
  evalId: string;
  outputPath: string;
  summary: EvalSummary;
}

// ── Lazy retriever (loaded once, shared across all zvec calls) ─────────────────

type RetrieverModule = {
  retrieve: (
    q: string,
    opts: {
      library?: string;
      topK?: number;
      content?: boolean;
      includeInfo?: boolean;
      strategy?: 'vector' | 'hybrid';
    }
  ) => Promise<Array<{ id: string; title: string; content?: string }>>;
};

let _retrieverPromise: Promise<RetrieverModule> | null = null;
function getRetriever(): Promise<RetrieverModule> {
  if (!_retrieverPromise) {
    _retrieverPromise =
      import('../../src/core/retriever.js') as Promise<RetrieverModule>;
  }
  return _retrieverPromise;
}

// ── RAG prompt builders ────────────────────────────────────────────────────────

function buildRagSystemPrompt(library: string, skillContext: string): string {
  if (library === 'x6') {
    return `你是 AntV X6 3.x 图编辑引擎代码生成专家。根据用户描述生成准确、可运行的代码。

## 输出格式（严格遵守）

- **只输出纯 JavaScript 代码**，不要输出 HTML、Markdown 文档或任何解释文字
- 代码使用 \`import { Graph, ... } from '@antv/x6'\` 风格的导入语句
- 所有使用到的类（Graph、Shape、Selection 等）都**必须出现在 import 语句中**
- 禁止使用 \`<script>\`、\`<!DOCTYPE>\`、\`<html>\` 等任何 HTML 标签
- container 变量已预先定义，**直接使用 container 变量**，禁止重新声明
- 禁止使用 TypeScript 语法（interface、type、as、泛型等）

## X6 3.x 关键规则

1. **禁止调用 graph.render()**：X6 3.x 自动渲染
2. **禁止使用 Graph.Selection、Graph.Keyboard 等命名空间写法**
3. **plugin 在 plugins 数组中直接 new 实例化**，如 \`plugins: [new Selection({ ... })]\`

--- 参考知识库 ---

${skillContext || '（暂无相关内容）'}`;
  }
  return `你是 AntV ${library.toUpperCase()} v5 代码生成专家。根据用户描述生成准确、可运行的代码。

## 输出格式

- **只输出纯 JavaScript 代码**，不要输出 HTML、Markdown 文档或任何解释文字
- 代码以 \`import\` 语句开头，从 \`@antv/${library}\` 引入所需模块
- 禁止使用 \`<script>\`、\`<!DOCTYPE>\`、\`<html>\` 等任何 HTML 标签
- 禁止使用 CDN URL 引入（如 unpkg、jsdelivr）
- container 变量直接使用，不要用字符串 'container'

--- 参考知识库 ---

${skillContext || '（暂无相关内容）'}`;
}

function buildRagUserMessage(library: string, query: string): string {
  if (library === 'x6') {
    return `请根据以下描述生成 AntV X6 3.x 代码：\n\n${query}`;
  }
  return `请根据以下描述生成 AntV ${library.toUpperCase()} 代码：\n\n${query}`;
}

// ── Summary helpers ───────────────────────────────────────────────────────────

function buildSummary(results: EvalResult[]): EvalSummary {
  const successResults = results.filter((r) => !r.error);
  const totalSimilarity = successResults.reduce(
    (s, r) => s + (r.evaluation?.similarity ?? 0),
    0
  );
  return {
    totalTests: results.length,
    successCount: successResults.length,
    avgDuration:
      results.reduce((s, r) => s + (r.duration ?? 0), 0) /
      (results.length || 1),
    avgSimilarity:
      successResults.length > 0 ? totalSimilarity / successResults.length : 0,
    highSimilarityCount: results.filter(
      (r) => (r.evaluation?.similarity ?? 0) >= 0.5
    ).length,
    issuesCount: results.filter((r) => r.evaluation?.hasIssues).length,
    skillHitRate:
      results.filter((r) => (r.retrievedSkillIds?.length ?? 0) > 0).length /
      (results.length || 1)
  };
}

function emptyEvaluationResult(errorMsg: string): EvaluationResult {
  return {
    similarity: 0,
    hasIssues: true,
    issues: [errorMsg],
    warnings: [],
    codeLength: 0,
    expectedLength: 0,
    extractedCode: '',
    structuralFeatures: {
      imports: [],
      functionCalls: [],
      objectKeys: [],
      stringLiterals: [],
      apiPatterns: []
    }
  };
}

// ── EvaluationManager ─────────────────────────────────────────────────────────

export default class EvaluationManager {
  private runningEvals = new Map<string, EvalRun>();

  async startEvaluation(
    options: EvalOptions,
    wsHandler: WsHandler | null = null
  ): Promise<EvalStartResult> {
    const {
      id: evalId,
      provider,
      model,
      dataset,
      sample,
      full,
      ids,
      concurrency = 1,
      similarityAlgorithm = 'hybrid',
      retrieval = 'zvec',
      zvecTopK = 5,
      zvecStrategy = 'hybrid'
    } = options;

    const datasetPath = path.join(__dirname, '..', 'data', dataset);
    if (!fs.existsSync(datasetPath))
      throw new Error(`Dataset not found: ${dataset}`);

    const datasetContent = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
    const rawData: TestCase[] = Array.isArray(datasetContent)
      ? datasetContent
      : (datasetContent.results ?? []);

    let testData = rawData.map((t, i) =>
      t.id ? t : { ...t, id: `case-${i}` }
    );

    if (ids && ids.length > 0) {
      const idSet = new Set(ids);
      testData = testData.filter((t) => idSet.has(t.id!));
    } else if (sample && !full) {
      testData = testData.sort(() => Math.random() - 0.5).slice(0, sample);
    }

    const evalRun: EvalRun = {
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
      zvecTopK,
      zvecStrategy
    };

    this.runningEvals.set(evalId, evalRun);

    const resultDir = path.join(__dirname, '..', 'result');
    if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir, { recursive: true });

    const dateStr = new Date().toISOString().slice(0, 10);
    const outputPath = path.join(
      resultDir,
      `eval-${retrieval}-${dataset.replace('.json', '')}-${model}-${dateStr}.json`
    );

    wsHandler?.onEvalStart(evalId, options);

    try {
      await this._runEvaluation(evalRun, testData, {
        outputPath,
        similarityAlgorithm,
        concurrency,
        wsHandler
      });
    } catch (error) {
      logger.error(
        { evalId, err: (error as Error).message },
        'Evaluation error'
      );
      evalRun.status = 'error';
      evalRun.error = (error as Error).message;
      wsHandler?.onEvalError(evalId, error as Error);
      throw error;
    }

    return { evalId, outputPath, summary: evalRun.summary! };
  }

  private async _runEvaluation(
    evalRun: EvalRun,
    testData: TestCase[],
    options: {
      outputPath: string;
      similarityAlgorithm: string;
      concurrency: number;
      wsHandler: WsHandler | null;
    }
  ) {
    const { outputPath, similarityAlgorithm, concurrency, wsHandler } = options;
    const { signal } = evalRun.abortController;

    const processCase = async (testCase: TestCase, index: number) => {
      if (signal.aborted) throw new Error('Evaluation cancelled');
      return this._processSingleCase(evalRun, testCase, index, {
        similarityAlgorithm,
        signal
      });
    };

    if (concurrency > 1) {
      const orderedResults = await parallelMap(testData, processCase, {
        concurrency,
        onProgress: ({ done, result }) => {
          if (result) evalRun.results.push(result);
          evalRun.progress = { current: done, total: testData.length };
          this._saveProgress(evalRun, outputPath);
          wsHandler?.onEvalProgress(evalRun.id, done, testData.length, result!);
        }
      });
      evalRun.results = orderedResults.filter(Boolean) as EvalResult[];
    } else {
      for (let i = 0; i < testData.length; i++) {
        if (signal.aborted) throw new Error('Evaluation cancelled');
        const result = await processCase(testData[i], i);
        evalRun.results.push(result);
        evalRun.progress = { current: i + 1, total: testData.length };
        this._saveProgress(evalRun, outputPath);
        wsHandler?.onEvalProgress(evalRun.id, i + 1, testData.length, result);
      }
    }

    evalRun.status = 'completed';
    evalRun.endTime = new Date().toISOString();
    evalRun.summary = buildSummary(evalRun.results);
    this._saveFinalResults(evalRun, outputPath);
    wsHandler?.onEvalComplete(evalRun.id, evalRun.summary, outputPath);
  }

  private async _processSingleCase(
    evalRun: EvalRun,
    testCase: TestCase,
    index: number,
    options: { similarityAlgorithm: string; signal: AbortSignal }
  ): Promise<EvalResult> {
    const { similarityAlgorithm } = options;
    const { provider, model, retrieval } = evalRun;
    const startTime = Date.now();
    const { query, library } = buildQuery(testCase);
    // Retrieval query strips reference data — JSON arrays dilute vector
    // embedding signal and FTS precision (e.g. "韦恩图" gets lost among
    // hundreds of data tokens like "sets", "size", "视频创作者").
    const { query: retrievalQuery } = buildQuery(testCase, { includeData: false });
    const expectedCode = testCase.codeString ?? '';

    try {
      let generatedCode: string;
      let retrievalInfo: Record<string, unknown>;

      if (retrieval === 'context7') {
        ({ generatedCode, retrievalInfo } = await this._processContext7({
          provider,
          model,
          query: retrievalQuery,
          library
        }));
      } else {
        ({ generatedCode, retrievalInfo } = await this._processZvec(evalRun, {
          provider,
          model,
          query: retrievalQuery,
          library,
          userQuery: query,
        }));
      }

      const evaluation = evaluateCode(generatedCode, expectedCode, {
        similarityAlgorithm,
        library
      });

      return {
        id: testCase.id ?? `test-${index}`,
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
        id: testCase.id ?? `test-${index}`,
        query,
        library,
        algorithm: retrieval,
        expectedCode,
        error: (error as Error).message,
        duration: Date.now() - startTime,
        evaluation: emptyEvaluationResult((error as Error).message)
      };
    }
  }

  // ── Zvec retrieval ──────────────────────────────────────────────────────────

  private async _processZvec(
    evalRun: EvalRun,
    {
      provider,
      model,
      query,
      library,
      userQuery,
    }: { provider: string; model: string; query: string; library: string; userQuery?: string }
  ) {
    const llmQuery = userQuery ?? query;
    const { zvecTopK, zvecStrategy } = evalRun;
    const retriever = await getRetriever();

    const retrievedSkills = await retriever.retrieve(query, {
      library,
      topK: zvecTopK,
      content: true,
      includeInfo: true,
      strategy: zvecStrategy
    });

    const retrievedSkillIds = retrievedSkills
      .filter((s) => !s.id.startsWith('__info__'))
      .map((s) => s.id);

    let skillContext = '';
    for (const skill of retrievedSkills) {
      const content = skill.content || '';
      if (content) {
        if (skill.id.startsWith('__info__')) {
          skillContext = `### 核心约束\n${content}\n\n${skillContext}`;
        } else {
          skillContext += `\n\n### Skill: ${skill.title} (${skill.id})\n${content}`;
        }
      }
    }

    const systemPrompt = buildRagSystemPrompt(library, skillContext);
    const userMessage = buildRagUserMessage(library, llmQuery);
    const response = await callAI({
      provider,
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      maxTokens: 5000
    });

    return {
      generatedCode: this._extractCode(response.content),
      retrievalInfo: { retrievedSkillIds, zvecStrategy, zvecTopK }
    };
  }

  // ── Context7 retrieval ──────────────────────────────────────────────────────

  private async _processContext7({
    provider,
    model,
    query,
    library
  }: {
    provider: string;
    model: string;
    query: string;
    library: string;
  }) {
    const libraryId = context7.resolveLibraryId(library);
    let skillContext = '';
    let context7Error: string | undefined;

    try {
      const data = await context7.fetchDocs(
        query,
        libraryId,
        process.env.CONTEXT7_API_KEY
      );
      skillContext = context7.formatDocs(data);
    } catch (err) {
      context7Error = (err as Error).message;
      logger.warn({ err: context7Error }, 'Context7 fetch failed');
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
      maxTokens: 5000
    });

    return {
      generatedCode: this._extractCode(response.content),
      retrievalInfo: { libraryId, ...(context7Error ? { context7Error } : {}) }
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private _extractCode(response: string): string {
    if (!response) return '';
    const codeBlockMatch = response.match(
      /```(?:javascript|js|typescript|ts)?\s*([\s\S]*?)```/
    );
    if (codeBlockMatch) return codeBlockMatch[1].trim();
    const importMatch = response.match(/import[\s\S]*/);
    if (importMatch) return importMatch[0].trim();
    return response.trim();
  }

  private _buildOutputData(evalRun: EvalRun, extra?: Record<string, unknown>) {
    return {
      id: evalRun.id,
      provider: evalRun.provider,
      model: evalRun.model,
      dataset: evalRun.dataset,
      algorithm: evalRun.retrieval,
      timestamp: evalRun.startTime,
      status: evalRun.status,
      ...extra,
      summary: buildSummary(evalRun.results),
      results: evalRun.results
    };
  }

  private _saveProgress(evalRun: EvalRun, outputPath: string) {
    const data = this._buildOutputData(evalRun, { progress: evalRun.progress });
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  }

  private _saveFinalResults(evalRun: EvalRun, outputPath: string) {
    const data = this._buildOutputData(evalRun, { endTime: evalRun.endTime });
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  }

  getStatus(evalId: string) {
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

  cancelEvaluation(evalId: string): boolean {
    const evalRun = this.runningEvals.get(evalId);
    if (!evalRun || evalRun.status !== 'running') return false;
    evalRun.abortController.abort();
    evalRun.status = 'cancelled';
    evalRun.endTime = new Date().toISOString();
    return true;
  }

  stopAll() {
    for (const evalRun of this.runningEvals.values()) {
      if (evalRun.status === 'running') this.cancelEvaluation(evalRun.id);
    }
  }

  getRunningEvaluations() {
    return [...this.runningEvals.values()]
      .filter((r) => r.status === 'running')
      .map((r) => this.getStatus(r.id));
  }
}
