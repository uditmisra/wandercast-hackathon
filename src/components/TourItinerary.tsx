import { ArrowLeft, ArrowRight, MapPin, Clock } from 'lucide-react';
import { TourPlan } from '@/types/tour';
import { GradientOrb } from '@/components/design/GradientOrb';
import { BrandLogo } from '@/components/BrandLogo';
import { getCityHeroImage } from '@/utils/cityImages';

interface TourItineraryProps {
  tour: TourPlan;
  onStart: () => void;
  onBack: () => void;
}

export function TourItinerary({ tour, onStart, onBack }: TourItineraryProps) {
  const totalDuration = tour.totalDuration || tour.places.length * 5;
  const city = tour.places[0]?.city;
  const heroImage = getCityHeroImage(city);

  return (
    <div className="min-h-screen bg-background relative">
      <GradientOrb size={300} opacity={0.15} blur={80} className="top-[100px] -right-[100px]" />

      {/* Hero image strip */}
      <div className="relative h-[120px] overflow-hidden">
        <img src={heroImage} alt={city || 'Tour'} className="w-full h-full object-cover" style={{ opacity: 0.7 }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0b0b0b 5%, transparent 60%)' }} />
      </div>

      <div className="max-w-lg mx-auto px-6 relative z-10 flex flex-col min-h-[calc(100vh-120px)]">
        {/* Header */}
        <header className="py-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs uppercase tracking-[0.1em] font-semibold text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <BrandLogo size="sm" />
        </header>

        {/* Journey Header */}
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/40 mb-2">
            {tour.interests.map((i: any) => i.label || i.name).join(' · ')}
          </p>
          <h1 className="font-display text-[38px] leading-[0.95] font-normal tracking-[-0.04em] mb-4">
            {tour.title}
          </h1>
          {tour.description && (
            <p className="text-sm text-foreground/50 leading-relaxed mb-6">{tour.description}</p>
          )}

          {/* Stats Row */}
          <div className="flex gap-6 border-t border-b border-foreground/10 py-4">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.1em] text-foreground/40 mb-1">Duration</span>
              <span className="text-sm font-semibold">{totalDuration} min</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.1em] text-foreground/40 mb-1">Stops</span>
              <span className="text-sm font-semibold">{tour.places.length} Locations</span>
            </div>
            {tour.personalization?.preferredTone && (
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.1em] text-foreground/40 mb-1">Tone</span>
                <span className="text-sm font-semibold capitalize">{tour.personalization.preferredTone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stop List */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 pb-4" style={{ scrollbarWidth: 'none' }}>
          {tour.places.map((place, index) => {
            const isLast = index === tour.places.length - 1;
            const estimatedTime = index * 5;
            const mins = Math.floor(estimatedTime / 60);
            const secs = estimatedTime % 60;
            const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

            return (
              <div key={place.id} className="flex gap-5 py-6 relative">
                {/* Connecting line */}
                {!isLast && (
                  <div
                    className="absolute bg-foreground/20"
                    style={{ left: 15, top: 48, bottom: 0, width: 1 }}
                  />
                )}

                {/* Number circle */}
                <div className="w-8 h-8 rounded-full border border-foreground flex items-center justify-center font-display text-sm bg-background z-[2] flex-shrink-0">
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-foreground/40 mb-1">
                    {timeStr} · {place.estimatedDuration || 5} min
                  </p>
                  <h3 className="font-display text-xl mb-1.5">{place.name}</h3>
                  <p className="text-xs text-foreground/50 leading-relaxed line-clamp-2">
                    {place.description || (place.generatedContent as any)?.hook || ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="py-6 flex gap-3 bg-gradient-to-t from-background via-background to-transparent sticky bottom-0">
          <button
            onClick={onBack}
            className="flex-1 h-14 rounded-full border border-foreground flex items-center justify-center text-xs font-semibold uppercase tracking-[0.1em] bg-transparent hover:bg-foreground/5 active:scale-95 transition-all duration-150"
          >
            Back
          </button>
          <button
            onClick={onStart}
            className="flex-[2] h-14 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold uppercase tracking-[0.1em] relative overflow-hidden hover:opacity-90 active:scale-95 transition-all duration-150"
          >
            <div
              className="absolute inset-0 gradient-orb opacity-[0.15]"
            />
            <span className="relative z-[2] flex items-center gap-2">
              Start Audio Guide
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
