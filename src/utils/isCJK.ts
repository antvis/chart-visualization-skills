/**
 * Check whether a character is CJK (Chinese / Japanese / Korean).
 */
export function isCJK(ch: string): boolean {
  const cp = ch.codePointAt(0)!;
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) || // CJK Unified
    (cp >= 0x3400 && cp <= 0x4dbf) || // CJK Ext-A
    (cp >= 0x3040 && cp <= 0x30ff) || // Hiragana + Katakana
    (cp >= 0xac00 && cp <= 0xd7af) // Hangul
  );
}
