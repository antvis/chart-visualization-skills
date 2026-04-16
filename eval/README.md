# AntV Skills Evaluation Suite

> Tools for measuring retrieval quality and LLM code generation accuracy.

## Quick Start

```bash
# Run G2 evaluation (default)
node eval/eval-cli/index.js --sample 10

# Run G6 evaluation
node eval/eval-cli/index.js --library g6 --sample 10

# Help
node eval/eval-cli/index.js help
```

## CLI Usage

```bash
# Specify library (auto-selects default dataset)
node eval/eval-cli/index.js --library g2 --sample 20   # uses g2-dataset-174.json
node eval/eval-cli/index.js --library g6 --sample 20   # uses g6-dataset-100.json

# Override dataset explicitly (ignores --library default)
node eval/eval-cli/index.js --dataset g6-dataset-100.json --sample 20

# Full run with model
node eval/eval-cli/index.js --library g6 --full --model claude-sonnet-4-6

# Specify retrieval strategy
node eval/eval-cli/index.js --library g6 --sample 20 --retrieval tool-call  # default
node eval/eval-cli/index.js --library g6 --sample 20 --retrieval bm25
node eval/eval-cli/index.js --library g6 --sample 20 --retrieval context7
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--library <lib>` | `g2` | Target library: `g2` \| `g6`. Auto-selects the default dataset. |
| `--dataset <file>` | *(from library)* | Dataset filename under `eval/data/`. Overrides `--library` default. |
| `--model <id>` | `$AI_MODEL` | Model ID. |
| `--sample <n>` | `5` | Sample n random test cases. |
| `--full` | `false` | Run all test cases (overrides `--sample`). |
| `--concurrency <n>` | `1` | Parallel workers. |
| `--retrieval <strategy>` | `tool-call` | Retrieval strategy: `tool-call` \| `bm25` \| `context7`. |
| `--ids <ids>` | — | Comma-separated case IDs for targeted re-test. |
| `--verbose` | `false` | Show detailed output. |

### Retrieval Strategies

| Strategy | Description |
|----------|-------------|
| `tool-call` | LLM actively calls `read_skills` tools (agent loop, multi-turn) |
| `bm25` | BM25 pre-retrieves top-5 skills and injects them into the system prompt (single-turn) |
| `context7` | Context7 REST API retrieves official AntV docs and injects them into the system prompt (single-turn, requires `CONTEXT7_API_KEY`) |

### Default Datasets

| Library | Default Dataset |
|---------|----------------|
| `g2` | `eval/data/g2-dataset-174.json` |
| `g6` | `eval/data/g6-dataset-100.json` |

### Result File Naming

```
eval/result/eval-{retrieval}-{dataset}-{model}-{YYYY-MM-DD}.json

# Examples
eval-tool-call-g6-dataset-100-claude-sonnet-4-6-2026-04-16.json
eval-bm25-g2-dataset-174-qwen3-coder-480b-a35b-instruct-2026-04-16.json
eval-context7-g2-dataset-174-claude-sonnet-4-6-2026-04-16.json
```

### Comparing Retrieval Strategies

To fairly compare strategies, run them with the same library, sample size, and model:

```bash
node eval/eval-cli/index.js --library g6 --sample 20 --retrieval tool-call
node eval/eval-cli/index.js --library g6 --sample 20 --retrieval bm25
node eval/eval-cli/index.js --library g6 --sample 20 --retrieval context7
```

---

## Evaluation Scripts

### eval-recall.js
Tests skill retrieval recall (no API key needed).
```bash
node eval/eval-recall.js
```

### _tune-bm25.js
BM25 hyperparameter tuning.
```bash
node eval/_tune-bm25.js
```

## Test Datasets

| File | Cases | Description |
|------|-------|-------------|
| `eval/data/g2-dataset-174.json` | 174 | G2 charts — components, transforms, interactions |
| `eval/data/g6-dataset-100.json` | 100 | G6 graphs — layouts, edges, nodes, behaviors |

### bad-case.json
Focused failure cases for regression testing.

## Environment Variables

```bash
# API Keys (required)
export QWEN_API_KEY=your_key
export ANTHROPIC_API_KEY=your_key
export OPENAI_API_KEY=your_key

# Required for context7 retrieval
export CONTEXT7_API_KEY=your_key

# Optional: Default model
export AI_MODEL=qwen3-coder-480b-a35b-instruct
```