#!/usr/bin/env node

/**
 * Icon Search Script
 * Searches for icons by keywords and retrieves their SVG strings
 * 
 * Usage: node search.js '<search_query>' [topK]
 * Example: node search.js 'document'
 * Example: node search.js 'document' 10
 */

/**
 * Searches for icons matching the query
 * @param {string} query - The search query
 * @param {number} topK - Maximum number of results to return (default: 5)
 * @returns {Promise<Array>} Array of icon results with SVG content
 */
async function searchIcons(query, topK = 5) {
  const apiUrl = `https://www.weavefox.cn/api/open/v1/icon?text=${encodeURIComponent(query)}&topK=${topK}`;
  
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  const iconData = data.data || data.results || data;
  
  if (!Array.isArray(iconData)) {
    throw new Error('Invalid API response format');
  }
  
  return iconData.slice(0, topK).map(icon => ({
    name: icon.name || icon.id || 'unknown',
    keywords: icon.keywords || icon.tags || [query],
    svg: icon.svg || ''
  }));
}

/**
 * Main execution function
 */
async function main() {
  try {
    const query = process.argv[2];
    const topK = process.argv[3] ? parseInt(process.argv[3], 10) : 5;
    
    if (!query) {
      console.error(JSON.stringify({
        error: 'Missing search query',
        usage: 'node search.js \'<search_query>\' [topK]',
        example: 'node search.js \'document\' 10',
        note: 'topK defaults to 5 if not specified'
      }, null, 2));
      process.exit(1);
    }
    
    if (isNaN(topK) || topK < 1) {
      console.error(JSON.stringify({
        error: 'Invalid topK value',
        usage: 'node search.js \'<search_query>\' [topK]',
        note: 'topK must be a positive integer'
      }, null, 2));
      process.exit(1);
    }
    
    const results = await searchIcons(query, topK);
    
    console.log(JSON.stringify({
      query: query,
      topK: topK,
      count: results.length,
      results: results
    }, null, 2));
    
    if (results.length === 0) {
      console.error(`Warning: No icons found for query "${query}"`);
    }
  } catch (error) {
    console.error(JSON.stringify({
      error: error.message,
      query: process.argv[2] || null
    }, null, 2));
    process.exit(1);
  }
}

main();
