import { AttendanceStatus, LeaveRequestStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { startOfUtcDay } from './attendance-format';
import { isHolidayDate } from './attendance-calendar';

/**
 * Marks active employees ABSENT for past weekdays with no check-in,
 * skipping weekends, holidays, and approved leave days.
 * Intended to run after end of day (and lazily when calendars load).
 */
export async function markMissingAttendanceAsAbsent(options?: {
  asOf?: Date;
  employeeId?: string;
  lookbackDays?: number;
}) {
  const asOf = startOfUtcDay(options?.asOf ?? new Date());
  const lookbackDays = options?.lookbackDays ?? 30;
  const rangeStart = new Date(asOf);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - lookbackDays);

  const employees = await prisma.employee.findMany({
    where: {
      isActive: true,
      ...(options?.employeeId ? { id: options.employeeId } : {}),
    },
    select: { id: true, teamId: true },
  });

  if (employees.length === 0) return { marked: 0 };

  const holidays = await prisma.companyHoliday.findMany({
    where: {
      OR: [
        { date: { gte: rangeStart, lt: asOf } },
        { endDate: { gte: rangeStart }, date: { lt: asOf } },
      ],
    },
    select: { date: true, endDate: true, teamId: true },
  });

  const leaves = await prisma.leaveRequest.findMany({
    where: {
      status: LeaveRequestStatus.APPROVED,
      startDate: { lte: asOf },
      endDate: { gte: rangeStart },
      ...(options?.employeeId ? { employeeId: options.employeeId } : {}),
    },
    select: { employeeId: true, startDate: true, endDate: true },
  });

  const leaveByEmployee = new Map<string, { start: Date; end: Date }[]>();
  for (const leave of leaves) {
    const list = leaveByEmployee.get(leave.employeeId) ?? [];
    list.push({ start: startOfUtcDay(leave.startDate), end: startOfUtcDay(leave.endDate) });
    leaveByEmployee.set(leave.employeeId, list);
  }

  let marked = 0;
  const creates: Prisma.AttendanceCreateManyInput[] = [];

  for (const employee of employees) {
    const existing = await prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        date: { gte: rangeStart, lt: asOf },
      },
      select: { date: true },
    });
    const existingDays = new Set(existing.map((row) => startOfUtcDay(row.date).getTime()));
    const employeeLeaves = leaveByEmployee.get(employee.id) ?? [];
    const employeeHolidays = holidays.filter((h) => !h.teamId || h.teamId === employee.teamId);

    for (let cursor = new Date(rangeStart); cursor < asOf; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const day = startOfUtcDay(cursor);
      const dow = day.getUTCDay();
      if (dow === 0 || dow === 6) continue;
      if (existingDays.has(day.getTime())) continue;
      if (isHolidayDate(day, employeeHolidays)) continue;
      if (
        employeeLeaves.some((leave) => day.getTime() >= leave.start.getTime() && day.getTime() <= leave.end.getTime())
      ) {
        continue;
      }

      creates.push({
        employeeId: employee.id,
        date: day,
        status: AttendanceStatus.ABSENT,
      });
      marked += 1;
    }
  }

  if (creates.length > 0) {
    // Chunk to avoid oversized payloads
    const chunkSize = 500;
    for (let i = 0; i < creates.length; i += chunkSize) {
      await prisma.attendance.createMany({
        data: creates.slice(i, i + chunkSize),
        skipDuplicates: true,
      });
    }
  }

  // Also ensure approved leave days are recorded as LEAVE
  for (const leave of leaves) {
    for (
      let cursor = new Date(startOfUtcDay(leave.startDate));
      cursor <= startOfUtcDay(leave.endDate) && cursor < asOf;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      const day = startOfUtcDay(cursor);
      const dow = day.getUTCDay();
      if (dow === 0 || dow === 6) continue;

      await prisma.attendance.upsert({
        where: {
          employeeId_date: { employeeId: leave.employeeId, date: day },
        },
        create: {
          employeeId: leave.employeeId,
          date: day,
          status: AttendanceStatus.LEAVE,
        },
        update: {
          status: AttendanceStatus.LEAVE,
        },
      });
    }
  }

  return { marked };
}
