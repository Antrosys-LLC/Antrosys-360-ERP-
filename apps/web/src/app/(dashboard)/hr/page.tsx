"use client";

import React from "react";
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
  Bell 
} from "lucide-react";

// ==========================================
// 1. STRICT DESIGN SYSTEM MOCK DATA
// ==========================================

const KPI_DATA = [
  {
    title: "OPEN ROLES",
    value: "18",
    icon: Briefcase,
    metricText: "+4 vs last month",
    metricType: "success",
  },
  {
    title: "TOTAL HEADCOUNT",
    value: "247",
    icon: Users,
    metricText: "+11 this quarter",
    metricType: "success",
  },
  {
    title: "ONBOARDING PIPELINE",
    value: "9",
    icon: Rocket,
    metricText: "3 starting this week",
    metricType: "info",
  },
  {
    title: "ATTRITION RATE",
    value: "4.2%",
    icon: TrendingDown,
    metricText: "+0.8% vs last qtr",
    metricType: "danger",
  },
];

const FUNNEL_DATA = [
  { label: "Applied", count: 312, percentage: 100, color: "bg-[#7B68EE]" },
  { label: "Screening", count: 208, percentage: 67, color: "bg-[#7B68EE]" },
  { label: "Interview", count: 118, percentage: 38, color: "bg-[#EEEDFE]" },
  { label: "Offer sent", count: 44, percentage: 14, color: "bg-[#EEEDFE]/50" },
  { label: "Hired", count: 22, percentage: 7, color: "bg-[#EEEDFE]/30" },
];

const FUNNEL_METRICS = [
  { label: "Avg. time to hire", value: "18 days" },
  { label: "Offer acceptance", value: "86%", highlight: "text-[#27500A]" },
  { label: "Active pipelines", value: "18" },
  { label: "Interviews this week", value: "31", highlight: "text-[#534AB7]" },
];

const DEPARTMENT_HEADCOUNT = [
  { name: "Engineering", count: 82, percentage: 90, color: "bg-[#7B68EE]" },
  { name: "Operations", count: 57, percentage: 65, color: "bg-[#EEEDFE]" },
  { name: "Sales", count: 39, percentage: 45, color: "bg-[#633806]" },
  { name: "Finance", count: 31, percentage: 35, color: "bg-[#791F1F]" },
  { name: "HR", count: 23, percentage: 25, color: "bg-[#0C447C]" },
  { name: "Other", count: 15, percentage: 18, color: "bg-[#F1EFE8]" },
];

const RECENT_HIRES = [
  { name: "Sara Javed", role: "Senior Product Designer", status: "Onboarding", date: "May 12, 2026" },
  { name: "Omar Sheikh", role: "Backend Engineer", status: "Active", date: "May 01, 2026" },
  { name: "Hina Baig", role: "Marketing Manager", status: "Offer signed", date: "Jun 01, 2026" },
  { name: "Fawad Ali", role: "Sales Executive", status: "Onboarding", date: "May 19, 2026" },
];

// Helper utility mapping for semantic tokens
const getSemanticStyle = (type: string) => {
  switch (type) {
    case "success": return "bg-[#EAF3DE] text-[#27500A]";
    case "warning": return "bg-[#FAEEDA] text-[#633806]";
    case "danger": return "bg-[#FCEBEB] text-[#791F1F]";
    case "info": return "bg-[#E6F1FB] text-[#0C447C]";
    default: return "bg-[#F1EFE8] text-[#444441]";
  }
};

const getStatusPillStyle = (status: string) => {
  const norm = status.toLowerCase();
  if (norm.includes("onboarding")) return getSemanticStyle("warning");
  if (norm.includes("active")) return getSemanticStyle("success");
  if (norm.includes("offer")) return getSemanticStyle("info");
  return getSemanticStyle("neutral");
};

// ==========================================
// 2. MAIN COMPONENT EXPORT
// ==========================================
export default function HRDashboard() {
  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 text-[#1A1A1A] font-sans antialiased">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">People overview</h1>
          <p className="text-[12px] text-[#888] font-normal">May 2026 - HR & Talent view</p>
        </div>
        
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Date Selector */}
          <button className="h-[34px] px-3 flex items-center gap-2 border border-[#E0E0E0] bg-white rounded-[7px] text-[14px] text-[#333] hover:border-[#7B68EE] transition-colors">
            <span className="w-2 h-2 rounded-full bg-[#7B68EE]" />
            <span>May 2026</span>
            <ChevronDown className="w-4 h-4 text-[#888]" />
          </button>

          {/* Export Button */}
          <button className="h-[34px] px-3 flex items-center gap-2 border border-[#E0E0E0] bg-white rounded-[7px] text-[14px] text-[#534AB7] hover:bg-[#F8F9FC] transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>

          {/* Post Job Button */}
          <button className="h-[34px] px-4 flex items-center gap-2 bg-[#7B68EE] text-white rounded-[7px] text-[14px] font-medium hover:bg-[#6A5ACD] transition-colors">
            <span>Post job</span>
          </button>

          {/* Notification Alert Bell */}
          <button className="w-[34px] h-[34px] flex items-center justify-center border border-[#E0E0E0] bg-white rounded-[7px] text-[#333] hover:bg-[#F8F9FC]">
            <Bell className="w-4 h-4" />
          </button>

          {/* User Initial Avatar Badge */}
          <div className="w-[34px] h-[34px] bg-[#EEEDFE] rounded-full flex items-center justify-center text-[13px] font-semibold text-[#534AB7]">
            AM
          </div>
        </div>
      </header>

      {/* KPI GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPI_DATA.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-[#EEEDFE] rounded-[10px] p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-semibold tracking-wider text-[#888] uppercase">{kpi.title}</span>
                <Icon className="w-4 h-4 text-[#534AB7]" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[28px] font-semibold leading-none">{kpi.value}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${getSemanticStyle(kpi.metricType)}`}>
                  {kpi.metricText}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ANALYTICS CHARTS GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Recruitment Funnel */}
        <div className="lg:col-span-2 bg-white border border-[#E0E0E0] rounded-[10px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[16px] font-semibold">Recruitment funnel</h2>
              <button className="text-[#Muted] hover:text-[#1A1A1A]"><MoreHorizontal className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3.5">
              {FUNNEL_DATA.map((row, idx) => (
                <div key={idx} className="flex items-center text-[14px]">
                  <div className="w-24 text-[#333] text-right pr-4 text-[13px]">{row.label}</div>
                  <div className="flex-1 bg-[#F0F0F0] h-[28px] rounded-[4px] overflow-hidden relative">
                    <div className={`${row.color} h-full rounded-[4px]`} style={{ width: `${row.percentage}%` }} />
                  </div>
                  <div className="w-12 text-right font-medium text-[#1A1A1A] pl-4">{row.count}</div>
                  <div className="w-12 text-right text-[12px] text-[#888] pl-2">{row.percentage}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-[#E0E0E0]">
            {FUNNEL_METRICS.map((metric, idx) => (
              <div key={idx} className="text-center sm:text-left">
                <p className="text-[11px] uppercase tracking-wider text-[#888] font-semibold mb-1">{metric.label}</p>
                <p className={`text-[16px] font-semibold ${metric.highlight || "text-[#1A1A1A]"}`}>{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Headcount by Department & Gender Split */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5 flex flex-col justify-between gap-6">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[16px] font-semibold">Headcount by department</h2>
              <button className="text-[#Muted] hover:text-[#1A1A1A]"><MoreHorizontal className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3.5">
              {DEPARTMENT_HEADCOUNT.map((dept, idx) => (
                <div key={idx} className="flex items-center text-[13px]">
                  <div className="w-20 text-[#333]">{dept.name}</div>
                  <div className="flex-1 bg-[#F0F0F0] h-[7px] rounded-full mx-3 overflow-hidden">
                    <div className={`${dept.color} h-full rounded-full`} style={{ width: `${dept.percentage}%` }} />
                  </div>
                  <div className="w-6 text-right font-medium text-[#1A1A1A]">{dept.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Gender Split Composite */}
          <div className="pt-4 border-t border-[#E0E0E0]">
            <p className="text-[11px] uppercase tracking-wider text-[#888] font-semibold mb-2">Gender split</p>
            <div className="w-full h-[10px] bg-[#F0F0F0] rounded-full overflow-hidden flex mb-3">
              <div className="bg-[#7B68EE] h-full" style={{ width: "54%" }} />
              <div className="bg-[#EEEDFE] h-full" style={{ width: "44%" }} />
              <div className="bg-[#F1EFE8] h-full" style={{ width: "2%" }} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#888]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#7B68EE]" /> Male <span className="font-semibold text-[#333]">54%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#EEEDFE]" /> Female <span className="font-semibold text-[#333]">44%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F1EFE8]" /> Other <span className="font-semibold text-[#333]">2%</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* LOWER CONTENT ROW: QUICK ACTIONS & RECENT HIRES */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions Panel */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5">
          <h2 className="text-[16px] font-semibold mb-4">Quick actions</h2>
          <div className="flex flex-col gap-2">
            
            <button className="w-full h-[40px] px-3 flex items-center justify-between border border-[#E0E0E0] bg-white rounded-[7px] text-[14px] text-[#333] hover:border-[#7B68EE] hover:bg-[#F8F9FC] transition-colors">
              <div className="flex items-center gap-2.5 text-[#534AB7]">
                <Plus className="w-4 h-4" />
                <span className="text-[#333] font-medium">Post job</span>
              </div>
            </button>

            <button className="w-full h-[40px] px-3 flex items-center justify-between border border-[#E0E0E0] bg-white rounded-[7px] text-[14px] text-[#333] hover:border-[#7B68EE] hover:bg-[#F8F9FC] transition-colors">
              <div className="flex items-center gap-2.5 text-[#534AB7]">
                <Users className="w-4 h-4" />
                <span className="text-[#333] font-medium">View applicants</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#7B68EE] text-white">12</span>
            </button>

            <button className="w-full h-[40px] px-3 flex items-center justify-between border border-[#E0E0E0] bg-white rounded-[7px] text-[14px] text-[#333] hover:border-[#7B68EE] hover:bg-[#F8F9FC] transition-colors">
              <div className="flex items-center gap-2.5 text-[#534AB7]">
                <FileText className="w-4 h-4" />
                <span className="text-[#333] font-medium">Generate HR letter</span>
              </div>
            </button>

            <button className="w-full h-[40px] px-3 flex items-center justify-between border border-[#E0E0E0] bg-white rounded-[7px] text-[14px] text-[#333] hover:border-[#7B68EE] hover:bg-[#F8F9FC] transition-colors">
              <div className="flex items-center gap-2.5 text-[#534AB7]">
                <UserPlus className="w-4 h-4" />
                <span className="text-[#333] font-medium">Start onboarding</span>
              </div>
            </button>

          </div>
        </div>

        {/* Recent Hires Data Table View */}
        <div className="lg:col-span-2 bg-white border border-[#E0E0E0] rounded-[10px] p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[16px] font-semibold">Recent hires</h2>
              <button className="text-[12px] text-[#534AB7] font-semibold hover:underline">View all</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FC] border-b border-[#E0E0E0]">
                    <th className="p-3 text-[10px] uppercase font-semibold text-[#888] tracking-wider">Name</th>
                    <th className="p-3 text-[10px] uppercase font-semibold text-[#888] tracking-wider">Role</th>
                    <th className="p-3 text-[10px] uppercase font-semibold text-[#888] tracking-wider">Status</th>
                    <th className="p-3 text-[10px] uppercase font-semibold text-[#888] tracking-wider">Start date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0]">
                  {RECENT_HIRES.map((hire, idx) => (
                    <tr key={idx} className="hover:bg-[#F8F9FC]/50 transition-colors">
                      <td className="p-3 text-[14px] font-semibold text-[#1A1A1A]">{hire.name}</td>
                      <td className="p-3 text-[14px] text-[#333]">{hire.role}</td>
                      <td className="p-3">
                        <span className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${getStatusPillStyle(hire.status)}`}>
                          {hire.status}
                        </span>
                      </td>
                      <td className="p-3 text-[13px] text-[#888]">{hire.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </section>

    </div>
  );
}