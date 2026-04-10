'use strict';

/**
 * Context7 API Client
 *
 * Fetches and formats documentation snippets from the Context7 REST API.
 * Extracted from eval-manager.js to keep the core evaluation pipeline focused.
 */

const https = require('https');
const http = require('http');

const API_BASE = 'https://context7.com/api/v2';

const LIBRARY_ID_MAP = {
  g2: '/antvis/g2',
  g6: '/antvis/g6'
};

/**
 * Resolve Context7 library ID from short key.
 * @param {string} library - 'g2' | 'g6' | full library id
 * @returns {string}
 */
function resolveLibraryId(library) {
  return LIBRARY_ID_MAP[library] || `/antvis/${library}`;
}

/**
 * Fetch documentation snippets from Context7.
 *
 * @param {string} query       - search query
 * @param {string} libraryId   - Context7 library id (e.g. '/antvis/g2')
 * @param {string} apiKey      - Context7 API key
 * @param {number} [tokens=12000]
 * @returns {Promise<object>}
 */
function fetchDocs(query, libraryId, apiKey, tokens = 12000) {
  if (!apiKey) throw new Error('Missing CONTEXT7_API_KEY');

  const url = new URL(`${API_BASE}/context`);
  url.searchParams.set('query', query);
  url.searchParams.set('libraryId', libraryId);
  url.searchParams.set('type', 'json');
  url.searchParams.set('tokens', String(tokens));

  return new Promise((resolve, reject) => {
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    const options = {
      hostname: url.hostname,
      port: url.port ? parseInt(url.port) : isHttps ? 443 : 80,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(
            new Error(`Context7 API error: ${res.statusCode} ${body.slice(0, 200)}`)
          );
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Failed to parse Context7 response: ${e.message}`));
        }
      });
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Context7 API timeout (30s)'));
    });

    req.on('error', (err) =>
      reject(new Error(`Context7 request failed: ${err.message}`))
    );
    req.end();
  });
}

/**
 * Format raw Context7 response into a markdown string suitable for prompt injection.
 *
 * @param {object} data        - raw Context7 API response
 * @param {number} [maxResults=6]
 * @returns {string}
 */
function formatDocs(data, maxResults = 6) {
  const codeSnippets = Array.isArray(data?.codeSnippets) ? data.codeSnippets : [];
  const infoSnippets = Array.isArray(data?.infoSnippets) ? data.infoSnippets : [];
  const sections = [];

  for (const s of codeSnippets.slice(0, Math.ceil(maxResults * 0.7))) {
    const title = s.pageTitle?.trim() || s.codeTitle?.trim() || 'Code Snippet';
    const desc = s.codeDescription?.trim() || '';
    const blocks = Array.isArray(s.codeList)
      ? s.codeList
          .filter((b) => typeof b?.code === 'string' && b.code.trim().length > 0)
          .map(
            (b) =>
              `\`\`\`${(b.language || s.codeLanguage || 'javascript').trim()}\n${b.code}\n\`\`\``
          )
      : [];
    if (blocks.length === 0) continue;
    sections.push(`### ${title}\n${desc ? desc + '\n\n' : ''}${blocks.join('\n\n')}`);
  }

  for (const s of infoSnippets.slice(0, Math.floor(maxResults * 0.3))) {
    const title = (s.breadcrumb || s.pageId || 'Documentation').trim();
    const content = (s.content || '').trim();
    if (!content) continue;
    sections.push(`### ${title}\n${content}`);
  }

  return sections.join('\n\n---\n\n');
}

module.exports = { fetchDocs, formatDocs, resolveLibraryId };
