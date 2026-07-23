import type { Doc } from './types';

/** 按 maxTokens 预算自动裁剪内容，优先保留 frontmatter 和代码块 */
export function applyTokenBudget(docs: Doc[], budget: number): Doc[] {
  const perDocBudget = Math.floor(budget / docs.length);
  return docs.map(doc => ({
    ...doc,
    content: truncateSmart(doc.content ?? '', perDocBudget)
  }));
}

/** 智能裁剪：frontmatter + 代码块优先，中间描述可裁 */
export function truncateSmart(content: string, budget: number): string {
  const tokens = countTokens(content);
  if (tokens <= budget) return content;

  // 分离 frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  const frontmatter = fmMatch?.[0] ?? '';
  const body = content.slice(frontmatter.length);

  // 提取代码块
  const codeBlocks: string[] = [];
  const bodyNoCode = body.replace(/```[\s\S]*?```/g, (m) => (codeBlocks.push(m), '<<CODE>>'));

  const fmTokens = countTokens(frontmatter);
  const codeTokens = codeBlocks.reduce((sum, _) => sum + countTokens('```js\n// code\n```'), 0);
  const mainBudget = Math.max(0, budget - fmTokens - codeTokens);

  if (mainBudget <= 0) {
    return (frontmatter + codeBlocks.join('\n')).slice(0, budget * 4);
  }

  let main = bodyNoCode;
  if (countTokens(main) > mainBudget) {
    const ratio = (mainBudget / countTokens(main)) * 0.9;
    main = main.slice(0, Math.floor(main.length * ratio));
  }

  // 还原代码块
  let i = 0;
  const result = main.replace(/<<CODE>>/g, () => codeBlocks[i++] ?? '');

  return frontmatter + result;
}

export function countTokens(text: string): number {
  // 简单估算：中文字符 ≈ 1 token，英文/符号 ≈ 4 字符 ≈ 1 token
  const chinese = (text.match(/[一-龥]/g) ?? []).length;
  const other = text.length - chinese;
  return chinese + Math.ceil(other / 4);
}