'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import type { Client } from '../lib/clients-api';
import { formatCurrency, parseHealthMetrics, healthBarColor } from '../lib/client-utils';

interface ClientOverviewProps {
  client: Client;
  onCreateInvoice?: () => void;
}

const HEALTH_LABELS = [
  { key: 'productUsage' as const, label: 'Product Usage' },
  { key: 'supportTickets' as const, label: 'Support Tickets' },
  { key: 'paymentHistory' as const, label: 'Payment History' },
  { key: 'engagement' as const, label: 'Engagement' },
  { key: 'nps' as const, label: 'NPS' },
];

export function ClientOverview({ client, onCreateInvoice }: ClientOverviewProps) {
  const metrics = parseHealthMetrics(client.healthMetrics);
  const score = client.healthScore ?? 75;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs font-bold text-foreground">Account Health</span>
          <span className={`text-2xl font-bold ${score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-destructive'}`}>
            {score}
            <span className="text-sm text-muted-foreground font-medium">/100</span>
          </span>
        </div>
        <div className="w-full bg-muted h-2 rounded-full overflow-hidden mb-4">
          <div className={`h-full rounded-full ${healthBarColor(score)}`} style={{ width: `${score}%` }} />
        </div>
        <div className="space-y-2.5">
          {HEALTH_LABELS.map(({ key, label }) => {
            const val = metrics[key];
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold text-foreground">{val}%</span>
                </div>
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${healthBarColor(val)}`} style={{ width: `${val}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {onCreateInvoice && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onCreateInvoice}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition shadow-sm"
          >
            <FileText className="h-3.5 w-3.5" />
            Create Invoice
          </button>
        </div>
      )}
    </div>
  );
}
