import { AttendanceStatus, Prisma } from '@prisma/client';
import { startOfUtcDay } from './attendance-format';

export type CalendarDayStatus =
  | 'present'
  | 'late'
  | 'half'
  | 'absent'
  | 'leave'
  | 'holiday'
  | 'today'
  | 'none';

export type AttendanceDayRecord = {
  status: AttendanceStatus;
  hours: Prisma.Decimal | null;
};

export function isHolidayDate(date: Date, holidays: { date: Date; endDate: Date | null }[]): boolean {
  const day = startOfUtcDay(date).getTime();
  return holidays.some((holiday) => {
    const start = startOfUtcDay(holiday.date).getTime();
    const end = startOfUtcDay(holiday.endDate ?? holiday.date).getTime();
    return day >= start && day <= end;
  });
}

export function deriveCalendarDayStatus(
  record: AttendanceDayRecord | null,
  halfDayThreshold: number,
): CalendarDayStatus {
  if (!record) return 'none';

  const hours = record.hours ? Number(record.hours) : 0;

  if (record.status === AttendanceStatus.LEAVE) return 'leave';
  if (record.status === AttendanceStatus.LATE) return 'late';
  if (
    record.status === AttendanceStatus.HALF_DAY ||
    (hours > 0 && hours < halfDayThreshold)
  ) {
    return 'half';
  }
  if (record.status === AttendanceStatus.ABSENT) return 'absent';
  if (record.status === AttendanceStatus.PRESENT) return 'present';

  return 'none';
}

export function buildAttendanceCalendarWeeks(
  month: number,
  year: number,
  attendanceMap: Map<number, AttendanceDayRecord>,
  holidays: { date: Date; endDate: Date | null }[],
  halfDayThreshold: number,
  leaveDayNumbers: Set<number> = new Set(),
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

  const cells: { day: number | null; status: CalendarDayStatus }[] = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push({ day: null, status: 'none' });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = cellDate.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    let status: CalendarDayStatus = 'none';

    if (isHolidayDate(cellDate, holidays)) {
      status = 'holiday';
    } else if (leaveDayNumbers.has(day)) {
      status = 'leave';
    } else if (cellDate.getTime() === today.getTime()) {
      const attendance = attendanceMap.get(day);
      status = attendance ? deriveCalendarDayStatus(attendance, halfDayThreshold) : 'today';
      if (status === 'none') status = 'today';
    } else if (cellDate.getTime() < today.getTime()) {
      const attendance = attendanceMap.get(day);
      if (attendance) {
        status = deriveCalendarDayStatus(attendance, halfDayThreshold);
      } else if (!isWeekend) {
        // Past weekday with no check-in is treated as absent (end-of-day rule).
        status = 'absent';
      }
    }

    cells.push({ day, status });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: null, status: 'none' });
  }

  const weeks: { day: number | null; status: CalendarDayStatus }[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return {
    label,
    weekdays,
    weeks,
    legend: [
      { label: 'Present', color: '#C4BDF8' },
      { label: 'Late', color: '#FBBF24' },
      { label: 'Half', color: '#86EFAC' },
      { label: 'Absent', color: '#F8B4B4' },
      { label: 'Leave', color: '#93C5FD' },
      { label: 'Holiday', color: '#BFDBFE' },
    ],
  };
}
