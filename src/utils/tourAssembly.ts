import { CityPlaceWithStories, CityData } from '@/types/library';
import { TourPlan, Place } from '@/types/tour';

/** Build a one-stop TourPlan for immediate play from a curated place */
export function buildSingleStopTour(
  place: CityPlaceWithStories,
  tone: string,
  city: CityData
): TourPlan {
  const story = place.stories.find(s => s.tone === tone) || place.stories[0];
  const placeObj: Place = {
    id: `curated-${place.place_id}-0`,
    name: place.name,
    city: city.name,
    country: city.country,
    description: story?.hook || '',
    latitude: place.lat,
    longitude: place.lng,
    estimatedDuration: 5,
    generatedContent: {
      overview: story?.hook || '',
      audioNarration: story?.audio_narration || '',
      hook: story?.hook || '',
      directionalCue: story?.directional_cue || '',
      storyType: story?.story_type,
      funFacts: story?.fun_facts,
      lookCloserChallenge: story?.look_closer_challenge,
      suggestedQuestions: story?.suggested_questions,
    },
  };
  const interests: Interest[] = (story?.interests || []).map(name => ({
    id: name,
    name,
    label: name.charAt(0).toUpperCase() + name.slice(1),
    description: '',
    icon: '',
  }));
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
  return {
    id: `curated-single-${Date.now()}`,
    title: place.name,
    description: story?.hook || `A story about ${place.name}`,
    places: [placeObj],
    interests,
    totalDuration: 5,
    createdAt: new Date(),
    personalization: {
      travelStyle: 'first-time',
      preferredTone: tone as any,
      timeOfDay: timeOfDay as any,
    },
  };
}

/** Build a tour from an arbitrary POI (no curated story). Content will be AI-generated on the fly. */
export function buildPoiTour(
  poi: { name: string; lat: number; lng: number; category?: string },
  tone = 'casual',
  geo?: { city?: string; country?: string; neighbourhood?: string }
): TourPlan {
  const placeObj: Place = {
    id: `poi-${Date.now()}-0`,
    name: poi.name,
    city: geo?.city || '',
    country: geo?.country || '',
    neighbourhood: geo?.neighbourhood,
    description: poi.category ? `A ${poi.category} worth exploring` : `Discover ${poi.name}`,
    latitude: poi.lat,
    longitude: poi.lng,
    estimatedDuration: 5,
    generatedContent: {
      overview: '',
      audioNarration: '',
      _pending: true,
    },
  };

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

  return {
    id: `poi-single-${Date.now()}`,
    title: poi.name,
    description: `AI-generated story about ${poi.name}`,
    places: [placeObj],
    interests: [],
    totalDuration: 5,
    createdAt: new Date(),
    personalization: {
      travelStyle: 'first-time',
      preferredTone: tone as any,
      timeOfDay: timeOfDay as any,
    },
  };
}
