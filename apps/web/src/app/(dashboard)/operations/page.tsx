"use client";

import { useState } from "react";
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

// ============================================================================
// MOCK DATA — replace with API fetches later (React Query hooks)
// ============================================================================

const pageHeader = {
  title: "Operations Overview",
  subtitle: "Mon, 16 May 2026",
  liveLabel: "Live data",
};

const attendanceRate = {
  label: "Attendance rate",
  value: "87%",
  progressPct: 87,
  breakdown: [
    { label: "Present", count: 420, color: "#7B68EE" },
    { label: "Absent", count: 34, color: "#E24B4A" },
    { label: "Late", count: 29, color: "#F2B90C" },
  ],
};

const pendingLeave = {
  label: "Pending leave",
  value: 11,
  valueColor: "#C2840A",
  types: [
    { label: "Annual", count: 7 },
    { label: "Sick", count: 3 },
    { label: "Casual", count: 1 },
  ],
  ctaLabel: "Review all →",
};

const manpowerGapsSummary = {
  label: "Manpower gaps",
  value: 3,
  valueColor: "#A32D2D",
  items: [
    { label: "2 Critical roles", tone: "danger" as const },
    { label: "1 Standard role", tone: "neutral" as const },
  ],
};

const rosterCoverage = {
  label: "Roster coverage",
  value: "94%",
  days: ["Mo", "Tu", "We", "Th", "Fr"],
};

type DeptFilter = "All" | "Eng" | "Ops" | "Fin" | "HR";

const deptFilters: DeptFilter[] = ["All", "Eng", "Ops", "Fin", "HR"];

type AttendanceDotStatus = "present" | "late" | "absent";

// 20 dots representing a snapshot of today's check-in distribution
const attendanceDots: AttendanceDotStatus[] = [
  "absent",
  "absent",
  "absent",
  "late",
  "late",
  "late",
  "present",
  "present",
  "present",
  "present",
  "present",
  "present",
  "present",
  "present",
  "present",
  "present",
  "present",
  "present",
  "present",
  "present",
];

type AttendanceStatus = "Present" | "Late" | "Absent";

const todayAttendanceRows: {
  name: string;
  dept: string;
  checkIn: string;
  status: AttendanceStatus;
}[] = [
  {
    name: "Bilal Hassan",
    dept: "Engineering",
    checkIn: "--:--",
    status: "Absent",
  },
  {
    name: "Aisha Malik",
    dept: "Operations",
    checkIn: "09:15 AM",
    status: "Late",
  },
  {
    name: "Raza Farouk",
    dept: "Finance",
    checkIn: "08:55 AM",
    status: "Present",
  },
  { name: "Ali Raza", dept: "Designer", checkIn: "09:40 AM", status: "Late" },
];

const leaveApprovals = [
  { initials: "S", name: "Sara Javed", type: "Annual", days: 3 },
  { initials: "A", name: "Amna Baig", type: "Annual", days: 5 },
  { initials: "O", name: "Omer Mirza", type: "Sick", days: 1 },
];

const manpowerGapsDetail: {
  dept: string;
  level: "Critical" | "Standard";
  count: number;
}[] = [
  { dept: "Engineering", level: "Critical", count: 2 },
  { dept: "Operations", level: "Standard", count: 1 },
  { dept: "HR", level: "Standard", count: 1 },
];

// ============================================================================
// HELPERS
// ============================================================================

function dotColor(status: AttendanceDotStatus): string {
  switch (status) {
    case "present":
      return "#7B68EE";
    case "late":
      return "#F2B90C";
    case "absent":
      return "#C0382B";
  }
}

function statusBadgeClasses(status: AttendanceStatus): string {
  switch (status) {
    case "Present":
      return "bg-[#EEEDFE] text-[#534AB7]";
    case "Late":
      return "bg-[#FAEEDA] text-[#633806]";
    case "Absent":
      return "bg-[#FCEBEB] text-[#791F1F]";
  }
}

// ============================================================================
// PAGE
// ============================================================================

export default function OperationsHeadDashboardPage() {
  const [activeFilter, setActiveFilter] = useState<DeptFilter>("All");

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[#1A1A1A] leading-tight">
            {pageHeader.title}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[12px] text-[#888888]">
              {pageHeader.subtitle}
            </span>
            <span className="text-[#CCCCCC]">·</span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-[#3B6D11]" />
              <span className="text-[12px] text-[#27500A]">
                {pageHeader.liveLabel}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-3">
        {/* Attendance rate */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wide">
              {attendanceRate.label}
            </span>
            <Users size={15} strokeWidth={1.8} className="text-[#AAAAAA]" />
          </div>
          <div className="text-[24px] font-bold text-[#1A1A1A] leading-none mb-3">
            {attendanceRate.value}
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#F0F0F0] overflow-hidden mb-3">
            <div
              className="h-full bg-[#7B68EE] rounded-full"
              style={{ width: `${attendanceRate.progressPct}%` }}
            />
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {attendanceRate.breakdown.map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[10px] text-[#888888]">
                  {item.count} {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending leave */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wide">
              {pendingLeave.label}
            </span>
            <CalendarDays
              size={15}
              strokeWidth={1.8}
              className="text-[#AAAAAA]"
            />
          </div>
          <div
            className="text-[24px] font-bold leading-none mb-3"
            style={{ color: pendingLeave.valueColor }}
          >
            {pendingLeave.value}
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {pendingLeave.types.map((type) => (
              <div
                key={type.label}
                className="border border-[#E0E0E0] rounded-md py-1.5 text-center"
              >
                <div className="text-[13px] font-semibold text-[#1A1A1A] leading-none">
                  {type.count}
                </div>
                <div className="text-[9px] text-[#AAAAAA] mt-1">
                  {type.label}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="text-[11px] font-medium text-[#534AB7] text-right hover:underline mt-auto"
          >
            {pendingLeave.ctaLabel}
          </button>
        </div>

        {/* Manpower gaps */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wide">
              {manpowerGapsSummary.label}
            </span>
            <UserX size={15} strokeWidth={1.8} className="text-[#AAAAAA]" />
          </div>
          <div
            className="text-[24px] font-bold leading-none mb-3"
            style={{ color: manpowerGapsSummary.valueColor }}
          >
            {manpowerGapsSummary.value}
          </div>
          <div className="flex flex-col gap-1.5">
            {manpowerGapsSummary.items.map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between px-2.5 py-2 rounded-md ${
                  item.tone === "danger" ? "bg-[#FCEBEB]" : "bg-[#F1EFE8]"
                }`}
              >
                <span
                  className="text-[11px] font-medium"
                  style={{
                    color: item.tone === "danger" ? "#A32D2D" : "#444441",
                  }}
                >
                  {item.label}
                </span>
                {item.tone === "danger" ? (
                  <AlertTriangle
                    size={13}
                    strokeWidth={2}
                    className="text-[#A32D2D]"
                  />
                ) : (
                  <Info size={13} strokeWidth={2} className="text-[#888888]" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Roster coverage */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wide">
              {rosterCoverage.label}
            </span>
            <CalendarCheck
              size={15}
              strokeWidth={1.8}
              className="text-[#AAAAAA]"
            />
          </div>
          <div className="text-[24px] font-bold text-[#1A1A1A] leading-none mb-4">
            {rosterCoverage.value}
          </div>
          <div className="flex items-center gap-1.5 mt-auto">
            {rosterCoverage.days.map((day) => (
              <span
                key={day}
                className="flex-1 text-center text-[9px] font-medium text-[#534AB7] bg-[#EEEDFE] rounded py-1.5"
              >
                {day}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main grid: Today's attendance + Leave approvals + Manpower gaps detail */}
      <div className="grid grid-cols-[1.7fr_1fr_1fr] gap-3 items-start">
        {/* Today's attendance */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] overflow-hidden">
          <div className="flex items-center justify-between px-[17px] py-3.5 border-b border-[#E0E0E0]">
            <span className="text-[13px] font-semibold text-[#1A1A1A]">
              Today&apos;s attendance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#3B6D11]" />
              <span className="text-[11px] text-[#27500A] font-medium">
                Live
              </span>
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

          <div className="px-[17px] pt-4 flex flex-wrap gap-2">
            {attendanceDots.map((status, idx) => (
              <span
                key={idx}
                className="size-3.5 rounded-full"
                style={{ backgroundColor: dotColor(status) }}
              />
            ))}
          </div>

          <table className="w-full mt-4">
            <thead>
              <tr className="border-t border-[#E0E0E0] bg-[#F8F9FC]">
                <th className="text-left text-[10px] font-semibold text-[#888888] uppercase tracking-wide px-[17px] py-2.5">
                  Employee
                </th>
                <th className="text-left text-[10px] font-semibold text-[#888888] uppercase tracking-wide px-2 py-2.5">
                  Dept
                </th>
                <th className="text-left text-[10px] font-semibold text-[#888888] uppercase tracking-wide px-2 py-2.5">
                  Check-in
                </th>
                <th className="text-left text-[10px] font-semibold text-[#888888] uppercase tracking-wide px-2 py-2.5">
                  Status
                </th>
                <th className="text-right text-[10px] font-semibold text-[#888888] uppercase tracking-wide px-[17px] py-2.5">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {todayAttendanceRows.map((row, idx) => (
                <tr
                  key={row.name}
                  className={
                    idx !== todayAttendanceRows.length - 1
                      ? "border-b border-[#E0E0E0]"
                      : ""
                  }
                >
                  <td className="px-[17px] py-3 text-[12px] font-medium text-[#1A1A1A]">
                    {row.name}
                  </td>
                  <td className="px-2 py-3 text-[12px] text-[#888888]">
                    {row.dept}
                  </td>
                  <td className="px-2 py-3 text-[12px] text-[#888888]">
                    {row.checkIn}
                  </td>
                  <td className="px-2 py-3">
                    <span
                      className={`text-[10px] font-medium px-2 py-1 rounded-full ${statusBadgeClasses(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-[17px] py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Flag"
                        className="text-[#888888] hover:text-[#1A1A1A]"
                      >
                        <Flag size={13} strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        aria-label="More options"
                        className="text-[#888888] hover:text-[#1A1A1A]"
                      >
                        <MoreHorizontal size={13} strokeWidth={1.8} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leave approvals */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] overflow-hidden">
          <div className="px-[17px] py-3.5 border-b border-[#E0E0E0]">
            <span className="text-[13px] font-semibold text-[#1A1A1A]">
              Leave approvals
            </span>
          </div>
          <div className="p-[17px] flex flex-col gap-2.5">
            {leaveApprovals.map((req) => (
              <div
                key={req.name}
                className="bg-[#F8F9FC] border border-[#E0E0E0] rounded-lg p-3"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="size-7 rounded-full bg-[#7B68EE] flex items-center justify-center shrink-0">
                    <span className="text-white text-[11px] font-semibold">
                      {req.initials}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[12px] font-medium text-[#1A1A1A] block truncate">
                      {req.name}
                    </span>
                    <span className="text-[10px] text-[#888888]">
                      {req.type} · {req.days} days
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="text-[11px] font-medium text-[#1A1A1A] bg-white border border-[#D8D8D8] rounded-md py-1.5 hover:bg-[#F8F9FC]"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-white bg-[#7B68EE] rounded-md py-1.5 hover:bg-[#6A5ACD]"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manpower gaps detail */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] overflow-hidden flex flex-col">
          <div className="px-[17px] py-3.5 border-b border-[#E0E0E0]">
            <span className="text-[13px] font-semibold text-[#1A1A1A]">
              Manpower gaps
            </span>
          </div>
          <div className="px-[17px] py-2 flex flex-col">
            {manpowerGapsDetail.map((gap, idx) => (
              <div
                key={gap.dept}
                className={`flex items-center justify-between py-3 ${
                  idx !== manpowerGapsDetail.length - 1
                    ? "border-b border-dashed border-[#E0E0E0]"
                    : ""
                }`}
              >
                <div>
                  <span className="text-[12px] font-medium text-[#1A1A1A] block">
                    {gap.dept}
                  </span>
                  <span
                    className="text-[11px]"
                    style={{
                      color: gap.level === "Critical" ? "#A32D2D" : "#888888",
                    }}
                  >
                    {gap.level}
                  </span>
                </div>
                <span className="size-7 rounded-md bg-[#F0F0F0] flex items-center justify-center text-[12px] font-semibold text-[#1A1A1A]">
                  {gap.count}
                </span>
              </div>
            ))}
          </div>
          <div className="px-[17px] pb-[17px] pt-2 mt-auto">
            <button
              type="button"
              className="w-full text-[12px] font-medium text-[#534AB7] border border-[#7B68EE] rounded-md py-2 hover:bg-[#F8F9FC]"
            >
              Raise new request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
