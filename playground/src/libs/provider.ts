/**
 * LLM Provider
 *
 * 默认优先使用 Qwen（OpenAI 兼容协议），与项目根目录 .env 中的
 * QWEN_API_KEY / QWEN_API_ENDPOINT / AI_MODEL 保持一致。
 * 若设置了 DEEPSEEK_API_KEY，则使用 DeepSeek。
 */
import { createOpenAI } from "@ai-sdk/openai";

function joinUrl(endpoint: string, path: string): string {
  const base = endpoint.replace(/\/+$/, "");
  const tail = path.replace(/^\/+/, "");
  return `${base}/${tail}`;
}

export function createLanguageModel() {
  const qwenKey = process.env.QWEN_API_KEY;
  if (qwenKey) {
    const endpoint =
      process.env.QWEN_API_ENDPOINT || "https://antchat.alipay.com";
    const path = process.env.QWEN_API_PATH || "/v1/chat/completions";
    const modelId =
      process.env.QWEN_MODEL ||
      process.env.AI_MODEL ||
      "Qwen3-Coder-480B-A35B-Instruct";
    const baseURL = joinUrl(
      endpoint,
      path.replace(/\/chat\/completions$/, "") || "/v1",
    );
    const client = createOpenAI({ apiKey: qwenKey, baseURL });
    return { model: client.chat(modelId), provider: "qwen", modelId };
  }

  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekKey) {
    const endpoint =
      process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com";
    const path = process.env.DEEPSEEK_API_PATH || "/v1/chat/completions";
    const modelId = process.env.DEEPSEEK_MODEL || "DeepSeek-V3.2";
    const baseURL = joinUrl(
      endpoint,
      path.replace(/\/chat\/completions$/, "") || "/v1",
    );
    const client = createOpenAI({ apiKey: deepseekKey, baseURL });
    return { model: client.chat(modelId), provider: "deepseek", modelId };
  }

  throw new Error(
    "No LLM API key found. Please set either QWEN_API_KEY or DEEPSEEK_API_KEY in .env",
  );
}
