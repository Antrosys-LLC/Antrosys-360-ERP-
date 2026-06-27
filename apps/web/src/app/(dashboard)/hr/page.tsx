"use client";

import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  Users, 
  Rocket, 
  TrendingDown, 
  Plus, 
  FileText, 
  UserPlus, 
  MoreHorizontal, 
  ChevronDown, 
  Download, 
  Bell,
  Info
} from "lucide-react";
import apiClient from '@/lib/api-client';

const getSemanticStyle = (type: string) => {
  switch (type) {
    case "success": return "bg-[#EAF3DE] text-[#27500A]";
    case "warning": return "bg-[#FAEEDA] text-[#633806]";
    case "danger": return "bg-[#FCEBEB] text-[#791F1F]";
    case "info": return "bg-[#E6F1FB] text-[#0C447C]";
    default: return "bg-[#F1EFE8] text-[#444441]";
  }
};

export default function HRDashboard() {
  const [data, setData] = useState<{ module?: string; status?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/hr/employees')
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-[#7B68EE]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-[#888] font-medium">Loading HR dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] p-6 flex items-center justify-center">
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-6 shadow-sm text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-[#FCEBEB] flex items-center justify-center mx-auto mb-3">
            <TrendingDown className="w-6 h-6 text-[#791F1F]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Failed to load</h3>
          <p className="text-xs text-[#888]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 text-[#1A1A1A] font-sans antialiased">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">People overview</h1>
          <p className="text-[12px] text-[#888] font-normal">May 2026 - HR & Talent view</p>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button className="h-[34px] px-3 flex items-center gap-2 border border-[#E0E0E0] bg-white rounded-[7px] text-[14px] text-[#333] hover:border-[#7B68EE] transition-colors">
            <span className="w-2 h-2 rounded-full bg-[#7B68EE]" />
            <span>May 2026</span>
            <ChevronDown className="w-4 h-4 text-[#888]" />
          </button>
          <button className="h-[34px] px-3 flex items-center gap-2 border border-[#E0E0E0] bg-white rounded-[7px] text-[14px] text-[#534AB7] hover:bg-[#F8F9FC] transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="h-[34px] px-4 flex items-center gap-2 bg-[#7B68EE] text-white rounded-[7px] text-[14px] font-medium hover:bg-[#6A5ACD] transition-colors">
            <span>Post job</span>
          </button>
          <button className="w-[34px] h-[34px] flex items-center justify-center border border-[#E0E0E0] bg-white rounded-[7px] text-[#333] hover:bg-[#F8F9FC]">
            <Bell className="w-4 h-4" />
          </button>
          <div className="w-[34px] h-[34px] bg-[#EEEDFE] rounded-full flex items-center justify-center text-[13px] font-semibold text-[#534AB7]">AM</div>
        </div>
      </header>

      {/* API Status */}
      <section className="bg-white border border-[#E0E0E0] rounded-[10px] p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EEEDFE] flex items-center justify-center shrink-0">
            <Info size={20} strokeWidth={1.8} className="text-[#534AB7]" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">Backend Module</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[14px] font-semibold text-[#1A1A1A]">{data?.module || 'N/A'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                data?.status === 'wip' ? 'bg-[#FAEEDA] text-[#633806]' : 'bg-[#EAF3DE] text-[#27500A]'
              }`}>
                {data?.status || 'unknown'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* KPI GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { title: "OPEN ROLES", value: "—", icon: Briefcase, metricText: "Awaiting data", metricType: "neutral" },
          { title: "TOTAL HEADCOUNT", value: "—", icon: Users, metricText: "Awaiting data", metricType: "neutral" },
          { title: "ONBOARDING PIPELINE", value: "—", icon: Rocket, metricText: "Awaiting data", metricType: "neutral" },
          { title: "ATTRITION RATE", value: "—", icon: TrendingDown, metricText: "Awaiting data", metricType: "neutral" },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-[#EEEDFE] rounded-[10px] p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-semibold tracking-wider text-[#888] uppercase">{kpi.title}</span>
                <Icon className="w-4 h-4 text-[#534AB7]" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[28px] font-semibold leading-none">{kpi.value}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-[#F1EFE8] text-[#444441]">{kpi.metricText}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ANALYTICS CHARTS GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-[#E0E0E0] rounded-[10px] p-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[16px] font-semibold">Recruitment funnel</h2>
            <button className="hover:text-[#1A1A1A]"><MoreHorizontal className="w-4 h-4 text-[#888]" /></button>
          </div>
          <div className="flex items-center justify-center min-h-[200px]">
            <p className="text-[13px] text-[#888]">Funnel data pending from backend</p>
          </div>
        </div>

        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[16px] font-semibold">Headcount by department</h2>
            <button className="hover:text-[#1A1A1A]"><MoreHorizontal className="w-4 h-4 text-[#888]" /></button>
          </div>
          <div className="flex items-center justify-center min-h-[200px]">
            <p className="text-[13px] text-[#888]">Department data pending</p>
          </div>
        </div>
      </section>

      {/* LOWER CONTENT ROW */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5">
          <h2 className="text-[16px] font-semibold mb-4">Quick actions</h2>
          <div className="flex flex-col gap-2">
            {[
              { icon: Plus, label: "Post job" },
              { icon: Users, label: "View applicants", badge: true },
              { icon: FileText, label: "Generate HR letter" },
              { icon: UserPlus, label: "Start onboarding" },
            ].map((action, idx) => (
              <button key={idx} className="w-full h-[40px] px-3 flex items-center justify-between border border-[#E0E0E0] bg-white rounded-[7px] text-[14px] text-[#333] hover:border-[#7B68EE] hover:bg-[#F8F9FC] transition-colors">
                <div className="flex items-center gap-2.5 text-[#534AB7]">
                  <action.icon className="w-4 h-4" />
                  <span className="text-[#333] font-medium">{action.label}</span>
                </div>
                {action.badge && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#7B68EE] text-white">—</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-[#E0E0E0] rounded-[10px] p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[16px] font-semibold">Recent hires</h2>
            <button className="text-[12px] text-[#534AB7] font-semibold hover:underline">View all</button>
          </div>
          <div className="flex items-center justify-center min-h-[150px]">
            <p className="text-[13px] text-[#888]">Hire data will load from /hr/employees endpoint</p>
          </div>
        </div>
      </section>
    </div>
  );
}
