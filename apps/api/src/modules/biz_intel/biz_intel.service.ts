import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { CreateReportInput, CreateScheduleInput } from './biz_intel.schema';

// Helper function to write audit logs within transactions
async function writeAuditLog(
  tx: Prisma.TransactionClient,
  userId: string,
  action: string,
  metadata: Prisma.InputJsonValue,
) {
  await tx.auditLog.create({
    data: {
      userId,
      action,
      metadata,
    },
  });
}

// Format relative time for "last run"
function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Last run: Just now';
  if (diffMins < 60) return `Last run: ${diffMins}m ago`;
  if (diffHours < 24) return `Last run: ${diffHours}h ago`;
  return `Last run: ${diffDays}d ago`;
}

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === 'number' ? value : value.toNumber();
}

const PIPELINE_STAGES = ['PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'ONBOARDING', 'ACTIVE', 'AT_RISK'] as const;

type MonthKey = { year: number; month: number; label: string };

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' });
}

// Builds the 6-month window ending at the latest month with aggregated data
// (falls back to the current calendar month).
async function getLastSixMonths(): Promise<MonthKey[]> {
  const latest = await prisma.monthlyFinancialSummary.findFirst({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    select: { year: true, month: true },
  });
  const endYear = latest?.year ?? new Date().getFullYear();
  const endMonth = latest?.month ?? new Date().getMonth() + 1;

  const months: MonthKey[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(endYear, endMonth - 1 - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: monthLabel(d.getFullYear(), d.getMonth() + 1) });
  }
  return months;
}

// Loads the aggregated monthly rows for the window (missing months become 0).
async function getMonthlySummariesForWindow(months: MonthKey[]) {
  const summaries = await prisma.monthlyFinancialSummary.findMany({
    where: { OR: months.map((m) => ({ year: m.year, month: m.month })) },
  });
  const byKey = new Map(summaries.map((s) => [`${s.year}-${s.month}`, s]));
  return months.map((m) => byKey.get(`${m.year}-${m.month}`));
}

// Loads client pipeline history once for Deals Count / Expected Value series.
async function getClientPipelineHistory() {
  const clients = await prisma.client.findMany({
    select: {
      createdAt: true,
      pipelineStage: true,
      monthlyRevenue: true,
      annualRevenue: true,
      lifetimeValue: true,
    },
  });

  return clients.map((c) => {
    const expectedValue =
      toNumber(c.monthlyRevenue) ||
      toNumber(c.annualRevenue) / 12 ||
      toNumber(c.lifetimeValue) / 24 ||
      0;
    return {
      month: `${c.createdAt.getFullYear()}-${c.createdAt.getMonth() + 1}`,
      stage: c.pipelineStage,
      expectedValue,
    };
  });
}

// Aggregates a metric into a 6-point series. Reads the aggregated tables
// (monthly_financial_summaries / budget_vs_actual) and live tables only for
// metrics that have no aggregate (headcount, sales pipeline, attrition).
async function aggregateLast6MonthsData(metric: string): Promise<{ label: string; value: number }[]> {
  const months = await getLastSixMonths();
  const summaries = await getMonthlySummariesForWindow(months);

  if (metric === 'Headcount') {
    const headcount = await prisma.employee.count({ where: { isActive: true } });
    return months.map((m) => ({ label: m.label, value: headcount }));
  }

  if (metric === 'Deals Count' || metric === 'Expected Value') {
    const history = await getClientPipelineHistory();
    return months.map((m) => {
      const key = `${m.year}-${m.month}`;
      const inMonth = history.filter((h) => h.month === key);
      const value = metric === 'Deals Count'
        ? inMonth.length
        : inMonth.reduce((acc, h) => acc + h.expectedValue, 0);
      return { label: m.label, value };
    });
  }

  if (metric === 'Attrition Rate') {
    const terminated = await prisma.employee.findMany({
      where: { terminatedAt: { not: null } },
      select: { terminatedAt: true },
    });
    const headcount = await prisma.employee.count({ where: { isActive: true } });
    const base = Math.max(headcount, 1);
    return months.map((m) => {
      const count = terminated.filter((e) => {
        const d = e.terminatedAt as Date;
        return d.getFullYear() === m.year && d.getMonth() + 1 === m.month;
      }).length;
      return { label: m.label, value: Math.round((count / base) * 100) };
    });
  }

  return months.map((m, idx) => {
    const summary = summaries[idx];
    if (!summary) return { label: m.label, value: 0 };
    const revenue = toNumber(summary.revenueTotal);
    const expenses = toNumber(summary.opexTotal);
    switch (metric) {
      case 'Revenue':
        return { label: m.label, value: revenue };
      case 'Expenses':
        return { label: m.label, value: expenses };
      case 'Payroll cost':
        return { label: m.label, value: toNumber(summary.payrollTotal) };
      case 'Margin %': {
        const margin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;
        return { label: m.label, value: Math.round(margin) };
      }
      default:
        return { label: m.label, value: 0 };
    }
  });
}

// 1. Fetch dashboard data (reports, schedules, runs, miniMetrics)
export async function getDashboardData(userId: string) {
  const reports = await prisma.bIReport.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const schedules = await prisma.bISchedule.findMany({
    include: {
      report: {
        select: {
          title: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const recentActivity = await prisma.bIExecution.findMany({
    orderBy: { runAt: 'desc' },
    take: 10,
  });

  // Calculate dynamic mini metrics from the DB
  const miniMetrics = await getMiniMetrics();

  return {
    reports,
    schedules: schedules.map(s => ({
      id: s.id,
      reportId: s.reportId,
      title: s.title,
      info: s.info,
      cronExpression: s.cronExpression,
      deliveryMethod: s.deliveryMethod,
      isActive: s.isActive,
      icon: s.deliveryMethod === 'email' ? 'mail' : 'pdf',
    })),
    recentActivity: recentActivity.map(a => ({
      id: a.id,
      name: a.name,
      duration: a.duration,
      status: a.status,
      failed: a.failed,
      runAt: a.runAt,
    })),
    miniMetrics,
  };
}

// Helper to compute mini metrics sparkline points and last run times
async function getMiniMetrics() {
  const metricsList = [
    { title: 'Revenue overview', metric: 'Revenue', borderClass: 'border-l-[#7B6AE6]' },
    { title: 'Headcount & attrition', metric: 'Headcount', borderClass: 'border-l-emerald-500' },
    { title: 'Payroll cost analysis', metric: 'Payroll cost', borderClass: 'border-l-amber-600' },
  ];

  const results = [];

  for (const item of metricsList) {
    // Get last run time
    const lastExecution = await prisma.bIExecution.findFirst({
      where: { name: item.title, failed: false },
      orderBy: { runAt: 'desc' },
    });

    const lastRun = lastExecution ? formatRelativeTime(lastExecution.runAt) : 'Last run: never';

    // Sparkline from the aggregated data series
    let sparklinePoints = '';
    try {
      const historicalData = await aggregateLast6MonthsData(item.metric);
      const values = historicalData.map(h => h.value);
      const maxVal = Math.max(...values, 1);
      const minVal = Math.min(...values, 0);
      const range = maxVal - minVal || 1;

      if (historicalData.some(d => d.value !== 0)) {
        sparklinePoints = historicalData.map((d, index) => {
          const x = index * 20;
          const norm = (d.value - minVal) / range;
          const y = Math.round(25 - (norm * 20));
          return `${x},${y}`;
        }).join(' ');
      }
    } catch (e) {
      console.warn(`Error generating sparkline for ${item.title}:`, e);
    }

    results.push({
      title: item.title,
      lastRun,
      borderClass: item.borderClass,
      sparklinePoints,
    });
  }

  return results;
}

// 2. Fetch aggregated chart data for Custom Builder Canvas Preview
export async function getChartData(xAxis: string, yAxisList: string[]) {
  const months = await getLastSixMonths();

  // Sales pipeline chart: rows are stages, not months
  if (xAxis === 'Stage') {
    return getPipelineChartData(yAxisList);
  }

  // Gather historical series for each requested Y-axis metric
  const seriesData: Record<string, number[]> = {};

  for (const metric of yAxisList) {
    const data = await aggregateLast6MonthsData(metric);
    seriesData[metric] = data.map(d => d.value);
  }

  // Calculate height percentages relative to the maximum value in any active series to scale SVGs properly
  let overallMax = 0;
  for (const metric of yAxisList) {
    const seriesMax = Math.max(...(seriesData[metric] || [0]), 1);
    if (seriesMax > overallMax) overallMax = seriesMax;
  }

  const results = [];
  for (let i = 0; i < months.length; i++) {
    const dataRow: Record<string, any> = { month: months[i].label };

    for (const metric of yAxisList) {
      const val = seriesData[metric]?.[i] ?? 0;
      dataRow[`${metric.replace(/\s+/g, '')}Val`] = val;
      // Calculate height percentage for SVG renderer, e.g. "45%"
      const pct = overallMax > 0 ? Math.round((val / overallMax) * 75) + 5 : 5; // offset margins
      dataRow[`${metric.replace(/\s+/g, '').replace('%', 'Pct')}Height`] = `${pct}%`;
    }

    results.push(dataRow);
  }

  return results;
}

// Sales pipeline rows (xAxis = Stage): count and expected value per stage
async function getPipelineChartData(yAxisList: string[]) {
  const clients = await prisma.client.findMany({
    select: { pipelineStage: true, monthlyRevenue: true, annualRevenue: true, lifetimeValue: true },
  });

  const stageTotals = new Map<string, { count: number; value: number }>();
  for (const c of clients) {
    const entry = stageTotals.get(c.pipelineStage) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value +=
      toNumber(c.monthlyRevenue) ||
      toNumber(c.annualRevenue) / 12 ||
      toNumber(c.lifetimeValue) / 24 ||
      0;
    stageTotals.set(c.pipelineStage, entry);
  }

  const rows = PIPELINE_STAGES.map((stage) => stageTotals.get(stage) ?? { count: 0, value: 0 });
  const maxCount = Math.max(...rows.map(r => r.count), 1);
  const maxValue = Math.max(...rows.map(r => r.value), 1);

  return rows.map((row, idx) => {
    const dataRow: Record<string, any> = { month: PIPELINE_STAGES[idx] };
    for (const metric of yAxisList) {
      const val = metric === 'Deals Count' ? row.count : metric === 'Expected Value' ? Math.round(row.value) : 0;
      dataRow[`${metric.replace(/\s+/g, '')}Val`] = val;
      const overallMax = metric === 'Deals Count' ? maxCount : maxValue;
      const pct = overallMax > 0 ? Math.round((val / overallMax) * 75) + 5 : 5;
      dataRow[`${metric.replace(/\s+/g, '').replace('%', 'Pct')}Height`] = `${pct}%`;
    }
    return dataRow;
  });
}

// Sales pipeline summary for KPI cards and charts
export async function getSalesPipeline() {
  const clients = await prisma.client.findMany({
    select: { pipelineStage: true, monthlyRevenue: true, annualRevenue: true, lifetimeValue: true },
  });

  const stages = PIPELINE_STAGES.map((stage) => {
    const inStage = clients.filter((c) => c.pipelineStage === stage);
    return {
      stage,
      count: inStage.length,
      expectedValue: Math.round(inStage.reduce((acc, c) => acc + (
        toNumber(c.monthlyRevenue) ||
        toNumber(c.annualRevenue) / 12 ||
        toNumber(c.lifetimeValue) / 24 ||
        0
      ), 0)),
    };
  });

  return {
    stages,
    totalCount: clients.length,
    totalExpectedValue: stages.reduce((acc, s) => acc + s.expectedValue, 0),
  };
}

// 3. KPI cards — sourced from the aggregated monthly_financial_summaries table
export async function getKpis() {
  const latest = await prisma.monthlyFinancialSummary.findFirst({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });

  const monthKey = latest ? `${latest.year}-${latest.month}` : null;
  const months = monthKey ? [monthKey] : [];
  const summary = latest ?? undefined;

  const [headcount, pipeline, pendingLive] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    getSalesPipeline(),
    latest
      ? Promise.resolve(null)
      : prisma.ledgerEntry.aggregate({
          _sum: { amount: true },
          where: { isVoided: false, hasFlag: true },
        }),
  ]);

  const revenue = summary ? toNumber(summary.revenueTotal) : 0;
  const expenses = summary ? toNumber(summary.opexTotal) : 0;
  const payrollCost = summary ? toNumber(summary.payrollTotal) : 0;
  const pendingReconciliation = summary
    ? toNumber(summary.pendingReconciliation)
    : toNumber(pendingLive?._sum.amount);

  return {
    period: months[0] ?? null,
    revenue,
    expenses,
    payrollCost,
    pendingReconciliation,
    netMovement: summary ? toNumber(summary.netMovement) : 0,
    marginPct: revenue > 0 ? Math.round(((revenue - expenses) / revenue) * 100) : 0,
    headcount,
    dealsCount: pipeline.totalCount,
    expectedValue: pipeline.totalExpectedValue,
  };
}

// 3. Create a new custom report
export async function createReport(userId: string, input: CreateReportInput) {
  return await prisma.$transaction(async (tx) => {
    const report = await tx.bIReport.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        iconType: input.iconType,
        isFavourite: input.isFavourite ?? false,
        isShared: input.isShared ?? false,
        config: input.config ? (input.config as any) : null,
        createdById: userId,
      },
    });

    await writeAuditLog(tx, userId, 'CREATE_REPORT', { reportId: report.id, title: report.title });
    return report;
  });
}

function formatDuration(startedAt: number, endedAt: number): string {
  const ms = endedAt - startedAt;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// 4. Execute a report: compute its config against the aggregated tables and
//    record a real execution (duration, status) in the audit trail.
export async function runReport(userId: string, reportId: string) {
  return await prisma.$transaction(async (tx) => {
    const report = await tx.bIReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    const startedAt = Date.now();
    let duration = '0ms';
    let status = 'Completed';
    let failed = false;

    try {
      const config = (report.config as { xAxis?: string; yAxis?: string[] } | null) ?? null;
      const xAxis = config?.xAxis ?? 'Month';
      const yAxis = config?.yAxis ?? ['Revenue'];
      await getChartData(xAxis, yAxis);
      duration = formatDuration(startedAt, Date.now());
    } catch (err) {
      duration = formatDuration(startedAt, Date.now());
      status = 'Failed';
      failed = true;
      console.error(`BI report execution failed: ${report.title}`, err);
    }

    const execution = await tx.bIExecution.create({
      data: {
        reportId: report.id,
        name: report.title,
        duration,
        status,
        failed,
        userId,
      },
    });

    await writeAuditLog(tx, userId, 'RUN_REPORT', { reportId: report.id, title: report.title, executionId: execution.id });
    return execution;
  });
}

// 5. Toggle favourite status
export async function toggleFavourite(userId: string, reportId: string, isFavourite: boolean) {
  return await prisma.$transaction(async (tx) => {
    const report = await tx.bIReport.update({
      where: { id: reportId },
      data: { isFavourite },
    });

    await writeAuditLog(tx, userId, 'TOGGLE_FAVOURITE_REPORT', { reportId, isFavourite });
    return report;
  });
}

// 6. Delete custom report
export async function deleteReport(userId: string, reportId: string) {
  return await prisma.$transaction(async (tx) => {
    const report = await tx.bIReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    await tx.bIReport.delete({
      where: { id: reportId },
    });

    await writeAuditLog(tx, userId, 'DELETE_REPORT', { reportId, title: report.title });
    return { success: true };
  });
}

// 7. Create a schedule
export async function createSchedule(userId: string, input: CreateScheduleInput) {
  return await prisma.$transaction(async (tx) => {
    const report = await tx.bIReport.findUnique({
      where: { id: input.reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    const schedule = await tx.bISchedule.create({
      data: {
        reportId: input.reportId,
        title: input.title,
        cronExpression: input.cronExpression,
        info: input.info,
        deliveryMethod: input.deliveryMethod,
        isActive: input.isActive ?? true,
      },
    });

    await writeAuditLog(tx, userId, 'CREATE_SCHEDULE', { scheduleId: schedule.id, title: schedule.title });
    return schedule;
  });
}

// 8. Delete a schedule
export async function deleteSchedule(userId: string, scheduleId: string) {
  return await prisma.$transaction(async (tx) => {
    const schedule = await tx.bISchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    await tx.bISchedule.delete({
      where: { id: scheduleId },
    });

    await writeAuditLog(tx, userId, 'DELETE_SCHEDULE', { scheduleId, title: schedule.title });
    return { success: true };
  });
}
