import React from 'react';
import { MapPin, Globe, Clock, Flame, Star, TrendingUp } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { GradientOrb } from '@/components/design/GradientOrb';

export function DashboardStats() {
  const { data: stats, isLoading, isError, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/10 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20">
        <p className="text-foreground/50">Something went wrong loading your stats.</p>
        <p className="text-xs text-foreground/40 mt-1">{(error as Error)?.message}</p>
        <button onClick={() => window.location.reload()} className="text-foreground text-sm mt-2 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-5">
          <TrendingUp className="w-7 h-7 text-foreground/40" />
        </div>
        <h3 className="font-display text-xl text-foreground mb-2">No stats yet</h3>
        <p className="text-foreground/50 text-sm">Take your first tour to start tracking your adventures.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Main stats grid */}
      <div>
        <span className="section-label text-foreground/40 mb-4">Overview</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Tours Taken" value={stats.toursTaken} />
          <StatCard icon={<MapPin className="w-5 h-5" />} label="Places Visited" value={stats.placesVisited} />
          <StatCard icon={<Globe className="w-5 h-5" />} label="Cities Explored" value={stats.citiesExplored} />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Listening Time" value={`${stats.totalListeningMinutes}m`} />
        </div>
      </div>

      {/* Streak + Top interest */}
      <div>
        <span className="section-label text-foreground/40 mb-4">Highlights</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="relative overflow-hidden flex items-center gap-5 p-6" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}>
            <GradientOrb size={80} opacity={0.15} blur={20} className="-top-5 -right-5" />
            <div className="relative z-10">
              <p className="text-[10px] uppercase tracking-[0.1em] text-foreground/50 mb-1">Current Streak</p>
              <p className="font-display text-[32px] leading-none text-foreground">
                {stats.currentStreak} <span className="text-base font-normal text-foreground/40">day{stats.currentStreak !== 1 ? 's' : ''}</span>
              </p>
            </div>
          </div>

          {stats.mostExploredInterest && (
            <div className="relative overflow-hidden flex items-center gap-5 p-6" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}>
              <GradientOrb size={80} opacity={0.15} blur={20} className="-top-5 -left-5" />
              <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-[0.1em] text-foreground/50 mb-1">Most Explored</p>
                <p className="font-display text-[24px] leading-none text-foreground capitalize">{stats.mostExploredInterest.name}</p>
                <p className="text-[10px] text-foreground/40 mt-1">{stats.mostExploredInterest.count} tour{stats.mostExploredInterest.count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Places per city */}
      {stats.placesPerCity.length > 0 && (
        <div>
          <span className="section-label text-foreground/40 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, display: 'block' }}>
            Places Per City
          </span>
          <div className="flex flex-col mt-2">
            {stats.placesPerCity.map((item) => (
              <div key={item.city} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-sm font-medium text-foreground">{item.city}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-orb-linear"
                      style={{ width: `${Math.min(100, (item.count / Math.max(...stats.placesPerCity.map(c => c.count))) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-foreground/50 w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: {
  icon: React.ReactNode; label: string; value: string | number;
}) {
  return (
    <div className="p-5" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}>
      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-3 text-foreground/50">
        {icon}
      </div>
      <p className="font-display text-2xl text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.05em] text-foreground/50 mt-0.5">{label}</p>
    </div>
  );
}
