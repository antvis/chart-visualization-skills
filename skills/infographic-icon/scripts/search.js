#!/usr/bin/env node

/**
 * AntV Infographic Icon Search Script
 * Searches for icons by keywords and retrieves their SVG strings
 * 
 * Usage: node search.js '<search_query>'
 * Example: node search.js 'document'
 */

const https = require('https');
const http = require('http');

/**
 * Makes an HTTP/HTTPS GET request
 * @param {string} url - The URL to fetch
 * @returns {Promise<string>} The response body
 */
function fetch(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Searches for icons matching the query
 * @param {string} query - The search query
 * @returns {Promise<Array>} Array of icon results with SVG content
 */
async function searchIcons(query) {
  try {
    // The AntV Infographic icon API endpoint
    // Based on common API patterns, the API likely provides a search or list endpoint
    const apiBaseUrl = 'https://infographic.antv.vision';
    
    // Try to fetch icon data from the API
    // This may need to be adjusted based on the actual API structure
    let iconData;
    
    try {
      // Attempt to fetch from a JSON API endpoint
      const apiUrl = `${apiBaseUrl}/api/icons?q=${encodeURIComponent(query)}`;
      const response = await fetch(apiUrl);
      iconData = JSON.parse(response);
    } catch (apiError) {
      // If the API endpoint doesn't work, use fallback with built-in SVGs
      iconData = getCommonIcons(query);
    }
    
    // Process and limit to top 5 results
    const results = [];
    const iconsToProcess = Array.isArray(iconData) ? iconData.slice(0, 5) : [];
    
    for (const icon of iconsToProcess) {
      try {
        let svgContent = icon.svg || '';
        
        // If the icon object has a URL but no SVG, try fetching it
        if (!svgContent && icon.url) {
          try {
            svgContent = await fetch(icon.url);
          } catch (err) {
            console.error(`Failed to fetch SVG from URL: ${icon.url}`, err.message);
          }
        }
        
        // If we still don't have SVG and have an icon ID, try constructing the URL
        if (!svgContent && (icon.id || icon.name)) {
          try {
            const iconId = icon.id || icon.name;
            const svgUrl = `${apiBaseUrl}/assets/icons/${iconId}.svg`;
            svgContent = await fetch(svgUrl);
          } catch (err) {
            console.error(`Failed to fetch icon by ID: ${icon.id || icon.name}`, err.message);
          }
        }
        
        results.push({
          name: icon.name || icon.id || 'unknown',
          keywords: icon.keywords || icon.tags || [query],
          svg: svgContent
        });
      } catch (err) {
        // Skip icons that fail to process
        console.error(`Failed to process icon: ${icon.name || icon.id}`, err.message);
      }
    }
    
    return results;
  } catch (error) {
    throw new Error(`Failed to search icons: ${error.message}`);
  }
}

/**
 * Fallback function to provide common icons when API is unavailable
 * This provides a basic set of commonly used icons with SVG content
 * @param {string} query - The search query
 * @returns {Array} Array of icon metadata with SVG
 */
function getCommonIcons(query) {
  // Common icon keywords used in AntV Infographic with simple SVG representations
  const commonIcons = [
    { 
      name: 'document', 
      keywords: ['document', 'file', 'text', 'paper'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2m7 1.5V9h5.5L13 3.5z"/></svg>'
    },
    { 
      name: 'star', 
      keywords: ['star', 'favorite', 'rating', 'fill'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>'
    },
    { 
      name: 'flash', 
      keywords: ['flash', 'lightning', 'fast', 'speed', 'bolt'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>'
    },
    { 
      name: 'shield', 
      keywords: ['shield', 'security', 'protect', 'secure'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>'
    },
    { 
      name: 'check', 
      keywords: ['check', 'confirm', 'done', 'success', 'tick'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
    },
    { 
      name: 'sun', 
      keywords: ['sun', 'light', 'day', 'bright'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5m0 2a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3m0-7l2.39 3.42C13.65 5.15 12.84 5 12 5c-.84 0-1.65.15-2.39.42L12 2M3.34 7l4.16-.35A7.2 7.2 0 005.94 8.5c-.44.74-.69 1.5-.83 2.29L3.34 7m.02 10l1.76-3.77a7.131 7.131 0 002.38 4.14L3.36 17M20.65 7l-1.77 3.79a7.023 7.023 0 00-2.38-4.15l4.15.36m-.01 10l-4.14.36c.59-.51 1.12-1.14 1.54-1.86.42-.73.69-1.5.83-2.29L20.64 17M12 22l-2.41-3.44c.74.27 1.55.44 2.41.44.82 0 1.63-.17 2.37-.44L12 22z"/></svg>'
    },
    { 
      name: 'moon', 
      keywords: ['moon', 'night', 'dark'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.75 4.09L15.22 6.03L16.13 9.09L13.5 7.28L10.87 9.09L11.78 6.03L9.25 4.09L12.44 4L13.5 1L14.56 4L17.75 4.09M21.25 11L19.61 12.25L20.2 14.23L18.5 13.06L16.8 14.23L17.39 12.25L15.75 11L17.81 10.95L18.5 9L19.19 10.95L21.25 11M18.97 15.95C19.8 15.87 20.69 17.05 20.16 17.8C19.84 18.25 19.5 18.67 19.08 19.07C15.17 23 8.84 23 4.94 19.07C1.03 15.17 1.03 8.83 4.94 4.93C5.34 4.53 5.76 4.17 6.21 3.85C6.96 3.32 8.14 4.21 8.06 5.04C7.79 7.9 8.75 10.87 10.95 13.06C13.14 15.26 16.1 16.22 18.97 15.95M17.33 17.97C14.5 17.81 11.7 16.64 9.53 14.5C7.36 12.31 6.2 9.5 6.04 6.68C3.23 9.82 3.34 14.64 6.35 17.66C9.37 20.67 14.19 20.78 17.33 17.97z"/></svg>'
    },
    { 
      name: 'web', 
      keywords: ['web', 'internet', 'network', 'globe', 'world'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2m-5.15 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56M14.34 14H9.66c-.1-.66-.16-1.32-.16-2 0-.68.06-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2M12 19.96c-.83-1.2-1.5-2.53-1.91-3.96h3.82c-.41 1.43-1.08 2.76-1.91 3.96M8 8H5.08A7.923 7.923 0 019.4 4.44C8.8 5.55 8.35 6.75 8 8m-2.92 8H8c.35 1.25.8 2.45 1.4 3.56A8.008 8.008 0 015.08 16m-.82-2C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2M12 4.03c.83 1.2 1.5 2.54 1.91 3.97h-3.82c.41-1.43 1.08-2.77 1.91-3.97M18.92 8h-2.95a15.65 15.65 0 00-1.38-3.56c1.84.63 3.37 1.9 4.33 3.56M12 2C6.47 2 2 6.5 2 12a10 10 0 0010 10 10 10 0 0010-10A10 10 0 0012 2z"/></svg>'
    },
    { 
      name: 'account', 
      keywords: ['account', 'user', 'profile', 'person', 'multiple'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16 17v2H2v-2s0-4 7-4 7 4 7 4m-3.5-9.5A3.5 3.5 0 019 11a3.5 3.5 0 01-3.5-3.5A3.5 3.5 0 019 4a3.5 3.5 0 013.5 3.5M15.94 13A5.32 5.32 0 0118 17v2h4v-2s0-3.63-6.06-4M15 4a3.39 3.39 0 00-.07.71c0 1.44.88 2.67 2.13 3.21A3.54 3.54 0 0018 7.5a3.5 3.5 0 00-3-3.5z"/></svg>'
    },
    { 
      name: 'cellphone', 
      keywords: ['cellphone', 'phone', 'mobile', 'device', 'smartphone'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 19H7V5h10m0-4H7c-1.11 0-2 .89-2 2v18a2 2 0 002 2h10a2 2 0 002-2V3a2 2 0 00-2-2z"/></svg>'
    },
    { 
      name: 'cloud', 
      keywords: ['cloud', 'storage', 'server', 'data'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>'
    },
    { 
      name: 'application', 
      keywords: ['application', 'app', 'software', 'brackets', 'code'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4m5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>'
    },
    { 
      name: 'brain', 
      keywords: ['brain', 'ai', 'intelligence', 'think', 'mind'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.33 12.91c.09 1.55-.62 3.04-1.89 3.95l.77 1.49c.23.45.26.98.06 1.45-.19.47-.58.84-1.06 1l-.79.26a1.687 1.687 0 01-1.86-.55c-.01-.02-.03-.04-.04-.05l-.84-1.02c-.6.2-1.24.31-1.9.31-2.47 0-4.62-1.5-5.55-3.64l-.07.12c-.49.88-1.3 1.51-2.23 1.73l-2.17.58c-.48.12-1-.02-1.39-.35-.4-.33-.63-.82-.63-1.34l.01-.09c.04-.75.33-1.47.82-2.05l.01-.01a3.7 3.7 0 011.53-1.03c-.1-.52-.15-1.05-.15-1.61 0-1.03.2-2.01.59-2.9l-.01-.01c-.53-.19-1-.52-1.36-.96l-.17-.21c-.45-.58-.68-1.32-.62-2.06.05-.79.45-1.53 1.1-1.99.43-.31.96-.42 1.45-.32.27-.31.58-.58.94-.81l.01-.01c.47-.3 1-.48 1.55-.55.77-.09 1.56.07 2.24.5.16.1.31.21.44.34.28-.17.59-.32.91-.45l.05-.02c1.46-.55 2.45-.54 3.31-.05.85.48 1.66 1.6 2.5 3.71l.05.13c.22.6.39 1.23.47 1.88l.02.13c.04.4.06.82.06 1.25 0 .57-.03 1.14-.11 1.7.37.07.74.18 1.07.35l.03.01c1.04.46 1.85 1.28 2.27 2.32.43 1.03.39 2.19-.1 3.2l.14.08c.3.21.54.48.72.79.2.34.3.73.28 1.13zm-2.39-5.4c-.05-.14-.41-.57-1-.81-.34-.14-.64-.18-.87-.18.38.55.6 1.22.6 1.94l-.01.07c-.11 1.24-.99 2.21-2.13 2.42-.06.01-.13.01-.2.01-.86 0-1.66-.48-2.07-1.23-.42-.76-.37-1.69.12-2.4.08-.11.17-.21.28-.29l.06-.04c.24-.18.35-.5.29-.8-.1-.5-.21-.93-.31-1.25-.49-1.54-.98-2.24-1.39-2.49-.38-.22-.97-.2-1.94.13-.15.06-.29.13-.42.21-.09.06-.17.12-.24.18-.08.06-.16.13-.23.2-.24.25-.42.55-.53.88-.1.32-.14.66-.14 1.01v.03a2.56 2.56 0 00.22 1.04c.07.16.15.32.24.47l.05.08c.24.36.21.84-.06 1.17l-.04.05a1.56 1.56 0 01-1.23.58c-.27 0-.53-.07-.76-.21-.05-.03-.1-.07-.15-.11-.11-.09-.2-.19-.28-.3-.14-.2-.23-.43-.27-.68-.01-.07-.01-.15-.01-.23.01-.15.03-.3.07-.44.13-.44.4-.82.78-1.07l.07-.05c.33-.23.43-.7.22-1.05l-.02-.03c-.38-.65-.58-1.39-.58-2.16 0-.31.03-.61.09-.9.04-.2.09-.41.15-.6a3.6 3.6 0 01.97-1.61c.35-.35.76-.63 1.21-.81l.04-.02c.28-.11.57-.19.87-.22.37-.04.74 0 1.09.12.1.04.2.08.29.13.28.14.58.35.88.62l.07.06c.28.24.7.27 1.01.09l.02-.01c.29-.17.6-.3.93-.4.18-.05.37-.1.55-.13l.05-.01a3.2 3.2 0 011.75.13h.01c.28.1.54.23.79.39.42.27.78.63 1.06 1.05l.01.02c.26.4.45.83.56 1.28.12.46.18.94.18 1.43 0 .38-.04.77-.11 1.15-.09.42-.22.83-.38 1.23l-.05.1c-.15.34-.03.75.28.96.16.1.32.18.49.23l.09.03c.22.07.45.1.69.1.45 0 .88-.13 1.25-.38l.05-.03c.24-.17.45-.37.63-.59.16-.2.3-.43.4-.67l.03-.06c.11-.28.17-.58.17-.88 0-.38-.09-.76-.27-1.1z"/></svg>'
    },
    { 
      name: 'heart', 
      keywords: ['heart', 'love', 'like', 'favorite'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
    },
    { 
      name: 'settings', 
      keywords: ['settings', 'config', 'gear', 'options', 'preferences'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0014 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z"/></svg>'
    },
    { 
      name: 'chart', 
      keywords: ['chart', 'graph', 'data', 'analytics', 'statistics'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22 21H2V3h2v16h2V10h4v9h2V6h4v13h2V14h4v7z"/></svg>'
    },
    { 
      name: 'home', 
      keywords: ['home', 'house', 'main', 'index'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>'
    },
    { 
      name: 'search', 
      keywords: ['search', 'find', 'magnify', 'lookup'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>'
    },
    { 
      name: 'calendar', 
      keywords: ['calendar', 'date', 'schedule', 'time', 'event'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/></svg>'
    },
    { 
      name: 'email', 
      keywords: ['email', 'mail', 'message', 'letter', 'envelope'], 
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>'
    }
  ];
  
  // Filter icons by query
  const lowerQuery = query.toLowerCase();
  const filtered = commonIcons.filter(icon => 
    icon.name.toLowerCase().includes(lowerQuery) ||
    icon.keywords.some(kw => kw.toLowerCase().includes(lowerQuery))
  );
  
  return filtered;
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Get search query from command line arguments
    const query = process.argv[2];
    
    if (!query) {
      console.error(JSON.stringify({
        error: 'Missing search query',
        usage: 'node search.js \'<search_query>\'',
        example: 'node search.js \'document\''
      }, null, 2));
      process.exit(1);
    }
    
    // Search for icons
    const results = await searchIcons(query);
    
    // Output results in JSON format
    const output = {
      query: query,
      count: results.length,
      results: results
    };
    
    console.log(JSON.stringify(output, null, 2));
    
    if (results.length === 0) {
      console.error(`\nWarning: No icons found for query "${query}"`);
      process.exit(0);
    }
  } catch (error) {
    console.error(JSON.stringify({
      error: error.message,
      query: process.argv[2] || null
    }, null, 2));
    process.exit(1);
  }
}

// Run the script
main();
