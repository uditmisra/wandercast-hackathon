import { useState } from 'react';
import { Bookmark, Play, Pause, Volume2 } from 'lucide-react';
import { TourPlan } from '@/types/tour';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useTours } from '@/hooks/useTours';
import { supabase } from '@/integrations/supabase/client';

interface DashboardBookmarksProps {
  onPlayTour: (tour: TourPlan) => void;
}

export function DashboardBookmarks({ onPlayTour }: DashboardBookmarksProps) {
  const { data: bookmarkData, isLoading: bookmarksLoading, isError, error } = useBookmarks();
  const { data: tours = [] } = useTours();

  const favoritedTours = tours.filter(t => (t as any).isFavorited);
  const bookmarkedPlaces = bookmarkData?.places || [];

  if (bookmarksLoading) {
    return (
      <div className="flex flex-col">
        {[0, 1, 2].map(i => (
          <div key={i} className="py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="skeleton h-3 w-20 rounded-md mb-3" />
            <div className="skeleton h-6 w-48 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20">
        <p className="text-foreground/50">Something went wrong loading bookmarks.</p>
        <p className="text-xs text-foreground/40 mt-1">{(error as Error)?.message}</p>
        <button onClick={() => window.location.reload()} className="text-foreground text-sm mt-2 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (favoritedTours.length === 0 && bookmarkedPlaces.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-5">
          <Bookmark className="w-7 h-7 text-foreground/40" />
        </div>
        <h3 className="font-display text-xl text-foreground mb-2">No bookmarks yet</h3>
        <p className="text-foreground/50 max-w-sm mx-auto text-sm">
          Star your favorite tours or bookmark individual places during a tour.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Favorited Tours */}
      {favoritedTours.length > 0 && (
        <div>
          <span
            className="section-label text-foreground/40 block"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}
          >
            Favorite Tours
          </span>
          <div className="flex flex-col">
            {favoritedTours.map((tour) => (
              <button
                key={tour.id}
                onClick={() => onPlayTour(tour)}
                className="group flex items-center justify-between py-5 text-left"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0 gradient-orb-linear" />
                    <span className="text-[10px] uppercase tracking-[0.05em] text-foreground/50">
                      {tour.places.length} stops
                    </span>
                  </div>
                  <h4 className="font-display text-[22px] leading-none text-foreground truncate">
                    {tour.title}
                  </h4>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 hover:bg-foreground hover:text-background flex-shrink-0"
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <Play className="w-2.5 h-3 ml-0.5" fill="currentColor" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bookmarked Places */}
      {bookmarkedPlaces.length > 0 && (
        <div>
          <span
            className="section-label text-foreground/40 block"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}
          >
            Saved Places
          </span>
          <div className="flex flex-col">
            {bookmarkedPlaces.map((bookmark: any) => (
              <BookmarkedPlaceCard key={bookmark.id} bookmark={bookmark} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookmarkedPlaceCard({ bookmark }: { bookmark: any }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const place = bookmark.places;
  const narration = place?.audio_narration || '';
  const tourTitle = place?.tours?.title || '';

  const handlePlay = async () => {
    if (isPlaying && audioElement) { audioElement.pause(); setIsPlaying(false); return; }
    if (audioElement) { audioElement.play(); setIsPlaying(true); return; }
    if (!narration) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: { text: narration, voiceId: 'EST9Ui6982FZPSi7gCHi' }
      });
      if (error) throw error;
      const binaryStr = atob(data.audioContent);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } catch {
      console.error('Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="flex items-center justify-between py-5"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0 bg-foreground/30" />
          <span className="text-[10px] uppercase tracking-[0.05em] text-foreground/50">
            {tourTitle ? `from ${tourTitle}` : 'Saved place'}
          </span>
        </div>
        <h4 className="font-display text-[22px] leading-none text-foreground">{place?.name}</h4>
      </div>
      <button
        onClick={handlePlay}
        disabled={isGenerating || !narration}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150 active:scale-90 disabled:opacity-30 hover:bg-foreground hover:text-background"
        style={{ border: '1px solid rgba(255,255,255,0.2)' }}
      >
        {isGenerating ? (
          <Volume2 className="w-3 h-3 animate-pulse" />
        ) : isPlaying ? (
          <Pause className="w-3 h-3" />
        ) : (
          <Play className="w-2.5 h-3 ml-0.5" fill="currentColor" />
        )}
      </button>
    </div>
  );
}
