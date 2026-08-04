import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import {
  convertToUsd,
  formatPercentChange,
  formatUsdCompact,
} from '../../shared/currency/exchange-rate';
import { logFinancialActivity } from '../../shared/finance/financial-activity';
import type {
  ActivitiesQuery,
  CashflowQuery,
  CreateEventBody,
  DashboardQuery,
  EventsQuery,
  ExportQuery,
  InvoiceStatusQuery,
  UpdateEventBody,
} from './cfo.schema';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const DISPLAY_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function periodRange(period: 'month' | 'quarter' | 'year', offset = 0): { start: Date; end: Date } {
  const now = new Date();
  if (period === 'month') {
    const start = addMonths(startOfMonth(now), offset);
    return { start, end: endOfMonth(start) };
  }
  if (period === 'quarter') {
    const quarterMonth = Math.floor(now.getUTCMonth() / 3) * 3 + offset * 3;
    const start = new Date(Date.UTC(now.getUTCFullYear(), quarterMonth, 1));
    const end = endOfMonth(addMonths(start, 2));
    return { start, end };
  }
  const start = new Date(Date.UTC(now.getUTCFullYear() + offset, 0, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear() + offset, 11, 31, 23, 59, 59, 999));
  return { start, end };
}

function previousPeriodRange(period: 'month' | 'quarter' | 'year'): { start: Date; end: Date } {
  if (period === 'month') return periodRange('month', -1);
  if (period === 'quarter') return periodRange('quarter', -1);
  return periodRange('year', -1);
}

function isOverdueInvoice(invoice: { dueDate: Date; status: string }): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(invoice.dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED';
}

function netToActivityLevel(absNetUsd: number): number {
  if (absNetUsd <= 0) return 0;
  if (absNetUsd < 10_000) return 1;
  if (absNetUsd < 50_000) return 2;
  if (absNetUsd < 100_000) return 3;
  if (absNetUsd < 500_000) return 4;
  return 5;
}

async function writeAuditLog(
  tx: { auditLog: { create: (args: { data: { userId: string; action: string; metadata: Prisma.InputJsonValue } }) => Promise<unknown> } },
  userId: string,
  action: string,
  metadata: Prisma.InputJsonValue,
) {
  await tx.auditLog.create({
    data: { userId, action, metadata },
  });
}

export async function getUserContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });

  if (!user) return null;

  return {
    firstName: user.employee?.firstName ?? user.email.split('@')[0],
    lastName: user.employee?.lastName ?? '',
    email: user.email,
    role: user.role,
  };
}

async function sumInvoicesInRange(start: Date, end: Date, statuses: string[]) {
  const invoices = await prisma.invoice.findMany({
    where: {
      invoiceDate: { gte: start, lte: end },
      status: { in: statuses as any },
    },
    select: { totalDue: true, currencyCode: true, taxTotal: true },
  });

  let revenue = 0;
  let tax = 0;
  for (const inv of invoices) {
    revenue += await convertToUsd(Number(inv.totalDue), inv.currencyCode);
    tax += await convertToUsd(Number(inv.taxTotal), inv.currencyCode);
  }
  return { revenue, tax };
}

async function sumOutstandingInvoices(asOfEnd?: Date) {
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      ...(asOfEnd ? { invoiceDate: { lte: asOfEnd } } : {}),
    },
    select: { totalDue: true, currencyCode: true, dueDate: true, status: true },
  });

  let total = 0;
  for (const inv of invoices) {
    if (isOverdueInvoice(inv) || ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status)) {
      total += await convertToUsd(Number(inv.totalDue), inv.currencyCode);
    }
  }
  return total;
}

async function sumPayrollInRange(start: Date, end: Date) {
  const payrolls = await prisma.payroll.findMany({
    where: {
      periodStart: { gte: start },
      periodEnd: { lte: end },
      status: { in: ['APPROVED', 'PAID'] },
    },
    select: { totalNet: true, taxWithheld: true },
  });

  let cost = 0;
  let tax = 0;
  for (const p of payrolls) {
    cost += Number(p.totalNet);
    tax += Number(p.taxWithheld);
  }
  return { cost, tax };
}

export async function getDashboardMetrics(_query: DashboardQuery) {
  const current = periodRange('month', 0);
  const previous = previousPeriodRange('month');

  const [currentRevenue, previousRevenue, currentPayroll, previousPayroll, outstanding, previousOutstanding, currentTaxInv, previousTaxInv, currentTaxPay, previousTaxPay] =
    await Promise.all([
      sumInvoicesInRange(current.start, current.end, ['PAID']),
      sumInvoicesInRange(previous.start, previous.end, ['PAID']),
      sumPayrollInRange(current.start, current.end),
      sumPayrollInRange(previous.start, previous.end),
      sumOutstandingInvoices(),
      sumOutstandingInvoices(previous.end),
      sumInvoicesInRange(current.start, current.end, ['PAID', 'SENT', 'PARTIALLY_PAID', 'OVERDUE']),
      sumInvoicesInRange(previous.start, previous.end, ['PAID', 'SENT', 'PARTIALLY_PAID', 'OVERDUE']),
      sumPayrollInRange(current.start, current.end),
      sumPayrollInRange(previous.start, previous.end),
    ]);

  const currentTax = currentTaxInv.tax + currentTaxPay.tax;
  const previousTax = previousTaxInv.tax + previousTaxPay.tax;

  const revenueChange = formatPercentChange(currentRevenue.revenue, previousRevenue.revenue);
  const payrollChange = formatPercentChange(currentPayroll.cost, previousPayroll.cost);
  const outstandingChange = formatPercentChange(outstanding, previousOutstanding);
  const taxChange = formatPercentChange(currentTax, previousTax);

  return [
    {
      id: 'total-revenue',
      title: 'Total Revenue',
      subtitle: 'Total revenue still this month',
      value: formatUsdCompact(currentRevenue.revenue),
      change: revenueChange,
      isPositive: currentRevenue.revenue >= previousRevenue.revenue,
    },
    {
      id: 'payroll-cost',
      title: 'Payroll Cost',
      subtitle: 'Total payroll cost this month',
      value: formatUsdCompact(currentPayroll.cost),
      change: payrollChange,
      isPositive: currentPayroll.cost <= previousPayroll.cost,
    },
    {
      id: 'outstanding-invoices',
      title: 'Outstanding Invoices',
      subtitle: 'Total unpaid still this month',
      value: formatUsdCompact(outstanding),
      change: outstandingChange,
      isPositive: false,
    },
    {
      id: 'tax-liability',
      title: 'Tax Liability',
      subtitle: 'Estimated tax this period',
      value: formatUsdCompact(currentTax),
      change: taxChange,
      isPositive: currentTax >= previousTax,
    },
  ];
}

export async function getInvoiceStatus(query: InvoiceStatusQuery) {
  const { start, end } = periodRange(query.period, 0);
  const invoices = await prisma.invoice.findMany({
    where: { invoiceDate: { gte: start, lte: end } },
    select: { status: true, dueDate: true },
  });

  let paid = 0;
  let pending = 0;
  let overdue = 0;
  let draft = 0;

  for (const inv of invoices) {
    if (inv.status === 'PAID') {
      paid += 1;
    } else if (inv.status === 'DRAFT') {
      draft += 1;
    } else if (isOverdueInvoice(inv)) {
      overdue += 1;
    } else if (inv.status === 'SENT' || inv.status === 'PARTIALLY_PAID') {
      pending += 1;
    } else if (inv.status === 'OVERDUE') {
      overdue += 1;
    }
  }

  const total = paid + pending + overdue + draft;
  const segments = [
    { label: 'Paid', count: paid, left: paid, color: 'bg-[#735BF2]' },
    { label: 'Pending', count: pending, left: pending, color: 'bg-amber-500' },
    { label: 'Overdue', count: overdue, left: overdue, color: 'bg-rose-500' },
    { label: 'Draft', count: draft, left: draft, color: 'bg-sky-400' },
  ];

  return { total, segments };
}

export async function getCashflowOverview(query: CashflowQuery) {
  const now = new Date();
  let rangeStart: Date;
  let rangeEnd: Date;

  if (query.period === 'year') {
    const year = now.getUTCFullYear() + query.offset;
    rangeStart = new Date(Date.UTC(year, 0, 1));
    rangeEnd = new Date(Date.UTC(year, 11, 31));
  } else if (query.period === 'quarter') {
    const base = periodRange('quarter', query.offset);
    rangeStart = base.start;
    rangeEnd = base.end;
  } else {
    const base = periodRange('month', query.offset);
    rangeStart = base.start;
    rangeEnd = base.end;
  }

  const prevStart = addMonths(rangeStart, query.period === 'year' ? -12 : query.period === 'quarter' ? -3 : -1);
  const prevEnd = new Date(rangeStart.getTime() - 1);

  const [currentRows, previousRows] = await Promise.all([
    prisma.dailyCashflow.findMany({
      where: { date: { gte: rangeStart, lte: rangeEnd } },
      orderBy: { date: 'asc' },
    }),
    prisma.dailyCashflow.findMany({
      where: { date: { gte: prevStart, lte: prevEnd } },
    }),
  ]);

  let currentNet = 0;
  for (const row of currentRows) {
    currentNet += await convertToUsd(Number(row.netAmount), row.currencyCode);
  }
  let previousNet = 0;
  for (const row of previousRows) {
    previousNet += await convertToUsd(Number(row.netAmount), row.currencyCode);
  }

  const percentage = formatPercentChange(currentNet, previousNet);

  const monthsToShow: { name: string; days: { label: string; activeDots: number }[] }[] = [];
  const monthCount = query.period === 'year' ? 3 : 1;
  const displayStart =
    query.period === 'year'
      ? addMonths(rangeStart, Math.max(0, rangeEnd.getUTCMonth() - 2))
      : rangeStart;

  for (let m = 0; m < monthCount; m++) {
    const monthStart = addMonths(displayStart, m);
    const monthEnd = endOfMonth(monthStart);
    const monthRows = currentRows.filter((r) => {
      const d = new Date(r.date);
      return d >= monthStart && d <= monthEnd;
    });

    const weekdayTotals = new Map<number, number>();
    for (const row of monthRows) {
      const d = new Date(row.date);
      const dow = d.getUTCDay();
      const netUsd = await convertToUsd(Number(row.netAmount), row.currencyCode);
      weekdayTotals.set(dow, (weekdayTotals.get(dow) ?? 0) + Math.abs(netUsd));
    }

    const days = DISPLAY_DAY_LABELS.map((label) => {
      const dowIndex = DAY_LABELS.indexOf(label as (typeof DAY_LABELS)[number]);
      const absNet = weekdayTotals.get(dowIndex) ?? 0;
      return { label, activeDots: netToActivityLevel(absNet) };
    });

    monthsToShow.push({
      name: monthStart.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }),
      days,
    });
  }

  const periodLabel =
    query.period === 'year' ? 'This Year' : query.period === 'quarter' ? 'This Quarter' : 'This Month';

  return {
    percentage,
    period: query.period,
    periodLabel,
    offset: query.offset,
    months: monthsToShow,
  };
}

export async function getTasks(assigneeUserId: string) {
  const tasks = await prisma.approvalTask.findMany({
    where: { assigneeUserId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      requester: {
        select: {
          firstName: true,
          lastName: true,
          designation: true,
          department: true,
        },
      },
    },
  });

  return tasks.map((task) => ({
    id: task.id,
    user: {
      name: `${task.requester.firstName} ${task.requester.lastName}`,
      role: task.requester.designation ?? task.requester.department ?? 'Staff',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(task.requester.firstName + '+' + task.requester.lastName)}&background=735BF2&color=fff`,
    },
    action: task.actionTitle,
    priority: task.priority.charAt(0) + task.priority.slice(1).toLowerCase(),
    date: task.dueAt
      ? task.dueAt.toISOString().slice(0, 10)
      : task.createdAt.toISOString().slice(0, 10),
    time: (task.dueAt ?? task.createdAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  }));
}

export async function acceptTask(taskId: string, userId: string) {
  const task = await prisma.approvalTask.findFirst({
    where: { id: taskId, assigneeUserId: userId, status: 'PENDING' },
  });

  if (!task) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.approvalTask.update({
      where: { id: taskId },
      data: { status: 'ACCEPTED', resolvedAt: new Date() },
    });

    if (task.entityType === 'PAYROLL') {
      await tx.payroll.update({
        where: { id: task.entityId },
        data: {
          status: 'APPROVED',
          approvedByUserId: userId,
          approvedAt: new Date(),
        },
      });
      await logFinancialActivity(tx, {
        category: 'PAYROLL',
        title: `Approved ${task.actionTitle}`,
        metadata: { taskId, entityId: task.entityId },
      });
    } else if (task.entityType === 'VENDOR_EXPENSE') {
      const payment = await tx.vendorPayment.findUnique({ where: { id: task.entityId } });
      if (payment) {
        await tx.vendorPayment.update({
          where: { id: task.entityId },
          data: { status: 'PAID', paidAt: new Date() },
        });
      }
      await logFinancialActivity(tx, {
        category: 'ACCOUNTS_PAYABLE',
        title: `Approved ${task.actionTitle}`,
        metadata: { taskId, entityId: task.entityId },
      });
    } else if (task.entityType === 'INVOICE') {
      await logFinancialActivity(tx, {
        category: 'INVOICE',
        title: `Approved ${task.actionTitle}`,
        metadata: { taskId, entityId: task.entityId },
      });
    }

    await writeAuditLog(tx, userId, 'CFO_TASK_ACCEPT', {
      taskId,
      entityType: task.entityType,
      entityId: task.entityId,
    });

    return updated;
  });
}

export async function cancelTask(taskId: string, userId: string) {
  const task = await prisma.approvalTask.findFirst({
    where: { id: taskId, assigneeUserId: userId, status: 'PENDING' },
  });

  if (!task) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.approvalTask.update({
      where: { id: taskId },
      data: { status: 'CANCELLED', resolvedAt: new Date() },
    });

    if (task.entityType === 'PAYROLL') {
      await tx.payroll.update({
        where: { id: task.entityId },
        data: { status: 'REJECTED', lifecycleStep: 'PAYROLL_RUN' },
      });

      await tx.payrollLineItem.updateMany({
        where: { payrollId: task.entityId },
        data: { status: 'PROCESSING', payslipId: null },
      });

      await tx.employeePayslip.deleteMany({
        where: { payrollId: task.entityId },
      });

      await logFinancialActivity(tx, {
        category: 'PAYROLL',
        title: `Rejected ${task.actionTitle}`,
        metadata: { taskId, entityId: task.entityId },
      });
    } else if (task.entityType === 'VENDOR_EXPENSE') {
      const payment = await tx.vendorPayment.findUnique({ where: { id: task.entityId } });
      if (payment) {
        await tx.vendorPayment.update({
          where: { id: task.entityId },
          data: { status: 'FAILED' },
        });
      }
      await logFinancialActivity(tx, {
        category: 'ACCOUNTS_PAYABLE',
        title: `Rejected ${task.actionTitle}`,
        metadata: { taskId, entityId: task.entityId },
      });
    } else if (task.entityType === 'INVOICE') {
      await logFinancialActivity(tx, {
        category: 'INVOICE',
        title: `Rejected ${task.actionTitle}`,
        metadata: { taskId, entityId: task.entityId },
      });
    }

    await writeAuditLog(tx, userId, 'CFO_TASK_CANCEL', {
      taskId,
      entityType: task.entityType,
      entityId: task.entityId,
    });

    return updated;
  });
}

export async function getActivities(query: ActivitiesQuery) {
  const activities = await prisma.financialActivity.findMany({
    orderBy: { occurredAt: 'desc' },
    take: query.limit,
  });

  const grouped = new Map<string, { id: string; title: string; timestamp: string }[]>();

  for (const activity of activities) {
    const category =
      activity.category === 'ACCOUNTS_PAYABLE'
        ? 'Accounts Payable'
        : activity.category.charAt(0) + activity.category.slice(1).toLowerCase();

    const items = grouped.get(category) ?? [];
    items.push({
      id: activity.id,
      title: activity.title,
      timestamp: activity.occurredAt.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).replace(',', ' —'),
    });
    grouped.set(category, items);
  }

  return Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

export async function getEvents(query: EventsQuery) {
  const now = new Date();
  const calendarBase = addMonths(startOfMonth(now), query.calendarOffset);
  const calendarEnd = endOfMonth(calendarBase);

  const weekStart = new Date(calendarBase);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay() + 3);
  if (weekStart.getUTCDay() === 3 && weekStart > calendarBase) {
    weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  }

  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);
    return {
      day: d.toLocaleString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      num: d.getUTCDate(),
      active: d.getUTCDate() === now.getUTCDate() && query.calendarOffset === 0,
      date: d.toISOString(),
    };
  });

  const events = await prisma.financialEvent.findMany({
    where: {
      startAt: {
        gte: query.from ?? now,
        ...(query.to ? { lte: query.to } : {}),
      },
    },
    orderBy: { startAt: 'asc' },
    take: 10,
  });

  return {
    calendar: {
      label: calendarBase.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
      offset: query.calendarOffset,
      days: calendarDays,
    },
    events: events.map((event) => ({
      id: event.id,
      time: event.startAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      title: event.title,
      subtitle: event.subtitle ?? '',
      description: event.subtitle ?? '',
      date: event.startAt.toISOString().slice(0, 10),
      startAt: event.startAt.toISOString(),
      endAt: event.endAt?.toISOString() ?? null,
      unit: event.unitLabel ?? '',
      highlighted: event.isHighlighted,
    })),
  };
}

function mapEventResponse(event: {
  id: string;
  title: string;
  subtitle: string | null;
  startAt: Date;
  endAt: Date | null;
  unitLabel: string | null;
  isHighlighted: boolean;
}) {
  return {
    id: event.id,
    time: event.startAt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    title: event.title,
    subtitle: event.subtitle ?? '',
    description: event.subtitle ?? '',
    date: event.startAt.toISOString().slice(0, 10),
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null,
    unit: event.unitLabel ?? '',
    highlighted: event.isHighlighted,
  };
}

export async function createEvent(userId: string, body: CreateEventBody) {
  const event = await prisma.financialEvent.create({
    data: {
      title: body.title,
      subtitle: body.description ?? null,
      startAt: body.startAt,
      endAt: body.endAt ?? null,
      isHighlighted: body.isHighlighted ?? false,
      createdByUserId: userId,
    },
  });

  await writeAuditLog(prisma, userId, 'CFO_EVENT_CREATE', {
    eventId: event.id,
    title: event.title,
  });

  return mapEventResponse(event);
}

export async function updateEvent(eventId: string, userId: string, body: UpdateEventBody) {
  const existing = await prisma.financialEvent.findUnique({ where: { id: eventId } });
  if (!existing) return null;

  const event = await prisma.financialEvent.update({
    where: { id: eventId },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { subtitle: body.description } : {}),
      ...(body.startAt !== undefined ? { startAt: body.startAt } : {}),
      ...(body.endAt !== undefined ? { endAt: body.endAt } : {}),
      ...(body.isHighlighted !== undefined ? { isHighlighted: body.isHighlighted } : {}),
    },
  });

  await writeAuditLog(prisma, userId, 'CFO_EVENT_UPDATE', {
    eventId: event.id,
    title: event.title,
  });

  return mapEventResponse(event);
}

export async function deleteEvent(eventId: string, userId: string) {
  const existing = await prisma.financialEvent.findUnique({ where: { id: eventId } });
  if (!existing) return null;

  await prisma.financialEvent.delete({ where: { id: eventId } });
  await writeAuditLog(prisma, userId, 'CFO_EVENT_DELETE', {
    eventId,
    title: existing.title,
  });

  return existing;
}

export async function buildExportCsv(query: ExportQuery, userId: string) {
  const [metrics, invoiceStatus, cashflow, tasks, activities, events, user] = await Promise.all([
    getDashboardMetrics({ invoicePeriod: 'month' }),
    getInvoiceStatus({ period: 'month' }),
    getCashflowOverview({ period: 'year', offset: 0 }),
    getTasks(userId),
    getActivities({ limit: 50 }),
    getEvents({ calendarOffset: 0 }),
    getUserContext(userId),
  ]);

  const lines: string[] = [
    'Antrosys ERP — CFO Dashboard Export',
    `Generated,${new Date().toISOString()}`,
    `Range,${query.fromDate.toISOString().slice(0, 10)} to ${query.toDate.toISOString().slice(0, 10)}`,
    `Prepared For,${user?.firstName ?? 'User'} ${user?.lastName ?? ''}`,
    '',
    'METRICS',
    'Title,Value,Change',
    ...metrics.map((m) => `${m.title},${m.value},${m.change}`),
    '',
    'INVOICE STATUS',
    'Segment,Count,Remaining',
    ...invoiceStatus.segments.map((s) => `${s.label},${s.count},${s.left}`),
    '',
    'CASHFLOW',
    `Period Change,${cashflow.percentage}`,
    '',
    'PENDING TASKS',
    'Action,Priority,Requester',
    ...tasks.map((t) => `"${t.action}",${t.priority},"${t.user.name}"`),
    '',
    'RECENT ACTIVITIES',
    'Category,Title,Timestamp',
    ...activities.flatMap((g) =>
      g.items.map((i) => `"${g.category}","${i.title}","${i.timestamp}"`),
    ),
    '',
    'UPCOMING EVENTS',
    'Title,Date,Time',
    ...events.events.map((e) => `"${e.title}",${e.date},${e.time}`),
  ];

  return lines.join('\n');
}
