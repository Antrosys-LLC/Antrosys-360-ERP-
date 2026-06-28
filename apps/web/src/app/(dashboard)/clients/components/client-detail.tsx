'use client';

import { useState } from 'react';
import type { Client } from '../lib/clients-api';
import { ClientOverview } from './client-overview';
import { ClientProjects } from './client-projects';
import { ClientInvoices } from './client-invoices';
import { ClientActivity } from './client-activity';
import { ClientTimeline } from './client-timeline';

const tabs = ['Overview', 'Projects', 'Invoices', 'Activity', 'Timeline'] as const;
type Tab = (typeof tabs)[number];

interface ClientDetailProps {
  client: Client | null;
  loading: boolean;
  onUpdate: () => void;
}

const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const stageBadge: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600',
  PROSPECT: 'bg-blue-500/10 text-blue-600',
  PROPOSAL: 'bg-violet-500/10 text-violet-600',
  NEGOTIATION: 'bg-amber-500/10 text-amber-600',
  AT_RISK: 'bg-rose-500/10 text-rose-600',
};

export function ClientDetail({ client, loading, onUpdate }: ClientDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-xs p-5 lg:col-span-6 h-[520px] flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-xs p-5 lg:col-span-6 h-[520px] flex items-center justify-center text-xs text-muted-foreground">
        Select a client to view details
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-xs p-5 lg:col-span-6 h-[520px] flex flex-col">
      <div className="flex items-start justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold shadow-xs shrink-0 ${
            client.isAtRisk ? 'bg-rose-500 text-white' : 'bg-primary text-primary-foreground'
          }`}>
            {initials(client.name)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">{client.name}</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 font-medium flex-wrap">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stageBadge[client.pipelineStage] || 'bg-muted'}`}>
                {client.pipelineStage}
              </span>
              {client.email && <span>{client.email}</span>}
              {client.phone && <span>• {client.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="bg-muted/40 border border-border p-3 rounded-lg text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">ARR</span>
          <span className="text-sm font-bold text-foreground block mt-1 font-mono">
            {client.annualRevenue != null ? `PKR ${(client.annualRevenue / 1e6).toFixed(1)}M` : '—'}
          </span>
        </div>
        <div className="bg-muted/40 border border-border p-3 rounded-lg text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">MRR</span>
          <span className="text-sm font-bold text-foreground block mt-1 font-mono">
            {client.monthlyRevenue != null ? `PKR ${(client.monthlyRevenue / 1e6).toFixed(1)}M` : '—'}
          </span>
        </div>
        <div className="bg-muted/40 border border-border p-3 rounded-lg text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Projects</span>
          <span className="text-sm font-bold text-foreground block mt-1 font-mono">{client._count?.projects ?? 0}</span>
        </div>
      </div>

      <div className="flex border-b border-border mb-4 gap-4 text-xs font-medium">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 transition border-b-2 font-bold ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        {activeTab === 'Overview' && <ClientOverview client={client} />}
        {activeTab === 'Projects' && <ClientProjects clientId={client.id} projects={client.projects ?? []} onUpdate={onUpdate} />}
        {activeTab === 'Invoices' && <ClientInvoices invoices={client.invoices ?? []} />}
        {activeTab === 'Activity' && <ClientActivity clientId={client.id} activities={client.activities ?? []} onUpdate={onUpdate} />}
        {activeTab === 'Timeline' && <ClientTimeline clientId={client.id} events={client.timelineEvents ?? []} />}
      </div>
    </div>
  );
}
