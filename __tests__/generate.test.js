import { describe, it, expect } from 'vitest';
import { generateChartUrl, generateMap, CHART_TYPE_MAP } from '../skills/chart-visualization/scripts/generate.js';

// Skip real API tests in CI environment
const skipRealApiTests = process.env.CI === 'true';

describe('generate.js - Chart Visualization Script', () => {
  describe('CHART_TYPE_MAP', () => {
    it('should contain all expected chart types', () => {
      expect(CHART_TYPE_MAP).toHaveProperty('generate_line_chart', 'line');
      expect(CHART_TYPE_MAP).toHaveProperty('generate_bar_chart', 'bar');
      expect(CHART_TYPE_MAP).toHaveProperty('generate_pie_chart', 'pie');
      expect(CHART_TYPE_MAP).toHaveProperty('generate_area_chart', 'area');
      expect(CHART_TYPE_MAP).toHaveProperty('generate_scatter_chart', 'scatter');
    });

    it('should have 25 chart types', () => {
      expect(Object.keys(CHART_TYPE_MAP)).toHaveLength(25);
    });

    it('should map district map correctly', () => {
      expect(CHART_TYPE_MAP.generate_district_map).toBe('district-map');
    });

    it('should map word cloud correctly', () => {
      expect(CHART_TYPE_MAP.generate_word_cloud_chart).toBe('word-cloud');
    });
  });

  describe.skipIf(skipRealApiTests)('generateChartUrl - Real API Tests', () => {
    it('should generate line chart with real data', async () => {
      // Real data from generate_line_chart.md reference
      const lineChartData = [
        { time: '2025-01-01', value: 100 },
        { time: '2025-01-02', value: 120 },
        { time: '2025-01-03', value: 110 },
        { time: '2025-01-04', value: 140 },
        { time: '2025-01-05', value: 130 },
      ];

      const result = await generateChartUrl('line', {
        data: lineChartData,
        title: 'Test Line Chart',
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // Result should be a URL
      expect(result).toMatch(/^https?:\/\//);
    }, 10000);

    it('should generate pie chart with real data', async () => {
      // Real data from generate_pie_chart.md reference
      const pieChartData = [
        { category: 'Product A', value: 30 },
        { category: 'Product B', value: 25 },
        { category: 'Product C', value: 20 },
        { category: 'Product D', value: 15 },
        { category: 'Product E', value: 10 },
      ];

      const result = await generateChartUrl('pie', {
        data: pieChartData,
        title: 'Market Share',
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^https?:\/\//);
    }, 10000);

    it('should generate bar chart with real data', async () => {
      const barChartData = [
        { category: 'Category A', value: 45 },
        { category: 'Category B', value: 60 },
        { category: 'Category C', value: 35 },
        { category: 'Category D', value: 50 },
      ];

      const result = await generateChartUrl('bar', {
        data: barChartData,
        title: 'Comparison Chart',
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^https?:\/\//);
    }, 10000);

    it('should generate area chart with real data', async () => {
      const areaChartData = [
        { time: '2025-01', value: 1000 },
        { time: '2025-02', value: 1200 },
        { time: '2025-03', value: 1100 },
        { time: '2025-04', value: 1400 },
      ];

      const result = await generateChartUrl('area', {
        data: areaChartData,
        title: 'Cumulative Trend',
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^https?:\/\//);
    }, 10000);
  });

  describe.skipIf(skipRealApiTests)('generateMap - Real API Tests', () => {
    it('should generate district map with real data', async () => {
      const districtMapData = {
        region: 'china',
        data: [
          { name: '北京', value: 100 },
          { name: '上海', value: 120 },
          { name: '广东', value: 150 },
        ],
      };

      const result = await generateMap('generate_district_map', districtMapData);

      expect(result).toBeDefined();
      // The result should contain map visualization data
      expect(result).toHaveProperty('content');
    }, 10000);

    it('should generate pin map with real data', async () => {
      const pinMapData = {
        points: [
          { name: 'Location 1', lat: 39.9, lng: 116.4, value: 100 },
          { name: 'Location 2', lat: 31.2, lng: 121.5, value: 150 },
        ],
      };

      const result = await generateMap('generate_pin_map', pinMapData);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('content');
    }, 10000);
  });
});
