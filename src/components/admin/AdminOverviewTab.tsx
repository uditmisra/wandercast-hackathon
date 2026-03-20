import { useAdminOverview } from '@/hooks/useAdminData';
import { Loader2, Users, Map, MapPin, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['#2E66FF', '#FF6B6B', '#FFB84D', '#888888'];

export function AdminOverviewTab() {
  const { data, isLoading, error } = useAdminOverview();

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
        Failed to load overview: {(error as Error).message}
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: 'Total Users', value: data.totalUsers, icon: Users },
    { label: 'Total Tours', value: data.totalTours, icon: Map },
    { label: 'Total Places', value: data.totalPlaces, icon: MapPin },
    { label: 'Tours This Week', value: data.toursThisWeek, icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
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
                {stat.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tours per Day */}
        <div className="lg:col-span-2 rounded-xl bg-white/[0.04] border border-white/[0.08] p-5">
          <h3 className="text-xs uppercase tracking-wider text-foreground/40 font-semibold mb-4">
            Tours Created (Last 30 Days)
          </h3>
          {data.toursPerDay.length > 0 ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.toursPerDay}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#888', fontSize: 10 }}
                    tickFormatter={(d) => d.slice(5)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#888', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#999' }}
                  />
                  <Bar dataKey="count" fill="#2E66FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-foreground/30 py-10 text-center">No tours in the last 30 days</p>
          )}
        </div>

        {/* Content Sources */}
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-5">
          <h3 className="text-xs uppercase tracking-wider text-foreground/40 font-semibold mb-4">
            Content Sources
          </h3>
          {data.contentSources.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.contentSources}
                      dataKey="count"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      stroke="none"
                    >
                      {data.contentSources.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {data.contentSources.map((src, i) => (
                  <div key={src.source} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-xs text-foreground/50 capitalize">{src.source}</span>
                    <span className="text-xs text-foreground/30">{src.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-foreground/30 py-10 text-center">No content data</p>
          )}
        </div>
      </div>
    </div>
  );
}
