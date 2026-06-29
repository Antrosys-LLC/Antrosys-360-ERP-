import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import type {
  CreateLedgerEntryBody,
  ListLedgerEntriesQuery,
  UpdateLedgerEntryBody,
} from './ledger.schema';

type MutationAction = 'LEDGER_ENTRY_CREATE' | 'LEDGER_ENTRY_UPDATE' | 'LEDGER_ENTRY_VOID';

function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

async function writeAuditLog(
  tx: Prisma.TransactionClient,
  userId: string,
  action: MutationAction,
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

/**
 * Calculates current period totals from DB directly if LedgerPeriodSummary is not enough or doesn't exist
 */
async function computePeriodMetrics(periodStart: Date, periodEnd: Date) {
  const result = await prisma.ledgerEntry.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      date: {
        gte: periodStart,
        lte: periodEnd,
      },
      isVoided: false,
      entryType: 'CREDIT',
    },
  });

  const creditTotal = Number(result._sum.amount || 0);

  const resultDebit = await prisma.ledgerEntry.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      date: {
        gte: periodStart,
        lte: periodEnd,
      },
      isVoided: false,
      entryType: 'DEBIT',
    },
  });

  const debitTotal = Number(resultDebit._sum.amount || 0);

  // calculate pending reconciliation
  const resultPending = await prisma.ledgerEntry.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      date: {
        gte: periodStart,
        lte: periodEnd,
      },
      isVoided: false,
      hasFlag: true,
    },
  });
  
  const pendingTotal = Number(resultPending._sum.amount || 0);

  return {
    creditTotal,
    debitTotal,
    pendingTotal,
  };
}

/**
 * Resolves any period string into { start, end } Date objects.
 * Handles: "May 2026", "June 2026", "YYYY-MM", "Today", "This week",
 *          "Q1/Q2/Q3/Q4 YYYY", "FY YYYY"
 */
function parsePeriodToDates(periodLabel: string): { start: Date; end: Date } | null {
  const now = new Date();

  if (periodLabel === 'Today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  if (periodLabel === 'This week') {
    const day = now.getDay(); // 0=Sun
    const start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0,0,0,0);
    const end   = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
    return { start, end };
  }

  // "Q1 2026" / "Q2 2026" etc.
  const qMatch = periodLabel.match(/^Q([1-4])\s+(\d{4})$/);
  if (qMatch) {
    const q = parseInt(qMatch[1]);
    const yr = parseInt(qMatch[2]);
    const startMonth = (q - 1) * 3;
    const start = new Date(yr, startMonth, 1);
    const end   = new Date(yr, startMonth + 3, 0, 23, 59, 59, 999);
    return { start, end };
  }

  // "FY 2026"
  const fyMatch = periodLabel.match(/^FY\s+(\d{4})$/);
  if (fyMatch) {
    const yr = parseInt(fyMatch[1]);
    const start = new Date(yr, 0, 1);
    const end   = new Date(yr, 11, 31, 23, 59, 59, 999);
    return { start, end };
  }

  // "YYYY-MM" (from month input)
  const ymMatch = periodLabel.match(/^(\d{4})-(\d{2})$/);
  if (ymMatch) {
    const yr = parseInt(ymMatch[1]);
    const mo = parseInt(ymMatch[2]) - 1;
    const start = new Date(yr, mo, 1);
    const end   = new Date(yr, mo + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  // "May 2026", "June 2026", etc. (long month name + year)
  const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const mnMatch = periodLabel.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (mnMatch) {
    const moIdx = monthNames.indexOf(mnMatch[1].toLowerCase());
    if (moIdx !== -1) {
      const yr = parseInt(mnMatch[2]);
      const start = new Date(yr, moIdx, 1);
      const end   = new Date(yr, moIdx + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
  }

  return null;
}

export async function getLedgerSummary(periodLabel: string) {
  // First try to get a seeded summary record
  const summary = await prisma.ledgerPeriodSummary.findUnique({
    where: { periodLabel },
  });

  // Resolve date range — prefer seeded record, fall back to parsing
  const range = summary
    ? { start: summary.periodStart, end: summary.periodEnd }
    : parsePeriodToDates(periodLabel);

  if (!range) return null;

  const metrics = await computePeriodMetrics(range.start, range.end);

  const openingBalance = summary ? Number(summary.openingBalance) : 0;
  const netMovement = metrics.creditTotal - metrics.debitTotal;
  const closingBalance = openingBalance + netMovement;

  return {
    openingBalance,
    totalCredits: metrics.creditTotal,
    totalDebits: metrics.debitTotal,
    netMovement,
    closingBalance,
    currencyCode: summary?.currencyCode ?? 'PKR',
    pendingReconciliation: metrics.pendingTotal,
  };
}

export async function listLedgerEntries(query: ListLedgerEntriesQuery) {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const where: Prisma.LedgerEntryWhereInput = {};

  if (query.period) {
    // Try seeded summary first, then parse
    const summary = await prisma.ledgerPeriodSummary.findUnique({
      where: { periodLabel: query.period },
    });
    const range = summary
      ? { start: summary.periodStart, end: summary.periodEnd }
      : parsePeriodToDates(query.period);

    if (range) {
      where.date = { gte: range.start, lte: range.end };
    }
  }

  if (query.accountId) where.accountId = query.accountId;
  if (query.isVoided !== undefined) where.isVoided = query.isVoided;
  if (query.hasFlag !== undefined) where.hasFlag = query.hasFlag;
  if (query.search) {
    where.OR = [
      { ref: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, entries] = await prisma.$transaction([
    prisma.ledgerEntry.count({ where }),
    prisma.ledgerEntry.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: { account: true },
    }),
  ]);

  return {
    items: entries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getLedgerEntryById(entryId: string) {
  return prisma.ledgerEntry.findUnique({
    where: { id: entryId },
    include: { account: true },
  });
}

export async function createLedgerEntry(payload: CreateLedgerEntryBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.ledgerEntry.create({
      data: {
        date: payload.date,
        ref: payload.ref,
        description: payload.description,
        entryType: payload.entryType,
        amount: toDecimal(payload.amount),
        accountId: payload.accountId,
        currencyCode: payload.currencyCode.toUpperCase(),
        hasFlag: payload.hasFlag,
        createdByUserId: userId,
      },
      include: { account: true },
    });

    await writeAuditLog(tx, userId, 'LEDGER_ENTRY_CREATE', {
      entryId: created.id,
      ref: created.ref,
      amount: payload.amount,
      type: created.entryType,
    });

    return created;
  });
}

export async function updateLedgerEntry(entryId: string, payload: UpdateLedgerEntryBody, userId: string) {
  const current = await prisma.ledgerEntry.findUnique({ where: { id: entryId } });
  if (!current) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.ledgerEntry.update({
      where: { id: entryId },
      data: {
        ...(payload.date ? { date: payload.date } : {}),
        ...(payload.ref ? { ref: payload.ref } : {}),
        ...(payload.description ? { description: payload.description } : {}),
        ...(payload.entryType ? { entryType: payload.entryType } : {}),
        ...(payload.amount !== undefined ? { amount: toDecimal(payload.amount) } : {}),
        ...(payload.accountId ? { accountId: payload.accountId } : {}),
        ...(payload.currencyCode ? { currencyCode: payload.currencyCode.toUpperCase() } : {}),
        ...(payload.hasFlag !== undefined ? { hasFlag: payload.hasFlag } : {}),
        ...(payload.isVoided !== undefined ? { isVoided: payload.isVoided } : {}),
      },
      include: { account: true },
    });

    await writeAuditLog(tx, userId, 'LEDGER_ENTRY_UPDATE', {
      entryId,
      hasFlag: updated.hasFlag,
    });

    return updated;
  });
}

export async function voidLedgerEntry(entryId: string, userId: string, reason: string) {
  const current = await prisma.ledgerEntry.findUnique({ where: { id: entryId } });
  if (!current) return null;
  if (current.isVoided) throw new Error('Entry is already voided');

  return prisma.$transaction(async (tx) => {
    const voided = await tx.ledgerEntry.update({
      where: { id: entryId },
      data: {
        isVoided: true,
        voidedAt: new Date(),
        voidedByUserId: userId,
      },
      include: { account: true },
    });

    await writeAuditLog(tx, userId, 'LEDGER_ENTRY_VOID', {
      entryId,
      reason,
    });

    return voided;
  });
}

export async function getBudgetVsActual() {
  // Query all active entries to calculate actuals
  const actuals = await prisma.ledgerEntry.groupBy({
    by: ['accountId'],
    _sum: { amount: true },
    where: { isVoided: false, entryType: 'DEBIT' }
  });

  // Helper to get sum for an account code prefix
  const getSum = async (codeStartsWith: string) => {
    const accounts = await prisma.ledgerAccount.findMany({
      where: { code: { startsWith: codeStartsWith } }
    });
    const ids = accounts.map(a => a.id);
    return actuals.filter(a => ids.includes(a.accountId)).reduce((acc, curr) => acc + Number(curr._sum.amount || 0), 0);
  };

  const payrollActual = await getSum('6100');
  const marketingActual = await getSum('6200');
  const opsActual = await getSum('6300');

  // Hardcoded budgets for demonstration of calculation 
  // (In a full app, these would be pulled from LedgerAccount.budgetAmount)
  const payrollBudget = 2500000;
  const marketingBudget = 1000000;
  const opsBudget = 3000000;

  const data = [
    { name: 'Payroll', actual: payrollActual, budget: payrollBudget },
    { name: 'Marketing', actual: marketingActual, budget: marketingBudget },
    { name: 'Operations', actual: opsActual, budget: opsBudget },
  ];

  return data.map((item, index) => {
    const percentage = item.budget > 0 ? Math.round((item.actual / item.budget) * 100) : 0;
    return {
      id: String(index + 1),
      name: item.name,
      percentage,
      color: percentage > 100 ? 'bg-destructive' : 'bg-primary',
      labelColor: percentage > 100 ? 'text-destructive' : 'text-primary',
    };
  });
}

export async function getBudgetTrackers() {
  // Compute sums directly from entries
  const actualsDebit = await prisma.ledgerEntry.groupBy({
    by: ['accountId'],
    _sum: { amount: true },
    where: { isVoided: false, entryType: 'DEBIT' }
  });
  const actualsCredit = await prisma.ledgerEntry.groupBy({
    by: ['accountId'],
    _sum: { amount: true },
    where: { isVoided: false, entryType: 'CREDIT' }
  });

  const getSum = async (codeStartsWith: string, type: 'DEBIT' | 'CREDIT') => {
    const accounts = await prisma.ledgerAccount.findMany({
      where: { code: { startsWith: codeStartsWith } }
    });
    const ids = accounts.map(a => a.id);
    const actuals = type === 'DEBIT' ? actualsDebit : actualsCredit;
    return actuals.filter(a => ids.includes(a.accountId)).reduce((acc, curr) => acc + Number(curr._sum.amount || 0), 0);
  };

  const revenueActual = await getSum('4', 'CREDIT'); // Revenue
  const opexActual = await getSum('6', 'DEBIT'); // Expenses
  const capexActual = await getSum('1', 'DEBIT'); // Assets

  const revenueGoal = 20000000;
  const opexLimit = 5000000;
  const capexBudget = 5000000;

  const data = [
    { label: 'Revenue Goal', percentage: Math.round((revenueActual / revenueGoal) * 100) },
    { label: 'Opex Limit', percentage: Math.round((opexActual / opexLimit) * 100) },
    { label: 'Capex', percentage: Math.round((capexActual / capexBudget) * 100) },
  ];

  return data.map((item, index) => {
    let strokeColor = 'stroke-primary';
    if (item.percentage > 90) strokeColor = 'stroke-destructive';
    if (item.percentage < 50) strokeColor = 'stroke-primary opacity-60';
    
    return {
      id: String(index + 1),
      label: item.label,
      percentage: item.percentage,
      strokeColor,
    };
  });
}

export async function getMonthlyTrend(periodStr: string) {
  // Determine target month from period string (e.g. "May 2026", "2026-05")
  let targetDate = new Date();
  if (periodStr.match(/^\d{4}-\d{2}$/)) {
    targetDate = new Date(periodStr + '-01');
  } else if (periodStr === 'May 2026') {
    targetDate = new Date('2026-05-01');
  }

  const months = [];
  // Get last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(targetDate.getFullYear(), targetDate.getMonth() - i, 1);
    months.push(d);
  }

  const results = [];
  let maxVal = 0;

  for (const date of months) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    const credits = await prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { isVoided: false, entryType: 'CREDIT', date: { gte: startOfMonth, lte: endOfMonth } }
    });

    const debits = await prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { isVoided: false, entryType: 'DEBIT', date: { gte: startOfMonth, lte: endOfMonth } }
    });

    const creditTotal = Number(credits._sum.amount || 0);
    const debitTotal = Number(debits._sum.amount || 0);
    
    if (creditTotal > maxVal) maxVal = creditTotal;
    if (debitTotal > maxVal) maxVal = debitTotal;

    const monthStr = date.toLocaleString('default', { month: 'short' });
    results.push({ month: monthStr, creditTotal, debitTotal });
  }

  // Calculate percentage heights (min 5% so bar is visible if 0, max 100%)
  return results.map(r => {
    const creditPct = maxVal > 0 ? Math.max(5, Math.round((r.creditTotal / maxVal) * 100)) : 5;
    const debitPct = maxVal > 0 ? Math.max(5, Math.round((r.debitTotal / maxVal) * 100)) : 5;
    return {
      month: r.month,
      creditHeight: `${creditPct}%`,
      debitHeight: `${debitPct}%`,
    };
  });
}

export async function getChartOfAccounts() {
  const accounts = await prisma.ledgerAccount.findMany({
    orderBy: { code: 'asc' },
  });

  return accounts.map(a => ({
    id: a.id,
    code: a.code,
    name: a.name,
  }));
}

export async function getAccountingEquation(periodLabel: string) {
  // Use cumulative balance (all entries up to period end for balance sheet items)
  const range = parsePeriodToDates(periodLabel);
  const cumulativeDate = range ? { lte: range.end } : undefined;

  // Helper: aggregate entry amounts for accounts matching a code prefix
  const sumByPrefix = async (prefix: string, entryType: 'DEBIT' | 'CREDIT') => {
    const accounts = await prisma.ledgerAccount.findMany({
      where: { code: { startsWith: prefix } },
    });
    const ids = accounts.map(a => a.id);
    if (!ids.length) return 0;
    const result = await prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: {
        accountId: { in: ids },
        entryType,
        isVoided: false,
        ...(cumulativeDate ? { date: cumulativeDate } : {}),
      },
    });
    return Number(result._sum.amount || 0);
  };

  // Double-entry accounting rules:
  // Assets (1xxx)      → increased by DEBIT, decreased by CREDIT
  // Liabilities (2xxx) → increased by CREDIT, decreased by DEBIT
  // Equity (3xxx)      → increased by CREDIT, decreased by DEBIT
  // Revenue (4xxx)     → increases equity (CREDIT)
  // Expenses (6xxx)    → decreases equity (DEBIT)
  const assetDr    = await sumByPrefix('1', 'DEBIT');
  const assetCr    = await sumByPrefix('1', 'CREDIT');
  const liabCr     = await sumByPrefix('2', 'CREDIT');
  const liabDr     = await sumByPrefix('2', 'DEBIT');
  const equityCr   = await sumByPrefix('3', 'CREDIT');
  const equityDr   = await sumByPrefix('3', 'DEBIT');
  const revenueCr  = await sumByPrefix('4', 'CREDIT');
  const revenueDr  = await sumByPrefix('4', 'DEBIT');
  const expenseDr  = await sumByPrefix('6', 'DEBIT');
  const expenseCr  = await sumByPrefix('6', 'CREDIT');

  const assets      = assetDr - assetCr;
  const liabilities = liabCr  - liabDr;
  const equity      = (equityCr - equityDr) + (revenueCr - revenueDr) - (expenseDr - expenseCr);

  // Assets = Liabilities + Equity (allow ±1 rounding tolerance)
  const isBalanced = Math.abs(assets - (liabilities + equity)) < 1;

  return {
    assets:      Math.round(assets),
    liabilities: Math.round(liabilities),
    equity:      Math.round(equity),
    isBalanced,
  };
}

