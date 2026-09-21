// Render generated code in a headless browser, take a screenshot, and detect
// blank/error renders. Mirrors G2Plot's judge: esbuild-bundle the code with
// the AntV imports shimmed to CDN globals, run it in a page, screenshot.
//
// Blank detection analyzes the screenshot PNG pixels (works for both canvas
// and SVG renders): if the share of non-white pixels is below a threshold,
// the chart barely rendered.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { build } from 'esbuild';
import { PNG } from 'pngjs';
import { RESULTS_DIR } from './const.mjs';

const SCREENSHOTS_DIR = path.join(RESULTS_DIR, 'screenshots');

const LIBS = {
  g2: { cdn: 'https://unpkg.com/@antv/g2@5.4.8/dist/g2.min.js', global: 'G2', pkg: '@antv/g2' },
  g6: { cdn: 'https://unpkg.com/@antv/g6@5.1.0/dist/g6.min.js', global: 'G6', pkg: '@antv/g6' },
  x6: { cdn: 'https://cdn.jsdelivr.net/npm/@antv/x6@3.1.7/dist/x6.min.js', global: 'X6', pkg: '@antv/x6' },
};

// < 0.3% non-white pixels => blank. Sparse charts (scatter points, thin lines)
// legitimately render few non-white pixels (~0.8%), so the threshold must sit
// well below that to avoid false positives while still catching truly blank
// renders (0%).
const NON_WHITE_THRESHOLD = 0.003;

// Let the chart finish its enter animation before screenshotting — heatmaps
// and many marks fade/grow in over ~1s; shooting too early sees a blank frame.
const RENDER_SETTLE_MS = 1200;

// Shim every AntV import to its browser global loaded from CDN.
const antvShimPlugin = {
  name: 'antv-shim',
  setup(b) {
    for (const { global, pkg } of Object.values(LIBS)) {
      const ns = `shim-${global}`;
      b.onResolve({ filter: new RegExp(`^${pkg.replace('/', '\\/')}$`) }, () => ({ path: pkg, namespace: ns }));
      b.onLoad({ filter: /.*/, namespace: ns }, () => ({
        contents: `module.exports = window.${global};`,
        loader: 'js',
      }));
    }
  },
};

async function transpile(code) {
  const result = await build({
    stdin: { contents: code, loader: 'ts', resolveDir: process.cwd() },
    bundle: true,
    format: 'iife',
    target: 'es2020',
    write: false,
    plugins: [antvShimPlugin],
    logLevel: 'silent',
  });
  return result.outputFiles[0].text;
}

async function buildHtml(code) {
  const js = await transpile(code);
  const cdnTags = Object.values(LIBS)
    .map(({ cdn }) => `<script src="${cdn}"></script>`)
    .join('\n');
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">${cdnTags}</head>
<body style="margin:0;background:#fff;">
<div id="container" style="width:800px;height:500px;"></div>
<script>
window.__errors = [];
window.addEventListener('error', (e) => window.__errors.push(e.message));
window.addEventListener('unhandledrejection', (e) => window.__errors.push(String(e.reason)));
const container = document.getElementById('container');
try {
  ${js}
} catch (err) {
  window.__errors.push(String(err && err.stack || err));
}
</script>
</body>
</html>`;
}

// Analyze the screenshot PNG: returns true when the share of non-white,
// non-transparent pixels is below the threshold (i.e. blank render).
function isBlankImage(buffer) {
  let png;
  try {
    png = PNG.sync.read(buffer);
  } catch {
    return true; // cannot decode -> treat as blank
  }
  const { data, width, height } = png;
  if (width === 0 || height === 0) return true;

  const total = data.length / 4;
  const stride = Math.max(1, Math.floor(total / 5000)); // sample to keep it cheap
  let sampled = 0;
  let nonWhite = 0;
  for (let i = 0; i < total; i += stride) {
    const o = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const a = data[o + 3];
    sampled += 1;
    // Count pixels that are neither white-ish nor (near) transparent.
    if (a > 10 && (r < 245 || g < 245 || b < 245)) nonWhite += 1;
  }
  return sampled === 0 || nonWhite / sampled < NON_WHITE_THRESHOLD;
}

let _browser = null;
async function getBrowser() {
  if (!_browser) _browser = await puppeteer.launch({ headless: 'new' });
  return _browser;
}

export async function closeBrowser() {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}

/**
 * Render one case. Returns { status, error?, screenshot? }.
 * status: 'success' | 'blank' | 'error'
 */
export async function renderCase(id, code) {
  if (!code) return { status: 'error', error: 'empty code' };

  const browser = await getBrowser();
  const page = await browser.newPage();
  const screenshot = path.join(SCREENSHOTS_DIR, `${id}.png`);
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    await page.setViewport({ width: 820, height: 520 });
    await page.setContent(await buildHtml(code), { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for rendered content, then let the enter animation settle.
    await page
      .waitForSelector('#container canvas, #container svg', { timeout: 10000 })
      .catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, RENDER_SETTLE_MS));

    const errors = await page.evaluate(() => window.__errors);
    const buffer = await page.screenshot({ path: screenshot });

    if (errors && errors.length > 0) {
      return { status: 'error', error: errors.join('; ').slice(0, 500), screenshot: `screenshots/${id}.png` };
    }
    if (isBlankImage(buffer)) {
      return { status: 'blank', error: 'blank render (white screen)', screenshot: `screenshots/${id}.png` };
    }
    return { status: 'success', screenshot: `screenshots/${id}.png` };
  } catch (err) {
    return { status: 'error', error: String(err.message || err).slice(0, 500) };
  } finally {
    await page.close().catch(() => {});
  }
}
