/**
 * Extract code from an LLM response — prefer a fenced code block, fall back to
 * the first import statement onward, then the raw text.
 */

export function extractCode(response) {
  const codeBlockMatch = response.match(/```(?:javascript|js|typescript|ts)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const importMatch = response.match(/import[\s\S]*/);
  if (importMatch) return importMatch[0].trim();
  return response.trim();
}
