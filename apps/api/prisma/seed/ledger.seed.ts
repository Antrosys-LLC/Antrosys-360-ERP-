import { PrismaClient, Prisma } from '@prisma/client';

function dec(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

export async function seedLedgerData(prisma: PrismaClient) {
  console.log('📊 Seeding Ledger & Budget data...');

  const cfoUser = await prisma.user.findUnique({ where: { email: 'cfo@antrosys.com' } });
  
  if (!cfoUser) {
    console.warn('⚠️  Skipping Ledger seed — required users not found');
    return;
  }

  await prisma.ledgerEntry.deleteMany();
  await prisma.ledgerAccount.deleteMany();
  await prisma.ledgerPeriodSummary.deleteMany();

  // We are storing some target targets in CompanyMetricTarget, let's clean them up first
  await prisma.companyMetricTarget.deleteMany({
    where: { metricKey: { startsWith: 'ledger.' } },
  });

  // 1. Chart of Accounts
  const accountsData = [
    { code: '1000', name: 'Assets' },
    { code: '2000', name: 'Liabilities' },
    { code: '3000', name: 'Equity' },
    { code: '4000', name: 'Revenue' },
    { code: '5000', name: 'COGS' },
    { code: '6000', name: 'Expenses' },
    { code: '6100', name: 'Payroll' },
    { code: '6200', name: 'Marketing' },
    { code: '6300', name: 'Operations' },
  ];

  for (const act of accountsData) {
    await prisma.ledgerAccount.create({
      data: {
        code: act.code,
        name: act.name,
      }
    });
  }

  const assetsAcc = await prisma.ledgerAccount.findUnique({ where: { code: '1000' } });
  const liabilitiesAcc = await prisma.ledgerAccount.findUnique({ where: { code: '2000' } });
  const equityAcc = await prisma.ledgerAccount.findUnique({ where: { code: '3000' } });
  const revenueAcc = await prisma.ledgerAccount.findUnique({ where: { code: '4000' } });
  const expensesAcc = await prisma.ledgerAccount.findUnique({ where: { code: '6000' } });
  const operationsAcc = await prisma.ledgerAccount.findUnique({ where: { code: '6300' } });

  if (!assetsAcc || !liabilitiesAcc || !equityAcc || !revenueAcc || !expensesAcc || !operationsAcc) {
    throw new Error('Ledger accounts not found');
  }

  // 3. Period Summary
  await prisma.ledgerPeriodSummary.create({
    data: {
      periodLabel: 'May 2026',
      periodStart: new Date(Date.UTC(currentYear, 4, 1)),
      periodEnd: new Date(Date.UTC(currentYear, 4, 31)),
      openingBalance: dec(14500000),
      currencyCode: 'PKR',
      assetsTotal: dec(150000000), // 150M
      liabilitiesTotal: dec(60000000), // 60M
      equityTotal: dec(90000000), // 90M
    }
  });

  // 4. Budget Trackers and vs Actuals (these values will be driven by calculations in real app, but seeded here initially)
  const periodStart = new Date(Date.UTC(currentYear, 0, 1)); // Jan 1
  const periodEnd = new Date(Date.UTC(currentYear, 11, 31)); // Dec 31
  
  await prisma.companyMetricTarget.createMany({
    data: [
      { metricKey: 'ledger.budget.payroll', label: 'Payroll', periodStart, periodEnd, targetValue: dec(110) },
      { metricKey: 'ledger.budget.marketing', label: 'Marketing', periodStart, periodEnd, targetValue: dec(105) },
      { metricKey: 'ledger.budget.operations', label: 'Operations', periodStart, periodEnd, targetValue: dec(85) },
      
      { metricKey: 'ledger.tracker.revenue_goal', label: 'Revenue Goal', periodStart, periodEnd, targetValue: dec(75) },
      { metricKey: 'ledger.tracker.opex_limit', label: 'Opex Limit', periodStart, periodEnd, targetValue: dec(92) },
      { metricKey: 'ledger.tracker.capex', label: 'Capex', periodStart, periodEnd, targetValue: dec(45) },
    ]
  });

  console.log('✅ Ledger & Budget seed data created');
}
