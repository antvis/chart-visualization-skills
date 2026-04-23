/**
 * Render Agent
 *
 * Responsibility: Execute generated code via headless browser and return failed cases.
 */

import fs from 'fs';
import { testAllResults, type EvalResult } from '../eval/utils/render-tester.js';

export interface RenderAgentOptions {
  concurrency?: number;
  skipScore?: boolean;
  scoreThreshold?: number;
}

export async function run(
  resultPath: string,
  { concurrency = 5, skipScore = false, scoreThreshold = 0.6 }: RenderAgentOptions = {}
): Promise<(EvalResult & { id: string })[]> {
  const data = JSON.parse(fs.readFileSync(resultPath, 'utf-8')) as { results?: (EvalResult & { id: string })[] };
  const allResults = data.results || [];
  const total = allResults.length;

  console.log(
    `\nRender testing ${total} result(s) (concurrency=${concurrency}${skipScore ? '' : ', visual-score=on'})...`
  );

  const testedResults = await testAllResults(allResults, {
    concurrency,
    skipScore,
    onProgress({ done, total: t, result }) {
      const r = result as EvalResult & { id?: string };
      if (result.renderStatus !== 'success') {
        const tag = (result.renderStatus ?? '').toUpperCase();
        const detail = result.renderError ? ` — ${result.renderError}` : '';
        console.log(`  [${done}/${t}] [${tag}] ${r.id ?? '?'}${detail}`);
      } else if (
        result.visualScore != null &&
        result.visualScore < scoreThreshold
      ) {
        console.log(
          `  [${done}/${t}] [LOW-SCORE] ${r.id ?? '?'}  visualScore=${result.visualScore.toFixed(2)}`
        );
      } else {
        process.stdout.write(`\r  Progress: ${done}/${t}`);
      }
    }
  });
  process.stdout.write('\n');

  const statusCounts = testedResults.reduce<Record<string, number>>((acc, r) => {
    const s = r.renderStatus ?? 'unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const scored = testedResults.filter((r) => r.visualScore != null);
  const avgScore = scored.length
    ? scored.reduce((s, r) => s + (r.visualScore ?? 0), 0) / scored.length
    : null;
  const lowQuality = testedResults.filter(
    (r) =>
      r.renderStatus === 'success' &&
      r.visualScore != null &&
      r.visualScore < scoreThreshold
  );

  console.log(
    `  Render: success=${statusCounts['success'] || 0}  blank=${statusCounts['blank'] || 0}  error=${statusCounts['error'] || 0}`
  );
  if (avgScore != null) {
    console.log(
      `  Visual: avgScore=${avgScore.toFixed(2)}  lowQuality=${lowQuality.length}/${statusCounts['success'] || 0}  threshold=${scoreThreshold}`
    );
  }

  return (testedResults as (EvalResult & { id: string })[]).filter(
    (r) =>
      r.renderStatus === 'error' ||
      r.renderStatus === 'blank' ||
      (r.renderStatus === 'success' &&
        r.visualScore != null &&
        r.visualScore < scoreThreshold)
  );
}
