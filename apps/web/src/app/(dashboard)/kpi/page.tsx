"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Download,
  Grid,
  List,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createKpi,
  deleteKpi,
  exportKpisCsv,
  fetchDepartmentAggregates,
  fetchKpiOverview,
  fetchKpiOwners,
  fetchKpis,
  updateKpi,
  type Kpi,
  type KpiDepartment,
  type KpiOwnerOption,
  type KpiPayload,
  type KpiStatus,
} from "@/lib/kpi-api";

const DEPARTMENTS: KpiDepartment[] = [
  "ENGINEERING",
  "OPERATIONS",
  "SALES",
  "FINANCE",
  "HR",
  "OTHER",
];

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

const STATUS_ORDER: KpiStatus[] = ["ON_TRACK", "AT_RISK", "OFF_TRACK", "EXCEEDED"];

const STATUS_LABELS: Record<KpiStatus, string> = {
  ON_TRACK: "On track",
  AT_RISK: "At risk",
  OFF_TRACK: "Off track",
  EXCEEDED: "Exceeded",
};

const STATUS_DOT: Record<KpiStatus, string> = {
  ON_TRACK: "bg-emerald-500",
  AT_RISK: "bg-amber-500",
  OFF_TRACK: "bg-destructive",
  EXCEEDED: "bg-primary",
};

const STATUS_BADGE: Record<KpiStatus, string> = {
  ON_TRACK: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  AT_RISK: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  OFF_TRACK: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  EXCEEDED: "bg-secondary text-secondary-foreground",
};

const PROGRESS_BG: Record<KpiStatus, string> = {
  ON_TRACK: "bg-emerald-700",
  AT_RISK: "bg-amber-600",
  OFF_TRACK: "bg-destructive",
  EXCEEDED: "bg-primary",
};

function currentQuarter(): string {
  return `Q${Math.min(4, Math.floor(new Date().getUTCMonth() / 3) + 1)}`;
}

function currentYear(): number {
  return new Date().getUTCFullYear();
}

function formatValue(value: number | null | undefined, unit: string | null): string {
  if (value == null) return "—";
  const num = Number.isInteger(value) ? String(value) : value.toFixed(1);
  if (!unit || unit === "#") return num;
  return /^[A-Za-z]/.test(unit) ? `${num} ${unit}` : `${num}${unit}`;
}

function TrendBars({ data, status }: { data: number[]; status: KpiStatus }) {
  const max = Math.max(...data, 1);
  const color =
    status === "OFF_TRACK"
      ? "bg-destructive"
      : status === "AT_RISK"
        ? "bg-amber-500"
        : "bg-primary";

  if (data.length === 0) {
    return (
      <div className="mt-4 h-8 flex items-center justify-center text-[11px] text-muted-foreground">
        No trend data
      </div>
    );
  }

  return (
    <div className="mt-4 h-8 flex items-end gap-1 w-full justify-between px-1">
      {data.map((val, idx) => (
        <div
          key={idx}
          className={`w-full rounded-sm transition-all opacity-60 ${color}`}
          style={{ height: `${Math.max(4, (val / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// KPI FORM DIALOG (create / edit)
// ============================================================================

function KpiFormDialog({
  open,
  onOpenChange,
  initial,
  owners,
  defaultQuarter,
  defaultYear,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Kpi | null;
  owners: KpiOwnerOption[];
  defaultQuarter: string;
  defaultYear: number;
  onSubmit: (payload: KpiPayload) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<KpiPayload>(() => ({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    department: initial?.department ?? null,
    ownerEmployeeId: initial?.owner?.id ?? null,
    unit: initial?.unit ?? "",
    targetValue: initial?.targetValue ?? null,
    currentValue: initial?.currentValue ?? null,
    progress: initial?.progress ?? undefined,
    status: initial?.status ?? "ON_TRACK",
    trend: initial?.trend ?? [],
    quarter: initial?.quarter ?? defaultQuarter,
    year: initial?.year ?? defaultYear,
  }));

  const set = <K extends keyof KpiPayload>(key: K, value: KpiPayload[K] | null) =>
    setForm((f) => ({ ...f, [key]: value as KpiPayload[K] }));

  const toNullableNumber = (raw: string): number | null => {
    if (raw.trim() === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit KPI" : "Create KPI"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Update the metric details below."
              : "Define a new metric to track for the selected period."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="kpi-name">KPI name *</Label>
            <Input
              id="kpi-name"
              required
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Revenue Growth"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="kpi-description">Description</Label>
            <Input
              id="kpi-description"
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What does this metric measure?"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="kpi-dept">Department</Label>
              <select
                id="kpi-dept"
                className={inputCls}
                value={form.department ?? ""}
                onChange={(e) =>
                  set("department", (e.target.value || null) as KpiDepartment | null)
                }
              >
                <option value="">Company-wide</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="kpi-owner">Owner</Label>
              <select
                id="kpi-owner"
                className={inputCls}
                value={form.ownerEmployeeId ?? ""}
                onChange={(e) => set("ownerEmployeeId", e.target.value || null)}
              >
                <option value="">Unassigned</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="kpi-target">Target</Label>
              <Input
                id="kpi-target"
                type="number"
                step="any"
                value={form.targetValue ?? ""}
                onChange={(e) => set("targetValue", toNullableNumber(e.target.value))}
                placeholder="—"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kpi-current">Current</Label>
              <Input
                id="kpi-current"
                type="number"
                step="any"
                value={form.currentValue ?? ""}
                onChange={(e) => set("currentValue", toNullableNumber(e.target.value))}
                placeholder="—"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kpi-unit">Unit</Label>
              <Input
                id="kpi-unit"
                value={form.unit ?? ""}
                onChange={(e) => set("unit", e.target.value)}
                placeholder="%, pts, $"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kpi-status">Status</Label>
              <select
                id="kpi-status"
                className={inputCls}
                value={form.status}
                onChange={(e) => set("status", e.target.value as KpiStatus)}
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="kpi-quarter">Quarter</Label>
              <select
                id="kpi-quarter"
                className={inputCls}
                value={form.quarter ?? ""}
                onChange={(e) => set("quarter", e.target.value || null)}
              >
                {QUARTERS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kpi-year">Year</Label>
              <Input
                id="kpi-year"
                type="number"
                value={form.year ?? ""}
                onChange={(e) =>
                  set("year", e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kpi-progress">Progress % (optional)</Label>
              <Input
                id="kpi-progress"
                type="number"
                min={0}
                max={100}
                value={form.progress ?? ""}
                onChange={(e) =>
                  set("progress", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="auto"
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initial ? "Save changes" : "Create KPI"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function KPITrackerPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canRead = usePermission("kpi:read");
  const canWrite = usePermission("kpi:write");

  if (!canRead) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            You don&apos;t have access to the KPI tracker.
          </p>
        </div>
      </div>
    );
  }

  const [activeQuarter, setActiveQuarter] = useState(currentQuarter());
  const [activeYear, setActiveYear] = useState(currentYear());
  const [selectedDept, setSelectedDept] = useState<"ALL" | KpiDepartment>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | KpiStatus>("ALL");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "chart">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Kpi | null>(null);
  const [deleting, setDeleting] = useState<Kpi | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const filters = useMemo(
    () => ({
      quarter: activeQuarter,
      year: activeYear,
      department: selectedDept === "ALL" ? undefined : selectedDept,
      status: selectedStatus === "ALL" ? undefined : selectedStatus,
      search: search.trim() || undefined,
      limit: 100,
    }),
    [activeQuarter, activeYear, selectedDept, selectedStatus, search],
  );

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["kpi-overview", filters],
    queryFn: () => fetchKpiOverview(filters),
  });

  const { data: departments } = useQuery({
    queryKey: ["kpi-departments", filters.quarter, filters.year],
    queryFn: () => fetchDepartmentAggregates({ quarter: filters.quarter, year: filters.year }),
  });

  const {
    data: list,
    isLoading: listLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["kpis", filters],
    queryFn: () => fetchKpis(filters),
  });

  const { data: owners } = useQuery({
    queryKey: ["kpi-owners"],
    queryFn: fetchKpiOwners,
    enabled: canWrite,
  });

  const kpis = list?.items ?? [];

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["kpis"] });
    queryClient.invalidateQueries({ queryKey: ["kpi-overview"] });
    queryClient.invalidateQueries({ queryKey: ["kpi-departments"] });
  };

  const handleExport = async () => {
    try {
      await exportKpisCsv(filters);
      toast({ title: "Export complete", description: "KPI report downloaded successfully." });
    } catch {
      toast({ title: "Export failed", description: "Could not download the KPI report.", variant: "destructive" });
    }
  };

  const handleSubmit = async (payload: KpiPayload) => {
    try {
      if (editing) {
        await updateKpi(editing.id, payload);
        toast({ title: "KPI updated", description: `${payload.name} was updated.` });
      } else {
        await createKpi(payload);
        toast({ title: "KPI created", description: `${payload.name} was added to the tracker.` });
      }
      invalidateAll();
      setFormOpen(false);
      setEditing(null);
    } catch (error: any) {
      const message =
        error?.response?.data?.details?.fieldErrors?.name?.[0] ??
        error?.response?.data?.error ??
        "Something went wrong while saving the KPI.";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await deleteKpi(deleting.id);
      toast({ title: "KPI deleted", description: `${deleting.name} was removed.` });
      invalidateAll();
      setDeleting(null);
    } catch {
      toast({ title: "Delete failed", description: "Could not delete the KPI.", variant: "destructive" });
    } finally {
      setDeletingBusy(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (kpi: Kpi) => {
    setEditing(kpi);
    setFormOpen(true);
  };

  const filteredDepartments = departments ?? [];

  return (
    <div className="min-h-screen p-6">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
            <span>Performance</span> &gt; <span className="text-foreground/70">KPI tracker</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <h2 className="text-xl font-bold tracking-tight">KPI tracker</h2>
            <span className="bg-muted text-muted-foreground text-[11px] font-medium px-2 py-0.5 rounded border border-border">
              Company-wide · {activeQuarter} {activeYear}
            </span>
            {overview && (
              <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Overall: {overview.onTrackPct}% on track
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
          {canWrite && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create KPI
            </Button>
          )}
        </div>
      </header>

      {/* OVERVIEW BANNER */}
      <section className="bg-card text-card-foreground rounded-lg border border-border p-4 my-5 shadow-sm">
        {overviewLoading || !overview ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 items-center gap-4">
            <div className="flex items-center gap-3 border-r border-border last:border-0 pr-2">
              <div className="relative flex items-center justify-center h-12 w-12 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary"
                    strokeDasharray={`${overview.avgProgress}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[13px] font-bold">{overview.total}</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total KPIs</p>
                <p className="text-xs font-medium text-muted-foreground/80">
                  {overview.avgProgress}% avg progress
                </p>
              </div>
            </div>

            {(
              [
                ["On track", overview.onTrack, "bg-emerald-500"],
                ["At risk", overview.atRisk, "bg-amber-500"],
                ["Off track", overview.offTrack, "bg-destructive"],
                ["Exceeded", overview.exceeded, "bg-primary"],
              ] as const
            ).map(([label, count, dot], idx) => (
              <div key={label} className={`px-2 ${idx < 3 ? "md:border-r border-border" : ""} last:border-0`}>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dot}`}></span>
                  <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
                </div>
                <p className="text-xl font-bold mt-0.5">{count}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* DEPARTMENT AVG STRIP */}
      {filteredDepartments.length > 0 && (
        <section className="bg-card text-card-foreground rounded-lg border border-border p-3 my-5 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            <Target className="h-3.5 w-3.5" />
            Department KPI average
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredDepartments.map((d) => (
              <button
                key={d.department ?? "ALL"}
                onClick={() => setSelectedDept((d.department as KpiDepartment) ?? "ALL")}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors ${
                  selectedDept === d.department
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[d.status]}`} />
                {d.department ? d.department.charAt(0) + d.department.slice(1).toLowerCase() : "Company-wide"}
                <span className="text-muted-foreground/70">· {d.avgProgress}%</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* CONTROLS */}
      <div className="flex items-center justify-between my-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quarter selector */}
          <div className="bg-card border border-border rounded-md p-0.5 flex">
            {QUARTERS.map((q) => (
              <button
                key={q}
                onClick={() => setActiveQuarter(q)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded transition-all ${
                  activeQuarter === q
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {q}
              </button>
            ))}
            <input
              type="number"
              value={activeYear}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v) && v >= 2000 && v <= 2100) setActiveYear(v);
              }}
              className="w-16 text-center text-[11px] font-semibold bg-transparent border-l border-border ml-1"
              aria-label="Year"
            />
          </div>

          {/* Status tabs */}
          <div className="bg-card border border-border rounded-md p-0.5 flex">
            {(["ALL", ...STATUS_ORDER] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded transition-all ${
                  selectedStatus === st
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st === "ALL" ? "All" : STATUS_LABELS[st]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search KPIs..."
              className="h-8 w-48 pl-8 text-xs"
            />
          </div>

          {/* View modes */}
          <div className="bg-card border border-border rounded-md p-0.5 flex items-center">
            {(
              [
                ["grid", Grid],
                ["list", List],
                ["chart", Activity],
              ] as const
            ).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-1.5 rounded ${viewMode === mode ? "bg-muted text-primary" : "text-muted-foreground"}`}
                aria-label={`${mode} view`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {listLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-4">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-1.5 w-full mb-4" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-medium">Failed to load KPIs</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : kpis.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Target className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            No KPIs found for {activeQuarter} {activeYear}
          </p>
          {canWrite && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create the first KPI
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.id}
              kpi={kpi}
              canWrite={canWrite}
              onEdit={() => openEdit(kpi)}
              onDelete={() => setDeleting(kpi)}
            />
          ))}
        </div>
      ) : viewMode === "list" ? (
        <ListView kpis={kpis} canWrite={canWrite} onEdit={openEdit} onDelete={(k) => setDeleting(k)} />
      ) : (
        <ChartView departments={filteredDepartments} onSelect={(dept) => setSelectedDept(dept)} />
      )}

      {/* CREATE / EDIT DIALOG */}
      {formOpen && (
        <KpiFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
          initial={editing}
          owners={owners ?? []}
          defaultQuarter={activeQuarter}
          defaultYear={activeYear}
          onSubmit={handleSubmit}
        />
      )}

      {/* DELETE CONFIRM */}
      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete KPI</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleting?.name}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={deletingBusy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletingBusy}>
              {deletingBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// KPI CARD
// ============================================================================

function KpiCard({
  kpi,
  canWrite,
  onEdit,
  onDelete,
}: {
  kpi: Kpi;
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative bg-card text-card-foreground rounded-lg border border-border shadow-sm flex flex-col justify-between overflow-hidden transition-all hover:shadow-md">
      {/* Off-track alert strip */}
      {kpi.status === "OFF_TRACK" && (
        <div className="bg-destructive/10 text-destructive text-[10px] font-bold px-3 py-1 flex items-center gap-1 border-b border-destructive/20">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>Below {kpi.quarter} {kpi.year} target</span>
        </div>
      )}

      {/* Exceeded tag */}
      {kpi.status === "EXCEEDED" && (
        <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-[8px] font-bold px-2 py-0.5 rounded-bl uppercase tracking-wider">
          Exceeded
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[kpi.status]}`}></span>
            <h3 className="text-xs font-bold tracking-tight">{kpi.name}</h3>
          </div>
          {canWrite && (
            <div className="relative">
              <button
                className="text-muted-foreground hover:text-foreground rounded-md p-0.5"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="KPI actions"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-6 z-20 w-36 bg-popover text-popover-foreground border border-border rounded-md shadow-lg p-1">
                    <button
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] rounded hover:bg-muted"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit();
                      }}
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] rounded hover:bg-muted text-destructive"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete();
                      }}
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-lg font-extrabold tracking-tight">
            {formatValue(kpi.currentValue, kpi.unit)}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            / {formatValue(kpi.targetValue, kpi.unit)}
          </span>
        </div>

        <div className="w-full bg-muted h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className={`h-full rounded-full ${PROGRESS_BG[kpi.status]}`}
            style={{ width: `${Math.min(100, kpi.progress)}%` }}
          />
        </div>

        <TrendBars data={kpi.trend} status={kpi.status} />
      </div>

      <div className="bg-muted/50 border-t border-border px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
        <div className="flex items-center gap-1.5">
          {kpi.owner ? (
            <>
              <span className="h-4 w-4 rounded-full bg-primary/15 text-primary text-[8px] font-bold flex items-center justify-center ring-1 ring-border">
                {kpi.owner.initials}
              </span>
              <span>{kpi.owner.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground/70">Unassigned</span>
          )}
        </div>
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {kpi.quarter} {kpi.year}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// LIST VIEW
// ============================================================================

function ListView({
  kpis,
  canWrite,
  onEdit,
  onDelete,
}: {
  kpis: Kpi[];
  canWrite: boolean;
  onEdit: (kpi: Kpi) => void;
  onDelete: (kpi: Kpi) => void;
}) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-semibold">KPI</th>
            <th className="px-4 py-3 font-semibold hidden md:table-cell">Department</th>
            <th className="px-4 py-3 font-semibold">Progress</th>
            <th className="px-4 py-3 font-semibold hidden sm:table-cell">Owner</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            {canWrite && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {kpis.map((kpi) => (
            <tr key={kpi.id} className="border-b border-border last:border-0 hover:bg-muted/40">
              <td className="px-4 py-3">
                <div className="font-semibold text-xs">{kpi.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {formatValue(kpi.currentValue, kpi.unit)} / {formatValue(kpi.targetValue, kpi.unit)}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                {kpi.department ? kpi.department.charAt(0) + kpi.department.slice(1).toLowerCase() : "Company-wide"}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${PROGRESS_BG[kpi.status]}`}
                      style={{ width: `${Math.min(100, kpi.progress)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{kpi.progress}%</span>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                {kpi.owner?.name ?? "—"}
              </td>
              <td className="px-4 py-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[kpi.status]}`}>
                  {STATUS_LABELS[kpi.status]}
                </span>
              </td>
              {canWrite && (
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      className="p-1 text-muted-foreground hover:text-foreground rounded"
                      onClick={() => onEdit(kpi)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="p-1 text-muted-foreground hover:text-destructive rounded"
                      onClick={() => onDelete(kpi)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// CHART VIEW (department progress)
// ============================================================================

function ChartView({
  departments,
  onSelect,
}: {
  departments: { department: KpiDepartment | null; count: number; avgProgress: number; status: KpiStatus }[];
  onSelect: (dept: "ALL" | KpiDepartment) => void;
}) {
  const max = Math.max(...departments.map((d) => d.avgProgress), 1);

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold mb-5">Average progress by department</h3>
      {departments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data for the selected period.</p>
      ) : (
        <div className="space-y-4">
          {departments.map((d) => (
            <button
              key={d.department ?? "ALL"}
              className="w-full text-left group"
              onClick={() => onSelect((d.department as KpiDepartment) ?? "ALL")}
            >
              <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                <span className="text-muted-foreground group-hover:text-foreground">
                  {d.department ? d.department.charAt(0) + d.department.slice(1).toLowerCase() : "Company-wide"}
                  <span className="ml-2 text-muted-foreground/70">({d.count})</span>
                </span>
                <span className="font-semibold">{d.avgProgress}%</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${PROGRESS_BG[d.status]} transition-all`}
                  style={{ width: `${(d.avgProgress / max) * 100}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
