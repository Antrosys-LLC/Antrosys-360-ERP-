"use client";

import { useState, useEffect } from "react";
import {
  Users,
  CalendarDays,
  UserX,
  CalendarCheck,
  AlertTriangle,
  Info,
  Flag,
  MoreHorizontal,
} from "lucide-react";
import apiClient from '@/lib/api-client';

function dotColor(status: string): string {
  switch (status) {
    case "present": return "#7B68EE";
    case "late": return "#F2B90C";
    case "absent": return "#C0382B";
    default: return "#E0E0E0";
  }
}

function statusBadgeClasses(status: string): string {
  switch (status) {
    case "Present": return "bg-[#EEEDFE] text-[#534AB7]";
    case "Late": return "bg-[#FAEEDA] text-[#633806]";
    case "Absent": return "bg-[#FCEBEB] text-[#791F1F]";
    default: return "bg-[#F0F0F0] text-[#888888]";
  }
}

type DeptFilter = "All" | "Eng" | "Ops" | "Fin" | "HR";
const deptFilters: DeptFilter[] = ["All", "Eng", "Ops", "Fin", "HR"];

export default function OperationsHeadDashboardPage() {
  const [data, setData] = useState<{ module?: string; status?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<DeptFilter>("All");

  useEffect(() => {
    apiClient.get('/operations/attendance')
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 min-h-screen bg-[#F8F9FC] items-center justify-center">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-[#7B68EE]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-[#888888] font-medium">Loading operations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 min-h-screen bg-[#F8F9FC] items-center justify-center">
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-6 shadow-sm text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-[#FCEBEB] flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-[#A32D2D]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Failed to load</h3>
          <p className="text-xs text-[#888888]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[#1A1A1A] leading-tight">
            Operations Overview
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[12px] text-[#888888]">Mon, 16 May 2026</span>
            <span className="text-[#CCCCCC]">·</span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-[#3B6D11]" />
              <span className="text-[12px] text-[#27500A]">Live data</span>
            </span>
          </div>
        </div>
      </div>

      {/* API Status Banner */}
      <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-3 flex items-center gap-3">
        <div className="size-8 rounded-full bg-[#EEEDFE] flex items-center justify-center shrink-0">
          <Info size={14} strokeWidth={1.8} className="text-[#534AB7]" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wide">Module:</span>
          <span className="text-[12px] font-semibold text-[#1A1A1A]">{data?.module || 'N/A'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            data?.status === 'wip' ? 'bg-[#FAEEDA] text-[#633806]' : 'bg-[#EEEDFE] text-[#534AB7]'
          }`}>
            {data?.status || 'unknown'}
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wide">Attendance rate</span>
            <Users size={15} strokeWidth={1.8} className="text-[#AAAAAA]" />
          </div>
          <div className="text-[24px] font-bold text-[#1A1A1A] leading-none mb-3">—</div>
          <div className="h-1.5 w-full rounded-full bg-[#F0F0F0] overflow-hidden mb-3">
            <div className="h-full bg-[#7B68EE] rounded-full" style={{ width: '0%' }} />
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] text-[#888888]">Awaiting data</span>
          </div>
        </div>

        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wide">Pending leave</span>
            <CalendarDays size={15} strokeWidth={1.8} className="text-[#AAAAAA]" />
          </div>
          <div className="text-[24px] font-bold text-[#C2840A] leading-none mb-3">—</div>
          <button type="button" className="text-[11px] font-medium text-[#534AB7] text-right hover:underline mt-auto">Review all →</button>
        </div>

        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wide">Manpower gaps</span>
            <UserX size={15} strokeWidth={1.8} className="text-[#AAAAAA]" />
          </div>
          <div className="text-[24px] font-bold text-[#A32D2D] leading-none mb-3">—</div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-2.5 py-2 rounded-md bg-[#F1EFE8]">
              <span className="text-[11px] font-medium text-[#444441]">Pending data</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wide">Roster coverage</span>
            <CalendarCheck size={15} strokeWidth={1.8} className="text-[#AAAAAA]" />
          </div>
          <div className="text-[24px] font-bold text-[#1A1A1A] leading-none mb-4">—</div>
          <div className="flex items-center gap-1.5 mt-auto">
            {["Mo", "Tu", "We", "Th", "Fr"].map(day => (
              <span key={day} className="flex-1 text-center text-[9px] font-medium text-[#534AB7] bg-[#EEEDFE] rounded py-1.5">{day}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Main grid: Today's attendance + Leave approvals + Manpower gaps */}
      <div className="grid grid-cols-[1.7fr_1fr_1fr] gap-3 items-start">
        {/* Today's attendance */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] overflow-hidden">
          <div className="flex items-center justify-between px-[17px] py-3.5 border-b border-[#E0E0E0]">
            <span className="text-[13px] font-semibold text-[#1A1A1A]">Today&apos;s attendance</span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#3B6D11]" />
              <span className="text-[11px] text-[#27500A] font-medium">Stub</span>
            </span>
          </div>
          <div className="px-[17px] pt-3.5 flex items-center gap-2">
            {deptFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  activeFilter === filter
                    ? "bg-[#F0F0F0] border-[#D8D8D8] text-[#1A1A1A]"
                    : "bg-white border-[#E0E0E0] text-[#888888] hover:bg-[#F8F9FC]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="p-[17px] flex flex-col items-center justify-center min-h-[120px]">
            <Info size={20} strokeWidth={1.8} className="text-[#AAAAAA] mb-2" />
            <span className="text-[11px] text-[#888888]">Attendance data loading from API</span>
          </div>
        </div>

        {/* Leave approvals */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] overflow-hidden">
          <div className="px-[17px] py-3.5 border-b border-[#E0E0E0]">
            <span className="text-[13px] font-semibold text-[#1A1A1A]">Leave approvals</span>
          </div>
          <div className="p-[17px] flex flex-col items-center justify-center min-h-[200px]">
            <CalendarDays size={20} strokeWidth={1.8} className="text-[#AAAAAA] mb-2" />
            <span className="text-[11px] text-[#888888]">No approvals yet</span>
          </div>
        </div>

        {/* Manpower gaps */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] overflow-hidden flex flex-col">
          <div className="px-[17px] py-3.5 border-b border-[#E0E0E0]">
            <span className="text-[13px] font-semibold text-[#1A1A1A]">Manpower gaps</span>
          </div>
          <div className="p-[17px] flex flex-col items-center justify-center min-h-[200px]">
            <UserX size={20} strokeWidth={1.8} className="text-[#AAAAAA] mb-2" />
            <span className="text-[11px] text-[#888888]">No gap data</span>
          </div>
        </div>
      </div>
    </div>
  );
}
