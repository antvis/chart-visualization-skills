# AntV Skills 评测套件

> 用于衡量检索质量和 LLM 代码生成准确率的工具集。

## 技术栈

- **语言**：TypeScript（通过 `tsx` 直接运行，无需编译）
- **AI SDK**：`@ai-sdk/openai`，与 playground 模块设计对齐
- **运行方式**：`tsx` / `pnpm eval`

## 快速开始

```bash
# 方式一：进入 eval/ 目录后使用 pnpm 脚本
cd eval
pnpm eval --sample 10
pnpm eval --library g6 --sample 10

# 方式二：在项目根目录直接用 tsx
tsx eval/eval-cli/index.ts --sample 10
tsx eval/eval-cli/index.ts --library g6 --sample 10 --retrieval bm25

# 查看帮助
tsx eval/eval-cli/index.ts help
```

## CLI 用法

```bash
# 指定库（自动选择对应默认数据集）
tsx eval/eval-cli/index.ts --library g2 --sample 20   # 使用 g2-dataset-174.json
tsx eval/eval-cli/index.ts --library g6 --sample 20   # 使用 g6-dataset-100.json

# 显式指定数据集（忽略 --library 默认值）
tsx eval/eval-cli/index.ts --dataset g6-dataset-100.json --sample 20

# 完整运行并指定模型
tsx eval/eval-cli/index.ts --library g6 --full --model claude-sonnet-4-6

# 指定检索策略
tsx eval/eval-cli/index.ts --library g6 --sample 20 --retrieval tool-call  # 默认
tsx eval/eval-cli/index.ts --library g6 --sample 20 --retrieval bm25
tsx eval/eval-cli/index.ts --library g6 --sample 20 --retrieval context7
```

### 参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--library <lib>` | `g2` | 目标库：`g2` \| `g6`，自动选择默认数据集 |
| `--dataset <file>` | *(由 library 决定)* | `eval/data/` 下的数据集文件名，覆盖 `--library` 默认值 |
| `--model <id>` | `$AI_MODEL` | 模型 ID |
| `--sample <n>` | `5` | 随机抽取 n 个测试用例 |
| `--full` | `false` | 运行全部测试用例（覆盖 `--sample`） |
| `--concurrency <n>` | `1` | 并行 worker 数量 |
| `--retrieval <strategy>` | `tool-call` | 检索策略：`tool-call` \| `bm25` \| `context7` |
| `--ids <ids>` | — | 逗号分隔的用例 ID，用于优化后定向回测 |
| `--verbose` | `false` | 显示详细输出 |

### 检索策略

| 策略 | 说明 |
|------|------|
| `tool-call` | LLM 主动调用 `read_skills` 工具（Agent 多轮循环） |
| `bm25` | BM25 预检索 top-5 技能并注入系统提示词（单轮） |
| `context7` | Context7 REST API 获取官方 AntV 文档并注入（单轮，需要 `CONTEXT7_API_KEY`） |

### 默认数据集

| 库 | 默认数据集 |
|----|-----------|
| `g2` | `eval/data/g2-dataset-174.json` |
| `g6` | `eval/data/g6-dataset-100.json` |

### 结果文件命名

```
eval/result/eval-{retrieval}-{dataset}-{model}-{YYYY-MM-DD}.json

# 示例
eval-tool-call-g6-dataset-100-claude-sonnet-4-6-2026-04-16.json
eval-bm25-g2-dataset-174-qwen3-coder-480b-a35b-instruct-2026-04-16.json
eval-context7-g2-dataset-174-claude-sonnet-4-6-2026-04-16.json
```

### 对比检索策略

使用相同的库、样本量和模型公平对比：

```bash
tsx eval/eval-cli/index.ts --library g6 --sample 20 --retrieval tool-call
tsx eval/eval-cli/index.ts --library g6 --sample 20 --retrieval bm25
tsx eval/eval-cli/index.ts --library g6 --sample 20 --retrieval context7
```

---

## 评测脚本

### eval-recall.ts

测试技能检索召回率（无需 API Key）。

```bash
tsx eval/eval-recall.ts
# 或进入 eval/ 目录后
cd eval && pnpm recall
```

### _tune-bm25.ts

BM25 超参数调优。

```bash
tsx eval/_tune-bm25.ts
# 或进入 eval/ 目录后
cd eval && pnpm tune
```

## 测试数据集

| 文件 | 用例数 | 说明 |
|------|--------|------|
| `eval/data/g2-dataset-174.json` | 174 | G2 图表——组件、变换、交互 |
| `eval/data/g6-dataset-100.json` | 100 | G6 图——布局、边、节点、行为 |

## 环境变量

```bash
# API Keys（必填，按使用的提供商配置）
export QWEN_API_KEY=your_key
export DEEPSEEK_API_KEY=your_key
export KIMI_API_KEY=your_key
export GLM_API_KEY=your_key
export OPENAI_API_KEY=your_key
export CLAUDE_API_KEY=your_key

# context7 检索策略需要
export CONTEXT7_API_KEY=your_key

# 可选：指定默认模型
export AI_MODEL=qwen3-coder-480b-a35b-instruct
```

## 代码结构

```
eval/
├── eval-cli/
│   └── index.ts          # CLI 入口（Commander.js）
├── eval-recall.ts         # BM25 召回率评测脚本
├── utils/
│   ├── ai-sdk.ts          # AI 适配层（@ai-sdk/openai，AgentLoop）
│   ├── provider-registry.ts  # Provider 元数据与 API Key 配置
│   ├── eval-manager.ts    # 评测生命周期管理（并行、持久化）
│   ├── skill-tools.ts     # Skill 文件加载与 ai-sdk tool 定义
│   ├── eval-utils.ts      # 查询构建、代码评估
│   ├── code-similarity.ts # Token/结构/指纹相似度算法
│   ├── parallel-executor.ts  # p-limit 并行执行封装
│   ├── context7.ts        # Context7 API 客户端
│   ├── category-inference.ts  # 描述文本→技能分类推断
│   ├── logger.ts          # pino 日志
│   └── websocket.ts       # WebSocket 实时进度推送
├── data/
│   ├── g2-dataset-174.json
│   └── g6-dataset-100.json
├── result/                # 评测结果输出目录
├── studio/                # 评测集、评测结果可视化（Next.js）
├── package.json
└── tsconfig.json
```
