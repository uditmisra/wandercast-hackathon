import { useAdminContent } from '@/hooks/useAdminData';
import { Loader2, Database, Globe, BookOpen } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function AdminContentTab() {
  const { data, isLoading, error } = useAdminContent();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-foreground/30" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-400 text-sm">
        Failed to load content data: {(error as Error).message}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Library Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Cities', value: data.cities, icon: Globe },
          { label: 'Curated Places', value: data.places, icon: Database },
          { label: 'Stories', value: data.stories, icon: BookOpen },
          { label: 'Avg Stories / Place', value: data.avgStoriesPerPlace, icon: BookOpen },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-foreground/40" />
                <span className="text-[11px] uppercase tracking-wider text-foreground/40 font-semibold">
                  {stat.label}
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Web Cache Stats */}
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-5">
        <h3 className="text-xs uppercase tracking-wider text-foreground/40 font-semibold mb-4">
          Web Context Cache
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-foreground/60">Cached Entries</p>
            <p className="text-foreground font-mono text-lg">{data.webCacheEntries}</p>
          </div>
          <div className="space-y-1">
            <p className="text-foreground/60">Oldest Entry</p>
            <p className="text-foreground/80 text-sm">
              {data.webCacheOldest ? new Date(data.webCacheOldest).toLocaleDateString() : '—'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-foreground/60">Newest Entry</p>
            <p className="text-foreground/80 text-sm">
              {data.webCacheNewest ? new Date(data.webCacheNewest).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* City Breakdown */}
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-xs uppercase tracking-wider text-foreground/40 font-semibold">
            City Breakdown
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.08] hover:bg-transparent">
              <TableHead className="text-foreground/40">City</TableHead>
              <TableHead className="text-foreground/40 text-right">Places</TableHead>
              <TableHead className="text-foreground/40 text-right">Stories</TableHead>
              <TableHead className="text-foreground/40 text-right">Coverage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.cityBreakdown.map((city) => {
              const coverage = city.places > 0
                ? Math.round((city.stories / city.places) * 100)
                : 0;
              return (
                <TableRow key={city.city} className="border-white/[0.08]">
                  <TableCell className="text-foreground/80 font-medium">{city.city}</TableCell>
                  <TableCell className="text-foreground/60 tabular-nums text-right">{city.places}</TableCell>
                  <TableCell className="text-foreground/60 tabular-nums text-right">{city.stories}</TableCell>
                  <TableCell className="text-right">
                    <span className={`text-sm tabular-nums font-mono ${
                      coverage >= 100 ? 'text-green-400' : coverage >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {coverage}%
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
            {data.cityBreakdown.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-foreground/30 py-8">
                  No curated content yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
