export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function formatAttendanceTime(date: Date | null | undefined): string {
  if (!date) return '-';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatAttendanceHours(hours: number): string {
  if (hours <= 0) return '0 hrs';
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} hrs`;
}

export function formatAttendanceOvertime(hours: number): string {
  if (hours <= 0) return '-';
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} hrs`;
}

export function formatMonthYearLabel(month: number, year: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
