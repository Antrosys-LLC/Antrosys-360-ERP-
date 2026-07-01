import { AttendanceStatus } from '@prisma/client';
import type { CalendarDayStatus } from './attendance-calendar';

const STATUS_PRESENTATION: Record<
  AttendanceStatus,
  { label: string; color: string; textColor?: string }
> = {
  PRESENT: {
    label: 'Present',
    color: 'bg-purple-50 text-[#7B6AE6] border-purple-100',
  },
  LATE: {
    label: 'Late',
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    textColor: 'text-amber-600',
  },
  ABSENT: {
    label: 'Absent',
    color: 'bg-rose-50 text-rose-500 border-rose-100',
  },
  LEAVE: {
    label: 'On Leave',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  HALF_DAY: {
    label: 'Half-day',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
};

export function getAttendanceStatusPresentation(status: AttendanceStatus) {
  return STATUS_PRESENTATION[status];
}

export function mapCalendarDayStatusToCode(status: CalendarDayStatus): string | null {
  switch (status) {
    case 'present':
      return 'P';
    case 'late':
      return 'L';
    case 'half':
      return 'H';
    case 'absent':
      return 'A';
    case 'leave':
      return 'LV';
    case 'holiday':
      return 'HO';
    case 'today':
      return 'T';
    default:
      return null;
  }
}

export function mapCalendarDayStatusToLabel(status: CalendarDayStatus): string {
  switch (status) {
    case 'present':
      return 'Present';
    case 'late':
      return 'Late';
    case 'half':
      return 'Half-day';
    case 'absent':
      return 'Absent';
    case 'leave':
      return 'On Leave';
    case 'holiday':
      return 'Holiday';
    case 'today':
      return 'Today';
    default:
      return '';
  }
}

export function countCalendarLegend(weeks: { day: number | null; status: CalendarDayStatus }[][]) {
  const counts = {
    present: 0,
    late: 0,
    half: 0,
    absent: 0,
    leave: 0,
    holiday: 0,
    today: 0,
  };

  for (const week of weeks) {
    for (const cell of week) {
      if (!cell.day) continue;
      if (cell.status in counts) {
        counts[cell.status as keyof typeof counts] += 1;
      }
    }
  }

  const items = [
    { label: 'Present', count: counts.present, color: '#7B6AE6' },
    { label: 'Late', count: counts.late, color: '#D97706' },
    { label: 'Half-day', count: counts.half, color: '#059669' },
    { label: 'Absent', count: counts.absent, color: '#F43F5E' },
    { label: 'On leave', count: counts.leave, color: '#10B981' },
    { label: 'Holidays', count: counts.holiday, color: '#3B82F6' },
    { label: 'Today', count: counts.today, color: '#64748B' },
  ];

  return items.filter((item) => item.count > 0);
}
