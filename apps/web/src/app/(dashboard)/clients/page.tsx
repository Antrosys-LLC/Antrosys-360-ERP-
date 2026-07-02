"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Download, Upload, Bell, Settings, HelpCircle, Plus, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/usePermission";
import {
  fetchSummary,
  fetchClients,
  fetchClient,
  fetchSalesPipeline,
  fetchRecentTimeline,
  fetchUpcomingTasks,
  fetchAlerts,
  exportClients,
  importClients,
} from "./lib/clients-api";
import { formatCurrency } from "./lib/client-utils";
import { ClientMetrics } from "./components/client-metrics";
import { ClientList } from "./components/client-list";
import { ClientDetail } from "./components/client-detail";
import { ClientDialog } from "./components/client-dialogs";
import { SalesPipelineBoard } from "./components/sales-pipeline";
import { InteractionTimeline } from "./components/interaction-timeline";
import { UpcomingTasksPanel } from "./components/upcoming-tasks-panel";

export default function ClientManagementDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canWrite = usePermission("clients:write");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoiceTabRequest, setInvoiceTabRequest] = useState(0);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  const { data: pipeline, isLoading: pipelineLoading } = useQuery({
    queryKey: ["client-pipeline"],
    queryFn: fetchSalesPipeline,
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["client-recent-timeline"],
    queryFn: () => fetchRecentTimeline(8),
  });

  const { data: upcomingTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["client-upcoming-tasks"],
    queryFn: () => fetchUpcomingTasks(8),
  });

  const { data: alerts } = useQuery({
    queryKey: ["client-alerts"],
    queryFn: fetchAlerts,
  });

  const clients = clientsResult?.items ?? [];

  const activeClients = useMemo(
    () => clients.filter((c) => c.isActive),
    [clients],
  );

  const filteredClients = useMemo(() => {
    const list = activeClients.length > 0 ? activeClients : clients;
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.clientCode?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q),
    );
  }, [activeClients, clients, searchQuery]);

  useEffect(() => {
    if (!selectedClientId && filteredClients.length > 0) {
      setSelectedClientId(filteredClients[0].id);
    }
  }, [filteredClients, selectedClientId]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["client-summary"] });
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    queryClient.invalidateQueries({ queryKey: ["client-pipeline"] });
    queryClient.invalidateQueries({ queryKey: ["client-recent-timeline"] });
    queryClient.invalidateQueries({ queryKey: ["client-upcoming-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["client-alerts"] });
    if (selectedClientId) {
      queryClient.invalidateQueries({ queryKey: ["client", selectedClientId] });
    }
  }, [queryClient, selectedClientId]);

  const handleSelect = useCallback((id: string) => {
    setSelectedClientId(id);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportClients();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "clients-export.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export complete", description: "Clients exported as CSV." });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const csv = await file.text();
      const result = await importClients(csv);
      refresh();
      toast({ title: "Import complete", description: `${result.imported} clients imported.` });
    } catch {
      toast({ title: "Import failed", variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const now = new Date();
  const monthYear = now.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const statusLine = summary
    ? `${summary.activeClients} active clients · ${formatCurrency(summary.totalAnnualRevenue)} ARR · ${monthYear}`
    : null;

  const alertMessage = alerts?.message;

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Client management</span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Client management</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial sm:min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing || !canWrite}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium bg-card hover:bg-muted transition disabled:opacity-50"
            >
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span>{importing ? "Importing..." : "Import"}</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium bg-card hover:bg-muted transition disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
              <span>{exporting ? "Exporting..." : "Export"}</span>
            </button>
            <div className="hidden md:flex items-center border border-border rounded-lg p-1 bg-card gap-0.5">
              <button type="button" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" aria-label="Notifications"><Bell className="h-4 w-4" /></button>
              <button type="button" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" aria-label="Settings"><Settings className="h-4 w-4" /></button>
              <button type="button" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" aria-label="Help"><HelpCircle className="h-4 w-4" /></button>
            </div>
            {canWrite && (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add client</span>
              </button>
            )}
          </div>
        </div>
        {statusLine && (
          <p className="text-xs text-muted-foreground font-medium">{statusLine}</p>
        )}
      </header>

      {/* KPI Metrics */}
      <ClientMetrics summary={summary ?? null} loading={summaryLoading} />

      {/* Master-detail workspace */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <ClientList
          clients={filteredClients}
          selectedClientId={selectedClientId}
          onSelect={handleSelect}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          loading={clientsLoading}
          totalCount={clientsResult?.pagination.total}
        />
        <ClientDetail
          client={selectedClient ?? null}
          loading={detailLoading}
          onUpdate={refresh}
          onCreateInvoice={() => setInvoiceTabRequest((n) => n + 1)}
          invoiceTabRequest={invoiceTabRequest}
        />
      </section>

      {/* Alert banner */}
      {alertMessage && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 px-4 py-3 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-300">
            <strong className="font-bold">Urgent Action Required:</strong> {alertMessage}
          </p>
        </div>
      )}

      {/* Sales Pipeline */}
      <SalesPipelineBoard pipeline={pipeline ?? null} loading={pipelineLoading} />

      {/* Bottom row: Timeline + Tasks */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InteractionTimeline events={timeline ?? []} loading={timelineLoading} />
        <UpcomingTasksPanel tasks={upcomingTasks ?? []} loading={tasksLoading} onUpdate={refresh} />
      </section>

      <ClientDialog open={dialogOpen} onOpenChange={setDialogOpen} client={null} onSaved={refresh} />
    </div>
  );
}
