import { PrismaClient, Prisma } from '@prisma/client';
import { pushLedgerEntry } from '../../src/shared/finance/ledger-push';
import { defaultCompensation, calculatePayrollLine, toPayrollDecimal } from '../../src/shared/payroll/payroll-calc';
import { APP_DEFAULT_CURRENCY } from '../../src/shared/currency/currency-constants';
import { aggregateBudgetVsActual, aggregateMonthlyFinancials } from '../../src/shared/aggregation/aggregate-finance';

function periodStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

function periodEnd(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0));
}

function previousMonth(): { year: number; month: number } {
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1;
  month -= 1;
  if (month <= 0) {
    month = 12;
    year -= 1;
  }
  return { year, month };
}

// Seeds the ledger-backed financial flows that power Biz Intel:
//  1. A fully PAID payroll batch (debits for salaries/taxes/benefits)
//  2. Invoice payments for PAID / PARTIALLY_PAID invoices (AR credits)
//  3. Runs the aggregation pipeline so the aggregated tables are populated
export async function seedFinanceFlowData(prisma: PrismaClient) {
  console.log('💸 Seeding finance flows (payroll disbursement + invoice payments)...');

  const financeManager = await prisma.user.findFirst({
    where: { role: 'FINANCE_MANAGER', isActive: true },
  });
  const userForEntries = financeManager?.id ?? 'system';

  // ── 1. PAID payroll batch for the previous month ─────────────────────────
  const { year: prevYear, month: prevMonth } = previousMonth();
  const batchNumber = `PRL-${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  const existingBatch = await prisma.payroll.findUnique({ where: { batchNumber } });

  if (!existingBatch) {
    const employees = await prisma.employee.findMany({
      where: { isActive: true, employmentStatus: 'ACTIVE' },
      select: { id: true, grade: true },
    });

    const lineItems: Prisma.PayrollLineItemCreateWithoutPayrollInput[] = [];
    for (const emp of employees) {
      const comp = defaultCompensation(emp.grade);
      const calc = calculatePayrollLine(
        { baseSalary: comp.base, allowances: comp.allowances },
        Math.round(comp.base * 0.02),
        0.01,
      );
      lineItems.push({
        employee: { connect: { id: emp.id } },
        baseSalary: toPayrollDecimal(calc.baseSalary),
        allowances: toPayrollDecimal(calc.allowances),
        overtime: toPayrollDecimal(0),
        bonuses: toPayrollDecimal(0),
        grossPay: toPayrollDecimal(calc.grossPay),
        incomeTax: toPayrollDecimal(calc.taxAmount),
        providentFund: toPayrollDecimal(0),
        healthInsurance: toPayrollDecimal(0),
        deductionsTotal: toPayrollDecimal(calc.deductionsTotal),
        taxAmount: toPayrollDecimal(calc.taxAmount),
        netPay: toPayrollDecimal(calc.netPay),
        status: 'VERIFIED',
      });
    }

    if (lineItems.length > 0) {
      const grossTotal = lineItems.reduce((acc, l) => acc + Number(l.grossPay), 0);
      const netTotal = lineItems.reduce((acc, l) => acc + Number(l.netPay), 0);
      const deductionsTotal = lineItems.reduce((acc, l) => acc + Number(l.deductionsTotal), 0);
      const start = periodStart(prevYear, prevMonth);
      const end = periodEnd(prevYear, prevMonth);

      const payroll = await prisma.$transaction(async (tx) => {
        const batch = await tx.payroll.create({
          data: {
            batchNumber,
            periodStart: start,
            periodEnd: end,
            totalGross: toPayrollDecimal(grossTotal),
            totalNet: toPayrollDecimal(netTotal),
            totalDeductions: toPayrollDecimal(deductionsTotal),
            taxWithheld: toPayrollDecimal(lineItems.reduce((acc, l) => acc + Number(l.taxAmount), 0)),
            employerLiability: toPayrollDecimal(0),
            employeeCount: lineItems.length,
            currencyCode: APP_DEFAULT_CURRENCY,
            lifecycleStep: 'DISBURSEMENT',
            generationProgress: 100,
            status: 'PAID',
            submittedByUserId: financeManager?.id ?? null,
            approvedByUserId: financeManager?.id ?? null,
            approvedAt: end,
            paidAt: end,
            lineItems: { create: lineItems },
          },
        });

        await pushLedgerEntry(tx as any, {
          date: end,
          ref: batchNumber,
          description: `Payroll disbursement (${lineItems.length} staff) - ${batchNumber}`,
          entryType: 'DEBIT',
          amount: grossTotal,
          accountCode: '6100',
          currencyCode: APP_DEFAULT_CURRENCY,
          createdByUserId: userForEntries,
        });

        await pushLedgerEntry(tx as any, {
          date: end,
          ref: batchNumber,
          description: `Payroll net payout (${lineItems.length} staff) - ${batchNumber}`,
          entryType: 'CREDIT',
          amount: netTotal,
          accountCode: '1000',
          currencyCode: APP_DEFAULT_CURRENCY,
          createdByUserId: userForEntries,
        });

        if (deductionsTotal > 0) {
          await pushLedgerEntry(tx as any, {
            date: end,
            ref: batchNumber,
            description: `Payroll deductions & taxes (${lineItems.length} staff) - ${batchNumber}`,
            entryType: 'CREDIT',
            amount: deductionsTotal,
            accountCode: '2000',
            currencyCode: APP_DEFAULT_CURRENCY,
            createdByUserId: userForEntries,
          });
        }

        return batch;
      });

      console.log(`  ✅ Created PAID payroll batch ${batchNumber} (${lineItems.length} staff)`);
      void payroll;
    }
  } else {
    console.log(`  ℹ️ Payroll batch ${batchNumber} already exists`);
  }

  // ── 2. Invoice payments for PAID / PARTIALLY_PAID invoices ──────────────
  const invoices = await prisma.invoice.findMany({
    where: { status: { in: ['PAID', 'PARTIALLY_PAID'] } },
    select: {
      id: true,
      invoiceNumber: true,
      invoiceDate: true,
      totalDue: true,
      currencyCode: true,
      status: true,
    },
  });

  let paymentCount = 0;
  for (const invoice of invoices) {
    const existingPayment = await prisma.invoicePayment.findFirst({
      where: { invoiceId: invoice.id },
    });
    if (existingPayment) continue;

    const amount = invoice.status === 'PAID'
      ? Number(invoice.totalDue)
      : Math.round(Number(invoice.totalDue) * 0.6 * 100) / 100;
    const hasFlag = invoice.status === 'PARTIALLY_PAID';

    await prisma.$transaction(async (tx) => {
      await tx.invoicePayment.create({
        data: {
          invoiceId: invoice.id,
          amount: new Prisma.Decimal(amount.toFixed(2)),
          paidAt: invoice.invoiceDate,
          paymentMethod: 'BANK_TRANSFER',
          reference: `PMT-${invoice.invoiceNumber}`,
          createdByUserId: userForEntries,
        },
      });

      await pushLedgerEntry(tx as any, {
        date: invoice.invoiceDate,
        ref: invoice.invoiceNumber,
        description: `Client payment - ${invoice.invoiceNumber}`,
        entryType: 'CREDIT',
        amount,
        accountCode: '4000',
        currencyCode: invoice.currencyCode,
        hasFlag,
        createdByUserId: userForEntries,
      });

      await pushLedgerEntry(tx as any, {
        date: invoice.invoiceDate,
        ref: invoice.invoiceNumber,
        description: `Payment received - ${invoice.invoiceNumber}`,
        entryType: 'DEBIT',
        amount,
        accountCode: '1000',
        currencyCode: invoice.currencyCode,
        hasFlag,
        createdByUserId: userForEntries,
      });
    });

    paymentCount += 1;
  }

  if (paymentCount > 0) {
    console.log(`  ✅ Recorded payments for ${paymentCount} invoice(s)`);
  }

  // ── 3. Run the aggregation pipeline so BI reads real aggregated data ─────
  const [monthly, budget] = await Promise.all([
    aggregateMonthlyFinancials(),
    aggregateBudgetVsActual(),
  ]);
  console.log(`  ✅ Aggregation complete (${monthly.months} monthly summaries, ${budget.categories} budget snapshots)`);

  console.log('✅ Finance flow seed complete');
}
