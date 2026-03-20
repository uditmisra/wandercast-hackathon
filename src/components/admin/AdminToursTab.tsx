import { useState } from 'react';
import { useAdminTours, AdminTour } from '@/hooks/useAdminData';
import { Loader2, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function ContentSourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    curated: 'bg-blue-500/20 text-blue-300',
    web: 'bg-purple-500/20 text-purple-300',
    gpt: 'bg-amber-500/20 text-amber-300',
    static: 'bg-gray-500/20 text-gray-300',
    generated: 'bg-green-500/20 text-green-300',
    none: 'bg-red-500/20 text-red-300',
  };

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors[source] || colors.none}`}>
      {source}
    </span>
  );
}

function ExpandedTourRow({ tour }: { tour: AdminTour }) {
  return (
    <TableRow className="border-white/[0.08] bg-white/[0.02]">
      <TableCell colSpan={5} className="py-3">
        <div className="ml-6 space-y-1.5">
          {tour.places.map((place) => (
            <div key={place.id} className="flex items-center gap-3 text-xs">
              <span className="text-foreground/60 flex-1">{place.name}</span>
              <span className="text-foreground/30">{place.city || '—'}</span>
              <ContentSourceBadge source={place.contentSource} />
              {place.hasAudio && (
                <span className="text-[10px] text-green-400/60">audio</span>
              )}
            </div>
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function AdminToursTab() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading, error } = useAdminTours(page, search);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  if (error) {
    return (
      <div className="text-center py-20 text-red-400 text-sm">
        Failed to load tours: {(error as Error).message}
      </div>
    );
  }

  const perPage = 20;
  const totalPages = data ? Math.ceil(data.total / perPage) : 0;

  return (
    <div className="space-y-6">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by tour title..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-white/20"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-foreground/60 hover:text-foreground hover:bg-white/[0.08] transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-foreground/30" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.08] hover:bg-transparent">
                <TableHead className="text-foreground/40 w-8"></TableHead>
                <TableHead className="text-foreground/40">Title</TableHead>
                <TableHead className="text-foreground/40">Creator</TableHead>
                <TableHead className="text-foreground/40 text-right">Places</TableHead>
                <TableHead className="text-foreground/40">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.tours || []).map((tour) => {
                const isExpanded = expandedId === tour.id;
                return (
                  <>
                    <TableRow
                      key={tour.id}
                      className="border-white/[0.08] cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : tour.id)}
                    >
                      <TableCell className="text-foreground/30 w-8 pr-0">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </TableCell>
                      <TableCell className="text-foreground/80 font-medium">{tour.title}</TableCell>
                      <TableCell className="text-foreground/50 font-mono text-xs">{tour.creatorEmail}</TableCell>
                      <TableCell className="text-foreground/60 tabular-nums text-right">{tour.placeCount}</TableCell>
                      <TableCell className="text-foreground/50 text-sm">
                        {new Date(tour.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                    {isExpanded && <ExpandedTourRow key={`${tour.id}-expanded`} tour={tour} />}
                  </>
                );
              })}
              {data?.tours.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-foreground/30 py-8">
                    {search ? 'No tours match that search' : 'No tours yet'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-foreground/40">
            {data?.total ?? 0} tours total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-foreground/50 disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-foreground/50 tabular-nums">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-foreground/50 disabled:opacity-30 hover:bg-white/[0.08] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
