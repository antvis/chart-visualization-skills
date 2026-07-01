#!/usr/bin/env node

/**
 * Pre-download the bge-small-zh-v1.5 embedding model.
 *
 * Uses @huggingface/transformers' own pipeline to trigger download —
 * it handles platform cache paths correctly across npm / yarn (all versions) / pnpm.
 * No node_modules/ path assumptions.
 *
 * Runs automatically via `postinstall`.  Manual run:
 *   node scripts/download-model.mjs
 */

const MODEL_ID = 'onnx-community/bge-small-zh-v1.5-ONNX';

async function main() {
  // ── Resolve @huggingface/transformers ─────────────────────────────────────

  let tf;
  try {
    tf = await import('@huggingface/transformers');
  } catch {
    console.error(
      '[download-model] @huggingface/transformers not installed. Skipped.'
    );
    process.exit(0);
  }

  // ── Apply mirror ──────────────────────────────────────────────────────────

  if (process.env.HF_ENDPOINT) {
    tf.env.remoteHost = process.env.HF_ENDPOINT;
  }
  tf.env.allowRemoteModels = true;

  // ── Trigger download (no inference — just cache the files) ────────────────

  console.log('[download-model] Caching embedding model (~90 MB)…');

  try {
    // pipeline() downloads (if needed) and caches to the platform directory
    // (~/.cache/huggingface/ on Linux, ~/Library/Caches/huggingface/ on macOS).
    // We don't call pipe() — no ONNX inference, just file caching.
    await tf.pipeline('feature-extraction', MODEL_ID);
    console.log('[download-model] Done.');
  } catch (err) {
    console.warn(
      `[download-model] Failed: ${err.message.split('\n')[0]}\n` +
        'Vector search will use a lower-quality fallback embedder.\n' +
        'To retry with a mirror:\n' +
        '  export HF_ENDPOINT=https://hf-mirror.com\n' +
        '  node scripts/download-model.mjs\n'
    );
    process.exit(0);
  }
}

main();
