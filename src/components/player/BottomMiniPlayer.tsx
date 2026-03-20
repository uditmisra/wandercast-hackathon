import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, ArrowRight, X } from 'lucide-react';
import { TourPlan, Place } from '@/types/tour';
import { getCityHeroImage } from '@/utils/cityImages';

interface BottomMiniPlayerProps {
  tour: TourPlan;
  currentPlace: Place;
  currentStopIndex: number;
  totalStops: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onResume: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onDismiss?: () => void;
}

export function BottomMiniPlayer({
  tour,
  currentPlace,
  currentStopIndex,
  totalStops,
  isPlaying,
  onPlayPause,
  onResume,
  onNext,
  onPrevious,
  onDismiss,
}: BottomMiniPlayerProps) {
  const [expanded, setExpanded] = useState(false);
  const cityImage = getCityHeroImage(currentPlace.city);

  return (
    <div
      className="fixed z-50"
      style={{
        bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        right: 16,
        borderRadius: expanded ? 16 : 40,
        background: 'color-mix(in srgb, var(--surface-elevated) 95%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        width: expanded ? 'min(calc(100vw - 32px), 380px)' : undefined,
        transition: 'width 300ms ease, border-radius 300ms ease',
      }}
    >
      {expanded ? (
        /* ── Expanded state ── */
        <div>
          {/* City image strip */}
          <div className="relative h-10 overflow-hidden">
            <img src={cityImage} className="w-full h-full object-cover opacity-40" alt="" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent, var(--surface-elevated))' }} />
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="absolute top-1.5 left-2 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-1.5 right-2 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-4 pb-4 pt-1">
            {/* Tour title */}
            <p className="text-[10px] uppercase tracking-[0.1em] text-white/40 mb-0.5 truncate">
              {tour.title}
            </p>
            {/* Place name + step counter */}
            <div className="flex items-baseline justify-between">
              <h4 className="font-display text-base text-white truncate">{currentPlace.name}</h4>
              <span className="text-[10px] text-white/40 flex-shrink-0 ml-2">
                {currentStopIndex + 1}/{totalStops}
              </span>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <button
                onClick={onPrevious}
                disabled={currentStopIndex === 0}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={onPlayPause}
                className="w-11 h-11 rounded-full bg-white text-background flex items-center justify-center active:scale-95 transition-transform"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button
                onClick={onNext}
                disabled={currentStopIndex >= totalStops - 1}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Resume link */}
            <button
              onClick={onResume}
              className="mt-3 w-full text-center text-xs text-primary hover:text-primary/80 font-medium transition-colors flex items-center justify-center gap-1"
            >
              Resume full player
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        /* ── Collapsed state: small pill ── */
        <div className="flex items-center gap-2.5 pl-1.5 pr-1.5 py-1.5">
          {/* City thumbnail */}
          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
            <img src={cityImage} className="w-full h-full object-cover" alt="" />
          </div>

          {/* Place name — tap to expand */}
          <button
            onClick={() => setExpanded(true)}
            className="text-sm text-white font-medium truncate max-w-[120px]"
          >
            {currentPlace.name}
          </button>

          {/* Waveform bars when playing */}
          {isPlaying && (
            <div className="flex gap-[2px] h-3 items-end">
              {[30, 70, 100].map((h, i) => (
                <div
                  key={i}
                  className="w-[2px] bg-primary rounded-full"
                  style={{
                    height: `${h}%`,
                    animation: 'waveform-bounce 1s infinite ease-in-out',
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Play button — expands the mini player */}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
            className="w-8 h-8 rounded-full bg-white text-background flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
