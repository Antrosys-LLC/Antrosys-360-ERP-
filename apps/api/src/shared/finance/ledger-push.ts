import { Prisma } from '@prisma/client';

type TransactionClient = {
  ledgerAccount: {
    findFirst: (args: { where: { code: string } }) => Promise<{ id: string } | null>;
  };
  ledgerEntry: {
    create: (args: {
      data: {
        date: Date;
        ref: string;
        description: string;
        entryType: 'DEBIT' | 'CREDIT';
        amount: Prisma.Decimal;
        accountId: string;
        currencyCode: string;
        hasFlag?: boolean;
        createdByUserId: string;
      };
    }) => Promise<unknown>;
  };
};

export async function pushLedgerEntry(
  tx: TransactionClient,
  entry: {
    date: Date;
    ref: string;
    description: string;
    entryType: 'DEBIT' | 'CREDIT';
    amount: number;
    accountCode: string;
    currencyCode?: string;
    hasFlag?: boolean;
    createdByUserId: string;
  },
) {
  const account = await tx.ledgerAccount.findFirst({ where: { code: entry.accountCode } });
  if (!account) {
    console.warn(`[ledger-push] Account code ${entry.accountCode} not found — skipping ledger entry`);
    return null;
  }

  return tx.ledgerEntry.create({
    data: {
      date: entry.date,
      ref: entry.ref,
      description: entry.description,
      entryType: entry.entryType,
      amount: new Prisma.Decimal(entry.amount.toFixed(2)),
      accountId: account.id,
      currencyCode: entry.currencyCode ?? 'PKR',
      hasFlag: entry.hasFlag ?? false,
      createdByUserId: entry.createdByUserId,
    },
  });
}
