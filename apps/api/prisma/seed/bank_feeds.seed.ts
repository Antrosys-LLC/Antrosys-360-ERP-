import { PrismaClient, Prisma } from '@prisma/client';

function dec(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

// Dates in May 2024 to match the original mock data
function d(day: number): Date {
  return new Date(Date.UTC(2024, 4, day)); // month 4 = May
}

export async function seedBankFeedsData(prisma: PrismaClient) {
  console.log('🏦 Seeding Bank Feeds data...');

  const cfoUser = await prisma.user.findUnique({ where: { email: 'cfo@antrosys.com' } });
  if (!cfoUser) {
    console.warn('⚠️  Skipping bank_feeds seed — CFO user not found');
    return;
  }

  // Clean existing
  await prisma.bankConnection.deleteMany();
  await prisma.bankTransaction.deleteMany();
  await prisma.bankReconciliationPeriod.deleteMany();
  await prisma.bankAccount.deleteMany();

  // ── Accounts ──────────────────────────────────────────────────────
  const meezan = await prisma.bankAccount.create({
    data: {
      bankName: 'Meezan Bank',
      accountNumber: '12348921',
      accountType: 'Primary',
      currencyCode: 'PKR',
      balance: dec(29481000.00),
      status: 'Live',
      isSyncable: true,
      lastSyncedAt: new Date(Date.now() - 2 * 60 * 1000), // 2m ago
    },
  });

  const hbl = await prisma.bankAccount.create({
    data: {
      bankName: 'HBL',
      accountNumber: '45674432',
      accountType: 'Payroll',
      currencyCode: 'PKR',
      balance: dec(4102550.00),
      status: 'Live',
      isSyncable: true,
      lastSyncedAt: new Date(Date.now() - 15 * 60 * 1000), // 15m ago
    },
  });

  const scb = await prisma.bankAccount.create({
    data: {
      bankName: 'Standard Chartered',
      accountNumber: '99001198',
      accountType: 'Forex',
      currencyCode: 'USD',
      balance: dec(84200.50),
      status: 'Delayed',
      isSyncable: false,
      syncLabel: 'Batch only',
      lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
    },
  });

  console.log(`  ✅ Created ${3} bank accounts`);

  // ── Connections ───────────────────────────────────────────────────
  await prisma.bankConnection.createMany({
    data: [
      {
        accountId: meezan.id,
        provider: 'API',
        scheduleType: 'Real-time',
        status: 'ACTIVE',
        lastConnectedAt: new Date(Date.now() - 2 * 60 * 1000),
      },
      {
        accountId: hbl.id,
        provider: 'API',
        scheduleType: 'Hourly',
        status: 'ACTIVE',
        lastConnectedAt: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        accountId: scb.id,
        provider: 'SFTP',
        scheduleType: 'Daily EOD',
        status: 'DEGRADED',
        lastConnectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('  ✅ Created bank connections');

  // ── Transactions ───────────────────────────────────────────────────
  await prisma.bankTransaction.createMany({
    data: [
      // line-1: Nexus Corp — high confidence, matched
      {
        accountId: meezan.id,
        transactionDate: d(16),
        description: 'Nexus Corp Solutions',
        reference: 'REF: INV-2024-8991',
        amount: dec(42000000.00),
        transactionType: 'CREDIT',
        confidenceScore: 98,
        matchStatus: 'PENDING_REVIEW',
        matchReasons: [
          { type: 'success', text: 'Exact amount match (42,000,000.00)' },
          { type: 'success', text: 'Date matches perfectly within cycle window' },
          { type: 'success', text: 'Customer reference string match' },
        ],
      },
      // line-2: Salaries — medium confidence
      {
        accountId: hbl.id,
        transactionDate: d(15),
        description: 'FT Transfer - Salaries',
        reference: 'REF: SAL-MAY-BATCH1',
        amount: dec(387450.00),
        transactionType: 'DEBIT',
        confidenceScore: 74,
        matchStatus: 'PENDING_REVIEW',
        matchReasons: [
          { type: 'success', text: 'Exact amount match (387,450.00)' },
          { type: 'warning', text: 'Date mismatch (ERP: 14 May, Bank: 15 May)' },
          { type: 'warning', text: 'Fuzzy text match ("Salaries" vs "Payroll")' },
        ],
      },
      // line-3: Stationers — unmatched
      {
        accountId: meezan.id,
        transactionDate: d(14),
        description: 'POS Purchase - Stationers',
        reference: 'CARD: **4921 / LOCAL',
        amount: dec(12400.00),
        transactionType: 'DEBIT',
        confidenceScore: 0,
        matchStatus: 'UNMATCHED',
      },
      // line-4: K-Electric — medium confidence
      {
        accountId: meezan.id,
        transactionDate: d(14),
        description: 'K-Electric Monthly Bill',
        reference: 'REF: UT-2024-09811',
        amount: dec(145290.00),
        transactionType: 'DEBIT',
        confidenceScore: 82,
        matchStatus: 'PENDING_REVIEW',
        matchReasons: [
          { type: 'success', text: 'Exact amount match (145,290.00)' },
          { type: 'success', text: 'Vendor identity matched via automated routing rule' },
        ],
      },
      // line-5: AlphaTech — high confidence
      {
        accountId: hbl.id,
        transactionDate: d(13),
        description: 'Client Deposit: AlphaTech',
        reference: 'REF: DEP-998122',
        amount: dec(1200000.00),
        transactionType: 'CREDIT',
        confidenceScore: 95,
        matchStatus: 'PENDING_REVIEW',
        matchReasons: [
          { type: 'success', text: 'Exact amount match (1,200,000.00)' },
          { type: 'success', text: 'Client profile links directly to origin bank routing' },
        ],
      },
      // line-6: Globex — medium confidence, forex
      {
        accountId: scb.id,
        transactionDate: d(12),
        description: 'INWARD SWIFT: GLOBEX INC',
        reference: 'USD 15,000.00',
        amount: dec(4170000.00),
        transactionType: 'CREDIT',
        extraBadge: 'FX @ 278.0',
        subAmountLabel: 'PKR Eqv',
        confidenceScore: 60,
        matchStatus: 'PENDING_REVIEW',
        matchReasons: [
          { type: 'warning', text: 'Currency valuation cross-checked via basic rate setup' },
          { type: 'warning', text: 'Manual authorization highly suggested' },
        ],
      },
      // line-7: PTCL — unmatched
      {
        accountId: meezan.id,
        transactionDate: d(11),
        description: 'PTCL Broadband',
        reference: 'REF: UT-BB-9912',
        amount: dec(15000.00),
        transactionType: 'DEBIT',
        confidenceScore: 0,
        matchStatus: 'UNMATCHED',
      },
      // line-8: Cash Deposit — unmatched
      {
        accountId: meezan.id,
        transactionDate: d(11),
        description: 'Cash Deposit Branch 042',
        reference: 'REF: CSH-CHQ-1102',
        amount: dec(500000.00),
        transactionType: 'CREDIT',
        confidenceScore: 0,
        matchStatus: 'UNMATCHED',
      },
      // line-9: Daraz — very high confidence
      {
        accountId: hbl.id,
        transactionDate: d(10),
        description: 'Daraz Vendor Payout',
        reference: 'REF: DRZ-RECON-MAY',
        amount: dec(1842100.00),
        transactionType: 'CREDIT',
        confidenceScore: 99,
        matchStatus: 'PENDING_REVIEW',
        matchReasons: [
          { type: 'success', text: 'Automated settlement clearing pattern verified' },
        ],
      },
    ],
  });

  console.log('  ✅ Created 9 bank transactions');

  // ── Reconciliation Period ──────────────────────────────────────────
  await prisma.bankReconciliationPeriod.create({
    data: {
      periodLabel: 'May 1 - May 16, 2024',
      startDate: d(1),
      endDate: d(16),
      totalLines: 1492,
      autoMatched: 1310,
      needsReview: 119,
      unmatched: 63,
    },
  });

  console.log('  ✅ Created reconciliation period');
  console.log('✅ Bank Feeds seed complete');
}
