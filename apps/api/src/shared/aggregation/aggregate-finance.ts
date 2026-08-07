import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

const BVA_CATEGORIES = [
  { key: 'bva.payroll', name: 'Payroll', codePrefix: '6100' },
  { key: 'bva.marketing', name: 'Marketing', codePrefix: '6200' },
  { key: 'bva.operations', name: 'Operations', codePrefix: '6300' },
] as const;

const TRACKER_CATEGORIES = [
  { key: 'tracker.revenue_goal', name: 'Revenue Goal', codePrefix: '4', budgetCode: '4000', entryType: 'CREDIT' as const },
  { key: 'tracker.opex_limit', name: 'Opex Limit', codePrefix: '6', budgetCode: '6000', entryType: 'DEBIT' as const },
  { key: 'tracker.capex', name: 'Capex', codePrefix: '1', budgetCode: '1000', entryType: 'DEBIT' as const },
] as const;

function periodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function toNumber(value: Prisma.Decimal | bigint | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  return value.toNumber();
}

function monthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

async function loadAccountPrefixes() {
  const accounts = await prisma.ledgerAccount.findMany({ select: { id: true, code: true } });
  const byPrefix = new Map<string, string[]>();
  for (const account of accounts) {
    for (let len = 1; len <= account.code.length; len += 1) {
      const prefix = account.code.slice(0, len);
      const list = byPrefix.get(prefix) ?? [];
      list.push(account.id);
      byPrefix.set(prefix, list);
    }
  }
  const idsByPrefix = (prefix: string) => byPrefix.get(prefix) ?? [];
  return { idsByPrefix };
}

export async function aggregateMonthlyFinancials(monthsBack = 12) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { idsByPrefix } = await loadAccountPrefixes();

  let upserted = 0;

  for (let i = monthsBack; i >= 0; i -= 1) {
    const target = new Date(currentYear, currentMonth - 1 - i, 1);
    const year = target.getFullYear();
    const month = target.getMonth() + 1;
    const { start, end } = monthRange(year, month);

    const creditResult = await prisma.ledgerEntry.groupBy({
      by: ['accountId'],
      _sum: { amount: true },
      where: { isVoided: false, entryType: 'CREDIT', date: { gte: start, lte: end } },
    });
    const debitResult = await prisma.ledgerEntry.groupBy({
      by: ['accountId'],
      _sum: { amount: true },
      where: { isVoided: false, entryType: 'DEBIT', date: { gte: start, lte: end } },
    });

    const creditByAccount = new Map(creditResult.map((r) => [r.accountId, toNumber(r._sum.amount)]));
    const debitByAccount = new Map(debitResult.map((r) => [r.accountId, toNumber(r._sum.amount)]));

    const sumCreditFor = (prefix: string) =>
      idsByPrefix(prefix).reduce((acc, id) => acc + (creditByAccount.get(id) ?? 0), 0);
    const sumDebitFor = (prefix: string) =>
      idsByPrefix(prefix).reduce((acc, id) => acc + (debitByAccount.get(id) ?? 0), 0);

    const totalCredits = toNumber(creditResult.reduce((acc, r) => acc + toNumber(r._sum.amount), 0));
    const totalDebits = toNumber(debitResult.reduce((acc, r) => acc + toNumber(r._sum.amount), 0));

    const entryCount = await prisma.ledgerEntry.count({
      where: { isVoided: false, date: { gte: start, lte: end } },
    });

    if (entryCount === 0) continue;

    const pendingResult = await prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { isVoided: false, hasFlag: true, date: { gte: start, lte: end } },
    });
    const pendingReconciliation = toNumber(pendingResult._sum.amount);

    const assetsTotal = sumDebitFor('1') - sumCreditFor('1');
    const liabilitiesTotal = sumCreditFor('2') - sumDebitFor('2');
    const revenueTotal = sumCreditFor('4') - sumDebitFor('4');
    const opexTotal = sumDebitFor('6') - sumCreditFor('6');
    const capexTotal = sumDebitFor('1');
    const payrollTotal = sumDebitFor('6100');
    const equityTotal = sumCreditFor('3') - sumDebitFor('3') + revenueTotal - opexTotal;

    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;
    const previous = await prisma.monthlyFinancialSummary.findUnique({
      where: { year_month: { year: prevYear, month: prevMonth } },
    });
    const openingBalance = previous ? toNumber(previous.closingBalance) : 0;

    const netMovement = totalCredits - totalDebits;
    const closingBalance = openingBalance + netMovement;

    await prisma.monthlyFinancialSummary.upsert({
      where: { year_month: { year, month } },
      create: {
        year,
        month,
        entryCount,
        totalCredits,
        totalDebits,
        netMovement,
        closingBalance,
        pendingReconciliation,
        assetsTotal,
        liabilitiesTotal,
        equityTotal,
        revenueTotal,
        opexTotal,
        capexTotal,
        payrollTotal,
        computedAt: new Date(),
      },
      update: {
        entryCount,
        totalCredits,
        totalDebits,
        netMovement,
        closingBalance,
        pendingReconciliation,
        assetsTotal,
        liabilitiesTotal,
        equityTotal,
        revenueTotal,
        opexTotal,
        capexTotal,
        payrollTotal,
        computedAt: new Date(),
      },
    });

    upserted += 1;
  }

  return { months: upserted };
}

export async function aggregateBudgetVsActual(monthsBack = 12) {
  const [accounts] = await Promise.all([
    prisma.ledgerAccount.findMany({ select: { id: true, code: true, budgetAmount: true } }),
  ]);

  const accountsByCode = new Map(accounts.map((a) => [a.code, a]));

  const getBudgetFor = (codePrefix: string) => {
    const exact = accountsByCode.get(codePrefix);
    if (exact?.budgetAmount) return toNumber(exact.budgetAmount);
    return [...accountsByCode.entries()]
      .filter(([code]) => code.startsWith(codePrefix))
      .reduce((acc, [, account]) => acc + toNumber(account.budgetAmount), 0);
  };

  const getActualFor = (
    debitByAccount: Map<string, number>,
    creditByAccount: Map<string, number>,
    codePrefix: string,
    entryType: 'DEBIT' | 'CREDIT',
  ) => {
    const map = entryType === 'DEBIT' ? debitByAccount : creditByAccount;
    return [...accountsByCode.entries()]
      .filter(([code]) => code.startsWith(codePrefix))
      .reduce((acc, [, account]) => acc + (map.get(account.id) ?? 0), 0);
  };

  const writeSnapshot = async (
    period: string,
    category: (typeof BVA_CATEGORIES)[number],
    debitByAccount: Map<string, number>,
    creditByAccount: Map<string, number>,
  ) => {
    const actual = getActualFor(debitByAccount, creditByAccount, category.codePrefix, 'DEBIT');
    const budget = getBudgetFor(category.codePrefix);
    const percentage = budget > 0 ? Math.round((actual / budget) * 100) : 0;
    if (actual <= 0) return false;
    await prisma.budgetVsActualSnapshot.upsert({
      where: { categoryKey_period: { categoryKey: category.key, period } },
      create: {
        categoryKey: category.key,
        kind: 'BVA',
        name: category.name,
        actual,
        budget,
        percentage,
        period,
      },
      update: { actual, budget, percentage },
    });
    return true;
  };

  const writeTracker = async (
    period: string,
    category: (typeof TRACKER_CATEGORIES)[number],
    debitByAccount: Map<string, number>,
    creditByAccount: Map<string, number>,
  ) => {
    const actual = getActualFor(debitByAccount, creditByAccount, category.codePrefix, category.entryType);
    const budget = getBudgetFor(category.budgetCode);
    const percentage = budget > 0 ? Math.round((actual / budget) * 100) : 0;
    if (actual <= 0) return false;
    await prisma.budgetVsActualSnapshot.upsert({
      where: { categoryKey_period: { categoryKey: category.key, period } },
      create: {
        categoryKey: category.key,
        kind: 'TRACKER',
        name: category.name,
        actual,
        budget,
        percentage,
        period,
      },
      update: { actual, budget, percentage },
    });
    return true;
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  let updated = 0;
  let latestDebitByAccount = new Map<string, number>();
  let latestCreditByAccount = new Map<string, number>();

  for (let i = monthsBack; i >= 0; i -= 1) {
    const target = new Date(currentYear, currentMonth - 1 - i, 1);
    const year = target.getFullYear();
    const month = target.getMonth() + 1;
    const { start, end } = monthRange(year, month);

    const [debitResult, creditResult] = await Promise.all([
      prisma.ledgerEntry.groupBy({
        by: ['accountId'],
        _sum: { amount: true },
        where: { isVoided: false, entryType: 'DEBIT', date: { gte: start, lte: end } },
      }),
      prisma.ledgerEntry.groupBy({
        by: ['accountId'],
        _sum: { amount: true },
        where: { isVoided: false, entryType: 'CREDIT', date: { gte: start, lte: end } },
      }),
    ]);

    const debitByAccount = new Map(debitResult.map((r) => [r.accountId, toNumber(r._sum.amount)]));
    const creditByAccount = new Map(creditResult.map((r) => [r.accountId, toNumber(r._sum.amount)]));
    const period = periodKey(year, month);

    if (i === 0) {
      latestDebitByAccount = debitByAccount;
      latestCreditByAccount = creditByAccount;
    }

    for (const category of BVA_CATEGORIES) {
      if (await writeSnapshot(period, category, debitByAccount, creditByAccount)) updated += 1;
    }
    for (const category of TRACKER_CATEGORIES) {
      if (await writeTracker(period, category, debitByAccount, creditByAccount)) updated += 1;
    }
  }

  // Keep the "current" alias pointing at the latest month so the Ledger
  // dashboard reads stay compatible with the previous snapshot semantics.
  for (const category of BVA_CATEGORIES) {
    if (await writeSnapshot('current', category, latestDebitByAccount, latestCreditByAccount)) updated += 1;
  }
  for (const category of TRACKER_CATEGORIES) {
    if (await writeTracker('current', category, latestDebitByAccount, latestCreditByAccount)) updated += 1;
  }

  return { categories: updated };
}
