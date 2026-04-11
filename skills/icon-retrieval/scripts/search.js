#!/usr/bin/env node

const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

async function curlGet(url) {
  const marker = '__CURL_HTTP_STATUS__:';
  const { stdout, stderr } = await execFileAsync('curl', [
    '-sS',
    '-L',
    '--max-time',
    '20',
    '-w',
    `\n${marker}%{http_code}`,
    url,
  ]);

  if (stderr) {
    throw new Error(stderr.trim());
  }

  const markerIndex = stdout.lastIndexOf(marker);
  if (markerIndex === -1) {
    throw new Error('Invalid curl response format');
  }

  const body = stdout.slice(0, markerIndex).trimEnd();
  const statusCode = Number(stdout.slice(markerIndex + marker.length).trim());

  if (!Number.isInteger(statusCode)) {
    throw new Error('Invalid HTTP status code from curl');
  }

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`HTTP ${statusCode}: ${body}`);
  }

  return body;
}

async function searchIcons(query, topK = 5) {
  const params = new URLSearchParams({ text: query, topK: topK.toString() });
  const apiUrl = `https://www.weavefox.cn/api/open/v1/icon?${params}`;

  const responseText = await curlGet(apiUrl);
  const data = JSON.parse(responseText);
  
  if (!data.status || !data.data?.success) {
    throw new Error(data.message || 'API request failed');
  }
  
  const iconUrls = data.data.data;
  const results = [];
  
  for (const url of iconUrls) {
    try {
      const svgContent = await curlGet(url);
      results.push({ url, svg: svgContent });
    } catch (e) {
      console.error(`Warning: Failed to fetch SVG from ${url}: ${e.message}`);
    }
  }
  
  return results;
}

async function main() {
  if (process.argv.length < 3) {
    const error = {
      error: 'Missing search query',
      usage: 'node search.js \'<search_query>\' [topK]',
      example: 'node search.js \'document\' 10',
      note: 'topK defaults to 5 if not specified',
    };
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }
  
  const query = process.argv[2];
  const topK = process.argv[3] ? parseInt(process.argv[3], 10) : 5;
  
  if (isNaN(topK) || topK < 1) {
    const error = {
      error: 'Invalid topK value',
      usage: 'node search.js \'<search_query>\' [topK]',
      note: 'topK must be a positive integer',
    };
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }
  
  try {
    const results = await searchIcons(query, topK);
    const output = {
      query,
      topK,
      count: results.length,
      results,
    };
    console.log(JSON.stringify(output, null, 2));
    
    if (results.length === 0) {
      console.error(`Warning: No icons found for query "${query}"`);
    }
  } catch (e) {
    const error = { error: e.message, query };
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

// Export functions for testing
module.exports = { searchIcons };
