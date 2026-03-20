import { useState, useEffect, useRef } from 'react';
import { Play, SkipBack, Eye, Search, Check, ArrowRight, Sparkles, MessageCircle, BookOpen, ChevronDown } from 'lucide-react';
import { WaveformVisualizer } from '@/components/player/WaveformVisualizer';
import { Slider } from '@/components/ui/slider';
import { Place } from '@/types/tour';
import { UnifiedQuestionInput } from './UnifiedQuestionInput';

interface MinimalAudioPlayerProps {
  currentPlace: Place;
  nextPlace?: Place;
  previousPlace?: Place;
  currentStopNumber: number;
  totalStops: number;
  isPlaying: boolean;
  isGeneratingAudio?: boolean;
  currentTime: number;
  duration: number;
  remainingQuestions: number;
  nextPlacePending?: boolean;
  tourContext: {
    title: string;
    interests: any[];
    personalization: any;
  };
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (value: number[]) => void;
  onQuestionAsked: () => void;
  onStoryFeedback?: (storyType: string, direction: 'more' | 'less') => void;
}

const AUDIO_PHRASES = [
  'Preparing your narration...',
  'Getting the voice ready...',
  'Almost there...',
];

function AudioPreparingIndicator() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setPhraseIndex(prev => (prev + 1) % AUDIO_PHRASES.length);
        setFade(true);
      }, 200);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 mb-3 px-3 py-3 bg-white/[0.03] border border-white/5 rounded-xl animate-fade-in">
      {/* Mini waveform bars */}
      <div className="flex items-center gap-[3px] h-4 flex-shrink-0">
        {[0, 1, 2, 3, 4].map(i => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-primary/60"
            style={{
              animation: 'audio-wave 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
              height: '4px',
            }}
          />
        ))}
      </div>
      <span
        className="text-xs text-muted-foreground font-medium transition-opacity duration-200"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {AUDIO_PHRASES[phraseIndex]}
      </span>
    </div>
  );
}

type PillType = 'lookCloser' | 'facts' | 'ask';

export function MinimalAudioPlayer({
  currentPlace,
  nextPlace,
  previousPlace,
  currentStopNumber,
  totalStops,
  isPlaying,
  isGeneratingAudio,
  currentTime,
  duration,
  remainingQuestions,
  nextPlacePending,
  tourContext,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onQuestionAsked,
}: MinimalAudioPlayerProps) {
  const [expandedPill, setExpandedPill] = useState<PillType | null>(null);
  const [foundChallenge, setFoundChallenge] = useState(false);
  const [showNarration, setShowNarration] = useState(false);

  // Reset state when place changes
  useEffect(() => {
    setExpandedPill(null);
    setFoundChallenge(false);
    setShowNarration(false);
  }, [currentPlace.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const gc = currentPlace.generatedContent as any;
  const isPending = !!gc?._pending;
  const hook = gc?.hook;
  const directionalCue = gc?.directionalCue;
  const narrationText = gc?.audioNarration;
  const funFacts = gc?.funFacts as string[] | undefined;
  const lookCloserChallenge = gc?.lookCloserChallenge as string | undefined;
  const suggestedQuestions = gc?.suggestedQuestions as string[] | undefined;

  const togglePill = (pill: PillType) => setExpandedPill(prev => prev === pill ? null : pill);

  const hasPills = lookCloserChallenge || (funFacts && funFacts.length > 0) || true; // "Ask" is always available

  return (
    <div className="bg-background" style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="w-full max-w-lg mx-auto px-5 py-5">

        {/* ═══ HEADER ROW: place name + play button ═══ */}
        <div className="flex items-center justify-between gap-3 mb-1">
          <h1 className="font-display text-xl sm:text-2xl text-foreground truncate">
            <span className="text-muted-foreground text-lg mr-1.5">
              {currentStopNumber < 10 ? `0${currentStopNumber}` : currentStopNumber}.
            </span>
            {currentPlace.name}
          </h1>

          <button
            onClick={onPlayPause}
            disabled={isGeneratingAudio || isPending}
            className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
              isPending
                ? 'bg-foreground/10 text-muted-foreground'
                : 'bg-foreground text-background hover:scale-105 active:scale-95 disabled:opacity-70'
            }`}
          >
            {isPending ? (
              <div className="w-4 h-4 border-2 border-foreground/15 border-t-foreground/40 rounded-full animate-spin" />
            ) : isGeneratingAudio ? (
              <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : isPlaying ? (
              <WaveformVisualizer isPlaying barCount={3} className="h-3" variant="micro" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </div>

        {/* ═══ SUBTITLE: city + stop counter (clean, no badges or feedback) ═══ */}
        <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-medium mb-3">
          {(currentPlace as any).neighbourhood || currentPlace.city} · Stop {currentStopNumber} of {totalStops}
        </p>

        {/* ═══ CONTENT PENDING STATE ═══ */}
        {isPending && (
          <div className="animate-fade-in mb-4 space-y-3">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary/40 border-t-primary rounded-full animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Preparing your story</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Writing a personalized narration for this stop...</p>
                </div>
              </div>
            </div>
            {/* Skeleton cards */}
            <div className="space-y-2">
              <div className="skeleton h-4 w-3/4 rounded-md" />
              <div className="skeleton h-4 w-full rounded-md" />
              <div className="skeleton h-4 w-2/3 rounded-md" />
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-10 w-28 rounded-full" />
              <div className="skeleton h-10 w-20 rounded-full" />
              <div className="skeleton h-10 w-16 rounded-full" />
            </div>
          </div>
        )}

        {/* ═══ AUDIO PREPARING STATE ═══ */}
        {!isPending && isGeneratingAudio && narrationText && (
          <AudioPreparingIndicator />
        )}

        {/* ═══ PROGRESS BAR ═══ */}
        {duration > 0 && (
          <div className="mb-3">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={onSeek}
              className="w-full"
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] font-medium text-muted-foreground">{formatTime(currentTime)}</span>
              <span className="text-[10px] font-medium text-muted-foreground">{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* ═══ HOOK CARD (dark, consistent with page) ═══ */}
        {!isPending && hook && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-4 mb-3">
            <p className="text-[15px] font-medium text-foreground/90 leading-relaxed">{hook}</p>
            {/* Only show directional cue here if there's no lookCloserChallenge — otherwise Look Closer pill handles it */}
            {directionalCue && !lookCloserChallenge && (
              <div className="flex items-start gap-2 mt-3 pt-3 border-t border-white/[0.08]">
                <Eye className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-[13px] text-muted-foreground leading-relaxed">{directionalCue}</p>
              </div>
            )}
          </div>
        )}
        {/* Standalone directional cue when no hook (and no lookCloserChallenge) */}
        {!isPending && !hook && directionalCue && !lookCloserChallenge && (
          <div className="flex items-start gap-2.5 mb-3 p-3 bg-white/[0.04] border border-white/[0.08] rounded-lg">
            <Eye className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-[13px] text-muted-foreground leading-relaxed">{directionalCue}</p>
          </div>
        )}

        {/* ═══ READ ALONG ═══ */}
        {!isPending && narrationText && (
          <>
            <button
              onClick={() => setShowNarration(!showNarration)}
              className="w-full flex items-center justify-between gap-3 p-3 mb-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium text-muted-foreground">
                  {showNarration || isGeneratingAudio ? 'Hide narration' : 'Read along'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showNarration || isGeneratingAudio ? 'rotate-180' : ''}`} />
            </button>
            {(showNarration || isGeneratingAudio) && (
              <div className="mb-3 p-4 bg-white/[0.03] border border-white/5 rounded-lg animate-fade-in -mt-1">
                <p className="text-sm text-muted-foreground leading-relaxed">{narrationText}</p>
              </div>
            )}
          </>
        )}

        {/* ═══ PILL BUTTONS ═══ */}
        {!isPending && hasPills && (
          <div className="flex gap-2 flex-wrap mb-3">
            {lookCloserChallenge && (
              <button
                onClick={() => togglePill('lookCloser')}
                className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 min-h-[44px] rounded-full border transition-all duration-150 active:scale-95 ${
                  expandedPill === 'lookCloser'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-transparent text-primary border-primary/30 hover:border-primary/60'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Look Closer
              </button>
            )}

            {funFacts && funFacts.length > 0 && (
              <button
                onClick={() => togglePill('facts')}
                className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 min-h-[44px] rounded-full border transition-all duration-150 active:scale-95 ${
                  expandedPill === 'facts'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent text-muted-foreground border-white/10 hover:border-white/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Facts
                <span className="text-[10px] opacity-60">{funFacts.length}</span>
              </button>
            )}

            <button
              onClick={() => togglePill('ask')}
              className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 min-h-[44px] rounded-full border transition-all duration-150 active:scale-95 ${
                expandedPill === 'ask'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-muted-foreground border-white/10 hover:border-white/20'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Ask
              {remainingQuestions > 0 && (
                <span className="text-[10px] opacity-60">{remainingQuestions}</span>
              )}
            </button>
          </div>
        )}

        {/* ═══ EXPANSION ZONE ═══ */}

        {/* Look Closer Challenge */}
        {expandedPill === 'lookCloser' && lookCloserChallenge && (
          <div className="animate-fade-in mb-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-3">
              <p className="text-sm text-foreground/80 leading-relaxed">{lookCloserChallenge}</p>
              <button
                onClick={() => setFoundChallenge(!foundChallenge)}
                className={`flex items-center gap-2 text-xs font-medium px-4 py-2.5 min-h-[44px] rounded-full transition-all duration-200 active:scale-95 ${
                  foundChallenge
                    ? 'bg-primary text-white'
                    : 'bg-card border border-primary/30 text-primary hover:bg-primary/10'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${foundChallenge ? 'animate-bounce' : ''}`} />
                {foundChallenge ? 'Found it!' : 'I found it!'}
              </button>
            </div>
          </div>
        )}

        {/* Fun Facts */}
        {expandedPill === 'facts' && funFacts && funFacts.length > 0 && (
          <div className="animate-fade-in mb-4">
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-5 px-5 scrollbar-hide scroll-fade-r overscroll-x-contain">
              {funFacts.map((fact, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[260px] snap-center bg-card border border-white/10 rounded-lg p-4"
                >
                  <p className="text-sm text-muted-foreground leading-relaxed">{fact}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ask Your Guide */}
        {expandedPill === 'ask' && (
          <div className="animate-fade-in mb-4">
            <UnifiedQuestionInput
              currentPlace={currentPlace}
              tourContext={tourContext}
              remainingQuestions={remainingQuestions}
              onQuestionAsked={onQuestionAsked}
              suggestedQuestions={suggestedQuestions}
            />
          </div>
        )}
      </div>

      {/* ═══ STICKY BOTTOM NAV BAR ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-white/10" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Previous */}
            <button
              onClick={onPrevious}
              disabled={!previousPlace}
              className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-full border border-white/10 text-muted-foreground text-xs font-medium disabled:opacity-20 hover:bg-white/5 active:scale-95 transition-all"
            >
              <SkipBack className="w-3.5 h-3.5" />
              Prev
            </button>

            {/* Stop dots */}
            <div className="flex-1 flex items-center justify-center gap-1">
              {Array.from({ length: totalStops }, (_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i + 1 === currentStopNumber
                      ? 'w-2 h-2 bg-foreground'
                      : i + 1 < currentStopNumber
                      ? 'w-1.5 h-1.5 bg-foreground/40'
                      : 'w-1.5 h-1.5 bg-foreground/15'
                  }`}
                />
              ))}
            </div>

            {/* Next */}
            {nextPlace ? (
              <button
                onClick={onNext}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-foreground text-background text-xs font-semibold uppercase tracking-wider hover:bg-foreground/90 active:scale-95 transition-all"
              >
                {nextPlace.name.length > 18 ? nextPlace.name.slice(0, 18) + '...' : nextPlace.name}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : nextPlacePending ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-foreground/10 text-muted-foreground text-xs font-medium">
                <div className="w-3 h-3 border-2 border-foreground/20 border-t-foreground/60 rounded-full animate-spin" />
                Loading...
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-foreground/5 text-muted-foreground text-xs font-medium">
                Last stop
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
