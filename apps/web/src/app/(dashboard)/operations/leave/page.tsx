"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchOpsHeadLeaves,
  updateOpsHeadLeaveStatus,
  type OpsLeaveRequest,
} from "@/lib/operation-head-api";

function leaveTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ANNUAL: "Annual",
    SICK: "Sick",
    CASUAL: "Casual",
    MATERNITY: "Maternity",
    OTHER: "Other",
    WFH: "WFH",
    UNPAID: "Unpaid",
  };
  return labels[type] ?? type;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OperationsLeavePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ops-head-leaves"],
    queryFn: () => fetchOpsHeadLeaves({ status: "PENDING_OPS_HEAD", limit: 50 }),
  });

  const leaveMutation = useMutation({
    mutationFn: ({
      leaveId,
      status,
      declineNote,
    }: {
      leaveId: string;
      status: "APPROVED" | "REJECTED";
      declineNote?: string;
    }) => updateOpsHeadLeaveStatus(leaveId, { status, declineNote }),
    onSuccess: () => {
      toast({ title: "Leave decision recorded" });
      setRejectingId(null);
      setRejectNote("");
      queryClient.invalidateQueries({ queryKey: ["ops-head-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["ops-head-dashboard"] });
    },
    onError: () =>
      toast({ title: "Failed to update leave", variant: "destructive" }),
  });

  const leaves = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Header — matches operations overview style */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/operations"
              className="text-[#888888] hover:text-[#1A1A1A] transition-colors"
            >
              <ArrowLeft size={16} strokeWidth={1.8} />
            </Link>
            <h1 className="text-[20px] font-semibold text-[#1A1A1A] leading-tight">
              Leave Management
            </h1>
          </div>
          <p className="text-[12px] text-[#888888] ml-6">
            Review escalated leave requests — Other type or exceeding quota thresholds
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={15} strokeWidth={1.8} className="text-[#AAAAAA]" />
          <span className="text-[12px] text-[#888888]">
            {leaves.length} pending review
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[#F0F0F0] rounded-[10px]" />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-8 text-center text-[#888888]">
          Failed to load leave requests.
        </div>
      )}

      {!isLoading && !isError && leaves.length === 0 && (
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-12 text-center">
          <Calendar size={32} strokeWidth={1.5} className="mx-auto text-[#CCCCCC] mb-3" />
          <p className="text-[14px] font-medium text-[#1A1A1A]">No escalated leave requests</p>
          <p className="text-[12px] text-[#888888] mt-1">
            Leaves requiring Operations Head approval will appear here after manager review.
          </p>
        </div>
      )}

      {!isLoading && leaves.length > 0 && (
        <div className="flex flex-col gap-3">
          {leaves.map((req: OpsLeaveRequest) => (
            <div
              key={req.id}
              className="bg-white border border-[#E0E0E0] rounded-[10px] p-[17px]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-full bg-[#7B68EE] flex items-center justify-center shrink-0">
                    <span className="text-white text-[12px] font-semibold">
                      {req.employee.firstName.charAt(0)}
                      {req.employee.lastName.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[14px] font-semibold text-[#1A1A1A] block">
                      {req.employee.firstName} {req.employee.lastName}
                    </span>
                    <span className="text-[11px] text-[#888888]">
                      {req.employee.designation ?? "Employee"}
                      {req.employee.department
                        ? ` · ${req.employee.department.charAt(0) + req.employee.department.slice(1).toLowerCase()}`
                        : ""}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-[#FAEEDA] text-[#633806] shrink-0">
                  Awaiting Ops Review
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="border border-[#E0E0E0] rounded-md px-3 py-2">
                  <div className="text-[9px] text-[#AAAAAA] uppercase tracking-wide">Type</div>
                  <div className="text-[12px] font-medium text-[#1A1A1A] mt-0.5">
                    {leaveTypeLabel(req.type)}
                  </div>
                </div>
                <div className="border border-[#E0E0E0] rounded-md px-3 py-2">
                  <div className="text-[9px] text-[#AAAAAA] uppercase tracking-wide">Duration</div>
                  <div className="text-[12px] font-medium text-[#1A1A1A] mt-0.5">
                    {req.durationDays} days
                  </div>
                </div>
                <div className="border border-[#E0E0E0] rounded-md px-3 py-2">
                  <div className="text-[9px] text-[#AAAAAA] uppercase tracking-wide">Dates</div>
                  <div className="text-[12px] font-medium text-[#1A1A1A] mt-0.5">
                    {formatDate(req.startDate)} – {formatDate(req.endDate)}
                  </div>
                </div>
              </div>

              {req.reason && (
                <div className="mt-3 bg-[#F8F9FC] border border-[#E0E0E0] rounded-md px-3 py-2.5">
                  <div className="text-[9px] text-[#AAAAAA] uppercase tracking-wide mb-1">
                    Reason / Description
                  </div>
                  <p className="text-[12px] text-[#444444] leading-relaxed">{req.reason}</p>
                </div>
              )}

              {req.managerApprovedBy && (
                <p className="mt-2 text-[10px] text-[#888888]">
                  Manager approved by {req.managerApprovedBy.firstName}{" "}
                  {req.managerApprovedBy.lastName}
                  {req.managerApprovedAt
                    ? ` · ${formatDate(req.managerApprovedAt)}`
                    : ""}
                </p>
              )}

              {rejectingId === req.id ? (
                <div className="mt-3 flex flex-col gap-2">
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Reason for rejection (required)"
                    className="w-full text-[12px] border border-[#E0E0E0] rounded-md px-3 py-2 resize-none h-16 focus:outline-none focus:border-[#7B68EE]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectNote("");
                      }}
                      className="text-[11px] font-medium text-[#1A1A1A] bg-white border border-[#D8D8D8] rounded-md py-2 hover:bg-[#F8F9FC]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        leaveMutation.mutate({
                          leaveId: req.id,
                          status: "REJECTED",
                          declineNote: rejectNote,
                        })
                      }
                      disabled={!rejectNote.trim() || leaveMutation.isPending}
                      className="text-[11px] font-medium text-white bg-[#E24B4A] rounded-md py-2 hover:bg-[#C0382B] disabled:opacity-50"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingId(req.id)}
                    disabled={leaveMutation.isPending}
                    className="text-[11px] font-medium text-[#1A1A1A] bg-white border border-[#D8D8D8] rounded-md py-2 hover:bg-[#F8F9FC] disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      leaveMutation.mutate({ leaveId: req.id, status: "APPROVED" })
                    }
                    disabled={leaveMutation.isPending}
                    className="text-[11px] font-medium text-white bg-[#7B68EE] rounded-md py-2 hover:bg-[#6A5ACD] disabled:opacity-50"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
