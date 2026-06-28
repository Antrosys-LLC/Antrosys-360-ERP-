"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Download, Upload, Bell, Settings, HelpCircle, Plus, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/usePermission";
import { fetchSummary, fetchClients, fetchClient } from "./lib/clients-api";
import { ClientMetrics } from "./components/client-metrics";
import { ClientList } from "./components/client-list";
import { ClientDetail } from "./components/client-detail";
import { ClientDialog } from "./components/client-dialogs";

export default function ClientManagementDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canWrite = usePermission("clients:write");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["client-summary"],
    queryFn: fetchSummary,
  });

  const { data: clientsResult, isLoading: clientsLoading } = useQuery({
    queryKey: ["clients", searchQuery],
    queryFn: () => fetchClients({ search: searchQuery || undefined, limit: 100 }),
  });

  const { data: selectedClient, isLoading: detailLoading } = useQuery({
    queryKey: ["client", selectedClientId],
    queryFn: () => fetchClient(selectedClientId!),
    enabled: !!selectedClientId,
  });

  const clients = clientsResult?.items ?? [];

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.pipelineStage.toLowerCase().includes(q),
    );
  }, [clients, searchQuery]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["client-summary"] });
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    if (selectedClientId) {
      queryClient.invalidateQueries({ queryKey: ["client", selectedClientId] });
    }
  }, [queryClient, selectedClientId]);

  const handleSelect = useCallback((id: string) => {
    setSelectedClientId(id === selectedClientId ? null : id);
  }, [selectedClientId]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 lg:p-8 space-y-6">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card border border-border rounded-xl p-4 shadow-xs">
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Client management</span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">Client Management</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium bg-card hover:bg-muted transition">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span>Import</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium bg-card hover:bg-muted transition">
            <Download className="h-4 w-4 text-muted-foreground" />
            <span>Export</span>
          </button>
          <div className="flex items-center border border-border rounded-lg p-1 bg-background gap-1">
            <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Bell className="h-4 w-4" /></button>
            <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Settings className="h-4 w-4" /></button>
            <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><HelpCircle className="h-4 w-4" /></button>
          </div>
          {canWrite && (
            <button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add client</span>
            </button>
          )}
        </div>
      </header>

      {/* Metrics */}
      <ClientMetrics summary={summary ?? null} loading={summaryLoading} />

      {/* Main workspace */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <ClientList
          clients={filteredClients}
          selectedClientId={selectedClientId}
          onSelect={handleSelect}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          loading={clientsLoading}
        />
        <ClientDetail
          client={selectedClient ?? null}
          loading={detailLoading}
          onUpdate={refresh}
        />
      </section>

      {/* Alert strip */}
      {summary?.atRiskClients && summary.atRiskClients > 0 ? (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3.5 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="font-bold">Urgent Action Required:</strong> {summary.atRiskClients} client{summary.atRiskClients > 1 ? 's are' : ' is'} at risk with renewals approaching. Immediate outreach recommended.
          </div>
        </div>
      ) : null}

      {/* Dialogs */}
      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={null}
        onSaved={refresh}
      />
    </div>
  );
}
