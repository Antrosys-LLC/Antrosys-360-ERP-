import { LeaveType, LeaveRequestStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../config/database";
import { DEFAULT_LEAVE_QUOTA } from "../../../shared/leaveBalance/leave-quota.constants";
import { incrementLeaveBalanceOnApproval } from "../../../shared/leaveBalance/increment-leave-balance";
import { notifyUsersByRoles } from "../../../shared/notifications/notify-by-role";
import { requiresOpsHeadApproval as checkOpsHeadRequired } from "../../../shared/leaveBalance/requires-ops-head-approval";
import type {
  CreateLeaveRequestBody,
  UpdateLeaveStatusBody,
  ListLeaveRequestsQuery,
} from "./leave.schema";

// ─── Helpers ──────────────────────────────────────────────────────────────

function countBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  while (cur <= last) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function countCalendarDays(start: Date, end: Date): number {
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

async function getEmployee(userId: string) {
  return prisma.employee.findFirst({ where: { userId } });
}

async function getLeaveBalance(
  employeeId: string,
  leaveType: LeaveType,
  year: number,
  month: number,
) {
  return prisma.leaveBalance.findUnique({
    where: {
      employeeId_leaveType_year_month: { employeeId, leaveType, year, month },
    },
  });
}

async function upsertLeaveBalance(
  employeeId: string,
  leaveType: LeaveType,
  year: number,
  month: number,
) {
  return prisma.leaveBalance.upsert({
    where: {
      employeeId_leaveType_year_month: { employeeId, leaveType, year, month },
    },
    update: {},
    create: {
      employeeId,
      year,
      month,
      leaveType,
      allocatedDays: DEFAULT_LEAVE_QUOTA[leaveType],
      usedDays: 0,
      pendingDays: 0,
    },
  });
}

// ─── Leave Balances (monthly, resets 1st of each month) ────────────────────
export async function getMyLeaveBalances(userId: string) {
  const employee = await getEmployee(userId);
  if (!employee) return [];

  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const types: LeaveType[] = [
    "ANNUAL",
    "SICK",
    "CASUAL",
    "WFH",
    "UNPAID",
    "OTHER",
  ];

  // Upsert ensures balances exist on first access
  const upserts = types.map((type) =>
    upsertLeaveBalance(employee.id, type, year, month),
  );
  const balances = await Promise.all(upserts);

  return balances.map((b) => {
    const totalDays = Number(b.allocatedDays);
    const takenDays = Number(b.usedDays);
    return {
      type: b.leaveType,
      totalDays,
      takenDays,
      remainingDays: Math.max(0, totalDays - takenDays),
    };
  });
}

// ─── Leave Requests ────────────────────────────────────────────────────────

export async function getLeaveRequests(
  query: ListLeaveRequestsQuery,
  userId: string,
) {
  const { status, type, employeeId: filterEmployeeId, page, limit } = query;
  const skip = (page - 1) * limit;

  const requestingEmployee = await getEmployee(userId);

  const where: Prisma.LeaveRequestWhereInput = {
    ...(status && { status }),
    ...(type && { type }),
    ...(filterEmployeeId
      ? { employeeId: filterEmployeeId }
      : requestingEmployee
        ? { employeeId: requestingEmployee.id }
        : { employeeId: "NONE" }),
  };

  const [items, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return { items, total, page, limit };
}

// ─── Submit Leave Request ─────────────────────────────────────────────────

export async function createLeaveRequest(
  body: CreateLeaveRequestBody,
  userId: string,
) {
  const employee = await getEmployee(userId);
  if (!employee) throw new Error("NO_EMPLOYEE_RECORD");

  const isUnlimitedType = body.type === 'UNPAID' || body.type === 'OTHER';
  const durationDays = isUnlimitedType
    ? countCalendarDays(body.startDate, body.endDate)
    : countBusinessDays(body.startDate, body.endDate);
  const year = body.startDate.getFullYear();
  const month = body.startDate.getMonth() + 1;

  const needsOpsHead = await checkOpsHeadRequired(
    prisma,
    employee.id,
    body.type,
    durationDays,
    year,
    month,
  );

  // Check for team conflicts (any PENDING or APPROVED overlapping requests in same dept)
  // Check team conflicts
  const teamConflictCount = employee.department
    ? await prisma.leaveRequest.count({
        where: {
          status: { in: ["PENDING", "APPROVED"] },
          employee: {
            department: employee.department,
            id: { not: employee.id },
          },
          startDate: { lte: body.endDate },
          endDate: { gte: body.startDate },
        },
      })
    : 0;

  // Check balance for threshold-bound types (ANNUAL, SICK, CASUAL, WFH)
  // UNPAID and OTHER skip the threshold check entirely
  const noThresholdTypes: LeaveType[] = ["UNPAID", "OTHER"];
  const skipThreshold = noThresholdTypes.includes(body.type as LeaveType);

  if (!skipThreshold) {
    const balance = await getLeaveBalance(
      employee.id,
      body.type as LeaveType,
      year,
      month,
    );
    const balanceRecord =
      balance ||
      (await upsertLeaveBalance(
        employee.id,
        body.type as LeaveType,
        year,
        month,
      ));
    const remainingDays =
      Number(balanceRecord.allocatedDays) - Number(balanceRecord.usedDays);

    if (durationDays > remainingDays) {
      throw new Error(
        `INSUFFICIENT_BALANCE:Insufficient ${body.type} leave balance. You have ${Math.max(0, remainingDays)} day(s) remaining but requested ${durationDays} day(s).`,
      );
    }
  }

  const leaveRequest = await prisma.$transaction(async (tx) => {
    const request = await tx.leaveRequest.create({
      data: {
        employeeId: employee.id,
        type: body.type,
        startDate: body.startDate,
        endDate: body.endDate,
        durationDays,
        status: "PENDING",
        reason: body.reason,
        requiresOpsHeadApproval: needsOpsHead,
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "CREATE_LEAVE_REQUEST",
        metadata: {
          leaveId: request.id,
          type: body.type,
          startDate: body.startDate.toISOString(),
          endDate: body.endDate.toISOString(),
          durationDays,
        },
      },
    });

    return request;
  });

  return { leaveRequest, teamConflictCount };
}

// ─── Manager Approval: Approve / Reject ───────────────────────────────────

export async function updateLeaveStatus(
  leaveId: string,
  body: UpdateLeaveStatusBody,
  approverId: string,
) {
  const approverEmployee = await getEmployee(approverId);
  if (!approverEmployee) throw new Error("APPROVER_NO_EMPLOYEE_RECORD");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { employee: true },
    });
    if (!existing) return null;
    if (existing.status !== "PENDING") throw new Error("LEAVE_NOT_PENDING");

    const isFinalApproval =
      body.status === "APPROVED" && !existing.requiresOpsHeadApproval;
    const nextStatus: LeaveRequestStatus =
      body.status === "APPROVED" && existing.requiresOpsHeadApproval
        ? "PENDING_OPS_HEAD"
        : (body.status as LeaveRequestStatus);

    const updated = await tx.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: nextStatus,
        approvedById: isFinalApproval ? approverEmployee.id : null,
        managerApprovedById:
          body.status === "APPROVED" && existing.requiresOpsHeadApproval
            ? approverEmployee.id
            : undefined,
        managerApprovedAt:
          body.status === "APPROVED" && existing.requiresOpsHeadApproval
            ? new Date()
            : undefined,
        declineNote: body.declineNote,
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (isFinalApproval) {
      await incrementLeaveBalanceOnApproval(tx, {
        employeeId: existing.employeeId,
        leaveType: existing.type,
        startDate: existing.startDate,
        durationDays: existing.durationDays,
      });
    }

    if (nextStatus === "PENDING_OPS_HEAD") {
      await notifyUsersByRoles(
        tx,
        ["OPERATIONS_HEAD"],
        "Leave Pending Operations Review",
        `${existing.employee.firstName} ${existing.employee.lastName}'s ${existing.type} leave (${existing.durationDays} day(s)) requires your approval.`,
      );
    }

    await tx.auditLog.create({
      data: {
        userId: approverId,
        action:
          nextStatus === "PENDING_OPS_HEAD"
            ? "MANAGER_ESCALATE_LEAVE_TO_OPS_HEAD"
            : body.status === "APPROVED"
              ? "APPROVE_LEAVE_REQUEST"
              : "REJECT_LEAVE_REQUEST",
        metadata: {
          leaveId,
          employeeId: existing.employeeId,
          type: existing.type,
          durationDays: existing.durationDays,
          declineNote: body.declineNote,
        },
      },
    });

    return updated;
  });
}

// ─── Cancel Own Request ───────────────────────────────────────────────────

export async function cancelLeaveRequest(leaveId: string, userId: string) {
  const employee = await getEmployee(userId);
  if (!employee) throw new Error("NO_EMPLOYEE_RECORD");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.leaveRequest.findUnique({
      where: { id: leaveId },
    });
    if (!existing) return null;
    if (existing.employeeId !== employee.id) throw new Error("FORBIDDEN");
    if (existing.status !== "PENDING") throw new Error("LEAVE_NOT_PENDING");

    const cancelled = await tx.leaveRequest.update({
      where: { id: leaveId },
      data: { status: "CANCELLED" },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "CANCEL_LEAVE_REQUEST",
        metadata: { leaveId, type: existing.type },
      },
    });

    return cancelled;
  });
}

// ─── Manager: Pending Approvals Queue ────────────────────────────────────

export async function getPendingApprovals(userId: string) {
  const manager = await prisma.employee.findFirst({
    where: { userId },
    include: { reports: { select: { id: true } } },
  });

  if (!manager) return [];

  const subordinateIds = manager.reports.map((r) => r.id);

  const where: Prisma.LeaveRequestWhereInput =
    subordinateIds.length > 0
      ? { status: "PENDING", employeeId: { in: subordinateIds } }
      : { status: "PENDING" };

  return prisma.leaveRequest.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          designation: true,
          department: true,
        },
      },
    },
  });
}

// ─── Team Schedule Metrics ────────────────────────────────────────────────

export async function getLeaveMetrics(userId: string) {
  const employee = await getEmployee(userId);
  const year = new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pendingCount, totalTakenThisYear, onLeaveToday] = await Promise.all([
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    employee
      ? prisma.leaveRequest.findMany({
          where: {
            employeeId: employee.id,
            status: "APPROVED",
            startDate: { gte: new Date(`${year}-01-01`) },
          },
          select: { durationDays: true },
        })
      : Promise.resolve([]),
    prisma.leaveRequest.count({
      where: {
        status: "APPROVED",
        startDate: { lte: today },
        endDate: { gte: today },
      },
    }),
  ]);

  const totalTakenDays = Array.isArray(totalTakenThisYear)
    ? (totalTakenThisYear as { durationDays: number }[]).reduce(
        (sum, r) => sum + r.durationDays,
        0,
      )
    : 0;

  const workingDaysThisYear = 261;
  const attendancePct =
    totalTakenDays > 0
      ? Math.round(
          ((workingDaysThisYear - totalTakenDays) / workingDaysThisYear) * 100,
        )
      : 100;

  return {
    pending: pendingCount,
    totalTaken: totalTakenDays,
    attendance: `${Math.min(attendancePct, 100)}%`,
    onLeaveToday,
  };
}
