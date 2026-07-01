/**
 * Embedder: text-to-vector conversion.
 *
 * Two implementations are provided:
 * - TransformersEmbedder: uses @huggingface/transformers (bge-small-zh-v1.5, 512 dims, bilingual)
 * - SimpleEmbedder:    lightweight TF-IDF-style pseudo-embedding (no model download)
 *
 * Selection logic:
 *   getEmbedder() tries TransformersEmbedder first, falls back to SimpleEmbedder.
 *   Callers can also explicitly construct either implementation.
 */

export interface Embedder {
  readonly dimensions: number;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

// ---------------------------------------------------------------------------
// SimpleEmbedder – lightweight pseudo-embedding, no external dependencies
// ---------------------------------------------------------------------------

const SIMPLE_DIMS = 512;

/**
 * Lightweight pseudo-embedder with weighted CJK n-grams, synonym expansion,
 * and log-scale count compression.
 *
 * CJK n-grams are weighted by length (trigram > bigram > unigram) because
 * longer n-grams are more discriminative ("矩形树图" >> "图").
 * Chart-type synonyms bridge the Chinese-English gap that pure character
 * hashing cannot cross ("树图" ⇔ "treemap").
 *
 * Still NOT a semantic embedder — it's a tuned bag-of-tokens fingerprint.
 * TransformersEmbedder is the production-quality path.
 */
export class SimpleEmbedder implements Embedder {
  readonly dimensions = SIMPLE_DIMS;

  async embed(text: string): Promise<number[]> {
    return this.embedSync(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.embedSync(t));
  }

  /** Synchronous embedding – no async overhead, usable in sync code paths. */
  embedSync(text: string): number[] {
    const vec = new Array<number>(SIMPLE_DIMS).fill(0);
    const tokens = tokenizeWeighted(text);

    for (const { token, weight } of tokens) {
      // 3 hash functions per token for collision resistance
      for (let h = 0; h < 3; h++) {
        vec[hashToken(token, h) % SIMPLE_DIMS] += weight;
      }
    }

    // Log-scale compression: prevents dimension saturation from
    // high-frequency terms (a term appearing 50× contributes log(51) ≈ 3.93
    // instead of 50, giving rare terms proportionally more influence).
    for (let i = 0; i < SIMPLE_DIMS; i++) {
      if (vec[i] > 0) vec[i] = Math.log(1 + vec[i]);
    }

    // L2-normalise
    let norm = 0;
    for (let i = 0; i < SIMPLE_DIMS; i++) norm += vec[i] * vec[i];
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < SIMPLE_DIMS; i++) {
      vec[i] /= norm;
    }
    return vec;
  }
}

// ---------------------------------------------------------------------------
// TransformersEmbedder – local sentence-transformers model via @huggingface/transformers
// ---------------------------------------------------------------------------

const MODEL_ID = 'onnx-community/bge-small-zh-v1.5-ONNX';
const TRANSFORMERS_DIMS = 512;

let _transformersModule: any = undefined;
let _transformersLoadFailed = false;

async function loadTransformers(): Promise<any> {
  if (_transformersModule) return _transformersModule;
  if (_transformersLoadFailed) return undefined;

  try {
    // @huggingface/transformers v4 is an ESM-first package (type: "module").
    // Dynamic import() loads the proper ESM bundle where `pipeline` is a
    // real async function.  The CJS bundle (transformers.node.cjs) may not
    // expose `pipeline` correctly on some platforms due to native-binding
    // side-effects during require().
    _transformersModule = await import('@huggingface/transformers');
  } catch {
    _transformersLoadFailed = true;
    return undefined;
  }

  // Apply HF_ENDPOINT mirror if set (e.g. https://hf-mirror.com for China).
  // @huggingface/transformers v4 does NOT read HF_ENDPOINT automatically;
  // it hardcodes "https://huggingface.co/" as env.remoteHost.
  const hfEndpoint = process.env.HF_ENDPOINT;
  if (hfEndpoint && _transformersModule?.env) {
    _transformersModule.env.remoteHost = hfEndpoint;
  }

  return _transformersModule;
}

/**
 * Embedder backed by onnx-community/all-MiniLM-L6-v2-ONNX (384-dims).
 *
 * Constructor is cheap – the model is loaded lazily on the first embed() call.
 * When the optional dependency is not installed the embed()/embedBatch() calls
 * throw an explicit error.
 */
export class TransformersEmbedder implements Embedder {
  readonly dimensions = TRANSFORMERS_DIMS;
  private _pipeline: any = null;
  private _loadPromise: Promise<any> | null = null;

  private async _getPipeline(): Promise<any> {
    if (this._pipeline) {
      return this._pipeline;
    }

    if (!this._loadPromise) {
      this._loadPromise = (async () => {
        const t = await loadTransformers();
        this._pipeline = await t.pipeline('feature-extraction', MODEL_ID);
        return this._pipeline;
      })();
    }

    const result = await this._loadPromise;

    return result;
  }

  async embed(text: string): Promise<number[]> {
    return (await this.embedBatch([text]))[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const pipe = await this._getPipeline();
    const outputs = await Reflect.apply(pipe, null, [
      texts,
      {
        pooling: 'mean',
        normalize: true
      }
    ]);
    return Array.from((outputs as any).tolist());
  }
}

// ---------------------------------------------------------------------------
// Convenience getters
// ---------------------------------------------------------------------------

let _defaultEmbedder: Embedder | null = null;
let _syncEmbedder: SimpleEmbedder | null = null;

/**
 * Return a shared Embedder instance (async).
 *
 * Tries TransformersEmbedder first (needs @huggingface/transformers installed
 * AND the model downloadable from HuggingFace Hub). If either fails, falls
 * back to SimpleEmbedder gracefully.
 */
export async function getEmbedder(): Promise<Embedder> {
  if (_defaultEmbedder) return _defaultEmbedder;

  const t = await loadTransformers();
  if (t) {
    try {
      // Probe: attempt to load the model pipeline. If network is unavailable
      // or the model can't be fetched, fall back to SimpleEmbedder instead
      // of crashing the entire process.
      const probe = new TransformersEmbedder();
      await probe.embed('probe'); // triggers lazy model download
      _defaultEmbedder = probe;
    } catch (err) {
      console.warn(
        `[embedder] 双语模型 (bge-small-zh-v1.5) 加载失败，降级为 SimpleEmbedder。\n` +
          `  错误: ${(err as Error).message?.split('\n')[0]}\n` +
          `\n` +
          `  SimpleEmbedder 的召回质量较低，建议修复模型下载：\n` +
          `    1. 设置镜像: export HF_ENDPOINT=https://hf-mirror.com\n` +
          `    2. 手动下载: node scripts/download-model.mjs\n`
      );
      _defaultEmbedder = new SimpleEmbedder();
    }
  } else {
    console.warn(
      '[embedder] @huggingface/transformers 未安装，使用 SimpleEmbedder。\n' +
        '  安装后可使用双语模型提升召回质量:\n' +
        '    npm install @huggingface/transformers\n' +
        '    node scripts/download-model.mjs\n'
    );
    _defaultEmbedder = new SimpleEmbedder();
  }
  return _defaultEmbedder;
}

/**
 * Return a synchronous SimpleEmbedder instance.
 *
 * This bypasses the async TransformersEmbedder path entirely and is intended
 * for use inside synchronous code paths (e.g. the `retrieve()` function).
 */
export function getSyncEmbedder(): SimpleEmbedder {
  if (!_syncEmbedder) {
    _syncEmbedder = new SimpleEmbedder();
  }
  return _syncEmbedder;
}

/**
 * Force-reset the cached default embedder (useful for tests).
 */
export function resetEmbedder(): void {
  _defaultEmbedder = null;
  _syncEmbedder = null;
  _transformersModule = undefined;
  _transformersLoadFailed = false;
}

// ---------------------------------------------------------------------------
// Internal helpers — weighted tokenization
// ---------------------------------------------------------------------------

interface WeightedToken {
  token: string;
  weight: number;
}

// ── CJK n-gram weights ──────────────────────────────────────────────────────
// Trigram: "矩形树图" — highly discriminative          → weight 2.0
// Bigram:  "树图", "柱状" — moderately discriminative  → weight 1.0
// Unigram: "图", "型" — mostly noise                    → weight 0.15
// ────────────────────────────────────────────────────────────────────────────
const CJK_UNIGRAM_WEIGHT = 0.15;
const CJK_BIGRAM_WEIGHT = 1.0;
const CJK_TRIGRAM_WEIGHT = 2.0;

// ── English word weights ────────────────────────────────────────────────────
const EN_WORD_WEIGHT = 1.5; // "treemap", "sankey" — discriminative
const EN_SINGLE_CHAR_WEIGHT = 0.1; // "x", "y" — axis labels, noise

// ── Chart-type synonym map ──────────────────────────────────────────────────
// Now uses the shared synonyms.ts module instead of a local copy.
// This ensures FTS query expansion and embedding token expansion use
// the SAME mapping, eliminating the drift between retriever.ts and
// embedder.ts that existed before.
// ────────────────────────────────────────────────────────────────────────────
import { getSynonymMap } from '../synonyms';

function tokenizeWeighted(text: string): WeightedToken[] {
  const synonymMap = getSynonymMap();
  const tokens: WeightedToken[] = [];
  const seen = new Set<string>(); // deduplicate — each token once per doc
  const lower = text.toLowerCase();
  const segments = splitMixed(lower);

  for (const seg of segments) {
    if (isCJK(seg)) {
      // CJK: weighted n-grams 1..3
      // Trigrams first (highest weight)
      for (let i = 0; i + 3 <= seg.length; i++) {
        const t = seg.slice(i, i + 3);
        if (!seen.has(t)) {
          seen.add(t);
          tokens.push({ token: t, weight: CJK_TRIGRAM_WEIGHT });
        }
      }
      // Bigrams
      for (let i = 0; i + 2 <= seg.length; i++) {
        const t = seg.slice(i, i + 2);
        if (!seen.has(t)) {
          seen.add(t);
          tokens.push({ token: t, weight: CJK_BIGRAM_WEIGHT });
        }
      }
      // Unigrams (lowest weight, may be stopped)
      for (const ch of seg) {
        if (seen.has(ch) || CJK_UNIGRAM_STOP.has(ch)) continue;
        seen.add(ch);
        tokens.push({ token: ch, weight: CJK_UNIGRAM_WEIGHT });
      }

      // Synonym expansion: add English equivalents for known chart types
      for (const [term, synonyms] of synonymMap) {
        if (seg.includes(term)) {
          for (const syn of synonyms) {
            if (seen.has(syn)) continue;
            seen.add(syn);
            tokens.push({ token: syn, weight: 1.0 });
          }
        }
      }
    } else {
      // Non-CJK: whitespace-split, weight by word length
      for (const w of seg.split(/\s+/)) {
        const trimmed = w.trim();
        if (!trimmed || STOP_WORDS.has(trimmed) || seen.has(trimmed)) continue;
        seen.add(trimmed);
        const weight =
          trimmed.length === 1 ? EN_SINGLE_CHAR_WEIGHT : EN_WORD_WEIGHT;
        tokens.push({ token: trimmed, weight });

        // Synonym expansion for English terms
        const syns = synonymMap.get(trimmed);
        if (syns) {
          for (const syn of syns) {
            if (seen.has(syn)) continue;
            seen.add(syn);
            tokens.push({ token: syn, weight: 1.0 });
          }
        }
      }
    }
  }

  return tokens;
}

export function isCJK(ch: string): boolean {
  const cp = ch.codePointAt(0)!;
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) || // CJK Unified
    (cp >= 0x3400 && cp <= 0x4dbf) || // CJK Ext-A
    (cp >= 0x3040 && cp <= 0x30ff) || // Hiragana + Katakana
    (cp >= 0xac00 && cp <= 0xd7af) // Hangul
  );
}

/** Split text into alternating CJK / non-CJK segments. */
function splitMixed(text: string): string[] {
  const result: string[] = [];
  let buf = '';
  let bufIsCJK: boolean | null = null;

  for (const ch of text) {
    const cjk = isCJK(ch);
    if (bufIsCJK === null) {
      bufIsCJK = cjk;
    } else if (cjk !== bufIsCJK) {
      result.push(buf);
      buf = '';
      bufIsCJK = cjk;
    }
    buf += ch;
  }
  if (buf) result.push(buf);
  return result;
}

/** FNV-1a 32-bit hash with optional seed for multi-hash. */
function hashToken(token: string, seed = 0): number {
  let hash = (2166136261 + seed) >>> 0;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// ── Stop words ──────────────────────────────────────────────────────────────
// Extended from the original minimal set to include high-frequency
// chart-document CJK terms that appear in nearly every doc.
// ────────────────────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  // Original
  '的',
  '了',
  '在',
  '是',
  '我',
  '有',
  '和',
  '就',
  '不',
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'to',
  'of',
  'in',
  'for',
  'on',
  'with',
  'at',
  'by',
  'from',
  'as',
  'i',
  'me',
  'my',
  'we',
  'our',
  'he',
  'him',
  'his',
  'she',
  'her',
  'it',
  'its',
  'and',
  'but',
  'or',
  'if',
  'this',
  'that',
  'these',
  'those',
  'not',
  'no',
  'nor',
  'only',
  'chart',
  'using',
  'use',
  // Extended: high-frequency chart-document CJK
  '图表',
  '数据',
  '配置',
  '展示',
  '需要',
  '支持',
  '进行',
  '通过',
  '绘制',
  '实现',
  '基于',
  '根据',
  '使用',
  '方式',
  '效果',
  '功能',
  '用于',
  '可以',
  '一个',
  '表示',
  '如下',
  '参考'
]);

// Single CJK characters that carry almost no discriminative signal.
// Stopped at the unigram level (bigrams/trigrams containing these are kept).
const CJK_UNIGRAM_STOP = new Set([
  '的',
  '了',
  '在',
  '是',
  '和',
  '就',
  '不',
  '也',
  '都',
  '很',
  '到',
  '要',
  '会',
  '着',
  '能',
  '可',
  '以',
  '对',
  '与',
  '或',
  '而',
  '且',
  '但',
  '则',
  '因',
  '所',
  '被',
  '把',
  '从',
  '由',
  '向',
  '往',
  '用',
  '为',
  '让',
  '使',
  '给',
  '将',
  '比',
  '更',
  '最',
  '只',
  '这',
  '那',
  '其',
  '各',
  '某',
  '每',
  '任',
  '何',
  '另',
  '别',
  '全',
  '整',
  '些',
  '几',
  '上',
  '下',
  '中',
  '内',
  '外',
  '前',
  '后',
  '左',
  '右',
  '大',
  '小',
  '多',
  '少',
  '高',
  '一',
  '二',
  '三',
  '两',
  '个',
  '次',
  '种',
  '项',
  '批',
  '组',
  '类',
  '型'
]);
