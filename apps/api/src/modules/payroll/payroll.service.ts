import {
  Department,
  PayrollLifecycleStep,
  PayrollLineStatus,
  PayrollStatus,
  Prisma,
} from '@prisma/client';
import { prisma } from '../../config/database';
import { APP_DEFAULT_CURRENCY } from '../../shared/currency/currency-constants';
import { formatCurrencyAmount, formatCurrencyCompact } from '../../shared/currency/format-currency';
import { buildPayslipPdf } from '../../shared/pdf/payslip-pdf';
import { payslipPeriodLabel } from '../../shared/payslip/payslip-period-label';
import { sendMail } from '../../shared/email/mail.service';
import {
  calculatePayrollLine,
  defaultCompensation,
  syncPayslipsFromPayrollBatch,
  toPayrollDecimal,
  upsertPayslipFromLineItem,
} from '../../shared/payroll/payroll-calc';
import { logFinancialActivity } from '../../shared/finance/financial-activity';
import type {
  ApproveLinesBody,
  DashboardQuery,
  GeneratePayslipsBody,
  ListEmployeesQuery,
  PayslipConfigBody,
  RunPayrollBody,
  UpdateLineItemBody,
} from './payroll.schema';

const DEFAULT_PAYSLIP_CONFIG = {
  email: true,
  pdf: true,
  whatsapp: false,
  template: 'standard' as const,
};

const LIFECYCLE_LABELS = [
  'Data collection',
  'Review & verify',
  'Payroll run',
  'CFO approval',
  'Disbursement',
];

const LIFECYCLE_STEPS: PayrollLifecycleStep[] = [
  'DATA_COLLECTION',
  'REVIEW_VERIFY',
  'PAYROLL_RUN',
  'CFO_APPROVAL',
  'DISBURSEMENT',
];

const DEPARTMENT_LABEL: Record<Department, string> = {
  ENGINEERING: 'IT',
  OPERATIONS: 'Ops',
  SALES: 'Sales',
  FINANCE: 'Finance',
  HR: 'HR',
  OTHER: 'Other',
};

const LINE_STATUS_LABEL: Record<PayrollLineStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  ON_HOLD: 'On hold',
  VERIFIED: 'Verified',
};

const AVATAR_COLORS = [
  'bg-purple-100 text-[#7B6AE6]',
  'bg-indigo-100 text-indigo-700',
  'bg-red-100 text-red-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
];

function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

function parsePeriod(period?: string) {
  const now = new Date();
  if (period) {
    const [year, month] = period.split('-').map(Number);
    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const periodEnd = new Date(Date.UTC(year, month, 0));
    return { year, month, periodStart, periodEnd };
  }
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const periodStart = new Date(Date.UTC(year, month - 1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 0));
  return { year, month, periodStart, periodEnd };
}

function periodKey(start: Date) {
  const y = start.getUTCFullYear();
  const m = String(start.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function periodLabelFromStart(start: Date) {
  return payslipPeriodLabel(start);
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function formatAmountPlain(amount: number) {
  return amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function normalizeDepartment(value: string): Department | undefined {
  const key = value.trim().toLowerCase();
  const map: Record<string, Department> = {
    engineering: 'ENGINEERING',
    it: 'ENGINEERING',
    operations: 'OPERATIONS',
    ops: 'OPERATIONS',
    sales: 'SALES',
    finance: 'FINANCE',
    hr: 'HR',
    other: 'OTHER',
  };
  return map[key] ?? (Object.values(Department).find((d) => d === value.toUpperCase()) as Department | undefined);
}

function parsePayslipConfig(raw: unknown) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PAYSLIP_CONFIG };
  const cfg = raw as Record<string, unknown>;
  return {
    email: cfg.email !== false,
    pdf: cfg.pdf !== false,
    whatsapp: cfg.whatsapp === true,
    template: cfg.template === 'detailed' ? ('detailed' as const) : ('standard' as const),
  };
}

function deriveLifecycleUi(
  lifecycleStep: PayrollLifecycleStep,
  status: PayrollStatus,
): { steps: { step: number; label: string; status: 'complete' | 'current' | 'upcoming' }[]; progressPct: number } {
  if (lifecycleStep === 'PAYROLL_RUN' && status === 'DRAFT') {
    return {
      steps: LIFECYCLE_LABELS.map((label, idx) => ({
        step: idx + 1,
        label,
        status: idx < 3 ? 'complete' : 'upcoming',
      })),
      progressPct: 62,
    };
  }

  if (status === 'REJECTED') {
    return {
      steps: LIFECYCLE_LABELS.map((label, idx) => ({
        step: idx + 1,
        label,
        status: 'upcoming' as const,
      })),
      progressPct: 0,
    };
  }

  const currentIndex = LIFECYCLE_STEPS.indexOf(lifecycleStep);
  let effectiveIndex = currentIndex;

  if (status === 'PAID') effectiveIndex = LIFECYCLE_STEPS.length;
  else if (status === 'APPROVED' && lifecycleStep !== 'DISBURSEMENT') {
    effectiveIndex = LIFECYCLE_STEPS.indexOf('DISBURSEMENT');
  } else if (status === 'PENDING_APPROVAL') {
    effectiveIndex = LIFECYCLE_STEPS.indexOf('CFO_APPROVAL');
  }

  const steps = LIFECYCLE_LABELS.map((label, idx) => {
    let stepStatus: 'complete' | 'current' | 'upcoming' = 'upcoming';
    if (idx < effectiveIndex) stepStatus = 'complete';
    else if (idx === effectiveIndex) stepStatus = 'current';
    return { step: idx + 1, label, status: stepStatus };
  });

  const progressPct = status === 'PAID' ? 100 : Math.round(((effectiveIndex + 0.5) / LIFECYCLE_STEPS.length) * 100);

  return { steps, progressPct };
}

async function sumOvertimePay(employeeId: string, periodStart: Date, periodEnd: Date, hourlyRate: number) {
  const records = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: { gte: periodStart, lte: periodEnd },
      overtimeHours: { not: null },
    },
    select: { overtimeHours: true },
  });

  let hours = 0;
  for (const r of records) {
    hours += Number(r.overtimeHours ?? 0);
  }
  return hours * hourlyRate * 1.5;
}

async function recalculateBatchTotals(payrollId: string) {
  const lines = await prisma.payrollLineItem.findMany({ where: { payrollId } });

  let totalGross = 0;
  let totalNet = 0;
  let totalDeductions = 0;
  let taxWithheld = 0;
  let totalBase = 0;
  let totalAllowances = 0;
  let totalOvertime = 0;
  let totalBonuses = 0;
  let totalIncomeTax = 0;
  let totalProvidentFund = 0;
  let totalHealth = 0;

  for (const line of lines) {
    totalGross += Number(line.grossPay);
    totalNet += Number(line.netPay);
    totalDeductions += Number(line.deductionsTotal);
    taxWithheld += Number(line.taxAmount);
    totalBase += Number(line.baseSalary);
    totalAllowances += Number(line.allowances);
    totalOvertime += Number(line.overtime);
    totalBonuses += Number(line.bonuses);
    totalIncomeTax += Number(line.incomeTax);
    totalProvidentFund += Number(line.providentFund);
    totalHealth += Number(line.healthInsurance);
  }

  const employerLiability = Math.round(totalGross * 0.074);

  await prisma.payroll.update({
    where: { id: payrollId },
    data: {
      totalGross: toDecimal(totalGross),
      totalNet: toDecimal(totalNet),
      totalDeductions: toDecimal(totalDeductions),
      taxWithheld: toDecimal(taxWithheld),
      employerLiability: toDecimal(employerLiability),
      employeeCount: lines.length,
    },
  });

  return {
    totalGross,
    totalNet,
    totalDeductions,
    taxWithheld,
    employerLiability,
    employeeCount: lines.length,
    totalBase,
    totalAllowances,
    totalOvertime,
    totalBonuses,
    totalIncomeTax,
    totalProvidentFund,
    totalHealth,
  };
}

function buildMetrics(totals: Awaited<ReturnType<typeof recalculateBatchTotals>>, currencyCode: string) {
  const { totalGross, totalNet, totalDeductions, employerLiability } = totals;
  const netToGrossRatioPct = totalGross > 0 ? Math.round((totalNet / totalGross) * 100) : 0;

  const pct = (part: number) => (totalGross > 0 ? Math.round((part / totalGross) * 100) : 0);

  return {
    totalGross: {
      amount: formatCurrencyAmount(totalGross, currencyCode),
      breakdown: [
        { label: `Base ${pct(totals.totalBase)}%`, percentage: pct(totals.totalBase), color: 'bg-[#6366F1]' },
        { label: `Allowances ${pct(totals.totalAllowances)}%`, percentage: pct(totals.totalAllowances), color: 'bg-[#818CF8]' },
        { label: `OT ${pct(totals.totalOvertime)}%`, percentage: pct(totals.totalOvertime), color: 'bg-[#A5B4FC]' },
        { label: `Bonuses ${pct(totals.totalBonuses)}%`, percentage: pct(totals.totalBonuses), color: 'bg-[#C7D2FE]' },
      ],
    },
    totalDeductions: {
      amount: formatCurrencyAmount(totalDeductions + totals.taxWithheld, currencyCode),
      items: [
        { label: 'Income Tax', value: formatAmountPlain(totals.totalIncomeTax) },
        { label: 'Provident Fund', value: formatAmountPlain(totals.totalProvidentFund) },
        { label: 'Health Ins.', value: formatAmountPlain(totals.totalHealth) },
      ],
    },
    netPayroll: {
      amount: formatCurrencyAmount(totalNet, currencyCode),
      netToGrossRatioPct,
    },
    employerLiability: {
      amount: formatCurrencyAmount(employerLiability, currencyCode),
      note: 'Excludes pending EOBI updates',
    },
  };
}

function buildPayslipGenerationSummary(lines: { status: PayrollLineStatus }[], generationProgress: number) {
  const verified = lines.filter((l) => l.status === 'VERIFIED').length;
  const onHold = lines.filter((l) => l.status === 'ON_HOLD').length;
  const pending = lines.filter((l) => l.status === 'PENDING').length;
  const processing = lines.filter((l) => l.status === 'PROCESSING').length;

  return {
    totalToGenerate: lines.length,
    progressPct: generationProgress,
    verified,
    onHold,
    pending: pending + processing,
  };
}

async function findPayrollForQuery(query: DashboardQuery) {
  if (query.payrollId) {
    return prisma.payroll.findUnique({ where: { id: query.payrollId }, include: { lineItems: true } });
  }

  const { periodStart } = parsePeriod(query.period);
  return prisma.payroll.findFirst({
    where: {
      periodStart,
      status: { not: 'REJECTED' },
    },
    orderBy: { createdAt: 'desc' },
    include: { lineItems: true },
  });
}

export async function getPeriods() {
  const batches = await prisma.payroll.findMany({
    orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, periodStart: true, periodEnd: true, batchNumber: true, status: true },
  });

  const byKey = new Map<
    string,
    {
      key: string;
      label: string;
      payrollId: string | null;
      batchNumber: string | null;
      status: string;
      periodStart: Date;
      periodEnd: Date;
    }
  >();

  for (const b of batches) {
    const key = periodKey(b.periodStart);
    const existing = byKey.get(key);
    if (
      !existing ||
      b.periodEnd.getTime() > existing.periodEnd.getTime() ||
      (b.id && !existing.payrollId)
    ) {
      byKey.set(key, {
        key,
        label: periodLabelFromStart(b.periodStart),
        payrollId: b.id,
        batchNumber: b.batchNumber,
        status: b.status,
        periodStart: b.periodStart,
        periodEnd: b.periodEnd,
      });
    }
  }

  const now = parsePeriod();
  for (let i = 0; i < 12; i++) {
    const month = now.month - i;
    const year = month <= 0 ? now.year - 1 : now.year;
    const normalizedMonth = month <= 0 ? month + 12 : month;
    const start = new Date(Date.UTC(year, normalizedMonth - 1, 1));
    const key = periodKey(start);
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        label: periodLabelFromStart(start),
        payrollId: null,
        batchNumber: null,
        status: 'DRAFT',
        periodStart: start,
        periodEnd: new Date(Date.UTC(year, normalizedMonth, 0)),
      });
    }
  }

  return Array.from(byKey.values())
    .sort((a, b) => b.periodStart.getTime() - a.periodStart.getTime())
    .map(({ periodStart: _ps, periodEnd: _pe, ...rest }) => rest);
}

export async function getDashboard(query: DashboardQuery) {
  const { periodStart, periodEnd, year, month } = parsePeriod(query.period);
  const payroll = await findPayrollForQuery(query);
  const currencyCode = payroll?.currencyCode ?? APP_DEFAULT_CURRENCY;

  if (!payroll) {
    const activeCount = await prisma.employee.count({ where: { isActive: true, employmentStatus: 'ACTIVE' } });
    const lifecycle = deriveLifecycleUi('DATA_COLLECTION', 'DRAFT');
    return {
      period: {
        key: `${year}-${String(month).padStart(2, '0')}`,
        label: periodLabelFromStart(periodStart),
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      currencyCode,
      employeeCount: activeCount,
      lifecycle: {
        ...lifecycle,
        activeProcessingCount: 0,
      },
      metrics: null,
      payslipGeneration: {
        totalToGenerate: 0,
        progressPct: 0,
        verified: 0,
        onHold: 0,
        pending: 0,
        config: { ...DEFAULT_PAYSLIP_CONFIG },
      },
      payroll: null,
    };
  }

  const totals = await recalculateBatchTotals(payroll.id);
  const lifecycle = deriveLifecycleUi(payroll.lifecycleStep, payroll.status);
  const activeProcessingCount = payroll.lineItems.filter((l) => l.status === 'PROCESSING').length;
  const config = parsePayslipConfig(payroll.payslipConfig);
  const genSummary = buildPayslipGenerationSummary(payroll.lineItems, payroll.generationProgress);

  return {
    period: {
      key: periodKey(payroll.periodStart),
      label: periodLabelFromStart(payroll.periodStart),
      start: payroll.periodStart.toISOString(),
      end: payroll.periodEnd.toISOString(),
    },
    currencyCode,
    employeeCount: payroll.employeeCount,
    lifecycle: {
      ...lifecycle,
      activeProcessingCount: activeProcessingCount ?? payroll.employeeCount,
    },
    metrics: buildMetrics(totals, currencyCode),
    payslipGeneration: {
      ...genSummary,
      config,
    },
    payroll: {
      id: payroll.id,
      batchNumber: payroll.batchNumber,
      status: payroll.status,
      lifecycleStep: payroll.lifecycleStep,
      netPayrollCompact: formatCurrencyCompact(totals.totalNet, currencyCode),
    },
  };
}

export async function listEmployees(payrollId: string, query: ListEmployeesQuery) {
  const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } });
  if (!payroll) return null;

  const where: Prisma.PayrollLineItemWhereInput = { payrollId };

  if (query.status) where.status = query.status;
  if (query.grade) where.employee = { grade: query.grade };
  if (query.department) {
    const dept = normalizeDepartment(query.department);
    if (dept) where.employee = { ...(where.employee as object), department: dept };
  }
  if (query.search) {
    const term = query.search.trim();
    where.OR = [
      { employee: { firstName: { contains: term, mode: 'insensitive' } } },
      { employee: { lastName: { contains: term, mode: 'insensitive' } } },
      { employee: { employeeCode: { contains: term, mode: 'insensitive' } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.payrollLineItem.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: true,
            grade: true,
          },
        },
      },
      orderBy: { employee: { lastName: 'asc' } },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.payrollLineItem.count({ where }),
  ]);

  const currencyCode = payroll.currencyCode;

  return {
    items: items.map((line, index) => ({
      id: line.id,
      employeeId: line.employeeId,
      employeeCode: line.employee.employeeCode ?? line.employeeId.slice(0, 8).toUpperCase(),
      name: `${line.employee.firstName} ${line.employee.lastName.charAt(0)}.`,
      initials: initials(line.employee.firstName, line.employee.lastName),
      avatarBg: avatarColor(index),
      dept: line.employee.department ? DEPARTMENT_LABEL[line.employee.department] : '—',
      grade: line.employee.grade ?? '—',
      baseSalary: formatAmountPlain(Number(line.baseSalary)),
      allowances: formatAmountPlain(Number(line.allowances)),
      deductions: formatAmountPlain(Number(line.deductionsTotal)),
      tax: formatAmountPlain(Number(line.taxAmount)),
      netPay: formatAmountPlain(Number(line.netPay)),
      status: LINE_STATUS_LABEL[line.status],
      statusCode: line.status,
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
    currencyCode,
  };
}

export async function runPayroll(userId: string, body: RunPayrollBody) {
  const { periodStart, periodEnd, year, month } = parsePeriod(body.period);

  const existing = await prisma.payroll.findFirst({
    where: { periodStart, periodEnd, status: { not: 'REJECTED' } },
  });
  if (existing) {
    return { error: 'PAYROLL_EXISTS' as const, payrollId: existing.id };
  }

  const employees = await prisma.employee.findMany({
    where: { isActive: true, employmentStatus: 'ACTIVE' },
    include: { compensation: true },
  });

  const baseBatchNumber = `PAY-${year}-${String(month).padStart(2, '0')}`;
  const rejectedCount = await prisma.payroll.count({
    where: { periodStart, periodEnd, status: 'REJECTED' },
  });
  const batchNumber = rejectedCount > 0 ? `${baseBatchNumber}-v${rejectedCount + 1}` : baseBatchNumber;

  const payroll = await prisma.$transaction(async (tx) => {
    const created = await tx.payroll.create({
      data: {
        batchNumber,
        periodStart,
        periodEnd,
        totalGross: toDecimal(0),
        totalNet: toDecimal(0),
        employeeCount: 0,
        currencyCode: APP_DEFAULT_CURRENCY,
        lifecycleStep: 'PAYROLL_RUN',
        status: 'DRAFT',
        submittedByUserId: userId,
        payslipConfig: DEFAULT_PAYSLIP_CONFIG,
      },
    });

    for (const emp of employees) {
      const comp = emp.compensation;
      const defaults = defaultCompensation(emp.grade);
      const baseSalary = comp ? Number(comp.baseSalary) : defaults.base;
      const allowances = comp ? Number(comp.allowances) : defaults.allowances;
      const hourlyRate = baseSalary / 176;
      const overtime = await sumOvertimePay(emp.id, periodStart, periodEnd, hourlyRate);
      const bonusPct = emp.grade === 'L5' ? 0.04 : 0;
      const calc = calculatePayrollLine({ baseSalary, allowances }, overtime, bonusPct);

      await tx.payrollLineItem.create({
        data: {
          payrollId: created.id,
          employeeId: emp.id,
          baseSalary: toDecimal(calc.baseSalary),
          allowances: toDecimal(calc.allowances),
          overtime: toDecimal(calc.overtime),
          bonuses: toDecimal(calc.bonuses),
          grossPay: toDecimal(calc.grossPay),
          incomeTax: toDecimal(calc.incomeTax),
          providentFund: toDecimal(calc.providentFund),
          healthInsurance: toDecimal(calc.healthInsurance),
          deductionsTotal: toDecimal(calc.deductionsTotal),
          taxAmount: toDecimal(calc.taxAmount),
          netPay: toDecimal(calc.netPay),
          status: 'PROCESSING',
        },
      });
    }

    return created;
  });

  await recalculateBatchTotals(payroll.id);
  await syncPayslipsFromPayrollBatch(payroll.id);
  return { payrollId: payroll.id };
}

export async function updateLineItem(payrollId: string, lineItemId: string, body: UpdateLineItemBody) {
  const line = await prisma.payrollLineItem.findFirst({
    where: { id: lineItemId, payrollId },
  });
  if (!line) return null;

  const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } });
  if (!payroll) return null;

  const updated = await prisma.payrollLineItem.update({
    where: { id: lineItemId },
    data: {
      status: body.status,
      holdReason: body.status === 'ON_HOLD' ? body.holdReason ?? 'On hold' : null,
    },
  });

  if (body.status === 'ON_HOLD' || body.status === 'PENDING') {
    if (updated.payslipId) {
      await prisma.employeePayslip.update({
        where: { id: updated.payslipId },
        data: { status: 'CANCELLED' },
      });
    }
  } else {
    await upsertPayslipFromLineItem(
      prisma,
      updated,
      payroll,
      periodLabelFromStart(payroll.periodStart),
      'PROCESSING',
    );
  }

  return updated;
}

export async function approveLines(payrollId: string, body: ApproveLinesBody) {
  const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } });
  if (!payroll) return null;
  if (payroll.status !== 'DRAFT' && payroll.status !== 'REJECTED') return null;

  await prisma.payrollLineItem.updateMany({
    where: { payrollId, id: { in: body.lineItemIds } },
    data: { status: 'VERIFIED' },
  });

  const periodLabel = periodLabelFromStart(payroll.periodStart);
  const lines = await prisma.payrollLineItem.findMany({
    where: { payrollId, id: { in: body.lineItemIds } },
  });
  for (const line of lines) {
    await upsertPayslipFromLineItem(prisma, line, payroll, periodLabel, 'PROCESSING');
  }

  await recalculateBatchTotals(payrollId);
  return { updated: body.lineItemIds.length };
}

export async function submitForApproval(payrollId: string, userId: string) {
  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
    include: { lineItems: true },
  });
  if (!payroll) return null;
  if (payroll.status !== 'DRAFT') return { error: 'INVALID_STATE' as const };

  const cfoUser = await prisma.user.findFirst({ where: { role: 'CFO', isActive: true } });
  const requester = await prisma.employee.findFirst({ where: { userId } });

  if (!cfoUser || !requester) return { error: 'MISSING_ACTORS' as const };

  await prisma.$transaction(async (tx) => {
    await tx.payroll.update({
      where: { id: payrollId },
      data: { status: 'PENDING_APPROVAL', lifecycleStep: 'CFO_APPROVAL' },
    });

    const existingTask = await tx.approvalTask.findFirst({
      where: { entityType: 'PAYROLL', entityId: payrollId, status: 'PENDING' },
    });

    if (!existingTask) {
      await tx.approvalTask.create({
        data: {
          assigneeUserId: cfoUser.id,
          requesterEmployeeId: requester.id,
          actionTitle: `Approve Payroll ${payroll.batchNumber}`,
          priority: 'HIGH',
          entityType: 'PAYROLL',
          entityId: payrollId,
          dueAt: new Date(),
        },
      });
    }

    await logFinancialActivity(tx, {
      category: 'PAYROLL',
      title: `Submitted ${payroll.batchNumber} for approval`,
      metadata: { payrollId, batchNumber: payroll.batchNumber },
    });
  });

  return { success: true };
}

export async function exportLedgerCsv(payrollId: string) {
  const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } });
  if (!payroll) return null;

  const lines = await prisma.payrollLineItem.findMany({
    where: { payrollId },
    include: {
      employee: {
        select: { firstName: true, lastName: true, employeeCode: true, department: true, grade: true },
      },
    },
    orderBy: { employee: { lastName: 'asc' } },
  });

  function esc(val: unknown): string {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const header = 'Employee Code,Name,Department,Grade,Base Salary,Allowances,Deductions,Tax,Net Pay,Status';
  const rows = lines.map((line) => {
    const name = `${line.employee.firstName} ${line.employee.lastName}`;
    const empCode = line.employee.employeeCode ?? line.employeeId.slice(0, 8).toUpperCase();
    return [
      esc(empCode),
      esc(name),
      esc(line.employee.department ?? ''),
      esc(line.employee.grade ?? ''),
      Number(line.baseSalary),
      Number(line.allowances),
      Number(line.deductionsTotal),
      Number(line.taxAmount),
      Number(line.netPay),
      esc(LINE_STATUS_LABEL[line.status]),
    ].join(',');
  });

  const filename = `payroll-${payroll.batchNumber}.csv`;
  return { content: [header, ...rows].join('\n'), filename };
}

export async function updatePayslipConfig(payrollId: string, body: PayslipConfigBody) {
  const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } });
  if (!payroll) return null;

  return prisma.payroll.update({
    where: { id: payrollId },
    data: { payslipConfig: body },
  });
}

export async function generatePayslips(payrollId: string, body: GeneratePayslipsBody) {
  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
    include: {
      lineItems: {
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              department: true,
              designation: true,
              employeeType: true,
              location: true,
              joiningDate: true,
              user: { select: { email: true } },
            },
          },
        },
      },
    },
  });

  if (!payroll) return null;
  if (payroll.status === 'PAID' || payroll.status === 'APPROVED' || payroll.status === 'REJECTED' || payroll.status === 'PENDING_APPROVAL') {
    return null;
  }

  const config = parsePayslipConfig(payroll.payslipConfig);
  const eligible = payroll.lineItems.filter((line) => {
    if (body.scope === 'verified_only') {
      return line.status === 'VERIFIED' || line.status === 'PROCESSING';
    }
    return line.status !== 'ON_HOLD' && line.status !== 'PENDING';
  });

  let generated = 0;
  let skipped = payroll.lineItems.length - eligible.length;
  const periodLabel = periodLabelFromStart(payroll.periodStart);

  const periodStart = payroll.periodStart;
  const periodEnd = payroll.periodEnd;
  const monthStr = String(periodStart.getMonth() + 1).padStart(2, '0');
  const yearStr = String(periodStart.getFullYear());

  const year = periodStart.getFullYear();
  const ytdStart = new Date(Date.UTC(year, 0, 1));
  const ytdEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  const eligibleEmployeeIds = eligible.map(l => l.employee.id);
  const allYtdPayslips = await prisma.employeePayslip.findMany({
    where: {
      employeeId: { in: eligibleEmployeeIds },
      periodStart: { gte: ytdStart, lte: ytdEnd },
    },
    select: { employeeId: true, grossPay: true, deductionsTotal: true, netPay: true },
  });
  const ytdByEmployee = new Map<string, { gross: number; deductions: number; net: number }>();
  for (const p of allYtdPayslips) {
    const entry = ytdByEmployee.get(p.employeeId) ?? { gross: 0, deductions: 0, net: 0 };
    entry.gross += Number(p.grossPay);
    entry.deductions += Number(p.deductionsTotal);
    entry.net += Number(p.netPay);
    ytdByEmployee.set(p.employeeId, entry);
  }

  for (const line of eligible) {
    await upsertPayslipFromLineItem(
      prisma,
      line,
      payroll,
      periodLabel,
      'PROCESSING',
    );

    if (config.pdf || config.email) {
      const employeeName = `${line.employee.firstName} ${line.employee.lastName}`;

      const ytd = ytdByEmployee.get(line.employee.id) ?? { gross: 0, deductions: 0, net: 0 };
      const ytdGross = ytd.gross;
      const ytdDeductions = ytd.deductions;
      const ytdNet = ytd.net;

      const payslipNumber = `PSL-${line.employee.employeeCode ?? 'EMP'}-${monthStr}${yearStr}`;

      const buffer = await buildPayslipPdf({
        employeeName,
        employeeCode: line.employee.employeeCode,
        department: line.employee.department?.replace(/_/g, ' ') ?? null,
        designation: line.employee.designation,
        employeeType: line.employee.employeeType ?? null,
        workLocation: line.employee.location ?? null,
        joiningDate: line.employee.joiningDate,
        periodStart,
        periodEnd,
        periodLabel,
        payslipNumber,
        paymentDate: new Date(),
        currencyCode: payroll.currencyCode,
        status: 'Processing',
        basicSalary: Number(line.baseSalary),
        allowances: Number(line.allowances),
        overtime: Number(line.overtime),
        bonuses: Number(line.bonuses),
        grossPay: Number(line.grossPay),
        incomeTax: Number(line.incomeTax),
        providentFund: Number(line.providentFund),
        healthInsurance: Number(line.healthInsurance),
        deductionsTotal: Number(line.deductionsTotal),
        netPay: Number(line.netPay),
        ytdGross,
        ytdDeductions,
        ytdNet,
      });

      if (config.email && line.employee.user.email) {
        await sendMail({
          to: line.employee.user.email,
          subject: `Payslip — ${periodLabel}`,
          text: `Your payslip for ${periodLabel} is attached.`,
          attachments: config.pdf
            ? [{ filename: `payslip-${periodLabel.replace(/\s+/g, '-')}.pdf`, content: buffer }]
            : undefined,
        });
      }
    }

    if (config.whatsapp) {
      console.info(`[payroll] WhatsApp notification queued for ${line.employee.user.email}`);
    }

    generated += 1;
  }

  const progressPct = payroll.lineItems.length > 0 ? Math.round((generated / payroll.lineItems.length) * 100) : 0;
  await prisma.payroll.update({
    where: { id: payrollId },
    data: { generationProgress: progressPct },
  });

  return { generated, skipped, progressPct };
}

export async function disbursePayroll(payrollId: string) {
  const blocked = await prisma.payrollLineItem.findMany({
    where: { payrollId, status: { in: ['ON_HOLD', 'PENDING'] } },
    select: { id: true },
  });
  if (blocked.length > 0) {
    return { error: 'UNVERIFIED_LINES' as const, blockedCount: blocked.length };
  }

  const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } });
  if (!payroll) return null;
  if (payroll.status !== 'APPROVED') {
    return { error: 'NOT_APPROVED' as const };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payroll.update({
      where: { id: payrollId },
      data: { status: 'PAID', paidAt: new Date(), lifecycleStep: 'DISBURSEMENT' },
    });

    await tx.employeePayslip.updateMany({
      where: { payrollId, status: 'PROCESSING' },
      data: { status: 'PAID', paidAt: new Date() },
    });

    await logFinancialActivity(tx, {
      category: 'PAYROLL',
      title: `Disbursed payroll ${payroll.batchNumber}`,
      metadata: { payrollId, batchNumber: payroll.batchNumber },
    });
  });

  return { success: true };
}

export async function getPayrollById(payrollId: string) {
  return prisma.payroll.findUnique({ where: { id: payrollId } });
}
