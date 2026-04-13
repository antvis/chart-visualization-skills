#!/usr/bin/env node

// Chart type mapping
export const CHART_TYPE_MAP = {
  generate_area_chart: 'area',
  generate_bar_chart: 'bar',
  generate_boxplot_chart: 'boxplot',
  generate_column_chart: 'column',
  generate_district_map: 'district-map',
  generate_dual_axes_chart: 'dual-axes',
  generate_fishbone_diagram: 'fishbone-diagram',
  generate_flow_diagram: 'flow-diagram',
  generate_funnel_chart: 'funnel',
  generate_histogram_chart: 'histogram',
  generate_line_chart: 'line',
  generate_liquid_chart: 'liquid',
  generate_mind_map: 'mind-map',
  generate_network_graph: 'network-graph',
  generate_organization_chart: 'organization-chart',
  generate_path_map: 'path-map',
  generate_pie_chart: 'pie',
  generate_pin_map: 'pin-map',
  generate_radar_chart: 'radar',
  generate_sankey_chart: 'sankey',
  generate_scatter_chart: 'scatter',
  generate_treemap_chart: 'treemap',
  generate_venn_chart: 'venn',
  generate_violin_chart: 'violin',
  generate_word_cloud_chart: 'word-cloud',
};

function getVisRequestServer() {
  return process.env.VIS_REQUEST_SERVER || 'https://antv-studio.alipay.com/api/gpt-vis';
}

async function httpPost(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

export async function generateChartUrl(chartType, options) {
  const url = getVisRequestServer();
  const payload = {
    type: chartType,
    source: 'chart-visualization-skills',
    ...options,
  };

  const data = await httpPost(url, payload);

  if (!data.success) {
    throw new Error(data.errorMessage || 'Unknown error');
  }

  return data.resultObj;
}

export async function generateMap(tool, inputData) {
  const url = getVisRequestServer();
  const payload = {
    tool,
    input: inputData,
    source: 'chart-visualization-skills',
  };

  const data = await httpPost(url, payload);

  if (!data.success) {
    throw new Error(data.errorMessage || 'Unknown error');
  }

  return data.resultObj;
}
