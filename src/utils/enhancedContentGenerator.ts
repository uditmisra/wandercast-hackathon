import { Place, Interest, GeneratedContent } from '@/types/tour';

interface ContentPersonalization {
  travelStyle: 'first-time' | 'repeat' | 'local' | 'explorer';
  preferredTone: 'casual' | 'scholarly' | 'dramatic' | 'witty';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  interests: Interest[];
}

/**
 * Enhanced content with multiple depth levels and personalization
 */
interface EnhancedContent extends GeneratedContent {
  quickSnippet: string;
  deepDive: string;
  localSecret: string;
  interactivePrompts: string[];
  personalizedHook: string;
}

/**
 * Generates fallback tour content for multiple places.
 * Content generation with AI is handled server-side via the generate-tour-content edge function.
 */
export async function generateEnhancedTourContent(
  places: Place[],
  interests: Interest[],
  personalization: Omit<ContentPersonalization, 'interests'>
): Promise<Place[]> {
  return places.map(place => ({
    ...place,
    generatedContent: createFallbackContent(place)
  }));
}

function createFallbackContent(place: Place): EnhancedContent {
  return {
    personalizedHook: `Step into the captivating world of ${place.name}`,
    quickSnippet: `${place.name} holds secrets waiting to be discovered. This remarkable location in ${place.city} has witnessed countless stories unfold throughout history.`,
    deepDive: `${place.name} stands as a testament to the rich heritage of ${place.city}. Each corner, each stone, each weathered surface tells a story of the people who walked these paths before you. What makes this place truly special isn't just its obvious beauty, but the hidden layers of human experience embedded in its very foundations.`,
    localSecret: `Here's something most visitors never learn: the unique acoustic properties of this space were actually discovered by accident, creating an unintended but beautiful effect.`,
    interactivePrompts: [
      "What architectural details catch your eye?",
      "Can you imagine the daily life here centuries ago?",
      "What stories do you think these walls could tell?"
    ],
    overview: `${place.name} offers a window into the soul of ${place.city}, revealing stories that bring the past to vivid life.`,
    audioNarration: `Welcome to ${place.name}, where history comes alive in unexpected ways. As you stand here, you're not just visiting a location – you're stepping into a living story that has unfolded for generations. Take a moment to really look around and imagine the countless footsteps that have worn these paths smooth.`
  };
}

/**
 * Enhanced Content Generator - provides fallback content only.
 * AI content generation is handled server-side via the generate-tour-content edge function.
 */
export class EnhancedContentGenerator {
  static async generateEnhancedContent(
    place: Place,
    personalization: ContentPersonalization,
    _apiKey?: string
  ): Promise<EnhancedContent> {
    return createFallbackContent(place);
  }
}
