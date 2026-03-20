import { useState, useCallback } from 'react';
import { CityPlaceWithStories, CityData, SelectedStop, PlaceStory } from '@/types/library';
import { TourPlan, Place, Interest } from '@/types/tour';

export function useTourBuilder() {
  const [selectedStops, setSelectedStops] = useState<SelectedStop[]>([]);

  const addStop = useCallback((place: CityPlaceWithStories, tone: PlaceStory['tone'] = 'casual') => {
    setSelectedStops(prev => {
      if (prev.some(s => s.place.place_id === place.place_id)) return prev;
      return [...prev, { place, selectedTone: tone }];
    });
  }, []);

  const removeStop = useCallback((placeId: string) => {
    setSelectedStops(prev => prev.filter(s => s.place.place_id !== placeId));
  }, []);

  const toggleStop = useCallback((place: CityPlaceWithStories, tone: PlaceStory['tone'] = 'casual') => {
    setSelectedStops(prev => {
      const exists = prev.some(s => s.place.place_id === place.place_id);
      if (exists) return prev.filter(s => s.place.place_id !== place.place_id);
      return [...prev, { place, selectedTone: tone }];
    });
  }, []);

  const isSelected = useCallback((placeId: string) => {
    return selectedStops.some(s => s.place.place_id === placeId);
  }, [selectedStops]);

  const reorderStops = useCallback((fromIndex: number, toIndex: number) => {
    setSelectedStops(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  const setToneForStop = useCallback((placeId: string, tone: PlaceStory['tone']) => {
    setSelectedStops(prev =>
      prev.map(s => s.place.place_id === placeId ? { ...s, selectedTone: tone } : s)
    );
  }, []);

  const setToneForAll = useCallback((tone: PlaceStory['tone']) => {
    setSelectedStops(prev => prev.map(s => ({ ...s, selectedTone: tone })));
  }, []);

  const clear = useCallback(() => {
    setSelectedStops([]);
  }, []);

  const assembleTourPlan = useCallback((cityData: CityData): TourPlan => {
    const places: Place[] = selectedStops.map((stop, index) => {
      const story = stop.place.stories.find(s => s.tone === stop.selectedTone)
        || stop.place.stories[0];

      return {
        id: `curated-${stop.place.place_id}-${index}`,
        name: stop.place.name,
        city: cityData.name,
        country: cityData.country,
        description: story?.hook || '',
        latitude: stop.place.lat,
        longitude: stop.place.lng,
        estimatedDuration: 5,
        generatedContent: {
          overview: story?.hook || '',
          audioNarration: story?.audio_narration || '',
          hook: story?.hook || '',
          directionalCue: story?.directional_cue || '',
        },
      };
    });

    // Extract unique interests from all selected stories
    const allInterests = new Set<string>();
    selectedStops.forEach(stop => {
      const story = stop.place.stories.find(s => s.tone === stop.selectedTone) || stop.place.stories[0];
      story?.interests?.forEach(i => allInterests.add(i));
    });

    const interests: Interest[] = Array.from(allInterests).map(name => ({
      id: name,
      name,
      label: name.charAt(0).toUpperCase() + name.slice(1),
      description: '',
      icon: '',
    }));

    // Generate a descriptive title
    const neighborhoods = [...new Set(selectedStops.map(s => s.place.neighborhood))];
    const title = neighborhoods.length === 1
      ? `${neighborhoods[0]} Walking Tour`
      : `${cityData.name} Custom Tour`;

    return {
      id: `curated-tour-${Date.now()}`,
      title,
      description: `A curated ${places.length}-stop walking tour of ${cityData.name}`,
      places,
      interests,
      totalDuration: places.length * 5,
      createdAt: new Date(),
      personalization: {
        travelStyle: 'first-time',
        preferredTone: selectedStops[0]?.selectedTone || 'casual',
        timeOfDay: getTimeOfDay(),
      },
    };
  }, [selectedStops]);

  return {
    selectedStops,
    addStop,
    removeStop,
    toggleStop,
    isSelected,
    reorderStops,
    setToneForStop,
    setToneForAll,
    clear,
    assembleTourPlan,
  };
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}
