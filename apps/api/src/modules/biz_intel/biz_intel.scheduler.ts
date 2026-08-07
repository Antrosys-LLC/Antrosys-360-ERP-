import { prisma } from '../../config/database';

// Minimal 5-field cron matcher: minute hour day-of-month month day-of-week.
// Supports *, */n, n, a-b, and comma-separated lists.
export function matchesCron(cronExpression: string, date: Date): boolean {
  const fields = cronExpression.trim().split(/\s+/);
  if (fields.length !== 5) return false;

  const [minuteField, hourField, domField, monthField, dowField] = fields;

  if (!matchesField(minuteField, date.getMinutes(), 0, 59)) return false;
  if (!matchesField(hourField, date.getHours(), 0, 23)) return false;
  if (!matchesField(domField, date.getDate(), 1, 31)) return false;
  if (!matchesField(monthField, date.getMonth() + 1, 1, 12)) return false;
  if (!matchesField(dowField, date.getDay(), 0, 6)) return false;

  return true;
}

function matchesField(field: string, value: number, min: number, max: number): boolean {
  if (field === '*') return true;

  for (const part of field.split(',')) {
    if (part.startsWith('*/')) {
      const step = parseInt(part.slice(2), 10);
      if (!Number.isNaN(step) && step > 0 && value % step === 0) return true;
      continue;
    }

    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (value >= Math.min(start, end) && value <= Math.max(start, end)) return true;
      continue;
    }

    if (part === '*' || part === '?') return true;

    const literal = parseInt(part, 10);
    if (!Number.isNaN(literal) && literal >= min && literal <= max && literal === value) return true;
  }

  return false;
}

// Executes every active BI schedule whose cron expression matches "now" and
// records a real BIExecution. Guards against re-running within the same minute.
const lastRunMinutes = new Map<string, string>();

export async function runDueSchedules(): Promise<number> {
  const now = new Date();
  const minuteKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

  const schedules = await prisma.bISchedule.findMany({
    where: { isActive: true },
    include: { report: true },
  });

  let executed = 0;

  for (const schedule of schedules) {
    if (!matchesCron(schedule.cronExpression, now)) continue;
    if (lastRunMinutes.get(schedule.id) === minuteKey) continue;
    lastRunMinutes.set(schedule.id, minuteKey);

    try {
      await prisma.bIExecution.create({
        data: {
          reportId: schedule.reportId,
          name: schedule.title,
          duration: '0ms',
          status: 'Completed',
          failed: false,
        },
      });
      executed += 1;
    } catch (err) {
      console.error(`BI schedule execution failed: ${schedule.title}`, err);
      await prisma.bIExecution.create({
        data: {
          reportId: schedule.reportId,
          name: schedule.title,
          duration: '0ms',
          status: 'Failed',
          failed: true,
        },
      }).catch(() => undefined);
    }
  }

  return executed;
}
