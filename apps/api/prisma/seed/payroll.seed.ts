import { PrismaClient } from '@prisma/client';
import { APP_DEFAULT_CURRENCY } from '../../src/shared/currency/currency-constants';
import { calculatePayrollLine, defaultCompensation, toPayrollDecimal } from '../../src/shared/payroll/payroll-calc';

function periodStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

function periodEnd(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0));
}

function periodLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/** Employees who receive multi-month payslip history in seed data. */
const HISTORY_EMPLOYEE_EMAILS = [
  'sara.javed@antrosys.com',
  'fawad.khan@antrosys.com',
  'omar.mirza@antrosys.com',
];

function monthsBeforeCurrent(count: number) {
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1;
  const result: { year: number; month: number }[] = [];

  for (let i = 0; i < count; i++) {
    month -= 1;
    if (month <= 0) {
      month = 12;
      year -= 1;
    }
    result.push({ year, month });
  }

  return result;
}

export async function seedPayslipsData(prisma: PrismaClient) {
  console.log('💰 Seeding employee payslip history (pre-current months)...');

  const historyMonths = monthsBeforeCurrent(5);
  let seeded = 0;

  for (const email of HISTORY_EMPLOYEE_EMAILS) {
    const employee = await prisma.employee.findFirst({
      where: { user: { email } },
      select: { id: true, grade: true },
    });

    if (!employee) {
      console.warn(`  ⚠️ Skipping payslip seed — employee not found: ${email}`);
      continue;
    }

    const comp = defaultCompensation(employee.grade);
    const bonusPct = employee.grade === 'L5' ? 0.04 : 0.01;
    const calc = calculatePayrollLine(
      { baseSalary: comp.base, allowances: comp.allowances },
      Math.round(comp.base * 0.02),
      bonusPct,
    );

    for (const { year, month } of historyMonths) {
      const start = periodStart(year, month);
      const end = periodEnd(year, month);
      const label = periodLabel(year, month);
      const netPayRatioPct = calc.grossPay > 0 ? Math.round((calc.netPay / calc.grossPay) * 100) : 0;

      await prisma.employeePayslip.upsert({
        where: {
          employeeId_periodStart: {
            employeeId: employee.id,
            periodStart: start,
          },
        },
        update: {
          periodEnd: end,
          periodLabel: label,
          grossPay: toPayrollDecimal(calc.grossPay),
          deductionsTotal: toPayrollDecimal(calc.deductionsTotal),
          taxAmount: toPayrollDecimal(calc.taxAmount),
          netPay: toPayrollDecimal(calc.netPay),
          netPayRatioPct,
          currencyCode: APP_DEFAULT_CURRENCY,
          status: 'PAID',
          paidAt: end,
          payrollId: null,
        },
        create: {
          employee: { connect: { id: employee.id } },
          periodStart: start,
          periodEnd: end,
          periodLabel: label,
          grossPay: toPayrollDecimal(calc.grossPay),
          deductionsTotal: toPayrollDecimal(calc.deductionsTotal),
          taxAmount: toPayrollDecimal(calc.taxAmount),
          netPay: toPayrollDecimal(calc.netPay),
          netPayRatioPct,
          currencyCode: APP_DEFAULT_CURRENCY,
          status: 'PAID',
          paidAt: end,
        },
      });
      seeded += 1;
    }
  }

  console.log(`  ✅ Seeded ${seeded} historical payslip records`);
}

export async function seedPayrollData(prisma: PrismaClient) {
  console.log('💼 Seeding payroll module data...');

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const start = periodStart(year, month);

  const employees = await prisma.employee.findMany({
    where: { isActive: true, employmentStatus: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true, grade: true, department: true },
  });

  for (const emp of employees) {
    const defaults = defaultCompensation(emp.grade);
    if (!emp.grade) {
      const inferredGrade =
        defaults.base >= 400000 ? 'L5' : defaults.base >= 250000 ? 'L4' : defaults.base >= 180000 ? 'L3' : 'L2';
      await prisma.employee.update({
        where: { id: emp.id },
        data: { grade: inferredGrade },
      });
      emp.grade = inferredGrade;
    }
    await prisma.employeeCompensation.upsert({
      where: { employeeId: emp.id },
      update: {
        baseSalary: toPayrollDecimal(defaults.base),
        allowances: toPayrollDecimal(defaults.allowances),
        currencyCode: APP_DEFAULT_CURRENCY,
        effectiveFrom: start,
      },
      create: {
        employeeId: emp.id,
        baseSalary: toPayrollDecimal(defaults.base),
        allowances: toPayrollDecimal(defaults.allowances),
        currencyCode: APP_DEFAULT_CURRENCY,
        effectiveFrom: start,
      },
    });
  }

  console.log(`  ✅ Seeded compensation for ${employees.length} employees`);

  console.log('  ℹ️ Skipping current-month payroll batch — user must click Run payroll to start');
}
