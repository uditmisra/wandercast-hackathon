export interface CityData {
  id: string;
  slug: string;
  name: string;
  country: string;
}

export interface CityPlace {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  neighborhood: string;
  must_see: boolean;
}

export interface PlaceStory {
  id: string;
  place_id: string;
  interests: string[];
  tone: 'casual' | 'scholarly' | 'dramatic' | 'witty';
  audio_narration: string;
  hook: string;
  directional_cue: string;
  story_type?: string;
  fun_facts?: string[];
  look_closer_challenge?: string;
  suggested_questions?: string[];
}

export interface CityPlaceWithStories extends CityPlace {
  stories: PlaceStory[];
}

export interface CityWithPlaces extends CityData {
  places: CityPlaceWithStories[];
}

export interface SelectedStop {
  place: CityPlaceWithStories;
  selectedTone: 'casual' | 'scholarly' | 'dramatic' | 'witty';
}
