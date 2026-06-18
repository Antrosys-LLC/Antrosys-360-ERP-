
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
  DollarSign,
  UserCheck,
  Zap,
  Target,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Award
} from "lucide-react";

// Mock Data structure mirroring the exact cards in the image
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
    progress: 100, // full progress
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

  // Filter conditions matches dashboard selections
  const filteredCards = kpiCardsData.filter((card) => {
    if (selectedStatus === "Off Track" && card.status !== "off-track") return false;
    if (selectedDept === "Engineering" && card.title !== "Eng Velocity" && card.title !== "System Uptime") return false;
    if (selectedDept === "Sales" && card.title !== "Revenue Growth" && card.title !== "Lead Gen") return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1A1A1A]">
      {/* SIDEBAR COMPONENT */}
      <aside className={`fixed inset-y-0 left-0 z-40 overflow-y-auto transition-all duration-200 ${sidebarCollapsed ? "w-16" : "w-[220px]"} flex flex-col justify-between border-r border-[#E0E0E0] bg-white`}>
        <div>
          {/* Brand/Logo Area */}
          <div className="flex items-center justify-between p-4 border-b border-[#E0E0E0]">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-2">
                <div className="bg-[#1A1A1A] text-white p-1.5 rounded-md flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 rotate-45" />
                </div>
                <div>
                  <h1 className="font-bold text-sm tracking-tight leading-none text-[#1A1A1A]">Antrosys ERP</h1>
                  <span className="text-[11px] text-gray-400">Enterprise Hub</span>
                </div>
              </div>
            ) : (
              <div className="mx-auto bg-[#1A1A1A] text-white p-1.5 rounded-md flex items-center justify-center">
                <TrendingUp className="h-5 w-5 rotate-45" />
              </div>
            )}
            
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-400 hover:text-gray-600 transition-colors hidden md:block"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* New Report Button */}
          <div className="p-3">
            <button className="w-full flex items-center justify-center gap-2 bg-[#7B6AE6] hover:bg-[#6654df] text-white text-xs font-medium py-2.5 px-3 rounded-md shadow-sm transition-all overflow-hidden whitespace-nowrap">
              <Plus className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>New Report</span>}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-2 px-2 space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-md transition-colors">
              <LayoutDashboard className="h-4 w-4 text-gray-400 shrink-0" />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-md transition-colors">
              <FileText className="h-4 w-4 text-gray-400 shrink-0" />
              {!sidebarCollapsed && <span>Invoices</span>}
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-md transition-colors">
              <Users className="h-4 w-4 text-gray-400 shrink-0" />
              {!sidebarCollapsed && <span>HR</span>}
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-[#7B6AE6] bg-[#ECE9FD] rounded-md transition-colors">
              <TrendingUp className="h-4 w-4 text-[#7B6AE6] shrink-0" />
              {!sidebarCollapsed && <span>KPI Tracker</span>}
            </a>
          </nav>
        </div>
      </aside>

      {/* CONTENT INNER CONTAINER */}
      <div className={`transition-all duration-200 min-h-screen ml-0 pt-4 pr-6 md:pr-8`}>
        
        {/* TOP BAR / NAVIGATION BREADCRUMBS */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <div className="text-[11px] text-gray-400 flex items-center gap-1.5 font-medium">
              <span>Performance</span> &gt; <span className="text-gray-500">KPI tracker</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">KPI tracker</h2>
              <span className="bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded border border-gray-200">
                Company-wide - Q2 2026
              </span>
              <span className="bg-[#E6F7ED] text-[#2EA355] text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2EA355]"></span>
                Overall: 78% on track
              </span>
            </div>
          </div>

          {/* Action Header Items */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Quarter Selector Toggle */}
            <div className="bg-gray-100 p-0.5 rounded-md flex border border-gray-200">
              {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                <button
                  key={q}
                  onClick={() => setActiveQuarter(q)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded transition-all ${
                    activeQuarter === q
                      ? "bg-white text-[#7B6AE6] shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Department Filter Toggle */}
            <button className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-[11px] font-medium px-2.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-xs">
              <SlidersHorizontal className="h-3 w-3" />
              <span>Dept</span>
            </button>

            {/* Notification and Profile */}
            <button className="relative p-1.5 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-full transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>

            <img
              className="h-7 w-7 rounded-full object-cover border border-gray-200"
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="User profile"
            />

            <button className="bg-[#7B6AE6] hover:bg-[#6654df] text-white text-[11px] font-medium py-1.5 px-3 rounded-md shadow-xs transition-colors">
              Create KPI
            </button>
          </div>
        </header>

        {/* OVERVIEW METRIC CARD BANNER */}
        <section className="bg-white rounded-lg border border-[#E0E0E0] p-4 my-5 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-5 items-center gap-4">
            
            {/* Donut progress visual wrapper */}
            <div className="flex items-center gap-3 border-r border-gray-100 last:border-0 pr-2">
              <div className="relative flex items-center justify-center h-12 w-12 shrink-0">
                {/* SVG Circle progress */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#7B6AE6]"
                    strokeDasharray="78, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[13px] font-bold text-gray-800">24</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Total KPIs</p>
                <p className="text-xs font-medium text-gray-500">Active metrics</p>
              </div>
            </div>

            {/* On Track Stat */}
            <div className="px-2 md:border-r border-gray-100 last:border-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2EA355]"></span>
                <span className="text-[11px] font-medium text-gray-500">On track</span>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-0.5">14</p>
            </div>

            {/* At Risk Stat */}
            <div className="px-2 md:border-r border-gray-100 last:border-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E28743]"></span>
                <span className="text-[11px] font-medium text-gray-500">At risk</span>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-0.5">6</p>
            </div>

            {/* Off Track Stat */}
            <div className="px-2 md:border-r border-gray-100 last:border-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D9383A]"></span>
                <span className="text-[11px] font-medium text-gray-500">Off track</span>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-0.5">3</p>
            </div>

            {/* Exceeded Stat */}
            <div className="px-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#7B6AE6]"></span>
                <span className="text-[11px] font-medium text-gray-500">Exceeded</span>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-0.5">1</p>
            </div>

          </div>
        </section>

        {/* CONTROLS BAR: FILTERS AND VIEW SWITCHER */}
        <div className="flex items-center justify-between my-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {/* Department mini-tabs */}
            <div className="bg-white border border-gray-200 rounded-md p-0.5 flex">
              {["All Depts", "Engineering", "Sales"].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded transition-all ${
                    selectedDept === dept ? "bg-gray-100 text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Status mini-tabs */}
            <div className="bg-white border border-gray-200 rounded-md p-0.5 flex">
              {["All Status", "Off Track"].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded transition-all ${
                    selectedStatus === st ? "bg-gray-100 text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* View Modes Layout selection matching bottom-right of header section */}
          <div className="bg-white border border-gray-200 rounded-md p-0.5 flex items-center">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded ${viewMode === "grid" ? "bg-gray-100 text-[#7B6AE6]" : "text-gray-400"}`}
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-1 rounded ${viewMode === "list" ? "bg-gray-100 text-[#7B6AE6]" : "text-gray-400"}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => setViewMode("chart")}
              className={`p-1 rounded ${viewMode === "chart" ? "bg-gray-100 text-[#7B6AE6]" : "text-gray-400"}`}
            >
              <Activity className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* KPI CARDS MAIN GRID */}
        <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCards.map((card) => {
            
            // Contextual status setups mirroring precise dashboard visual states
            let statusColor = "bg-[#2EA355]";
            let borderColor = "border-[#E0E0E0]";
            let ringColor = "bg-[#1E5631]";

            if (card.status === "at-risk") {
              statusColor = "bg-[#E28743]";
              ringColor = "bg-[#E28743]";
            } else if (card.status === "off-track") {
              statusColor = "bg-[#D9383A]";
              borderColor = "border-[#FADBD8] ring-1 ring-[#F5B7B1]";
              ringColor = "bg-[#D9383A]";
            } else if (card.status === "exceeded") {
              statusColor = "bg-[#7B6AE6]";
              borderColor = "border-[#D6D1F9]";
              ringColor = "bg-[#7B6AE6]";
            }

            return (
              <div 
                key={card.id} 
                className={`bg-white rounded-lg border ${borderColor} shadow-xs flex flex-col justify-between overflow-hidden transition-all hover:shadow-md relative`}
              >
                
                {/* Specific Header Alert Box for Off Track Cards */}
                {card.badgeText && (
                  <div className="bg-[#FCE4E4] text-[#D9383A] text-[10px] font-bold px-3 py-1 flex items-center gap-1 border-b border-[#FADBD8]">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>{card.badgeText}</span>
                  </div>
                )}

                {/* Exceeded tag banner placement top-right */}
                {card.status === "exceeded" && (
                  <div className="absolute top-0 right-0 bg-[#EBE9FD] text-[#7B6AE6] text-[8px] font-bold px-2 py-0.5 rounded-bl uppercase tracking-wider">
                    Exceeded
                  </div>
                )}

                {/* Upper Body Segment */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
                      <h3 className="text-xs font-bold text-gray-800 tracking-tight">{card.title}</h3>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 rounded-md p-0.5">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Values Presentation */}
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-lg font-extrabold text-gray-900 tracking-tight">{card.value}</span>
                    <span className="text-[11px] text-gray-400 font-medium">/ {card.target}</span>
                  </div>

                  {/* Progress bar logic rendering accurately aligned colors */}
                  <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        card.status === "off-track" 
                        ? "bg-[#D9383A]" 
                        : card.status === "at-risk" 
                        ? "bg-[#E28743]" 
                        : "bg-[#1E5631]"
                      }`}
                      style={{ width: `${card.progress}%` }}
                    />
                  </div>

                  {/* Native Micro Trend Graph Component Renderer */}
                  <div className="mt-4 h-8 flex items-end gap-1 w-full justify-between px-1">
                    {card.trendType === "bar" ? (
                      // Render micro bar graphics
                      card.trendData.map((val, idx) => (
                        <div 
                          key={idx} 
                          className={`w-full rounded-sm transition-all ${
                            card.status === "off-track" ? "bg-[#F3A0A1]" : card.status === "at-risk" ? "bg-[#F5CBA7]" : "bg-[#C4BFF6]"
                          }`}
                          style={{ height: `${(val / 100) * 100}%` }}
                        />
                      ))
                    ) : (
                      // Custom minimal SVG mockup representational sparklines
                      <div className="w-full h-full relative pt-2">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                          <path
                            d="M 0 15 Q 20 12, 40 14 T 80 8 T 100 2"
                            fill="none"
                            stroke={card.status === "at-risk" ? "#E28743" : "#1E5631"}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer section specifying Assignee and Interval Schedule */}
                <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={card.avatarUrl}
                      alt="Assignee"
                      className="h-4 w-4 rounded-full object-cover ring-1 ring-gray-200"
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