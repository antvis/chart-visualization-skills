# AntV Skills Eval

Evaluate how well an LLM generates AntV code from natural-language queries, using retrieved skill docs as context.

## How it works

Two steps per (model, library) pair:

1. **generate** — for each case, the agent activates the matching skill (`activeSkill`), reads referenced docs (`readFile`), falls back to the context service (`curl`), then writes chart code. Output: `results/<model>-<library>-eval-result.json` (with a `generatedCode` field per case).
2. **judge** — scores each generated case against its reference code on two independent tracks and writes `results/<model>-<library>-summary.json`:
   - **Rule checks** → `hasIssues` / `issues` (hard failures: missing import/render, V4 API usage, ...)
   - **Code similarity** → `similarity` (0–1 hybrid score: token + structural + fingerprint, X6 has its own normalization/weights)

Summary metrics: `successCount` (no-issues rate), `similarity` (average), `issuesCount`.

## Setup

```bash
npm run build          # at repo root (agent retrieval depends on dist/api.js)
cd eval && npm install
cp .env.example .env   # fill in KIMI_/GLM_/DEEPSEEK_ BASE_URL + API_KEY
```

## Run (3 models × 3 libraries)

```bash
# G2
node generate.mjs --model kimi     --library g2 --full && node judge.mjs --model kimi     --library g2
node generate.mjs --model glm      --library g2 --full && node judge.mjs --model glm      --library g2
node generate.mjs --model deepseek --library g2 --full && node judge.mjs --model deepseek --library g2

# G6
node generate.mjs --model kimi     --library g6 --full && node judge.mjs --model kimi     --library g6
node generate.mjs --model glm      --library g6 --full && node judge.mjs --model glm      --library g6
node generate.mjs --model deepseek --library g6 --full && node judge.mjs --model deepseek --library g6

# X6
node generate.mjs --model kimi     --library x6 --full && node judge.mjs --model kimi     --library x6
node generate.mjs --model glm      --library x6 --full && node judge.mjs --model glm      --library x6
node generate.mjs --model deepseek --library x6 --full && node judge.mjs --model deepseek --library x6
```

Use `--sample n` instead of `--full` to run a random subset while iterating.
