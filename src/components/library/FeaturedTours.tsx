import { CityWithPlaces } from '@/types/library';
import { TourPlan, Place, Interest } from '@/types/tour';
import { GradientOrb } from '@/components/design/GradientOrb';

interface FeaturedToursProps {
  city: CityWithPlaces;
  onPlayTour: (tour: TourPlan) => void;
}

interface FeaturedTourConfig {
  title: string;
  description: string;
  placeIds: string[];
  tone: 'casual' | 'scholarly' | 'dramatic' | 'witty';
}

const FEATURED_TOURS_BY_CITY: Record<string, FeaturedTourConfig[]> = {
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
      description: 'The city that never sleeps — at its loudest.',
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

function assembleFeaturedTour(
  config: FeaturedTourConfig,
  city: CityWithPlaces
): TourPlan | null {
  const placeMap = new Map(city.places.map(p => [p.place_id, p]));
  const resolvedPlaces = config.placeIds
    .map(id => placeMap.get(id))
    .filter(Boolean) as typeof city.places;

  if (resolvedPlaces.length === 0) return null;

  const places: Place[] = resolvedPlaces.map((cp, index) => {
    const story = cp.stories.find(s => s.tone === config.tone) || cp.stories[0];
    return {
      id: `featured-${cp.place_id}-${index}`,
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
  resolvedPlaces.forEach(cp => {
    const story = cp.stories.find(s => s.tone === config.tone) || cp.stories[0];
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
    id: `featured-tour-${Date.now()}-${config.title.replace(/\s/g, '-')}`,
    title: config.title,
    description: config.description,
    places,
    interests,
    totalDuration: places.length * 5,
    createdAt: new Date(),
    personalization: {
      travelStyle: 'first-time',
      preferredTone: config.tone,
      timeOfDay: timeOfDay as any,
    },
  };
}

export function FeaturedTours({ city, onPlayTour }: FeaturedToursProps) {
  const cityTours = FEATURED_TOURS_BY_CITY[city.slug] || [];

  const handlePlay = (config: FeaturedTourConfig) => {
    const tour = assembleFeaturedTour(config, city);
    if (tour) onPlayTour(tour);
  };

  const placeMap = new Map(city.places.map(p => [p.place_id, p]));
  const hasAnyTours = cityTours.some(config =>
    config.placeIds.some(id => placeMap.has(id))
  );

  if (!hasAnyTours) return null;

  const toneColors: Record<string, string> = {
    casual: 'var(--accent-pink)',
    scholarly: '#8B5CF6',
    dramatic: 'var(--accent-orange)',
    witty: '#14B8A6',
  };

  return (
    <div>
      <span className="section-label text-foreground/50 mb-5">Collections</span>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-snap-x scroll-fade-r mt-5" style={{ margin: '0 -24px', padding: '0 24px' }}>
        {cityTours.map((config) => {
          const resolvedPlaces = config.placeIds.map(id => placeMap.get(id)).filter(Boolean) as typeof city.places;
          if (resolvedPlaces.length === 0) return null;

          return (
            <button
              key={config.title}
              onClick={() => handlePlay(config)}
              className="group relative flex-shrink-0 snap-start text-left overflow-hidden flex flex-col justify-between bg-card hover:shadow-lg active:scale-[0.98] transition-all duration-300"
              style={{
                minWidth: 180,
                height: 120,
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                borderLeft: `3px solid ${toneColors[config.tone] || 'var(--accent-pink)'}`,
                padding: '16px 18px',
              }}
            >
              <GradientOrb size={80} opacity={0.12} blur={20} className="-top-5 -right-5" />

              <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-[0.05em] mb-1 text-muted-foreground">
                  {config.tone} &middot; {resolvedPlaces.length * 5}m
                </p>
                <h4 className="font-display text-[17px] leading-[1.15] text-foreground">{config.title}</h4>
              </div>
              <p className="relative z-10 text-[11px] leading-snug line-clamp-1 mt-1 text-muted-foreground">
                {config.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
