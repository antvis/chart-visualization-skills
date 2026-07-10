# Agent.md - AntV Chart Visualization Skills

## Overview

This project is a skill-based system for generating chart visualization code using AntV libraries (G2, G6, S2, etc.). It provides AI agents with structured knowledge about chart types, best practices, and API usage, enabling them to generate correct chart code from natural language queries.

## Core Workflow

```
                                ┌─────────────────────────┐
                                │   Document + Code       │
                                └───────────┬─────────────┘
                                            │
                                            v
                               ┌────────────────────────┐
                          ┌───>│        Skills          │<────┐
                          │    └───────────┬────────────┘     │
                          │                │                  │
                          │                v                  │
                          │    ┌────────────────────────┐     │
                          │    │       CLI Tool         │     │
                          │    │  (zvec Hybrid/Vec)     │     │
                          │    └───────────┬────────────┘     │
                          │                │                  │
                          │                v                  │
                          │    ┌────────────────────────┐     │
                          │    │     Eval + Harness     │     │
                          │    │  (evaluate & optimize) │─────┘
                          │    └───────────┬────────────┘
                          │                │
                          │                v
                          │    ┌────────────────────────┐
                          └────│      Playground        │
                               │  (interactive preview) │
                               └────────────────────────┘
```

Eval + Harness 通过自动化评测发现问题，再由 LLM 优化 Skill 文档，形成闭环持续提升 Skill 质量。

### 1. Skill Authoring (`skills/`)

Skills are markdown files with YAML frontmatter, organized by library. Each skill documents a chart type or visualization pattern with metadata (category, tags, use cases) and content (best practices, API usage, code examples).

```
skills/
├── antv-g2-chart/       # G2 chart skills + reference docs
├── antv-g6-graph/       # G6 graph skills + reference docs
├── antv-x6-editor/      # X6 editor skills + reference docs
├── antv-s2-expert/      # S2 pivot table skills
├── chart-visualization/  # Generic chart visualization via REST API
├── icon-retrieval/       # Icon retrieval skill
├── infographic-creator/  # Infographic creation
└── narrative-text-visualization/
```

Skills are the **single source of truth** for chart generation knowledge.

### 2. CLI Tool (`src/`)

The build script (`src/scripts/build.ts`) reads all skill markdown files directly from `src/content/` and generates zvec vector collections (`src/index/*.zvec/`) with full FTS indexes on title, description, tags, content, use_cases, and anti_patterns. All metadata (including frontmatter `id`, `category`, `tags`, etc.) is stored in zvec fields via `@antv/context`, so no intermediate JSON index is needed.

The CLI (`antv` command) provides one command:

- `antv retrieve <query>` - zvec hybrid search (FTS + vector + RRF fusion); `--content` returns reference doc markdown; constraints docs are indexed as regular skill documents and appear naturally in search results

The retrieval engine uses **zvec** (in-process vector database) with two strategies:
- **`hybrid`** (default): zvec native multiQuery — FTS (jieba tokenizer, raw text) + Vector (HNSW ANN, 512d) + RRF fusion
- **`vector`**: Pure ANN vector similarity search

Embedding is handled by `@antv/context`'s built-in embedder (tokenizer + multi-hash, 512d, synchronous).

Public API (`src/api.ts`) exports `retrieve()` and `libraries()` for programmatic use.

### HTTP Server (`http-server/`)

Standalone REST API server (Express) providing POST endpoints for skill retrieval. Used by SKILL.md files for content retrieval via HTTP calls.

```bash
cd http-server && npm run dev    # starts on http://localhost:3100 (configurable via PORT env)
```

| Endpoint | Method | Description |
|---|---|---|
| `/retrieve` | POST | Retrieve skills by query (hybrid/vector search). Body: `{query, library, topK, content, strategy, maxTokens, progressiveLevel}` |
| `/libraries` | GET | List available library names |

### 3. Evaluation (`eval/`)

Automated evaluation framework that measures skill quality across retrieval strategies:

- **tool-call**: LLM uses tools to load skills on demand (multi-turn agent)
- **bm25**: Pre-retrieve top-K skills via BM25, inject into prompt (single-turn)
- **context7**: Fetch official docs via REST API (single-turn)

Key files:
- `eval/data/eval-g2-dataset-174.json` - 174 labeled test cases
- `eval/eval-cli/index.js` - Main eval runner

### 4. Harness (`harness/`)

Iterative optimization loop that automatically improves skills based on eval results:

```
Eval --> Render Test --> Error Analysis --> Optimize Skills --> Rebuild Index --> Repeat
```

The controller (`harness/controller.js`) orchestrates five agents:
- **EvalAgent** - Run LLM eval on dataset samples
- **RenderAgent** - Execute generated code in headless browser
- **AnalyzeAgent** - Classify errors and attribute to specific skills
- **OptimizeAgent** - LLM rewrites skill docs to fix errors
- **IndexAgent** - Rebuild search index

Iterates until MAX_PASSES consecutive clean passes are achieved.

### 5. Playground (`playground/`)

Next.js web app for interactive chart generation. Dual-panel UI with chat interface, code editor (Monaco), and real-time chart preview.

Two retrieval modes:
- **Skill mode** - Agent calls `load_skill` / `read_file` tools to load SKILL.md and reference docs on demand
- **CLI mode** - Agent calls `retrieve` tool each turn. Strategy selector (Hybrid / Vector) controls the retrieval mode. Hybrid is the default, using zvec's native FTS + Vector + RRF fusion.

## Project Structure

```
.
├── src/                  # Core library: CLI, API, zvec retriever, build scripts
│   ├── index.ts          # CLI entry point (Commander.js)
│   ├── api.ts            # Public Node.js API
│   ├── commands/         # CLI commands (retrieve)
│   ├── core/             # Types, zvec retriever, synonyms, token-budget
│   ├── scripts/          # Build script (build.ts only)
│   ├── content/          # Skill markdown source files (with frontmatter)
│   └── index/            # Generated zvec index files only
├── http-server/           # Standalone HTTP API deployment
├── skills/               # Skill definitions (markdown + YAML frontmatter)
├── eval/                 # Evaluation framework and test datasets
├── harness/              # Automated skill optimization loop
├── playground/           # Next.js interactive playground
├── __tests__/            # Vitest unit tests
└── package.json          # @antv/chart-visualization-skills
```

## Key Commands

```bash
# Build: build zvec index → compile TS → copy index
pnpm build

# Build individual step
pnpm build:index         # zvec vector index only

# Test
pnpm test

# Eval: run evaluation on dataset
node eval/eval-cli/index.js --retrieval=bm25 --dataset=eval-g2-dataset-174

# Harness: iterative optimization
node harness/controller.js --library=g2 --sample=10 --retrieval=bm25

# Playground: start dev server
cd playground && pnpm dev

# HTTP Server: start REST API
cd http-server && npm run dev
```
