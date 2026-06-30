import { AttendanceStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import {
  buildAttendanceCalendarWeeks,
  type AttendanceDayRecord,
} from '../../shared/attendance/attendance-calendar';
import {
  formatAttendanceHours,
  formatAttendanceTime,
  formatMonthYearLabel,
  startOfUtcDay,
} from '../../shared/attendance/attendance-format';
import {
  countCalendarLegend,
  getAttendanceStatusPresentation,
  mapCalendarDayStatusToCode,
  mapCalendarDayStatusToLabel,
} from '../../shared/attendance/attendance-status-presentation';
import { getWorkScheduleConfig } from '../employee/EmployeeDashboard/employee_dashboard.service';
import {
  attendanceCsvFilename,
  buildEmployeeAttendanceCsv,
} from '../../shared/attendance/attendance-csv';

export type EmployeeAttendanceQuery = {
  month: number;
  year: number;
};

function monthBounds(month: number, year: number) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));
  return { monthStart, monthEnd };
}

function monthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

function addMonthsToSet(
  monthKeys: Set<string>,
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
) {
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    monthKeys.add(monthKey(year, month));
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
}

function listAvailableAttendanceMonths(joiningDate: Date | null) {
  const now = new Date();
  const endYear = now.getUTCFullYear();
  const endMonth = now.getUTCMonth() + 1;

  let startYear = endYear;
  let startMonth = endMonth - 11;
  while (startMonth <= 0) {
    startMonth += 12;
    startYear -= 1;
  }

  if (joiningDate) {
    const joinYear = joiningDate.getUTCFullYear();
    const joinMonth = joiningDate.getUTCMonth() + 1;
    if (joinYear > startYear || (joinYear === startYear && joinMonth > startMonth)) {
      startYear = joinYear;
      startMonth = joinMonth;
    }
  }

  const monthKeys = new Set<string>();
  addMonthsToSet(monthKeys, startYear, startMonth, endYear, endMonth);
  monthKeys.add(monthKey(endYear, endMonth));

  return Array.from(monthKeys)
    .map((key) => {
      const [year, month] = key.split('-').map(Number);
      return { month, year, label: formatMonthYearLabel(month, year) };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

function countPastWorkingDays(
  month: number,
  year: number,
  holidays: { date: Date; endDate: Date | null }[],
) {
  const today = startOfUtcDay(new Date());
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let count = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(Date.UTC(year, month - 1, day));
    if (cellDate.getTime() >= today.getTime()) continue;

    const dayOfWeek = cellDate.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const isHoliday = holidays.some((holiday) => {
      const start = startOfUtcDay(holiday.date).getTime();
      const end = startOfUtcDay(holiday.endDate ?? holiday.date).getTime();
      const current = cellDate.getTime();
      return current >= start && current <= end;
    });

    if (!isHoliday) count += 1;
  }

  return count;
}

export async function getEmployeeAttendanceLogs(employeeId: string, query: EmployeeAttendanceQuery) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, joiningDate: true },
  });

  if (!employee) {
    return null;
  }

  const schedule = await getWorkScheduleConfig();
  const halfDayThreshold = Number(schedule.halfDayThresholdHours);
  const { monthStart, monthEnd } = monthBounds(query.month, query.year);
  const availableMonths = listAvailableAttendanceMonths(employee.joiningDate);

  const [attendanceRecords, holidays] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { date: 'desc' },
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

  const holidayRanges = holidays.map((holiday) => ({
    date: holiday.date,
    endDate: holiday.endDate,
  }));

  const attendanceMap = new Map<number, AttendanceDayRecord>();
  for (const record of attendanceRecords) {
    attendanceMap.set(new Date(record.date).getUTCDate(), {
      status: record.status,
      hours: record.hours,
    });
  }

  const calendar = buildAttendanceCalendarWeeks(
    query.month,
    query.year,
    attendanceMap,
    holidayRanges,
    halfDayThreshold,
  );

  const profileWeeks = calendar.weeks.map((week) =>
    week.map((cell) => ({
      day: cell.day,
      code: cell.day ? mapCalendarDayStatusToCode(cell.status) : null,
      label: cell.day ? mapCalendarDayStatusToLabel(cell.status) : '',
      status: cell.status,
    })),
  );

  const rows = attendanceRecords.map((record) => {
    const date = new Date(record.date);
    const hours = record.hours ? Number(record.hours) : 0;
    const overtime = record.overtimeHours ? Number(record.overtimeHours) : 0;
    const presentation = getAttendanceStatusPresentation(record.status);

    return {
      id: record.id,
      date: date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      checkIn: formatAttendanceTime(record.checkIn),
      checkOut: formatAttendanceTime(record.checkOut),
      total: formatAttendanceHours(hours),
      ot: formatAttendanceHours(overtime),
      status: presentation.label,
      color: presentation.color,
      textColor: presentation.textColor,
    };
  });

  let totalHours = 0;
  let totalOvertime = 0;
  let attendedDays = 0;

  for (const record of attendanceRecords) {
    totalHours += record.hours ? Number(record.hours) : 0;
    totalOvertime += record.overtimeHours ? Number(record.overtimeHours) : 0;

    if (
      record.status === AttendanceStatus.PRESENT ||
      record.status === AttendanceStatus.LATE ||
      record.status === AttendanceStatus.HALF_DAY
    ) {
      attendedDays += 1;
    }
  }

  const workingDaysPast = countPastWorkingDays(query.month, query.year, holidayRanges);
  const attendancePercentage =
    workingDaysPast > 0 ? Math.round((attendedDays / workingDaysPast) * 100) : 0;

  return {
    selectedMonth: {
      month: query.month,
      year: query.year,
      label: formatMonthYearLabel(query.month, query.year),
    },
    availableMonths,
    calendar: {
      label: calendar.label,
      weekdays: calendar.weekdays,
      weeks: profileWeeks,
      legend: countCalendarLegend(calendar.weeks),
    },
    rows,
    summary: {
      totalHours: formatAttendanceHours(totalHours),
      overtimeHours: formatAttendanceHours(totalOvertime),
      attendancePercentage,
    },
  };
}

export async function exportEmployeeAttendanceCsv(
  employeeId: string,
  query: EmployeeAttendanceQuery,
) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeCode: true,
      department: true,
      joiningDate: true,
    },
  });

  if (!employee) {
    return null;
  }

  const logs = await getEmployeeAttendanceLogs(employeeId, query);
  if (!logs) {
    return null;
  }

  const { monthStart, monthEnd } = monthBounds(query.month, query.year);
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: { gte: monthStart, lte: monthEnd },
    },
    orderBy: { date: 'asc' },
  });

  let totalHours = 0;
  let totalOvertime = 0;
  for (const record of attendanceRecords) {
    totalHours += record.hours ? Number(record.hours) : 0;
    totalOvertime += record.overtimeHours ? Number(record.overtimeHours) : 0;
  }

  const csv = buildEmployeeAttendanceCsv(
    {
      firstName: employee.firstName,
      lastName: employee.lastName,
      employeeCode: employee.employeeCode,
      department: employee.department,
    },
    query.month,
    query.year,
    attendanceRecords,
    {
      totalHours,
      totalOvertime,
      attendancePercentage: logs.summary.attendancePercentage,
    },
  );

  return {
    csv,
    filename: attendanceCsvFilename(
      { firstName: employee.firstName, lastName: employee.lastName, employeeCode: employee.employeeCode, department: employee.department },
      query.month,
      query.year,
    ),
  };
}
