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

Skills are markdown files with YAML frontmatter, organized by library. Each skill documents a chart type or visualization pattern with metadata (category, tags, difficulty, use cases) and content (best practices, API usage, code examples).

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

The build script (`src/scripts/build.ts`) parses all skill markdown files and generates JSON index files (`src/index/*.index.json`). Each index stores two things: the `skills[]` array (reference docs) and `info` (SKILL.md metadata including `constraintsContent` — the core constraints section up to `<!-- CONSTRAINTS:END -->`).

A second build step (`src/scripts/build-zvec.ts`) embeds all skill texts and writes them into zvec vector collections (`src/index/*.zvec/`) with full FTS indexes on title, description, tags, content, use_cases, and anti_patterns.

The CLI (`antv` command) provides four commands:

- `antv retrieve <query>` - zvec hybrid search (FTS + vector + RRF fusion); `--content` returns reference doc markdown and auto-prepends the core constraints block as the first result
- `antv get <id>` - Get a single skill by exact ID
- `antv list` - List/filter available skills
- `antv info <library>` - Show library core constraints (SKILL.md Section 1-2)

The retrieval engine uses **zvec** (in-process vector database) with two strategies:
- **`hybrid`** (default): zvec native multiQuery — FTS (jieba tokenizer, raw text) + Vector (HNSW ANN, 384d) + RRF fusion
- **`vector`**: Pure ANN vector similarity search

Embedding is handled by `SimpleEmbedder` (tokenizer + multi-hash, 384d, synchronous). No model download required.

Public API (`src/api.ts`) exports `retrieve()`, `createContext()`, `info()`, `getSkillById()`, `libraries()`, and `listSkills()` for programmatic use.

Additional components:
- **HTTP Server** (`http-server/`): Standalone REST API deployment package

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
│   ├── commands/         # CLI commands (retrieve, list, info, get)
│   ├── core/             # Types, zvec retriever, embedder
│   │   └── retrieval/    # zvec-store, embedder
│   ├── scripts/          # Build scripts (markdown → JSON index + zvec index)
│   └── index/            # Generated JSON + zvec index files
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
# Build: parse skills → generate JSON index → build zvec index → compile TS
pnpm build

# Build individual steps
pnpm build:index:json     # JSON index only
pnpm build:index:zvec     # zvec vector index only

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
