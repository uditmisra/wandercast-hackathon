import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useTourBuilderContext } from '@/contexts/TourBuilderContext';
import { useStoryLibrary } from '@/hooks/useStoryLibrary';
import { StopListItem } from '@/components/library/StopListItem';
import { TourPlan } from '@/types/tour';

interface BuildTourPageProps {
  onPlayTour: (tour: TourPlan) => void;
}

export default function BuildTourPage({ onPlayTour }: BuildTourPageProps) {
  const navigate = useNavigate();
  const builder = useTourBuilderContext();
  const { data: cities = [] } = useStoryLibrary();
  const city = cities[0];
  const [confirmClear, setConfirmClear] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const handleStartTour = () => {
    if (!city || builder.selectedStops.length < 1) return;
    const tour = builder.assembleTourPlan(city);
    builder.clear();
    onPlayTour(tour);
  };

  if (builder.selectedStops.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-foreground/40" />
          </div>
          <p className="text-foreground font-medium">No stops yet</p>
          <p className="text-sm text-foreground/40 mt-1">Head to Explore and pick some places</p>
          <Button
            variant="outline"
            onClick={() => navigate('/explore')}
            className="mt-5 rounded-full h-10 px-5 active:scale-95 transition-all duration-150"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Browse places
          </Button>
        </div>
      </div>
    );
  }

  const totalDuration = builder.selectedStops.length * 5;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-8 pb-32">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Explore', href: '/explore' },
          { label: 'Build Tour' },
        ]} />
        {/* Summary */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Your tour</h2>
            <p className="text-foreground/50 mt-1">
              {builder.selectedStops.length} stop{builder.selectedStops.length !== 1 ? 's' : ''} &middot; ~{totalDuration} min
            </p>
          </div>
          <button
            onClick={() => setConfirmClear(true)}
            className="text-sm text-foreground/40 hover:text-red-500 transition-colors active:scale-95 duration-150"
          >
            Clear all
          </button>
        </div>

        {/* Tone override */}
        <div className="flex items-center gap-3 mb-6 bg-card rounded-xl border border-border px-4 py-3">
          <span className="text-sm text-foreground/60">Set all tones to:</span>
          <div className="flex gap-1.5">
            {(['casual', 'scholarly', 'dramatic', 'witty'] as const).map(tone => (
              <button
                key={tone}
                onClick={() => builder.setToneForAll(tone)}
                className="text-xs px-3 py-2 rounded-full border border-white/10 text-foreground/60 hover:border-primary hover:text-primary active:scale-95 transition-all duration-150"
              >
                {tone.charAt(0).toUpperCase() + tone.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stop list */}
        <div className="space-y-3 mb-8">
          {builder.selectedStops.map((stop, index) => (
            <div
              key={stop.place.place_id}
              draggable
              onDragStart={() => setDragFrom(index)}
              onDragOver={(e) => { e.preventDefault(); if (dragFrom !== null) setDragOver(index); }}
              onDrop={() => {
                if (dragFrom !== null && dragFrom !== index) builder.reorderStops(dragFrom, index);
                setDragFrom(null); setDragOver(null);
              }}
              onDragEnd={() => { setDragFrom(null); setDragOver(null); }}
              className={[
                'transition-all duration-150 rounded-xl',
                dragFrom === index ? 'opacity-50 scale-[0.98]' : '',
                dragOver === index && dragFrom !== index ? 'ring-2 ring-primary ring-offset-2' : '',
              ].join(' ')}
            >
              <StopListItem
                stop={stop}
                index={index}
                onRemove={() => builder.removeStop(stop.place.place_id)}
                onToneChange={(tone) => builder.setToneForStop(stop.place.place_id, tone)}
              />
            </div>
          ))}
        </div>

        {/* Add more */}
        <button
          onClick={() => navigate('/explore')}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-white/10 rounded-xl py-4 text-foreground/40 hover:border-white/20 hover:text-foreground/60 active:scale-[0.98] transition-all duration-150"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add more stops</span>
        </button>

        {/* Start button */}
        <div className="mt-10">
          <Button
            onClick={handleStartTour}
            className="w-full h-14 rounded-full text-base font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-all duration-150"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            {builder.selectedStops.length === 1 ? 'Play Story' : `Start Tour (${builder.selectedStops.length} stops)`}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Remove all stops?"
        description="This will clear your current tour selection."
        confirmLabel="Clear all"
        variant="danger"
        onConfirm={() => { builder.clear(); setConfirmClear(false); navigate('/explore'); }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
