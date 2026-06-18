"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  TrendingUp,
  Plus,
  ChevronLeft,
  ChevronRight,
  Bell,
  SlidersHorizontal,
  MoreVertical,
  Grid,
  List,
  Activity,
  AlertTriangle
} from "lucide-react";

const kpiCardsData = [
  {
    id: "kpi-1",
    title: "Revenue Growth",
    status: "on-track",
    value: "$2.4M",
    target: "$2.5M",
    progress: 96,
    trendType: "bar",
    trendData: [40, 50, 60, 75, 85, 95],
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    period: "Jun 30",
  },
  {
    id: "kpi-2",
    title: "Client Retention",
    status: "exceeded",
    value: "98.5%",
    target: "95%",
    progress: 100,
    trendType: "bar",
    trendData: [70, 75, 72, 85, 90, 98],
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    period: "Jul 15",
  },
  {
    id: "kpi-3",
    title: "Eng Velocity",
    status: "off-track",
    value: "42 pts",
    target: "65 pts",
    progress: 64,
    badgeText: "14% below Q1 average",
    trendType: "bar",
    trendData: [80, 70, 55, 45, 40, 42],
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    period: "Weekly",
  },
  {
    id: "kpi-4",
    title: "Marketing ROI",
    status: "at-risk",
    value: "2.1x",
    target: "3.0x",
    progress: 70,
    trendType: "bar",
    trendData: [45, 50, 55, 60, 65, 70],
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    period: "Aug 01",
  },
  {
    id: "kpi-5",
    title: "System Uptime",
    status: "on-track",
    value: "99.9%",
    target: "99.9%",
    progress: 100,
    trendType: "line",
    trendData: [99.8, 99.9, 99.7, 99.9, 99.9, 99.9],
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    period: "Daily",
  },
  {
    id: "kpi-6",
    title: "Customer Sat",
    status: "on-track",
    value: "4.8",
    target: "4.5",
    progress: 100,
    trendType: "line",
    trendData: [4.2, 4.4, 4.5, 4.5, 4.7, 4.8],
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    period: "Monthly",
  },
  {
    id: "kpi-7",
    title: "Lead Gen",
    status: "at-risk",
    value: "840",
    target: "1200",
    progress: 70,
    trendType: "line",
    trendData: [900, 880, 850, 820, 830, 840],
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    period: "Weekly",
  },
  {
    id: "kpi-8",
    title: "Hiring Target",
    status: "on-track",
    value: "12",
    target: "15",
    progress: 80,
    trendType: "line",
    trendData: [2, 4, 6, 8, 10, 12],
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    period: "Monthly",
  },
];

export default function KPITrackerPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeQuarter, setActiveQuarter] = useState("Q2");
  const [selectedDept, setSelectedDept] = useState("All Depts");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "chart">("grid");

  const filteredCards = kpiCardsData.filter((card) => {
    if (selectedStatus === "Off Track" && card.status !== "off-track") return false;
    if (selectedDept === "Engineering" && card.title !== "Eng Velocity" && card.title !== "System Uptime") return false;
    if (selectedDept === "Sales" && card.title !== "Revenue Growth" && card.title !== "Lead Gen") return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SIDEBAR COMPONENT */}
      <aside className={`erp-sidebar ${sidebarCollapsed ? "collapsed" : ""} flex flex-col justify-between border-r border-border bg-card text-card-foreground`}>
        <div>
          {/* Brand/Logo Area */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-2">
                <div className="bg-foreground text-background p-1.5 rounded-[var(--radius)] flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 rotate-45" />
                </div>
                <div>
                  <h1 className="font-bold text-sm tracking-tight leading-none">Antrosys ERP</h1>
                  <span className="text-[11px] text-muted-foreground">Enterprise Hub</span>
                </div>
              </div>
            ) : (
              <div className="mx-auto bg-foreground text-background p-1.5 rounded-[var(--radius)] flex items-center justify-center">
                <TrendingUp className="h-5 w-5 rotate-45" />
              </div>
            )}
            
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-muted-foreground hover:text-foreground transition-colors hidden md:block"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* New Report Button */}
          <div className="p-3">
            <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:opacity-90 text-xs font-medium py-2.5 px-3 rounded-[var(--radius)] shadow-xs transition-all overflow-hidden whitespace-nowrap">
              <Plus className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>New Report</span>}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-2 px-2 space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded-[var(--radius)] transition-colors">
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded-[var(--radius)] transition-colors">
              <FileText className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>Invoices</span>}
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded-[var(--radius)] transition-colors">
              <Users className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>HR</span>}
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-secondary-foreground bg-secondary rounded-[var(--radius)] transition-colors">
              <TrendingUp className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>KPI Tracker</span>}
            </a>
          </nav>
        </div>
      </aside>

      {/* CONTENT INNER CONTAINER */}
      <div className={`erp-content ${sidebarCollapsed ? "sidebar-collapsed" : ""} pt-4 px-6 md:px-8`}>
        
        {/* TOP BAR / NAVIGATION BREADCRUMBS */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
              <span>Performance</span> &gt; <span className="text-foreground/70">KPI tracker</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <h2 className="text-xl font-bold tracking-tight">KPI tracker</h2>
              <span className="bg-muted text-muted-foreground text-[11px] font-medium px-2 py-0.5 rounded border border-border">
                Company-wide - Q2 2026
              </span>
              <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Overall: 78% on track
              </span>
            </div>
          </div>

          {/* Action Header Items */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Quarter Selector Toggle */}
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

            {/* Department Filter Toggle */}
            <button className="bg-card border border-border text-foreground hover:bg-muted text-[11px] font-medium px-2.5 py-1.5 rounded-[var(--radius)] flex items-center gap-1.5 shadow-xs">
              <SlidersHorizontal className="h-3 w-3" />
              <span>Dept</span>
            </button>

            {/* Notification and Profile */}
            <button className="relative p-1.5 text-muted-foreground hover:text-foreground bg-card border border-border rounded-full transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-destructive rounded-full"></span>
            </button>

            <img
              className="h-7 w-7 rounded-full object-cover border border-border"
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="User profile"
            />

            <button className="bg-primary text-primary-foreground hover:opacity-90 text-[11px] font-medium py-1.5 px-3 rounded-[var(--radius)] shadow-xs transition-colors">
              Create KPI
            </button>
          </div>
        </header>

        {/* OVERVIEW METRIC CARD BANNER */}
        <section className="bg-card text-card-foreground rounded-lg border border-border p-4 my-5 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-5 items-center gap-4">
            
            {/* Donut progress */}
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
                    strokeDasharray="78, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[13px] font-bold">24</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total KPIs</p>
                <p className="text-xs font-medium text-muted-foreground/80">Active metrics</p>
              </div>
            </div>

            {/* On Track Stat */}
            <div className="px-2 md:border-r border-border last:border-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] font-medium text-muted-foreground">On track</span>
              </div>
              <p className="text-xl font-bold mt-0.5">14</p>
            </div>

            {/* At Risk Stat */}
            <div className="px-2 md:border-r border-border last:border-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-[11px] font-medium text-muted-foreground">At risk</span>
              </div>
              <p className="text-xl font-bold mt-0.5">6</p>
            </div>

            {/* Off Track Stat */}
            <div className="px-2 md:border-r border-border last:border-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-destructive"></span>
                <span className="text-[11px] font-medium text-muted-foreground">Off track</span>
              </div>
              <p className="text-xl font-bold mt-0.5">3</p>
            </div>

            {/* Exceeded Stat */}
            <div className="px-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-[11px] font-medium text-muted-foreground">Exceeded</span>
              </div>
              <p className="text-xl font-bold mt-0.5">1</p>
            </div>

          </div>
        </section>

        {/* CONTROLS BAR: FILTERS AND VIEW SWITCHER */}
        <div className="flex items-center justify-between my-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {/* Department tabs */}
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

            {/* Status tabs */}
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

          {/* View Modes */}
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

        {/* KPI CARDS MAIN GRID */}
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
                
                {/* Specific Header Alert Box for Off Track Cards */}
                {card.badgeText && (
                  <div className="bg-destructive/10 text-destructive text-[10px] font-bold px-3 py-1 flex items-center gap-1 border-b border-destructive/20">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>{card.badgeText}</span>
                  </div>
                )}

                {/* Exceeded tag banner */}
                {card.status === "exceeded" && (
                  <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-[8px] font-bold px-2 py-0.5 rounded-bl uppercase tracking-wider">
                    Exceeded
                  </div>
                )}

                {/* Upper Body Segment */}
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

                  {/* Values Presentation */}
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-lg font-extrabold tracking-tight">{card.value}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">/ {card.target}</span>
                  </div>

                  {/* Progress bar logic */}
                  <div className="w-full bg-muted h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${progressBg}`}
                      style={{ width: `${card.progress}%` }}
                    />
                  </div>

                  {/* Micro Trend Graph Component */}
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

                {/* Footer section */}
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

      </div>
    </div>
  );
}