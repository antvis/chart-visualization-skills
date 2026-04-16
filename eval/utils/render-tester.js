/**
 * Render Tester
 *
 * Uses a headless Chromium browser (Playwright) to actually execute
 * generated AntV code and detect rendering errors / blank screens.
 *
 * Strategy:
 *   1. setContent a minimal HTML shell (no external scripts → never hangs)
 *   2. Load lib via page.addScriptTag (local node_modules first, CDN fallback)
 *   3. Execute code via page.evaluate with new Function('container', code)
 *   4. Detect blank screen: SVG shape count / canvas pixel sampling
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { scoreScreenshot } = require('./visual-scorer');
const logger = require('./logger');

const G2_CDN = 'https://unpkg.com/@antv/g2@5.4.8/dist/g2.min.js';
const G6_CDN = 'https://unpkg.com/@antv/g6@5.1.0/dist/g6.min.js';

const ROOT_DIR = path.resolve(__dirname, '../..');
function findLocalLib(pkg, distFile) {
  const p = path.join(ROOT_DIR, 'node_modules', pkg, 'dist', distFile);
  return fs.existsSync(p) ? p : null;
}

const LIB_LOAD_TIMEOUT_MS = 10000; // max wait for addScriptTag (CDN)
const RENDER_TIMEOUT_MS = 5000; // max wait for render() promise
const BLANK_WAIT_MS = 600; // wait after render for paint
const CASE_TIMEOUT_MS = 30000; // hard per-case wall-clock limit (covers lib load + render + score)

let _browser = null;

async function getBrowser() {
  if (!_browser) {
    _browser = await chromium.launch({ headless: true });
  }
  return _browser;
}

// ── Minimal HTML shell (no external scripts, never hangs on setContent) ───────

const SHELL_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <div id="container" style="width:800px;height:500px;"></div>
</body>
</html>`;

// ── Blank screen detection (injected via evaluate) ────────────────────────────

const DETECT_BLANK_FN = `
function detectBlankScreen(container) {
  if (container.children.length === 0) return true;

  const svgs = container.querySelectorAll('svg');
  if (svgs.length > 0) {
    const shapes = container.querySelectorAll(
      'svg path, svg rect, svg circle, svg line, svg polygon, svg polyline, svg ellipse, svg text'
    );
    return shapes.length === 0;
  }

  const canvases = container.querySelectorAll('canvas');
  if (canvases.length > 0) {
    for (const canvas of canvases) {
      if (canvas.width === 0 || canvas.height === 0) continue;
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        const w = canvas.width, h = canvas.height;
        // Phase 1: 13-point spread sample
        const points = [
          [w*0.1,h*0.1],[w*0.5,h*0.1],[w*0.9,h*0.1],
          [w*0.1,h*0.5],[w*0.5,h*0.5],[w*0.9,h*0.5],
          [w*0.1,h*0.9],[w*0.5,h*0.9],[w*0.9,h*0.9],
          [w*0.3,h*0.3],[w*0.7,h*0.3],[w*0.3,h*0.7],[w*0.7,h*0.7]
        ];
        for (const [x, y] of points) {
          const p = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
          if (p[3] > 0) return false;
        }
        // Phase 2: thorough sweep — ~40 000 samples regardless of canvas size
        const stride = Math.max(1, Math.floor(w * h / 40000));
        const img = ctx.getImageData(0, 0, w, h).data;
        for (let i = 0; i < img.length; i += stride * 4) {
          if (img[i + 3] > 0) return false;
        }
      } catch (e) {
        return false;
      }
    }
    return true;
  }

  return container.innerHTML.trim().length < 10;
}
`;

// ── Code transform (strip ESM imports, fix container refs) ────────────────────

/**
 * Extract all named export identifiers from import statements for a given package.
 * Handles multi-line braces, `as` aliases, and `type X` prefixes.
 * @param {string} src
 * @param {string} pkg  e.g. '@antv/g6'
 * @returns {string[]}
 */
function extractImportNames(src, pkg) {
  const names = [];
  const escaped = pkg.replace(/\//g, '\\/').replace(/\./g, '\\.');
  // `gs` flags: g = all matches, s = dotAll (. matches newlines for multi-line braces)
  const re = new RegExp(
    `import\\s+(?:type\\s+)?\\{([^}]*)\\}\\s*from\\s*['"]${escaped}['"];?`,
    'gs'
  );
  for (const m of src.matchAll(re)) {
    m[1].split(',').forEach((token) => {
      const cleaned = token.trim().replace(/^type\s+/, '');
      const name = cleaned
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) names.push(name);
    });
  }
  return names;
}

function transformCode(code) {
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

/**
 * Test a single generated code string.
 *
 * @param {string} code
 * @param {object} [opts]
 * @param {string} [opts.query]        - original query, passed to visual scorer
 * @param {boolean} [opts.skipScore]   - skip VL scoring even on success
 * @returns {{ status: 'success'|'blank'|'error', error?: string, visualScore?: number, visualDimensions?: object }}
 */
async function testRender(code, { query = '', skipScore = false } = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const isG6 = code.includes('@antv/g6') || /new\s+Graph\s*[({]/.test(code);
    const cdnUrl = isG6 ? G6_CDN : G2_CDN;
    const localLib = isG6
      ? findLocalLib('@antv/g6', 'g6.min.js')
      : findLocalLib('@antv/g2', 'g2.min.js');

    // Step 1: Set a minimal shell — no external scripts, never hangs
    await page.setContent(SHELL_HTML, {
      waitUntil: 'domcontentloaded',
      timeout: 5000
    });

    // Step 2: Load the library (local first, then CDN with retries)
    const CDN_RETRIES = 3;
    let libLoaded = false;
    let libErr;
    if (localLib) {
      await page.addScriptTag({ path: localLib });
      libLoaded = true;
    } else {
      for (let attempt = 1; attempt <= CDN_RETRIES; attempt++) {
        try {
          await page.addScriptTag({
            url: cdnUrl,
            timeout: LIB_LOAD_TIMEOUT_MS
          });
          libLoaded = true;
          break;
        } catch (err) {
          libErr = err;
          if (attempt < CDN_RETRIES) {
            await new Promise((r) => setTimeout(r, 1000 * attempt));
          }
        }
      }
    }
    if (!libLoaded) {
      return {
        status: 'error',
        error: `Library load failed after ${CDN_RETRIES} attempts: ${libErr.message}`
      };
    }
    // Step 3: Execute the generated code and detect blank screen
    const g6Names = extractImportNames(code, '@antv/g6');
    const g2Names = extractImportNames(code, '@antv/g2');
    const g6Destructure = [...new Set(['Graph', ...g6Names])].join(', ');
    const g2Destructure = [...new Set(['Chart', ...g2Names])].join(', ');
    const libSetup = isG6
      ? `const { ${g6Destructure} } = window.G6;`
      : `const { ${g2Destructure} } = window.G2;`;
    const userCode = libSetup + '\n' + transformCode(code);

    const result = await page.evaluate(
      async ({ userCode, detectBlankFn, renderTimeoutMs, blankWaitMs }) => {
        try {
          const container = document.getElementById('container');
          // eslint-disable-next-line no-new-func
          const detectBlankScreen = new Function(
            'container',
            detectBlankFn + '\nreturn detectBlankScreen(container);'
          );
          const fn = new Function('container', userCode);
          let ret = fn(container);
          if (ret && typeof ret.then === 'function') {
            await Promise.race([
              ret,
              new Promise((_, reject) =>
                setTimeout(
                  () =>
                    reject(new Error(`Render timeout (${renderTimeoutMs}ms)`)),
                  renderTimeoutMs
                )
              )
            ]);
          }
          await new Promise((r) => setTimeout(r, blankWaitMs));
          return { status: detectBlankScreen(container) ? 'blank' : 'success' };
        } catch (err) {
          return { status: 'error', error: err.message };
        }
      },
      {
        userCode,
        detectBlankFn: DETECT_BLANK_FN,
        renderTimeoutMs: RENDER_TIMEOUT_MS,
        blankWaitMs: BLANK_WAIT_MS
      }
    );

    // ── Step 4: Visual quality scoring (success only) ─────────────────────────
    if (result.status === 'success' && !skipScore) {
      try {
        const container = await page.$('#container');
        const screenshotBuffer = container
          ? await container.screenshot({ type: 'png' })
          : await page.screenshot({ type: 'png' });
        const scoreResult = await scoreScreenshot(screenshotBuffer, query);
        if (!scoreResult.skipped) {
          result.visualScore = scoreResult.visualScore;
          result.visualDimensions = scoreResult.dimensions;
          result.visualReasoning = scoreResult.reasoning;
        }
      } catch (err) {
        // Screenshot/score failure must not affect the render status
        logger.debug({ err: err.message }, 'Visual scoring failed');
      }
    }

    return result;
  } catch (err) {
    return { status: 'error', error: err.message };
  } finally {
    await Promise.race([
      page.close(),
      new Promise((r) => setTimeout(r, 5000)) // don't hang if close itself stalls
    ]);
  }
}

/**
 * Test all results concurrently.
 *
 * Every render test is isolated — one failure never aborts the rest.
 *
 * @param {Array}    results     - Array of eval result objects
 * @param {object}   [opts]
 * @param {number}   [opts.concurrency=5]   - Max parallel render tests
 * @param {boolean}  [opts.skipScore=false] - Skip visual quality scoring
 * @param {Function} [opts.onProgress]      - Called after each test: ({ done, total, result })
 * @returns {Array} same array with `renderStatus`/`renderError`/`visualScore` added to each
 */
async function testAllResults(
  results,
  { concurrency = 5, skipScore = false, onProgress } = {}
) {
  const output = new Array(results.length);
  let done = 0;
  let index = 0;

  async function worker() {
    while (index < results.length) {
      const i = index++;
      const result = results[i];
      let tested;

      if (result.error || !result.generatedCode) {
        tested = {
          ...result,
          renderStatus: 'error',
          renderError: result.error || 'no code'
        };
      } else {
        try {
          const caseTimeout = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(`Case timeout (${CASE_TIMEOUT_MS}ms)`)),
              CASE_TIMEOUT_MS
            )
          );
          const {
            status,
            error,
            visualScore,
            visualDimensions,
            visualReasoning
          } = await Promise.race([
            testRender(result.generatedCode, {
              query: result.query || '',
              skipScore
            }),
            caseTimeout
          ]);
          tested = {
            ...result,
            renderStatus: status,
            renderError: error,
            ...(visualScore != null
              ? { visualScore, visualDimensions, visualReasoning }
              : {})
          };
        } catch (err) {
          tested = {
            ...result,
            renderStatus: 'error',
            renderError: err.message
          };
        }
      }

      output[i] = tested;
      done++;
      if (onProgress)
        onProgress({ done, total: results.length, result: tested });
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, results.length) }, worker)
  );
  return output;
}

async function closeBrowser() {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}

module.exports = { testRender, testAllResults, closeBrowser };
