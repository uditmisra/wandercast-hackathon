import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatHomePage from '@/pages/ChatHomePage';

// Lazy-loaded views — only fetched when user navigates to /explore or /explore/build
const ExplorePage = lazy(() => import('@/pages/ExplorePage'));
const BuildTourPage = lazy(() => import('@/pages/BuildTourPage'));
import { TourPlan } from '@/types/tour';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedAudioGuide } from '@/components/EnhancedAudioGuide';
import { TourItinerary } from '@/components/TourItinerary';
import { useTours } from '@/hooks/useTours';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { BottomMiniPlayer } from '@/components/player/BottomMiniPlayer';
import { CreateTourCTA } from '@/components/layout/CreateTourCTA';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { AuthWallModal, getAnonUsage, trackAnonTour } from '@/components/auth/AuthWallModal';
import { analytics } from '@/utils/analytics';

/** Timestamp when the current paywall/auth wall was shown (for time_on_paywall_ms). */
let paywallShownAt: number | null = null;

type AppView = 'onboarding' | 'home' | 'explore' | 'build' | 'itinerary' | 'guide';

/** Check if a tour's places already have the rich content fields */
function needsEnrichment(tour: TourPlan): boolean {
  return tour.places.some(place => {
    const gc = place.generatedContent as any;
    return gc && !gc.funFacts && !gc.lookCloserChallenge;
  });
}

/** Enrich tour places by mutating generatedContent in-place.
 *  This avoids re-rendering the guide mid-experience (no layout shift).
 *  Enriched content is picked up naturally when the user navigates to a new stop. */
async function enrichTourInPlace(tour: TourPlan): Promise<void> {
  try {
    console.log('[Enrich] Enriching tour:', tour.title, 'places:', tour.places.length);
    const { data: contentData, error } = await supabase.functions.invoke('generate-tour-content', {
      body: {
        places: tour.places,
        interests: tour.interests,
        personalization: tour.personalization,
      }
    });

    if (error) {
      console.error('[Enrich] Content generation error:', error);
      return;
    }

    // Mutate each place's generatedContent directly — no new objects, no re-render
    for (const place of tour.places) {
      const result = contentData?.results?.find((r: any) => r.placeId === place.id);
      const content = result?.content;
      if (!content) continue;

      const gc = (place.generatedContent || {}) as any;
      gc.storyType = content.storyType;
      gc.funFacts = content.funFacts;
      gc.lookCloserChallenge = content.lookCloserChallenge;
      gc.suggestedQuestions = content.suggestedQuestions;
      gc.transitionToNext = content.transitionToNext;
      // Only overwrite narration/hook if they were empty
      if (!gc.audioNarration && content.audioNarration) gc.audioNarration = content.audioNarration;
      if (!gc.hook && content.hook) gc.hook = content.hook;
      if (!gc.directionalCue && content.directionalCue) gc.directionalCue = content.directionalCue;
      place.generatedContent = gc;
    }

    console.log('[Enrich] Done, sources:', contentData?.results?.map((r: any) => r.source).join(', '));
  } catch (err) {
    console.error('[Enrich] Failed:', err);
  }
}

const Index = () => {
  const [currentTour, setCurrentTour] = useState<TourPlan | null>(null);
  const [isGuide, setIsGuide] = useState(false);
  const [isItinerary, setIsItinerary] = useState(false);
  // Mini-player state: track the last active tour when user exits guide
  const [miniPlayerTour, setMiniPlayerTour] = useState<TourPlan | null>(null);
  const [miniPlayerStopIndex, setMiniPlayerStopIndex] = useState(0);
  const [enrichmentVersion, setEnrichmentVersion] = useState(0);
  const { user, loading: authLoading } = useAuth();
  const { data: savedTours = [] } = useTours();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const enrichingTourIdRef = useRef<string | null>(null); // tracks which tour is being enriched

  // ── Auth wall for second tour (anonymous users) ──
  const [showTourAuthWall, setShowTourAuthWall] = useState(false);
  const pendingTourRef = useRef<TourPlan | null>(null);

  /** Save the current in-memory tour to the new user's library.
   *  Called by EnhancedAudioGuide after a user signs up via the stop-gate auth wall. */
  const saveTourToLibrary = async () => {
    const tour = currentTour;
    if (!tour) return;
    try {
      console.log('[Index] Saving tour post-auth:', tour.title);
      const { data, error } = await supabase.functions.invoke('save-tour', {
        body: {
          title: tour.title,
          description: tour.description,
          places: tour.places,
          interests: tour.interests,
          personalization: tour.personalization,
        }
      });
      if (!error && !data?.error && data?.tour?.id) {
        tour.id = data.tour.id;
        setCurrentTour(prev => prev ? { ...prev, id: data.tour.id } : prev);
        queryClient.invalidateQueries({ queryKey: ['tours'] });
        analytics.tourSaved({ tourId: data.tour.id, title: tour.title, stopCount: tour.places.length, trigger: 'post-auth' });
        console.log('[Index] Tour saved post-auth:', data.tour.id);
      }
    } catch (err) {
      console.error('[Index] Failed to save tour post-auth:', err);
    }
  };

  // Determine view from route path
  const getView = (): AppView => {
    if (isGuide && currentTour) return 'guide';
    if (isItinerary && currentTour) return 'itinerary';
    const path = location.pathname;
    if (path === '/explore/build') return 'build';
    if (path === '/explore') return 'explore';
    // Smart redirect at '/': first visit → onboarding, returning → chat home
    const hasVisited = localStorage.getItem('wandercast_hasVisited');
    return hasVisited ? 'home' : 'onboarding';
  };

  const currentView = getView();

  // Handle incoming tour from Dashboard (navigate with state)
  useEffect(() => {
    const state = location.state as any;
    const incomingTour = state?.playTour as TourPlan | undefined;
    if (incomingTour) {
      setCurrentTour(incomingTour);
      if (incomingTour.places.length > 1) {
        setIsItinerary(true);
      } else {
        setIsGuide(true);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handlePlayTour = async (tour: TourPlan) => {
    console.log('[Index] handlePlayTour called:', tour.title, 'places:', tour.places.length, 'hasPending:', tour.places.some(p => !!(p.generatedContent as any)?._pending));

    // Auth wall disabled for local development / hackathon testing
    // if (!user) {
    //   const usage = getAnonUsage();
    //   if (usage.toursPlayed >= 1) {
    //     pendingTourRef.current = tour;
    //     setShowTourAuthWall(true);
    //     return;
    //   }
    //   trackAnonTour();
    // }

    // Fire tour_created for all newly played tours (dashboard replays go through useEffect, not here)
    const tourNumber = user ? savedTours.length + 1 : getAnonUsage().toursPlayed;
    analytics.tourCreated({
      title: tour.title,
      city: tour.places[0]?.city,
      stop_count: tour.places.length,
      tour_number: tourNumber,
    });

    // Eagerly pre-generate audio for the first stop BEFORE mounting the guide.
    // Store the promise on the place object so EnhancedAudioGuide can await it
    // instead of firing a duplicate request.
    const firstPlace = tour.places[0];
    const firstNarration = (firstPlace?.generatedContent as any)?.audioNarration;
    if (firstPlace && firstNarration && !(firstPlace as any).preGeneratedAudio && !(firstPlace as any)._audioPromise) {
      const promise = supabase.functions.invoke('generate-audio', {
        body: { text: firstNarration, placeId: firstPlace.id, voiceId: 'EST9Ui6982FZPSi7gCHi' }
      }).then(({ data, error }) => {
        if (error || data?.error) {
          console.error('[Index] Audio pre-gen failed:', data?.errorCode || 'UNKNOWN', data?.error || error?.message);
          delete (firstPlace as any)._audioPromise;
          return null;
        }
        // Store audioUrl for persistent caching, base64 for immediate playback
        if (data?.audioUrl) (firstPlace as any)._cachedAudioUrl = data.audioUrl;
        if (data?.audioContent) (firstPlace as any).preGeneratedAudio = data.audioContent;
        delete (firstPlace as any)._audioPromise;
        return data?.audioUrl
          ? { url: data.audioUrl, base64: data.audioContent }
          : data?.audioContent || null;
      }).catch((err) => {
        console.error('[Index] Audio pre-gen exception:', err);
        delete (firstPlace as any)._audioPromise;
        return null;
      });
      (firstPlace as any)._audioPromise = promise;
    }

    // Show tour IMMEDIATELY — don't block on enrichment
    setCurrentTour(tour);

    // Multi-stop tours show itinerary first; single-stop go straight to guide
    if (tour.places.length > 1) {
      setIsItinerary(true);
    } else {
      setIsGuide(true);
    }

    // Background: enrich content if needed (funFacts, lookCloser, etc.)
    // Skip if places are pending — InlineTourChat is generating content in parallel (faster).
    const hasPendingPlaces = tour.places.some(p => !!(p.generatedContent as any)?._pending);
    if (!hasPendingPlaces && needsEnrichment(tour)) {
      enrichingTourIdRef.current = tour.id;
      enrichTourInPlace(tour).then(() => {
        if (enrichingTourIdRef.current === tour.id) {
          setEnrichmentVersion(v => v + 1);
        }
      }).finally(() => {
        if (enrichingTourIdRef.current === tour.id) enrichingTourIdRef.current = null;
      });
    }

    // Save to database if user is authenticated and tour is new
    if (user && !savedTours.find(t => t.id === tour.id)) {
      try {
        console.log('[Index] Saving tour:', tour.title, 'places:', tour.places.length);
        const { data, error } = await supabase.functions.invoke('save-tour', {
          body: {
            title: tour.title,
            description: tour.description,
            places: tour.places,
            interests: tour.interests,
            personalization: tour.personalization
          }
        });
        if (error) {
          console.error('[Index] save-tour invoke error:', error);
        } else if (data?.error) {
          console.error('[Index] save-tour server error:', data.error);
        } else {
          console.log('[Index] Tour saved successfully:', data);
          // Persist the DB-generated tour ID so sharing works
          if (data?.tour?.id) {
            tour.id = data.tour.id;
            setCurrentTour(prev => prev ? { ...prev, id: data.tour.id } : prev);
            analytics.tourSaved({ tourId: data.tour.id, title: tour.title, stopCount: tour.places.length, trigger: 'auto' });
          }
          queryClient.invalidateQueries({ queryKey: ['tours'] });
        }
      } catch (error) {
        console.error('[Index] Failed to save tour:', error);
      }
    }
  };

  /** Called by InlineTourChat when background content generation completes.
   *  Replaces tour state so the player picks up real content (no more _pending). */
  const handleTourUpdated = (updatedTour: TourPlan) => {
    setCurrentTour(prev => {
      if (!prev || prev.id !== updatedTour.id) return prev;
      return updatedTour;
    });
    setEnrichmentVersion(v => v + 1);

    // Now that content is available, pre-generate audio for the first stop
    const firstPlace = updatedTour.places[0];
    const firstNarration = (firstPlace?.generatedContent as any)?.audioNarration;
    if (firstPlace && firstNarration && !(firstPlace as any).preGeneratedAudio && !(firstPlace as any)._audioPromise) {
      const promise = supabase.functions.invoke('generate-audio', {
        body: { text: firstNarration, placeId: firstPlace.id, voiceId: 'EST9Ui6982FZPSi7gCHi' }
      }).then(({ data, error }) => {
        if (error || data?.error) {
          console.error('[Index] Audio pre-gen (update) failed:', data?.errorCode || 'UNKNOWN', data?.error || error?.message);
          delete (firstPlace as any)._audioPromise;
          return null;
        }
        if (data?.audioUrl) (firstPlace as any)._cachedAudioUrl = data.audioUrl;
        if (data?.audioContent) (firstPlace as any).preGeneratedAudio = data.audioContent;
        delete (firstPlace as any)._audioPromise;
        return data?.audioUrl
          ? { url: data.audioUrl, base64: data.audioContent }
          : data?.audioContent || null;
      }).catch((err) => {
        console.error('[Index] Audio pre-gen (update) exception:', err);
        delete (firstPlace as any)._audioPromise;
        return null;
      });
      (firstPlace as any)._audioPromise = promise;
    }

    // Run enrichment for funFacts/challenges if the content doesn't have them
    if (needsEnrichment(updatedTour)) {
      enrichingTourIdRef.current = updatedTour.id;
      enrichTourInPlace(updatedTour).then(() => {
        if (enrichingTourIdRef.current === updatedTour.id) {
          setEnrichmentVersion(v => v + 1);
        }
      }).finally(() => {
        if (enrichingTourIdRef.current === updatedTour.id) enrichingTourIdRef.current = null;
      });
    }
  };

  const handleBackToExplore = () => {
    // Keep tour in mini-player when exiting guide
    if (isGuide && currentTour) {
      setMiniPlayerTour(currentTour);
    }
    setIsGuide(false);
    setIsItinerary(false);
    setCurrentTour(null);
    enrichingTourIdRef.current = null;
  };

  const handleStartFromItinerary = () => {
    setIsItinerary(false);
    setIsGuide(true);
  };

  const handleBrowseLibrary = () => {
    localStorage.setItem('wandercast_hasVisited', 'true');
    navigate('/');
  };

  const handleResumeMiniPlayer = () => {
    if (miniPlayerTour) {
      // Attach the current stop index so the guide resumes at the right place
      const resumeTour = { ...miniPlayerTour, currentStopIndex: miniPlayerStopIndex };
      setCurrentTour(resumeTour);
      setIsGuide(true);
      setMiniPlayerTour(null);
    }
  };

  const handleDismissMiniPlayer = () => {
    setMiniPlayerTour(null);
  };

  const handleMiniPlayerNext = () => {
    if (miniPlayerTour) {
      setMiniPlayerStopIndex(i => Math.min(i + 1, miniPlayerTour.places.length - 1));
    }
  };

  const handleMiniPlayerPrevious = () => {
    setMiniPlayerStopIndex(i => Math.max(i - 1, 0));
  };

  const handleTourAuthSuccess = () => {
    setShowTourAuthWall(false);
    paywallShownAt = null;
    if (pendingTourRef.current) {
      const tour = pendingTourRef.current;
      pendingTourRef.current = null;
      handlePlayTour(tour);
    }
  };

  const handleTourAuthDismiss = () => {
    if (paywallShownAt !== null) {
      analytics.paywallDismissed({ trigger: 'tour_limit', time_on_paywall_ms: Date.now() - paywallShownAt });
      paywallShownAt = null;
    }
    setShowTourAuthWall(false);
    pendingTourRef.current = null;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground/10 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  // Tour auth wall — shown when anonymous user tries to play second tour
  if (showTourAuthWall) {
    return (
      <AuthWallModal
        variant="tour-gate"
        onAuthenticated={handleTourAuthSuccess}
        onDismiss={handleTourAuthDismiss}
      />
    );
  }

  // Onboarding — full screen, no nav
  if (currentView === 'onboarding') {
    return <OnboardingFlow onComplete={handleBrowseLibrary} />;
  }

  // Chat home — full screen, no nav (AI-native landing)
  if (currentView === 'home') {
    return (
      <ChatHomePage
        onTourGenerated={handlePlayTour}
        onTourUpdated={handleTourUpdated}
      />
    );
  }

  // Itinerary view — full screen, no nav
  if (currentView === 'itinerary' && currentTour) {
    return (
      <TourItinerary
        tour={currentTour}
        onStart={handleStartFromItinerary}
        onBack={handleBackToExplore}
      />
    );
  }

  // Guide view — full screen, no nav
  if (currentView === 'guide' && currentTour) {
    return (
      <EnhancedAudioGuide
        tour={currentTour}
        initialStopIndex={(currentTour as any).currentStopIndex ?? 0}
        onBack={handleBackToExplore}
        enrichmentVersion={enrichmentVersion}
        onPostAuthSave={saveTourToLibrary}
      />
    );
  }

  return (
    <AppLayout onTourGenerated={handlePlayTour} onTourUpdated={handleTourUpdated}>
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-foreground/10 border-t-foreground rounded-full animate-spin" /></div>}>
        {currentView === 'explore' && (
          <ExplorePage
            onPlayTour={handlePlayTour}
          />
        )}
        {currentView === 'build' && (
          <BuildTourPage onPlayTour={handlePlayTour} />
        )}
      </Suspense>

      {/* "Create a tour" CTA — always visible on explore/home views */}
      <CreateTourCTA
        onTourGenerated={handlePlayTour}
        onTourUpdated={handleTourUpdated}
      />

      {/* Bottom mini-player — shown when user exits guide but tour is still active */}
      {miniPlayerTour && (
        <BottomMiniPlayer
          tour={miniPlayerTour}
          currentPlace={miniPlayerTour.places[miniPlayerStopIndex] || miniPlayerTour.places[0]}
          currentStopIndex={miniPlayerStopIndex}
          totalStops={miniPlayerTour.places.length}
          isPlaying={false}
          onPlayPause={handleResumeMiniPlayer}
          onResume={handleResumeMiniPlayer}
          onNext={handleMiniPlayerNext}
          onPrevious={handleMiniPlayerPrevious}
          onDismiss={handleDismissMiniPlayer}
        />
      )}
    </AppLayout>
  );
};

export default Index;
