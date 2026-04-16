# Harness

Skill 迭代优化。通过 eval → render test → analyze → optimize → rebuild 循环，持续提升 LLM 代码生成质量。

## 架构

```
controller.js          # 主入口，驱动整个优化循环
├── eval-agent.js      # 调用 eval CLI，生成测试结果文件
├── render-agent.js    # Headless 浏览器渲染测试，返回失败 case
├── analyze-agent.js   # 将错误 case 归因到对应 skill 文件
├── optimize-agent.js  # LLM 重写 skill 文档修复错误
├── index-agent.js     # 重建 BM25 检索索引
├── config.js          # Library 注册表（g2 / g6 元信息）
├── config-manager.js  # 多源配置合并（CLI > 配置文件 > env > 默认值）
├── error-classifier.js# 错误分类与恢复策略
├── memory.js          # 跨迭代记忆（skill 优化历史）
└── retry-utils.js     # 重试工具
```

### 循环流程

```
┌─────────────────────────────────────────────────────┐
│  每次迭代                                            │
│                                                     │
│  1. eval-agent      生成代码并写入 result JSON        │
│  2. render-agent    渲染测试，识别 error / blank case │
│  3. analyze-agent   将 case 归因到 skill 文件         │
│  4. optimize-agent  LLM 重写出错的 skill 文档         │
│  5. index-agent     重建 BM25 检索索引               │
│                                                     │
│  连续 --passes 次零错误 → 退出                        │
└─────────────────────────────────────────────────────┘
```

## 快速开始

```bash
cd harness && npm install

# 最小运行（g2，采样 10 条）
node controller.js

# 指定 library 和采样量
node controller.js --library=g6 --sample=30

# 全量数据集
node controller.js --library=g2 --full
```

## CLI 参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--library <id>` | `g2` | 目标库：`g2` \| `g6` |
| `--sample <n>` | `10` | 随机采样条数 |
| `--full` | `false` | 使用完整数据集（覆盖 `--sample`）|
| `--retrieval <strategy>` | `tool-call` | 检索策略：`tool-call` \| `bm25` \| `context7` |
| `--passes <n>` | `3` | 连续多少次零错误才停止 |
| `--max-iterations <n>` | `20` | 最大迭代轮次上限 |
| `--concurrency <n>` | `5` | 渲染测试并发数 |
| `--optimize-model <id>` | 同 `AI_MODEL` | 优化阶段使用的模型（如 `claude-sonnet-4-6`）|
| `--score` | `false` | 开启 VL 视觉质量打分 |
| `--score-threshold <n>` | `0.6` | 视觉分低于此值视为失败 |
| `--dry-run` | `false` | 只记录错误，不执行优化 |
| `--no-worktree` | `false` | 禁用 git worktree 隔离 |
| `--no-memory` | `false` | 禁用跨迭代记忆 |
| `--log <file>` | 自动生成 | dry-run 日志文件路径 |

## 环境变量

| 变量 | 说明 |
|------|------|
| `AI_MODEL` | 生成模型 ID，如 `qwen3-coder-480b-a35b-instruct` |
| `AI_API_KEY` | 生成模型 API Key |
| `AI_API_ENDPOINT` | 生成模型 API Endpoint |
| `CLAUDE_API_KEY` | Claude 模型 API Key（配合 `--optimize-model claude-*` 使用）|
| `CLAUDE_API_ENDPOINT` | Claude API Endpoint |
| `VL_MODEL` | 视觉评分模型，默认 `Qwen3-VL-235B-A22B-Instruct` |
| `G2_SRC_DIR` | G2 源码目录，供 optimize-agent 查阅（可选）|
| `G2_DOCS_DIR` | G2 文档目录，供 optimize-agent 查阅（可选）|
| `G6_SRC_DIR` | G6 源码目录，供 optimize-agent 查阅（可选）|
| `G6_DOCS_DIR` | G6 文档目录，供 optimize-agent 查阅（可选）|

也可通过 `HARNESS_*` 前缀环境变量设置 CLI 参数的默认值：`HARNESS_LIBRARY`、`HARNESS_SAMPLE`、`HARNESS_CONCURRENCY` 等。

## 持久化配置

常用参数可写入 `~/.harness/config.json`，避免每次重复输入：

```json
{
  "library": "g6",
  "sample": 30,
  "concurrency": 5,
  "optimizeModel": "claude-sonnet-4-6"
}
```

配置优先级：**CLI 参数 > 配置文件 > 环境变量 > 内置默认值**

## 常见用法

```bash
# 使用 Claude 优化，其余用默认模型生成
node controller.js --library=g6 --sample=30 --optimize-model claude-sonnet-4-6

# 只跑渲染测试，不优化（排查问题用）
node controller.js --dry-run --library=g6

# 禁用 worktree 隔离（本地调试）
node controller.js --no-worktree

# 开启视觉打分
node controller.js --score --score-threshold=0.7
```

## optimize-agent 的 refs 查阅工具

当配置了 `G6_SRC_DIR` / `G6_DOCS_DIR`（或 G2 对应变量）时，optimize-agent 会额外获得三个文件系统工具用于查阅权威 API：

- `list_directory` — 列出目录结构
- `read_file` — 读取文件内容（限 12 KB）
- `grep_files` — 在目录中搜索关键词

未配置时 agent 直接基于 skill 内容和错误 case 分析，不会尝试调用任何工具。
