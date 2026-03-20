import React, { useState } from 'react';
import { MapPin, Star, Eye, Plus, Check, Volume2, Play, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CityPlaceWithStories, PlaceStory } from '@/types/library';
import { supabase } from '@/integrations/supabase/client';
import { getPlaceImage } from '@/utils/cityImages';

interface PlaceDetailSheetProps {
  place: CityPlaceWithStories | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSelected: boolean;
  onToggleSelect: (tone: PlaceStory['tone']) => void;
  onPlay: (tone: string) => void;
  defaultTone: string;
}

const TONE_LABELS: Record<string, { label: string; description: string }> = {
  casual: { label: 'Casual', description: 'Relaxed & real' },
  scholarly: { label: 'Scholarly', description: 'Rich & detailed' },
  dramatic: { label: 'Dramatic', description: 'Cinematic & vivid' },
  witty: { label: 'Witty', description: 'Sharp & playful' },
};

export function PlaceDetailSheet({ place, open, onOpenChange, isSelected, onToggleSelect, onPlay, defaultTone }: PlaceDetailSheetProps) {
  const [activeTone, setActiveTone] = useState(defaultTone);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [showFullNarration, setShowFullNarration] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

  if (!place) return null;

  const currentStory = place.stories.find(s => s.tone === activeTone) || place.stories[0];
  const availableTones = place.stories.map(s => s.tone);

  const handlePlayPreview = async () => {
    if (isPlayingPreview && previewAudio) {
      previewAudio.pause();
      setIsPlayingPreview(false);
      return;
    }

    if (!currentStory?.hook) return;

    try {
      setIsPlayingPreview(true);
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: { text: currentStory.hook, placeId: `preview-${place.place_id}`, voiceId: 'EST9Ui6982FZPSi7gCHi' }
      });

      if (data?.audioContent && !error) {
        const binaryStr = atob(data.audioContent);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const audio = new Audio(URL.createObjectURL(blob));
        setPreviewAudio(audio);
        audio.addEventListener('ended', () => setIsPlayingPreview(false));
        await audio.play();
      } else {
        setIsPlayingPreview(false);
      }
    } catch {
      setIsPlayingPreview(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => {
      if (!v && previewAudio) { previewAudio.pause(); setIsPlayingPreview(false); }
      onOpenChange(v);
    }}>
      <SheetContent className="overflow-y-auto">
        {/* Hero image (if available) */}
        {(() => {
          const heroImg = getPlaceImage(place.place_id);
          return heroImg ? (
            <div className="relative -mx-6 -mt-6 mb-4 overflow-hidden" style={{ height: 180 }}>
              <img src={heroImg} alt={place.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(var(--background)) 0%, transparent 60%)' }} />
            </div>
          ) : null;
        })()}

        <SheetHeader>
          <SheetTitle className="text-left">{place.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Meta */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-foreground/50 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {place.neighborhood}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-foreground/50">
              {place.category}
            </span>
            {place.must_see && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent-orange/15 text-accent-orange flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-accent-orange" /> Must see
              </span>
            )}
          </div>

          {/* Tone tabs */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1">
            {availableTones.map(tone => (
              <button
                key={tone}
                onClick={() => { setActiveTone(tone); setShowFullNarration(false); }}
                className={`flex-1 text-sm py-2 rounded-lg font-medium transition-colors ${
                  activeTone === tone
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-foreground/50 hover:text-foreground/70'
                }`}
              >
                {TONE_LABELS[tone]?.label || tone}
              </button>
            ))}
          </div>

          {currentStory && (
            <div key={activeTone} className="space-y-5 animate-fade-in">
              {/* Hook */}
              <div className="panel-surface corner-glow rounded-xl p-4" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                <p className="text-sm text-foreground/90 leading-relaxed italic">
                  "{currentStory.hook}"
                </p>
                <button
                  onClick={handlePlayPreview}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isPlayingPreview ? 'animate-pulse' : ''}`} />
                  {isPlayingPreview ? 'Playing...' : 'Listen to preview'}
                </button>
              </div>

              {/* Directional cue */}
              {currentStory.directional_cue && (
                <div className="flex items-start gap-2 text-sm text-foreground/50">
                  <Eye className="w-4 h-4 mt-0.5 flex-shrink-0 text-foreground/40" />
                  <p>{currentStory.directional_cue}</p>
                </div>
              )}

              {/* Narration */}
              <div>
                <button
                  onClick={() => setShowFullNarration(!showFullNarration)}
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  {showFullNarration ? 'Hide full story' : 'Read full story'}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFullNarration ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${showFullNarration ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <p className="mt-3 text-sm text-foreground/60 leading-relaxed whitespace-pre-line">
                      {currentStory.audio_narration}
                    </p>
                  </div>
                </div>
              </div>

              {/* Interests */}
              {currentStory.interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {currentStory.interests.map(interest => (
                    <span key={interest} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-foreground/70">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => onPlay(activeTone)}
              className="flex-1 rounded-full h-12 text-base font-semibold shadow-lg shadow-white/10 active:scale-95 transition-all duration-150"
            >
              <Play className="w-4 h-4 mr-2" />
              Play Story
            </Button>
            <Button
              onClick={() => onToggleSelect(activeTone as PlaceStory['tone'])}
              variant="outline"
              className={`rounded-full h-12 px-5 ${
                isSelected ? 'border-foreground text-foreground' : 'border-white/10'
              }`}
            >
              {isSelected ? (
                <Check className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
