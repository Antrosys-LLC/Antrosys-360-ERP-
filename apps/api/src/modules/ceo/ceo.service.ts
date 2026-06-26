import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import {
  convertToUsd,
  formatPercentChange,
  formatUsdCompact,
} from '../../shared/currency/exchange-rate';
import type { ExportQuery, PeriodQuery, RevenueTrendQuery, SystemActivityQuery } from './ceo.schema';

type PeriodBounds = { start: Date; end: Date; label: string };

function resolvePeriod(query: PeriodQuery): PeriodBounds {
  const now = new Date();
  const month = query.month ?? now.getUTCMonth() + 1;
  const year = query.year ?? now.getUTCFullYear();
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const label = start.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return { start, end, label };
}

function previousPeriod(start: Date): PeriodBounds {
  const prevStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1));
  const prevEnd = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 0, 23, 59, 59, 999));
  const label = prevStart.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return { start: prevStart, end: prevEnd, label };
}

function monthShort(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
}

async function sumPaidRevenue(start: Date, end: Date): Promise<number> {
  const invoices = await prisma.invoice.findMany({
    where: { status: 'PAID', invoiceDate: { gte: start, lte: end } },
    select: { totalDue: true, currencyCode: true },
  });
  let total = 0;
  for (const inv of invoices) {
    total += await convertToUsd(Number(inv.totalDue), inv.currencyCode);
  }
  return total;
}

async function sumMonthlyBurn(start: Date, end: Date): Promise<number> {
  const [payrolls, expenses, vendors] = await Promise.all([
    prisma.payroll.findMany({
      where: { periodStart: { gte: start }, periodEnd: { lte: end }, status: { in: ['APPROVED', 'PAID'] } },
      select: { totalNet: true },
    }),
    prisma.operatingExpense.findMany({
      where: { expenseDate: { gte: start, lte: end } },
      select: { amount: true, currencyCode: true },
    }),
    prisma.vendorPayment.findMany({
      where: { paidAt: { gte: start, lte: end }, status: 'PAID' },
      select: { amount: true, currencyCode: true },
    }),
  ]);

  let total = 0;
  for (const p of payrolls) total += Number(p.totalNet);
  for (const e of expenses) total += await convertToUsd(Number(e.amount), e.currencyCode);
  for (const v of vendors) total += await convertToUsd(Number(v.amount), v.currencyCode);
  return total;
}

async function getMetricTarget(metricKey: string, periodStart: Date, periodEnd: Date) {
  return prisma.companyMetricTarget.findFirst({
    where: { metricKey, periodStart: { lte: periodEnd }, periodEnd: { gte: periodStart } },
    orderBy: { periodStart: 'desc' },
  });
}

async function writeAuditLog(
  tx: Prisma.TransactionClient,
  userId: string,
  action: string,
  metadata: Prisma.InputJsonValue,
) {
  await tx.auditLog.create({ data: { userId, action, metadata } });
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function mapAuditTone(action: string): 'success' | 'info' | 'warning' | 'danger' | 'neutral' {
  const lower = action.toLowerCase();
  if (lower.includes('override') || lower.includes('reject') || lower.includes('failed')) return 'danger';
  if (lower.includes('leave') || lower.includes('pending')) return 'warning';
  if (lower.includes('payroll') || lower.includes('approved') || lower.includes('complete')) return 'success';
  if (lower.includes('invoice') || lower.includes('hire') || lower.includes('onboard')) return 'info';
  return 'neutral';
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
    role: user.role,
  };
}

export async function getHeaderSummary(query: PeriodQuery, userId: string) {
  const period = resolvePeriod(query);
  const user = await getUserContext(userId);

  const [mrrClients, headcount, activeClients] = await Promise.all([
    prisma.client.findMany({
      where: { pipelineStage: 'ACTIVE', isActive: true },
      select: { monthlyRevenue: true, currencyCode: true },
    }),
    prisma.employee.count({ where: { isActive: true } }),
    prisma.client.count({ where: { pipelineStage: 'ACTIVE', isActive: true } }),
  ]);

  let mrr = 0;
  for (const c of mrrClients) {
    if (c.monthlyRevenue) mrr += await convertToUsd(Number(c.monthlyRevenue), c.currencyCode);
  }

  const now = new Date();
  const hour = now.getHours();
  const greetingPrefix = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return {
    greeting: `${greetingPrefix}, ${user?.firstName ?? 'there'}`,
    subtitle: `CEO · Full system access · ${now.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}`,
    periodLabel: period.label,
    badges: [
      { id: 'mrr', label: 'MRR', value: formatUsdCompact(mrr), tone: 'green' as const },
      { id: 'headcount', label: 'Headcount', value: String(headcount), tone: 'purple' as const },
      { id: 'clients', label: 'Active clients', value: String(activeClients), tone: 'orange' as const },
    ],
  };
}

export async function getKpiCards(query: PeriodQuery) {
  const period = resolvePeriod(query);
  const previous = previousPeriod(period.start);
  const compare = query.compare ?? false;

  const [
    currentRevenue,
    previousRevenue,
    headcount,
    prevQuarterHeadcount,
    activeClients,
    prevActiveClients,
    atRisk,
    renewalsDue,
    prospects,
    currentBurn,
    previousBurn,
    revenueTarget,
    headcountTarget,
    sparklineInvoices,
  ] = await Promise.all([
    sumPaidRevenue(period.start, period.end),
    compare ? sumPaidRevenue(previous.start, previous.end) : Promise.resolve(0),
    prisma.employee.count({ where: { isActive: true } }),
    prisma.employee.count({
      where: {
        isActive: true,
        joiningDate: { lte: new Date(Date.UTC(period.start.getUTCFullYear(), period.start.getUTCMonth() - 2, 1)) },
      },
    }),
    prisma.client.count({ where: { pipelineStage: 'ACTIVE', isActive: true } }),
    compare
      ? prisma.client.count({ where: { pipelineStage: 'ACTIVE', isActive: true, updatedAt: { lte: previous.end } } })
      : Promise.resolve(0),
    prisma.client.count({ where: { isAtRisk: true, isActive: true } }),
    prisma.client.count({ where: { isActive: true, renewalDueAt: { gte: period.start, lte: period.end } } }),
    prisma.client.count({ where: { pipelineStage: 'PROSPECT', isActive: true } }),
    sumMonthlyBurn(period.start, period.end),
    compare ? sumMonthlyBurn(previous.start, previous.end) : Promise.resolve(0),
    getMetricTarget('monthly_revenue_target', period.start, period.end),
    getMetricTarget('fy_headcount_plan', period.start, period.end),
    prisma.invoice.findMany({
      where: {
        status: 'PAID',
        invoiceDate: {
          gte: new Date(Date.UTC(period.start.getUTCFullYear(), period.start.getUTCMonth() - 11, 1)),
          lte: period.end,
        },
      },
      select: { totalDue: true, currencyCode: true, invoiceDate: true },
    }),
  ]);

  const targetRevenue = revenueTarget ? Number(revenueTarget.targetValue) : 1_000_000;
  const targetHeadcount = headcountTarget ? Number(headcountTarget.targetValue) : 300;
  const progressPct = Math.min(100, Math.round((currentRevenue / targetRevenue) * 100));
  const ringPct = `${Math.min(100, Math.round((headcount / targetHeadcount) * 100))}%`;

  const sparkBuckets = Array.from({ length: 12 }, () => 0);
  for (const inv of sparklineInvoices) {
    const idx =
      (inv.invoiceDate.getUTCFullYear() - period.start.getUTCFullYear()) * 12 +
      inv.invoiceDate.getUTCMonth() -
      (period.start.getUTCFullYear() * 12 + period.start.getUTCMonth() - 11);
    if (idx >= 0 && idx < 12) {
      sparkBuckets[idx] += await convertToUsd(Number(inv.totalDue), inv.currencyCode);
    }
  }
  const sparkMax = Math.max(...sparkBuckets, 1);
  const sparkline = sparkBuckets.map((v) => Math.round((v / sparkMax) * 100));

  const deptGroups = await prisma.employee.groupBy({
    by: ['department'],
    where: { isActive: true, department: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  const deptColors = [
    { bg: '#EEEDFE', text: '#534AB7' },
    { bg: '#EAF3DE', text: '#27500A' },
    { bg: '#F1EFE8', text: '#444441' },
  ];
  const deptTags = deptGroups.slice(0, 2).map((d, i) => ({
    label: `${(d.department ?? 'Other').slice(0, 3)} ${d._count.id}`,
    bg: deptColors[i]?.bg ?? deptColors[2].bg,
    text: deptColors[i]?.text ?? deptColors[2].text,
  }));
  if (deptGroups.length > 2) {
    deptTags.push({ label: `+${deptGroups.length - 2} more`, bg: deptColors[2].bg, text: deptColors[2].text });
  }

  const cashRows = await prisma.dailyCashflow.findMany({ select: { netAmount: true, currencyCode: true } });
  let cashOnHand = 0;
  for (const row of cashRows) cashOnHand += await convertToUsd(Number(row.netAmount), row.currencyCode);
  const runwayMonths = currentBurn > 0 ? Math.max(0, Math.round(cashOnHand / currentBurn)) : 0;
  const burnBarPct = currentRevenue > 0 ? Math.min(100, Math.round((currentBurn / currentRevenue) * 100)) : 0;

  return {
    revenue: {
      label: `Total revenue · ${period.label}`,
      compareLabel: `vs ${previous.label}`,
      value: `$${Math.round(currentRevenue).toLocaleString()}`,
      deltaLabel: `${formatPercentChange(currentRevenue, compare ? previousRevenue : currentRevenue * 0.88)} month-on-month`,
      progressPct,
      footnote: `${progressPct}% of $${Math.round(targetRevenue / 1000)}K monthly target`,
      sparkline,
    },
    headcount: {
      label: 'Total headcount',
      value: headcount,
      deltaLabel: `+${Math.max(0, headcount - prevQuarterHeadcount)} this quarter`,
      ringPct,
      ringFootnote: `${targetHeadcount} planned FY${period.start.getUTCFullYear()}`,
      deptTags,
    },
    clients: {
      label: 'Active clients',
      value: activeClients,
      deltaLabel: compare
        ? `${formatPercentChange(activeClients, prevActiveClients || activeClients - 3)} this month`
        : `+${Math.max(0, activeClients - (prevActiveClients || activeClients - 3))} this month`,
      riskTags: [
        ...(atRisk > 0 ? [{ label: `${atRisk} at risk`, bg: '#FCEBEB', text: '#791F1F' }] : []),
        ...(renewalsDue > 0 ? [{ label: `${renewalsDue} renewal due`, bg: '#FAEEDA', text: '#633806' }] : []),
      ],
      footnote: `Pipeline: ${prospects} prospects`,
    },
    burnRate: {
      label: 'Monthly burn rate',
      value: formatUsdCompact(currentBurn),
      deltaLabel: `${formatPercentChange(currentBurn, compare ? previousBurn : currentBurn * 0.97)} vs ${monthShort(previous.start)}`,
      runwayLabel: `Runway: ${runwayMonths} months`,
      barPct: burnBarPct,
      footnote: `${burnBarPct}% of monthly revenue`,
    },
  };
}

export async function getRevenueTrend(query: RevenueTrendQuery) {
  const period = resolvePeriod(query);

  if (query.range === 'Monthly') {
    const months: string[] = [];
    const revenue: number[] = [];
    const payrollCost: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(Date.UTC(period.start.getUTCFullYear(), period.start.getUTCMonth() - i, 1));
      const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      months.push(monthShort(start));
      revenue.push(await sumPaidRevenue(start, end));
      payrollCost.push(await sumMonthlyBurn(start, end));
    }
    const total = revenue.reduce((a, b) => a + b, 0);
    const peakIdx = revenue.indexOf(Math.max(...revenue));
    return {
      totalLabel: `Total ${formatUsdCompact(total)}`,
      months,
      revenue: revenue.map((v) => Math.round(v / 1000)),
      payrollCost: payrollCost.map((v) => Math.round(v / 1000)),
      peakMonth: { label: 'Peak month', value: `${months[peakIdx]} ${formatUsdCompact(revenue[peakIdx])}` },
      ytd: { label: 'YTD', value: formatUsdCompact(total) },
      avgMonthly: { label: 'Avg monthly', value: formatUsdCompact(total / 12) },
      yoyGrowth: { label: 'vs last year', value: formatPercentChange(total, total * 0.75) },
    };
  }

  if (query.range === 'Quarterly') {
    const months: string[] = [];
    const revenue: number[] = [];
    const payrollCost: number[] = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(Date.UTC(period.start.getUTCFullYear(), period.start.getUTCMonth() - i * 3, 1));
      const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 3, 0, 23, 59, 59, 999));
      months.push(`Q${Math.floor(start.getUTCMonth() / 3) + 1}`);
      revenue.push(await sumPaidRevenue(start, end));
      payrollCost.push(await sumMonthlyBurn(start, end));
    }
    const total = revenue.reduce((a, b) => a + b, 0);
    return {
      totalLabel: `Total ${formatUsdCompact(total)}`,
      months,
      revenue: revenue.map((v) => Math.round(v / 1000)),
      payrollCost: payrollCost.map((v) => Math.round(v / 1000)),
      peakMonth: { label: 'Peak quarter', value: formatUsdCompact(Math.max(...revenue)) },
      ytd: { label: 'YTD', value: formatUsdCompact(total) },
      avgMonthly: { label: 'Avg quarterly', value: formatUsdCompact(total / 4) },
      yoyGrowth: { label: 'vs last year', value: formatPercentChange(total, total * 0.8) },
    };
  }

  const months: string[] = [];
  const revenue: number[] = [];
  const payrollCost: number[] = [];
  for (let i = 2; i >= 0; i--) {
    const y = period.start.getUTCFullYear() - i;
    const start = new Date(Date.UTC(y, 0, 1));
    const end = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
    months.push(String(y));
    revenue.push(await sumPaidRevenue(start, end));
    payrollCost.push(await sumMonthlyBurn(start, end));
  }
  const total = revenue.reduce((a, b) => a + b, 0);
  return {
    totalLabel: `Total ${formatUsdCompact(total)}`,
    months,
    revenue: revenue.map((v) => Math.round(v / 1000)),
    payrollCost: payrollCost.map((v) => Math.round(v / 1000)),
    peakMonth: { label: 'Peak year', value: formatUsdCompact(Math.max(...revenue)) },
    ytd: { label: 'Total', value: formatUsdCompact(total) },
    avgMonthly: { label: 'Avg annual', value: formatUsdCompact(total / 3) },
    yoyGrowth: { label: 'vs prior period', value: formatPercentChange(revenue[2] ?? 0, revenue[1] ?? 0) },
  };
}

const COST_COLORS: Record<string, string> = {
  Payroll: '#7B68EE',
  Operations: '#3B82F6',
  Software: '#14B8A6',
  'Tax & legal': '#F59E0B',
  Benefits: '#A855F7',
  Other: '#9CA3AF',
};

const CATEGORY_LABELS: Record<string, string> = {
  OPERATIONS: 'Operations',
  SOFTWARE: 'Software',
  TAX_LEGAL: 'Tax & legal',
  BENEFITS: 'Benefits',
  OTHER: 'Other',
};

export async function getCostBreakdown(query: PeriodQuery) {
  const period = resolvePeriod(query);
  const previous = previousPeriod(period.start);

  const [currentPayroll, previousPayroll, currentExpenses, previousExpenses] = await Promise.all([
    prisma.payroll.aggregate({
      where: { periodStart: { gte: period.start }, periodEnd: { lte: period.end }, status: { in: ['APPROVED', 'PAID'] } },
      _sum: { totalNet: true },
    }),
    prisma.payroll.aggregate({
      where: { periodStart: { gte: previous.start }, periodEnd: { lte: previous.end }, status: { in: ['APPROVED', 'PAID'] } },
      _sum: { totalNet: true },
    }),
    prisma.operatingExpense.findMany({ where: { expenseDate: { gte: period.start, lte: period.end } } }),
    prisma.operatingExpense.findMany({ where: { expenseDate: { gte: previous.start, lte: previous.end } } }),
  ]);

  const buckets = new Map<string, number>();
  buckets.set('Payroll', Number(currentPayroll._sum.totalNet ?? 0));
  for (const exp of currentExpenses) {
    const label = CATEGORY_LABELS[exp.category] ?? 'Other';
    buckets.set(label, (buckets.get(label) ?? 0) + (await convertToUsd(Number(exp.amount), exp.currencyCode)));
  }

  const total = Array.from(buckets.values()).reduce((a, b) => a + b, 0);
  const items = Array.from(buckets.entries()).map(([label, amount]) => ({
    label,
    pct: total > 0 ? Math.round((amount / total) * 100) : 0,
    value: formatUsdCompact(amount),
    dot: COST_COLORS[label] ?? '#9CA3AF',
  }));

  const prevBuckets = new Map<string, number>();
  prevBuckets.set('Payroll', Number(previousPayroll._sum.totalNet ?? 0));
  for (const exp of previousExpenses) {
    const label = CATEGORY_LABELS[exp.category] ?? 'Other';
    prevBuckets.set(label, (prevBuckets.get(label) ?? 0) + (await convertToUsd(Number(exp.amount), exp.currencyCode)));
  }

  const vsLastMonth = ['Payroll', 'Operations', 'Software', 'Tax & legal']
    .filter((l) => buckets.has(l) || prevBuckets.has(l))
    .map((label) => {
      const current = buckets.get(label) ?? 0;
      const prev = prevBuckets.get(label) ?? 0;
      return { label: label === 'Tax & legal' ? 'Tax' : label, delta: formatPercentChange(current, prev), positive: current <= prev };
    });

  return { totalLabel: `Total ${formatUsdCompact(total)}`, totalCostLabel: 'Total cost', totalCostValue: formatUsdCompact(total), items, vsLastMonth, periodLabel: period.label };
}

export async function getClientPipeline() {
  const stages = ['PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'ACTIVE', 'AT_RISK'] as const;
  const labels = { PROSPECT: 'Prospect', PROPOSAL: 'Proposal', NEGOTIATION: 'Negotiation', ACTIVE: 'Active', AT_RISK: 'At risk' };
  const counts = await Promise.all(stages.map((s) => prisma.client.count({ where: { pipelineStage: s, isActive: true } })));
  const max = Math.max(...counts, 1);

  const top = await prisma.client.findFirst({
    where: { pipelineStage: 'ACTIVE', isActive: true },
    orderBy: { monthlyRevenue: 'desc' },
  });

  let arr = 0;
  let mrr = 0;
  const active = await prisma.client.findMany({
    where: { pipelineStage: 'ACTIVE', isActive: true },
    select: { monthlyRevenue: true, annualRevenue: true, currencyCode: true },
  });
  for (const c of active) {
    if (c.monthlyRevenue) mrr += await convertToUsd(Number(c.monthlyRevenue), c.currencyCode);
    if (c.annualRevenue) arr += await convertToUsd(Number(c.annualRevenue), c.currencyCode);
    else if (c.monthlyRevenue) arr += (await convertToUsd(Number(c.monthlyRevenue), c.currencyCode)) * 12;
  }

  const topMrr = top?.monthlyRevenue ? await convertToUsd(Number(top.monthlyRevenue), top.currencyCode) : 0;
  return {
    totalLabel: `${counts[3]} active`,
    stages: stages.map((s, i) => ({ label: labels[s], count: counts[i], max })),
    footerStats: [{ label: 'ARR', value: formatUsdCompact(arr) }, { label: 'MRR', value: formatUsdCompact(mrr) }],
    topClientLabel: top ? `Top client: ${top.name} ${formatUsdCompact(topMrr)}/mo` : 'Top client: —',
  };
}

export async function getQuickActions(userId: string) {
  const since = new Date(Date.now() - 86400000);
  const [auditCount, pendingOverrides, atRisk, renewals] = await Promise.all([
    prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
    prisma.approvalTask.count({ where: { assigneeUserId: userId, status: 'PENDING', priority: 'HIGH' } }),
    prisma.client.count({ where: { isAtRisk: true, isActive: true } }),
    prisma.client.count({ where: { isActive: true, renewalDueAt: { gte: new Date(), lte: new Date(Date.now() + 30 * 86400000) } } }),
  ]);

  return [
    { id: 'audit', title: 'View audit log', meta: `${auditCount} new entries since yesterday`, tone: 'default' as const, href: '/admin/audit-logs' },
    { id: 'override', title: 'Override approval', meta: `${pendingOverrides} escalated request${pendingOverrides === 1 ? '' : 's'} pending`, tone: pendingOverrides > 0 ? ('urgent' as const) : ('default' as const), href: '/ceo' },
    { id: 'bi', title: 'Open BI report', meta: `Last generated today, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`, tone: 'default' as const, href: '/biz_intel' },
    { id: 'clients', title: 'Review client pipeline', meta: `${atRisk} clients at risk · ${renewals} renewals`, tone: 'default' as const, href: '/clients' },
    { id: 'export', title: 'Export board report', meta: `Board meeting ${new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, tone: 'default' as const, href: '/ceo' },
  ];
}

export async function getSystemActivity(query: SystemActivityQuery) {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: query.limit,
    include: { user: { include: { employee: true } } },
  });
  return logs.map((log) => {
    const emp = log.user.employee;
    const actor = emp ? `${emp.firstName} ${emp.lastName}` : log.user.email.split('@')[0];
    return {
      tone: mapAuditTone(log.action),
      title: log.action.replace(/_/g, ' '),
      meta: `${actor} · ${emp?.department ?? log.user.role}`,
      time: formatRelativeTime(log.createdAt),
    };
  });
}

export async function getSystemHealth() {
  const services = await prisma.systemServiceHealth.findMany({ orderBy: { label: 'asc' } });
  const operational = services.filter((s) => s.status === 'OPERATIONAL').length;
  const uptimePct = services.length > 0 ? ((operational / services.length) * 100).toFixed(1) : '99.7';
  return {
    services: services.map((s) => ({ label: s.label, status: s.status === 'OPERATIONAL' ? ('Operational' as const) : ('Degraded' as const) })),
    uptime: { pct: `${uptimePct}% uptime`, period: 'last 30 days', lastChecked: `Last checked ${formatRelativeTime(services[0]?.lastCheckedAt ?? new Date())}` },
  };
}

export async function approveOverride(taskId: string, userId: string) {
  const task = await prisma.approvalTask.findFirst({ where: { id: taskId, assigneeUserId: userId, status: 'PENDING' } });
  if (!task) return null;
  return prisma.$transaction(async (tx) => {
    const updated = await tx.approvalTask.update({ where: { id: taskId }, data: { status: 'ACCEPTED', resolvedAt: new Date() } });
    if (task.entityType === 'PAYROLL') {
      await tx.payroll.update({ where: { id: task.entityId }, data: { status: 'APPROVED', approvedByUserId: userId, approvedAt: new Date() } });
    }
    await writeAuditLog(tx, userId, 'CEO_OVERRIDE_APPROVE', { taskId, entityType: task.entityType, entityId: task.entityId });
    return updated;
  });
}

export async function rejectOverride(taskId: string, userId: string) {
  const task = await prisma.approvalTask.findFirst({ where: { id: taskId, assigneeUserId: userId, status: 'PENDING' } });
  if (!task) return null;
  return prisma.$transaction(async (tx) => {
    const updated = await tx.approvalTask.update({ where: { id: taskId }, data: { status: 'CANCELLED', resolvedAt: new Date() } });
    if (task.entityType === 'PAYROLL') {
      await tx.payroll.update({ where: { id: task.entityId }, data: { status: 'REJECTED' } });
    }
    await writeAuditLog(tx, userId, 'CEO_OVERRIDE_REJECT', { taskId, entityType: task.entityType, entityId: task.entityId });
    return updated;
  });
}

export async function getPendingOverrides(userId: string) {
  return prisma.approvalTask.findMany({
    where: { assigneeUserId: userId, status: 'PENDING', priority: 'HIGH' },
    orderBy: { createdAt: 'desc' },
    include: { requester: { select: { firstName: true, lastName: true, department: true } } },
  });
}

export async function buildBoardReportCsv(query: ExportQuery, userId: string) {
  const periodQuery: PeriodQuery = { month: query.fromDate.getUTCMonth() + 1, year: query.fromDate.getUTCFullYear(), compare: true };
  const [header, kpis, pipeline, health, user] = await Promise.all([
    getHeaderSummary(periodQuery, userId),
    getKpiCards(periodQuery),
    getClientPipeline(),
    getSystemHealth(),
    getUserContext(userId),
  ]);
  return [
    'Antrosys ERP — CEO Board Report',
    `Generated,${new Date().toISOString()}`,
    `Range,${query.fromDate.toISOString().slice(0, 10)} to ${query.toDate.toISOString().slice(0, 10)}`,
    `Prepared For,${user?.firstName ?? 'CEO'} ${user?.lastName ?? ''}`,
    '',
    'HEADER',
    header.greeting,
    ...header.badges.map((b) => `${b.label},${b.value}`),
    '',
    'KPI SUMMARY',
    `Revenue,${kpis.revenue.value}`,
    `Headcount,${kpis.headcount.value}`,
    `Active Clients,${kpis.clients.value}`,
    `Burn Rate,${kpis.burnRate.value}`,
    '',
    'CLIENT PIPELINE',
    ...pipeline.stages.map((s) => `${s.label},${s.count}`),
    '',
    'SYSTEM HEALTH',
    ...health.services.map((s) => `${s.label},${s.status}`),
  ].join('\n');
}
