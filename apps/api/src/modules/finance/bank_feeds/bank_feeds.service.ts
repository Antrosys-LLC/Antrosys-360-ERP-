import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import type { ListTransactionsQuery } from './bank_feeds.schema';

const transactionInclude = {
  account: {
    select: { id: true, bankName: true, accountType: true, currencyCode: true },
  },
} as const;

export async function listAccounts() {
  const accounts = await prisma.bankAccount.findMany({
    include: {
      _count: { select: { transactions: true } },
      connections: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return accounts.map((a) => ({
    id: a.id,
    bankName: a.bankName,
    accountNumber: maskAccountNumber(a.accountNumber),
    type: a.accountType,
    status: a.status,
    statusVariant: a.status === 'Live' ? 'success' : 'warning',
    currency: a.currencyCode,
    balance: formatCurrency(a.balance),
    lastSynced: formatLastSynced(a.lastSyncedAt),
    canSync: a.isSyncable,
    syncLabel: a.syncLabel ?? undefined,
    connection: a.connections[0]
      ? {
          provider: a.connections[0].provider,
          scheduleType: a.connections[0].scheduleType,
          status: a.connections[0].status,
        }
      : null,
    transactionCount: a._count.transactions,
  }));
}

export async function syncAccount(accountId: string, userId: string) {
  const account = await prisma.bankAccount.findUnique({ where: { id: accountId } });
  if (!account) return null;

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.bankAccount.update({
      where: { id: accountId },
      data: { lastSyncedAt: now, status: 'Live' },
    });

    await tx.bankConnection.upsert({
      where: { accountId },
      create: {
        accountId,
        provider: 'API',
        scheduleType: 'Real-time',
        status: 'ACTIVE',
        lastConnectedAt: now,
      },
      update: {
        status: 'ACTIVE',
        lastConnectedAt: now,
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'BANK_FEED_SYNC',
        metadata: { accountId, accountName: account.bankName },
      },
    });
  });

  return { id: account.id, lastSyncedAt: now };
}

export async function listTransactions(query: ListTransactionsQuery) {
  const where: Prisma.BankTransactionWhereInput = {};

  if (query.tab === 'review') {
    where.confidenceScore = { gte: 1, lt: 95 };
    where.matchStatus = { not: 'MATCHED' };
  } else if (query.tab === 'unmatched') {
    where.confidenceScore = 0;
  }
  if (query.accountId) {
    where.accountId = query.accountId;
  }
  if (query.search) {
    where.OR = [
      { description: { contains: query.search, mode: 'insensitive' } },
      { reference: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.bankTransaction.findMany({
      where,
      include: transactionInclude,
      orderBy: { transactionDate: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.bankTransaction.count({ where }),
  ]);

  const lines = transactions.map((t) => {
    const variant = t.confidenceScore >= 95 ? 'success' : t.confidenceScore > 0 ? 'warning' : 'danger';
    const label = t.confidenceScore >= 95
      ? `${t.confidenceScore}% (Match)`
      : t.confidenceScore > 0
        ? `${t.confidenceScore}% (JE Match)`
        : 'No Match';

    return {
      id: t.id,
      date: formatDate(t.transactionDate),
      description: t.description,
      reference: t.reference ?? '',
      accountTag: t.account.bankName,
      amount: formatSignedAmount(t.amount, t.transactionType),
      type: t.transactionType.toLowerCase() as 'credit' | 'debit',
      confidence: t.confidenceScore,
      confidenceLabel: label,
      confidenceVariant: variant as 'success' | 'warning' | 'danger',
      extraBadge: t.extraBadge ?? undefined,
      subAmountLabel: t.subAmountLabel ?? undefined,
      suggestedMatch: t.matchedEntry
        ? {
            id: t.matchedEntry.ref,
            title: t.matchedEntry.description,
            amount: formatCurrency(t.matchedEntry.amount),
            date: formatDate(t.matchedEntry.date),
            accountInfo: `Acct: ${t.matchedEntry.accountId}`,
            reasons: (t.matchReasons as Array<{ type: string; text: string }> | null) ?? [],
          }
        : t.matchReasons
          ? {
              id: '',
              title: 'Suggested Match',
              amount: formatCurrency(t.amount),
              date: formatDate(t.transactionDate),
              accountInfo: '',
              reasons: t.matchReasons as Array<{ type: string; text: string }>,
            }
          : null,
    };
  });

  return { lines, total, page: query.page, limit: query.limit };
}

export async function getTransaction(id: string) {
  const t = await prisma.bankTransaction.findUnique({
    where: { id },
    include: transactionInclude,
  });
  if (!t) return null;

  const variant = t.confidenceScore >= 95 ? 'success' : t.confidenceScore > 0 ? 'warning' : 'danger';
  const label = t.confidenceScore >= 95
    ? `${t.confidenceScore}% (Match)`
    : t.confidenceScore > 0
      ? `${t.confidenceScore}% (JE Match)`
      : 'No Match';

  return {
    id: t.id,
    date: formatDate(t.transactionDate),
    description: t.description,
    reference: t.reference ?? '',
    accountTag: t.account.bankName,
    amount: formatSignedAmount(t.amount, t.transactionType),
    type: t.transactionType.toLowerCase() as 'credit' | 'debit',
    confidence: t.confidenceScore,
    confidenceLabel: label,
    confidenceVariant: variant,
    extraBadge: t.extraBadge ?? undefined,
    subAmountLabel: t.subAmountLabel ?? undefined,
    matchStatus: t.matchStatus,
    suggestedMatch: t.matchedEntry
      ? {
          id: t.matchedEntry.ref,
          title: t.matchedEntry.description,
          amount: formatCurrency(t.matchedEntry.amount),
          date: formatDate(t.matchedEntry.date),
          accountInfo: `Acct: ${t.matchedEntry.accountId}`,
          reasons: (t.matchReasons as Array<{ type: string; text: string }> | null) ?? [],
        }
      : t.matchReasons
        ? {
            id: '',
            title: 'Suggested Match',
            amount: formatCurrency(t.amount),
            date: formatDate(t.transactionDate),
            accountInfo: '',
            reasons: t.matchReasons as Array<{ type: string; text: string }>,
          }
        : null,
  };
}

export async function confirmMatch(
  transactionId: string,
  entryId: string,
  userId: string,
) {
  const transaction = await prisma.bankTransaction.findUnique({
    where: { id: transactionId },
  });
  if (!transaction) return null;

  await prisma.$transaction(async (tx) => {
    await tx.bankTransaction.update({
      where: { id: transactionId },
      data: {
        matchedEntryId: entryId,
        matchStatus: 'MATCHED',
        confidenceScore: 100,
        matchedById: userId,
        matchedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'BANK_FEED_MATCH_CONFIRMED',
        metadata: { transactionId, entryId },
      },
    });
  });

  return { matched: true };
}

export async function rejectMatch(transactionId: string, userId: string) {
  const transaction = await prisma.bankTransaction.findUnique({
    where: { id: transactionId },
  });
  if (!transaction) return null;

  await prisma.$transaction(async (tx) => {
    await tx.bankTransaction.update({
      where: { id: transactionId },
      data: {
        matchStatus: 'REJECTED',
        matchedById: userId,
        matchedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'BANK_FEED_MATCH_REJECTED',
        metadata: { transactionId },
      },
    });
  });

  return { rejected: true };
}

export async function getReconciliationHealth() {
  const currentPeriod = await prisma.bankReconciliationPeriod.findFirst({
    orderBy: { startDate: 'desc' },
  });

  if (!currentPeriod) {
    const totalLines = await prisma.bankTransaction.count();
    const autoMatched = await prisma.bankTransaction.count({ where: { matchStatus: 'MATCHED' } });
    const needsReview = await prisma.bankTransaction.count({
      where: { confidenceScore: { gte: 1, lt: 95 }, matchStatus: { not: 'MATCHED' } },
    });
    const unmatched = await prisma.bankTransaction.count({ where: { confidenceScore: 0 } });

    const total = totalLines || 1;
    return {
      currentPeriod: 'Current Period',
      totalLines: String(totalLines),
      autoMatched: String(autoMatched),
      needsReview: String(needsReview),
      unmatched: String(unmatched),
      percentages: {
        autoMatched: `${((autoMatched / total) * 100).toFixed(1)}%`,
        pendingReview: `${((needsReview / total) * 100).toFixed(1)}%`,
        requiresAction: `${((unmatched / total) * 100).toFixed(1)}%`,
      },
    };
  }

  const total = currentPeriod.totalLines || 1;
  return {
    currentPeriod: currentPeriod.periodLabel,
    totalLines: String(currentPeriod.totalLines),
    autoMatched: String(currentPeriod.autoMatched),
    needsReview: String(currentPeriod.needsReview),
    unmatched: String(currentPeriod.unmatched),
    percentages: {
      autoMatched: `${((currentPeriod.autoMatched / total) * 100).toFixed(1)}%`,
      pendingReview: `${((currentPeriod.needsReview / total) * 100).toFixed(1)}%`,
      requiresAction: `${((currentPeriod.unmatched / total) * 100).toFixed(1)}%`,
    },
  };
}

export async function getPriorityExceptions() {
  const exceptions = await prisma.bankTransaction.findMany({
    where: { confidenceScore: 0 },
    include: {
      account: { select: { id: true, bankName: true } },
    },
    orderBy: { transactionDate: 'desc' },
    take: 10,
  });

  return exceptions.map((ex) => ({
    id: ex.id,
    date: formatDate(ex.transactionDate),
    bank: ex.account.bankName,
    amount: formatSignedAmount(ex.amount, ex.transactionType),
    description: ex.description,
    hasActions: true,
  }));
}

export async function getConnections() {
  const connections = await prisma.bankConnection.findMany({
    include: {
      account: { select: { bankName: true } },
    },
  });

  if (connections.length === 0) {
    const accounts = await prisma.bankAccount.findMany();
    return accounts.map((a) => ({
      bank: `${a.bankName} (API)`,
      schedule: 'Real-time',
      variant: a.status === 'Delayed' ? 'warning' : 'success',
    }));
  }

  return connections.map((c) => ({
    bank: `${c.account.bankName} (${c.provider})`,
    schedule: c.scheduleType,
    variant: c.status === 'ACTIVE' ? 'success' : c.status === 'DEGRADED' ? 'warning' : 'danger',
  }));
}

export async function connectBank(data: {
  bankName: string;
  accountNumber: string;
  accountType: string;
  currencyCode: string;
  balance: number;
  provider: string;
  scheduleType: string;
}, userId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const account = await tx.bankAccount.create({
      data: {
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        currencyCode: data.currencyCode,
        balance: data.balance,
        isSyncable: true,
      },
    });

    await tx.bankConnection.create({
      data: {
        accountId: account.id,
        provider: data.provider,
        scheduleType: data.scheduleType,
        status: 'ACTIVE',
        lastConnectedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'BANK_FEED_CONNECTED',
        metadata: { accountId: account.id, bankName: data.bankName },
      },
    });

    return account;
  });

  return result;
}

export async function createJournalEntry(transactionId: string, userId: string) {
  const transaction = await prisma.bankTransaction.findUnique({
    where: { id: transactionId },
    include: { account: true },
  });
  if (!transaction) return null;

  const result = await prisma.$transaction(async (tx) => {
    const defaultAccount = await tx.ledgerAccount.findFirst({
      where: transaction.transactionType === 'CREDIT'
        ? { code: '1200' }
        : { code: '5100' },
    });

    const entry = await tx.ledgerEntry.create({
      data: {
        date: transaction.transactionDate,
        ref: `BF-${transaction.id.slice(0, 8)}`,
        description: transaction.description,
        entryType: transaction.transactionType === 'CREDIT' ? 'CREDIT' : 'DEBIT',
        amount: transaction.amount,
        accountId: defaultAccount?.id ?? (await tx.ledgerAccount.findFirst({ where: { isActive: true } }))!.id,
        createdByUserId: userId,
      },
    });

    await tx.bankTransaction.update({
      where: { id: transactionId },
      data: {
        matchedEntryId: entry.id,
        matchStatus: 'MATCHED',
        confidenceScore: 100,
        matchedById: userId,
        matchedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'BANK_FEED_JOURNAL_CREATED',
        metadata: { transactionId, entryId: entry.id },
      },
    });

    return entry;
  });

  return result;
}

// ---- Helpers ----

function maskAccountNumber(num: string): string {
  if (num.length <= 4) return num;
  return `••••••${num.slice(-4)}`;
}

function formatCurrency(value: number | string | Prisma.Decimal): string {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value);
  return n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatSignedAmount(value: number | string | Prisma.Decimal, type: string): string {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value);
  const formatted = n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return type === 'CREDIT' ? `+${formatted}` : `-${formatted}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function formatLastSynced(date: Date | null): string {
  if (!date) return 'Never';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
