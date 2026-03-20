import { useState } from 'react';
import { Lightbulb, Sparkles, MapPin, X } from 'lucide-react';
import { useSuggestions } from '@/hooks/useSuggestions';
import { GradientOrb } from '@/components/design/GradientOrb';

const INTEREST_ICONS: Record<string, string> = {
  architecture: '&#9970;', history: '&#128220;', culture: '&#127917;', food: '&#127869;', art: '&#127912;',
  shopping: '&#128717;', 'ghost stories': '&#128123;', 'local secrets': '&#128477;', nature: '&#127795;', religion: '&#9962;',
};

const STORAGE_KEY = 'wandercast_dismissed_suggestions';

function loadDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveDismissed(cities: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
}

interface DashboardSuggestionsProps {
  onSuggestionClick: (prompt: string) => void;
}

export function DashboardSuggestions({ onSuggestionClick }: DashboardSuggestionsProps) {
  const { data: suggestions = [], isLoading, isError, error } = useSuggestions();
  const [dismissed, setDismissed] = useState<string[]>(loadDismissed);
  const [showAll, setShowAll] = useState(false);

  const handleDismiss = (city: string) => {
    const next = [...dismissed, city];
    setDismissed(next);
    saveDismissed(next);
  };

  const handleShowAll = () => {
    setDismissed([]);
    saveDismissed([]);
    setShowAll(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {[0, 1].map(i => (
          <div key={i} className="py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="skeleton h-3 w-20 rounded-md mb-3" />
            <div className="skeleton h-6 w-48 rounded-md mb-3" />
            <div className="flex gap-2">
              <div className="skeleton h-8 w-24 rounded-full" />
              <div className="skeleton h-8 w-28 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20">
        <p className="text-foreground/50">Something went wrong loading suggestions.</p>
        <p className="text-xs text-foreground/40 mt-1">{(error as Error)?.message}</p>
        <button onClick={() => window.location.reload()} className="text-foreground text-sm mt-2 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-5">
          <Lightbulb className="w-7 h-7 text-foreground/40" />
        </div>
        <h3 className="font-display text-xl text-foreground mb-2">No suggestions yet</h3>
        <p className="text-foreground/50 max-w-sm mx-auto text-sm">
          Take your first tour to get personalized suggestions for new experiences.
        </p>
      </div>
    );
  }

  const visible = showAll ? suggestions : suggestions.filter((s: any) => !dismissed.includes(s.city));
  const hasDismissed = dismissed.length > 0 && dismissed.some(c => suggestions.find((s: any) => s.city === c));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-foreground/50">Based on your tour history, here are new experiences to try:</p>
        {hasDismissed && !showAll && (
          <button onClick={handleShowAll} className="text-[11px] uppercase tracking-[0.1em] font-semibold text-foreground/40 hover:text-foreground flex-shrink-0 ml-4">
            Show all
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-foreground/40 mb-3">You've dismissed all suggestions.</p>
          <button onClick={handleShowAll} className="text-foreground text-sm hover:underline">
            Show all suggestions
          </button>
        </div>
      ) : (
        <div className="flex flex-col">
          {visible.map((suggestion: any) => (
            <div
              key={suggestion.city}
              className="group relative flex items-start justify-between py-6"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0 gradient-orb-linear"
                  />
                  <span className="text-[10px] uppercase tracking-[0.05em] text-foreground/50">
                    {suggestion.suggestedThemes.length} themes
                  </span>
                </div>

                <h3 className="font-display text-[22px] leading-none text-foreground mb-3">{suggestion.city}</h3>

                <div className="flex flex-wrap gap-2">
                  {suggestion.suggestedThemes.map((theme: string) => (
                    <span key={theme} className="text-[11px] px-3 py-1 rounded-full text-foreground/60" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                      {theme}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {suggestion.suggestedThemes.slice(0, 2).map((theme: string) => (
                    <button
                      key={theme}
                      onClick={() => onSuggestionClick(`Create a ${theme} tour of ${suggestion.city}`)}
                      className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.05em] font-semibold text-foreground rounded-full px-4 py-2 hover:bg-foreground hover:text-background transition-all active:scale-95"
                      style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                      <Sparkles className="w-3 h-3" />
                      Try {theme}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleDismiss(suggestion.city)}
                className="w-6 h-6 rounded-full text-foreground/20 hover:text-foreground/60 hover:bg-white/5 flex items-center justify-center transition-colors flex-shrink-0 mt-1"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
