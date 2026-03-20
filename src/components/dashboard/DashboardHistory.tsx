import { useState, useMemo, useRef } from 'react';
import { Play, Star, Trash2, Search, ChevronDown, Check, MapPin } from 'lucide-react';
import { TourPlan } from '@/types/tour';
import { useTours, useDeleteTour } from '@/hooks/useTours';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface DashboardHistoryProps {
  onPlayTour: (tour: TourPlan) => void;
  onToggleFavorite?: (tourId: string) => void;
}

type SortOption = 'favorites' | 'newest' | 'oldest';

export function DashboardHistory({ onPlayTour, onToggleFavorite }: DashboardHistoryProps) {
  const { data: tours = [], isLoading, isError, error } = useTours();
  const deleteTour = useDeleteTour();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('favorites');
  const [sortOpen, setSortOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  const SORT_LABELS: Record<SortOption, string> = {
    favorites: 'Favorites first',
    newest: 'Newest',
    oldest: 'Oldest',
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return tours.filter(t =>
      !q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
    );
  }, [tours, query]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sort === 'favorites') {
        if ((a as any).isFavorited && !(b as any).isFavorited) return -1;
        if (!(a as any).isFavorited && (b as any).isFavorited) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filtered, sort]);

  const handleDelete = (tourId: string) => {
    deleteTour.mutate(tourId);
    setConfirmDeleteId(null);
  };

  const handleStartRename = (tour: TourPlan) => {
    setEditingId(tour.id);
    setEditingTitle(tour.title);
    setTimeout(() => editRef.current?.focus(), 0);
  };

  const handleSaveRename = async (tourId: string) => {
    const newTitle = editingTitle.trim();
    const originalTitle = tours.find(t => t.id === tourId)?.title;
    if (!newTitle || newTitle === originalTitle) {
      setEditingId(null);
      return;
    }
    setEditingId(null);
    await supabase.from('tours').update({ title: newTitle }).eq('id', tourId);
    queryClient.invalidateQueries({ queryKey: ['tours'] });
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="skeleton h-10 flex-1 rounded-full" />
          <div className="skeleton h-10 w-36 rounded-full" />
        </div>
        <div className="flex flex-col">
          {[0, 1, 2].map(i => (
            <div key={i} className="py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="skeleton h-3 w-20 rounded-md mb-3" />
              <div className="skeleton h-6 w-48 rounded-md mb-2" />
              <div className="skeleton h-4 w-32 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20">
        <p className="text-foreground/50">Something went wrong loading your tours.</p>
        <p className="text-xs text-foreground/40 mt-1">{(error as Error)?.message}</p>
        <button onClick={() => window.location.reload()} className="text-foreground text-sm mt-2 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (tours.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-5">
          <MapPin className="w-7 h-7 text-foreground/40" />
        </div>
        <h3 className="font-display text-xl text-foreground mb-2">No tours yet</h3>
        <p className="text-foreground/50 max-w-sm mx-auto text-sm">
          Create your first audio tour to start building your travel history.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search + Sort bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tours..."
            className="w-full h-10 pl-11 pr-9 rounded-full bg-transparent text-sm text-foreground placeholder-foreground/30 focus:outline-none transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground text-xl leading-none"
            >
              &times;
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortOpen(v => !v)}
            className="flex items-center gap-1.5 h-10 px-4 rounded-full text-[11px] uppercase tracking-[0.05em] font-semibold text-foreground/50 hover:text-foreground active:scale-95 transition-all duration-150 whitespace-nowrap"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {SORT_LABELS[sort]}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
              <div className="absolute right-0 top-12 z-20 bg-card rounded-xl shadow-lg py-1 min-w-[160px] animate-slide-up" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setSort(key); setSortOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-foreground/70 hover:bg-foreground/5 flex items-center justify-between"
                  >
                    {label}
                    {sort === key && <Check className="w-3.5 h-3.5 text-foreground" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-[11px] uppercase tracking-[0.1em] font-semibold text-foreground/40 mb-2">
        {sorted.length} {sorted.length === 1 ? 'tour' : 'tours'}{query ? ` matching "${query}"` : ''}
      </p>

      {sorted.length === 0 && query && (
        <div className="text-center py-16">
          <p className="text-foreground/40">No tours match your search.</p>
          <button onClick={() => setQuery('')} className="text-foreground text-sm mt-2 hover:underline">
            Clear search
          </button>
        </div>
      )}

      {/* Tour list — editorial format */}
      <div className="flex flex-col">
        {sorted.map((tour) => {
          const progress = (tour as any).currentStopIndex;
          const hasProgress = typeof progress === 'number' && progress > 0;
          const progressPct = hasProgress
            ? Math.round(((progress + 1) / Math.max(tour.places.length, 1)) * 100)
            : 0;
          const isEditing = editingId === tour.id;
          const isFavorited = (tour as any).isFavorited;
          const isRecent = tour.createdAt && (Date.now() - new Date(tour.createdAt).getTime()) < 24 * 60 * 60 * 1000;

          return (
            <div
              key={tour.id}
              className="group flex items-center justify-between py-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            >
              {/* Tour info */}
              <button onClick={() => onPlayTour(tour)} className="flex-1 text-left pr-4 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                    style={{
                      background: isFavorited
                        ? 'radial-gradient(circle at 30% 30%, var(--accent-pink), #5B8AFF, var(--accent-orange))'
                        : isRecent ? 'var(--accent-pink)' : '#555',
                    }}
                  />
                  <span className="text-[10px] uppercase tracking-[0.05em] text-foreground/50">
                    {hasProgress
                      ? `${progressPct}% complete`
                      : isFavorited
                        ? 'Favorite'
                        : `${tour.places.length} stops`}
                  </span>
                </div>

                {isEditing ? (
                  <input
                    ref={editRef}
                    value={editingTitle}
                    onChange={e => setEditingTitle(e.target.value)}
                    onBlur={() => handleSaveRename(tour.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveRename(tour.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="font-display text-[22px] leading-none text-foreground bg-transparent border-b-2 border-foreground outline-none w-full"
                  />
                ) : (
                  <h3
                    className="font-display text-[22px] leading-none text-foreground truncate"
                    onDoubleClick={() => handleStartRename(tour)}
                    title="Double-click to rename"
                  >
                    {tour.title}
                  </h3>
                )}
              </button>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {onToggleFavorite && (
                  <button
                    onClick={() => onToggleFavorite(tour.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-foreground/5 active:scale-90 transition-all duration-150"
                  >
                    <Star className={`w-4 h-4 transition-colors ${
                      isFavorited ? 'fill-accent-orange text-accent-orange' : 'text-foreground/20 hover:text-accent-orange'
                    }`} />
                  </button>
                )}
                <button
                  onClick={() => setConfirmDeleteId(tour.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-foreground/20 hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all duration-150 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onPlayTour(tour)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 hover:bg-foreground hover:text-background"
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <Play className="w-2.5 h-3 ml-0.5" fill="currentColor" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete tour?"
        description="This will permanently remove the tour and all its stops. This can't be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
