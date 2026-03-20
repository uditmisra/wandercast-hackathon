import { CityWithPlaces } from '@/types/library';
import { getCityHeroImage } from '@/utils/cityImages';

interface CityHeroProps {
  city: CityWithPlaces;
}

export function CityHero({ city }: CityHeroProps) {
  const totalStories = city.places.reduce((sum, p) => sum + p.stories.length, 0);
  const heroImage = getCityHeroImage(city.slug);

  // When we have an image, use dark bg so the photo shows through vividly.
  // Without an image, fall back to the light panel surface.
  const hasImage = !!heroImage;

  return (
    <div
      className={`relative overflow-hidden animate-fade-in flex items-end ${hasImage ? '' : 'panel-surface corner-glow'}`}
      style={{
        height: 200,
        borderRadius: '20px',
        border: hasImage ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
        padding: '24px',
        background: hasImage ? 'var(--surface-elevated)' : undefined,
      }}
    >
      {/* City photo background */}
      {hasImage && (
        <>
          <img
            src={heroImage}
            alt={city.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.7 }}
          />
          {/* Dark gradient overlay for text readability */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(11,11,11,0.85) 10%, rgba(11,11,11,0.4) 50%, transparent 100%)',
            }}
          />
        </>
      )}

      <div className="relative z-10 flex items-end justify-between w-full">
        <div>
          <span className={`text-[10px] uppercase tracking-[0.15em] mb-1 block ${hasImage ? 'text-white/50' : 'text-foreground/50'}`}>
            {city.country}
          </span>
          <h2 className={`font-display text-[28px] leading-[1] ${hasImage ? 'text-white' : 'text-foreground'}`}>{city.name}</h2>
        </div>
        <div className={`flex gap-3 text-[10px] uppercase tracking-[0.05em] pb-1 ${hasImage ? 'text-white/50' : 'text-foreground/50'}`}>
          <span>{city.places.length} places</span>
          <span>{totalStories} stories</span>
        </div>
      </div>
    </div>
  );
}
