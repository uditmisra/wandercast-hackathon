import { useState, useEffect, useRef } from 'react';
import { TourPlan } from '@/types/tour';
import { supabase } from '@/integrations/supabase/client';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { analytics } from '@/utils/analytics';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isProgress?: boolean;
}

interface UserGeoContext {
  lat: number;
  lng: number;
  city?: string | null;
  country?: string | null;
  neighbourhood?: string | null;
}

interface UseTourChatEngineOptions {
  onTourGenerated: (tour: TourPlan) => void;
  onTourUpdated?: (tour: TourPlan) => void;
  prefillPrompt?: string;
  userLocation?: UserGeoContext | null;
}

/** Haversine distance in meters between two lat/lng points */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Approximate compass bearing from point A to point B */
function bearing(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const dirs = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  return dirs[Math.round(deg / 45) % 8];
}

/** Reorder places by nearest-neighbor starting from a given point */
function sortByProximity(
  places: any[],
  startLat: number,
  startLng: number
): any[] {
  const remaining = [...places];
  const sorted: any[] = [];
  let curLat = startLat;
  let curLng = startLng;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const p = remaining[i];
      if (!p.latitude || !p.longitude) continue;
      const d = haversineMeters(curLat, curLng, p.latitude, p.longitude);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    const next = remaining.splice(nearestIdx, 1)[0];
    sorted.push(next);
    if (next.latitude && next.longitude) {
      curLat = next.latitude;
      curLng = next.longitude;
    }
  }
  return sorted;
}

export function useTourChatEngine({ onTourGenerated, onTourUpdated, prefillPrompt, userLocation }: UseTourChatEngineOptions) {
  const { preferences } = useUserPreferences();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey! Where are you headed? Tell me a city, a vibe, or just what you're in the mood for.",
      timestamp: new Date()
    }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQuickStarts, setShowQuickStarts] = useState(true);

  const prefillSent = useRef(false);
  useEffect(() => {
    if (prefillPrompt && !prefillSent.current) {
      prefillSent.current = true;
      handleSend(prefillPrompt);
    }
  }, [prefillPrompt]);

  const quickStarts = [
    "First time in Paris",
    "Tokyo beyond the guidebook",
    "Rome off the tourist track",
    "Eat your way through Barcelona"
  ];

  const getPersonalization = () => {
    const hour = new Date().getHours();
    const timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' =
      hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
    return {
      travelStyle: (preferences.interests.length > 0 ? 'repeat' : 'first-time') as 'first-time' | 'repeat' | 'local' | 'explorer',
      preferredTone: (preferences.preferredTone || 'casual') as 'casual' | 'scholarly' | 'dramatic' | 'witty',
      timeOfDay,
      favoriteStoryTypes: preferences.favoriteStoryTypes || [],
    };
  };

  const handleSend = async (message: string = input) => {
    if (!message.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowQuickStarts(false);
    setIsGenerating(true);

    const progressMessageId = (Date.now() + 1).toString();

    setMessages(prev => [...prev, {
      id: progressMessageId,
      role: 'assistant' as const,
      content: 'Finding the perfect spots...',
      timestamp: new Date(),
      isProgress: true,
    }]);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Stage 1: Parse the request (include user location + reverse-geocoded context if available)
      const { data: parseResult, error: invokeError } = await supabase.functions.invoke('parse-tour-request', {
        body: {
          message,
          conversationHistory: [...conversationHistory, { role: 'user', content: message }],
          ...(userLocation ? {
            userLocation: {
              lat: userLocation.lat,
              lng: userLocation.lng,
              ...(userLocation.city ? { city: userLocation.city } : {}),
              ...(userLocation.country ? { country: userLocation.country } : {}),
              ...(userLocation.neighbourhood ? { neighbourhood: userLocation.neighbourhood } : {}),
            }
          } : {}),
        }
      });

      if (invokeError) throw new Error(`Supabase invocation error: ${invokeError.message}`);
      if (!parseResult?.success) throw new Error(parseResult?.error || 'Failed to parse tour request');

      const tourData = parseResult.data;

      if (tourData.needsMoreInfo) {
        const followUpMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: tourData.followUpQuestion || "Could you tell me a bit more about what you'd like to see?",
          timestamp: new Date()
        };
        setMessages(prev => prev.slice(0, -1).concat([followUpMessage]));
        setIsGenerating(false);
        return;
      }

      // Stage 2: Build tour structure
      const placeCount = tourData.places.length;
      setMessages(prev => prev.map(m =>
        m.id === progressMessageId ? { ...m, content: `Got it — ${placeCount} stops. Mapping your route...`, isProgress: false } : m
      ));

      const personalization = {
        ...getPersonalization(),
        ...(tourData.mood ? { requestMood: tourData.mood } : {}),
      };

      // Strip any LLM-hallucinated coordinates — we'll geocode properly via Mapbox
      const placesWithIds = tourData.places.map((place: any, index: number) => {
        const { latitude, longitude, lat, lng, ...rest } = place;
        return { ...rest, id: `place-${Date.now()}-${index}` };
      });

      const mappedInterests = tourData.interests.map((name: string) => ({
        id: name, name,
        label: name.charAt(0).toUpperCase() + name.slice(1),
        description: '', icon: ''
      }));

      // Helper: enhance a place with content result
      const enhancePlace = (place: any, content: any) => ({
        ...place,
        generatedContent: content ? {
          audioNarration: content.audioNarration,
          overview: place.description,
          hook: content.hook,
          directionalCue: content.directionalCue,
          storyType: content.storyType,
          funFacts: content.funFacts,
          lookCloserChallenge: content.lookCloserChallenge,
          suggestedQuestions: content.suggestedQuestions,
          transitionToNext: content.transitionToNext,
        } : {
          audioNarration: `Welcome to ${place.name}. This is one of ${place.city}'s most fascinating spots.`,
          overview: place.description
        }
      });

      // ── Geocode all places first — we need coordinates for route optimization ──
      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
      const geocodedPlaces = mapboxToken
        ? await Promise.all(
            placesWithIds.map(async (place: any) => {
              try {
                const parts = [place.name, place.city, place.country].filter(Boolean);
                const query = encodeURIComponent(parts.join(', '));
                // No type filter — let Mapbox find the best match across all categories
                const resp = await fetch(
                  `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxToken}&limit=1`
                );
                const data = await resp.json();
                const [lng, lat] = data.features?.[0]?.center || [];
                return lat != null && lng != null ? { ...place, latitude: lat, longitude: lng } : place;
              } catch {
                return place;
              }
            })
          )
        : placesWithIds;

      // ── Reorder by walking proximity (nearest-neighbor from user location) ──
      const geocodedWithCoords = placesWithIds.map((place: any, idx: number) => ({
        ...place,
        latitude: geocodedPlaces[idx].latitude,
        longitude: geocodedPlaces[idx].longitude,
      }));

      const hasCoords = geocodedWithCoords.some((p: any) => p.latitude && p.longitude);
      const orderedPlaces = hasCoords
        ? sortByProximity(
            geocodedWithCoords,
            userLocation?.lat ?? geocodedWithCoords.find((p: any) => p.latitude)?.latitude ?? 0,
            userLocation?.lng ?? geocodedWithCoords.find((p: any) => p.longitude)?.longitude ?? 0,
          )
        : geocodedWithCoords;

      // Create placeholder tour in correct walking order (route matches content from the start)
      const placeholderPlaces = orderedPlaces.map((place: any) => ({
        ...place,
        generatedContent: {
          audioNarration: '',
          overview: place.description || '',
          _pending: true,
        }
      }));

      const tourId = Date.now().toString();
      const tour: TourPlan = {
        id: tourId,
        title: tourData.tourTitle,
        description: tourData.tourDescription,
        places: placeholderPlaces,
        interests: mappedInterests,
        totalDuration: orderedPlaces.reduce((total: number, place: any) => total + (place.estimatedDuration || 30), 0),
        createdAt: new Date(),
        personalization
      };

      const successMessage: ChatMessage = {
        id: (Date.now() + 3).toString(),
        role: 'assistant',
        content: `"${tour.title}" is ready. Starting your tour...`,
        timestamp: new Date()
      };
      setMessages(prev => prev.slice(0, -1).concat([successMessage]));

      // Hand off to player with correctly-ordered route (tour_created fired in Index.handlePlayTour)
      onTourGenerated(tour);

      // ── Step C: Get real walking distances via Mapbox Directions API ──
      const coordsWithIdx = orderedPlaces
        .map((p: any, i: number) => p.latitude && p.longitude ? { i, lng: p.longitude, lat: p.latitude } : null)
        .filter(Boolean) as { i: number; lng: number; lat: number }[];

      // Mapbox Directions: one call with all waypoints → leg-by-leg walking distance + duration
      let walkingLegs: { distance: number; duration: number }[] = [];
      if (mapboxToken && coordsWithIdx.length >= 2) {
        try {
          const coords = coordsWithIdx.map(c => `${c.lng},${c.lat}`).join(';');
          const resp = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?access_token=${mapboxToken}&overview=false&steps=false`
          );
          const data = await resp.json();
          if (data.routes?.[0]?.legs) {
            walkingLegs = data.routes[0].legs.map((leg: any) => ({
              distance: Math.round(leg.distance),      // meters
              duration: Math.round(leg.duration / 60),  // minutes
            }));
          }
        } catch (err) {
          console.warn('Mapbox Directions failed, falling back to haversine:', err);
        }
      }

      const placesWithDistances = orderedPlaces.map((place: any, idx: number) => {
        const next = idx < orderedPlaces.length - 1 ? orderedPlaces[idx + 1] : null;
        let distanceToNext: number | undefined;
        let directionToNext: string | undefined;
        let walkingMinutes: number | undefined;

        if (next && place.latitude && place.longitude && next.latitude && next.longitude) {
          // Use Mapbox walking data if available, otherwise haversine with urban factor
          if (walkingLegs[idx]) {
            distanceToNext = walkingLegs[idx].distance;
            walkingMinutes = walkingLegs[idx].duration;
          } else {
            const straightLine = haversineMeters(place.latitude, place.longitude, next.latitude, next.longitude);
            distanceToNext = Math.round(straightLine * 1.4); // urban routing factor
            walkingMinutes = Math.round(distanceToNext / 80);
          }
          directionToNext = bearing(place.latitude, place.longitude, next.latitude, next.longitude);
        }

        return { ...place, distanceToNext, directionToNext, walkingMinutes, nextPlaceName: next?.name };
      });

      // Generate content with spatial context (all places in one call so the function gets ordering)
      const contentResults = await Promise.allSettled(
        placesWithDistances.map((place: any) =>
          supabase.functions.invoke('generate-tour-content', {
            body: {
              places: [place],
              interests: mappedInterests,
              personalization,
              spatialContext: place.distanceToNext ? {
                distanceToNextMeters: place.distanceToNext,
                directionToNext: place.directionToNext,
                walkingMinutesToNext: place.walkingMinutes,
                nextPlaceName: place.nextPlaceName,
              } : undefined,
            }
          })
        )
      );

      // Merge ordered places + generated content
      const updatedPlaces = placesWithDistances.map((place: any, idx: number) => {
        const contentResult = contentResults[idx];
        const content = contentResult.status === 'fulfilled'
          ? contentResult.value?.data?.results?.[0]?.content
          : null;

        const enhanced = enhancePlace(place, content);

        // Fire-and-forget audio pre-generation for ALL stops.
        // Server-side cache prevents duplicate ElevenLabs calls on replay.
        // Prefetching everything now ensures audio is ready even if connectivity drops mid-walk.
        const narration = enhanced.generatedContent?.audioNarration;
        if (narration) {
          supabase.functions.invoke('generate-audio', {
            body: { text: narration, placeId: enhanced.id, voiceId: 'EST9Ui6982FZPSi7gCHi' }
          }).then(({ data }: any) => {
            if (data?.audioUrl) (enhanced as any)._cachedAudioUrl = data.audioUrl;
            if (data?.audioContent) (enhanced as any).preGeneratedAudio = data.audioContent;
          }).catch(() => {});
        }

        return enhanced;
      });

      tour.places = updatedPlaces;
      onTourUpdated?.({ ...tour, places: [...updatedPlaces] });

    } catch (error) {
      console.error('Error generating tour:', error);
      const msg = error instanceof Error ? error.message : String(error);

      let userFacingMessage: string;
      if (msg.includes('529') || msg.includes('overloaded')) {
        userFacingMessage = "Our AI is experiencing high demand right now. Give it a moment and try again — it usually clears up quickly.";
      } else if (msg.includes('429') || msg.includes('rate')) {
        userFacingMessage = "Too many requests — please wait a few seconds and try again.";
      } else if (msg.includes('API') || msg.includes('Claude') || msg.includes('GPT')) {
        userFacingMessage = "The AI service is temporarily unavailable. Please try again in a minute.";
      } else if (msg.includes('Failed to parse') || msg.includes('Invalid JSON')) {
        userFacingMessage = "I had trouble understanding that. Could you rephrase your request?";
      } else {
        userFacingMessage = "Something went wrong on our end. Please try again.";
      }

      const errorMessage: ChatMessage = {
        id: (Date.now() + 4).toString(),
        role: 'assistant',
        content: userFacingMessage,
        timestamp: new Date()
      };
      setMessages(prev => prev.slice(0, -1).concat([errorMessage]));
    }

    setIsGenerating(false);
  };

  return {
    messages,
    isGenerating,
    showQuickStarts,
    input,
    setInput,
    handleSend,
    quickStarts,
  };
}
