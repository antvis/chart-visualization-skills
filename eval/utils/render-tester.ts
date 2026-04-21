/**
 * Render Tester
 *
 * Uses a headless Chromium browser (Playwright) to execute generated AntV code
 * and detect rendering errors / blank screens.
 */

import { chromium, type Browser, type Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { scoreScreenshot } from './visual-scorer.js';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const G2_CDN = 'https://unpkg.com/@antv/g2@5.4.8/dist/g2.min.js';
const G6_CDN = 'https://unpkg.com/@antv/g6@5.1.0/dist/g6.min.js';

const ROOT_DIR = path.resolve(__dirname, '../..');

function findLocalLib(pkg: string, distFile: string): string | null {
  const p = path.join(ROOT_DIR, 'node_modules', pkg, 'dist', distFile);
  return fs.existsSync(p) ? p : null;
}

const LIB_LOAD_TIMEOUT_MS = 10000;
const RENDER_TIMEOUT_MS = 5000;
const BLANK_WAIT_MS = 600;
const CASE_TIMEOUT_MS = 30000;
const CDN_RETRIES = 3;

let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!_browser) _browser = await chromium.launch({ headless: true });
  return _browser;
}

const SHELL_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <div id="container" style="width:800px;height:500px;"></div>
</body>
</html>`;

const DETECT_BLANK_FN = `
function detectBlankScreen(container) {
  if (container.children.length === 0) return true;
  const svgs = container.querySelectorAll('svg');
  if (svgs.length > 0) {
    const shapes = container.querySelectorAll('svg path,svg rect,svg circle,svg line,svg polygon,svg polyline,svg ellipse,svg text');
    return shapes.length === 0;
  }
  const canvases = container.querySelectorAll('canvas');
  if (canvases.length > 0) {
    for (const canvas of canvases) {
      if (canvas.width === 0 || canvas.height === 0) continue;
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        const { width: w, height: h } = canvas;
        const points = [[w*0.1,h*0.1],[w*0.5,h*0.1],[w*0.9,h*0.1],[w*0.1,h*0.5],[w*0.5,h*0.5],[w*0.9,h*0.5],[w*0.1,h*0.9],[w*0.5,h*0.9],[w*0.9,h*0.9],[w*0.3,h*0.3],[w*0.7,h*0.3],[w*0.3,h*0.7],[w*0.7,h*0.7]];
        for (const [x, y] of points) {
          if (ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data[3] > 0) return false;
        }
        const stride = Math.max(1, Math.floor(w * h / 40000));
        const img = ctx.getImageData(0, 0, w, h).data;
        for (let i = 0; i < img.length; i += stride * 4) {
          if (img[i + 3] > 0) return false;
        }
      } catch { return false; }
    }
    return true;
  }
  return container.innerHTML.trim().length < 10;
}
`;

function extractImportNames(src: string, pkg: string): string[] {
  const names: string[] = [];
  const escaped = pkg.replace(/\//g, '\\/').replace(/\./g, '\\.');
  const re = new RegExp(`import\\s+(?:type\\s+)?\\{([^}]*)\\}\\s*from\\s*['"]${escaped}['"];?`, 'gs');
  for (const m of src.matchAll(re)) {
    m[1].split(',').forEach((token) => {
      const cleaned = token.trim().replace(/^type\s+/, '');
      const name = cleaned.split(/\s+as\s+/).pop()?.trim();
      if (name) names.push(name);
    });
  }
  return names;
}

function transformCode(code: string): string {
  return code
    .replace(/import\s*\{[^}]*\}\s*from\s*['"]@antv\/g2['"];?/g, '')
    .replace(/import\s*\{[^}]*\}\s*from\s*['"]@antv\/g6['"];?/g, '')
    .replace(/import\s+\w+\s+from\s*['"]@antv\/g2['"];?/g, '')
    .replace(/import\s+\w+\s+from\s*['"]@antv\/g6['"];?/g, '')
    .replace(/import\s*\*\s*as\s+\w+\s*from\s*['"]@antv\/g2['"];?/g, '')
    .replace(/import\s*\*\s*as\s+\w+\s*from\s*['"]@antv\/g6['"];?/g, '')
    .replace(/container:\s*['"]chart-container['"]/g, 'container: container')
    .replace(/container:\s*['"]container['"]/g, 'container: container');
}

export interface RenderResult {
  status: 'success' | 'blank' | 'error';
  error?: string;
  visualScore?: number;
  visualDimensions?: Record<string, number>;
  visualReasoning?: string;
}

export async function testRender(code: string, { query = '', skipScore = false } = {}): Promise<RenderResult> {
  const browser = await getBrowser();
  const page: Page = await browser.newPage();

  try {
    const isG6 = code.includes('@antv/g6') || /new\s+Graph\s*[({]/.test(code);
    const cdnUrl = isG6 ? G6_CDN : G2_CDN;
    const localLib = isG6 ? findLocalLib('@antv/g6', 'g6.min.js') : findLocalLib('@antv/g2', 'g2.min.js');

    await page.setContent(SHELL_HTML, { waitUntil: 'domcontentloaded', timeout: 5000 });

    let libLoaded = false;
    let libErr: Error | undefined;
    if (localLib) {
      await page.addScriptTag({ path: localLib });
      libLoaded = true;
    } else {
      for (let attempt = 1; attempt <= CDN_RETRIES; attempt++) {
        try {
          await page.addScriptTag({ url: cdnUrl });
          libLoaded = true;
          break;
        } catch (err) {
          libErr = err as Error;
          if (attempt < CDN_RETRIES) await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }

    if (!libLoaded) {
      return { status: 'error', error: `Library load failed after ${CDN_RETRIES} attempts: ${libErr?.message}` };
    }

    const g6Names = extractImportNames(code, '@antv/g6');
    const g2Names = extractImportNames(code, '@antv/g2');
    const libSetup = isG6
      ? `const { ${[...new Set(['Graph', ...g6Names])].join(', ')} } = window.G6;`
      : `const { ${[...new Set(['Chart', ...g2Names])].join(', ')} } = window.G2;`;
    const userCode = libSetup + '\n' + transformCode(code);

    const result = await page.evaluate(
      async ({ userCode, detectBlankFn, renderTimeoutMs, blankWaitMs }: { userCode: string; detectBlankFn: string; renderTimeoutMs: number; blankWaitMs: number }) => {
        try {
          const container = document.getElementById('container')!;
          const detectBlankScreen = new Function('container', detectBlankFn + '\nreturn detectBlankScreen(container);');
          const fn = new Function('container', userCode);
          const ret = fn(container);
          if (ret && typeof (ret as Promise<void>).then === 'function') {
            await Promise.race([ret, new Promise((_, reject) => setTimeout(() => reject(new Error(`Render timeout (${renderTimeoutMs}ms)`)), renderTimeoutMs))]);
          }
          await new Promise((r) => setTimeout(r, blankWaitMs));
          return { status: detectBlankScreen(container) ? 'blank' : 'success' } as { status: 'success' | 'blank' | 'error'; error?: string };
        } catch (err: unknown) {
          return { status: 'error' as const, error: (err as Error).message };
        }
      },
      { userCode, detectBlankFn: DETECT_BLANK_FN, renderTimeoutMs: RENDER_TIMEOUT_MS, blankWaitMs: BLANK_WAIT_MS }
    );

    if (result.status === 'success' && !skipScore) {
      try {
        const container = await page.$('#container');
        const screenshotBuffer = container
          ? await container.screenshot({ type: 'png' })
          : await page.screenshot({ type: 'png' });
        const scoreResult = await scoreScreenshot(screenshotBuffer, query);
        if (!scoreResult.skipped && scoreResult.visualScore != null) {
          return { ...result, visualScore: scoreResult.visualScore, visualDimensions: scoreResult.dimensions ?? undefined, visualReasoning: scoreResult.reasoning ?? undefined };
        }
      } catch (err) {
        logger.debug({ err: (err as Error).message }, 'Visual scoring failed');
      }
    }

    return result;
  } catch (err) {
    return { status: 'error', error: (err as Error).message };
  } finally {
    await Promise.race([page.close(), new Promise((r) => setTimeout(r, 5000))]);
  }
}

export interface EvalResult {
  error?: string;
  generatedCode?: string;
  query?: string;
  renderStatus?: string;
  renderError?: string;
  visualScore?: number;
  visualDimensions?: Record<string, number>;
  visualReasoning?: string;
}

export async function testAllResults(
  results: EvalResult[],
  { concurrency = 5, skipScore = false, onProgress }: { concurrency?: number; skipScore?: boolean; onProgress?: (info: { done: number; total: number; result: EvalResult }) => void } = {}
): Promise<EvalResult[]> {
  const output: EvalResult[] = new Array(results.length);
  let done = 0;
  let index = 0;

  async function worker() {
    while (index < results.length) {
      const i = index++;
      const result = results[i];
      let tested: EvalResult;

      if (result.error || !result.generatedCode) {
        tested = { ...result, renderStatus: 'error', renderError: result.error ?? 'no code' };
      } else {
        try {
          const caseTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Case timeout (${CASE_TIMEOUT_MS}ms)`)), CASE_TIMEOUT_MS)
          );
          const { status, error, visualScore, visualDimensions, visualReasoning } = await Promise.race([
            testRender(result.generatedCode, { query: result.query ?? '', skipScore }),
            caseTimeout
          ]);
          tested = { ...result, renderStatus: status, renderError: error, ...(visualScore != null ? { visualScore, visualDimensions, visualReasoning } : {}) };
        } catch (err) {
          tested = { ...result, renderStatus: 'error', renderError: (err as Error).message };
        }
      }

      output[i] = tested;
      done++;
      onProgress?.({ done, total: results.length, result: tested });
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, results.length) }, worker));
  return output;
}

export async function closeBrowser(): Promise<void> {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}
