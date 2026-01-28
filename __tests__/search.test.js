import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchIcons } from '../skills/icon-retrieval/scripts/search.js';

// Mock global fetch
global.fetch = vi.fn();

describe('search.js - Icon Retrieval Script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchIcons', () => {
    it('should search icons and return results', async () => {
      const mockApiResponse = {
        status: true,
        data: {
          success: true,
          data: ['https://example.com/icon1.svg', 'https://example.com/icon2.svg'],
        },
      };

      const mockSvgContent = '<svg>Icon</svg>';

      // Mock API call
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        })
        // Mock SVG fetches
        .mockResolvedValueOnce({
          ok: true,
          text: async () => mockSvgContent,
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => mockSvgContent,
        });

      const results = await searchIcons('test', 2);

      expect(results).toHaveLength(2);
      expect(results[0].url).toBe('https://example.com/icon1.svg');
      expect(results[0].svg).toBe(mockSvgContent);
      expect(results[1].url).toBe('https://example.com/icon2.svg');
      expect(results[1].svg).toBe(mockSvgContent);
    });

    it('should use default topK of 5', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: true,
          data: { success: true, data: [] },
        }),
      });

      await searchIcons('test');

      const callUrl = global.fetch.mock.calls[0][0];
      expect(callUrl).toContain('topK=5');
    });

    it('should use custom topK value', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: true,
          data: { success: true, data: [] },
        }),
      });

      await searchIcons('test', 10);

      const callUrl = global.fetch.mock.calls[0][0];
      expect(callUrl).toContain('topK=10');
    });

    it('should throw error on API failure (status: false)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: false,
          message: 'API error',
        }),
      });

      await expect(searchIcons('test')).rejects.toThrow('API error');
    });

    it('should throw error when data.success is false', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: true,
          data: { success: false },
          message: 'Data error',
        }),
      });

      await expect(searchIcons('test')).rejects.toThrow('Data error');
    });

    it('should throw default error message when message is missing', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: false,
        }),
      });

      await expect(searchIcons('test')).rejects.toThrow('API request failed');
    });

    it('should throw error on HTTP error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      });

      await expect(searchIcons('test')).rejects.toThrow('HTTP 500: Server error');
    });

    it('should handle failed SVG fetches gracefully', async () => {
      const mockApiResponse = {
        status: true,
        data: {
          success: true,
          data: ['https://example.com/icon1.svg', 'https://example.com/icon2.svg'],
        },
      };

      // Mock API call
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        })
        // First SVG fetch succeeds
        .mockResolvedValueOnce({
          ok: true,
          text: async () => '<svg>Icon1</svg>',
        })
        // Second SVG fetch fails
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const results = await searchIcons('test', 2);

      expect(results).toHaveLength(1);
      expect(results[0].url).toBe('https://example.com/icon1.svg');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Failed to fetch SVG')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should encode query parameters correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: true,
          data: { success: true, data: [] },
        }),
      });

      await searchIcons('test & special', 5);

      const callUrl = global.fetch.mock.calls[0][0];
      expect(callUrl).toContain('test');
      expect(callUrl).toContain('special');
      // URLSearchParams should encode the ampersand
      expect(callUrl).toContain('%26');
    });

    it('should return empty array when no icons found', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: true,
          data: { success: true, data: [] },
        }),
      });

      const results = await searchIcons('test');

      expect(results).toEqual([]);
    });
  });
});
