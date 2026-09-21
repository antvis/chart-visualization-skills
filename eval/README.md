# AntV Skills 评测套件

> 衡量 LLM 基于检索到的 skill 文档生成 AntV 代码的质量。两步流程：**generate**（生成代码）→ **judge**（打分）。

## 快速开始

```bash
# 前置：先在仓库根目录编译（agent 依赖 dist/api.js 的检索）
pnpm build

cd eval
pnpm install

# 配置模型（见 .env.example）
cp .env.example .env

# 跑单个模型（--model 必填：kimi | glm | deepseek）
node generate.mjs --model kimi --library g6 --sample 10
node judge.mjs --model kimi

# 并行跑 3 个模型（各自产出独立结果文件）
node generate.mjs --model kimi     --library g6 --sample 10 &
node generate.mjs --model glm      --library g6 --sample 10 &
node generate.mjs --model deepseek --library g6 --sample 10 &
wait
node judge.mjs --model kimi
node judge.mjs --model glm
node judge.mjs --model deepseek
```

## 流程

```
generate.mjs --model X  ──▶  results/X-eval-result.json  ──▶  judge.mjs --model X
（检索 + LLM 生成代码）       （中间产物 + X-{id}.js）        （规则检查 + 相似度）
```

1. **generate**：对每条 case，agent 先调用 `search_skills` 检索相关 skill 文档，再生成代码。代码写入 `results/<model>-<id>.js`，元信息写入 `results/<model>-eval-result.json`。
2. **judge**：读取 `<model>-eval-result.json`，对每条生成代码做两件事，写回结果并打印汇总。

## 评估指标（双轨，互不合成）

| 轨道 | 产出 | 含义 |
|------|------|------|
| **规则检查** | `hasIssues` / `issues` / `warnings` | 硬性错误（缺 import、缺 render、用了 V4 API 等） |
| **代码相似度** | `similarity`（0~1） | 与人工标准答案的 hybrid 相似度（token + structural + fingerprint 加权，X6 有专用归一化和权重） |

汇总指标：`Success Rate`（无 issues 占比）、`Avg Similarity`（平均相似度）、`Issues Count`。

## CLI 参数

`generate.mjs` 和 `judge.mjs` 都需要 `--model`（必填）。

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--model <name>` | *(必填)* | 模型短名：`kimi` \| `glm` \| `deepseek` |
| `--library <lib>` | `g2` | 目标库：`g2` \| `g6` \| `x6`，自动选择默认数据集（仅 generate） |
| `--dataset <file>` | *(由 library 决定)* | `eval/cases/` 下的数据集文件名（仅 generate） |
| `--sample <n>` | `5` | 随机抽样 n 条（仅 generate） |
| `--full` | `false` | 运行全部用例（覆盖 `--sample`，仅 generate） |
| `--ids <ids>` | — | 逗号分隔的用例 ID，定向回测（仅 generate） |

`judge.mjs` 读取 `results/<model>-eval-result.json` 并写回。

## 环境变量

见 `.env.example`。3 个模型各自独立的 base URL + key（`BASE_URL` 含 `/v1`）：

| 短名 | 模型 ID | 环境变量 |
|------|---------|----------|
| `kimi` | `Kimi-K2.5` | `KIMI_BASE_URL` / `KIMI_API_KEY` |
| `glm` | `GLM-5.1` | `GLM_BASE_URL` / `GLM_API_KEY` |
| `deepseek` | `DeepSeek-Flash` | `DEEPSEEK_BASE_URL` / `DEEPSEEK_API_KEY` |

## 代码结构

```
eval/
├── generate.mjs         # 步骤1：LLM 生成代码
├── judge.mjs            # 步骤2：规则检查 + 相似度打分
├── lib/
│   ├── const.mjs        # 路径常量
│   ├── llm.mjs          # LLM client（3 模型注册 + Chat Completions）
│   ├── generate-agent.mjs # generate 阶段的 ToolLoopAgent（activeSkill + readFile + curl）
│   ├── load-cases.mjs   # 数据集加载 / 采样 / 按 ids 过滤
│   ├── extract-code.mjs # 从 LLM 响应提取代码
│   ├── similarity.mjs   # 代码相似度（纯函数）
│   ├── check.mjs        # 规则检查（纯函数）
│   └── tools/           # agent 工具（activeSkill / readFile / curl）
├── cases/               # 数据集（g2 / g6 / x6）
└── results/             # 生成结果（gitignore）
```
