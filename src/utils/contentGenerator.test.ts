import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContentGenerator } from './contentGenerator';
import type { Place, Interest } from '@/types/tour';

// Mock fetch globally
global.fetch = vi.fn();

describe('ContentGenerator', () => {
  const mockPlace: Place = {
    id: '1',
    name: 'Edinburgh Castle',
    city: 'Edinburgh',
    country: 'Scotland',
    estimatedDuration: 60,
  };

  const mockInterests: Interest[] = [
    { id: '1', name: 'history', label: 'History' },
    { id: '2', name: 'architecture', label: 'Architecture' },
  ];

  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateContent', () => {
    it('should successfully generate content with valid API response', async () => {
      const mockResponse = {
        overview: 'Welcome to Edinburgh Castle',
        history: 'Rich historical background',
        architecture: 'Stunning medieval architecture',
        audioNarration: 'Edinburgh Castle stands majestically...',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockResponse),
              },
            },
          ],
        }),
      });

      const content = await ContentGenerator.generateContent(
        mockPlace,
        mockInterests,
        mockApiKey
      );

      expect(content).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should use fallback content when API returns non-JSON', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'This is not JSON content',
              },
            },
          ],
        }),
      });

      const content = await ContentGenerator.generateContent(
        mockPlace,
        mockInterests,
        mockApiKey
      );

      expect(content.overview).toContain('Edinburgh Castle');
      expect(content.audioNarration).toContain('This is not JSON content');
    });

    it('should handle API errors with fallback content', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const content = await ContentGenerator.generateContent(
        mockPlace,
        mockInterests,
        mockApiKey
      );

      expect(content.overview).toContain('Edinburgh Castle');
      expect(content.audioNarration).toContain('Edinburgh Castle');
      expect(content.audioNarration).toContain('Edinburgh');
    });

    it('should handle network errors with fallback content', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const content = await ContentGenerator.generateContent(
        mockPlace,
        mockInterests,
        mockApiKey
      );

      expect(content.overview).toBeDefined();
      expect(content.audioNarration).toBeDefined();
      expect(content.overview).toContain(mockPlace.name);
    });

    it('should include interests in the API prompt', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  overview: 'Test',
                  audioNarration: 'Test narration',
                }),
              },
            },
          ],
        }),
      });

      await ContentGenerator.generateContent(mockPlace, mockInterests, mockApiKey);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const userPrompt = requestBody.messages[1].content;

      expect(userPrompt).toContain('history, architecture');
      expect(userPrompt).toContain('Edinburgh Castle');
      expect(userPrompt).toContain('Edinburgh');
      expect(userPrompt).toContain('Scotland');
    });

    it('should request specific content structure in prompt', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  overview: 'Test',
                  audioNarration: 'Test',
                }),
              },
            },
          ],
        }),
      });

      await ContentGenerator.generateContent(mockPlace, mockInterests, mockApiKey);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const userPrompt = requestBody.messages[1].content;

      expect(userPrompt).toContain('overview');
      expect(userPrompt).toContain('audioNarration');
      expect(userPrompt).toContain('JSON');
    });
  });

  describe('generateBulkContent', () => {
    it('should generate content for multiple places', async () => {
      const places: Place[] = [
        { ...mockPlace, id: '1', name: 'Place 1' },
        { ...mockPlace, id: '2', name: 'Place 2' },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  overview: 'Test overview',
                  audioNarration: 'Test narration',
                }),
              },
            },
          ],
        }),
      });

      const results = await ContentGenerator.generateBulkContent(
        places,
        mockInterests,
        mockApiKey
      );

      expect(results).toHaveLength(2);
      expect(results[0].generatedContent).toBeDefined();
      expect(results[1].generatedContent).toBeDefined();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should call progress callback with correct values', async () => {
      const places: Place[] = [
        { ...mockPlace, id: '1', name: 'Place 1' },
        { ...mockPlace, id: '2', name: 'Place 2' },
        { ...mockPlace, id: '3', name: 'Place 3' },
      ];

      const progressCallback = vi.fn();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  overview: 'Test',
                  audioNarration: 'Test',
                }),
              },
            },
          ],
        }),
      });

      await ContentGenerator.generateBulkContent(
        places,
        mockInterests,
        mockApiKey,
        progressCallback
      );

      expect(progressCallback).toHaveBeenCalledTimes(3);
      expect(progressCallback).toHaveBeenNthCalledWith(1, 1, 3);
      expect(progressCallback).toHaveBeenNthCalledWith(2, 2, 3);
      expect(progressCallback).toHaveBeenNthCalledWith(3, 3, 3);
    });

    it('should continue processing after individual failures', async () => {
      const places: Place[] = [
        { ...mockPlace, id: '1', name: 'Place 1' },
        { ...mockPlace, id: '2', name: 'Place 2' },
      ];

      (global.fetch as any)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    overview: 'Success',
                    audioNarration: 'Success',
                  }),
                },
              },
            ],
          }),
        });

      const results = await ContentGenerator.generateBulkContent(
        places,
        mockInterests,
        mockApiKey
      );

      expect(results).toHaveLength(2);
      expect(results[0].generatedContent?.overview).toContain('Place 1');
      expect(results[1].generatedContent?.overview).toBe('Success');
    });

    it('should add delay between requests', async () => {
      const places: Place[] = [
        { ...mockPlace, id: '1' },
        { ...mockPlace, id: '2' },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  overview: 'Test',
                  audioNarration: 'Test',
                }),
              },
            },
          ],
        }),
      });

      const startTime = Date.now();
      await ContentGenerator.generateBulkContent(places, mockInterests, mockApiKey);
      const endTime = Date.now();

      // Should take at least 1000ms for the delay (allowing some margin)
      expect(endTime - startTime).toBeGreaterThanOrEqual(900);
    });

    it('should handle empty places array', async () => {
      const results = await ContentGenerator.generateBulkContent(
        [],
        mockInterests,
        mockApiKey
      );

      expect(results).toHaveLength(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
