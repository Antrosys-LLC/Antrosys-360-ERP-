"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import {
  fetchOpsDashboard,
  toggleOpsAttendanceFlag,
  overrideOpsAttendanceStatus,
  updateOpsHeadLeaveStatus,
  raiseManpowerRequest,
  type DeptFilter,
} from "@/lib/operation-head-api";

const deptFilters: DeptFilter[] = ["All", "Eng", "Ops", "Fin", "HR"];

type AttendanceDotStatus = "present" | "late" | "absent";
type AttendanceStatus = "Present" | "Late" | "Absent";

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

const OVERRIDE_OPTIONS = [
  { label: "Mark Present", value: "PRESENT" as const },
  { label: "Mark Late", value: "LATE" as const },
  { label: "Mark Absent", value: "ABSENT" as const },
  { label: "Mark On Leave", value: "ON LEAVE" as const },
];

export default function OperationsHeadDashboardPage() {
  const [activeFilter, setActiveFilter] = useState<DeptFilter>("All");
  const [openMenuEmployeeId, setOpenMenuEmployeeId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ops-head-dashboard", activeFilter],
    queryFn: () => fetchOpsDashboard(activeFilter),
  });

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ["ops-head-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["ops-head-leaves"] });
  };

  const flagMutation = useMutation({
    mutationFn: ({ employeeId, isFlagged }: { employeeId: string; isFlagged: boolean }) =>
      toggleOpsAttendanceFlag(employeeId, isFlagged),
    onSuccess: () => {
      toast({ title: "Flag updated" });
      invalidateDashboard();
    },
    onError: () => toast({ title: "Failed to update flag", variant: "destructive" }),
  });

  const overrideMutation = useMutation({
    mutationFn: ({
      employeeId,
      status,
    }: {
      employeeId: string;
      status: "PRESENT" | "ABSENT" | "LATE" | "ON LEAVE";
    }) => overrideOpsAttendanceStatus(employeeId, status),
    onSuccess: () => {
      toast({ title: "Attendance updated" });
      setOpenMenuEmployeeId(null);
      invalidateDashboard();
    },
    onError: () => toast({ title: "Failed to update attendance", variant: "destructive" }),
  });

  const leaveMutation = useMutation({
    mutationFn: ({
      leaveId,
      status,
    }: {
      leaveId: string;
      status: "APPROVED" | "REJECTED";
    }) =>
      updateOpsHeadLeaveStatus(leaveId, {
        status,
        ...(status === "REJECTED" ? { declineNote: "Rejected by Operations Head" } : {}),
      }),
    onSuccess: () => {
      toast({ title: "Leave status updated" });
      invalidateDashboard();
    },
    onError: () =>
      toast({ title: "Failed to update leave", variant: "destructive" }),
  });

  const manpowerMutation = useMutation({
    mutationFn: raiseManpowerRequest,
    onSuccess: () => {
      toast({ title: "Manpower request raised" });
      invalidateDashboard();
    },
    onError: () =>
      toast({ title: "Failed to raise request", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-12 bg-[#F0F0F0] rounded-lg" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-[#F0F0F0] rounded-[10px]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-12 text-[#888888]">
        Failed to load operations dashboard.
      </div>
    );
  }

  const {
    pageHeader,
    attendanceRate,
    pendingLeave,
    manpowerGapsSummary,
    rosterCoverage,
    attendanceDots,
    todayAttendanceRows,
    leaveApprovals,
    manpowerGapsDetail,
    recentManpowerRequests,
  } = data;

  const handleRaiseRequest = () => {
    const firstGap = manpowerGapsDetail[0];
    if (!firstGap) {
      toast({ title: "No manpower gaps to raise a request for" });
      return;
    }
    const deptMap: Record<string, string> = {
      Engineering: "ENGINEERING",
      Operations: "OPERATIONS",
      Finance: "FINANCE",
      Hr: "HR",
      HR: "HR",
      Sales: "SALES",
    };
    const department = deptMap[firstGap.dept] ?? "OTHER";
    manpowerMutation.mutate({ department, additionalHeadcount: 1 });
  };

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
            onClick={() => router.push("/operations/leave")}
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
                key={day.day}
                className="flex-1 text-center text-[9px] font-medium text-[#534AB7] bg-[#EEEDFE] rounded py-1.5"
              >
                {day.day}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-[1.7fr_1fr_1fr] gap-3 items-stretch">
        {/* Today's attendance */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center justify-between px-[17px] py-3.5 border-b border-[#E0E0E0] shrink-0">
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

          <div className="flex-1 overflow-y-auto min-h-0">
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
                  key={row.employeeId}
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
                    <div className="flex items-center justify-end gap-2 relative">
                      <button
                        type="button"
                        aria-label="Flag"
                        onClick={() =>
                          flagMutation.mutate({
                            employeeId: row.employeeId,
                            isFlagged: !row.isFlagged,
                          })
                        }
                        className={`hover:text-[#1A1A1A] ${row.isFlagged ? "text-[#A32D2D]" : "text-[#888888]"}`}
                      >
                        <Flag size={13} strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        aria-label="More options"
                        onClick={() =>
                          setOpenMenuEmployeeId(
                            openMenuEmployeeId === row.employeeId
                              ? null
                              : row.employeeId,
                          )
                        }
                        className="text-[#888888] hover:text-[#1A1A1A]"
                      >
                        <MoreHorizontal size={13} strokeWidth={1.8} />
                      </button>
                      {openMenuEmployeeId === row.employeeId && (
                        <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-[#E0E0E0] rounded-md shadow-md py-1 min-w-[140px]">
                          {OVERRIDE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                overrideMutation.mutate({
                                  employeeId: row.employeeId,
                                  status: opt.value,
                                })
                              }
                              className="block w-full text-left px-3 py-1.5 text-[11px] text-[#1A1A1A] hover:bg-[#F8F9FC]"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Leave approvals */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] overflow-hidden flex flex-col min-h-0">
          <div className="px-[17px] py-3.5 border-b border-[#E0E0E0] shrink-0">
            <span className="text-[13px] font-semibold text-[#1A1A1A]">
              Leave approvals
            </span>
          </div>
          <div className="p-[17px] flex flex-col gap-2.5 flex-1 overflow-y-auto min-h-0">
            {leaveApprovals.length === 0 ? (
              <p className="text-[12px] text-[#888888] text-center py-4">
                No leaves pending Operations review
              </p>
            ) : (
              leaveApprovals.map((req) => (
                <div
                  key={req.id}
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
                  {req.reason && (
                    <p className="text-[10px] text-[#666666] mb-2 line-clamp-2">
                      {req.reason}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        leaveMutation.mutate({
                          leaveId: req.id,
                          status: "REJECTED",
                        })
                      }
                      disabled={leaveMutation.isPending}
                      className="text-[11px] font-medium text-[#1A1A1A] bg-white border border-[#D8D8D8] rounded-md py-1.5 hover:bg-[#F8F9FC] disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        leaveMutation.mutate({
                          leaveId: req.id,
                          status: "APPROVED",
                        })
                      }
                      disabled={leaveMutation.isPending}
                      className="text-[11px] font-medium text-white bg-[#7B68EE] rounded-md py-1.5 hover:bg-[#6A5ACD] disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Manpower gaps detail */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] overflow-hidden flex flex-col">
          <div className="px-[17px] py-3.5 border-b border-[#E0E0E0]">
            <span className="text-[13px] font-semibold text-[#1A1A1A]">
              Manpower gaps
            </span>
          </div>
          <div className="px-[17px] py-2 flex flex-col flex-1">
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
            {recentManpowerRequests.length > 0 && (
              <div className="border-t border-[#E0E0E0] pt-3 mt-1">
                <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wide block mb-2">
                  Recent requests
                </span>
                <div className="flex flex-col gap-2">
                  {recentManpowerRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#F8F9FC] border border-[#E0E0E0] rounded-md px-2.5 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-[#1A1A1A]">
                          {req.department} · +{req.headcount}
                        </span>
                        <span className="text-[9px] font-medium text-[#534AB7] bg-[#EEEDFE] px-1.5 py-0.5 rounded">
                          {req.status}
                        </span>
                      </div>
                      {req.notes && (
                        <p className="text-[10px] text-[#888888] mt-1 line-clamp-1">
                          {req.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="px-[17px] pb-[17px] pt-2 mt-auto">
            <button
              type="button"
              onClick={handleRaiseRequest}
              disabled={manpowerMutation.isPending}
              className="w-full text-[12px] font-medium text-[#534AB7] border border-[#7B68EE] rounded-md py-2 hover:bg-[#F8F9FC] disabled:opacity-50"
            >
              Raise new request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
