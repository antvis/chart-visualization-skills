/**
 * ZvecStore – zvec Collection management abstraction.
 *
 * Two implementations:
 * - ActualZvecStore: wraps @zvec/zvec SDK with full FTS + Vector + Hybrid
 * - MemoryZvecStore: pure in-memory fallback (dev / no SDK)
 *
 * The IZvecStore interface isolates the rest of the code from zvec SDK details.
 */

export interface ZvecDoc {
  id: string;
  vector: number[];
  fields: Record<string, string | number>;
}

export interface ZvecQueryResult {
  id: string;
  score: number;
  fields: Record<string, string | number>;
}

export interface ZvecSearchParams {
  vector: number[];
  topK: number;
  /** Optional field-level filter (exact match expression like `library = 'g2'`). */
  filter?: string;
}

export interface ZvecHybridParams {
  /** Query text for FTS path (no embedding needed). */
  queryText: string;
  /** Query vector for ANN path (must be pre-computed). */
  queryVector: number[];
  topK: number;
  filter?: string;
}

export interface IZvecStore {
  insert(docs: ZvecDoc[]): Promise<void>;
  /** Pure ANN vector search. */
  search(params: ZvecSearchParams): Promise<ZvecQueryResult[]>;
  /** Hybrid FTS + Vector with native RRF fusion (when available). */
  searchHybrid(params: ZvecHybridParams): Promise<ZvecQueryResult[]>;
  /** Synchronous ANN vector search. */
  searchSync(params: ZvecSearchParams): ZvecQueryResult[];
  /** Synchronous hybrid FTS + Vector search. */
  searchHybridSync(params: ZvecHybridParams): ZvecQueryResult[];
  close(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Skill document field names (shared between both implementations)
// ---------------------------------------------------------------------------

export const SKILL_SCALAR_FIELDS = [
  'title', 'description', 'library', 'category', 'tags',
  'difficulty', 'content', 'use_cases', 'anti_patterns',
  'path', 'content_hash', 'source', 'expires_at',
] as const;

/** Fields that get FTS indexes in ActualZvecStore. */
export const FTS_FIELDS = [
  'title', 'description', 'tags', 'content', 'use_cases', 'anti_patterns',
] as const;

export const VECTOR_FIELD = 'embedding';
export const VECTOR_DIMS = 384;

// ---------------------------------------------------------------------------
// MemoryZvecStore – pure JS fallback (cosine similarity + linear scan + text)
// ---------------------------------------------------------------------------

export class MemoryZvecStore implements IZvecStore {
  private docs: ZvecDoc[] = [];

  async insert(docs: ZvecDoc[]): Promise<void> {
    this.docs.push(...docs);
  }

  async search(params: ZvecSearchParams): Promise<ZvecQueryResult[]> {
    const { vector, topK, filter } = params;
    let scored: ZvecQueryResult[] = [];

    for (const doc of this.docs) {
      if (filter && !evalMemoryFilter(filter, doc.fields)) continue;
      const score = cosineSimilarity(vector, doc.vector);
      scored.push({ id: doc.id, score, fields: doc.fields });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  async searchHybrid(params: ZvecHybridParams): Promise<ZvecQueryResult[]> {
    const { queryText, queryVector, topK, filter } = params;

    // Build reciprocal-rank maps
    const rrScores = new Map<string, number>();

    // 1. Text path: case-insensitive substring + field-boosted scoring
    const terms = queryText.toLowerCase().split(/\s+/).filter(Boolean);
    const textRanked = this.docs
      .filter((d) => !filter || evalMemoryFilter(filter, d.fields))
      .map((doc) => {
        let score = 0;
        const title = String(doc.fields.title || '').toLowerCase();
        const desc = String(doc.fields.description || '').toLowerCase();
        const content = String(doc.fields.content || '').toLowerCase();
        const tags = String(doc.fields.tags || '').toLowerCase();

        for (const term of terms) {
          if (title.includes(term)) score += 3;
          if (tags.includes(term)) score += 2;
          if (desc.includes(term)) score += 1;
          if (content.includes(term)) score += 0.5;
        }
        return { id: doc.id, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);

    for (let i = 0; i < textRanked.length; i++) {
      rrScores.set(textRanked[i].id, 1 / (i + 1));
    }

    // 2. Vector path: cosine similarity
    const vecRanked = this.docs
      .filter((d) => !filter || evalMemoryFilter(filter, d.fields))
      .map((doc) => ({ id: doc.id, score: cosineSimilarity(queryVector, doc.vector) }))
      .sort((a, b) => b.score - a.score);

    for (let i = 0; i < vecRanked.length; i++) {
      rrScores.set(vecRanked[i].id, (rrScores.get(vecRanked[i].id) ?? 0) + 1 / (i + 1));
    }

    // 3. Merge by RRF score
    return [...rrScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([id, score]) => {
        const doc = this.docs.find((d) => d.id === id)!;
        return { id, score: score / 2, fields: doc.fields };
      });
  }

  searchSync(params: ZvecSearchParams): ZvecQueryResult[] {
    return doSyncSearch(this.docs, params);
  }

  searchHybridSync(params: ZvecHybridParams): ZvecQueryResult[] {
    return doSyncHybridSearch(this.docs, params);
  }

  async close(): Promise<void> {
    this.docs = [];
  }
}

function doSyncSearch(
  docs: ZvecDoc[],
  params: ZvecSearchParams,
): ZvecQueryResult[] {
  const { vector, topK, filter } = params;
  const scored: ZvecQueryResult[] = [];
  for (const doc of docs) {
    if (filter && !evalMemoryFilter(filter, doc.fields)) continue;
    scored.push({ id: doc.id, score: cosineSimilarity(vector, doc.vector), fields: doc.fields });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

function doSyncHybridSearch(
  docs: ZvecDoc[],
  params: ZvecHybridParams,
): ZvecQueryResult[] {
  const { queryText, queryVector, topK, filter } = params;
  const rrScores = new Map<string, number>();

  // Text path: field-boosted substring scoring
  const terms = queryText.toLowerCase().split(/\s+/).filter(Boolean);
  const textRanked = docs
    .filter((d) => !filter || evalMemoryFilter(filter, d.fields))
    .map((doc) => {
      let score = 0;
      const title = String(doc.fields.title || '').toLowerCase();
      const desc = String(doc.fields.description || '').toLowerCase();
      const content = String(doc.fields.content || '').toLowerCase();
      const tags = String(doc.fields.tags || '').toLowerCase();
      for (const term of terms) {
        if (title.includes(term)) score += 3;
        if (tags.includes(term)) score += 2;
        if (desc.includes(term)) score += 1;
        if (content.includes(term)) score += 0.5;
      }
      return { id: doc.id, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  for (let i = 0; i < textRanked.length; i++) {
    rrScores.set(textRanked[i].id, 1 / (i + 1));
  }

  // Vector path
  const vecRanked = docs
    .filter((d) => !filter || evalMemoryFilter(filter, d.fields))
    .map((doc) => ({ id: doc.id, score: cosineSimilarity(queryVector, doc.vector) }))
    .sort((a, b) => b.score - a.score);

  for (let i = 0; i < vecRanked.length; i++) {
    rrScores.set(vecRanked[i].id, (rrScores.get(vecRanked[i].id) ?? 0) + 1 / (i + 1));
  }

  return [...rrScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id, score]) => {
      const doc = docs.find((d) => d.id === id)!;
      return { id, score: score / 2, fields: doc.fields };
    });
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

function evalMemoryFilter(filter: string, fields: Record<string, string | number>): boolean {
  // Simple `field = 'value'` parser for MemoryZvecStore (zvec SQL-style syntax)
  const m = filter.match(/^(\w+)\s*=\s*'([^']*)'$/);
  if (!m) return true;
  return fields[m[1]] === m[2];
}

// ---------------------------------------------------------------------------
// ActualZvecStore – wraps @zvec/zvec native bindings (full schema + FTS)
// ---------------------------------------------------------------------------

let _zvecModule: any = undefined;
let _zvecLoadFailed = false;

function loadZvecSync(): any | undefined {
  if (_zvecModule) return _zvecModule;
  if (_zvecLoadFailed) return undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _zvecModule = require('@zvec/zvec');
  } catch {
    _zvecLoadFailed = true;
    return undefined;
  }
  return _zvecModule;
}

/**
 * ZvecStore backed by the native @zvec/zvec library.
 *
 * Provides true hybrid search: zvec's FTS path accepts raw text (no embedding),
 * the vector path uses pre-computed embeddings, and `multiQuerySync` with RRF
 * fuses both in the engine.
 */
export class ActualZvecStore implements IZvecStore {
  private _collection: any;  // ZVecCollection
  private _closed = false;

  constructor(collection: any) {
    this._collection = collection;
  }

  /**
   * Create a new zvec collection with full schema (scalar fields + FTS indexes
   * + HNSW vector index).
   */
  static async create(path: string, dims: number): Promise<ActualZvecStore> {
    const z = requireZvecSync();
    const schema = buildSkillSchema(z, dims);
    const collection = z.ZVecCreateAndOpen(path, schema);
    return new ActualZvecStore(collection);
  }

  /** Synchronous version of `create`. */
  static createSync(path: string, dims: number): ActualZvecStore {
    const z = requireZvecSync();
    const schema = buildSkillSchema(z, dims);
    const collection = z.ZVecCreateAndOpen(path, schema);
    return new ActualZvecStore(collection);
  }

  static async open(path: string): Promise<ActualZvecStore> {
    const z = requireZvecSync();
    const collection = z.ZVecOpen(path);
    return new ActualZvecStore(collection);
  }

  /** Synchronous version of `open`. Uses read-only to allow concurrent readers. */
  static openSync(path: string): ActualZvecStore {
    const z = requireZvecSync();
    const collection = z.ZVecOpen(path, { readOnly: true });
    return new ActualZvecStore(collection);
  }

  async insert(docs: ZvecDoc[]): Promise<void> {
    if (this._closed) throw new Error('Store is closed');
    if (docs.length === 0) return;

    const records = docs.map((d) => ({
      id: d.id,
      vectors: { [VECTOR_FIELD]: d.vector },
      fields: d.fields,
    }));
    this._collection.insertSync(records);
  }

  async search(params: ZvecSearchParams): Promise<ZvecQueryResult[]> {
    if (this._closed) throw new Error('Store is closed');

    const rawResults = this._collection.querySync({
      fieldName: VECTOR_FIELD,
      vector: params.vector,
      topk: params.topK,
      filter: params.filter,
    });

    return rawResults.map((r: any) => ({
      id: r.id,
      score: r.score,
      fields: r.fields ?? {},
    }));
  }

  async searchHybrid(params: ZvecHybridParams): Promise<ZvecQueryResult[]> {
    if (this._closed) throw new Error('Store is closed');

    const rawResults = this._collection.multiQuerySync({
      queries: [
        // Path 1: Vector ANN on pre-computed embedding
        {
          fieldName: VECTOR_FIELD,
          vector: params.queryVector,
          numCandidates: params.topK * 2,
        },
        // Path 2: FTS on content – raw text, no embedding needed
        {
          fieldName: 'content',
          fts: { matchString: params.queryText },
          numCandidates: params.topK * 2,
          params: this._getFtsQueryParams(),
        },
      ],
      topk: params.topK,
      filter: params.filter,
      rerank: { type: 'rrf', rankConstant: 60 },
    });

    return rawResults.map((r: any) => ({
      id: r.id,
      score: r.score,
      fields: r.fields ?? {},
    }));
  }

  searchSync(params: ZvecSearchParams): ZvecQueryResult[] {
    if (this._closed) throw new Error('Store is closed');

    const rawResults = this._collection.querySync({
      fieldName: VECTOR_FIELD,
      vector: params.vector,
      topk: params.topK,
      filter: params.filter,
    });

    return rawResults.map((r: any) => ({
      id: r.id,
      score: r.score,
      fields: r.fields ?? {},
    }));
  }

  searchHybridSync(params: ZvecHybridParams): ZvecQueryResult[] {
    if (this._closed) throw new Error('Store is closed');

    const rawResults = this._collection.multiQuerySync({
      queries: [
        { fieldName: VECTOR_FIELD, vector: params.queryVector, numCandidates: params.topK * 2 },
        {
          fieldName: 'content',
          fts: { matchString: params.queryText },
          numCandidates: params.topK * 2,
          params: this._getFtsQueryParams(),
        },
      ],
      topk: params.topK,
      filter: params.filter,
      rerank: { type: 'rrf', rankConstant: 60 },
    });

    return rawResults.map((r: any) => ({
      id: r.id,
      score: r.score,
      fields: r.fields ?? {},
    }));
  }

  async close(): Promise<void> {
    if (this._closed) return;
    this._closed = true;
    try {
      this._collection.closeSync();
    } catch {
      // best-effort
    }
  }

  private _getFtsQueryParams(): any {
    const z = loadZvecSync();
    if (!z) return undefined;
    return { indexType: z.ZVecIndexType.FTS, defaultOperator: 'OR' };
  }
}

function requireZvecSync(): any {
  const z = loadZvecSync();
  if (!z) {
    throw new Error(
      '@zvec/zvec is not installed. Install it with:\n' +
        '  pnpm add @zvec/zvec'
    );
  }
  return z;
}

/**
 * Build the full ZVecCollectionSchema with:
 * - Vector field (HNSW index, cosine similarity)
 * - Scalar fields matching the Skill type
 * - FTS indexes on title, description, tags, content, use_cases, anti_patterns
 */
function buildSkillSchema(z: any, dims: number): any {
  const { ZVecCollectionSchema, ZVecDataType, ZVecIndexType, ZVecMetricType } = z;

  const vectorSchema = {
    name: VECTOR_FIELD,
    dataType: ZVecDataType.VECTOR_FP32,
    dimension: dims,
    indexParams: {
      indexType: ZVecIndexType.HNSW,
      metricType: ZVecMetricType.COSINE,
      m: 32,
      efConstruction: 200,
    },
  };

  const fieldSchemas = [
    { name: 'title',        dataType: ZVecDataType.STRING, indexParams: { indexType: ZVecIndexType.FTS, tokenizerName: 'jieba', filters: ['lowercase'] } },
    { name: 'description',  dataType: ZVecDataType.STRING, indexParams: { indexType: ZVecIndexType.FTS, tokenizerName: 'jieba' } },
    { name: 'library',      dataType: ZVecDataType.STRING, indexParams: { indexType: ZVecIndexType.INVERT } },
    { name: 'category',     dataType: ZVecDataType.STRING, indexParams: { indexType: ZVecIndexType.INVERT } },
    { name: 'tags',         dataType: ZVecDataType.STRING, indexParams: { indexType: ZVecIndexType.FTS, tokenizerName: 'jieba' } },
    { name: 'difficulty',   dataType: ZVecDataType.STRING },
    { name: 'content',      dataType: ZVecDataType.STRING, indexParams: { indexType: ZVecIndexType.FTS, tokenizerName: 'jieba', filters: ['lowercase'] } },
    { name: 'use_cases',    dataType: ZVecDataType.STRING, indexParams: { indexType: ZVecIndexType.FTS, tokenizerName: 'jieba' } },
    { name: 'anti_patterns',dataType: ZVecDataType.STRING, indexParams: { indexType: ZVecIndexType.FTS, tokenizerName: 'jieba' } },
    { name: 'path',         dataType: ZVecDataType.STRING },
    { name: 'content_hash', dataType: ZVecDataType.STRING },
    { name: 'source',       dataType: ZVecDataType.STRING },
    { name: 'expires_at',   dataType: ZVecDataType.INT64 },
  ];

  return new ZVecCollectionSchema({
    name: 'skills',
    vectors: vectorSchema,
    fields: fieldSchemas,
  });
}

// ---------------------------------------------------------------------------
// Convenience factories
// ---------------------------------------------------------------------------

export async function createZvecStore(
  path: string,
  dims: number
): Promise<IZvecStore> {
  const z = loadZvecSync();
  if (z) {
    return ActualZvecStore.create(path, dims);
  }
  return new MemoryZvecStore();
}

export async function openZvecStore(path: string): Promise<IZvecStore> {
  return openZvecStoreSync(path);
}

/**
 * Synchronously open a zvec store.
 *
 * This avoids the async Promise wrapper so it can be used inside synchronous
 * code paths (e.g. `retrieve()`).  Both `ActualZvecStore.open()` and
 * `MemoryZvecStore` are internally synchronous.
 */
export function openZvecStoreSync(path: string): IZvecStore {
  const z = loadZvecSync();
  if (z) {
    return ActualZvecStore.openSync(path);
  }
  throw new Error(
    'Cannot open zvec store: @zvec/zvec is not installed and MemoryZvecStore ' +
    'has no persistence. Install @zvec/zvec or use createZvecStore() to create ' +
    'a new MemoryZvecStore.'
  );
}

/** Synchronous check: is @zvec/zvec available? */
export function isZvecAvailable(): boolean {
  return loadZvecSync() !== undefined;
}
