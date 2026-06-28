'use client';

import { Search, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import type { Client } from '../lib/clients-api';

interface ClientListProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  loading: boolean;
}

const stageColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600',
  PROSPECT: 'bg-blue-500/10 text-blue-600',
  PROPOSAL: 'bg-violet-500/10 text-violet-600',
  NEGOTIATION: 'bg-amber-500/10 text-amber-600',
};

const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export function ClientList({ clients, selectedClientId, onSelect, searchQuery, onSearchChange, loading }: ClientListProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden lg:col-span-6 flex flex-col h-[520px]">
      <div className="p-4 border-b border-border flex items-center justify-between bg-card">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <span>All clients</span>
          <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-md font-semibold border border-border">
            {loading ? '...' : `${clients.length} accounts`}
          </span>
        </h3>
        <div className="flex items-center gap-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-32 pl-7 pr-2 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <button className="p-1.5 rounded hover:bg-muted text-muted-foreground">
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
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            No clients found
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/30 font-bold">
                <th className="p-3">Client</th>
                <th className="p-3 text-right">ARR</th>
                <th className="p-3 text-center">Health</th>
                <th className="p-3 text-right">Renewal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {clients.map((client) => {
                const isSelected = selectedClientId === client.id;
                return (
                  <tr
                    key={client.id}
                    onClick={() => onSelect(client.id)}
                    className={`cursor-pointer transition group ${isSelected ? 'bg-secondary/60 font-medium' : 'hover:bg-muted/40'}`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          client.isAtRisk ? 'bg-rose-500 text-white' : 'bg-primary text-primary-foreground'
                        }`}>
                          {initials(client.name)}
                        </div>
                        <div className="truncate max-w-[160px]">
                          <span className="font-bold text-foreground text-sm block truncate flex items-center gap-1">
                            {client.name}
                            {client.isAtRisk && <AlertTriangle className="h-3.5 w-3.5 text-destructive inline shrink-0" />}
                          </span>
                          <span className="text-xs text-muted-foreground truncate block font-normal">
                            {client.pipelineStage} • {client.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right font-semibold text-emerald-600 font-mono text-xs">
                      {client.annualRevenue != null
                        ? `PKR ${(client.annualRevenue / 1e6).toFixed(1)}M`
                        : '—'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${stageColors[client.pipelineStage] || 'bg-muted text-muted-foreground'}`}>
                        {client.pipelineStage}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {client.renewalDueAt ? (
                        <>
                          <span className="font-medium text-foreground block text-xs">
                            {new Date(client.renewalDueAt).toLocaleDateString()}
                          </span>
                          {client.isAtRisk && (
                            <span className="text-[10px] block font-semibold text-destructive">At Risk</span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
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
