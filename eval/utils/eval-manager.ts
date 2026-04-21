/**
 * Evaluation Manager
 *
 * Manages evaluation lifecycle, parallel execution, and result persistence.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AgentLoop, callAI } from './ai-sdk.js';
import { buildQuery, evaluateCode, type TestCase, type EvaluationResult } from './eval-utils.js';
import {
  createReadSkillsTool,
  loadSkillFile,
  extractKeySections,
  toolReadSkills,
  buildSystemPrompt
} from './skill-tools.js';
import { parallelMap } from './parallel-executor.js';
import * as context7 from './context7.js';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT_DIR = process.env.HARNESS_ROOT_DIR ?? path.resolve(__dirname, '../..');
const MAX_TOOL_ROUNDS = 6;

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
  retrieval?: 'tool-call' | 'bm25' | 'context7';
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
  toolCallsCount?: number;
  toolCallsLog?: unknown[];
  loadedSkillPaths?: string[];
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
  avgToolCalls: number;
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
  totalSimilarity: number;
  totalToolCalls: number;
  totalDuration: number;
  highSimilarityCount: number;
  issuesCount: number;
  skillHitCount: number;
  successCount: number;
  _promise?: Promise<void>;
}

export interface WsHandler {
  onEvalStart(evalId: string, options: unknown): void;
  onEvalProgress(evalId: string, current: number, total: number, result: EvalResult): void;
  onEvalComplete(evalId: string, summary: EvalSummary, outputPath: string): void;
  onEvalError(evalId: string, error: Error): void;
}

// ── BM25 retriever loader ─────────────────────────────────────────────────────

function loadRetriever() {
  return import('../../dist/core/retriever.js' as string) as Promise<{
    retrieve: (query: string, opts: { library: string; topK: number; indexDir: string }) => Array<{ id: string; title: string; path?: string }>;
  }>;
}

// ── Shared RAG prompt builders ────────────────────────────────────────────────

function buildRagSystemPrompt(library: string, skillContext: string): string {
  const promptFile = path.join(ROOT_DIR, 'prompts', `${library}-system-prompt.md`);
  let systemPrompt = fs.existsSync(promptFile)
    ? fs.readFileSync(promptFile, 'utf-8')
    : `你是 AntV ${library.toUpperCase()} v5 专家。`;
  return systemPrompt.replace('{RETRIEVED_SKILLS_CONTENT}', skillContext || '（暂无相关内容）');
}

function buildRagUserMessage(library: string, query: string): string {
  return `请根据以下描述生成 AntV ${library.toUpperCase()} 代码：\n\n${query}\n\n要求：\n1. 只输出纯 JavaScript 代码，不要包含任何 HTML、<script> 标签或解释文字\n2. 代码以 import 语句开头，从 @antv/${library} 引入所需模块，禁止使用 CDN URL\n3. container 直接使用变量，不要写成字符串 'container'\n4. 提供的数据不满足需求时，自动补充所需数据\n5. 包含完整的 render() 调用`;
}

// ── EvaluationManager ─────────────────────────────────────────────────────────

export default class EvaluationManager {
  runningEvals = new Map<string, EvalRun>();

  async startEvaluation(options: EvalOptions, wsHandler: WsHandler | null = null) {
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
      retrieval = 'tool-call'
    } = options;

    const datasetPath = path.join(__dirname, '..', 'data', dataset);
    if (!fs.existsSync(datasetPath)) throw new Error(`Dataset not found: ${dataset}`);

    const datasetContent = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
    const rawData: TestCase[] = Array.isArray(datasetContent)
      ? datasetContent
      : (datasetContent.results ?? []);

    let testData = rawData.map((t, i) => (t.id ? t : { ...t, id: `case-${i}` }));

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
      totalSimilarity: 0,
      totalToolCalls: 0,
      totalDuration: 0,
      highSimilarityCount: 0,
      issuesCount: 0,
      skillHitCount: 0,
      successCount: 0
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

    const evalPromise = this._runEvaluation(evalRun, testData, {
      outputPath,
      similarityAlgorithm,
      concurrency,
      wsHandler
    }).catch((error) => {
      logger.error({ evalId, err: (error as Error).message }, 'Evaluation error');
      evalRun.status = 'error';
      evalRun.error = (error as Error).message;
      if (wsHandler) wsHandler.onEvalError(evalId, error as Error);
    });

    evalRun._promise = evalPromise;
    return { evalId, outputPath };
  }

  private async _runEvaluation(
    evalRun: EvalRun,
    testData: TestCase[],
    options: { outputPath: string; similarityAlgorithm: string; concurrency: number; wsHandler: WsHandler | null }
  ) {
    const { outputPath, similarityAlgorithm, concurrency, wsHandler } = options;
    const { signal } = evalRun.abortController;

    const processCase = async (testCase: TestCase, index: number) => {
      if (signal.aborted) throw new Error('Evaluation cancelled');
      return this._processSingleCase(evalRun, testCase, index, { similarityAlgorithm, signal });
    };

    if (concurrency > 1) {
      const orderedResults = await parallelMap(testData, processCase, {
        concurrency,
        onProgress: ({ done, result }) => {
          if (result) this._updateIncrementalCounters(evalRun, result);
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
        this._updateIncrementalCounters(evalRun, result);
        evalRun.progress = { current: i + 1, total: testData.length };
        this._saveProgress(evalRun, outputPath);
        wsHandler?.onEvalProgress(evalRun.id, i + 1, testData.length, result);
      }
    }

    evalRun.status = 'completed';
    evalRun.endTime = new Date().toISOString();
    evalRun.summary = this._computeSummary(evalRun);
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
    const expectedCode = testCase.codeString ?? '';

    try {
      let generatedCode: string;
      let retrievalInfo: Record<string, unknown>;

      if (retrieval === 'bm25') {
        ({ generatedCode, retrievalInfo } = await this._processBm25({ provider, model, query, library }));
      } else if (retrieval === 'context7') {
        ({ generatedCode, retrievalInfo } = await this._processContext7({ provider, model, query, library }));
      } else {
        ({ generatedCode, retrievalInfo } = await this._processToolCall({ provider, model, query, library }));
        evalRun.totalToolCalls += (retrievalInfo.toolCallsCount as number) ?? 0;
      }

      const evaluation = evaluateCode(generatedCode, expectedCode, { similarityAlgorithm });
      evalRun.totalSimilarity += evaluation.similarity;

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
        evaluation: { similarity: 0, hasIssues: true, issues: [(error as Error).message], warnings: [], codeLength: 0, expectedLength: 0, extractedCode: '', structuralFeatures: { imports: [], functionCalls: [], objectKeys: [], stringLiterals: [], apiPatterns: [] } }
      };
    }
  }

  private async _processToolCall({ provider, model, query, library }: { provider: string; model: string; query: string; library: string }) {
    const systemPrompt = buildSystemPrompt(library);
    const agent = new AgentLoop({
      provider,
      model,
      maxRounds: MAX_TOOL_ROUNDS,
      tools: { read_skills: createReadSkillsTool() }
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

  private async _processBm25({ provider, model, query, library }: { provider: string; model: string; query: string; library: string }) {
    const retriever = await loadRetriever();
    const indexDir = path.join(ROOT_DIR, 'dist', 'index');
    const retrievedSkills = retriever.retrieve(query, { library, topK: 5, indexDir });

    let skillContext = '';
    const retrievedSkillIds: string[] = [];
    const loadedSkillPaths: string[] = [];

    for (const skill of retrievedSkills) {
      const content = skill.path ? loadSkillFile(skill.path) : null;
      if (content) {
        skillContext += `\n\n### Skill: ${skill.title} (${skill.id})\n${extractKeySections(content)}`;
        retrievedSkillIds.push(skill.id);
        if (skill.path) loadedSkillPaths.push(skill.path);
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
      retrievalInfo: { retrievedSkillIds, loadedSkillPaths }
    };
  }

  private async _processContext7({ provider, model, query, library }: { provider: string; model: string; query: string; library: string }) {
    const libraryId = context7.resolveLibraryId(library);
    let skillContext = '';
    let context7Error: string | undefined;

    try {
      const data = await context7.fetchDocs(query, libraryId, process.env.CONTEXT7_API_KEY);
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
      maxTokens: 2000
    });

    return {
      generatedCode: this._extractCode(response.content),
      retrievalInfo: { libraryId, ...(context7Error ? { context7Error } : {}) }
    };
  }

  private _extractCode(response: string): string {
    if (!response) return '';
    const codeBlockMatch = response.match(/```(?:javascript|js|typescript|ts)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) return codeBlockMatch[1].trim();
    const importMatch = response.match(/import[\s\S]*/);
    if (importMatch) return importMatch[0].trim();
    return response.trim();
  }

  private _extractSkillPaths(toolCallsLog: unknown[]): string[] {
    const paths: string[] = [];
    for (const call of toolCallsLog as Array<{ tool: string; input: { paths?: string[] } }>) {
      if (call.tool === 'read_skills' && call.input?.paths) {
        paths.push(...call.input.paths);
      }
    }
    return paths;
  }

  private _updateIncrementalCounters(evalRun: EvalRun, result: EvalResult) {
    evalRun.totalDuration += result.duration ?? 0;
    if (!result.error && result.evaluation?.similarity >= 0.5) evalRun.highSimilarityCount++;
    if (result.evaluation?.hasIssues) evalRun.issuesCount++;
    if ((result.loadedSkillPaths?.length ?? 0) > 0) evalRun.skillHitCount++;
    if (!result.error) evalRun.successCount++;
  }

  private _computeSummary(evalRun: EvalRun): EvalSummary {
    const { results } = evalRun;
    const successCount = results.filter((r) => !r.error).length;
    return {
      totalTests: results.length,
      successCount,
      avgDuration: results.reduce((sum, r) => sum + (r.duration ?? 0), 0) / (results.length || 1),
      avgSimilarity: successCount > 0 ? evalRun.totalSimilarity / successCount : 0,
      highSimilarityCount: results.filter((r) => r.evaluation?.similarity >= 0.5).length,
      issuesCount: results.filter((r) => r.evaluation?.hasIssues).length,
      avgToolCalls: successCount > 0 ? evalRun.totalToolCalls / successCount : 0,
      skillHitRate: results.filter((r) => (r.loadedSkillPaths?.length ?? 0) > 0).length / (results.length || 1)
    };
  }

  private _saveProgress(evalRun: EvalRun, outputPath: string) {
    const n = evalRun.progress?.current ?? evalRun.results.length;
    const { successCount } = evalRun;
    const data = {
      id: evalRun.id,
      provider: evalRun.provider,
      model: evalRun.model,
      dataset: evalRun.dataset,
      algorithm: evalRun.retrieval,
      timestamp: evalRun.startTime,
      status: evalRun.status,
      progress: evalRun.progress,
      summary: {
        totalTests: n,
        successCount,
        avgDuration: n > 0 ? evalRun.totalDuration / n : 0,
        avgSimilarity: successCount > 0 ? evalRun.totalSimilarity / successCount : 0,
        highSimilarityCount: evalRun.highSimilarityCount,
        issuesCount: evalRun.issuesCount,
        avgToolCalls: successCount > 0 ? evalRun.totalToolCalls / successCount : 0,
        skillHitRate: n > 0 ? evalRun.skillHitCount / n : 0
      },
      results: evalRun.results
    };
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  }

  private _saveFinalResults(evalRun: EvalRun, outputPath: string) {
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
