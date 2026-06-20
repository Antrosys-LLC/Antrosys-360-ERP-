"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Download,
  Upload,
  Bell,
  Settings,
  HelpCircle,
  Plus,
  SlidersHorizontal,
  AlertTriangle,
  Trophy,
  CheckSquare,
  Square,
  Clock,
  ArrowUpRight,
  FileText,
  Briefcase,
  Users,
  Activity
} from "lucide-react";

/* ==========================================================================
   MOCK DATA (Structured for easy replacement with API fetches)
   ========================================================================== */
const MOCK_SUMMARY_METRICS = {
  totalArr: "PKR 504M",
  mrr: "PKR 42M",
  activeClients: 34,
  atRisk: 2,
  renewalPipeline: 8,
  prospectPipeline: 12,
  summaryAsOf: "34 active clients - PKR 504M ARR - May 2026"
};

const MOCK_CLIENTS = [
  {
    id: "CLT-001",
    name: "Nexus Corp",
    sector: "Technology & SaaS",
    arr: "PKR 42M",
    mrr: "PKR 3.5M",
    ltv: "PKR 147M",
    health: 92,
    renewalDate: "Jun 30",
    daysRemaining: "35 days",
    status: "Active",
    tier: "Enterprise",
    initials: "NC",
    color: "bg-primary text-primary-foreground",
    metrics: [
      { name: "Product Usage", value: 95 },
      { name: "Support Tickets", value: 88 },
      { name: "Payment History", value: 98 },
      { name: "Engagement", value: 90 },
      { name: "NPS", value: 92 }
    ]
  },
  {
    id: "CLT-002",
    name: "Apex Holdings",
    sector: "Finance",
    arr: "PKR 28M",
    mrr: "PKR 2.3M",
    ltv: "PKR 98M",
    health: 88,
    renewalDate: "Aug 15",
    daysRemaining: "81 days",
    status: "Active",
    tier: "Enterprise",
    initials: "AC",
    color: "bg-blue-500 text-white",
    metrics: [
      { name: "Product Usage", value: 84 },
      { name: "Support Tickets", value: 92 },
      { name: "Payment History", value: 100 },
      { name: "Engagement", value: 78 },
      { name: "NPS", value: 85 }
    ]
  },
  {
    id: "CLT-003",
    name: "Vanta AI",
    sector: "Software",
    arr: "PKR 15M",
    mrr: "PKR 1.2M",
    ltv: "PKR 45M",
    health: 45,
    renewalDate: "May 30",
    daysRemaining: "Urgent",
    status: "At Risk",
    tier: "Mid-Market",
    initials: "VA",
    color: "bg-rose-500 text-white",
    hasWarning: true,
    metrics: [
      { name: "Product Usage", value: 40 },
      { name: "Support Tickets", value: 35 },
      { name: "Payment History", value: 70 },
      { name: "Engagement", value: 42 },
      { name: "NPS", value: 38 }
    ]
  },
  {
    id: "CLT-004",
    name: "BrightX Corp",
    sector: "Media",
    arr: "PKR 21M",
    mrr: "PKR 1.7M",
    ltv: "PKR 63M",
    health: 38,
    renewalDate: "Jun 12",
    daysRemaining: "Critical",
    status: "At Risk",
    tier: "Enterprise",
    initials: "BC",
    color: "bg-orange-500 text-white",
    hasWarning: true,
    metrics: [
      { name: "Product Usage", value: 32 },
      { name: "Support Tickets", value: 28 },
      { name: "Payment History", value: 65 },
      { name: "Engagement", value: 35 },
      { name: "NPS", value: 30 }
    ]
  }
];

const MOCK_PIPELINE = [
  {
    stage: "INITIAL CONTACT",
    deals: [
      { name: "OrbitTech", size: "PKR 12M" },
      { name: "Zenith Corp", size: "PKR 8M" }
    ]
  },
  {
    stage: "PROPOSAL",
    deals: [
      { name: "CloudSync", size: "PKR 45M" }
    ]
  },
  {
    stage: "NEGOTIATION",
    deals: [
      { name: "ByteForge", size: "PKR 38M" }
    ]
  },
  {
    stage: "CONTRACT REVIEW",
    deals: [
      { name: "GlobalNet", size: "PKR 18M" }
    ]
  },
  {
    stage: "CLOSED/WON",
    deals: [],
    emptyStateText: "No wins yet this week"
  }
];

const MOCK_TIMELINE = [
  { id: 1, text: "Email sent to Sarah at Nexus Corp regarding Q3 planning.", time: "2 hours ago" },
  { id: 2, text: "Usage alert triggered for Vanta AI (dropped below 50%).", time: "5 hours ago" },
  { id: 3, text: "Payment received from Apex Holdings.", time: "Yesterday" },
  { id: 4, text: "Risk status updated for BrightX Corp.", time: "Yesterday" },
  { id: 5, text: "Proposal viewed by CloudSync team.", time: "2 days ago" }
];

const INITIAL_TASKS = [
  { id: "t1", text: "Urgent check-in call with BrightX Corp", date: "Today, 2:00 PM", urgent: true, done: false },
  { id: "t2", text: "Send Q3 invoice to Nexus", date: "Tomorrow", urgent: false, done: false },
  { id: "t3", text: "Review support tickets for Vanta", date: "Tomorrow", urgent: true, done: false },
  { id: "t4", text: "Follow up on ByteForge negotiation", date: "Wed, May 22", urgent: false, done: false },
  { id: "t5", text: "Initial sync with Orbital", date: "Thu, May 23", urgent: false, done: false }
];

export default function ClientManagementDashboard() {
  // State definitions for handling user interaction
  const [selectedClientId, setSelectedClientId] = useState<string>("CLT-001");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  // Retrieve active selected client metadata profile dynamically
  const activeClient = useMemo(() => {
    return MOCK_CLIENTS.find(c => c.id === selectedClientId) || MOCK_CLIENTS[0];
  }, [selectedClientId]);

  // Compute filtering matches against client dataset matrix
  const filteredClients = useMemo(() => {
    return MOCK_CLIENTS.filter(client => 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.sector.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Handle local simulation of ticking a task assignment complete
  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 p-4 lg:p-8 space-y-6">
      
      {/* HEADER SECTION PANEL */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card border border-border rounded-xl p-4 shadow-xs">
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Client management</span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">Client management</h1>
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
          
          <button 
            onClick={() => alert("Simulating batch client CSV context importation.")}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium bg-card hover:bg-muted transition"
          >
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span>Import</span>
          </button>
          
          <button 
            onClick={() => alert("Simulating standard secure matrix export operation.")}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium bg-card hover:bg-muted transition"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            <span>Export</span>
          </button>
          
          <div className="flex items-center border border-border rounded-lg p-1 bg-background gap-1">
            <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Bell className="h-4 w-4" /></button>
            <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Settings className="h-4 w-4" /></button>
            <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><HelpCircle className="h-4 w-4" /></button>
          </div>

          <button 
            onClick={() => alert("Initializing ERP account onboarding registration wizard.")}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add client</span>
          </button>
        </div>
      </header>

      {/* EXECUTIVE PERFORMANCE METRICS GRID */}
      <section className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 divide-y md:divide-y-0 lg:divide-x divide-border">
          <div className="pt-2 md:pt-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Total ARR</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-500 mt-1">{MOCK_SUMMARY_METRICS.totalArr}</div>
          </div>
          <div className="pt-2 md:pt-0 lg:pl-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase">MRR</span>
            <div className="text-xl font-bold text-foreground mt-1">{MOCK_SUMMARY_METRICS.mrr}</div>
          </div>
          <div className="pt-2 md:pt-0 lg:pl-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Active Clients</span>
            <div className="text-xl font-bold text-foreground mt-1">{MOCK_SUMMARY_METRICS.activeClients}</div>
          </div>
          <div className="pt-2 md:pt-0 lg:pl-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase">At-risk</span>
            <div className="text-xl font-bold text-destructive mt-1">{MOCK_SUMMARY_METRICS.atRisk}</div>
          </div>
          <div className="pt-2 md:pt-0 lg:pl-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Renewal Pipeline</span>
            <div className="text-xl font-bold text-foreground mt-1">{MOCK_SUMMARY_METRICS.renewalPipeline}</div>
          </div>
          <div className="pt-2 md:pt-0 lg:pl-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Prospect Pipeline</span>
            <div className="text-xl font-bold text-foreground mt-1">{MOCK_SUMMARY_METRICS.prospectPipeline}</div>
          </div>
        </div>

        {/* Visual Lifecycle Distribution Track Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
            <span>Client lifecycle distribution</span>
            <span className="text-[11px] font-semibold text-foreground/80">{MOCK_SUMMARY_METRICS.summaryAsOf}</span>
          </div>
          <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden flex">
            <div className="bg-primary h-full" style={{ width: "70%" }} title="Stable Enterprise Portfolio" />
            <div className="bg-amber-400 h-full" style={{ width: "20%" }} title="Expansions Pending Review" />
            <div className="bg-destructive h-full" style={{ width: "10%" }} title="At-Risk Mitigation Quota" />
          </div>
        </div>
      </section>

      {/* CORE WORKSPACE: CLIENTS GRID LIST & ACCOUNT HEALTH INSPECTOR INSIGHTS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CLIENT ACCOUNT TABULATION MATRIX */}
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden lg:col-span-6 flex flex-col h-[520px]">
          <div className="p-4 border-b border-border flex items-center justify-between bg-card">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <span>All clients</span>
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-md font-semibold border border-border">
                {MOCK_CLIENTS.length} accounts
              </span>
            </h3>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Search className="h-4 w-4" /></button>
              <button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><SlidersHorizontal className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/30 font-bold">
                  <th className="p-3 w-10 text-center">
                    <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </th>
                  <th className="p-3">Client</th>
                  <th className="p-3 text-right">ARR</th>
                  <th className="p-3 text-center">Health</th>
                  <th className="p-3 text-right">Renewal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredClients.map((client) => {
                  const isSelected = selectedClientId === client.id;
                  return (
                    <tr 
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className={`cursor-pointer transition group ${isSelected ? "bg-secondary/60 font-medium" : "hover:bg-muted/40"}`}
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedClientId(client.id)} className="text-muted-foreground">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary fill-primary/10" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground/60 group-hover:text-muted-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${client.color} shrink-0`}>
                            {client.initials}
                          </div>
                          <div className="truncate max-w-[140px]">
                            <span className="font-bold text-foreground text-sm block truncate flex items-center gap-1">
                              {client.name}
                              {client.hasWarning && <AlertTriangle className="h-3.5 w-3.5 text-destructive inline shrink-0" />}
                            </span>
                            <span className="text-xs text-muted-foreground truncate block font-normal">{client.sector} • {client.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-500 font-mono text-xs">
                        {client.arr}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${
                          client.health >= 80 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" : "bg-rose-500/10 text-rose-600 dark:text-rose-500"
                        }`}>
                          {client.health}%
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-medium text-foreground block text-xs">{client.renewalDate}</span>
                        <span className={`text-[10px] block font-semibold ${
                          client.daysRemaining === "Urgent" || client.daysRemaining === "Critical" ? "text-destructive animate-pulse" : "text-muted-foreground"
                        }`}>
                          {client.daysRemaining}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ACCOUNT COMPREHENSIVE DRILLDOWN ANALYSIS PANEL */}
        <div className="bg-card border border-border rounded-xl shadow-xs p-5 lg:col-span-6 h-[520px] flex flex-col">
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold ${activeClient.color} shadow-xs shrink-0`}>
                {activeClient.initials}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">{activeClient.name}</h2>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 font-medium">
                  <span>{activeClient.sector}</span>
                  <span>•</span>
                  <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-foreground">{activeClient.status}</span>
                  <span className="bg-secondary px-2 py-0.5 rounded text-[10px] font-bold text-secondary-foreground">{activeClient.tier}</span>
                  <span className="font-mono text-[10px]">{activeClient.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Financial Indicators Row */}
          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="bg-muted/40 border border-border p-3 rounded-lg text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">ARR</span>
              <span className="text-sm font-bold text-foreground block mt-1 font-mono">{activeClient.arr}</span>
            </div>
            <div className="bg-muted/40 border border-border p-3 rounded-lg text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">MRR</span>
              <span className="text-sm font-bold text-foreground block mt-1 font-mono">{activeClient.mrr}</span>
            </div>
            <div className="bg-muted/40 border border-border p-3 rounded-lg text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">LTV</span>
              <span className="text-sm font-bold text-foreground block mt-1 font-mono">{activeClient.ltv}</span>
            </div>
          </div>

          {/* Module-Internal Context Filter Navigation Tab strip */}
          <div className="flex border-b border-border mb-4 gap-4 text-xs font-medium">
            {["Overview", "Projects", "Invoices", "Contacts", "Activity"].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`pb-2 transition border-b-2 font-bold ${
                  activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Display Router Area Container */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {activeTab === "Overview" ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Account Health Score</span>
                  <span className={`text-sm font-bold ${activeClient.health >= 80 ? "text-emerald-600" : "text-rose-600"}`}>
                    {activeClient.health}/100
                  </span>
                </div>
                
                <div className="space-y-2.5">
                  {activeClient.metrics.map((metric, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-foreground/80">
                        <span>{metric.name}</span>
                        <span className="font-mono text-muted-foreground">{metric.value}%</span>
                      </div>
                      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            metric.value >= 80 ? "bg-emerald-600" : metric.value >= 50 ? "bg-amber-500" : "bg-destructive"
                          }`} 
                          style={{ width: `${metric.value}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border rounded-xl bg-muted/10">
                <Activity className="h-5 w-5 text-muted-foreground/50 mb-1.5" />
                <span className="text-xs font-semibold text-foreground/80">Context Subsystem Work-In-Progress</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Fleshing out comprehensive metrics ledger for segment: {activeTab}</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border mt-auto flex justify-end">
            <button 
              onClick={() => alert(`Generating new contract draft context ledger for ${activeClient.name}`)}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-95 transition shadow-xs"
            >
              Create invoice
            </button>
          </div>
        </div>
      </section>

      {/* CRITICAL ATTENTION BROADCAST STRIP ALERT */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3.5 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-400">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="font-bold">Urgent Action Required:</strong> Vanta AI and BrightX Corp have renewals coming up with low health scores. Immediate outreach and account review management strategies are highly recommended.
        </div>
      </div>

      {/* KANBAN SYSTEM PIPELINE ANALYSIS */}
      <section className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Sales Pipeline</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {MOCK_PIPELINE.map((column, idx) => (
            <div key={idx} className="bg-muted/30 border border-border/80 rounded-xl p-3 flex flex-col gap-2 min-h-[160px]">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block border-b border-border pb-1.5">
                {column.stage}
              </span>
              
              <div className="flex-1 space-y-2 overflow-y-auto pt-1">
                {column.deals.length > 0 ? (
                  column.deals.map((deal, dealIdx) => (
                    <div 
                      key={dealIdx} 
                      className="p-2.5 bg-card border border-border rounded-lg shadow-2xs hover:border-primary/40 cursor-pointer transition flex flex-col gap-1"
                      onClick={() => alert(`Opening pipeline file layout card tracking: ${deal.name}`)}
                    >
                      <h4 className="font-bold text-xs text-foreground truncate">{deal.name}</h4>
                      <div className="flex items-center justify-between mt-1 text-[11px]">
                        <span className="font-mono text-emerald-600 font-semibold">{deal.size}</span>
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground/60" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-3 text-muted-foreground">
                    <Trophy className="h-5 w-5 text-muted-foreground/40 mb-1.5" />
                    <span className="text-[11px] font-medium leading-tight">{column.emptyStateText}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM SEGMENT PANEL: INTERACTION TIMELINE & TASK MANAGEMENT CONTROLS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LOGGED AUDIT LOG INTERACTION TIMELINE */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs lg:col-span-6 space-y-4 h-[340px] flex flex-col">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Interaction Timeline</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {MOCK_TIMELINE.map((item) => (
              <div key={item.id} className="text-xs flex items-start gap-3 border-b border-border/40 pb-2 last:border-0">
                <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                <div className="space-y-0.5">
                  <p className="text-foreground/90 font-medium leading-normal">{item.text}</p>
                  <span className="text-[10px] text-muted-foreground block">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WORKSTREAM ACTIONABLE ITEM OVERVIEW UPDATES */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs lg:col-span-6 space-y-4 h-[340px] flex flex-col">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <span>Upcoming Tasks</span>
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                onClick={() => toggleTask(task.id)}
                className={`flex items-start gap-3 p-2 rounded-lg border transition cursor-pointer select-none ${
                  task.done ? "bg-muted/40 border-border/60 opacity-60" : "bg-card border-border hover:border-muted-foreground/30"
                }`}
              >
                <button className="mt-0.5 shrink-0 transition" onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}>
                  {task.done ? (
                    <CheckSquare className="h-4 w-4 text-primary fill-primary/10" />
                  ) : (
                    <Square className={`h-4 w-4 ${task.urgent ? "text-destructive" : "text-muted-foreground/60"}`} />
                  )}
                </button>
                
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className={`text-xs font-semibold leading-normal truncate text-foreground ${task.done ? "line-through text-muted-foreground" : ""}`}>
                    {task.text}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                    <span>{task.date}</span>
                    {task.urgent && !task.done && (
                      <span className="text-[9px] bg-rose-500/10 text-rose-600 font-bold uppercase px-1 rounded">Urgent</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}