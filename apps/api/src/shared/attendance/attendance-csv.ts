import { AttendanceStatus } from '@prisma/client';
import { formatAttendanceHours, formatAttendanceTime, formatMonthYearLabel } from './attendance-format';
import { getAttendanceStatusPresentation } from './attendance-status-presentation';

function escapeCsvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(escapeCsvCell).join(',');
}

function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export type AttendanceCsvEmployee = {
  firstName: string;
  lastName: string;
  employeeCode: string | null;
  department: string | null;
};

export type AttendanceCsvRecord = {
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  hours: { toNumber?: () => number } | number | null;
  overtimeHours: { toNumber?: () => number } | number | null;
  status: AttendanceStatus;
};

export type AttendanceCsvSummary = {
  totalHours: number;
  totalOvertime: number;
  attendancePercentage: number;
};

function toNumber(value: AttendanceCsvRecord['hours']): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  return Number(value);
}

export function buildEmployeeAttendanceCsv(
  employee: AttendanceCsvEmployee,
  month: number,
  year: number,
  records: AttendanceCsvRecord[],
  summary: AttendanceCsvSummary,
): string {
  const employeeName = `${employee.firstName} ${employee.lastName}`.trim();
  const periodLabel = formatMonthYearLabel(month, year);
  const generatedAt = new Date().toISOString();
  const sorted = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const lines = [
    csvRow(['Employee Attendance Report']),
    csvRow(['Employee Name', employeeName]),
    csvRow(['Employee ID', employee.employeeCode ?? '']),
    csvRow(['Department', employee.department ?? '']),
    csvRow(['Period', periodLabel]),
    csvRow(['Generated At', generatedAt]),
    '',
    csvRow([
      'Date (ISO)',
      'Date',
      'Day',
      'Check-in',
      'Check-out',
      'Total Hours',
      'OT Hours',
      'Status',
    ]),
    ...sorted.map((record) => {
      const date = new Date(record.date);
      const hours = toNumber(record.hours);
      const overtime = toNumber(record.overtimeHours);
      const presentation = getAttendanceStatusPresentation(record.status);

      return csvRow([
        formatIsoDate(date),
        formatDisplayDate(date),
        date.toLocaleDateString('en-US', { weekday: 'short' }),
        formatAttendanceTime(record.checkIn),
        formatAttendanceTime(record.checkOut),
        hours,
        overtime,
        presentation.label,
      ]);
    }),
    '',
    csvRow(['Monthly Summary']),
    csvRow(['Total Hours', formatAttendanceHours(summary.totalHours)]),
    csvRow(['Overtime Hours', formatAttendanceHours(summary.totalOvertime)]),
    csvRow(['Attendance %', `${summary.attendancePercentage}%`]),
  ];

  return lines.join('\n');
}

export function attendanceCsvFilename(
  employee: AttendanceCsvEmployee,
  month: number,
  year: number,
): string {
  const slug = `${employee.firstName}-${employee.lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `attendance-${slug || 'employee'}-${year}-${String(month).padStart(2, '0')}.csv`;
}
