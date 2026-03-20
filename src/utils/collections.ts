import { CityPlaceWithStories, CityWithPlaces } from '@/types/library';
import { TourPlan, Place, Interest } from '@/types/tour';
import { getPlaceImage, getCollectionImage, getCityHeroImage } from '@/utils/cityImages';

export interface Collection {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  places: CityPlaceWithStories[];
  tone: string;
  type: 'curated' | 'highlight' | 'neighborhood';
}

interface CuratedConfig {
  title: string;
  description: string;
  placeIds: string[];
  tone: string;
}

const CURATED_TOURS: Record<string, CuratedConfig[]> = {
  london: [
    {
      title: 'Westminster Classics',
      description: 'The iconic heart of London — palaces, parliament, and power.',
      placeIds: ['london_buckingham_palace', 'london_westminster_abbey', 'london_palace_of_westminster', 'london_whitehall', 'london_churchill_war_rooms'],
      tone: 'casual',
    },
    {
      title: 'South Bank Art Walk',
      description: 'Culture, creativity, and river views from Eye to Globe.',
      placeIds: ['london_london_eye', 'london_south_bank', 'london_millennium_bridge', 'london_tate_modern', 'london_shakespeares_globe'],
      tone: 'witty',
    },
    {
      title: "London's Hidden Stories",
      description: 'The dramatic tales most visitors never hear.',
      placeIds: ['london_buckingham_palace', 'london_st_jamess_park', 'london_10_downing_street_viewpoint', 'london_south_bank', 'london_shakespeares_globe', 'london_tate_modern'],
      tone: 'dramatic',
    },
  ],
  paris: [
    {
      title: 'Ile de la Cité Walk',
      description: 'Medieval Paris — cathedrals, bridges, and hidden chapels.',
      placeIds: ['paris_notre_dame', 'paris_sainte_chapelle', 'paris_pont_neuf'],
      tone: 'scholarly',
    },
    {
      title: 'Montmartre & Beyond',
      description: 'Art, views, and village charm above the city.',
      placeIds: ['paris_sacre_coeur', 'paris_montmartre', 'paris_le_marais'],
      tone: 'casual',
    },
    {
      title: 'Grand Paris Icons',
      description: 'The landmarks that define the city — and their secrets.',
      placeIds: ['paris_eiffel_tower', 'paris_louvre', 'paris_musee_dorsay', 'paris_palais_royal'],
      tone: 'dramatic',
    },
  ],
  rome: [
    {
      title: 'Ancient Rome',
      description: 'Gladiators, emperors, and ruins that still stand.',
      placeIds: ['rome_colosseum', 'rome_roman_forum', 'rome_pantheon'],
      tone: 'scholarly',
    },
    {
      title: 'Piazza Crawl',
      description: 'The squares that define Roman life.',
      placeIds: ['rome_piazza_navona', 'rome_campo_de_fiori', 'rome_spanish_steps', 'rome_trevi_fountain'],
      tone: 'casual',
    },
    {
      title: 'Hidden Rome',
      description: 'The secrets most visitors walk right past.',
      placeIds: ['rome_aventine_keyhole', 'rome_mouth_of_truth', 'rome_trastevere', 'rome_borghese_gallery'],
      tone: 'witty',
    },
  ],
  'new-york': [
    {
      title: 'Lower Manhattan Icons',
      description: 'Where the American story began.',
      placeIds: ['nyc_statue_of_liberty', 'nyc_brooklyn_bridge', 'nyc_911_memorial'],
      tone: 'dramatic',
    },
    {
      title: 'Midtown Essentials',
      description: "The city that never sleeps — at its loudest.",
      placeIds: ['nyc_times_square', 'nyc_grand_central', 'nyc_rockefeller_center'],
      tone: 'casual',
    },
    {
      title: 'Chelsea to Village',
      description: 'Creative New York on foot.',
      placeIds: ['nyc_high_line', 'nyc_chelsea_market', 'nyc_greenwich_village', 'nyc_flatiron'],
      tone: 'witty',
    },
  ],
};

/** Generate all browsable collections for a city */
export function generateCollections(city: CityWithPlaces): Collection[] {
  const collections: Collection[] = [];
  const placeMap = new Map(city.places.map(p => [p.place_id, p]));
  const cityImage = getCityHeroImage(city.slug);

  // 1. Must-See Highlights — always first
  const mustSee = city.places.filter(p => p.must_see);
  if (mustSee.length > 0) {
    const heroPlace = mustSee[0];
    collections.push({
      id: `${city.slug}-highlights`,
      title: 'Must-See Highlights',
      description: `The ${mustSee.length} places you simply can't miss`,
      imageUrl: getPlaceImage(heroPlace.place_id) || cityImage,
      places: mustSee,
      tone: 'casual',
      type: 'highlight',
    });
  }

  // 2. Curated themed collections
  const configs = CURATED_TOURS[city.slug] || [];
  for (const config of configs) {
    const resolved = config.placeIds
      .map(id => placeMap.get(id))
      .filter((p): p is CityPlaceWithStories => !!p);
    if (resolved.length === 0) continue;

    collections.push({
      id: `${city.slug}-${config.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: config.title,
      description: config.description,
      imageUrl: getCollectionImage(config.title) || getPlaceImage(resolved[0].place_id) || cityImage,
      places: resolved,
      tone: config.tone,
      type: 'curated',
    });
  }

  // 3. Neighborhood collections — for areas with 3+ places
  const neighborhoods = new Map<string, CityPlaceWithStories[]>();
  for (const place of city.places) {
    const n = place.neighborhood || 'Other';
    if (!neighborhoods.has(n)) neighborhoods.set(n, []);
    neighborhoods.get(n)!.push(place);
  }

  // Sort neighborhoods by must-see count, then alphabetically
  const sortedNeighborhoods = Array.from(neighborhoods.entries())
    .filter(([, places]) => places.length >= 3)
    .sort((a, b) => {
      const aMustSee = a[1].filter(p => p.must_see).length;
      const bMustSee = b[1].filter(p => p.must_see).length;
      if (bMustSee !== aMustSee) return bMustSee - aMustSee;
      return a[0].localeCompare(b[0]);
    });

  for (const [name, places] of sortedNeighborhoods) {
    const heroPlace = places.find(p => p.must_see) || places[0];
    collections.push({
      id: `${city.slug}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: name,
      description: `${places.length} stories from ${name}`,
      imageUrl: getPlaceImage(heroPlace.place_id) || cityImage,
      places,
      tone: 'casual',
      type: 'neighborhood',
    });
  }

  return collections;
}

/** Assemble a playable TourPlan from a collection */
export function assembleCollectionTour(collection: Collection, city: CityWithPlaces): TourPlan {
  const places: Place[] = collection.places.map((cp, index) => {
    const story = cp.stories.find(s => s.tone === collection.tone) || cp.stories[0];
    return {
      id: `collection-${cp.place_id}-${index}`,
      name: cp.name,
      city: city.name,
      country: city.country,
      description: story?.hook || '',
      latitude: cp.lat,
      longitude: cp.lng,
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
  });

  const allInterests = new Set<string>();
  collection.places.forEach(cp => {
    const story = cp.stories.find(s => s.tone === collection.tone) || cp.stories[0];
    story?.interests?.forEach(i => allInterests.add(i));
  });

  const interests: Interest[] = Array.from(allInterests).map(name => ({
    id: name, name,
    label: name.charAt(0).toUpperCase() + name.slice(1),
    description: '', icon: '',
  }));

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

  return {
    id: `collection-tour-${Date.now()}-${collection.id}`,
    title: collection.title,
    description: collection.description,
    places,
    interests,
    totalDuration: places.length * 5,
    createdAt: new Date(),
    personalization: {
      travelStyle: 'first-time',
      preferredTone: collection.tone as any,
      timeOfDay: timeOfDay as any,
    },
  };
}
