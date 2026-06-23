/**
 * Embedder: text-to-vector conversion.
 *
 * Two implementations are provided:
 * - TransformersEmbedder: uses @xenova/transformers (all-MiniLM-L6-v2, 384 dims)
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

const SIMPLE_DIMS = 384;

/**
 * Lightweight pseudo-embedder: character n-grams hashed with multiple
 * hash functions into a fixed-size vector, then L2-normalised.
 *
 * This is NOT a semantic embedder – it produces a bag-of-subword-tokens
 * fingerprint. Use TransformersEmbedder for production workloads.
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
    const tokens = tokenize(text);
    if (tokens.length === 0) {
      // Fallback: use raw character n-grams on lowercased input
      const raw = text.toLowerCase().replace(/\s+/g, ' ');
      for (let i = 0; i + 2 <= raw.length; i++) {
        const bigram = raw.slice(i, i + 2);
        for (let h = 0; h < 3; h++) {
          vec[hashToken(bigram, h) % SIMPLE_DIMS] += 1;
        }
      }
    }

    for (const token of tokens) {
      // Multiple hash functions per token for better coverage
      for (let h = 0; h < 3; h++) {
        vec[hashToken(token, h) % SIMPLE_DIMS] += 1;
      }
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
// TransformersEmbedder – local sentence-transformers model via Xenova
// ---------------------------------------------------------------------------

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const TRANSFORMERS_DIMS = 384;

let _transformersModule: any = undefined;
let _transformersLoadFailed = false;

async function loadTransformers(): Promise<any> {
  if (_transformersModule) return _transformersModule;
  if (_transformersLoadFailed) return undefined;
  try {
    // Dynamic require – @xenova/transformers is an optional dependency.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _transformersModule = require('@xenova/transformers');
  } catch {
    _transformersLoadFailed = true;
    return undefined;
  }
  return _transformersModule;
}

/**
 * Embedder backed by Xenova/all-MiniLM-L6-v2 (384-dims).
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
    if (this._pipeline) return this._pipeline;
    if (!this._loadPromise) {
      this._loadPromise = (async () => {
        const t = await loadTransformers();
        if (!t) {
          throw new Error(
            '@xenova/transformers is not installed. Install it with:\n' +
              '  pnpm add @xenova/transformers'
          );
        }
        this._pipeline = await t.pipeline('feature-extraction', MODEL_ID);
      })();
    }
    return this._loadPromise;
  }

  async embed(text: string): Promise<number[]> {
    return (await this.embedBatch([text]))[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const pipe = await this._getPipeline();
    const outputs = await pipe(texts, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(outputs.tolist()) as number[][];
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
 * Tries TransformersEmbedder first (needs @xenova/transformers installed),
 * then falls back to SimpleEmbedder.
 */
export async function getEmbedder(): Promise<Embedder> {
  if (_defaultEmbedder) return _defaultEmbedder;

  const t = await loadTransformers();
  if (t) {
    _defaultEmbedder = new TransformersEmbedder();
  } else {
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
// Internal helpers
// ---------------------------------------------------------------------------

function tokenize(text: string): string[] {
  const tokens: string[] = [];

  // Split mixed CJK / ASCII into chunks
  const segments = splitMixed(text.toLowerCase());

  for (const seg of segments) {
    if (isCJK(seg)) {
      // Character n-grams (1..3) for Chinese / Japanese / Korean
      for (let n = 1; n <= 3; n++) {
        for (let i = 0; i + n <= seg.length; i++) {
          tokens.push(seg.slice(i, i + n));
        }
      }
    } else {
      // Whitespace-split for alphabetic segments
      for (const w of seg.split(/\s+/)) {
        const trimmed = w.trim();
        if (trimmed.length >= 1 && !STOP_WORDS.has(trimmed)) {
          tokens.push(trimmed);
        }
      }
    }
  }

  return tokens;
}

function isCJK(ch: string): boolean {
  const cp = ch.codePointAt(0)!;
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) || // CJK Unified
    (cp >= 0x3400 && cp <= 0x4dbf) || // CJK Ext-A
    (cp >= 0x3040 && cp <= 0x30ff) || // Hiragana + Katakana
    (cp >= 0xac00 && cp <= 0xd7af)    // Hangul
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

// Embedding stop words — minimal set, keep most tokens for vector coverage.
// Unlike BM25 stop words, we want maximum signal in the embedding vector.
const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
  'i', 'me', 'my', 'we', 'our', 'he', 'him', 'his', 'she', 'her', 'it', 'its',
  'and', 'but', 'or', 'if',
  'this', 'that', 'these', 'those',
  'not', 'no', 'nor', 'only',
  'chart', 'using', 'use',
]);
