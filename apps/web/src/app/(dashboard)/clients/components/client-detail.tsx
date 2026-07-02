'use client';

import { useState, useEffect } from 'react';
import type { Client } from '../lib/clients-api';
import { clientInitials, formatCurrency } from '../lib/client-utils';
import { ClientOverview } from './client-overview';
import { ClientProjects } from './client-projects';
import { ClientInvoices } from './client-invoices';
import { ClientContacts } from './client-contacts';
import { ClientActivity } from './client-activity';

const tabs = ['Overview', 'Projects', 'Invoices', 'Contacts', 'Activity'] as const;
type Tab = (typeof tabs)[number];

interface ClientDetailProps {
  client: Client | null;
  loading: boolean;
  onUpdate: () => void;
  onCreateInvoice?: () => void;
  invoiceTabRequest?: number;
}

export function ClientDetail({ client, loading, onUpdate, onCreateInvoice, invoiceTabRequest }: ClientDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  useEffect(() => {
    if (invoiceTabRequest && invoiceTabRequest > 0) {
      setActiveTab('Invoices');
    }
  }, [invoiceTabRequest]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-xs p-5 lg:col-span-7 h-[480px] flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-xs p-5 lg:col-span-7 h-[480px] flex items-center justify-center text-xs text-muted-foreground">
        Select a client to view details
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-xs p-5 lg:col-span-7 h-[480px] flex flex-col">
      <div className="border-b border-border pb-4">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
            client.isAtRisk ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground'
          }`}>
            {clientInitials(client.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-foreground tracking-tight">{client.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{client.industry ?? '—'}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                {client.isActive ? 'Active' : 'Inactive'}
              </span>
              {client.tier && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                  {client.tier}
                </span>
              )}
              {client.clientCode && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                  {client.clientCode}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="bg-muted/40 border border-border p-2.5 rounded-lg text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">ARR</span>
          <span className="text-sm font-bold text-foreground block mt-0.5">
            {formatCurrency(client.annualRevenue, client.currencyCode)}
          </span>
        </div>
        <div className="bg-muted/40 border border-border p-2.5 rounded-lg text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">MRR</span>
          <span className="text-sm font-bold text-foreground block mt-0.5">
            {formatCurrency(client.monthlyRevenue, client.currencyCode)}
          </span>
        </div>
        <div className="bg-muted/40 border border-border p-2.5 rounded-lg text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">LTV</span>
          <span className="text-sm font-bold text-foreground block mt-0.5">
            {formatCurrency(client.lifetimeValue, client.currencyCode)}
          </span>
        </div>
      </div>

      <div className="flex border-b border-border mb-3 gap-5 text-xs font-medium">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`pb-2 transition border-b-2 font-semibold ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {activeTab === 'Overview' && (
          <ClientOverview client={client} onCreateInvoice={onCreateInvoice} />
        )}
        {activeTab === 'Projects' && (
          <ClientProjects clientId={client.id} projects={client.projects ?? []} onUpdate={onUpdate} />
        )}
        {activeTab === 'Invoices' && (
          <ClientInvoices clientId={client.id} invoices={(client.invoices ?? []) as Parameters<typeof ClientInvoices>[0]['invoices']} onUpdate={onUpdate} />
        )}
        {activeTab === 'Contacts' && (
          <ClientContacts clientId={client.id} contacts={client.contacts ?? []} onUpdate={onUpdate} />
        )}
        {activeTab === 'Activity' && (
          <ClientActivity clientId={client.id} activities={client.activities ?? []} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  );
}
