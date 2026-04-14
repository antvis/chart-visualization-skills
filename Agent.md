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
                          │    │  (BM25 Retrieve/List)  │     │
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
├── antv-s2-expert/      # S2 pivot table skills
├── chart-visualization/  # Generic chart visualization via REST API
├── icon-retrieval/       # Icon retrieval skill
├── infographic-creator/  # Infographic creation
└── narrative-text-visualization/
```

Skills are the **single source of truth** for chart generation knowledge.

### 2. CLI Tool (`src/`)

The build script (`src/scripts/build.ts`) parses all skill markdown files and generates JSON index files (`src/index/*.index.json`). The CLI (`antv` command) provides three commands:

- `antv retrieve <query>` - BM25 full-text search over skills
- `antv list` - List/filter available skills
- `antv info <library>` - Show library metadata

The retrieval engine (`src/core/bm25.ts`) implements BM25 with Chinese/English tokenization, synonym expansion, and chart-type boosting.

Public API (`src/api.ts`) exports `retrieve()` and `info()` for programmatic use.

### 3. Evaluation (`eval/`)

Automated evaluation framework that measures skill quality across retrieval strategies:

- **tool-call**: LLM uses tools to load skills on demand (multi-turn agent)
- **bm25**: Pre-retrieve top-K skills via BM25, inject into prompt (single-turn)
- **context7**: Fetch official docs via REST API (single-turn)

Key files:
- `eval/data/eval-g2-dataset-174.json` - 174 labeled test cases
- `eval/eval-cli/index.js` - Main eval runner
- `eval/eval-recall.js` - BM25 retrieval recall measurement

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
- **IndexAgent** - Rebuild BM25 search index

Iterates until MAX_PASSES consecutive clean passes are achieved.

### 5. Playground (`playground/`)

Next.js web app for interactive chart generation. Dual-panel UI with chat interface, code editor (Monaco), and real-time chart preview.

Two retrieval modes:
- **Skill mode** - Agent calls `load_skill` / `read_file` tools
- **CLI mode** - Pre-injected BM25 results in system prompt

## Project Structure

```
.
├── src/                  # Core library: CLI, API, BM25 retriever, build scripts
│   ├── index.ts          # CLI entry point (Commander.js)
│   ├── api.ts            # Public Node.js API
│   ├── commands/         # CLI commands (retrieve, list, info)
│   ├── core/             # BM25 engine, types
│   ├── scripts/          # Build script (markdown -> JSON index)
│   └── index/            # Generated JSON index files
├── skills/               # Skill definitions (markdown + YAML frontmatter)
├── eval/                 # Evaluation framework and test datasets
├── harness/              # Automated skill optimization loop
├── playground/           # Next.js interactive playground
├── __tests__/            # Vitest unit tests
└── package.json          # @antv/chart-visualization-skills
```

## Key Commands

```bash
# Build: parse skills -> generate index -> compile TypeScript
pnpm build

# Test
pnpm test

# Eval: run evaluation on dataset
node eval/eval-cli/index.js --retrieval=bm25 --dataset=eval-g2-dataset-174

# Harness: iterative optimization
node harness/controller.js --library=g2 --sample=10 --retrieval=bm25

# Playground: start dev server
cd playground && pnpm dev
```
