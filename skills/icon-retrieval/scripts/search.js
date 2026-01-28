#!/usr/bin/env node

const https = require('https');
const http = require('http');

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function searchIcons(query, topK = 5) {
  const params = new URLSearchParams({ text: query, topK: topK.toString() });
  const apiUrl = `https://www.weavefox.cn/api/open/v1/icon?${params}`;
  
  const responseText = await fetchUrl(apiUrl);
  const data = JSON.parse(responseText);
  
  if (!data.status || !data.data?.success) {
    throw new Error(data.message || 'API request failed');
  }
  
  const iconUrls = data.data.data;
  const results = [];
  
  for (const url of iconUrls) {
    try {
      const svgContent = await fetchUrl(url);
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

module.exports = { searchIcons };
