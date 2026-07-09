-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    "balance" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Live',
    "isSyncable" BOOLEAN NOT NULL DEFAULT true,
    "syncLabel" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "transactionDate" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "amount" DECIMAL(16,2) NOT NULL,
    "transactionType" TEXT NOT NULL,
    "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    "extraBadge" TEXT,
    "subAmountLabel" TEXT,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "matchStatus" TEXT NOT NULL DEFAULT 'UNMATCHED',
    "matchReasons" JSONB,
    "matchedEntryId" TEXT,
    "matchedById" TEXT,
    "matchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_reconciliation_periods" (
    "id" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "totalLines" INTEGER NOT NULL DEFAULT 0,
    "autoMatched" INTEGER NOT NULL DEFAULT 0,
    "needsReview" INTEGER NOT NULL DEFAULT 0,
    "unmatched" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_reconciliation_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_connections" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "scheduleType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastConnectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_transactions_accountId_idx" ON "bank_transactions"("accountId");

-- CreateIndex
CREATE INDEX "bank_transactions_transactionDate_idx" ON "bank_transactions"("transactionDate");

-- CreateIndex
CREATE INDEX "bank_transactions_matchStatus_idx" ON "bank_transactions"("matchStatus");

-- CreateIndex
CREATE INDEX "bank_transactions_confidenceScore_idx" ON "bank_transactions"("confidenceScore");

-- CreateIndex
CREATE UNIQUE INDEX "bank_reconciliation_periods_periodLabel_key" ON "bank_reconciliation_periods"("periodLabel");

-- CreateIndex
CREATE UNIQUE INDEX "bank_connections_accountId_key" ON "bank_connections"("accountId");

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_matchedEntryId_fkey" FOREIGN KEY ("matchedEntryId") REFERENCES "ledger_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
