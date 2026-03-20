import { Star, Play } from 'lucide-react';
import { CityPlaceWithStories } from '@/types/library';
import { getPlaceImage, getCategoryGradient } from '@/utils/cityImages';

interface PlaceCardProps {
  place: CityPlaceWithStories;
  selectedTone: string;
  isSelected: boolean;
  onToggleSelect: () => void;
  onTap: () => void;
  onPlay: () => void;
}

export function PlaceCard({ place, selectedTone, isSelected, onToggleSelect, onTap, onPlay }: PlaceCardProps) {
  const story = place.stories.find(s => s.tone === selectedTone) || place.stories[0];
  const hookText = story?.hook || '';
  const imageUrl = getPlaceImage(place.place_id);

  return (
    <button
      onClick={onTap}
      className="w-full text-left group"
    >
      <div className="py-4 flex items-center gap-4 border-b border-border/50">
        {/* Thumbnail — image or gradient fallback */}
        <div
          className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden"
          style={imageUrl ? undefined : { background: getCategoryGradient(place.category) }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={place.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white/70 text-lg">
                {getCategoryEmoji(place.category)}
              </span>
            </div>
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-display text-base leading-tight text-foreground truncate">
              {place.name}
            </h3>
            {place.must_see && (
              <Star className="w-3 h-3 fill-accent-orange text-accent-orange flex-shrink-0" />
            )}
          </div>
          <p className="text-[13px] text-muted-foreground leading-snug line-clamp-1">
            {hookText}
          </p>
        </div>

        {/* Play button */}
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 transition-all duration-150"
          aria-label={`Play ${place.name}`}
        >
          <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />
        </button>
      </div>
    </button>
  );
}

function getCategoryEmoji(category?: string): string {
  const icons: Record<string, string> = {
    landmark: '\u{1F3DB}\u{FE0F}',
    museum: '\u{1F3A8}',
    park: '\u{1F333}',
    church: '\u26EA',
    market: '\u{1F6CD}\u{FE0F}',
    pub: '\u{1F37A}',
    bridge: '\u{1F309}',
    square: '\u{1F3D9}\u{FE0F}',
    theatre: '\u{1F3AD}',
    district: '\u{1F3D8}\u{FE0F}',
    government: '\u{1F3DB}\u{FE0F}',
    memorial: '\u{1F54A}\u{FE0F}',
    cemetery: '\u{1F54A}\u{FE0F}',
  };
  return icons[category?.toLowerCase() || ''] || '\u{1F4CD}';
}
