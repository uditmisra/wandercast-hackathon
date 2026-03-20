import React from 'react';
import { CityPlaceWithStories } from '@/types/library';

interface FilterBarProps {
  places: CityPlaceWithStories[];
  selectedNeighborhood: string | null;
  onNeighborhoodChange: (n: string | null) => void;
}

export function FilterBar({
  places,
  selectedNeighborhood,
  onNeighborhoodChange,
}: FilterBarProps) {
  const neighborhoods = [...new Set(places.map(p => p.neighborhood).filter(Boolean))].sort();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide scroll-fade-r">
      <FilterPill
        label="All"
        active={selectedNeighborhood === null}
        onClick={() => onNeighborhoodChange(null)}
      />
      {neighborhoods.map(n => (
        <FilterPill
          key={n}
          label={n}
          active={selectedNeighborhood === n}
          onClick={() => onNeighborhoodChange(selectedNeighborhood === n ? null : n)}
        />
      ))}
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap text-sm px-4 py-2 rounded-full border transition-all duration-150 active:scale-95 flex-shrink-0 ${
        active
          ? 'bg-foreground text-background border-foreground'
          : 'bg-transparent text-foreground/60 border-white/10 hover:border-foreground/30'
      }`}
    >
      {label}
    </button>
  );
}
