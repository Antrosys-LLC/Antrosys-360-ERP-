import { LeaveType, LeaveRequestStatus, Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import type {
  CreateLeaveRequestBody,
  UpdateLeaveStatusBody,
  ListLeaveRequestsQuery,
} from './leave.schema';

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Business-day count (Mon–Fri) between two dates inclusive. */
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

/** Quota per leave type (days/year). Adjust as per HR policy. */
const DEFAULT_QUOTA: Record<LeaveType, number> = {
  ANNUAL: 20,
  SICK: 10,
  CASUAL: 6,
  WFH: 20,
  UNPAID: 0,
  MATERNITY: 90,
  OTHER: 0,
};

// ─── Leave Balances ────────────────────────────────────────────────────────

/**
 * Fetch (or lazily create) all five leave balances for the current year.
 * Returns an ordered array matching the UI card layout.
 */
export async function getMyLeaveBalances(userId: string) {
  const employee = await prisma.employee.findFirst({ where: { userId } });
  if (!employee) return null;

  const year = new Date().getFullYear();
  const types: LeaveType[] = ['ANNUAL', 'SICK', 'CASUAL', 'WFH', 'UNPAID'];

  // Upsert ensures balances exist on first access
  const upserts = types.map((type) =>
    prisma.leaveBalance.upsert({
      where: { employeeId_leaveType_year: { employeeId: employee.id, leaveType: type, year } },
      update: {},
      create: {
        employeeId: employee.id,
        year,
        leaveType: type,
        allocatedDays: DEFAULT_QUOTA[type],
        usedDays: 0,
        pendingDays: 0,
      },
    }),
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

/**
 * List leave requests.
 * - Employees see only their own.
 * - Roles with leave:write see their subordinates' requests.
 *   (The controller passes a pre-resolved employeeId filter when manager-scoped.)
 */
export async function getLeaveRequests(query: ListLeaveRequestsQuery, userId: string) {
  const { status, type, employeeId: filterEmployeeId, page, limit } = query;
  const skip = (page - 1) * limit;

  // Resolve the requesting user's employee record
  const requestingEmployee = await prisma.employee.findFirst({ where: { userId } });

  const where: Prisma.LeaveRequestWhereInput = {
    ...(status && { status }),
    ...(type && { type }),
    ...(filterEmployeeId
      ? { employeeId: filterEmployeeId }
      : requestingEmployee
        ? { employeeId: requestingEmployee.id }
        : { employeeId: 'NONE' }),
  };

  const [items, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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

export async function createLeaveRequest(body: CreateLeaveRequestBody, userId: string) {
  const employee = await prisma.employee.findFirst({ where: { userId } });
  if (!employee) throw new Error('NO_EMPLOYEE_RECORD');

  const durationDays = countBusinessDays(body.startDate, body.endDate);

  // Check for team conflicts (any PENDING or APPROVED overlapping requests in same dept)
  const teamConflictCount = employee.department
    ? await prisma.leaveRequest.count({
        where: {
          status: { in: ['PENDING', 'APPROVED'] },
          employee: { department: employee.department, id: { not: employee.id } },
          startDate: { lte: body.endDate },
          endDate: { gte: body.startDate },
        },
      })
    : 0;

  const leaveRequest = await prisma.$transaction(async (tx) => {
    const request = await tx.leaveRequest.create({
      data: {
        employeeId: employee.id,
        type: body.type,
        startDate: body.startDate,
        endDate: body.endDate,
        durationDays,
        status: 'PENDING',
        reason: body.reason,
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'CREATE_LEAVE_REQUEST',
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
  const approverEmployee = await prisma.employee.findFirst({ where: { userId: approverId } });
  if (!approverEmployee) throw new Error('APPROVER_NO_EMPLOYEE_RECORD');

  return prisma.$transaction(async (tx) => {
    const existing = await tx.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { employee: true },
    });
    if (!existing) return null;
    if (existing.status !== 'PENDING') throw new Error('LEAVE_NOT_PENDING');

    const updated = await tx.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: body.status as LeaveRequestStatus,
        approvedById: approverEmployee.id,
        declineNote: body.declineNote,
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
      },
    });

    // Deduct from balance only on APPROVED
    if (body.status === 'APPROVED') {
      const year = existing.startDate.getFullYear();
      await tx.leaveBalance.upsert({
        where: {
          employeeId_leaveType_year: {
            employeeId: existing.employeeId,
            leaveType: existing.type,
            year,
          },
        },
        update: {
          usedDays: { increment: existing.durationDays },
        },
        create: {
          employeeId: existing.employeeId,
          year,
          leaveType: existing.type,
          allocatedDays: DEFAULT_QUOTA[existing.type],
          usedDays: existing.durationDays,
          pendingDays: 0,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: approverId,
        action: body.status === 'APPROVED' ? 'APPROVE_LEAVE_REQUEST' : 'REJECT_LEAVE_REQUEST',
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
  const employee = await prisma.employee.findFirst({ where: { userId } });
  if (!employee) throw new Error('NO_EMPLOYEE_RECORD');

  return prisma.$transaction(async (tx) => {
    const existing = await tx.leaveRequest.findUnique({ where: { id: leaveId } });
    if (!existing) return null;
    if (existing.employeeId !== employee.id) throw new Error('FORBIDDEN');
    if (existing.status !== 'PENDING') throw new Error('LEAVE_NOT_PENDING');

    const cancelled = await tx.leaveRequest.update({
      where: { id: leaveId },
      data: { status: 'CANCELLED' },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'CANCEL_LEAVE_REQUEST',
        metadata: { leaveId, type: existing.type },
      },
    });

    return cancelled;
  });
}

// ─── Manager: Pending Approvals Queue ────────────────────────────────────

/**
 * Returns PENDING leave requests from subordinates of the requesting user.
 * Falls back to ALL pending requests if manager has no direct reports
 * (e.g., CEO / OPERATIONS_HEAD).
 */
export async function getPendingApprovals(userId: string) {
  const manager = await prisma.employee.findFirst({
    where: { userId },
    include: { reports: { select: { id: true } } },
  });

  // If user has no employee record, return empty
  if (!manager) return [];

  const subordinateIds = manager.reports.map((r) => r.id);

  const where: Prisma.LeaveRequestWhereInput =
    subordinateIds.length > 0
      ? { status: 'PENDING', employeeId: { in: subordinateIds } }
      : { status: 'PENDING' }; // wide-open for top-level managers

  return prisma.leaveRequest.findMany({
    where,
    orderBy: { createdAt: 'asc' },
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
  const employee = await prisma.employee.findFirst({ where: { userId } });
  const year = new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pendingCount, totalTakenThisYear, onLeaveToday] = await Promise.all([
    // Total pending requests visible to this user
    prisma.leaveRequest.count({ where: { status: 'PENDING' } }),

    // Total approved leave days for the requesting employee this year
    employee
      ? prisma.leaveRequest.findMany({
          where: {
            employeeId: employee.id,
            status: 'APPROVED',
            startDate: { gte: new Date(`${year}-01-01`) },
          },
          select: { durationDays: true },
        })
      : Promise.resolve([]),

    // Employees with an active APPROVED leave covering today
    prisma.leaveRequest.count({
      where: {
        status: 'APPROVED',
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

  // Attendance rate: approximate from taken/working days
  const workingDaysThisYear = 261; // ~261 working days
  const attendancePct =
    totalTakenDays > 0
      ? Math.round(((workingDaysThisYear - totalTakenDays) / workingDaysThisYear) * 100)
      : 100;

  return {
    pending: pendingCount,
    totalTaken: totalTakenDays,
    attendance: `${Math.min(attendancePct, 100)}%`,
    onLeaveToday,
  };
}
