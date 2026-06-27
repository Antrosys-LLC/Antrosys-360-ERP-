"use client";

import React, { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  MoreVertical,
  Grid,
  List,
  Activity,
  AlertTriangle,
  Plus
} from "lucide-react";
import apiClient from "@/lib/api-client";

type KpiCardData = {
  id: string;
  title: string;
  status: "on-track" | "exceeded" | "off-track" | "at-risk";
  value: string;
  target: string;
  progress: number;
  trendType: "bar" | "line";
  trendData: number[];
  avatarUrl: string;
  period: string;
  badgeText?: string;
};

type KpiSummary = {
  total: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  exceeded: number;
};

export default function KPITrackerPage() {
  const [activeQuarter, setActiveQuarter] = useState("Q2");
  const [selectedDept, setSelectedDept] = useState("All Depts");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "chart">("grid");
  const [kpiCards, setKpiCards] = useState<KpiCardData[]>([]);
  const [summary, setSummary] = useState<KpiSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchKpis() {
      try {
        const params: Record<string, string> = {};
        if (activeQuarter) params.quarter = activeQuarter;
        if (selectedDept && selectedDept !== 'All Depts') params.department = selectedDept;
        if (selectedStatus !== 'All Status') params.status = selectedStatus;

        const [kpisRes, summaryRes] = await Promise.all([
          apiClient.get('/kpi', { params }),
          apiClient.get('/kpi/summary'),
        ]);
        setKpiCards(kpisRes.data.data);
        setSummary(summaryRes.data.data);
      } catch (err) {
        console.error('Failed to fetch KPIs', err);
      } finally {
        setLoading(false);
      }
    }
    fetchKpis();
  }, [activeQuarter, selectedDept, selectedStatus]);

  const filteredCards = kpiCards;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-16 bg-muted rounded-lg" />
        <div className="h-24 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
            <span>Performance</span> &gt; <span className="text-foreground/70">KPI tracker</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <h2 className="text-xl font-bold tracking-tight">KPI tracker</h2>
            <span className="bg-muted text-muted-foreground text-[11px] font-medium px-2 py-0.5 rounded border border-border">
              Company-wide - {activeQuarter} 2026
            </span>
            {summary && (
              <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Overall: {Math.round((summary.onTrack + summary.exceeded) / Math.max(summary.total, 1) * 100)}% on track
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-muted p-0.5 rounded-[var(--radius)] flex border border-border">
            {["Q1", "Q2", "Q3", "Q4"].map((q) => (
              <button
                key={q}
                onClick={() => setActiveQuarter(q)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-[var(--radius)] transition-all ${
                  activeQuarter === q
                    ? "bg-card text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          <button className="bg-card border border-border text-foreground hover:bg-muted text-[11px] font-medium px-2.5 py-1.5 rounded-[var(--radius)] flex items-center gap-1.5 shadow-xs">
            <SlidersHorizontal className="h-3 w-3" />
            <span>Dept</span>
          </button>

          <button
            onClick={async () => {
                const title = prompt('Enter KPI title:');
                if (title) {
                  try {
                    await apiClient.post('/kpi', {
                      title,
                      value: '0',
                      target: '100',
                      progress: 0,
                      trendType: 'bar',
                      trendData: [0],
                      period: activeQuarter,
                      quarter: activeQuarter,
                      department: selectedDept !== 'All Depts' ? selectedDept : undefined,
                    });
                    const res = await apiClient.get('/kpi', { params: { quarter: activeQuarter, department: selectedDept, status: selectedStatus } });
                    setKpiCards(res.data.data);
                  } catch (err) {
                    console.error('Failed to create KPI', err);
                  }
                }
              }}
              className="bg-primary text-primary-foreground hover:opacity-90 text-[11px] font-medium py-1.5 px-3 rounded-[var(--radius)] shadow-xs transition-colors flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Create KPI
            </button>
        </div>
      </header>

      <section className="bg-card text-card-foreground rounded-lg border border-border p-4 my-5 shadow-xs">
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
                  strokeDasharray={`${summary ? Math.round((summary.onTrack + summary.exceeded) / Math.max(summary.total, 1) * 100) : 78}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[13px] font-bold">{summary?.total ?? 24}</span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total KPIs</p>
              <p className="text-xs font-medium text-muted-foreground/80">Active metrics</p>
            </div>
          </div>

          <div className="px-2 md:border-r border-border last:border-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-medium text-muted-foreground">On track</span>
            </div>
            <p className="text-xl font-bold mt-0.5">{summary?.onTrack ?? 14}</p>
          </div>

          <div className="px-2 md:border-r border-border last:border-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-[11px] font-medium text-muted-foreground">At risk</span>
            </div>
            <p className="text-xl font-bold mt-0.5">{summary?.atRisk ?? 6}</p>
          </div>

          <div className="px-2 md:border-r border-border last:border-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-destructive"></span>
              <span className="text-[11px] font-medium text-muted-foreground">Off track</span>
            </div>
            <p className="text-xl font-bold mt-0.5">{summary?.offTrack ?? 3}</p>
          </div>

          <div className="px-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="text-[11px] font-medium text-muted-foreground">Exceeded</span>
            </div>
            <p className="text-xl font-bold mt-0.5">{summary?.exceeded ?? 1}</p>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between my-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-card border border-border rounded-[var(--radius)] p-0.5 flex">
            {["All Depts", "Engineering", "Sales"].map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-[var(--radius)] transition-all ${
                  selectedDept === dept ? "bg-muted text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-[var(--radius)] p-0.5 flex">
            {["All Status", "Off Track"].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-[var(--radius)] transition-all ${
                  selectedStatus === st ? "bg-muted text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-[var(--radius)] p-0.5 flex items-center">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1 rounded-[var(--radius)] ${viewMode === "grid" ? "bg-muted text-primary" : "text-muted-foreground"}`}
          >
            <Grid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1 rounded-[var(--radius)] ${viewMode === "list" ? "bg-muted text-primary" : "text-muted-foreground"}`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`p-1 rounded-[var(--radius)] ${viewMode === "chart" ? "bg-muted text-primary" : "text-muted-foreground"}`}
          >
            <Activity className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCards.map((card) => {
          let statusColor = "bg-emerald-500";
          let borderColor = "border-border";
          let progressBg = "bg-emerald-700";

          if (card.status === "at-risk") {
            statusColor = "bg-amber-500";
            progressBg = "bg-amber-600";
          } else if (card.status === "off-track") {
            statusColor = "bg-destructive";
            borderColor = "border-destructive/40 ring-1 ring-destructive/20";
            progressBg = "bg-destructive";
          } else if (card.status === "exceeded") {
            statusColor = "bg-primary";
            borderColor = "border-primary/30";
            progressBg = "bg-primary";
          }

          return (
            <div
              key={card.id}
              className={`bg-card text-card-foreground rounded-lg border ${borderColor} shadow-xs flex flex-col justify-between overflow-hidden transition-all hover:shadow-md relative`}
            >
              {card.badgeText && (
                <div className="bg-destructive/10 text-destructive text-[10px] font-bold px-3 py-1 flex items-center gap-1 border-b border-destructive/20">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>{card.badgeText}</span>
                </div>
              )}

              {card.status === "exceeded" && (
                <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-[8px] font-bold px-2 py-0.5 rounded-bl uppercase tracking-wider">
                  Exceeded
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
                    <h3 className="text-xs font-bold tracking-tight">{card.title}</h3>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground rounded-md p-0.5">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-lg font-extrabold tracking-tight">{card.value}</span>
                  <span className="text-[11px] text-muted-foreground font-medium">/ {card.target}</span>
                </div>

                <div className="w-full bg-muted h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${progressBg}`}
                    style={{ width: `${card.progress}%` }}
                  />
                </div>

                <div className="mt-4 h-8 flex items-end gap-1 w-full justify-between px-1">
                  {card.trendType === "bar" ? (
                    card.trendData.map((val, idx) => (
                      <div
                        key={idx}
                        className={`w-full rounded-xs transition-all opacity-60 ${
                          card.status === "off-track" ? "bg-destructive" : card.status === "at-risk" ? "bg-amber-500" : "bg-primary"
                        }`}
                        style={{ height: `${(val / 100) * 100}%` }}
                      />
                    ))
                  ) : (
                    <div className="w-full h-full relative pt-2">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                        <path
                          d="M 0 15 Q 20 12, 40 14 T 80 8 T 100 2"
                          fill="none"
                          stroke="currentColor"
                          className={`stroke-2 ${card.status === "at-risk" ? "text-amber-500" : "text-emerald-600"}`}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/50 border-t border-border px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <div className="flex items-center gap-1.5">
                  <img
                    src={card.avatarUrl}
                    alt="Assignee"
                    className="h-4 w-4 rounded-full object-cover ring-1 ring-border"
                  />
                </div>
                <span>{card.period}</span>
              </div>
            </div>
          );
        })}
      </main>
    </>
  );
}
