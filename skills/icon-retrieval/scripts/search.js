#!/usr/bin/env node

export async function searchIcons(query, topK = 5) {
  const params = new URLSearchParams({ text: query, topK: topK.toString() });
  const apiUrl = `https://www.weavefox.cn/api/open/v1/icon?${params}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const data = await response.json();

  if (!data.status || !data.data?.success) {
    throw new Error(data.message || 'API request failed');
  }

  const iconUrls = data.data.data;
  const results = [];

  for (const url of iconUrls) {
    try {
      const svgResponse = await fetch(url);
      if (!svgResponse.ok) {
        throw new Error(`HTTP ${svgResponse.status}`);
      }
      const svgContent = await svgResponse.text();
      results.push({ url, svg: svgContent });
    } catch (e) {
      console.error(`Warning: Failed to fetch SVG from ${url}: ${e.message}`);
    }
  }

  return results;
}
