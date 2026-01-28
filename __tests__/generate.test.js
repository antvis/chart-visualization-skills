import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateChartUrl, generateMap, httpPost, CHART_TYPE_MAP } from '../skills/chart-visualization/scripts/generate.js';

// Mock global fetch
global.fetch = vi.fn();

describe('generate.js - Chart Visualization Script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  describe('httpPost', () => {
    it('should make POST request with correct payload', async () => {
      const mockResponse = { success: true, data: 'test' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await httpPost('https://example.com', { test: 'data' });

      expect(global.fetch).toHaveBeenCalledWith('https://example.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on failed request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      await expect(httpPost('https://example.com', {})).rejects.toThrow('HTTP 404: Not found');
    });
  });

  describe('generateChartUrl', () => {
    it('should generate chart URL successfully', async () => {
      const mockResponse = {
        success: true,
        resultObj: 'https://example.com/chart.png',
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateChartUrl('line', { data: [1, 2, 3] });

      expect(result).toBe('https://example.com/chart.png');
      const callArgs = global.fetch.mock.calls[0][1];
      const payload = JSON.parse(callArgs.body);
      expect(payload.type).toBe('line');
      expect(payload.source).toBe('chart-visualization-creator');
      expect(payload.data).toEqual([1, 2, 3]);
    });

    it('should throw error when API returns success: false', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, errorMessage: 'Test error' }),
      });

      await expect(generateChartUrl('line', {})).rejects.toThrow('Test error');
    });

    it('should throw error with default message when errorMessage is missing', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false }),
      });

      await expect(generateChartUrl('line', {})).rejects.toThrow('Unknown error');
    });
  });

  describe('generateMap', () => {
    it('should generate map successfully', async () => {
      const mockResponse = {
        success: true,
        resultObj: { content: [{ type: 'text', text: 'Map URL' }] },
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateMap('generate_district_map', { region: 'test' });

      expect(result).toEqual({ content: [{ type: 'text', text: 'Map URL' }] });
      const callArgs = global.fetch.mock.calls[0][1];
      const payload = JSON.parse(callArgs.body);
      expect(payload.tool).toBe('generate_district_map');
      expect(payload.source).toBe('chart-visualization-creator');
      expect(payload.input).toEqual({ region: 'test' });
    });

    it('should include serviceId when available', async () => {
      process.env.SERVICE_ID = 'test-service-id';
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, resultObj: {} }),
      });

      await generateMap('generate_pin_map', {});

      const callArgs = global.fetch.mock.calls[0][1];
      const payload = JSON.parse(callArgs.body);
      expect(payload.serviceId).toBe('test-service-id');
      
      delete process.env.SERVICE_ID;
    });

    it('should throw error when API returns success: false', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, errorMessage: 'Map generation failed' }),
      });

      await expect(generateMap('generate_district_map', {})).rejects.toThrow('Map generation failed');
    });
  });
});
