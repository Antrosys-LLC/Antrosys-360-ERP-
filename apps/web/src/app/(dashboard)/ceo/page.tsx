"use client";

import React, { useState } from "react";
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Zap, 
  ArrowUpRight, 
  Download, 
  Calendar, 
  ChevronRight, 
  Clock, 
  ShieldAlert, 
  Layers, 
  Activity,
  FileText
} from "lucide-react";

// ============================================================================
// REALISTIC ERP MOCK DATA (Easily swappable with API endpoints later)
// ============================================================================

const mockData = {
  header: {
    greeting: "Good morning, Dawood",
    role: "CEO · Full system access",
    date: "May 18, 2026",
    topBadges: [
      { label: "MRR $842K", type: "success", color: "bg-[#E1F2E0] text-green-800 border-green-200" },
      { label: "Headcount 247", type: "info", color: "bg-[#E8F0FE] text-blue-800 border-blue-200" },
      { label: "Active clients 34", type: "warning", color: "bg-[#FFF2DE] text-amber-800 border-amber-200" }
    ]
  },
  metrics: {
    revenue: {
      title: "Total revenue - May 2026",
      value: "$842,000",
      subtext: "+12.4% month-on-month",
      context: "vs Apr 2026",
      progressValue: 84,
      progressLabel: "84% of $1M monthly target"
    },
    headcount: {
      title: "Total headcount",
      value: "247",
      subtext: "+11 this quarter",
      context: "82%",
      progressLabel: "300 planned FY2026",
      departments: [
        { name: "Eng", count: 82 },
        { name: "Ops", count: 57 },
        { name: "Others", count: 108, label: "+5 more" }
      ]
    },
    clients: {
      title: "Active clients",
      value: "34",
      subtext: "+3 this month",
      context: "Pipeline: 12 prospects",
      alerts: [
        { label: "2 at risk", style: "bg-[#FCE8E6] text-red-800 font-medium" },
        { label: "8 renewal due", style: "bg-[#FFF2DE] text-amber-800 font-medium" }
      ]
    },
    burnRate: {
      title: "Monthly burn rate",
      value: "$318K",
      subtext: "+3.1% vs Apr",
      context: "Runway: 14 months",
      progressValue: 38,
      progressLabel: "38% of monthly revenue"
    }
  },
  revenueTrend: {
    title: "Revenue trend - last 12 months",
    tags: [
      { text: "Peak month: May $842K" },
      { text: "YTD: $8.6M" },
      { text: "Avg monthly: $716K" },
      { text: "vs last year: +34%", highlight: true }
    ],
    months: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"]
  },
  costBreakdown: {
    title: "Cost breakdown - May 2026",
    totalLabel: "Total $318K",
    items: [
      { name: "Payroll", percentage: 38, value: "$120K", color: "bg-[#7058EC]" },
      { name: "Operations", percentage: 21, value: "$67K", color: "bg-gray-400" },
      { name: "Software", percentage: 14, value: "$44K", color: "bg-indigo-300" },
      { name: "Tax & legal", percentage: 12, value: "$38K", color: "bg-blue-900" },
      { name: "Benefits", percentage: 9, value: "$29K", color: "bg-purple-200" },
      { name: "Other", percentage: 6, value: "$19K", color: "bg-gray-200" }
    ],
    trends: [
      { label: "Payroll +3.1%", style: "bg-[#FFF2DE] text-amber-800" },
      { label: "Operations +0.8%", style: "bg-[#FFF2DE] text-amber-800" },
      { label: "Software -2%", style: "bg-[#E1F2E0] text-green-800" },
      { label: "Tax +1.2%", style: "bg-[#FFF2DE] text-amber-800" },
      { label: "Benefits 0%", style: "bg-gray-100 text-gray-600" }
    ]
  },
  quickActions: [
    { title: "View audit log", desc: "12 new entries since yesterday", badge: "12", badgeStyle: "bg-[#7058EC] text-white", icon: ShieldAlert, iconStyle: "bg-[#EEEBFF] text-[#7058EC]" },
    { title: "Override approval", desc: "1 escalated request pending", badge: "Urgent", badgeStyle: "bg-[#FCE8E6] text-red-700", icon: Layers, iconStyle: "bg-[#FCE8E6] text-red-600" },
    { title: "Open BI report", desc: "Last generated: today 05:00 AM", icon: TrendingUp, iconStyle: "bg-[#E8F0FE] text-blue-600" },
    { title: "Review client pipeline", desc: "2 clients at risk • 8 renewals due", icon: Briefcase, iconStyle: "bg-purple-50 text-purple-600" },
    { title: "Export board report", desc: "Board meeting: May 30, 2026", icon: Download, iconStyle: "bg-[#E1F2E0] text-green-700" }
  ],
  clientPipeline: {
    title: "Client pipeline",
    badge: "34 active",
    stages: [
      { name: "Prospect", count: 12, percentage: 35 },
      { name: "Proposal", count: 9, percentage: 26 },
      { name: "Negotiation", count: 5, percentage: 15 },
      { name: "Active", count: 34, percentage: 100, highlight: true },
      { name: "At risk", count: 2, percentage: 6, alert: true }
    ],
    footers: ["ARR $4.2M", "MRR $350K"],
    topClient: "Top client: Nexus Corp $42K/mo"
  },
  systemActivity: [
    { event: "Payroll run initiated — May 2026", meta: "Nadia Qureshi · Finance", time: "4m ago", marker: "bg-[#7058EC]" },
    { event: "New hire onboarded — Sara Javed", meta: "Aisha Malik · HR", time: "18m ago", marker: "bg-green-500" },
    { event: "Leave approved — Omar Mirza (3 days)", meta: "Zara Khan · Engineering", time: "32m ago", marker: "bg-amber-500" },
    { event: "Override request escalated to CEO", meta: "System · Compliance", time: "1h ago", marker: "bg-red-500", highlight: true },
    { event: "Client Nexus Corp — invoice sent $42K", meta: "Nadia Qureshi · Finance", time: "2h ago", marker: "bg-blue-400" },
    { event: "Audit log exported — board package", meta: "Dawood Akhtar (you) · CEO", time: "3h ago", marker: "bg-gray-400" }
  ],
  systemHealth: {
    title: "System health",
    badge: "Live",
    uptime: "99.7% uptime · last 30 days",
    lastChecked: "Last checked: 2 min ago",
    services: [
      { name: "API gateway", status: "Operational", style: "bg-[#E1F2E0] text-green-800" },
      { name: "Stripe billing", status: "Operational", style: "bg-[#E1F2E0] text-green-800" },
      { name: "Payroll engine", status: "Operational", style: "bg-[#E1F2E0] text-green-800" },
      { name: "Auth / SSO", status: "Operational", style: "bg-[#E1F2E0] text-green-800" },
      { name: "File storage", status: "Degraded", style: "bg-[#FFF2DE] text-amber-800" },
      { name: "Email service", status: "Operational", style: "bg-[#E1F2E0] text-green-800" },
      { name: "Audit logging", status: "Operational", style: "bg-[#E1F2E0] text-green-800" }
    ]
  }
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CEODashboard() {
  const [timeframe, setTimeframe] = useState("Monthly");

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 text-[#1A1A1A] font-sans">
      
      {/* TOP HEADER SECTION */}
      <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#1A1A1A]">
            {mockData.header.greeting}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[14px] text-gray-500">
            <span>{mockData.header.role}</span>
            <span className="text-gray-300">•</span>
            <span>{mockData.header.date}</span>
            <div className="ml-2 flex flex-wrap gap-1.5">
              {mockData.header.topBadges.map((badge, idx) => (
                <span key={idx} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${badge.color}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Global Filter Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 text-[14px]">
          <div className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-700 shadow-xs cursor-pointer hover:bg-gray-50">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>May 2026</span>
            <ChevronRight className="h-4 w-4 rotate-90 text-gray-400" />
          </div>
          <button className="rounded-md border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition-colors">
            Compare period
          </button>
          <button className="rounded-md border border-gray-200 bg-white p-2 text-gray-500 shadow-xs hover:bg-gray-50 transition-colors" aria-label="Export dataset">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* SECTION 1: TOP 4 METRICS CARDS */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Revenue Card */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[12px] text-gray-400 font-medium uppercase tracking-wider">
              <span>{mockData.metrics.revenue.title}</span>
              <span>{mockData.metrics.revenue.context}</span>
            </div>
            <div className="mt-2 text-[28px] font-semibold text-[#1A1A1A]">{mockData.metrics.revenue.value}</div>
            <div className="mt-1 flex items-center gap-1 text-[12px] font-medium text-green-600">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>{mockData.metrics.revenue.subtext}</span>
            </div>
          </div>
          <div className="mt-4">
            {/* Minimal Trend Representation Wave */}
            <div className="mb-2 h-5 w-full overflow-hidden opacity-80">
              <svg className="h-full w-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0,16 C20,15 40,18 60,11 C80,5 90,8 100,4" fill="none" stroke="#7058EC" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100">
              <div className="h-1.5 rounded-full bg-[#7058EC]" style={{ width: `${mockData.metrics.revenue.progressValue}%` }}></div>
            </div>
            <div className="mt-1.5 text-[12px] text-gray-400">{mockData.metrics.revenue.progressLabel}</div>
          </div>
        </div>

        {/* Total Headcount Card */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[12px] text-gray-400 font-medium uppercase tracking-wider">
              <span>{mockData.metrics.headcount.title}</span>
              <span className="font-semibold text-[#7058EC]">{mockData.metrics.headcount.context}</span>
            </div>
            <div className="mt-2 text-[28px] font-semibold text-[#1A1A1A]">{mockData.metrics.headcount.value}</div>
            <div className="mt-1 text-[12px] font-medium text-green-600">{mockData.metrics.headcount.subtext}</div>
          </div>
          <div className="mt-4">
            <div className="text-[12px] text-gray-400 mb-2">{mockData.metrics.headcount.progressLabel}</div>
            <div className="flex flex-wrap gap-1">
              {mockData.metrics.headcount.departments.map((dept, idx) => (
                <span key={idx} className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
                  {dept.label || `${dept.name} ${dept.count}`}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Active Clients Card */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[12px] text-gray-400 font-medium uppercase tracking-wider">
              {mockData.metrics.clients.title}
            </div>
            <div className="mt-2 text-[28px] font-semibold text-[#1A1A1A]">{mockData.metrics.clients.value}</div>
            <div className="mt-1 text-[12px] font-medium text-green-600">{mockData.metrics.clients.subtext}</div>
          </div>
          <div className="mt-4">
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {mockData.metrics.clients.alerts.map((alert, idx) => (
                <span key={idx} className={`rounded px-1.5 py-0.5 text-[11px] ${alert.style}`}>
                  {alert.label}
                </span>
              ))}
            </div>
            <div className="text-[12px] text-gray-400">{mockData.metrics.clients.context}</div>
          </div>
        </div>

        {/* Monthly Burn Rate Card */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[12px] text-gray-400 font-medium uppercase tracking-wider">
              {mockData.metrics.burnRate.title}
            </div>
            <div className="mt-2 text-[28px] font-semibold text-red-600">{mockData.metrics.burnRate.value}</div>
            <div className="mt-1 text-[12px] font-medium text-red-600">{mockData.metrics.burnRate.subtext}</div>
          </div>
          <div className="mt-4">
            <div className="text-[12px] text-gray-600 mb-2">{mockData.metrics.burnRate.context}</div>
            <div className="relative h-1.5 w-full rounded-full bg-gray-100">
              <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${mockData.metrics.burnRate.progressValue}%` }}></div>
              <span className="absolute -top-1 left-[38%] h-3.5 w-3.5 rounded-full border-2 border-white bg-red-600 shadow-xs"></span>
            </div>
            <div className="mt-1.5 text-[12px] text-gray-400">{mockData.metrics.burnRate.progressLabel}</div>
          </div>
        </div>

      </section>

      {/* SECTION 2: GRAPH VISUALIZATIONS ROW */}
      <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Revenue Trend Area Grid */}
        <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[16px] font-semibold text-[#1A1A1A]">{mockData.revenueTrend.title}</h3>
            <div className="inline-flex rounded-md bg-gray-100 p-0.5">
              {["Monthly", "Quarterly", "Annual"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTimeframe(tab)}
                  className={`rounded px-3 py-1 text-[12px] font-medium transition-all ${
                    timeframe === tab ? "bg-white text-[#1A1A1A] shadow-xs" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Canvas Simulation Box */}
          <div className="relative mt-6 flex-1 min-h-[170px] w-full bg-gradient-to-b from-[#FBFBFF] to-transparent rounded-lg border border-dashed border-gray-100 p-4">
            <span className="absolute top-2 right-2 rounded bg-[#7058EC] px-1.5 py-0.5 text-[11px] font-bold text-white shadow-xs">$842K</span>
            
            {/* Mock Chart Horizontal Metrics Guide lines */}
            <div className="absolute inset-x-0 bottom-12 border-b border-gray-100 flex justify-between px-2 text-[11px] text-gray-400">
              <span>$200K</span>
            </div>
            <div className="absolute inset-x-0 top-16 border-b border-gray-100 flex justify-between px-2 text-[11px] text-gray-400">
              <span>$500K</span>
            </div>
            <div className="absolute inset-x-0 top-4 border-b border-gray-100 flex justify-between px-2 text-[11px] text-gray-400">
              <span>$800K</span>
            </div>
            
            {/* Render Horizontal Axis Label Items */}
            <div className="absolute bottom-1 left-0 right-0 flex justify-between px-4 text-[11px] text-gray-400">
              {mockData.revenueTrend.months.map((month, i) => (
                <span key={i}>{month}</span>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-4 text-[12px]">
            <span className="inline-flex items-center gap-1.5 text-gray-600 font-medium">
              <span className="h-1.5 w-4 rounded-full bg-[#7058EC]"></span> Revenue
            </span>
            <span className="inline-flex items-center gap-1.5 text-gray-400 font-medium">
              <span className="h-1.5 w-4 rounded-full bg-gray-300 border-dashed"></span> Payroll cost
            </span>
          </div>

          {/* Quick Metrics Aggregates Tag Row */}
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-gray-100 pt-4">
            {mockData.revenueTrend.tags.map((tag, i) => (
              <span key={i} className={`rounded bg-gray-50 px-2 py-1 text-[12px] font-medium text-gray-600 ${
                tag.highlight ? 'bg-[#EEEBFF] text-[#5A45CD]' : ''
              }`}>
                {tag.text}
              </span>
            ))}
          </div>
        </div>

        {/* Cost Distribution Breakdown */}
        <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-semibold text-[#1A1A1A]">{mockData.costBreakdown.title}</h3>
            <span className="rounded bg-[#EEEBFF] px-2 py-0.5 text-[11px] font-semibold text-[#5A45CD]">
              {mockData.costBreakdown.totalLabel}
            </span>
          </div>

          <div className="my-auto flex flex-col sm:flex-row items-center justify-center gap-5 py-4">
            {/* Visual Ring Donut Core Frame */}
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[12px] border-gray-100">
              <div className="absolute inset-0 rounded-full border-[12px] border-[#7058EC] clip-path-donut opacity-90"></div>
              <div className="text-center">
                <span className="text-[16px] font-bold text-[#1A1A1A]">$318K</span>
                <p className="text-[10px] text-gray-400 uppercase font-medium tracking-tight">Total cost</p>
              </div>
            </div>

            {/* Micro Percent Allocation Stack List */}
            <div className="w-full flex-1 space-y-1.5">
              {mockData.costBreakdown.items.map((cost) => (
                <div key={cost.name} className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${cost.color}`}></span>
                    <span className="text-gray-600 font-medium">{cost.name}</span>
                  </div>
                  <div className="flex gap-2 font-medium">
                    <span className="text-[#1A1A1A]">{cost.percentage}%</span>
                    <span className="text-gray-400 w-11 text-right">{cost.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variance Tags Comparison Line */}
          <div className="mt-auto border-t border-gray-100 pt-3">
            <span className="block text-[11px] text-gray-400 mb-1.5 font-medium">vs Apr 2026:</span>
            <div className="flex flex-wrap gap-1">
              {mockData.costBreakdown.trends.map((trend, idx) => (
                <span key={idx} className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${trend.style}`}>
                  {trend.label}
                </span>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* SECTION 3: BOTTOM CONTROL MODULE GRIDS */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Quick Executive Management Action Box */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Quick actions - CEO</h3>
          <div className="space-y-2 flex-1">
            {mockData.quickActions.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <div key={idx} className="group flex items-center justify-between p-2 rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${action.iconStyle}`}>
                      <ActionIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-medium text-[#1A1A1A]">{action.title}</p>
                      <p className="text-[11.5px] text-gray-400 leading-tight mt-0.5">{action.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {action.badge && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${action.badgeStyle}`}>
                        {action.badge}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Client Pipeline Module Section */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Client pipeline</h3>
            <span className="rounded bg-[#E1F2E0] px-2 py-0.5 text-[11px] font-medium text-green-800">
              {mockData.clientPipeline.badge}
            </span>
          </div>
          
          <div className="space-y-3 flex-1 justify-center flex flex-col">
            {mockData.clientPipeline.stages.map((stage, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[13px]">
                  <span className={stage.highlight ? "font-semibold text-[#1A1A1A]" : "text-gray-500 font-medium"}>
                    {stage.name}
                  </span>
                  <span className="font-semibold text-[#1A1A1A]">{stage.count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div 
                    className={`h-2 rounded-full ${stage.highlight ? 'bg-[#7058EC]' : stage.alert ? 'bg-red-200' : 'bg-indigo-100'}`} 
                    style={{ width: `${stage.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-1 text-[11px]">
            <div className="flex gap-1.5">
              {mockData.clientPipeline.footers.map((val, i) => (
                <span key={i} className="rounded bg-gray-50 border border-gray-100 px-1.5 py-0.5 font-semibold text-gray-600">
                  {val}
                </span>
              ))}
            </div>
            <span className="text-gray-400 font-medium mt-1">{mockData.clientPipeline.topClient}</span>
          </div>
        </div>

        {/* Real-time Audit/System Activity Event List */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-semibold text-[#1A1A1A]">System activity</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span> Live
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-[260px] scrollbar-thin">
            {mockData.systemActivity.map((activity, idx) => (
              <div key={idx} className="relative flex gap-2.5 pb-1">
                {/* Connector Timeline Dot Node */}
                <div className="relative flex flex-col items-center">
                  <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${activity.marker}`}></span>
                  {idx !== mockData.systemActivity.length - 1 && (
                    <span className="absolute top-4 bottom-[-16px] w-[1px] bg-gray-100"></span>
                  )}
                </div>
                <div className="flex-1 text-[13px]">
                  <div className="flex justify-between items-start gap-1">
                    <p className={`font-medium leading-tight text-[#1A1A1A] ${activity.highlight ? "text-red-700 font-semibold" : ""}`}>
                      {activity.event}
                    </p>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0 inline-flex items-center gap-0.5 font-medium">
                      <Clock className="h-3 w-3" /> {activity.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{activity.meta}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-3 text-center text-[12px] font-medium text-[#7058EC] hover:underline pt-2.5 border-t border-gray-100 flex items-center justify-center gap-1 w-full transition-all">
            <span>View full audit log</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Network/Platform API Service Health Status */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-semibold text-[#1A1A1A]">{mockData.systemHealth.title}</h3>
            <span className="rounded bg-[#E1F2E0] px-1.5 py-0.5 text-[11px] font-semibold text-green-800">
              {mockData.systemHealth.badge}
            </span>
          </div>
          
          <div className="space-y-2 flex-1">
            {mockData.systemHealth.services.map((service, idx) => (
              <div key={idx} className="flex items-center justify-between text-[13px] py-0.5">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${service.status === 'Operational' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  <span className="text-gray-600 font-medium">{service.name}</span>
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold tracking-wide ${service.style}`}>
                  {service.status}
                </span>
              </div>
            ))}
          </div>

          {/* Infrastructure Health Status Block Footer */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="rounded-md bg-[#E1F2E0] p-2 text-center">
              <span className="text-[12px] font-bold text-green-800">{mockData.systemHealth.uptime}</span>
              <p className="text-[10px] text-green-700/80 mt-0.5 font-medium">{mockData.systemHealth.lastChecked}</p>
            </div>
            <button className="mt-2 text-center text-[11.5px] font-semibold text-gray-500 hover:text-gray-800 mx-auto block hover:underline transition-colors">
              View system logs →
            </button>
          </div>
        </div>

      </section>
    </div>
  );
}