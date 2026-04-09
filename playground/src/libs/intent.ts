/**
 * Message builder for chart generation
 */

/**
 * Build messages for the LLM.
 * Always passes currentCode as context when available — no intent detection.
 */
export function buildMessages(
  query: string,
  systemPrompt: string,
  currentCode: string | null
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt }
  ];

  if (currentCode) {
    messages.push({
      role: 'assistant',
      content: '```javascript\n' + currentCode + '\n```'
    });
    messages.push({
      role: 'user',
      content: `请基于上面的图表代码，${query}。只返回修改后的完整代码。`
    });
  } else {
    messages.push({ role: 'user', content: query });
  }

  return messages;
}

/**
 * Extract code from markdown code block
 */
export function extractCodeFromMarkdown(text: string): string {
  const m = text.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
  return m ? m[1].trim() : text.trim();
}
