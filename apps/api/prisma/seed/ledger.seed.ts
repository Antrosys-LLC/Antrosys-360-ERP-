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

  await prisma.companyMetricTarget.deleteMany({
    where: { metricKey: { startsWith: 'ledger.' } },
  });

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
      data: { code: act.code, name: act.name },
    });
  }

  const now = new Date();
  const currentYear = now.getFullYear();

  const summaries = [
    { label: 'May 2026', startMonth: 4, endMonth: 4, opening: 14500000 },
    { label: 'Q2 2026',  startMonth: 3, endMonth: 5, opening: 14000000 },
    { label: 'FY 2026',  startMonth: 0, endMonth: 11, opening: 12000000 },
  ];
  for (const s of summaries) {
    await prisma.ledgerPeriodSummary.create({
      data: {
        periodLabel: s.label,
        periodStart: new Date(Date.UTC(currentYear, s.startMonth, 1)),
        periodEnd: new Date(Date.UTC(currentYear, s.endMonth + 1, 0)),
        openingBalance: dec(s.opening),
        currencyCode: 'PKR',
        assetsTotal: dec(150000000),
        liabilitiesTotal: dec(60000000),
        equityTotal: dec(90000000),
      },
    });
  }

  const periodStart = new Date(Date.UTC(currentYear, 0, 1));
  const periodEnd = new Date(Date.UTC(currentYear, 11, 31));

  await prisma.companyMetricTarget.createMany({
    data: [
      { metricKey: 'ledger.budget.payroll', label: 'Payroll', periodStart, periodEnd, targetValue: dec(110) },
      { metricKey: 'ledger.budget.marketing', label: 'Marketing', periodStart, periodEnd, targetValue: dec(105) },
      { metricKey: 'ledger.budget.operations', label: 'Operations', periodStart, periodEnd, targetValue: dec(85) },
      { metricKey: 'ledger.tracker.revenue_goal', label: 'Revenue Goal', periodStart, periodEnd, targetValue: dec(75) },
      { metricKey: 'ledger.tracker.opex_limit', label: 'Opex Limit', periodStart, periodEnd, targetValue: dec(92) },
      { metricKey: 'ledger.tracker.capex', label: 'Capex', periodStart, periodEnd, targetValue: dec(45) },
    ],
  });

  console.log('✅ Ledger & Budget seed data created');
}
