# AntV Skills Evaluation Suite

> Tools for measuring retrieval quality and LLM code generation accuracy.

## Quick Start

```bash
# Run evaluation
node eval/eval-cli/index.js --sample=10

# Helps
node eval/eval-cli/index.js help
```

## CLI Usage

```bash
# Run evaluation (default: tool-call retrieval)
node eval/eval-cli/index.js --sample=10
node eval/eval-cli/index.js --full --model=claude-3-opus

# Specify retrieval strategy
node eval/eval-cli/index.js --sample=20 --retrieval=tool-call  # default
node eval/eval-cli/index.js --sample=20 --retrieval=bm25
node eval/eval-cli/index.js --sample=20 --retrieval=context7
```

### Retrieval Strategies

| Strategy | Description |
|----------|-------------|
| `tool-call` | LLM actively calls `list_references` / `read_skills` tools (agent loop, multi-turn) |
| `bm25` | BM25 pre-retrieves top-5 skills and injects them into the system prompt (single-turn) |
| `context7` | Context7 REST API retrieves official AntV docs and injects them into the system prompt (single-turn, requires `CONTEXT7_API_KEY`) |

### Result File Naming

```
eval/result/eval-{retrieval}-{dataset}-{model}-{YYYY-MM-DD}.json

# Examples
eval-tool-call-dataset-200-qwen3-coder-480b-a35b-instruct-2026-04-01.json
eval-bm25-dataset-200-qwen3-coder-480b-a35b-instruct-2026-04-01.json
eval-context7-dataset-200-claude-sonnet-4-6-2026-04-01.json
```

### Comparing Retrieval Strategies

To fairly compare strategies, run them with the same sample size and model:

```bash
node eval/eval-cli/index.js --sample=20 --retrieval=tool-call
node eval/eval-cli/index.js --sample=20 --retrieval=bm25
node eval/eval-cli/index.js --sample=20 --retrieval=context7
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

## Test Dataset

### eval-g2-dataset-174.json 
174 labeled test cases covering G2, G6, components, and transforms.

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