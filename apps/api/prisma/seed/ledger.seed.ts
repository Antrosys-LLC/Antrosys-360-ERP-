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
  await prisma.monthlyFinancialSummary.deleteMany();
  await prisma.budgetVsActualSnapshot.deleteMany();

  await prisma.companyMetricTarget.deleteMany({
    where: { metricKey: { startsWith: 'ledger.' } },
  });

  const accountsData = [
    { code: '1000', name: 'Assets', budgetAmount: 5000000 },
    { code: '2000', name: 'Liabilities' },
    { code: '3000', name: 'Equity' },
    { code: '4000', name: 'Revenue', budgetAmount: 20000000 },
    { code: '5000', name: 'COGS' },
    { code: '6000', name: 'Expenses', budgetAmount: 5000000 },
    { code: '6100', name: 'Payroll', budgetAmount: 2500000 },
    { code: '6200', name: 'Marketing', budgetAmount: 1000000 },
    { code: '6300', name: 'Operations', budgetAmount: 3000000 },
  ];

  for (const act of accountsData) {
    await prisma.ledgerAccount.create({
      data: { code: act.code, name: act.name, budgetAmount: act.budgetAmount ?? null },
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

  await prisma.budgetVsActualSnapshot.deleteMany();

  const budgetSnapshots = [
    { categoryKey: 'bva.payroll', kind: 'BVA', name: 'Payroll', budget: 2500000 },
    { categoryKey: 'bva.marketing', kind: 'BVA', name: 'Marketing', budget: 1000000 },
    { categoryKey: 'bva.operations', kind: 'BVA', name: 'Operations', budget: 3000000 },
    { categoryKey: 'tracker.revenue_goal', kind: 'TRACKER', name: 'Revenue Goal', budget: 20000000 },
    { categoryKey: 'tracker.opex_limit', kind: 'TRACKER', name: 'Opex Limit', budget: 5000000 },
    { categoryKey: 'tracker.capex', kind: 'TRACKER', name: 'Capex', budget: 5000000 },
  ];

  const debitActuals = await prisma.ledgerEntry.groupBy({
    by: ['accountId'],
    _sum: { amount: true },
    where: { isVoided: false, entryType: 'DEBIT' },
  });
  const creditActuals = await prisma.ledgerEntry.groupBy({
    by: ['accountId'],
    _sum: { amount: true },
    where: { isVoided: false, entryType: 'CREDIT' },
  });
  const accounts = await prisma.ledgerAccount.findMany({ select: { id: true, code: true } });
  const debitByAccount = new Map(debitActuals.map((r) => [r.accountId, Number(r._sum.amount || 0)]));
  const creditByAccount = new Map(creditActuals.map((r) => [r.accountId, Number(r._sum.amount || 0)]));
  const idsByCodePrefix = (prefix: string) =>
    accounts.filter((a) => a.code.startsWith(prefix)).map((a) => a.id);
  const sumByPrefix = (prefix: string, map: Map<string, number>) =>
    idsByCodePrefix(prefix).reduce((acc, id) => acc + (map.get(id) ?? 0), 0);

  const snapshotSources = [
    { key: 'bva.payroll', prefix: '6100', entryType: 'DEBIT' },
    { key: 'bva.marketing', prefix: '6200', entryType: 'DEBIT' },
    { key: 'bva.operations', prefix: '6300', entryType: 'DEBIT' },
    { key: 'tracker.revenue_goal', prefix: '4', entryType: 'CREDIT' },
    { key: 'tracker.opex_limit', prefix: '6', entryType: 'DEBIT' },
    { key: 'tracker.capex', prefix: '1', entryType: 'DEBIT' },
  ];

  for (const spec of budgetSnapshots) {
    const source = snapshotSources.find((s) => s.key === spec.categoryKey);
    const map = source && source.entryType === 'DEBIT' ? debitByAccount : creditByAccount;
    const actual = source ? sumByPrefix(source.prefix, map) : 0;
    const percentage = spec.budget > 0 ? Math.round((actual / spec.budget) * 100) : 0;
    await prisma.budgetVsActualSnapshot.create({
      data: {
        categoryKey: spec.categoryKey,
        kind: spec.kind,
        name: spec.name,
        actual: dec(actual),
        budget: dec(spec.budget),
        percentage,
      },
    });
  }

  console.log('✅ Ledger & Budget seed data created');
}
