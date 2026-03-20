import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, ArrowRight } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { ChatInputBar } from '@/components/chat/ChatInputBar';
import { ChatConversation } from '@/components/chat/ChatConversation';
import { useTourChatEngine } from '@/hooks/useTourChatEngine';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useStoryLibrary } from '@/hooks/useStoryLibrary';
import { useAuth } from '@/contexts/AuthContext';
import { TourPlan } from '@/types/tour';
import { CityPlaceWithStories, CityWithPlaces } from '@/types/library';
import { HomeMapView, NativePOI } from '@/components/map/HomeMapView';
import { PoiBottomSheet } from '@/components/map/PoiBottomSheet';
import { buildSingleStopTour, buildPoiTour } from '@/utils/tourAssembly';
import { supabase } from '@/integrations/supabase/client';
import { analytics } from '@/utils/analytics';

interface ChatHomePageProps {
  onTourGenerated: (tour: TourPlan) => void;
  onTourUpdated?: (tour: TourPlan) => void;
}

export default function ChatHomePage({ onTourGenerated, onTourUpdated }: ChatHomePageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const geo = useGeolocation();
  const { data: cities = [] } = useStoryLibrary();

  // Read prefillPrompt from location.state
  const prefillPrompt = (location.state as any)?.prefillPrompt as string | undefined;

  const {
    messages,
    isGenerating,
    showQuickStarts,
    input,
    setInput,
    handleSend,
    quickStarts,
  } = useTourChatEngine({
    onTourGenerated,
    onTourUpdated,
    prefillPrompt,
    userLocation: geo.position ? {
      ...geo.position,
      city: geo.city,
      country: geo.country,
      neighbourhood: geo.neighbourhood,
    } : null,
  });

  // Clear location state after reading prefillPrompt
  useEffect(() => {
    if (prefillPrompt) {
      window.history.replaceState({}, document.title);
    }
  }, [prefillPrompt]);

  // Request location on mount — the map experience needs GPS
  useEffect(() => {
    if (!geo.position && !geo.loading) {
      geo.requestPermission();
    }
  }, []);

  // Wrap handleSend with analytics tracking
  const trackedSend = useCallback((text: string) => {
    analytics.chatMessageSent({ isFirstMessage: messages.length <= 1, hasLocation: !!geo.position });
    handleSend(text);
  }, [handleSend, messages.length, geo.position]);

  // Track whether the user has started chatting (more than the initial assistant message)
  const isChatting = messages.length > 1;
  const [inputFocused, setInputFocused] = useState(false);

  const handleLocationRequest = () => {
    if (geo.position && (geo.neighbourhood || geo.city)) {
      // Use neighbourhood for hyperlocal prompt, fall back to city
      const area = geo.neighbourhood || geo.city;
      trackedSend(`Show me what's within walking distance in ${area}`);
    } else {
      geo.requestPermission();
    }
  };

  const handleQuickStart = (text: string) => {
    analytics.quickStartTapped({ text, hasLocation: !!geo.position });
    trackedSend(text);
  };

  const handleMapPinTap = useCallback((place: CityPlaceWithStories, city: CityWithPlaces) => {
    analytics.poiTapped({ poiName: place.name, type: 'curated' });
    const tour = buildSingleStopTour(place, 'casual', city);
    onTourGenerated(tour); // tour_created fired in Index.handlePlayTour
  }, [onTourGenerated]);

  // Native POI tap — show bottom sheet
  const [selectedPoi, setSelectedPoi] = useState<NativePOI | null>(null);

  const handleNativePOITap = useCallback((poi: NativePOI) => {
    analytics.poiTapped({ poiName: poi.name, type: 'native' });
    setSelectedPoi(poi);
  }, []);

  const handleGeneratePoiStory = useCallback(async (poi: NativePOI) => {
    setSelectedPoi(null); // tour_created fired in Index.handlePlayTour

    // 1. Show the player immediately with "Preparing your story…" state
    const cityName = geo.city || '';
    const countryName = geo.country || '';
    const neighbourhood = geo.neighbourhood || undefined;
    const tour = buildPoiTour(poi, 'casual', {
      city: cityName,
      country: countryName,
      neighbourhood,
    });
    onTourGenerated(tour);
    try {
      const { data, error } = await supabase.functions.invoke('generate-tour-content', {
        body: {
          places: [{
            id: tour.places[0].id,
            name: poi.name,
            city: cityName,
            country: countryName,
            neighbourhood,
            description: poi.category ? `A ${poi.category} worth exploring` : `Discover ${poi.name}`,
            estimatedDuration: 5,
          }],
          interests: [{ id: poi.category || 'history', name: poi.category || 'history' }],
          personalization: { preferredTone: 'casual' },
        },
      });

      if (error || !data?.results?.[0]?.content) {
        console.error('[ChatHomePage] POI content generation failed:', error);
        return;
      }

      // 3. Merge generated content into the tour and push update
      const content = data.results[0].content;
      const updatedPlace = {
        ...tour.places[0],
        city: cityName,
        country: countryName,
        neighbourhood,
        generatedContent: {
          overview: content.hook || '',
          audioNarration: content.audioNarration || '',
          hook: content.hook || '',
          directionalCue: content.directionalCue || '',
          storyType: content.storyType,
          funFacts: content.funFacts,
          lookCloserChallenge: content.lookCloserChallenge,
          suggestedQuestions: content.suggestedQuestions,
        },
      };
      const updatedTour: TourPlan = {
        ...tour,
        places: [updatedPlace],
      };
      onTourUpdated?.(updatedTour);
    } catch (err) {
      console.error('[ChatHomePage] POI content generation exception:', err);
    }
  }, [onTourGenerated, onTourUpdated, geo.city, geo.country, geo.neighbourhood]);

  const handleBack = () => {
    // Reload the page to reset chat state
    window.location.href = '/';
  };

  // ─── Chatting mode: messages + fixed input at bottom ───
  if (isChatting) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-white/5">
          <div className="max-w-lg mx-auto px-4 h-12 flex items-center">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-white/5 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 flex justify-center">
              <BrandLogo size="sm" className="opacity-60" />
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="max-w-lg mx-auto px-4 py-4">
            <ChatConversation messages={messages} isGenerating={isGenerating} />
          </div>
        </div>

        {/* Fixed input bar */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t border-white/5">
          <div className="max-w-lg mx-auto px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <ChatInputBar
              value={input}
              onChange={setInput}
              onSubmit={trackedSend}
              isProcessing={isGenerating}
              placeholder="Ask me anything..."
              showLocationButton={!!geo.position}
              locationAvailable={!!geo.position}
              onLocationRequest={handleLocationRequest}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── Home mode: map background + floating content ───
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Warm gradient fallback — visible if map doesn't load */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(var(--accent-pink-rgb), 0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(var(--accent-orange-rgb), 0.1) 0%, transparent 50%)',
        }}
      />

      {/* Full-screen map background */}
      <HomeMapView
        cities={cities}
        userLocation={geo.position}
        onPlaceTap={handleMapPinTap}
        onNativePOITap={handleNativePOITap}
        className="absolute inset-0 w-full h-full"
      />

      {/* Gradient overlay — lighter at top so map shows, solid at bottom for text */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(11,11,11,0.05) 30%, rgba(11,11,11,0.3) 55%, rgba(11,11,11,0.92) 80%, rgba(11,11,11,1) 100%)',
        }}
      />

      {/* Floating content at bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-6 pb-24" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="w-full max-w-md flex flex-col items-center gap-5">
          {/* Brand */}
          <BrandLogo size="lg" className="opacity-90" />

          {/* Headline */}
          <div className={`text-center transition-all duration-300 ${inputFocused ? 'opacity-50 -translate-y-2' : ''}`}>
            <h1 className="font-display text-3xl font-bold text-white">
              Where are you headed?
            </h1>
            <p className="text-sm text-white/60 mt-2">
              A city, a mood, a curiosity. That's all I need.
            </p>
          </div>

          {/* Chat Input Bar */}
          <div className="w-full" onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)}>
            <ChatInputBar
              value={input}
              onChange={setInput}
              onSubmit={trackedSend}
              isProcessing={isGenerating}
              showLocationButton={true}
              locationAvailable={!!geo.position}
              onLocationRequest={handleLocationRequest}
            />
          </div>

          {/* Quick start pills */}
          <div className={`flex flex-wrap justify-center gap-2 transition-all duration-300 ${inputFocused ? 'opacity-0 translate-y-2 pointer-events-none' : ''}`}>
            {/* Location-aware pill */}
            {geo.position && (geo.neighbourhood || geo.city) && (
              <button
                onClick={() => handleQuickStart(`Show me what's within walking distance in ${geo.neighbourhood || geo.city}`)}
                disabled={isGenerating}
                className="text-xs px-3.5 py-2.5 min-h-[44px] rounded-full border border-accent-orange/30 bg-accent-orange/10 text-accent-orange hover:border-accent-orange/50 hover:bg-accent-orange/15 active:scale-95 transition-all duration-150 disabled:opacity-50 flex items-center gap-1.5"
              >
                <MapPin className="w-3 h-3" />
                Explore {geo.neighbourhood || 'near me'}
              </button>
            )}

            {quickStarts.map((qs, i) => (
              <button
                key={i}
                onClick={() => handleQuickStart(qs)}
                disabled={isGenerating}
                className="text-xs px-3.5 py-2.5 min-h-[44px] rounded-full border border-white/15 text-white/60 hover:border-white/30 hover:text-white active:scale-95 transition-all duration-150 disabled:opacity-50"
              >
                {qs}
              </button>
            ))}
          </div>

          {/* Browse curated stories link */}
          <button
            onClick={() => navigate('/explore')}
            className="flex items-center gap-2.5 text-sm font-medium text-white/60 hover:text-white transition-colors group rounded-full px-5 py-3 bg-white/10 backdrop-blur-lg border border-white/10"
          >
            Or explore the story library
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer */}
      {!user && (
        <div className="absolute bottom-2 left-0 right-0 z-10 text-center" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <button
            onClick={() => navigate('/auth')}
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Sign in
          </button>
        </div>
      )}

      {/* Native POI bottom sheet */}
      <PoiBottomSheet
        poi={selectedPoi}
        open={!!selectedPoi}
        onOpenChange={(open) => { if (!open) setSelectedPoi(null); }}
        onGenerateStory={handleGeneratePoiStory}
      />
    </div>
  );
}
