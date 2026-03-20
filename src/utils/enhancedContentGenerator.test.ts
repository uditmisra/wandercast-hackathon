import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnhancedContentGenerator, generateEnhancedTourContent } from './enhancedContentGenerator';
import type { Place, Interest } from '@/types/tour';

// Mock fetch globally
global.fetch = vi.fn();

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_OPENAI_API_KEY: 'test-api-key',
    },
  },
});

describe('EnhancedContentGenerator', () => {
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

  const mockPersonalization = {
    travelStyle: 'first-time' as const,
    preferredTone: 'casual' as const,
    timeOfDay: 'morning' as const,
  };

  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateEnhancedContent', () => {
    it('should successfully generate enhanced content', async () => {
      const mockEnhancedResponse = {
        personalizedHook: 'Welcome to this amazing place',
        quickSnippet: 'Quick overview of the location',
        deepDive: 'Detailed historical and cultural information',
        localSecret: 'A secret only locals know',
        interactivePrompts: ['Question 1?', 'Question 2?', 'Question 3?'],
        audioNarration: 'Full audio script',
        overview: 'Brief summary',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockEnhancedResponse),
              },
            },
          ],
        }),
      });

      const content = await EnhancedContentGenerator.generateEnhancedContent(
        mockPlace,
        { ...mockPersonalization, interests: mockInterests },
        mockApiKey
      );

      expect(content).toEqual(mockEnhancedResponse);
      expect(content.personalizedHook).toBe('Welcome to this amazing place');
      expect(content.interactivePrompts).toHaveLength(3);
    });

    it('should personalize prompt based on travel style', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  personalizedHook: 'Test',
                  quickSnippet: 'Test',
                  deepDive: 'Test',
                  localSecret: 'Test',
                  interactivePrompts: ['Test?'],
                  audioNarration: 'Test',
                  overview: 'Test',
                }),
              },
            },
          ],
        }),
      });

      await EnhancedContentGenerator.generateEnhancedContent(
        mockPlace,
        { ...mockPersonalization, travelStyle: 'repeat', interests: mockInterests },
        mockApiKey
      );

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const userPrompt = requestBody.messages[1].content;

      expect(userPrompt).toContain('returning with deeper curiosity');
    });

    it('should personalize prompt based on preferred tone', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  personalizedHook: 'Test',
                  quickSnippet: 'Test',
                  deepDive: 'Test',
                  localSecret: 'Test',
                  interactivePrompts: ['Test?'],
                  audioNarration: 'Test',
                  overview: 'Test',
                }),
              },
            },
          ],
        }),
      });

      await EnhancedContentGenerator.generateEnhancedContent(
        mockPlace,
        { ...mockPersonalization, preferredTone: 'scholarly', interests: mockInterests },
        mockApiKey
      );

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const userPrompt = requestBody.messages[1].content;

      expect(userPrompt).toContain('academic depth');
      expect(userPrompt).toContain('passionate professor');
    });

    it('should personalize prompt based on time of day', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  personalizedHook: 'Test',
                  quickSnippet: 'Test',
                  deepDive: 'Test',
                  localSecret: 'Test',
                  interactivePrompts: ['Test?'],
                  audioNarration: 'Test',
                  overview: 'Test',
                }),
              },
            },
          ],
        }),
      });

      await EnhancedContentGenerator.generateEnhancedContent(
        mockPlace,
        { ...mockPersonalization, timeOfDay: 'evening', interests: mockInterests },
        mockApiKey
      );

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const userPrompt = requestBody.messages[1].content;

      expect(userPrompt).toContain('evening shadows');
    });

    it('should include interests in prompt', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  personalizedHook: 'Test',
                  quickSnippet: 'Test',
                  deepDive: 'Test',
                  localSecret: 'Test',
                  interactivePrompts: ['Test?'],
                  audioNarration: 'Test',
                  overview: 'Test',
                }),
              },
            },
          ],
        }),
      });

      await EnhancedContentGenerator.generateEnhancedContent(
        mockPlace,
        { ...mockPersonalization, interests: mockInterests },
        mockApiKey
      );

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const userPrompt = requestBody.messages[1].content;

      expect(userPrompt).toContain('history, architecture');
    });

    it('should use fallback content on API error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

      const content = await EnhancedContentGenerator.generateEnhancedContent(
        mockPlace,
        { ...mockPersonalization, interests: mockInterests },
        mockApiKey
      );

      expect(content.personalizedHook).toContain('Edinburgh Castle');
      expect(content.quickSnippet).toBeDefined();
      expect(content.deepDive).toBeDefined();
      expect(content.localSecret).toBeDefined();
      expect(content.interactivePrompts).toBeInstanceOf(Array);
      expect(content.audioNarration).toBeDefined();
    });

    it('should handle non-OK response with fallback', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      const content = await EnhancedContentGenerator.generateEnhancedContent(
        mockPlace,
        { ...mockPersonalization, interests: mockInterests },
        mockApiKey
      );

      expect(content.overview).toBeDefined();
      expect(content.audioNarration).toBeDefined();
    });

    it('should handle JSON parse error with fallback', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'This is not valid JSON',
              },
            },
          ],
        }),
      });

      const content = await EnhancedContentGenerator.generateEnhancedContent(
        mockPlace,
        { ...mockPersonalization, interests: mockInterests },
        mockApiKey
      );

      expect(content.personalizedHook).toBeDefined();
      expect(content.quickSnippet).toBeDefined();
    });

    it('should ensure all required fields exist even with partial response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  personalizedHook: 'Test hook',
                  quickSnippet: 'Test snippet',
                  // Missing other fields
                }),
              },
            },
          ],
        }),
      });

      const content = await EnhancedContentGenerator.generateEnhancedContent(
        mockPlace,
        { ...mockPersonalization, interests: mockInterests },
        mockApiKey
      );

      expect(content.overview).toBeDefined();
      expect(content.audioNarration).toBeDefined();
      // Should use quickSnippet as fallback for audioNarration
      expect(content.audioNarration).toBe('Test snippet');
    });

    it('should use correct OpenAI model and parameters', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  personalizedHook: 'Test',
                  quickSnippet: 'Test',
                  deepDive: 'Test',
                  localSecret: 'Test',
                  interactivePrompts: ['Test?'],
                  audioNarration: 'Test',
                  overview: 'Test',
                }),
              },
            },
          ],
        }),
      });

      await EnhancedContentGenerator.generateEnhancedContent(
        mockPlace,
        { ...mockPersonalization, interests: mockInterests },
        mockApiKey
      );

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.model).toBe('gpt-5.2');
      expect(requestBody.max_tokens).toBe(800);
      expect(requestBody.temperature).toBe(0.8);
    });
  });

  describe('generateEnhancedTourContent', () => {
    it('should generate content for all places in parallel', async () => {
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
                  personalizedHook: 'Test',
                  quickSnippet: 'Test',
                  deepDive: 'Test',
                  localSecret: 'Test',
                  interactivePrompts: ['Test?'],
                  audioNarration: 'Test',
                  overview: 'Test',
                }),
              },
            },
          ],
        }),
      });

      const results = await generateEnhancedTourContent(
        places,
        mockInterests,
        mockPersonalization
      );

      expect(results).toHaveLength(2);
      expect(results[0].generatedContent).toBeDefined();
      expect(results[1].generatedContent).toBeDefined();
    });

    it('should use fallback content when API key is missing', async () => {
      // Mock missing API key
      vi.stubGlobal('import', {
        meta: {
          env: {
            VITE_OPENAI_API_KEY: undefined,
          },
        },
      });

      const places: Place[] = [mockPlace];

      const results = await generateEnhancedTourContent(
        places,
        mockInterests,
        mockPersonalization
      );

      expect(results).toHaveLength(1);
      expect(results[0].generatedContent).toBeDefined();
      expect(results[0].generatedContent?.personalizedHook).toContain(mockPlace.name);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should continue with other places if one fails', async () => {
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
                    personalizedHook: 'Success',
                    quickSnippet: 'Success',
                    deepDive: 'Success',
                    localSecret: 'Success',
                    interactivePrompts: ['Success?'],
                    audioNarration: 'Success',
                    overview: 'Success',
                  }),
                },
              },
            ],
          }),
        });

      const results = await generateEnhancedTourContent(
        places,
        mockInterests,
        mockPersonalization
      );

      expect(results).toHaveLength(2);
      // First should have fallback
      expect(results[0].generatedContent?.personalizedHook).toContain('Place 1');
      // Second should have API response
      expect(results[1].generatedContent?.personalizedHook).toBe('Success');
    });
  });
});
