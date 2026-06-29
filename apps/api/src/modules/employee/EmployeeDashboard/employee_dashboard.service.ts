import { Prisma, AttendanceStatus, LeaveType, LeaveRequestStatus } from '@prisma/client';
import { prisma } from '../../../config/database';
import { formatCurrency } from '../../../shared/currency/exchange-rate';
import { buildPayslipPdf } from '../../../shared/pdf/payslip-pdf';
import type { CalendarQuery, CheckInBody } from './employee_dashboard.schema';

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

type DayStatus = 'present' | 'half' | 'absent' | 'holiday' | 'today' | 'none';

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

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatTime(date: Date | null | undefined): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
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

function deriveAttendanceStatus(
  record: { status: AttendanceStatus; hours: Prisma.Decimal | null } | null,
  halfDayThreshold: number,
): DayStatus {
  if (!record) return 'none';
  const hours = record.hours ? Number(record.hours) : 0;
  if (record.status === AttendanceStatus.HALF_DAY || (hours > 0 && hours < halfDayThreshold)) {
    return 'half';
  }
  if (record.status === AttendanceStatus.ABSENT) return 'absent';
  if (record.status === AttendanceStatus.PRESENT || record.status === AttendanceStatus.LATE) {
    return 'present';
  }
  return 'none';
}

function isHoliday(date: Date, holidays: { date: Date; endDate: Date | null }[]): boolean {
  const day = startOfUtcDay(date).getTime();
  return holidays.some((h) => {
    const start = startOfUtcDay(h.date).getTime();
    const end = startOfUtcDay(h.endDate ?? h.date).getTime();
    return day >= start && day <= end;
  });
}

function buildCalendarWeeks(
  month: number,
  year: number,
  attendanceMap: Map<number, { status: AttendanceStatus; hours: Prisma.Decimal | null }>,
  holidays: { date: Date; endDate: Date | null }[],
  halfDayThreshold: number,
) {
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startOffset = (firstDay.getUTCDay() + 6) % 7;
  const today = startOfUtcDay(new Date());

  const cells: { day: number | null; status: DayStatus }[] = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push({ day: null, status: 'none' });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(Date.UTC(year, month - 1, day));
    let status: DayStatus = 'none';

    if (isHoliday(cellDate, holidays)) {
      status = 'holiday';
    } else if (cellDate.getTime() === today.getTime()) {
      const att = attendanceMap.get(day);
      status = att ? deriveAttendanceStatus(att, halfDayThreshold) : 'today';
      if (status === 'none') status = 'today';
    } else if (cellDate.getTime() < today.getTime()) {
      const att = attendanceMap.get(day);
      status = att ? deriveAttendanceStatus(att, halfDayThreshold) : 'absent';
    }

    cells.push({ day, status });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: null, status: 'none' });
  }

  const weeks: { day: number | null; status: DayStatus }[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return {
    label,
    weekdays,
    weeks,
    legend: [
      { label: 'Present', color: '#C4BDF8' },
      { label: 'Half', color: '#86EFAC' },
      { label: 'Absent', color: '#F8B4B4' },
      { label: 'Holiday', color: '#FDE68A' },
    ],
  };
}

async function getTeamMemberIds(managerEmployeeId: string): Promise<string[]> {
  const reports = await prisma.employee.findMany({
    where: { managerId: managerEmployeeId, isActive: true },
    select: { id: true },
  });
  return reports.map((r) => r.id);
}

export async function getDashboard(userId: string) {
  const employee = await resolveEmployeeForUser(userId);
  const schedule = await getWorkScheduleConfig();
  const today = startOfUtcDay(new Date());
  const now = new Date();
  const year = now.getUTCFullYear();

  const teamSize = (await getTeamMemberIds(employee.id)).length;

  const [
    todayAttendance,
    leaveBalances,
    pendingLeave,
    latestPayslip,
    teamAnnouncements,
    upcomingHolidays,
    monthAttendance,
    holidays,
  ] = await Promise.all([
    prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
    }),
    prisma.leaveBalance.findMany({
      where: { employeeId: employee.id, year, leaveType: { in: ['ANNUAL', 'SICK', 'CASUAL'] } },
    }),
    prisma.leaveRequest.findFirst({
      where: { employeeId: employee.id, status: LeaveRequestStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.employeePayslip.findFirst({
      where: { employeeId: employee.id },
      orderBy: { periodStart: 'desc' },
    }),
    prisma.announcement.findMany({
      where: {
        author: { managerId: employee.id },
      },
      include: {
        author: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.companyHoliday.findMany({
      where: { date: { gte: today } },
      orderBy: { date: 'asc' },
      take: 5,
    }),
    prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        date: {
          gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
          lte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)),
        },
      },
    }),
    prisma.companyHoliday.findMany({
      where: {
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
      },
    }),
  ]);

  const halfDayThreshold = Number(schedule.halfDayThresholdHours);
  const attendanceMap = new Map(
    monthAttendance.map((a) => [new Date(a.date).getUTCDate(), { status: a.status, hours: a.hours }]),
  );

  const calendarMonth = buildCalendarWeeks(
    now.getUTCMonth() + 1,
    now.getUTCFullYear(),
    attendanceMap,
    holidays.map((h) => ({ date: h.date, endDate: h.endDate })),
    halfDayThreshold,
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
    attendanceToday: {
      currentTime: formatTime(now),
      location: todayAttendance?.checkInLocation ?? employee.location ?? 'Office',
      checkIn: formatTime(todayAttendance?.checkIn),
      checkOut: formatTime(todayAttendance?.checkOut),
      hours: formatDuration(hoursWorked),
      overtime: formatOvertime(overtimeHours),
      hasCheckedIn: Boolean(todayAttendance?.checkIn),
      hasCheckedOut: Boolean(todayAttendance?.checkOut),
    },
    leaveBalances: defaultBalances.map((type) => {
      const balance = balanceByType.get(type);
      const allocated = balance ? Number(balance.allocatedDays) : 0;
      const used = balance ? Number(balance.usedDays) : 0;
      const pending = balance ? Number(balance.pendingDays) : 0;
      const available = Math.max(0, allocated - used - pending);
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
          status: `${pendingLeave.durationDays} day${pendingLeave.durationDays === 1 ? '' : 's'}`,
        }
      : null,
    latestPayslip: latestPayslip
      ? {
          id: latestPayslip.id,
          label: 'Latest Payslip',
          period: latestPayslip.periodLabel,
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
      initials: `${ann.author.firstName[0] ?? ''}${ann.author.lastName[0] ?? ''}`.toUpperCase(),
      name: `${ann.author.firstName} ${ann.author.lastName}`,
      message: ann.content,
      time: relativeTime(ann.createdAt),
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
      };
    }),
  };
}

export async function getCalendar(userId: string, query: CalendarQuery) {
  const employee = await resolveEmployeeForUser(userId);
  const schedule = await getWorkScheduleConfig();
  const halfDayThreshold = Number(schedule.halfDayThresholdHours);

  const monthStart = new Date(Date.UTC(query.year, query.month - 1, 1));
  const monthEnd = new Date(Date.UTC(query.year, query.month, 0));

  const [attendanceRecords, holidays] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.companyHoliday.findMany({
      where: {
        OR: [
          { date: { gte: monthStart, lte: monthEnd } },
          { endDate: { gte: monthStart }, date: { lte: monthEnd } },
        ],
      },
    }),
  ]);

  const attendanceMap = new Map(
    attendanceRecords.map((a) => [new Date(a.date).getUTCDate(), { status: a.status, hours: a.hours }]),
  );

  return buildCalendarWeeks(
    query.month,
    query.year,
    attendanceMap,
    holidays.map((h) => ({ date: h.date, endDate: h.endDate })),
    halfDayThreshold,
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
    };
  });
}

export async function downloadPayslip(userId: string, payslipId: string) {
  const employee = await resolveEmployeeForUser(userId);

  const payslip = await prisma.employeePayslip.findFirst({
    where: { id: payslipId, employeeId: employee.id },
  });

  if (!payslip) {
    return null;
  }

  const pdfBuffer = await buildPayslipPdf({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    employeeCode: employee.employeeCode,
    department: employee.department?.replace(/_/g, ' ') ?? null,
    designation: employee.designation,
    periodLabel: payslip.periodLabel,
    grossAmount: Number(payslip.grossPay),
    grossPay: Number(payslip.grossPay),
    deductionsAmount: Number(payslip.deductionsTotal),
    deductionsTotal: Number(payslip.deductionsTotal),
    taxAmount: Number(payslip.taxAmount),
    netAmount: Number(payslip.netPay),
    netPay: Number(payslip.netPay),
    currencyCode: payslip.currencyCode,
    status: payslip.status,
    generatedAt: new Date(),
  });

  if (!payslip.documentUrl) {
    await prisma.employeePayslip.update({
      where: { id: payslip.id },
      data: { documentUrl: `generated://${payslip.id}` },
    });
  }

  return {
    filename: `payslip-${employee.employeeCode ?? employee.id}-${payslip.id}.pdf`,
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
