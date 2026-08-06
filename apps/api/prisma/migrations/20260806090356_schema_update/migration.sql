-- CreateTable
CREATE TABLE "monthly_financial_summaries" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "entryCount" INTEGER NOT NULL DEFAULT 0,
    "totalCredits" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalDebits" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netMovement" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "closingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "pendingReconciliation" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "assetsTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "liabilitiesTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "equityTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "revenueTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "opexTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "capexTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'PKR',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_financial_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_vs_actual" (
    "id" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "actual" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "budget" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "percentage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_vs_actual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monthly_financial_summaries_year_month_idx" ON "monthly_financial_summaries"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_financial_summaries_year_month_key" ON "monthly_financial_summaries"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "budget_vs_actual_categoryKey_key" ON "budget_vs_actual"("categoryKey");
