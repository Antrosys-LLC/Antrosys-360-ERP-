'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import type { Client } from '../lib/clients-api';
import { clientInitials, formatCurrency, formatRenewalDate, healthColor } from '../lib/client-utils';

interface ClientListProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  loading: boolean;
  totalCount?: number;
}

export function ClientList({ clients, selectedClientId, onSelect, searchQuery, onSearchChange, loading, totalCount }: ClientListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden lg:col-span-5 flex flex-col h-[480px]">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-sm text-foreground">
          All clients
          <span className="text-muted-foreground font-normal"> · </span>
          <span className="text-muted-foreground font-semibold">{loading ? '...' : `${totalCount ?? clients.length} accounts`}</span>
        </h3>
        <div className="flex items-center gap-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-28 pl-7 pr-2 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <button type="button" className="p-1.5 rounded hover:bg-muted text-muted-foreground" aria-label="Filters">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No clients found</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-muted/50 z-10">
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                <th className="p-2.5 w-8" />
                <th className="p-2.5">Client</th>
                <th className="p-2.5 text-right">ARR</th>
                <th className="p-2.5 text-center">Health</th>
                <th className="p-2.5 text-right">Renewal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {clients.map((client) => {
                const isSelected = selectedClientId === client.id;
                const renewal = formatRenewalDate(client.renewalDueAt);
                const score = client.healthScore ?? 75;
                return (
                  <tr
                    key={client.id}
                    onClick={() => onSelect(client.id)}
                    className={`cursor-pointer transition ${isSelected ? 'bg-primary/8' : 'hover:bg-muted/40'}`}
                  >
                    <td className="p-2.5">
                      <input
                        type="checkbox"
                        checked={checked.has(client.id)}
                        onChange={() => {}}
                        onClick={(e) => toggleCheck(client.id, e)}
                        className="rounded border-border text-primary focus:ring-primary/30 h-3.5 w-3.5"
                      />
                    </td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          client.isAtRisk ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground'
                        }`}>
                          {client.isAtRisk ? <AlertTriangle className="h-3.5 w-3.5" /> : clientInitials(client.name)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-foreground text-sm block truncate">{client.name}</span>
                          <span className="text-[11px] text-muted-foreground truncate block">
                            {client.industry ?? client.pipelineStage} · {client.clientCode ?? client.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-2.5 text-right font-semibold text-emerald-600 text-xs whitespace-nowrap">
                      {formatCurrency(client.annualRevenue, client.currencyCode)}
                    </td>
                    <td className={`p-2.5 text-center text-xs font-bold ${healthColor(score)}`}>
                      {score}%
                    </td>
                    <td className="p-2.5 text-right">
                      <span className={`font-medium block text-xs ${client.isAtRisk ? 'text-destructive' : 'text-foreground'}`}>
                        {renewal.label}
                      </span>
                      {renewal.sub && (
                        <span className={`text-[10px] block ${client.isAtRisk ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {renewal.sub}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
