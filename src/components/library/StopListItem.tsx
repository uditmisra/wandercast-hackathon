import { GripVertical, X, MapPin } from 'lucide-react';
import { SelectedStop } from '@/types/library';

const TONE_COLORS: Record<string, string> = {
  casual: 'bg-primary/15 text-primary',
  scholarly: 'bg-emerald-500/15 text-emerald-400',
  dramatic: 'bg-purple-500/15 text-purple-400',
  witty: 'bg-accent-orange/15 text-accent-orange',
};

interface StopListItemProps {
  stop: SelectedStop;
  index: number;
  onRemove: () => void;
  onToneChange: (tone: SelectedStop['selectedTone']) => void;
}

export function StopListItem({ stop, index, onRemove, onToneChange }: StopListItemProps) {
  const availableTones = stop.place.stories.map(s => s.tone);

  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-foreground/20 transition-colors">
      <GripVertical className="w-5 h-5 text-foreground/30 flex-shrink-0 cursor-grab active:cursor-grabbing hover:text-foreground/50 transition-colors" />

      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground text-sm truncate">{stop.place.name}</h4>
        <span className="text-xs text-foreground/40 flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3" />
          {stop.place.neighborhood}
        </span>
      </div>

      <select
        value={stop.selectedTone}
        onChange={(e) => onToneChange(e.target.value as SelectedStop['selectedTone'])}
        className={`text-xs px-2.5 py-1.5 h-8 rounded-full border-0 font-medium ${TONE_COLORS[stop.selectedTone] || 'bg-white/5 text-foreground/60'}`}
      >
        {availableTones.map(tone => (
          <option key={tone} value={tone}>{tone.charAt(0).toUpperCase() + tone.slice(1)}</option>
        ))}
      </select>

      <button
        onClick={onRemove}
        className="w-8 h-8 flex items-center justify-center text-foreground/30 hover:text-foreground/50 transition-all duration-150 active:scale-90 flex-shrink-0 rounded-full"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
