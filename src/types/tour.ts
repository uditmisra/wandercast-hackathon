
export interface Place {
  id: string;
  name: string;
  city: string;
  country: string;
  neighbourhood?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  estimatedDuration: number; // in minutes
  generatedContent?: GeneratedContent;
  audioUrl?: string;
}

export interface GeneratedContent {
  overview: string;
  audioNarration: string;
  hook?: string;
  directionalCue?: string;
  storyType?: string;
  funFacts?: string[];
  lookCloserChallenge?: string;
  suggestedQuestions?: string[];
  transitionToNext?: string;
  architecture?: string;
  history?: string;
  culture?: string;
  food?: string;
  artAndMuseums?: string;
  shopping?: string;
  ghostStories?: string;
  localSecrets?: string;
}

export interface EnhancedContent extends GeneratedContent {
  quickSnippet: string;
  deepDive: string;
  localSecret: string;
  interactivePrompts: string[];
  personalizedHook: string;
}

export interface TourPlan {
  id: string;
  title: string;
  description: string;
  places: Place[];
  interests: Interest[];
  totalDuration: number;
  createdAt: Date;
  personalization?: {
    travelStyle: 'first-time' | 'repeat' | 'local' | 'explorer';
    preferredTone: 'casual' | 'scholarly' | 'dramatic' | 'witty';
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  };
}

export interface PersonalizedTourPlan extends TourPlan {
  personalization: {
    travelStyle: 'first-time' | 'repeat' | 'local' | 'explorer';
    preferredTone: 'casual' | 'scholarly' | 'dramatic' | 'witty';
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  };
}

export interface Interest {
  id: string;
  name: string; // The interest type identifier (e.g., "history", "architecture")
  label: string; // The display name (e.g., "History", "Architecture")
  description: string;
  icon: string;
}

export const AVAILABLE_INTERESTS: Interest[] = [
  { id: 'architecture', name: 'architecture', label: 'Architecture', description: 'Building styles, design, and structural history', icon: '🏛️' },
  { id: 'history', name: 'history', label: 'History', description: 'Historical events, timelines, and significant moments', icon: '📜' },
  { id: 'culture', name: 'culture', label: 'Culture & Traditions', description: 'Local customs, traditions, and cultural practices', icon: '🎭' },
  { id: 'food', name: 'food', label: 'Food & Cuisine', description: 'Local dishes, food history, and culinary traditions', icon: '🍽️' },
  { id: 'art', name: 'art', label: 'Art & Museums', description: 'Artistic heritage, galleries, and cultural exhibitions', icon: '🎨' },
  { id: 'shopping', name: 'shopping', label: 'Shopping & Markets', description: 'Local markets, unique shopping, and artisan crafts', icon: '🛍️' },
  { id: 'ghost', name: 'ghost', label: 'Ghost Stories & Legends', description: 'Supernatural tales, legends, and mysterious stories', icon: '👻' },
  { id: 'secrets', name: 'secrets', label: 'Local Secrets', description: 'Hidden gems, insider tips, and off-the-beaten-path spots', icon: '🗝️' },
  { id: 'nature', name: 'nature', label: 'Nature & Parks', description: 'Natural landscapes, parks, and outdoor spaces', icon: '🌳' },
  { id: 'religion', name: 'religion', label: 'Religious Sites', description: 'Religious history, spiritual significance, and sacred spaces', icon: '⛪' }
];
