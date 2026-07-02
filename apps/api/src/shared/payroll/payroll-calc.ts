import { Prisma, PayslipStatus, PayrollLineStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import type { PrismaClientOrTransaction } from './types';

/** Grade-based default compensation when no explicit record exists. */
export const GRADE_DEFAULTS: Record<string, { base: number; allowances: number }> = {
  L2: { base: 120000, allowances: 15000 },
  L3: { base: 190000, allowances: 28000 },
  L4: { base: 285000, allowances: 42000 },
  L5: { base: 450000, allowances: 65000 },
};

export function defaultCompensation(grade: string | null | undefined) {
  if (grade && GRADE_DEFAULTS[grade]) return GRADE_DEFAULTS[grade];
  return { base: 180000, allowances: 27000 };
}

export function calculatePayrollLine(
  comp: { baseSalary: number; allowances: number },
  overtime: number,
  bonusPct = 0,
) {
  const baseSalary = Number(comp.baseSalary) || 0;
  const allowances = Number(comp.allowances) || 0;
  const safeOvertime = Number(overtime) || 0;
  const safeBonusPct = Number(bonusPct) || 0;
  const bonuses = Math.round(baseSalary * safeBonusPct);
  const grossPay = baseSalary + allowances + safeOvertime + bonuses;
  const incomeTax = Math.round(grossPay * 0.074);
  const providentFund = Math.round(baseSalary * 0.05);
  const healthInsurance = 2000;
  const deductionsTotal = providentFund + healthInsurance;
  const taxAmount = incomeTax;
  const netPay = grossPay - deductionsTotal - taxAmount;

  return {
    baseSalary,
    allowances,
    overtime: safeOvertime,
    bonuses,
    grossPay,
    incomeTax,
    providentFund,
    healthInsurance,
    deductionsTotal,
    taxAmount,
    netPay,
  };
}

export function toPayrollDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

export function payslipStatusForLineStatus(lineStatus: PayrollLineStatus): PayslipStatus | null {
  if (lineStatus === 'ON_HOLD' || lineStatus === 'PENDING') return null;
  return 'PROCESSING';
}

export interface PayslipSyncLine {
  id: string;
  employeeId: string;
  grossPay: Prisma.Decimal;
  netPay: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  deductionsTotal: Prisma.Decimal;
  status: PayrollLineStatus;
}

export interface PayslipSyncPayroll {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  currencyCode: string;
}

export async function upsertPayslipFromLineItem(
  db: PrismaClientOrTransaction,
  line: PayslipSyncLine,
  payroll: PayslipSyncPayroll,
  periodLabel: string,
  payslipStatus: PayslipStatus = 'PROCESSING',
) {
  const netPayRatioPct =
    Number(line.grossPay) > 0 ? Math.round((Number(line.netPay) / Number(line.grossPay)) * 100) : 0;

  const payslip = await db.employeePayslip.upsert({
    where: {
      employeeId_periodStart: {
        employeeId: line.employeeId,
        periodStart: payroll.periodStart,
      },
    },
    update: {
      payrollId: payroll.id,
      periodEnd: payroll.periodEnd,
      periodLabel,
      grossPay: line.grossPay,
      netPay: line.netPay,
      taxAmount: line.taxAmount,
      deductionsTotal: line.deductionsTotal,
      netPayRatioPct,
      currencyCode: payroll.currencyCode,
      status: payslipStatus,
    },
    create: {
      employeeId: line.employeeId,
      payrollId: payroll.id,
      periodStart: payroll.periodStart,
      periodEnd: payroll.periodEnd,
      periodLabel,
      grossPay: line.grossPay,
      netPay: line.netPay,
      taxAmount: line.taxAmount,
      deductionsTotal: line.deductionsTotal,
      netPayRatioPct,
      currencyCode: payroll.currencyCode,
      status: payslipStatus,
    },
  });

  await db.payrollLineItem.update({
    where: { id: line.id },
    data: { payslipId: payslip.id },
  });

  return payslip;
}

/** Sync employee payslip records from payroll line items for a batch. */
export async function syncPayslipsFromPayrollBatch(
  payrollId: string,
  options?: { skipOnHold?: boolean; payslipStatus?: PayslipStatus },
) {
  const skipOnHold = options?.skipOnHold ?? true;
  const payslipStatus = options?.payslipStatus ?? 'PROCESSING';

  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
    include: { lineItems: true },
  });
  if (!payroll) return { synced: 0, skipped: 0 };

  const periodLabel = payroll.periodStart.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  let synced = 0;
  let skipped = 0;

  for (const line of payroll.lineItems) {
    if (skipOnHold && (line.status === 'ON_HOLD' || line.status === 'PENDING')) {
      skipped += 1;
      continue;
    }

    await upsertPayslipFromLineItem(prisma, dbLine(line), payroll, periodLabel, payslipStatus);
    synced += 1;
  }

  return { synced, skipped };
}

function dbLine(line: {
  id: string;
  employeeId: string;
  grossPay: Prisma.Decimal;
  netPay: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  deductionsTotal: Prisma.Decimal;
  status: PayrollLineStatus;
}): PayslipSyncLine {
  return line;
}
