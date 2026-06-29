'use client';

import type { Client } from '../lib/clients-api';

interface ClientOverviewProps {
  client: Client;
}

export function ClientOverview({ client }: ClientOverviewProps) {
  const metrics = [
    { label: 'Pipeline Stage', value: client.pipelineStage },
    { label: 'Status', value: client.isActive ? 'Active' : 'Inactive' },
    { label: 'Currency', value: client.currencyCode },
    { label: 'Renewal Due', value: client.renewalDueAt ? new Date(client.renewalDueAt).toLocaleDateString() : 'Not set' },
    { label: 'At Risk', value: client.isAtRisk ? 'Yes' : 'No' },
    { label: 'Monthly Revenue', value: client.monthlyRevenue != null ? `PKR ${client.monthlyRevenue.toLocaleString()}` : '—' },
    { label: 'Annual Revenue', value: client.annualRevenue != null ? `PKR ${client.annualRevenue.toLocaleString()}` : '—' },
    { label: 'Invoices', value: client._count?.invoices ?? 0 },
    { label: 'Projects', value: client._count?.projects ?? 0 },
    { label: 'Tasks', value: client._count?.tasks ?? 0 },
  ];

  const healthMetrics = [
    { name: 'Pipeline Stage', value: client.pipelineStage === 'ACTIVE' ? 90 : client.isAtRisk ? 30 : 60 },
    { name: 'Revenue Trend', value: client.annualRevenue && client.annualRevenue > 0 ? 80 : 40 },
    { name: 'Account Activity', value: (client._count?.invoices ?? 0) > 0 ? 75 : 30 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className="bg-muted/40 border border-border/80 rounded-lg p-2.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">{m.label}</span>
            <span className="text-xs font-bold text-foreground block mt-0.5 truncate">{String(m.value)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-3">
        <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block mb-2">Account Health Indicators</span>
        <div className="space-y-2">
          {healthMetrics.map((m, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-foreground/80">
                <span>{m.name}</span>
                <span className="font-mono text-muted-foreground">{m.value}%</span>
              </div>
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    m.value >= 80 ? 'bg-emerald-600' : m.value >= 50 ? 'bg-amber-500' : 'bg-destructive'
                  }`}
                  style={{ width: `${m.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
