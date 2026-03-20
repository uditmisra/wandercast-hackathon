import { Place, Interest, GeneratedContent } from '@/types/tour';
import { withRateLimit } from './rateLimiter';

/**
 * Content Generator for creating tour guide content using OpenAI's GPT models
 *
 * This class handles the generation of engaging, personalized tour content
 * including audio narration scripts for each location.
 */
export class ContentGenerator {
  /**
   * Makes a rate-limited API call to OpenAI's chat completions endpoint
   *
   * @param prompt - The prompt to send to the AI model
   * @param apiKey - OpenAI API key for authentication
   * @returns The AI-generated content as a string
   * @throws Error if the API request fails
   * @private
   */
  private static async callOpenAI(prompt: string, apiKey: string): Promise<string> {
    return withRateLimit(
      'openai',
      apiKey,
      async () => {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-5.2',
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert travel guide and historian. Create engaging, informative content for audio tours. Be conversational, include interesting facts, and make the content come alive with vivid descriptions and stories.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_tokens: 400,
              temperature: 0.7,
            }),
          });

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
          }

          const data = await response.json();
          return data.choices[0]?.message?.content || '';
        } catch (error) {
          console.error('Error calling OpenAI:', error);
          throw error;
        }
      }
    );
  }

  /**
   * Generates content for a single place based on user interests
   *
   * Creates overview text, interest-specific content, and an audio narration
   * script tailored to the location and visitor interests.
   *
   * @param place - The location to generate content for
   * @param interests - Array of visitor interests to focus on
   * @param openAiApiKey - OpenAI API key for authentication
   * @returns Generated content including overview and audio narration
   * @example
   * ```ts
   * const content = await ContentGenerator.generateContent(
   *   { name: 'Edinburgh Castle', city: 'Edinburgh', country: 'Scotland' },
   *   [{ name: 'history', label: 'History' }],
   *   'your-api-key'
   * );
   * ```
   */
  static async generateContent(
    place: Place,
    interests: Interest[],
    openAiApiKey: string
  ): Promise<GeneratedContent> {
    const interestNames = interests.map(i => i.name).join(', ');
    
    const prompt = `Create engaging audio tour content for ${place.name} in ${place.city}, ${place.country}. 
    
Focus on these interests: ${interestNames}

Please provide:
1. A brief overview (2-3 sentences)
2. Content for each relevant interest category (2-3 sentences each)
3. A brief audio narration (30-45 seconds, max 250 characters) that weaves together key information in a conversational, engaging style suitable for spoken audio

Format as JSON with these keys: overview, architecture, history, culture, food, artAndMuseums, shopping, ghostStories, localSecrets, audioNarration

Only include categories that are relevant to this location and the user's interests. Make the audio narration flow naturally and include vivid descriptions that help visitors visualize and connect with the place.`;

    try {
      const response = await this.callOpenAI(prompt, openAiApiKey);
      
      // Try to parse as JSON, fallback to manual parsing if needed
      try {
        return JSON.parse(response);
      } catch {
        // Fallback content if JSON parsing fails
        return {
          overview: `Welcome to ${place.name}, a fascinating destination in ${place.city}, ${place.country}.`,
          audioNarration: response || `${place.name} is a remarkable place with rich history and culture. As you explore this location, take time to appreciate its unique character and the stories it holds. This destination offers visitors a chance to connect with the local heritage and experience the authentic atmosphere that makes ${place.city} so special.`
        };
      }
    } catch (error) {
      console.error('Error generating content:', error);
      // Return fallback content
      return {
        overview: `Welcome to ${place.name}, a destination worth exploring in ${place.city}, ${place.country}.`,
        audioNarration: `You're now at ${place.name}, an interesting location in ${place.city}. Take a moment to look around and appreciate the unique atmosphere of this place. Every destination has its own story to tell, and this one is no exception. Enjoy exploring and discovering what makes this location special.`
      };
    }
  }

  /**
   * Generates content for multiple places sequentially with progress tracking
   *
   * Processes each place one at a time with a small delay between requests
   * to avoid rate limiting. Continues processing even if individual requests fail.
   *
   * @param places - Array of locations to generate content for
   * @param interests - Array of visitor interests to focus on
   * @param openAiApiKey - OpenAI API key for authentication
   * @param onProgress - Optional callback for tracking progress (completed, total)
   * @returns Array of places with generated content attached
   * @example
   * ```ts
   * const placesWithContent = await ContentGenerator.generateBulkContent(
   *   places,
   *   interests,
   *   apiKey,
   *   (completed, total) => console.log(`${completed}/${total} complete`)
   * );
   * ```
   */
  static async generateBulkContent(
    places: Place[],
    interests: Interest[],
    openAiApiKey: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<Place[]> {
    const results: Place[] = [];
    
    for (let i = 0; i < places.length; i++) {
      const place = places[i];
      try {
        const content = await this.generateContent(place, interests, openAiApiKey);
        results.push({
          ...place,
          generatedContent: content
        });
        
        if (onProgress) {
          onProgress(i + 1, places.length);
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error generating content for ${place.name}:`, error);
        // Add place with fallback content
        results.push({
          ...place,
          generatedContent: {
            overview: `Welcome to ${place.name}.`,
            audioNarration: `You're visiting ${place.name} in ${place.city}, ${place.country}. Enjoy exploring this location.`
          }
        });
      }
    }
    
    return results;
  }
}