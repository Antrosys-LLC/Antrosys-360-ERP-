import { Prisma, AttendanceStatus, LeaveType, LeaveRequestStatus, Role } from '@prisma/client';
import { prisma } from '../../../config/database';
import { DEFAULT_LEAVE_QUOTA } from '../../../shared/leaveBalance/leave-quota.constants';
import { formatCurrency } from '../../../shared/currency/exchange-rate';
import { buildPayslipPdf } from '../../../shared/pdf/payslip-pdf';
import { payslipPeriodLabel } from '../../../shared/payslip/payslip-period-label';
import {
  buildAttendanceCalendarWeeks,
  type AttendanceDayRecord,
} from '../../../shared/attendance/attendance-calendar';
import {
  formatAttendanceHours,
  formatAttendanceOvertime,
  formatAttendanceTime,
  startOfUtcDay,
} from '../../../shared/attendance/attendance-format';
import { markMissingAttendanceAsAbsent } from '../../../shared/attendance/mark-absences';
import type { CalendarQuery, CheckInBody, SubmitMoodBody, AnnouncementBody, TeamHolidayBody } from './employee_dashboard.schema';

async function leaveDayNumbersForMonth(
  employeeId: string,
  month: number,
  year: number,
): Promise<Set<number>> {
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      status: LeaveRequestStatus.APPROVED,
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
    },
    select: { startDate: true, endDate: true },
  });

  const days = new Set<number>();
  for (const leave of leaves) {
    const start = startOfUtcDay(leave.startDate);
    const end = startOfUtcDay(leave.endDate);
    for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      if (
        cursor.getUTCFullYear() === year &&
        cursor.getUTCMonth() + 1 === month
      ) {
        days.add(cursor.getUTCDate());
      }
    }
  }
  return days;
}

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: 'Annual',
  SICK: 'Sick',
  CASUAL: 'Casual',
  WFH: 'Work From Home',
  UNPAID: 'Unpaid',
  MATERNITY: 'Maternity',
  OTHER: 'Other',
};

const LEAVE_TYPE_ICONS: Record<LeaveType, { bg: string; iconColor: string }> = {
  ANNUAL: { bg: '#EEEDFE', iconColor: '#534AB7' },
  SICK: { bg: '#EEEDFE', iconColor: '#534AB7' },
  CASUAL: { bg: '#FCEBEB', iconColor: '#A32D2D' },
  WFH: { bg: '#EEEDFE', iconColor: '#534AB7' },
  UNPAID: { bg: '#F8F9FC', iconColor: '#888888' },
  MATERNITY: { bg: '#EEEDFE', iconColor: '#534AB7' },
  OTHER: { bg: '#F8F9FC', iconColor: '#888888' },
};

async function writeAuditLog(
  tx: Prisma.TransactionClient,
  userId: string,
  action: string,
  metadata: Prisma.InputJsonValue,
) {
  await tx.auditLog.create({
    data: { userId, action, metadata },
  });
}

export async function getWorkScheduleConfig() {
  const config = await prisma.workScheduleConfig.findUnique({ where: { id: 'default' } });
  if (config) return config;

  return prisma.workScheduleConfig.create({
    data: { id: 'default' },
  });
}

export async function resolveEmployeeForUser(userId: string) {
  const employee = await prisma.employee.findUnique({
    where: { userId },
    include: {
      user: { select: { email: true, role: true } },
    },
  });

  if (!employee) {
    throw new Error('Employee profile not found for this account');
  }

  return employee;
}

function formatTime(date: Date | null | undefined): string {
  if (!date) return '--:--';
  return formatAttendanceTime(date);
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function formatOvertime(hours: number): string {
  if (hours <= 0) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatTenure(joiningDate: Date | null): string {
  if (!joiningDate) return '—';
  const now = new Date();
  const years = now.getFullYear() - joiningDate.getFullYear();
  const months = now.getMonth() - joiningDate.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${Math.max(totalMonths, 1)} mo`;
  const y = Math.floor(totalMonths / 12);
  return `${y} yr${y === 1 ? '' : 's'}`;
}

function greetingForHour(hour: number, firstName: string): string {
  if (hour < 12) return `Good morning, ${firstName}`;
  if (hour < 17) return `Good afternoon, ${firstName}`;
  return `Good evening, ${firstName}`;
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function computeHoursAndOvertime(
  checkIn: Date,
  checkOut: Date,
  standardHours: number,
  overtimeEnabled: boolean,
): { hours: number; overtime: number; status: AttendanceStatus } {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const hours = Math.max(0, diffMs / (1000 * 60 * 60));
  const overtime = overtimeEnabled ? Math.max(0, hours - standardHours) : 0;
  return {
    hours: Math.round(hours * 100) / 100,
    overtime: Math.round(overtime * 100) / 100,
    status: AttendanceStatus.PRESENT,
  };
}

async function getTeamMemberIds(managerEmployeeId: string): Promise<string[]> {
  const reports = await prisma.employee.findMany({
    where: { managerId: managerEmployeeId, isActive: true },
    select: { id: true },
  });
  return reports.map((r) => r.id);
}

async function getTeamLeaveBalances(employeeId: string) {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const types: LeaveType[] = ['ANNUAL', 'SICK', 'CASUAL'];

  const balances = await Promise.all(
    types.map(async (leaveType) => {
      const existing = await prisma.leaveBalance.findUnique({
        where: { employeeId_leaveType_year_month: { employeeId, leaveType, year, month } },
      });
      if (existing) return existing;
      return prisma.leaveBalance.create({
        data: {
          employeeId,
          leaveType,
          year,
          month,
          allocatedDays: DEFAULT_LEAVE_QUOTA[leaveType],
          usedDays: 0,
          pendingDays: 0,
        },
      });
    }),
  );

  return balances;
}

function canManageTeamContent(role: Role): boolean {
  return role === 'MANAGER' || role === 'SUB_MANAGER';
}

async function resolveManagedTeam(employeeId: string) {
  return prisma.team.findUnique({ where: { managerId: employeeId } });
}

async function requireTeamManager(userId: string) {
  const employee = await resolveEmployeeForUser(userId);
  if (!canManageTeamContent(employee.user.role)) {
    throw new Error('Unauthorized: Only managers can perform this action');
  }
  const managedTeam = await resolveManagedTeam(employee.id);
  if (!managedTeam) {
    throw new Error('Unauthorized: No team assigned to manage');
  }
  return { employee, managedTeam };
}

export async function getDashboard(userId: string) {
  const employee = await resolveEmployeeForUser(userId);
  const schedule = await getWorkScheduleConfig();
  const today = startOfUtcDay(new Date());
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const canManageTeam = canManageTeamContent(employee.user.role);
  const managedTeam = canManageTeam ? await resolveManagedTeam(employee.id) : null;
  const teamIdForContent = managedTeam?.id ?? employee.teamId;

  const teamSize = (await getTeamMemberIds(employee.id)).length;

  const announcementWhere: Prisma.AnnouncementWhereInput = managedTeam
    ? {
        OR: [
          { author: { teamId: managedTeam.id } },
          { authorId: employee.id },
        ],
      }
    : employee.teamId
      ? { author: { teamId: employee.teamId } }
      : { author: { managerId: employee.id } };

  const holidayWhere: Prisma.CompanyHolidayWhereInput = {
    date: { gte: today },
    ...(teamIdForContent ? { teamId: teamIdForContent } : {}),
  };

  const calendarHolidayWhere: Prisma.CompanyHolidayWhereInput = teamIdForContent
    ? {
        teamId: teamIdForContent,
        OR: [
          {
            date: {
              gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
              lte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)),
            },
          },
          {
            endDate: {
              gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
            },
          },
        ],
      }
    : {
        OR: [
          {
            date: {
              gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
              lte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)),
            },
          },
          {
            endDate: {
              gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
            },
          },
        ],
      };

  const [
    todayAttendance,
    leaveBalances,
    pendingLeave,
    todayMood,
    latestPayslip,
    teamAnnouncements,
    upcomingHolidays,
    holidays,
  ] = await Promise.all([
    prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
    }),
    getTeamLeaveBalances(employee.id),
    prisma.leaveRequest.findFirst({
      where: {
        employeeId: employee.id,
        status: { in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.PENDING_OPS_HEAD] },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.employeeDailyMood.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
    }),
    prisma.employeePayslip.findFirst({
      where: { employeeId: employee.id },
      orderBy: { periodStart: 'desc' },
    }),
    prisma.announcement.findMany({
      where: announcementWhere,
      include: {
        author: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.companyHoliday.findMany({
      where: holidayWhere,
      orderBy: { date: 'asc' },
      take: 5,
    }),
    prisma.companyHoliday.findMany({
      where: calendarHolidayWhere,
    }),
  ]);

  const halfDayThreshold = Number(schedule.halfDayThresholdHours);
  const calendarMonthNum = now.getUTCMonth() + 1;
  const calendarYearNum = now.getUTCFullYear();

  await markMissingAttendanceAsAbsent({ employeeId: employee.id });

  const refreshedMonthAttendance = await prisma.attendance.findMany({
    where: {
      employeeId: employee.id,
      date: {
        gte: new Date(Date.UTC(calendarYearNum, calendarMonthNum - 1, 1)),
        lte: new Date(Date.UTC(calendarYearNum, calendarMonthNum, 0)),
      },
    },
  });

  const attendanceMap = new Map<number, AttendanceDayRecord>(
    refreshedMonthAttendance.map((a) => [new Date(a.date).getUTCDate(), { status: a.status, hours: a.hours }]),
  );
  const leaveDays = await leaveDayNumbersForMonth(employee.id, calendarMonthNum, calendarYearNum);

  const calendarMonth = buildAttendanceCalendarWeeks(
    calendarMonthNum,
    calendarYearNum,
    attendanceMap,
    holidays.map((h) => ({ date: h.date, endDate: h.endDate })),
    halfDayThreshold,
    leaveDays,
  );

  const firstName = employee.preferredName || employee.firstName;
  const initials = `${employee.firstName[0] ?? ''}${employee.lastName[0] ?? ''}`.toUpperCase();
  const hoursWorked = todayAttendance?.hours ? Number(todayAttendance.hours) : 0;
  const overtimeHours = todayAttendance?.overtimeHours ? Number(todayAttendance.overtimeHours) : 0;

  const balanceByType = new Map(leaveBalances.map((b) => [b.leaveType, b]));
  const defaultBalances: LeaveType[] = ['ANNUAL', 'SICK', 'CASUAL'];

  return {
    currentUser: {
      initials,
      name: `${employee.firstName} ${employee.lastName}`,
      title: employee.designation ?? 'Employee',
      greeting: greetingForHour(now.getHours(), firstName),
      subtitle: "Here's what's happening today.",
      tenure: formatTenure(employee.joiningDate),
      teamSize,
      location: employee.location ?? '—',
    },
    canManageTeam,
    attendanceToday: {
      currentTime: formatTime(now),
      location: todayAttendance?.checkInLocation ?? employee.location ?? 'Office',
      checkIn: formatTime(todayAttendance?.checkIn),
      checkOut: formatTime(todayAttendance?.checkOut),
      hours: formatDuration(hoursWorked),
      overtime: formatOvertime(overtimeHours),
      hasCheckedIn: Boolean(todayAttendance?.checkIn),
      hasCheckedOut: Boolean(todayAttendance?.checkOut),
      needsMood: Boolean(todayAttendance?.checkOut && !todayMood),
    },
    leaveBalances: defaultBalances.map((type) => {
      const balance = balanceByType.get(type);
      const allocated = balance ? Number(balance.allocatedDays) : DEFAULT_LEAVE_QUOTA[type];
      const used = balance ? Number(balance.usedDays) : 0;
      const available = Math.max(0, allocated - used);
      const styling = LEAVE_TYPE_ICONS[type];
      return {
        type: LEAVE_TYPE_LABELS[type],
        leaveType: type,
        value: available,
        bg: styling.bg,
        iconColor: styling.iconColor,
      };
    }),
    pendingLeaveRequest: pendingLeave
      ? {
          id: pendingLeave.id,
          title: `${LEAVE_TYPE_LABELS[pendingLeave.type]} Request`,
          dateRange: `${pendingLeave.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${pendingLeave.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${pendingLeave.startDate.toLocaleDateString('en-US', { weekday: 'long' })}`,
          status: pendingLeave.status === LeaveRequestStatus.PENDING_OPS_HEAD ? 'Pending Ops Review' : 'Pending',
        }
      : null,
    latestPayslip: latestPayslip
      ? {
          id: latestPayslip.id,
          label: 'Latest Payslip',
          period: payslipPeriodLabel(new Date(latestPayslip.periodStart)),
          netPayLabel: 'NET PAY',
          netPay: formatCurrency(Number(latestPayslip.netPay), latestPayslip.currencyCode),
          currencyCode: latestPayslip.currencyCode,
          breakdownPct: latestPayslip.netPayRatioPct,
          legend: [
            { label: 'Net', color: '#7B68EE' },
            { label: 'Tax', color: '#E0DCFB' },
            { label: 'Ded.', color: '#F0F0F0' },
          ],
        }
      : null,
    teamAnnouncements: teamAnnouncements.map((ann) => ({
      id: ann.id,
      title: ann.title,
      initials: `${ann.author.firstName[0] ?? ''}${ann.author.lastName[0] ?? ''}`.toUpperCase(),
      name: `${ann.author.firstName} ${ann.author.lastName}`,
      message: ann.content,
      time: relativeTime(ann.createdAt),
      isOwn: ann.authorId === employee.id,
    })),
    calendarMonth,
    upcomingHolidays: upcomingHolidays.map((holiday, idx) => {
      const d = new Date(holiday.date);
      const end = holiday.endDate ? new Date(holiday.endDate) : null;
      const subtitle = end
        ? `${d.toLocaleDateString('en-US', { weekday: 'long' })} - ${end.toLocaleDateString('en-US', { weekday: 'long' })}`
        : d.toLocaleDateString('en-US', { weekday: 'long' });
      return {
        id: holiday.id,
        month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        day: String(d.getUTCDate()).padStart(2, '0'),
        title: holiday.title,
        subtitle,
        highlighted: idx === 0,
        dateIso: d.toISOString().slice(0, 10),
      };
    }),
  };
}

export async function getCalendar(userId: string, query: CalendarQuery) {
  const employee = await resolveEmployeeForUser(userId);
  const schedule = await getWorkScheduleConfig();
  const halfDayThreshold = Number(schedule.halfDayThresholdHours);
  const managedTeam = await resolveManagedTeam(employee.id);
  const teamIdForContent = managedTeam?.id ?? employee.teamId;

  const monthStart = new Date(Date.UTC(query.year, query.month - 1, 1));
  const monthEnd = new Date(Date.UTC(query.year, query.month, 0));

  const holidayWhere: Prisma.CompanyHolidayWhereInput = teamIdForContent
    ? {
        teamId: teamIdForContent,
        OR: [
          { date: { gte: monthStart, lte: monthEnd } },
          { endDate: { gte: monthStart }, date: { lte: monthEnd } },
        ],
      }
    : {
        OR: [
          { date: { gte: monthStart, lte: monthEnd } },
          { endDate: { gte: monthStart }, date: { lte: monthEnd } },
        ],
      };

  await markMissingAttendanceAsAbsent({ employeeId: employee.id });

  const [attendanceRecords, holidays, leaveDays] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.companyHoliday.findMany({ where: holidayWhere }),
    leaveDayNumbersForMonth(employee.id, query.month, query.year),
  ]);

  const attendanceMap = new Map<number, AttendanceDayRecord>(
    attendanceRecords.map((a) => [new Date(a.date).getUTCDate(), { status: a.status, hours: a.hours }]),
  );

  return buildAttendanceCalendarWeeks(
    query.month,
    query.year,
    attendanceMap,
    holidays.map((h) => ({ date: h.date, endDate: h.endDate })),
    halfDayThreshold,
    leaveDays,
  );
}

export async function checkIn(userId: string, body: CheckInBody) {
  const employee = await resolveEmployeeForUser(userId);
  const schedule = await getWorkScheduleConfig();
  const today = startOfUtcDay(new Date());
  const now = new Date();

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
  });

  if (existing?.checkIn) {
    throw new Error('Already checked in for today');
  }

  const lateThreshold = new Date(today);
  lateThreshold.setHours(schedule.lateAfterHour, schedule.lateAfterMinute, 0, 0);
  const status = now > lateThreshold ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
  const location = body.location ?? employee.location ?? 'Office';

  return prisma.$transaction(async (tx) => {
    const record = await tx.attendance.upsert({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
      create: {
        employeeId: employee.id,
        date: today,
        checkIn: now,
        checkInLocation: location,
        status,
        hours: 0,
        overtimeHours: 0,
      },
      update: {
        checkIn: now,
        checkInLocation: location,
        status,
      },
    });

    await writeAuditLog(tx, userId, 'EMPLOYEE_CHECK_IN', {
      employeeId: employee.id,
      attendanceId: record.id,
      checkIn: now.toISOString(),
    });

    return {
      checkIn: formatTime(record.checkIn),
      checkOut: formatTime(record.checkOut),
      hours: '0h 0m',
      overtime: '0h',
      hasCheckedIn: true,
      hasCheckedOut: false,
      location: record.checkInLocation,
    };
  });
}

export async function checkOut(userId: string) {
  const employee = await resolveEmployeeForUser(userId);
  const schedule = await getWorkScheduleConfig();
  const today = startOfUtcDay(new Date());
  const now = new Date();
  const standardHours = Number(schedule.standardHoursPerDay);
  const halfDayThreshold = Number(schedule.halfDayThresholdHours);

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
  });

  if (!existing?.checkIn) {
    throw new Error('Must check in before checking out');
  }
  if (existing.checkOut) {
    throw new Error('Already checked out for today');
  }

  const { hours, overtime, status: baseStatus } = computeHoursAndOvertime(
    existing.checkIn,
    now,
    standardHours,
    schedule.overtimeEnabled,
  );

  let status = baseStatus;
  if (hours > 0 && hours < halfDayThreshold) {
    status = AttendanceStatus.HALF_DAY;
  } else if (existing.status === AttendanceStatus.LATE) {
    status = AttendanceStatus.LATE;
  }

  return prisma.$transaction(async (tx) => {
    const record = await tx.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: now,
        hours,
        overtimeHours: overtime,
        status,
      },
    });

    await writeAuditLog(tx, userId, 'EMPLOYEE_CHECK_OUT', {
      employeeId: employee.id,
      attendanceId: record.id,
      checkOut: now.toISOString(),
      hours,
      overtimeHours: overtime,
    });

    return {
      checkIn: formatTime(record.checkIn),
      checkOut: formatTime(record.checkOut),
      hours: formatDuration(hours),
      overtime: formatOvertime(overtime),
      hasCheckedIn: true,
      hasCheckedOut: true,
      location: record.checkInLocation ?? employee.location ?? 'Office',
      needsMood: true,
    };
  });
}

export async function submitDailyMood(userId: string, body: SubmitMoodBody) {
  const employee = await resolveEmployeeForUser(userId);
  const today = startOfUtcDay(new Date());

  const attendance = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
  });

  if (!attendance?.checkOut) {
    throw new Error('Must check out before submitting mood');
  }

  return prisma.$transaction(async (tx) => {
    const moodRecord = await tx.employeeDailyMood.upsert({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
      create: {
        employeeId: employee.id,
        date: today,
        mood: body.mood,
      },
      update: { mood: body.mood },
    });

    await writeAuditLog(tx, userId, 'EMPLOYEE_SUBMIT_MOOD', {
      employeeId: employee.id,
      mood: body.mood,
      date: today.toISOString(),
    });

    return { mood: moodRecord.mood, submitted: true };
  });
}

export async function createTeamAnnouncement(userId: string, body: AnnouncementBody) {
  const { employee, managedTeam } = await requireTeamManager(userId);

  return prisma.$transaction(async (tx) => {
    const announcement = await tx.announcement.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: employee.id,
        department: managedTeam.department ?? employee.department ?? undefined,
      },
    });

    const teamMembers = await tx.employee.findMany({
      where: { teamId: managedTeam.id, isActive: true },
      select: { userId: true },
    });

    for (const member of teamMembers) {
      await tx.notification.create({
        data: {
          userId: member.userId,
          title: 'New Team Announcement',
          message: `${employee.firstName} posted: "${body.title}"`,
        },
      });
    }

    return announcement;
  });
}

export async function updateTeamAnnouncement(userId: string, announcementId: string, body: AnnouncementBody) {
  const { employee } = await requireTeamManager(userId);

  const existing = await prisma.announcement.findUnique({ where: { id: announcementId } });
  if (!existing || existing.authorId !== employee.id) {
    throw new Error('Announcement not found or unauthorized');
  }

  return prisma.announcement.update({
    where: { id: announcementId },
    data: { title: body.title, content: body.content },
  });
}

export async function deleteTeamAnnouncement(userId: string, announcementId: string) {
  const { employee } = await requireTeamManager(userId);

  const existing = await prisma.announcement.findUnique({ where: { id: announcementId } });
  if (!existing || existing.authorId !== employee.id) {
    throw new Error('Announcement not found or unauthorized');
  }

  return prisma.announcement.delete({ where: { id: announcementId } });
}

export async function createTeamHoliday(userId: string, body: TeamHolidayBody) {
  const { managedTeam } = await requireTeamManager(userId);

  return prisma.companyHoliday.create({
    data: {
      title: body.title,
      date: body.date,
      endDate: body.endDate,
      teamId: managedTeam.id,
      isNational: false,
    },
  });
}

export async function updateTeamHoliday(userId: string, holidayId: string, body: TeamHolidayBody) {
  const { managedTeam } = await requireTeamManager(userId);

  const existing = await prisma.companyHoliday.findUnique({ where: { id: holidayId } });
  if (!existing || existing.teamId !== managedTeam.id) {
    throw new Error('Holiday not found or unauthorized');
  }

  return prisma.companyHoliday.update({
    where: { id: holidayId },
    data: {
      title: body.title,
      date: body.date,
      endDate: body.endDate,
    },
  });
}

export async function deleteTeamHoliday(userId: string, holidayId: string) {
  const { managedTeam } = await requireTeamManager(userId);

  const existing = await prisma.companyHoliday.findUnique({ where: { id: holidayId } });
  if (!existing || existing.teamId !== managedTeam.id) {
    throw new Error('Holiday not found or unauthorized');
  }

  return prisma.companyHoliday.delete({ where: { id: holidayId } });
}

export async function downloadPayslip(userId: string, payslipId: string) {
  const employee = await resolveEmployeeForUser(userId);

  const payslip = await prisma.employeePayslip.findFirst({
    where: { id: payslipId, employeeId: employee.id },
    include: {
      payroll: {
        select: {
          periodStart: true,
          periodEnd: true,
        },
      },
    },
  });

  if (!payslip) {
    return null;
  }

  const periodLabel = payslipPeriodLabel(new Date(payslip.periodStart));
  const periodStart = payslip.payroll?.periodStart ?? payslip.periodStart;
  const periodEnd = payslip.payroll?.periodEnd ?? payslip.periodEnd;

  const lineItem = await prisma.payrollLineItem.findUnique({
    where: { payslipId: payslip.id },
    select: {
      baseSalary: true,
      allowances: true,
      overtime: true,
      bonuses: true,
      incomeTax: true,
      providentFund: true,
      healthInsurance: true,
    },
  });

  const year = new Date(payslip.periodStart).getFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  const yearPayslips = await prisma.employeePayslip.findMany({
    where: {
      employeeId: employee.id,
      periodStart: { gte: yearStart, lte: yearEnd },
    },
    select: { grossPay: true, deductionsTotal: true, netPay: true },
  });
  let ytdGross = 0;
  let ytdDeductions = 0;
  let ytdNet = 0;
  for (const p of yearPayslips) {
    ytdGross += Number(p.grossPay);
    ytdDeductions += Number(p.deductionsTotal);
    ytdNet += Number(p.netPay);
  }

  const monthStr = String(periodStart.getMonth() + 1).padStart(2, '0');
  const yearStr = String(periodStart.getFullYear());
  const payslipNumber = `PSL-${employee.employeeCode ?? 'EMP'}-${monthStr}${yearStr}`;

  const pdfBuffer = await buildPayslipPdf({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    employeeCode: employee.employeeCode,
    department: employee.department?.replace(/_/g, ' ') ?? null,
    designation: employee.designation,
    employeeType: employee.employeeType ?? null,
    workLocation: employee.location ?? null,
    joiningDate: employee.joiningDate,
    periodStart,
    periodEnd,
    periodLabel,
    payslipNumber,
    paymentDate: payslip.paidAt ?? payslip.createdAt,
    currencyCode: payslip.currencyCode,
    status: payslip.status,
    basicSalary: Number(lineItem?.baseSalary ?? payslip.grossPay),
    allowances: Number(lineItem?.allowances ?? 0),
    overtime: Number(lineItem?.overtime ?? 0),
    bonuses: Number(lineItem?.bonuses ?? 0),
    grossPay: Number(payslip.grossPay),
    incomeTax: Number(lineItem?.incomeTax ?? payslip.taxAmount),
    providentFund: Number(lineItem?.providentFund ?? 0),
    healthInsurance: Number(lineItem?.healthInsurance ?? 0),
    deductionsTotal: Number(payslip.deductionsTotal),
    netPay: Number(payslip.netPay),
    ytdGross,
    ytdDeductions,
    ytdNet,
  });

  if (!payslip.documentUrl) {
    await prisma.employeePayslip.update({
      where: { id: payslip.id },
      data: { documentUrl: `generated://${payslip.id}` },
    });
  }

  return {
    filename: `payslip-${employee.employeeCode ?? employee.id}-${periodLabel.replace(/\s+/g, '-')}.pdf`,
    buffer: pdfBuffer,
  };
}

export async function updateWorkSchedule(
  userId: string,
  data: {
    standardHoursPerDay?: number;
    halfDayThresholdHours?: number;
    overtimeEnabled?: boolean;
    lateAfterHour?: number;
    lateAfterMinute?: number;
  },
) {
  return prisma.$transaction(async (tx) => {
    const config = await tx.workScheduleConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        ...data,
        updatedByUserId: userId,
      },
      update: {
        ...data,
        updatedByUserId: userId,
      },
    });

    await writeAuditLog(tx, userId, 'WORK_SCHEDULE_UPDATE', {
      standardHoursPerDay: Number(config.standardHoursPerDay),
      halfDayThresholdHours: Number(config.halfDayThresholdHours),
      overtimeEnabled: config.overtimeEnabled,
    });

    return config;
  });
}
