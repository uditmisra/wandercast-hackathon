import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, List, Heart, LayoutDashboard, Share2 } from 'lucide-react';
import { Place, TourPlan } from '@/types/tour';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { MinimalAudioPlayer } from './MinimalAudioPlayer';
import { VoiceAgentPanel } from './VoiceAgentPanel';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { MapView } from './map/MapView';
import { useNavigate } from 'react-router-dom';
import { useTourProgress } from '@/hooks/useTourProgress';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { AuthWallModal } from '@/components/auth/AuthWallModal';
import { PostAuthPreferences } from '@/components/auth/PostAuthPreferences';
import { TourCompletionCard } from '@/components/TourCompletionCard';
import { analytics } from '@/utils/analytics';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface EnhancedAudioGuideProps {
  tour: TourPlan;
  initialStopIndex?: number;
  onBack: () => void;
  /** Bumped when background enrichment completes — triggers re-render to pick up mutated content */
  enrichmentVersion?: number;
  /** Called after a user authenticates via the in-tour auth wall so the parent can persist the tour */
  onPostAuthSave?: () => void;
}

export function EnhancedAudioGuide({ tour, initialStopIndex = 0, onBack, enrichmentVersion, onPostAuthSave }: EnhancedAudioGuideProps) {
  const [currentStopIndex, setCurrentStopIndex] = useState(initialStopIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [remainingQuestions, setRemainingQuestions] = useState(10);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const generationIdRef = useRef(0); // incremented per stop to cancel stale generations
  const currentStopIndexRef = useRef(currentStopIndex);
  const prefetchingRef = useRef<Set<string>>(new Set());
  const hasAutoPlayedRef = useRef(false); // track whether user gesture unlocked autoplay
  const { toast } = useToast();
  const { user } = useAuth();
  const { toggleBookmark, isPlaceBookmarked, isToggling } = useBookmarks();
  const navigate = useNavigate();
  const { saveProgress } = useTourProgress(tour.id);
  const { preferences, updatePreferences } = useUserPreferences();

  // ── Auth wall: first stop free, gate the rest ──
  const [showAuthWall, setShowAuthWall] = useState(false);
  const [showPostAuthPrefs, setShowPostAuthPrefs] = useState(false);
  const pendingStopRef = useRef<number | null>(null);

  // ── Voice agent (ElevenLabs Conversational AI) ──
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);
  const voiceAgent = useVoiceAgent({
    onStart: () => {
      // Pause narration audio when voice agent connects
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    },
    onEnd: () => {
      setShowVoiceAgent(false);
    },
  });

  /** Returns true if navigation is blocked (auth required) */
  const requireAuth = (targetIndex: number): boolean => {
    if (user) return false;
    if (targetIndex === 0) return false;
    pendingStopRef.current = targetIndex;
    setShowAuthWall(true);
    return true;
  };

  const handleAuthSuccess = () => {
    setShowAuthWall(false);
    // Show quick preference picker before resuming tour
    setShowPostAuthPrefs(true);
    // Save this tour to the new user's library
    onPostAuthSave?.();
  };

  const handlePrefsComplete = () => {
    setShowPostAuthPrefs(false);
    if (pendingStopRef.current !== null) {
      clearAudio();
      setCurrentStopIndex(pendingStopRef.current);
      saveProgress(pendingStopRef.current);
      pendingStopRef.current = null;
    }
  };

  const handleAuthDismiss = () => {
    setShowAuthWall(false);
    pendingStopRef.current = null;
  };

  const handleStoryFeedback = (storyType: string, direction: 'more' | 'less') => {
    const current = preferences.favoriteStoryTypes || [];
    let updated: string[];
    if (direction === 'more') {
      updated = current.includes(storyType) ? current : [...current, storyType];
    } else {
      updated = current.filter(t => t !== storyType);
    }
    updatePreferences({ favoriteStoryTypes: updated });
    analytics.storyFeedback({ storyType, direction });
  };

  const currentPlace = tour.places[currentStopIndex];
  const isPlacePending = (place: Place) => !!(place.generatedContent as any)?._pending;
  const rawNextPlace = currentStopIndex < tour.places.length - 1 ? tour.places[currentStopIndex + 1] : undefined;
  const nextPlace = rawNextPlace && !isPlacePending(rawNextPlace) ? rawNextPlace : undefined;
  const nextPlacePending = rawNextPlace && isPlacePending(rawNextPlace);
  const previousPlace = currentStopIndex > 0 ? tour.places[currentStopIndex - 1] : undefined;

  // Track tour started on mount
  useEffect(() => {
    analytics.tourStarted({
      tourId: tour.id,
      title: tour.title,
      stopCount: tour.places.length,
      isResume: initialStopIndex > 0,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.ontimeupdate = null;
        audioRef.current.onloadedmetadata = null;
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Onboarding toast (first visit only)
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenAudioGuideOnboarding');
    if (!hasSeenOnboarding) {
      setTimeout(() => {
        toast({
          title: "Your audio tour is starting",
          description: "Audio plays automatically at each stop. Tap pause anytime.",
          duration: 4000,
        });
        localStorage.setItem('hasSeenAudioGuideOnboarding', 'true');
      }, 500);
    }
  }, []);

  // ═══════════════════════════════════════════════
  // Core audio engine
  // ═══════════════════════════════════════════════

  /** Fetch audio for a place. Returns { base64?, url? } — at least one set.
   *  Priority: cached URL > in-memory audio > _audioPromise > generate-audio edge fn.
   *  The edge function itself checks server-side cache before calling ElevenLabs. */
  const fetchAudio = useCallback(async (place: Place): Promise<{ base64?: string; url?: string } | null> => {
    // 1. Persistent cached audio URL (from previous play or saved tour)
    const cachedUrl = (place as any)._cachedAudioUrl || (place as any).audioUrl || (place as any).audio_url;
    if (cachedUrl) {
      console.log('[Audio] Using cached URL:', cachedUrl);
      return { url: cachedUrl };
    }

    // 2. In-memory cached audio from this session
    if ((place as any).preGeneratedAudio) {
      const audio = (place as any).preGeneratedAudio;
      delete (place as any).preGeneratedAudio;
      return { base64: audio, url: (place as any)._cachedAudioUrl };
    }

    // 3. Await in-flight request started by Index.tsx (eager prefetch)
    if ((place as any)._audioPromise) {
      const result = await (place as any)._audioPromise;
      if (result) {
        if (typeof result === 'object' && (result.base64 || result.url)) return result;
        if (typeof result === 'string') return { base64: result };
      }
      if ((place as any).preGeneratedAudio) {
        const audio = (place as any).preGeneratedAudio;
        delete (place as any).preGeneratedAudio;
        return { base64: audio };
      }
    }

    // 4. Call generate-audio edge function (checks server cache before ElevenLabs)
    const narration = (place.generatedContent as any)?.audioNarration;
    if (!narration) return null;

    const { data, error } = await supabase.functions.invoke('generate-audio', {
      body: { text: narration, placeId: place.id, voiceId: 'EST9Ui6982FZPSi7gCHi' }
    });

    if (error || data?.error) {
      const errorCode = data?.errorCode || 'UNKNOWN';
      const errorMsg = data?.error || error?.message || 'Audio generation failed';
      console.error('[Audio] fetchAudio failed:', errorCode, errorMsg);
      throw new Error(`${errorCode}:${errorMsg}`);
    }

    // Store URL on place for future use (avoids re-calling edge fn)
    if (data?.audioUrl) {
      (place as any)._cachedAudioUrl = data.audioUrl;
    }

    // Server returned URL-only (cache hit) or URL + base64 (new generation)
    if (data?.audioUrl && !data?.audioContent) {
      return { url: data.audioUrl };
    }
    return { base64: data?.audioContent, url: data?.audioUrl };
  }, []);

  /** Prefetch audio for a place (fire-and-forget, deduped) */
  const prefetchAudio = useCallback((place: Place) => {
    if ((place as any).preGeneratedAudio || (place as any)._cachedAudioUrl) return;
    if (prefetchingRef.current.has(place.id)) return;
    const narration = (place.generatedContent as any)?.audioNarration;
    if (!narration) return;

    prefetchingRef.current.add(place.id);
    supabase.functions.invoke('generate-audio', {
      body: { text: narration, placeId: place.id, voiceId: 'EST9Ui6982FZPSi7gCHi' }
    }).then(({ data }) => {
      if (data?.audioUrl) (place as any)._cachedAudioUrl = data.audioUrl;
      if (data?.audioContent) (place as any).preGeneratedAudio = data.audioContent;
    }).catch(() => {}).finally(() => {
      prefetchingRef.current.delete(place.id);
    });
  }, []);

  // Prefetch audio for ALL stops on mount — ensures audio is ready even if connectivity drops mid-walk.
  // Deduplication in prefetchAudio prevents double-fetching stops already handled by the chat engine.
  useEffect(() => {
    for (const place of tour.places) {
      if (!isPlacePending(place)) {
        prefetchAudio(place);
      }
    }
  }, [tour.places]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Create an Audio element from base64 content OR a URL */
  const createAudioElement = useCallback((source: { base64?: string; url?: string }, onEnded: () => void) => {
    // Tear down any existing audio first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.src = '';
    }

    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = volume;
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', (e) => {
      if (!audio.src || audio.src === '' || audio.src === window.location.href) return;
      console.error('[Audio] Error:', audio.error?.code, audio.error?.message, e);
      setIsPlaying(false);
    });

    if (source.url) {
      // Use persistent URL directly — no base64 decoding needed
      audio.src = source.url;
    } else if (source.base64) {
      try {
        const binaryStr = atob(source.base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        audio.src = URL.createObjectURL(blob);
      } catch {
        audio.src = `data:audio/mpeg;base64,${source.base64}`;
      }
    }

    return audio;
  }, [volume]);

  /** The main "play this stop" function. Generates audio if needed, then plays. */
  const playCurrentStop = useCallback(async (stopIndex: number) => {
    const myGenerationId = ++generationIdRef.current;
    const place = tour.places[stopIndex];
    if (!place || isPlacePending(place)) return;

    const narration = (place.generatedContent as any)?.audioNarration;
    if (!narration) return;

    setIsGeneratingAudio(true);
    setCurrentTime(0);
    setDuration(0);

    try {
      const audioResult = await fetchAudio(place);

      // Stale check: user may have navigated away during generation
      if (generationIdRef.current !== myGenerationId) return;

      if (!audioResult || (!audioResult.base64 && !audioResult.url)) {
        setIsGeneratingAudio(false);
        toast({ title: 'No Audio Available', description: 'Audio narration could not be generated for this stop. The tour content is still available to read.', variant: 'destructive', duration: 5000 });
        return;
      }

      const nextIdx = stopIndex + 1;
      const nextP = nextIdx < tour.places.length ? tour.places[nextIdx] : null;

      const audio = createAudioElement(audioResult, () => {
        setIsPlaying(false);
        setCurrentTime(0);
        analytics.audioCompleted({ tourId: tour.id, stopIndex, stopName: place.name });
        if (nextP && !isPlacePending(nextP)) {
          toast({ title: "Ready for Next Stop", description: `Head to ${nextP.name} when ready` });
        } else if (!nextP) {
          analytics.tourCompleted({ tourId: tour.id, title: tour.title, stopCount: tour.places.length });
          // Show the tour completion + social sharing card
          setShowCompletionCard(true);
          // Fire referral reward check (fire-and-forget)
          supabase.functions.invoke('grant-referral-rewards').catch(() => {});
        }
      });

      setIsGeneratingAudio(false);

      // Try to play — may fail without user gesture
      try {
        await audio.play();
        setIsPlaying(true);
        hasAutoPlayedRef.current = true;
        analytics.audioPlayed({ tourId: tour.id, stopIndex, stopName: place.name });
      } catch (playErr: any) {
        if (playErr?.name === 'NotAllowedError') {
          // Browser blocked autoplay — user will tap play button to start
          // Audio element is set up and ready, just needs a user gesture
          console.log('[Audio] Autoplay blocked, waiting for user tap');
        } else {
          throw playErr;
        }
      }

      // Prefetch next stop in background
      if (nextP && !isPlacePending(nextP)) prefetchAudio(nextP);

    } catch (err: any) {
      if (generationIdRef.current !== myGenerationId) return;
      console.error('[Audio] Failed:', err);
      setIsGeneratingAudio(false);

      // Parse error code for user-friendly messages
      const errMsg = err?.message || '';
      const errorCode = errMsg.split(':')[0] || 'UNKNOWN';
      analytics.audioError({ tourId: tour.id, stopIndex, errorCode });
      let title = 'Audio Error';
      let description = "Couldn't generate audio. Tap play to retry.";

      if (errMsg.includes('ELEVENLABS_QUOTA_EXCEEDED')) {
        title = 'Credits Exhausted';
        description = 'ElevenLabs character quota has been exceeded. The tour content is still available to read.';
      } else if (errMsg.includes('ELEVENLABS_RATE_LIMIT')) {
        title = 'Too Many Requests';
        description = 'Audio generation is rate-limited. Wait a moment and tap play to retry.';
      } else if (errMsg.includes('ELEVENLABS_AUTH_ERROR')) {
        title = 'Service Configuration Error';
        description = 'Audio service credentials are invalid. Please contact support.';
      }

      toast({ title, description, variant: 'destructive', duration: 6000 });
    }
  }, [tour.places, fetchAudio, createAudioElement, prefetchAudio, toast]);

  // ═══════════════════════════════════════════════
  // Auto-play: trigger on mount and on stop change
  // ═══════════════════════════════════════════════
  useEffect(() => {
    currentStopIndexRef.current = currentStopIndex;
    playCurrentStop(currentStopIndex);
  }, [currentStopIndex]); // intentionally NOT including playCurrentStop to avoid re-triggers on tour updates

  // Re-attempt playback when enrichment completes (content arrives for pending places)
  // Uses ref to avoid stale closure on currentStopIndex
  useEffect(() => {
    if (enrichmentVersion && enrichmentVersion > 0 && !isPlaying && !isGeneratingAudio) {
      playCurrentStop(currentStopIndexRef.current);
    }
  }, [enrichmentVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  /** User taps play/pause button */
  const handlePlayPause = async () => {
    if (!currentPlace) return;

    // Pause
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      analytics.audioPaused({ tourId: tour.id, stopIndex: currentStopIndex, currentTime, duration });
      return;
    }

    // Resume existing audio (paused or autoplay-blocked)
    if (audioRef.current && audioRef.current.src) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        hasAutoPlayedRef.current = true;
        return;
      } catch {
        // Fall through to re-generate
      }
    }

    // No audio element yet (or play failed) — generate from scratch
    await playCurrentStop(currentStopIndex);
  };

  // ═══════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════

  const clearAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.src = '';
      audioRef.current.load();
      audioRef.current = null;
    }
    generationIdRef.current++; // cancel any in-flight generation
    setIsGeneratingAudio(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleNext = () => {
    if (currentStopIndex < tour.places.length - 1) {
      const nextIndex = currentStopIndex + 1;
      if (requireAuth(nextIndex)) return;
      clearAudio();
      setCurrentStopIndex(nextIndex);
      saveProgress(nextIndex);
      analytics.stopViewed({ tourId: tour.id, stopIndex: nextIndex, totalStops: tour.places.length, stopName: tour.places[nextIndex].name, method: 'next' });
    }
  };

  const handlePrevious = () => {
    if (currentStopIndex > 0) {
      const prevIndex = currentStopIndex - 1;
      if (requireAuth(prevIndex)) return;
      clearAudio();
      setCurrentStopIndex(prevIndex);
      saveProgress(prevIndex);
      analytics.stopViewed({ tourId: tour.id, stopIndex: prevIndex, totalStops: tour.places.length, stopName: tour.places[prevIndex].name, method: 'previous' });
    }
  };

  const handleSeek = (value: number[]) => { if (audioRef.current) { audioRef.current.currentTime = value[0]; setCurrentTime(value[0]); } };
  const handleVolumeChange = (value: number[]) => { const v = value[0]; setVolume(v); if (audioRef.current) audioRef.current.volume = v; };
  const handleQuestionAsked = () => { setRemainingQuestions(prev => Math.max(0, prev - 1)); analytics.questionAsked({ tourId: tour.id, stopIndex: currentStopIndex, remainingQuestions: remainingQuestions - 1 }); toast({ title: "Question Asked", description: `${remainingQuestions - 1} questions remaining` }); };

  const goToStop = (index: number) => {
    if (requireAuth(index)) return;
    clearAudio();
    setCurrentStopIndex(index);
    saveProgress(index);
    analytics.stopViewed({ tourId: tour.id, stopIndex: index, totalStops: tour.places.length, stopName: tour.places[index].name, method: 'direct' });
  };

  // Persist tone preference when user progresses past 50% of stops
  useEffect(() => {
    if (currentStopIndex >= Math.floor(tour.places.length * 0.5)) {
      const tone = tour.personalization?.preferredTone;
      if (tone && tone !== preferences.preferredTone) {
        updatePreferences({ preferredTone: tone });
      }
    }
  }, [currentStopIndex]);

  const [isSharing, setIsSharing] = useState(false);
  const [showCompletionCard, setShowCompletionCard] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const shareText = tour.description || `Check out this audio tour: ${tour.title}`;

      // For logged-in users with a saved tour, generate a shareable link
      if (user) {
        try {
          const { data, error } = await supabase.functions.invoke('share-tour', {
            body: { tourId: tour.id }
          });

          if (!error && data?.slug) {
            const shareUrl = `https://hdzfffutbzpevblbpgjc.supabase.co/functions/v1/shared-tour-og?slug=${data.slug}`;
            if (navigator.share) {
              await navigator.share({ title: tour.title, text: shareText, url: shareUrl });
              analytics.tourShared({ tourId: tour.id, method: 'native-share' });
            } else {
              await navigator.clipboard.writeText(shareUrl);
              analytics.tourShared({ tourId: tour.id, method: 'clipboard' });
              toast({ title: 'Link Copied', description: 'Share link copied to clipboard.' });
            }
            return;
          }
        } catch {
          // Fall through to basic share
        }
      }

      // Fallback: native share or clipboard with tour info (no link)
      if (navigator.share) {
        await navigator.share({
          title: tour.title,
          text: `${tour.title} — ${tour.places.length} stops\n\n${shareText}`,
        });
      } else {
        const text = `${tour.title} — ${tour.places.length} stops: ${tour.places.map(p => p.name).join(', ')}`;
        await navigator.clipboard.writeText(text);
        toast({ title: 'Copied', description: 'Tour info copied to clipboard.' });
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Share failed:', err);
      toast({ title: 'Share Failed', description: 'Could not share this tour.', variant: 'destructive' });
    } finally {
      setIsSharing(false);
    }
  };

  const bookmarked = isPlaceBookmarked(currentPlace.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Tour completion + social sharing overlay */}
      {showCompletionCard && (
        <TourCompletionCard
          tour={tour}
          onDismiss={() => { setShowCompletionCard(false); onBack(); }}
        />
      )}

      {/* Auth wall overlay */}
      {showAuthWall && (
        <AuthWallModal
          variant="stop-gate"
          onAuthenticated={handleAuthSuccess}
          onDismiss={handleAuthDismiss}
        />
      )}

      {/* Post-signup preference picker — capture tone & interests before resuming tour */}
      {showPostAuthPrefs && (
        <PostAuthPreferences onComplete={handlePrefsComplete} />
      )}

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-white/5" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { clearAudio(); onBack(); }} className="flex items-center gap-1.5 text-foreground/50 hover:text-foreground active:scale-95 transition-all duration-150 text-sm font-medium p-2 -ml-2 rounded-full min-h-[44px]">
              <ArrowLeft className="w-4 h-4" />
              Exit
            </button>
            {user && (
              <button onClick={() => navigate('/dashboard')} className="flex items-center justify-center text-foreground/30 hover:text-foreground transition-colors p-2.5 min-w-[44px] min-h-[44px] rounded-full">
                <LayoutDashboard className="w-4 h-4" />
              </button>
            )}
          </div>

          <span className="text-sm font-medium text-foreground">
            {currentStopIndex + 1} / {tour.places.length}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="p-2 rounded-full hover:bg-white/5 transition-colors"
              aria-label="Share tour"
            >
              <Share2 className={`w-5 h-5 transition-colors ${isSharing ? 'text-foreground/20 animate-pulse' : 'text-[#888] hover:text-foreground/60'}`} />
            </button>
            {user && (
              <button
                onClick={() => {
                  const willBookmark = !bookmarked;
                  toggleBookmark({ type: 'place', targetId: currentPlace.id });
                  analytics.bookmarkToggled({ type: 'place', targetId: currentPlace.id, bookmarked: willBookmark });
                  toast({
                    title: bookmarked ? 'Removed' : 'Saved',
                    description: bookmarked ? 'Removed from bookmarks' : 'Added to bookmarks',
                    duration: 1500,
                  });
                }}
                disabled={isToggling}
                className={`p-2 rounded-full hover:bg-white/5 transition-all duration-150 active:scale-125 ${isToggling ? 'opacity-50' : ''}`}
              >
                <Heart className={`w-5 h-5 transition-all duration-200 ${bookmarked ? 'fill-foreground text-foreground scale-110' : 'text-[#888]'}`} />
              </button>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <button className="flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground font-medium p-2 rounded-full hover:bg-white/5 transition-colors">
                  <List className="w-4 h-4" />
                </button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="font-display text-xl">{tour.title}</SheetTitle>
                  <SheetDescription>{tour.places.length} stops</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-1">
                  {tour.places.map((place, index) => {
                    const pending = isPlacePending(place);
                    return (
                      <button
                        key={place.id}
                        className={`w-full text-left p-4 rounded-xl flex items-center gap-3 transition-colors ${
                          pending ? 'opacity-50 cursor-default' :
                          index === currentStopIndex ? 'bg-white/5 text-foreground' : 'hover:bg-white/5 text-foreground/60'
                        }`}
                        onClick={() => !pending && goToStop(index)}
                        disabled={pending}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          pending ? 'bg-white/5 text-foreground/30 animate-pulse' :
                          index === currentStopIndex ? 'bg-foreground text-background' : 'bg-white/5 text-foreground/50'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{place.name}</div>
                          <div className="text-xs text-foreground/40">
                            {pending ? 'Preparing...' : place.city}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main content — desktop split layout */}
      <div className="pt-14 lg:grid lg:grid-cols-2 lg:min-h-[calc(100vh-3.5rem)]">
        {/* Map panel */}
        <div className="relative lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)]">
          <MapView
            places={tour.places}
            currentStopIndex={currentStopIndex}
            className="h-[35vh] lg:h-full"
            onMarkerClick={goToStop}
          />
        </div>

        {/* Player panel */}
        <div className="lg:overflow-y-auto lg:h-[calc(100vh-3.5rem)] relative" key={currentStopIndex}>
          <div className="animate-fade-in">
            <MinimalAudioPlayer
              currentPlace={currentPlace}
              nextPlace={nextPlace}
              previousPlace={previousPlace}
              currentStopNumber={currentStopIndex + 1}
              totalStops={tour.places.length}
              isPlaying={isPlaying}
              isGeneratingAudio={isGeneratingAudio}
              currentTime={currentTime}
              duration={duration}
              remainingQuestions={remainingQuestions}
              nextPlacePending={!!nextPlacePending}
              tourContext={{ title: tour.title, interests: tour.interests, personalization: tour.personalization }}
              onPlayPause={handlePlayPause}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSeek={handleSeek}
              onQuestionAsked={handleQuestionAsked}
              onStoryFeedback={handleStoryFeedback}
              onTalkToGuide={() => {
                setShowVoiceAgent(true);
                voiceAgent.startConversation(currentPlace, {
                  title: tour.title,
                  interests: tour.interests,
                  personalization: tour.personalization,
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* Voice Agent Panel */}
      {showVoiceAgent && (
        <VoiceAgentPanel
          status={voiceAgent.status as 'connecting' | 'connected' | 'disconnected'}
          isSpeaking={voiceAgent.isSpeaking}
          guideName={voiceAgent.guideName}
          placeName={currentPlace.name}
          error={voiceAgent.error}
          onEnd={() => {
            voiceAgent.endConversation();
            setShowVoiceAgent(false);
          }}
          getInputByteFrequencyData={voiceAgent.getInputByteFrequencyData}
          getOutputByteFrequencyData={voiceAgent.getOutputByteFrequencyData}
        />
      )}
    </div>
  );
}
