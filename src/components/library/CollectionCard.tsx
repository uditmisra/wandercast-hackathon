import { Play } from 'lucide-react';
import { Collection } from '@/utils/collections';

interface CollectionCardProps {
  collection: Collection;
  onTap: () => void;
  onPlay: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  curated: 'Curated',
  highlight: 'Highlights',
  neighborhood: 'Neighbourhood',
};

export function CollectionCard({ collection, onTap, onPlay }: CollectionCardProps) {
  const duration = collection.places.length * 5;

  return (
    <button
      onClick={onTap}
      className="group relative w-full text-left overflow-hidden active:scale-[0.98] transition-transform duration-150"
      style={{ borderRadius: '16px' }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden" style={{ borderRadius: '16px' }}>
        <img
          src={collection.imageUrl}
          alt={collection.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Gradient overlay for text readability */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
          }}
        />

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white/80">
            {TYPE_LABELS[collection.type] || collection.type}
          </span>
        </div>

        {/* Play button — top right */}
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 active:scale-90 transition-all duration-150"
          aria-label={`Play ${collection.title}`}
        >
          <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />
        </button>

        {/* Bottom text overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-lg leading-tight text-white">
            {collection.title}
          </h3>
          <p className="text-[11px] text-white/60 mt-1">
            {collection.places.length} {collection.places.length === 1 ? 'stop' : 'stops'} &middot; {duration}m
          </p>
        </div>
      </div>
    </button>
  );
}
