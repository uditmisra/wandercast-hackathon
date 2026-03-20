import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Search, X, List, Map, Play, ChevronLeft } from 'lucide-react';
import { useStoryLibrary } from '@/hooks/useStoryLibrary';
import { useTourBuilderContext } from '@/contexts/TourBuilderContext';
import { CityPlaceWithStories, PlaceStory } from '@/types/library';
import { CityHero } from '@/components/library/CityHero';
import { PlaceCard } from '@/components/library/PlaceCard';
import { PlaceDetailSheet } from '@/components/library/PlaceDetailSheet';
import { BuildBar } from '@/components/library/BuildBar';
import { CollectionCard } from '@/components/library/CollectionCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ExploreMapView } from '@/components/map/ExploreMapView';
import { TourPlan } from '@/types/tour';
import { buildSingleStopTour } from '@/utils/tourAssembly';
import { generateCollections, assembleCollectionTour, Collection } from '@/utils/collections';

interface ExplorePageProps {
  onPlayTour: (tour: TourPlan) => void;
}

export default function ExplorePage({ onPlayTour }: ExplorePageProps) {
  const { data: cities = [], isLoading, isError } = useStoryLibrary();
  const builder = useTourBuilderContext();
  const navigate = useNavigate();
  const { preferences } = useUserPreferences();
  const geo = useGeolocation();

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const activeCollectionId = searchParams.get('collection');
  const selectedTone = preferences.preferredTone || 'casual';

  const setSearchQuery = (v: string) => setSearchParams(p => {
    const n = new URLSearchParams(p);
    v ? n.set('q', v) : n.delete('q');
    n.delete('collection');
    return n;
  }, { replace: true });

  const setActiveCollection = (id: string | null) => setSearchParams(p => {
    const n = new URLSearchParams(p);
    id ? n.set('collection', id) : n.delete('collection');
    n.delete('q');
    return n;
  }, { replace: true });

  const [detailPlace, setDetailPlace] = useState<CityPlaceWithStories | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCityIndex, setSelectedCityIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Auto-request location if previously granted
  useEffect(() => {
    if (geo.previouslyGranted && !geo.position && !geo.loading) {
      geo.requestPermission();
    }
  }, []);

  const city = cities[selectedCityIndex] || cities[0];

  // Generate collections for the active city
  const collections = useMemo(() => {
    if (!city) return [];
    return generateCollections(city);
  }, [city]);

  // Find the active collection (if user drilled into one)
  const activeCollection = useMemo(() => {
    if (!activeCollectionId) return null;
    return collections.find(c => c.id === activeCollectionId) || null;
  }, [activeCollectionId, collections]);

  // Search results — flat place list when searching
  const searchResults = useMemo(() => {
    if (!city || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return city.places.filter(p => {
      const haystack = [
        p.name,
        p.neighborhood,
        ...p.stories.map(s => s.hook),
        ...p.stories.flatMap(s => s.interests),
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [city, searchQuery]);

  // All places for map view
  const allPlaces = useMemo(() => {
    if (!city) return [];
    if (activeCollection) return activeCollection.places;
    if (searchQuery.trim()) return searchResults;
    return city.places;
  }, [city, activeCollection, searchQuery, searchResults]);

  // Play a single place immediately
  const handlePlaySingle = useCallback((place: CityPlaceWithStories) => {
    if (!city) return;
    const tour = buildSingleStopTour(place, selectedTone, city);
    onPlayTour(tour);
  }, [city, selectedTone, onPlayTour]);

  // Play an entire collection
  const handlePlayCollection = useCallback((collection: Collection) => {
    if (!city) return;
    const tour = assembleCollectionTour(collection, city);
    onPlayTour(tour);
  }, [city, onPlayTour]);

  const handleToggleSelect = (place: CityPlaceWithStories) => {
    builder.toggleStop(place, selectedTone as PlaceStory['tone']);
  };

  const handleDetailToggle = (place: CityPlaceWithStories, tone: PlaceStory['tone']) => {
    builder.toggleStop(place, tone);
  };

  const handleBuild = () => {
    if (builder.selectedStops.length === 0 || !city) return;
    if (builder.selectedStops.length === 1) {
      const stop = builder.selectedStops[0];
      const tour = buildSingleStopTour(stop.place, stop.selectedTone, city);
      builder.clear();
      onPlayTour(tour);
      return;
    }
    navigate('/explore/build');
  };

  const handlePlayFromDetail = useCallback((tone: string) => {
    if (!detailPlace || !city) return;
    setDetailOpen(false);
    const tour = buildSingleStopTour(detailPlace, tone, city);
    onPlayTour(tour);
  }, [detailPlace, city, onPlayTour]);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-5 pb-32">
          <div className="pt-6 pb-6">
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-6 py-8">
                <div className="skeleton h-4 w-24 rounded-md mb-3" />
                <div className="skeleton h-8 w-48 rounded-md mb-2" />
                <div className="skeleton h-4 w-32 rounded-md" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="skeleton aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (isError || !city) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center max-w-xs">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-foreground font-medium">Couldn't load stories</p>
          <p className="text-sm text-foreground/40 mt-1">Check your connection and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-medium active:scale-95 transition-all duration-150 shadow-lg shadow-white/10"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ═══ COLLECTION DETAIL VIEW ═══
  if (activeCollection) {
    return (
      <div className="min-h-screen bg-background">
        {/* Collection hero */}
        <div className="relative overflow-hidden" style={{ height: 240 }}>
          <img
            src={activeCollection.imageUrl}
            alt={activeCollection.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, hsl(var(--background)) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
            }}
          />
          <button
            onClick={() => setActiveCollection(null)}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <span className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
              {activeCollection.places.length} stops &middot; {activeCollection.places.length * 5}m
            </span>
            <h1 className="font-display text-[28px] leading-[1] text-white">
              {activeCollection.title}
            </h1>
            <p className="text-sm text-white/60 mt-2 line-clamp-2">
              {activeCollection.description}
            </p>
          </div>
        </div>

        {/* Play all button */}
        <div className="max-w-2xl mx-auto px-6 pt-5 pb-3">
          <button
            onClick={() => handlePlayCollection(activeCollection)}
            className="w-full h-12 rounded-full bg-primary text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-primary/20"
          >
            <Play className="w-4 h-4" fill="currentColor" />
            Play collection
          </button>
        </div>

        {/* Place list */}
        <div className="max-w-2xl mx-auto px-6 pb-32">
          {activeCollection.places.map((place) => (
            <PlaceCard
              key={place.place_id}
              place={place}
              selectedTone={selectedTone}
              isSelected={builder.isSelected(place.place_id)}
              onToggleSelect={() => handleToggleSelect(place)}
              onTap={() => { setDetailPlace(place); setDetailOpen(true); }}
              onPlay={() => handlePlaySingle(place)}
            />
          ))}
        </div>

        <PlaceDetailSheet
          place={detailPlace}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          isSelected={detailPlace ? builder.isSelected(detailPlace.place_id) : false}
          onToggleSelect={(tone) => detailPlace && handleDetailToggle(detailPlace, tone)}
          onPlay={handlePlayFromDetail}
          defaultTone={selectedTone}
        />
        <BuildBar
          stopCount={builder.selectedStops.length}
          onBuild={handleBuild}
          onClear={builder.clear}
        />
      </div>
    );
  }

  // ═══ MAIN EXPLORE VIEW ═══
  return (
    <div className="min-h-screen bg-background">
      <div>
        <div className="max-w-6xl mx-auto px-6">
          {/* City Selector */}
          {cities.length > 1 && (
            <div className="pt-6 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
              {cities.map((c, i) => (
                <button
                  key={c.slug}
                  onClick={() => { setSelectedCityIndex(i); setActiveCollection(null); }}
                  className={`whitespace-nowrap text-sm px-5 py-2 rounded-full border transition-colors flex-shrink-0 ${
                    i === selectedCityIndex
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-foreground/60 border-white/20 hover:border-white/40'
                  }`}
                >
                  {c.name}
                  <span className="ml-1.5 text-xs opacity-60">{c.places.length}</span>
                </button>
              ))}
            </div>
          )}

          <div className="pt-3">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Explore' }]} />
          </div>

          <div className="pb-6">
            <CityHero city={city} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-32">
        {/* Search + View Toggle */}
        <div className="pb-4 flex gap-2 items-center">
          <div className="relative flex-1 panel-surface rounded-full" style={{ border: '1px solid var(--border-subtle)' }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search places, interests..."
              className="w-full h-11 pl-11 pr-10 rounded-full bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-muted-foreground hover:text-foreground/70 hover:bg-foreground/5 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex bg-white/5 rounded-full p-0.5 flex-shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-150 ${
                viewMode === 'list' ? 'bg-foreground text-background' : 'text-foreground/50 hover:text-foreground'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-150 ${
                viewMode === 'map' ? 'bg-foreground text-background' : 'text-foreground/50 hover:text-foreground'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              Map
            </button>
          </div>
        </div>

        {/* MAP VIEW */}
        {viewMode === 'map' && (
          <div className="mb-6">
            <ExploreMapView
              places={allPlaces}
              selectedPlaceIds={new Set(builder.selectedStops.map(s => s.place.place_id))}
              userLocation={geo.position}
              onPlaceTap={(place) => { setDetailPlace(place); setDetailOpen(true); }}
              className="h-[60vh] rounded-2xl overflow-hidden border border-white/10"
            />
          </div>
        )}

        {/* SEARCH RESULTS (flat list) */}
        {viewMode === 'list' && searchQuery.trim() && (
          <div className="max-w-2xl">
            <span className="section-label text-foreground/50 mb-4">
              {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
            </span>
            <div className="mt-4">
              {searchResults.map((place) => (
                <PlaceCard
                  key={place.place_id}
                  place={place}
                  selectedTone={selectedTone}
                  isSelected={builder.isSelected(place.place_id)}
                  onToggleSelect={() => handleToggleSelect(place)}
                  onTap={() => { setDetailPlace(place); setDetailOpen(true); }}
                  onPlay={() => handlePlaySingle(place)}
                />
              ))}
              {searchResults.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-foreground font-medium">No places match</p>
                  <p className="text-sm text-muted-foreground mt-1">Try a different search</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-5 py-2.5 rounded-full border border-border text-sm font-medium text-foreground/70 hover:border-foreground/30 active:scale-95 transition-all duration-150"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COLLECTIONS GRID */}
        {viewMode === 'list' && !searchQuery.trim() && (
          <div>
            <span className="section-label text-foreground/50 mb-5">Collections</span>
            <div className="grid grid-cols-2 gap-4 mt-5">
              {collections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  onTap={() => setActiveCollection(collection.id)}
                  onPlay={() => handlePlayCollection(collection)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <PlaceDetailSheet
        place={detailPlace}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isSelected={detailPlace ? builder.isSelected(detailPlace.place_id) : false}
        onToggleSelect={(tone) => detailPlace && handleDetailToggle(detailPlace, tone)}
        onPlay={handlePlayFromDetail}
        defaultTone={selectedTone}
      />
      <BuildBar
        stopCount={builder.selectedStops.length}
        onBuild={handleBuild}
        onClear={builder.clear}
      />
    </div>
  );
}
