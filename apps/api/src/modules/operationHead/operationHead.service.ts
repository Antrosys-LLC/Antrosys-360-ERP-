import {
  AttendanceStatus,
  Department,
  LeaveRequestStatus,
  LeaveType,
  Prisma,
} from '@prisma/client';
import { prisma } from '../../config/database';
import { incrementLeaveBalanceOnApproval } from '../../shared/leaveBalance/increment-leave-balance';
import { notifyUsersByRoles } from '../../shared/notifications/notify-by-role';
import type {
  DashboardQuery,
  DeptFilter,
  FlagAttendanceBody,
  ListOpsLeavesQuery,
  OverrideAttendanceBody,
  RaiseManpowerRequestBody,
  UpdateLeaveStatusBody,
} from './operationHead.schema';

const DEPT_FILTER_KEYWORDS: Record<Exclude<DeptFilter, 'All'>, { departments: Department[]; designationKeywords: string[] }> = {
  Eng: { departments: ['ENGINEERING'], designationKeywords: ['engineer', 'developer', 'designer', 'architect'] },
  Ops: { departments: ['OPERATIONS'], designationKeywords: ['operations', 'ops'] },
  Fin: { departments: ['FINANCE'], designationKeywords: ['finance', 'accountant', 'financial'] },
  HR: { departments: ['HR'], designationKeywords: ['hr', 'human resource', 'recruiter'] },
};

function getTodayUtc(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

function getWeekStartUtc(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function formatCheckInTime(checkIn: Date | null): string {
  if (!checkIn) return '--:--';
  return checkIn.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function mapAttendanceUiStatus(status: AttendanceStatus): 'Present' | 'Late' | 'Absent' {
  if (status === AttendanceStatus.PRESENT || status === AttendanceStatus.HALF_DAY) return 'Present';
  if (status === AttendanceStatus.LATE) return 'Late';
  return 'Absent';
}

function mapDotStatus(status: AttendanceStatus): 'present' | 'late' | 'absent' {
  if (status === AttendanceStatus.PRESENT || status === AttendanceStatus.HALF_DAY) return 'present';
  if (status === AttendanceStatus.LATE) return 'late';
  return 'absent';
}

function matchesDepartmentFilter(
  department: Department | null,
  designation: string | null,
  filter: DeptFilter,
): boolean {
  if (filter === 'All') return true;
  const config = DEPT_FILTER_KEYWORDS[filter];
  if (department && config.departments.includes(department)) return true;
  if (department === 'OTHER' && designation) {
    const lower = designation.toLowerCase();
    return config.designationKeywords.some((kw) => lower.includes(kw));
  }
  if (designation) {
    const lower = designation.toLowerCase();
    return config.designationKeywords.some((kw) => lower.includes(kw));
  }
  return false;
}

function buildEmployeeWhere(filter: DeptFilter): Prisma.EmployeeWhereInput {
  if (filter === 'All') {
    return { isActive: true, employmentStatus: 'ACTIVE' };
  }

  const config = DEPT_FILTER_KEYWORDS[filter];
  return {
    isActive: true,
    employmentStatus: 'ACTIVE',
    OR: [
      { department: { in: config.departments } },
      {
        department: 'OTHER',
        OR: config.designationKeywords.map((kw) => ({
          designation: { contains: kw, mode: 'insensitive' as const },
        })),
      },
      ...config.designationKeywords.map((kw) => ({
        designation: { contains: kw, mode: 'insensitive' as const },
      })),
    ],
  };
}

function mapOverrideStatus(status: string): AttendanceStatus {
  if (status === 'ON LEAVE') return AttendanceStatus.LEAVE;
  if (status === 'PRESENT') return AttendanceStatus.PRESENT;
  if (status === 'ABSENT') return AttendanceStatus.ABSENT;
  if (status === 'LATE') return AttendanceStatus.LATE;
  return AttendanceStatus.ABSENT;
}

function leaveTypeLabel(type: LeaveType): string {
  const labels: Record<LeaveType, string> = {
    ANNUAL: 'Annual',
    SICK: 'Sick',
    CASUAL: 'Casual',
    MATERNITY: 'Maternity',
    OTHER: 'Other',
    WFH: 'WFH',
    UNPAID: 'Unpaid',
  };
  return labels[type] ?? type;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0) || ''}`.toUpperCase();
}

async function computeManpowerGaps() {
  const [plans, headcounts] = await Promise.all([
    prisma.departmentHeadcountPlan.findMany(),
    prisma.employee.groupBy({
      by: ['department'],
      where: { isActive: true, employmentStatus: 'ACTIVE' },
      _count: { id: true },
    }),
  ]);

  const countByDept = new Map<Department, number>();
  for (const row of headcounts) {
    if (row.department) countByDept.set(row.department, row._count.id);
  }

  const gaps: { dept: string; level: 'Critical' | 'Standard'; count: number; department: Department }[] = [];

  for (const plan of plans) {
    const active = countByDept.get(plan.department) ?? 0;
    const gap = plan.targetHeadcount - active;
    if (gap <= 0) continue;

    const level = gap >= plan.criticalGapThreshold ? 'Critical' : 'Standard';

    gaps.push({
      dept: plan.department.charAt(0) + plan.department.slice(1).toLowerCase(),
      level,
      count: gap,
      department: plan.department,
    });
  }

  const criticalDepts = gaps.filter((g) => g.level === 'Critical');
  const standardDepts = gaps.filter((g) => g.level === 'Standard');

  return {
    total: gaps.length,
    criticalCount: criticalDepts.length,
    standardCount: standardDepts.length,
    items: gaps,
    summaryItems: [
      ...(criticalDepts.length > 0
        ? [{ label: `${criticalDepts.length} Critical roles`, tone: 'danger' as const }]
        : []),
      ...(standardDepts.length > 0
        ? [{ label: `${standardDepts.length} Standard role`, tone: 'neutral' as const }]
        : []),
    ],
    detail: gaps.map(({ dept, level, count }) => ({ dept, level, count })),
  };
}

async function computeRosterCoverage() {
  const today = getTodayUtc();
  const weekStart = getWeekStartUtc(today);
  const weekDays: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(weekStart);
    d.setUTCDate(weekStart.getUTCDate() + i);
    weekDays.push(d);
  }

  const dayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr'];
  const coverages = await prisma.rosterDayCoverage.findMany({
    where: {
      date: { in: weekDays },
      department: null,
    },
  });

  const coverageByDate = new Map(coverages.map((c) => [c.date.toISOString().slice(0, 10), c]));
  const dayResults = weekDays.map((date, idx) => {
    const key = date.toISOString().slice(0, 10);
    const row = coverageByDate.get(key);
    const pct = row && row.requiredStaff > 0
      ? Math.round((row.assignedStaff / row.requiredStaff) * 100)
      : 100;
    return { day: dayLabels[idx], coveragePct: pct };
  });

  const overall =
    dayResults.length > 0
      ? Math.round(dayResults.reduce((sum, d) => sum + d.coveragePct, 0) / dayResults.length)
      : 100;

  return { value: `${overall}%`, days: dayResults };
}

export async function getDashboard(query: DashboardQuery) {
  const today = getTodayUtc();
  const employeeWhere = buildEmployeeWhere(query.department);

  const [employees, attendancesToday, opsPendingLeaves, opsLeaveQueue, recentManpowerRequests] = await Promise.all([
    prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        department: true,
        designation: true,
      },
      orderBy: { firstName: 'asc' },
    }),
    prisma.attendance.findMany({
      where: { date: today, employee: employeeWhere },
    }),
    prisma.leaveRequest.findMany({
      where: { status: 'PENDING_OPS_HEAD' },
      select: { type: true },
    }),
    prisma.leaveRequest.findMany({
      where: { status: 'PENDING_OPS_HEAD' },
      orderBy: { createdAt: 'asc' },
      take: 5,
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.manpowerRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        requestedBy: { select: { email: true } },
      },
    }),
  ]);

  const attendanceMap = new Map(attendancesToday.map((a) => [a.employeeId, a]));
  const total = employees.length;
  let present = 0;
  let absent = 0;
  let late = 0;

  for (const emp of employees) {
    const att = attendanceMap.get(emp.id);
    if (!att || att.status === AttendanceStatus.ABSENT) absent++;
    else if (att.status === AttendanceStatus.LATE) late++;
    else if (att.status === AttendanceStatus.PRESENT || att.status === AttendanceStatus.HALF_DAY) present++;
    else if (att.status === AttendanceStatus.LEAVE) absent++;
    else absent++;
  }

  const attendanceRatePct = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  const leaveTypeCounts: Record<string, number> = { Annual: 0, Sick: 0, Casual: 0, Other: 0 };
  for (const leave of opsPendingLeaves) {
    const label = leaveTypeLabel(leave.type);
    if (label in leaveTypeCounts) leaveTypeCounts[label]++;
    else leaveTypeCounts.Other++;
  }

  const attendanceDots = employees.slice(0, 20).map((emp) => {
    const att = attendanceMap.get(emp.id);
    return mapDotStatus(att?.status ?? AttendanceStatus.ABSENT);
  });

  const todayAttendanceRows = employees.slice(0, 20).map((emp) => {
    const att = attendanceMap.get(emp.id);
    const deptLabel = emp.department
      ? emp.department.charAt(0) + emp.department.slice(1).toLowerCase()
      : emp.designation ?? 'Other';
    return {
      employeeId: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      dept: deptLabel,
      checkIn: formatCheckInTime(att?.checkIn ?? null),
      status: mapAttendanceUiStatus(att?.status ?? AttendanceStatus.ABSENT),
      isFlagged: att?.isFlagged ?? false,
    };
  });

  const [manpowerGaps, rosterCoverage] = await Promise.all([
    computeManpowerGaps(),
    computeRosterCoverage(),
  ]);

  const now = new Date();
  const subtitle = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return {
    pageHeader: {
      title: 'Operations Overview',
      subtitle,
      liveLabel: 'Live data',
    },
    attendanceRate: {
      label: 'Attendance rate',
      value: `${attendanceRatePct}%`,
      progressPct: attendanceRatePct,
      breakdown: [
        { label: 'Present', count: present, color: '#7B68EE' },
        { label: 'Absent', count: absent, color: '#E24B4A' },
        { label: 'Late', count: late, color: '#F2B90C' },
      ],
    },
    pendingLeave: {
      label: 'Pending leave',
      value: opsPendingLeaves.length,
      valueColor: '#C2840A',
      types: [
        { label: 'Annual', count: leaveTypeCounts.Annual },
        { label: 'Sick', count: leaveTypeCounts.Sick },
        { label: 'Casual', count: leaveTypeCounts.Casual },
      ],
      ctaLabel: 'Review all →',
    },
    manpowerGapsSummary: {
      label: 'Manpower gaps',
      value: manpowerGaps.total,
      valueColor: '#A32D2D',
      items: manpowerGaps.summaryItems.length > 0
        ? manpowerGaps.summaryItems
        : [{ label: 'No open gaps', tone: 'neutral' as const }],
    },
    rosterCoverage: {
      label: 'Roster coverage',
      value: rosterCoverage.value,
      days: rosterCoverage.days,
    },
    attendanceDots,
    todayAttendanceRows,
    leaveApprovals: opsLeaveQueue.map((req) => ({
      id: req.id,
      initials: getInitials(req.employee.firstName, req.employee.lastName),
      name: `${req.employee.firstName} ${req.employee.lastName}`,
      type: leaveTypeLabel(req.type),
      days: req.durationDays,
      reason: req.reason,
    })),
    manpowerGapsDetail: manpowerGaps.detail,
    pendingOpsHeadCount: opsPendingLeaves.length,
    recentManpowerRequests: recentManpowerRequests.map((req) => ({
      id: req.id,
      department: req.department.charAt(0) + req.department.slice(1).toLowerCase(),
      headcount: req.additionalHeadcount,
      status: req.status,
      notes: req.notes,
      createdAt: req.createdAt.toISOString(),
    })),
  };
}

export async function listOpsHeadLeaves(query: ListOpsLeavesQuery) {
  const { status, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.LeaveRequestWhereInput = {
    requiresOpsHeadApproval: true,
    ...(status ? { status: status as LeaveRequestStatus } : { status: 'PENDING_OPS_HEAD' }),
  };

  const [items, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            designation: true,
            department: true,
          },
        },
        managerApprovedBy: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return {
    items: items.map((req) => ({
      id: req.id,
      employeeId: req.employeeId,
      employee: req.employee,
      type: req.type,
      startDate: req.startDate.toISOString(),
      endDate: req.endDate.toISOString(),
      durationDays: req.durationDays,
      status: req.status,
      reason: req.reason,
      declineNote: req.declineNote,
      requiresOpsHeadApproval: req.requiresOpsHeadApproval,
      managerApprovedBy: req.managerApprovedBy,
      managerApprovedAt: req.managerApprovedAt?.toISOString() ?? null,
      createdAt: req.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
  };
}

export async function updateOpsHeadLeaveStatus(
  leaveId: string,
  body: UpdateLeaveStatusBody,
  userId: string,
) {
  const opsHead = await prisma.employee.findFirst({ where: { userId } });
  if (!opsHead) throw new Error('NO_EMPLOYEE_RECORD');

  return prisma.$transaction(async (tx) => {
    const existing = await tx.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { employee: true },
    });

    if (!existing) return null;
    if (existing.status !== 'PENDING_OPS_HEAD') throw new Error('LEAVE_NOT_PENDING_OPS_HEAD');
    if (!existing.requiresOpsHeadApproval) throw new Error('NOT_OPS_HEAD_LEAVE');

    const newStatus = body.status as LeaveRequestStatus;

    const updated = await tx.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: newStatus,
        approvedById: newStatus === 'APPROVED' ? opsHead.id : null,
        declineNote: body.declineNote,
      },
      include: {
        employee: { select: { firstName: true, lastName: true, userId: true } },
      },
    });

    if (newStatus === 'APPROVED') {
      await incrementLeaveBalanceOnApproval(tx, {
        employeeId: existing.employeeId,
        leaveType: existing.type,
        startDate: existing.startDate,
        durationDays: existing.durationDays,
      });

      await tx.notification.create({
        data: {
          userId: existing.employee.userId,
          title: 'Leave Approved',
          message: `Your ${leaveTypeLabel(existing.type)} leave request has been approved by Operations.`,
        },
      });
    } else {
      await tx.notification.create({
        data: {
          userId: existing.employee.userId,
          title: 'Leave Rejected',
          message: `Your ${leaveTypeLabel(existing.type)} leave request was rejected by Operations.${body.declineNote ? ` Reason: ${body.declineNote}` : ''}`,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId,
        action: newStatus === 'APPROVED' ? 'OPS_HEAD_APPROVE_LEAVE' : 'OPS_HEAD_REJECT_LEAVE',
        metadata: {
          leaveId,
          employeeId: existing.employeeId,
          type: existing.type,
          declineNote: body.declineNote,
        },
      },
    });

    return updated;
  });
}

export async function toggleAttendanceFlag(
  employeeId: string,
  body: FlagAttendanceBody,
  userId: string,
) {
  const today = getTodayUtc();
  const target = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!target) throw new Error('EMPLOYEE_NOT_FOUND');

  return prisma.$transaction(async (tx) => {
    const existing = await tx.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    const result = existing
      ? await tx.attendance.update({
          where: { id: existing.id },
          data: { isFlagged: body.isFlagged },
        })
      : await tx.attendance.create({
          data: {
            employeeId,
            date: today,
            status: 'ABSENT',
            isFlagged: body.isFlagged,
          },
        });

    if (body.isFlagged) {
      await tx.notification.create({
        data: {
          userId: target.userId,
          title: 'Flagged Check-in',
          message: 'Your attendance check-in for today has been flagged by Operations.',
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId,
        action: body.isFlagged ? 'OPS_HEAD_ATTENDANCE_FLAG' : 'OPS_HEAD_ATTENDANCE_UNFLAG',
        metadata: { employeeId },
      },
    });

    return result;
  });
}

export async function overrideAttendanceStatus(
  employeeId: string,
  body: OverrideAttendanceBody,
  userId: string,
) {
  const today = getTodayUtc();
  const target = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!target) throw new Error('EMPLOYEE_NOT_FOUND');

  const attendanceStatus = mapOverrideStatus(body.status);
  const checkInTime =
    attendanceStatus === AttendanceStatus.PRESENT || attendanceStatus === AttendanceStatus.LATE
      ? new Date()
      : null;
  const workingHours =
    attendanceStatus === AttendanceStatus.PRESENT
      ? 8.0
      : attendanceStatus === AttendanceStatus.LATE
        ? 6.5
        : 0;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    const result = existing
      ? await tx.attendance.update({
          where: { id: existing.id },
          data: {
            status: attendanceStatus,
            checkIn: checkInTime,
            hours: workingHours,
          },
        })
      : await tx.attendance.create({
          data: {
            employeeId,
            date: today,
            status: attendanceStatus,
            checkIn: checkInTime,
            hours: workingHours,
          },
        });

    await tx.notification.create({
      data: {
        userId: target.userId,
        title: 'Attendance Status Updated',
        message: `Your attendance status for today was updated to ${body.status} by Operations.`,
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'OPS_HEAD_ATTENDANCE_OVERRIDE',
        metadata: {
          employeeId,
          originalStatus: existing?.status ?? 'NONE',
          newStatus: body.status,
        },
      },
    });

    return result;
  });
}

export async function raiseManpowerRequest(body: RaiseManpowerRequestBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.manpowerRequest.create({
      data: {
        department: body.department,
        additionalHeadcount: body.additionalHeadcount,
        notes: body.notes,
        requestedByUserId: userId,
      },
    });

    await notifyUsersByRoles(
      tx,
      ['HR_HEAD'],
      'New Manpower Request',
      `${body.additionalHeadcount} headcount requested for ${body.department.replace('_', ' ')}${body.notes ? `: ${body.notes}` : ''}`,
    );

    await tx.auditLog.create({
      data: {
        userId,
        action: 'OPS_HEAD_RAISE_MANPOWER_REQUEST',
        metadata: {
          requestId: request.id,
          department: body.department,
          additionalHeadcount: body.additionalHeadcount,
          notes: body.notes,
        },
      },
    });

    return request;
  });
}

export { matchesDepartmentFilter };
