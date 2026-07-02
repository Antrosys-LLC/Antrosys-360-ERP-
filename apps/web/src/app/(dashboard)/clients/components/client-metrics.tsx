'use client';

import type { ClientSummary } from '../lib/clients-api';
import { formatCurrency } from '../lib/client-utils';

interface ClientMetricsProps {
  summary: ClientSummary | null;
  loading: boolean;
}

export function ClientMetrics({ summary, loading }: ClientMetricsProps) {
  const dist = summary?.lifecycleDistribution ?? { active: 65, prospect: 25, atRisk: 10 };

  const items = [
    { label: 'Total ARR', value: formatCurrency(summary?.totalAnnualRevenue), color: 'text-emerald-600' },
    { label: 'MRR', value: formatCurrency(summary?.totalMonthlyRevenue), color: 'text-emerald-600' },
    { label: 'Active Clients', value: summary?.activeClients ?? '—', color: 'text-foreground' },
    { label: 'At-risk', value: summary?.atRiskClients ?? '—', color: 'text-destructive' },
    { label: 'Renewal Pipeline', value: summary?.upcomingRenewals ?? '—', color: 'text-foreground' },
    { label: 'Prospect Pipeline', value: summary?.prospectPipeline ?? '—', color: 'text-foreground' },
  ];

  return (
    <section className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {items.map((item, i) => (
          <div key={item.label} className={`pt-1 ${i > 0 ? 'lg:border-l lg:border-border lg:pl-4' : ''}`}>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{item.label}</span>
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
      <div className="space-y-1.5 pt-1">
        <span className="text-xs text-muted-foreground font-medium">Client lifecycle distribution</span>
        <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden flex">
          <div className="bg-primary h-full transition-all" style={{ width: `${dist.active}%` }} />
          <div className="bg-violet-300 h-full transition-all" style={{ width: `${dist.prospect}%` }} />
          <div className="bg-destructive h-full transition-all" style={{ width: `${dist.atRisk}%` }} />
        </div>
      </div>
    </section>
  );
}
