import { useAdminApiCosts } from '@/hooks/useAdminData';
import { Loader2, DollarSign, Mic, Brain } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function AdminApiCostsTab() {
  const { data, isLoading, error } = useAdminApiCosts();

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
        Failed to load costs: {(error as Error).message}
      </div>
    );
  }

  if (!data) return null;

  const costCards = [
    { label: 'Total Cost (All Time)', value: `$${data.estimatedTotalCost.toFixed(2)}`, icon: DollarSign },
    { label: 'This Month', value: `$${data.estimatedMonthCost.toFixed(2)}`, icon: DollarSign },
    { label: 'TTS (ElevenLabs)', value: `$${data.ttsCost.toFixed(2)}`, icon: Mic },
    { label: 'LLM (Claude + GPT)', value: `$${data.llmCost.toFixed(2)}`, icon: Brain },
  ];

  return (
    <div className="space-y-8">
      {/* Cost Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {costCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-foreground/40" />
                <span className="text-[11px] uppercase tracking-wider text-foreground/40 font-semibold">
                  {card.label}
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Cost Formula */}
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-5">
        <h3 className="text-xs uppercase tracking-wider text-foreground/40 font-semibold mb-3">
          Cost Per Tour (Estimate)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-foreground/60">GPT Parsing</p>
            <p className="text-foreground font-mono">~$0.04</p>
          </div>
          <div className="space-y-1">
            <p className="text-foreground/60">Content Gen (per place)</p>
            <p className="text-foreground font-mono">~$0.05</p>
          </div>
          <div className="space-y-1">
            <p className="text-foreground/60">TTS (per place, on play)</p>
            <p className="text-foreground font-mono">~$0.076</p>
          </div>
        </div>
      </div>

      {/* Recent Tours Table */}
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-xs uppercase tracking-wider text-foreground/40 font-semibold">
            Recent Tours (Estimated Cost)
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.08] hover:bg-transparent">
              <TableHead className="text-foreground/40">Tour</TableHead>
              <TableHead className="text-foreground/40">Places</TableHead>
              <TableHead className="text-foreground/40">Created</TableHead>
              <TableHead className="text-foreground/40 text-right">Est. Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.recentTours.map((tour) => (
              <TableRow key={tour.id} className="border-white/[0.08]">
                <TableCell className="text-foreground/80 font-medium">{tour.title}</TableCell>
                <TableCell className="text-foreground/50 tabular-nums">{tour.placeCount}</TableCell>
                <TableCell className="text-foreground/50">
                  {new Date(tour.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-foreground/80 font-mono text-right">
                  ${tour.estimatedCost.toFixed(3)}
                </TableCell>
              </TableRow>
            ))}
            {data.recentTours.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-foreground/30 py-8">
                  No tours yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
