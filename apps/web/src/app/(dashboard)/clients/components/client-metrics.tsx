'use client';

import type { ClientSummary } from '../lib/clients-api';

interface ClientMetricsProps {
  summary: ClientSummary | null;
  loading: boolean;
}

export function ClientMetrics({ summary, loading }: ClientMetricsProps) {
  const fmt = (val: number | null | undefined) =>
    val != null ? `PKR ${(val / 1e6).toFixed(1)}M` : '—';

  const items = [
    { label: 'Total ARR', value: fmt(summary?.totalAnnualRevenue), color: 'text-emerald-600' },
    { label: 'MRR', value: fmt(summary?.totalMonthlyRevenue), color: 'text-foreground' },
    { label: 'Active Clients', value: summary?.activeClients ?? '—', color: 'text-foreground' },
    { label: 'At-risk', value: summary?.atRiskClients ?? '—', color: 'text-destructive' },
    { label: 'Renewal Pipeline', value: summary?.upcomingRenewals ?? '—', color: 'text-foreground' },
    { label: 'Prospect Pipeline', value: summary?.prospectPipeline ?? '—', color: 'text-foreground' },
  ];

  return (
    <section className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 divide-y md:divide-y-0 lg:divide-x divide-border">
        {items.map((item) => (
          <div key={item.label} className="pt-2 md:pt-0 lg:pl-4 first:lg:pl-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase">{item.label}</span>
            <div className={`text-xl font-bold mt-1 ${item.color}`}>
              {loading ? (
                <span className="inline-block w-16 h-6 bg-muted rounded animate-pulse" />
              ) : (
                item.value
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5 pt-2">
        <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
          <span>Client lifecycle distribution</span>
        </div>
        <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden flex">
          <div className="bg-primary h-full" style={{ width: '65%' }} />
          <div className="bg-amber-400 h-full" style={{ width: '25%' }} />
          <div className="bg-destructive h-full" style={{ width: '10%' }} />
        </div>
      </div>
    </section>
  );
}
